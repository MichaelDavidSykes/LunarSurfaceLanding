import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { InteractiveGlobeComponent } from '../interactive-globe/interactive-globe.component';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GlobalSnackbarService } from '../shared/global-snackbar/global-snackbar.service';
import { environment } from '../../environments/environment';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subscription } from 'rxjs';

declare var google: any;

interface FeatureCard {
  title: string;
  summary: string;
  details: string;
}

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(InteractiveGlobeComponent) globeComp?: InteractiveGlobeComponent;
  selectedCountry: string | null = null;
  selectedCountryCode: string | null = null;
  selectedCountryIocs: Array<any> = [];
  selectedCountryGroups: Array<{
    report: string;
    items: any[];
    modified?: string | null;
    sourceName?: string | null;
    sourceLink?: string | null;
  }> = [];
  selectedCountryLoading = false;

  isBrowser: boolean = false;
  isMobileMenuOpen: boolean = false;
  isMobile: boolean = false;
  isTaskbarScrolled: boolean = false;
  private suppressTaskbarSyncUntil = 0;
  protected readonly featureCards: FeatureCard[] = [
    {
      title: 'Cyber Threat Intelligence',
      summary: 'Track threat actors, malware, infrastructure, indicators, vulnerabilities, and campaigns across public and specialist cyber intelligence sources.',
      details: 'Use LunarChain for IOC lookups, DFIR, enrichment, investigations, and alerting inside analyst and security workflows. Use our API to enrich SOC operations.'
    },
    {
      title: 'Military & Geopolitical Activity',
      summary: 'Monitor military operations, geopolitical escalation, state-linked activity, and region-specific reporting as situations develop across countries and theatres.',
      details: 'Follow locations, organizations, incidents, and linked reporting in one view to surface operational context faster.'
    },
    {
      title: 'Brand, Supply Chain & Regional Risk',
      summary: 'Track risk around organizations, executives, vendors, facilities, and operating regions, including exposure, disruption, leaks, and emerging local threats.',
      details: 'Deliver that intelligence through LunarSurface, the API, and the MCP Server for operational workflows, custom integrations, and AI-powered risk analysis.'
    }
  ];
  expandedCards: boolean[] = this.featureCards.map(() => false);

  // Location data from graph API
  locationData: any[] = [];
  // New threat intelligence properties
  threatIntelligenceData: any[] = [];

  // Multiple typing effects properties
  typingEffects: Array<{
    id: number;
    text: string;
    displayText: string;
    x: number;
    y: number;
    opacity: number;
    isVisible: boolean;
    startTime: number;
    duration: number;
  }> = [];
  private nextEffectId: number = 0;
  private typingEffectsInterval: any;

  chartsLoaded = false;

  fadeState = 'fade-in';
  isLoading = false; // Start hidden
  private loadingAnimationTimeline: any;
  private viewInitDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private containerRestoreTimer: ReturnType<typeof setTimeout> | null = null;
  private navigationScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private routeFragmentSubscription?: Subscription;
  private typingEffectsAnimationFrame: number | null = null;
  private isDestroyed = false;
  private readonly mobileDetectionResizeHandler = () => this.handleViewportResize();
  private readonly nativeMobileScrollClass = 'landing-native-mobile-scroll';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private snackbar: GlobalSnackbarService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser && typeof window !== 'undefined') {
      const hasPendingNavTarget = this.hasPendingNavigationScrollTarget();
      this.isTaskbarScrolled = hasPendingNavTarget ? true : this.getInitialTaskbarScrolledState();
      if (hasPendingNavTarget) {
        // Prevent docs -> landing first-paint flip while route handoff and smooth-scroll begin.
        this.suppressTaskbarSyncUntil = Date.now() + 1200;
      }
    }
    if (this.isBrowser) {
      gsap.registerPlugin(ScrollTrigger);
    }
  }

  private getInitialTaskbarScrolledState(): boolean {
    if (!this.isBrowser || typeof window === 'undefined') {
      return false;
    }

    // Keep toolbar visually stable during docs -> landing route handoff.
    if (this.hasPendingNavigationScrollTarget()) {
      return true;
    }

    return window.scrollY > 20;
  }

  onSelectedCountry(selection: { name: string | null; code: string | null } | null) {
    this.selectedCountry = selection?.name ?? null;
    this.selectedCountryCode = selection?.code ?? null;
    if (!selection || (!selection.name && !selection.code)) {
      this.selectedCountryIocs = [];
      this.selectedCountryGroups = [];
      this.selectedCountryLoading = false;
      return;
    }
    // Fetch IOC data for the selected country
    this.selectedCountryLoading = true;
    const payload = {
      country_name: selection?.name ?? null,
      country_code: selection?.code ?? null
    };
    this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/graph/public/landing-country-iocs`, payload)
      .subscribe({
        next: (response: any) => {
          const rawResults = Array.isArray(response?.data) ? response.data : [];

          this.selectedCountryIocs = rawResults;

          // Group by report/article title to drive the linked reports view
          const groupsMap = new Map<string, { items: any[]; modified?: string | null }>();
          for (const item of this.selectedCountryIocs) {
            const rep = typeof item?.report === 'string' && item.report.trim().length
              ? item.report.trim()
              : 'Unknown Article';

            if (!groupsMap.has(rep)) {
              groupsMap.set(rep, { items: [], modified: item?.modified ?? null });
            }

            const group = groupsMap.get(rep)!;
            group.items.push(item);

            if (item?.modified && (!group.modified || item.modified > group.modified)) {
              group.modified = item.modified;
            }
          }

          this.selectedCountryGroups = Array.from(groupsMap.entries()).map(([report, data]) => ({
            report: (report.replace(/^Article:\s*/i, '').trim() || 'Related report'),
            items: data.items,
            modified: data.modified ?? null
          }));
          this.selectedCountryLoading = false;
        },
        error: (err) => {
          console.error('[Landing] Selected country IOC query error:', err);
          this.selectedCountryIocs = [];
          this.selectedCountryGroups = [];
          this.selectedCountryLoading = false;
        }
      });
  }
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadThreatIntelligenceData();
      // Run latest location + IOCs AQL and log output
      this.runLatestLocationIocsQuery();
      // Detect mobile device
      this.isMobile = window.innerWidth <= 768;
      this.syncNativeMobileScrollMode();
      this.updateTaskbarScrolledState();
    }
    if (this.isBrowser) {
      this.loadGoogleCharts();
    }
    // Start loading animation
      this.startLoadingAnimation();
  }

  // Landing default globe: mirror explorer default logic with 10 random country anchors.
  // Keep the start bound wide so older intel still renders when uploads pause.
  private runLatestLocationIocsQuery(): void {
    this.http.get(`${environment.apiUrl}/api/${environment.apiVersion}/graph/public/landing-globe`)
      .subscribe({
        next: (response: any) => {
          const rawResults = Array.isArray(response?.data) ? response.data : [];

          try {
            const normalized = rawResults
              .map((d: any) => {
                const detail = Array.isArray(d?.nodes_vertex_collection)
                  ? d.nodes_vertex_collection.map((rep: any) => ({
                      id: rep?.id ?? null,
                      name: rep?.name ?? null,
                      description: rep?.description ?? null,
                      modified: rep?.modified ?? null,
                      sourceName: rep?.sourceName ?? null,
                      sourceLink: rep?.sourceLink ?? null,
                      intelligenceModule: typeof rep?.intelligenceModule === 'string' ? rep.intelligenceModule : null,
                      entities: this.dedupeReportEntities(Array.isArray(rep?.entities) ? rep.entities : [])
                    }))
                  : [];

                const allEntities = detail.flatMap((rep: any) =>
                  Array.isArray(rep?.entities) ? rep.entities : []
                );
                const highlights = Array.isArray(d?.highlightIocs) && d.highlightIocs.length
                  ? this.dedupeReportEntities(d.highlightIocs)
                  : allEntities.slice(0, 12);
                const primaryName = detail.length ? detail[0].name : d?.report ?? null;

                return {
                  location: d?.locationName || d?.locationCode || d?.location || null,
                  locationName: d?.locationName ?? null,
                  locationCode: d?.locationCode ?? d?.location ?? null,
                  report: primaryName,
                  moduleCounts: Array.isArray(d?.moduleCounts) ? d.moduleCounts : [],
                  nodes_vertex_collection: detail,
                  entities: allEntities,
                  highlightIocs: highlights,
                  iocs: highlights
                };
              })
              .filter((entry: any) => {
                const hasLocation = Boolean(entry?.location || entry?.locationCode);
                const hasIntel = (Array.isArray(entry?.iocs) && entry.iocs.length > 0)
                  || (Array.isArray(entry?.nodes_vertex_collection) && entry.nodes_vertex_collection.length > 0);
                return hasLocation && hasIntel;
              });

            this.globeComp?.updateLocationIocs(normalized);
          } catch (e) {
            console.warn('Failed to update globe highlights', e);
          }
        },
        error: (err) => {
          console.error('[Landing] AQL latest location IOCs error:', err);
        }
      });
  }

  private dedupeReportEntities(entities: any[]): any[] {
    if (!Array.isArray(entities) || entities.length < 2) {
      return Array.isArray(entities) ? entities : [];
    }

    const buckets = new Map<string, any[]>();
    for (const entity of entities) {
      const key = [
        String(entity?.type ?? '').trim().toLowerCase(),
        String(entity?.name ?? '').trim().toLowerCase(),
        String(entity?.value ?? '').trim().toLowerCase(),
        String(entity?.pattern ?? '').trim().toLowerCase()
      ].join('|');
      const existing = buckets.get(key);
      if (existing) {
        existing.push(entity);
      } else {
        buckets.set(key, [entity]);
      }
    }

    const rankRelationshipType = (value: any): number => {
      const rel = String(value ?? '').trim().toLowerCase();
      if (rel === 'object') return 4;
      if (rel === 'references') return 3;
      if (rel === 'related-to') return 2;
      if (!rel) return 0;
      return 1;
    };

    const result: any[] = [];
    for (const group of buckets.values()) {
      if (group.length === 1) {
        result.push(group[0]);
        continue;
      }

      const sorted = [...group].sort((a, b) => {
        const relDiff = rankRelationshipType(b?.relationshipType) - rankRelationshipType(a?.relationshipType);
        if (relDiff !== 0) {
          return relDiff;
        }
        const tsA = a?.modified ? Date.parse(a.modified) : 0;
        const tsB = b?.modified ? Date.parse(b.modified) : 0;
        return tsB - tsA;
      });

      result.push(sorted[0]);
    }

    return result;
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Small delay to ensure DOM is ready
      this.viewInitDelayTimer = setTimeout(() => {
        this.viewInitDelayTimer = null;
        if (this.isDestroyed) {
          return;
        }

        // Preserve container constraints before running layout calculations
        this.preserveContainerConstraints();
        
        this.setupGSAPAnimations();
        
        // Start animation loop for typing effects
        this.startTypingEffectsAnimationLoop();
        
        // Restore container constraints after layout calculations
        this.containerRestoreTimer = setTimeout(() => {
          this.containerRestoreTimer = null;
          if (this.isDestroyed) {
            return;
          }

          this.restoreContainerConstraints();
        }, 100);
        
        if (this.isBrowser && typeof window !== 'undefined') {
          window.addEventListener('resize', this.mobileDetectionResizeHandler);
        }
      }, 300); // Increased delay to 300ms
    }

    this.consumeNavigationScrollTarget();

    this.routeFragmentSubscription = this.route.fragment.subscribe((fragment) => {
      if (!fragment) {
        return;
      }
      this.scheduleNavigationScroll(fragment);
    });
  }

  // Start animation loop for typing effects
  startTypingEffectsAnimationLoop(): void {
    if (!this.isBrowser || this.typingEffectsAnimationFrame !== null) {
      return;
    }

    const animate = () => {
      if (!this.isBrowser || this.isDestroyed) {
        this.typingEffectsAnimationFrame = null;
        return;
      }

      this.updateTypingEffects();
      this.typingEffectsAnimationFrame = requestAnimationFrame(animate);
    };
    this.typingEffectsAnimationFrame = requestAnimationFrame(animate);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.stopMultipleTypingEffects();
    this.stopTypingEffectsAnimationLoop();
    if (this.viewInitDelayTimer) {
      clearTimeout(this.viewInitDelayTimer);
      this.viewInitDelayTimer = null;
    }
    if (this.containerRestoreTimer) {
      clearTimeout(this.containerRestoreTimer);
      this.containerRestoreTimer = null;
    }
    if (this.navigationScrollTimer) {
      clearTimeout(this.navigationScrollTimer);
      this.navigationScrollTimer = null;
    }
    this.routeFragmentSubscription?.unsubscribe();
    this.routeFragmentSubscription = undefined;
    if (this.isBrowser && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.mobileDetectionResizeHandler);
      document.body.classList.remove(this.nativeMobileScrollClass);
      document.documentElement.classList.remove(this.nativeMobileScrollClass);
    }
    this.killLandingScrollTriggers();
  }

  private stopTypingEffectsAnimationLoop(): void {
    if (this.typingEffectsAnimationFrame !== null) {
      cancelAnimationFrame(this.typingEffectsAnimationFrame);
      this.typingEffectsAnimationFrame = null;
    }
  }

  // Navigation handler
  navigateTo(path: string) {
    this.router.navigate([`/${path}`]);
  }

  scrollToSolutions(): void {
    const solutionsSection = document.querySelector('.solutions-section');
    if (solutionsSection) {
      solutionsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  scrollToContact(): void {
    const contactSection = document.querySelector('.contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToAIAgent(): void {
    const productsSection = document.querySelector('.product-suite-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private scrollToFragment(fragment: string): void {
    if (!this.isBrowser) {
      return;
    }

    const normalizedFragment = (fragment || '').toLowerCase();
    if (normalizedFragment === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionByFragment: Record<string, string> = {
      products: '.product-suite-section',
      solutions: '.solutions-section',
      'ai-agent': '.product-suite-section',
      contact: '.contact-section'
    };

    const selector = sectionByFragment[normalizedFragment];
    if (!selector) {
      return;
    }

    this.scrollToSelectorWithRetry(selector, 8);
  }

  private scheduleNavigationScroll(fragment: string): void {
    if (!this.isBrowser) {
      return;
    }

    if (this.navigationScrollTimer) {
      clearTimeout(this.navigationScrollTimer);
    }

    this.navigationScrollTimer = setTimeout(() => {
      this.navigationScrollTimer = null;
      if (this.isDestroyed) {
        return;
      }

      this.scrollToFragment(fragment);
    }, 450);
  }

  private scrollToSelectorWithRetry(selector: string, attempts: number): void {
    const target = document.querySelector(selector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (attempts <= 0) {
      return;
    }
    setTimeout(() => this.scrollToSelectorWithRetry(selector, attempts - 1), 120);
  }

  private consumeNavigationScrollTarget(): void {
    if (!this.isBrowser) {
      return;
    }

    const state = (typeof history !== 'undefined' ? history.state : null) as { landingScrollTarget?: string } | null;
    const target = typeof state?.landingScrollTarget === 'string'
      ? state.landingScrollTarget.toLowerCase()
      : null;
    if (!target) {
      return;
    }

    if (target === 'top') {
      this.scrollToFragment(target);
      this.suppressTaskbarSyncUntil = 0;
      this.updateTaskbarScrolledState();
      if (typeof history !== 'undefined' && typeof window !== 'undefined') {
        history.replaceState({}, '', window.location.pathname + window.location.search);
      }
      return;
    }

    this.scheduleNavigationScroll(target);
    this.suppressTaskbarSyncUntil = Date.now() + 1200;
    setTimeout(() => {
      this.suppressTaskbarSyncUntil = 0;
      this.updateTaskbarScrolledState();
    }, 1250);

    if (typeof history !== 'undefined' && typeof window !== 'undefined') {
      history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  }

  private hasPendingNavigationScrollTarget(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    const state = (typeof history !== 'undefined' ? history.state : null) as { landingScrollTarget?: string } | null;
    const target = typeof state?.landingScrollTarget === 'string'
      ? state.landingScrollTarget.trim().toLowerCase()
      : '';
    return target.length > 0 && target !== 'top';
  }

  onToolbarMobileMenuChange(isOpen: boolean): void {
    this.isMobileMenuOpen = isOpen;
  }

  toggleCardExpansion(cardIndex: number): void {
    if (this.isMobile) {
      this.expandedCards[cardIndex] = !this.expandedCards[cardIndex];
    }
  }

  protected trackFeatureCard(_index: number, card: FeatureCard): string {
    return card.title;
  }

  updateMobileDetection(): void {
    this.isMobile = window.innerWidth <= 768;
    this.syncNativeMobileScrollMode();
    this.updateTaskbarScrolledState();
  }

  private handleViewportResize(): void {
    this.updateMobileDetection();
  }

  private shouldUseNativeMobileScroll(): boolean {
    if (!this.isBrowser || typeof window === 'undefined') {
      return false;
    }

    const hasCoarsePointer = typeof window.matchMedia === 'function'
      && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    return window.innerWidth <= 900 || hasCoarsePointer;
  }

  private syncNativeMobileScrollMode(): void {
    if (!this.isBrowser || typeof document === 'undefined') {
      return;
    }

    const useNativeScroll = this.shouldUseNativeMobileScroll();
    document.body.classList.toggle(this.nativeMobileScrollClass, useNativeScroll);
    document.documentElement.classList.toggle(this.nativeMobileScrollClass, useNativeScroll);

    if (useNativeScroll) {
      this.killLandingScrollTriggers();
      this.resetLandingRevealStylesForNativeScroll();
    }
  }

  private resetLandingRevealStylesForNativeScroll(): void {
    const targets = gsap.utils.toArray<HTMLElement>(
      '.animate-title, .interactive-globe-section, .globe-heading, .arch-connection, .mission-section *, .product-suite-section *, .solutions-section *, .custom-operations-section *, .contact-section *, .landing-footer *'
    );

    if (targets.length === 0) {
      return;
    }

    gsap.killTweensOf(targets);
    gsap.set(targets, {
      clearProps: 'transform,filter,clipPath,willChange'
    });
  }

  private killLandingScrollTriggers(): void {
    if (!this.isBrowser) {
      return;
    }

    ScrollTrigger.getAll().forEach((triggerInstance) => triggerInstance.kill());
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateTaskbarScrolledState();
  }

  private updateTaskbarScrolledState(): void {
    if (!this.isBrowser || typeof window === 'undefined') {
      this.isTaskbarScrolled = false;
      return;
    }
    if (Date.now() < this.suppressTaskbarSyncUntil) {
      return;
    }
    this.isTaskbarScrolled = window.scrollY > 20;
  }

  loadThreatIntelligenceData(): void {
    this.http.get(`${environment.apiUrl}/api/${environment.apiVersion}/graph/public/landing-threat-intelligence`)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response?.data)) {
            this.threatIntelligenceData = response.data.filter((item: any) => item.type !== 'location');
            this.locationData = response.data.find((item: any) => item.type === 'location')?.items || [];

            // Typing effects will start after map loads
            
            // Initialize map if charts are loaded, otherwise wait for them
            if (this.chartsLoaded) {
              this.initializeMapWithLocations();
            }
            
            // Also check if we can initialize the map now
            this.checkAndInitializeMap();
          } else {
            this.threatIntelligenceData = [];
            this.locationData = [];
            this.hideLoading();
          }
        },
        error: (error) => {
          console.error('Error loading threat intelligence data:', error);
          this.threatIntelligenceData = [];
          this.locationData = [];
          this.hideLoading();
        }
      });
  }

  // Start multiple typing effects system
  startMultipleTypingEffects(): void {
    this.stopMultipleTypingEffects();
    
    // Create new effects with truly random timing
    const createNextEffect = () => {
      this.createRandomTypingEffect();
      
      // Schedule next effect with new random delay
      const randomDelay = 1200 + Math.random() * 800; // Random delay between 1.2-2.0 seconds
      this.typingEffectsInterval = setTimeout(createNextEffect, randomDelay);
    };
    
    // Start the first effect
    createNextEffect();
  }

  // Stop multiple typing effects
  stopMultipleTypingEffects(): void {
    if (this.typingEffectsInterval) {
      clearTimeout(this.typingEffectsInterval);
      this.typingEffectsInterval = null;
    }
  }

  // Create a random typing effect at a random position
  createRandomTypingEffect(): void {
    if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0) return;

    // Randomly select threat data
    const randomThreatIndex = Math.floor(Math.random() * this.threatIntelligenceData.length);
    const randomThreat = this.threatIntelligenceData[randomThreatIndex];
    
    if (!randomThreat || !randomThreat.items || randomThreat.items.length === 0) return;
    
    const randomItemIndex = Math.floor(Math.random() * randomThreat.items.length);
    const randomItem = randomThreat.items[randomItemIndex];
    
    // Generate text for the effect
    let effectText = '';
    switch (randomThreat.type) {
      case 'indicator':
        effectText = `Indicator: ${randomItem.name || randomItem.signature || 'Unknown'}`;
        break;
      case 'intrusion-set':
        effectText = `Threat Actor: ${randomItem.name || 'Unknown'}`;
        break;
      case 'report':
        effectText = `Report: ${randomItem.name || 'Unknown'}`;
        break;
      case 'malware':
        effectText = `Malware: ${randomItem.name || 'Unknown'}`;
        break;
      case 'tool':
        effectText = `Tool: ${randomItem.name || 'Unknown'}`;
        break;
      case 'threat-actor':
        effectText = `Threat Actor: ${randomItem.name || 'Unknown'}`;
        break;
      default:
        effectText = `Threat: ${randomItem.name || 'Unknown'}`;
    }
    
    // Add description if available (truncated)
    if (randomItem.description) {
      effectText += ` - ${randomItem.description.substring(0, 80)}${randomItem.description.length > 80 ? '...' : ''}`;
    }

    // Random position on the map section (avoiding edges)
    const x = 20 + Math.random() * 60; // 20% to 80% of screen width
    const y = 20 + Math.random() * 60; // 20% to 80% of screen height

    // Create new effect
    const newEffect = {
      id: this.nextEffectId++,
      text: effectText,
      displayText: '',
      x: x,
      y: y,
      opacity: 0,
      isVisible: true,
      startTime: Date.now(),
      duration: 4000 + Math.random() * 2000 // 4-6 seconds duration for longer visibility
    };

    this.typingEffects.push(newEffect);
    
    // Start typing animation for this effect
    this.startTypingAnimationForEffect(newEffect);
    
    // Remove old effects (keep only last 8)
    if (this.typingEffects.length > 8) {
      this.typingEffects.shift();
    }
  }

  // Start typing animation for a specific effect
  startTypingAnimationForEffect(effect: any): void {
    let charIndex = 0;
    
    const typeNextChar = () => {
      if (charIndex <= effect.text.length && effect.isVisible) {
        effect.displayText = effect.text.slice(0, charIndex);
        charIndex++;
        
        // Random typing speed for natural feel - slightly faster
        const typingDelay = 25 + Math.random() * 40; // Reduced from 30-80ms to 25-65ms
        setTimeout(typeNextChar, typingDelay);
      }
    };

    // Small delay before typing so the vertical reveal can complete
    setTimeout(() => {
      typeNextChar();
    }, 220);

  }

  // Update effects (called in animation loop)
  updateTypingEffects(): void {
    const now = Date.now();
    
    this.typingEffects = this.typingEffects.filter(effect => {
      const age = now - effect.startTime;
      
      if (age < 500) {
        // Fade in (first 0.5 seconds) - faster fade in
        effect.opacity = age / 500;
      } else if (age > effect.duration - 800) {
        // Fade out (last 0.8 seconds) - slightly faster fade out
        effect.opacity = (effect.duration - age) / 800;
      } else {
        // Full opacity (middle period)
        effect.opacity = 1;
      }
      
      // Remove effect if it's expired
      return age < effect.duration;
    });
  }

  loadGoogleCharts(): void {
    if (typeof google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js?loading=async';
      script.onload = () => {
        google.charts.load('current', { packages: ['geochart'] });
        google.charts.setOnLoadCallback(() => {
          this.chartsLoaded = true;
          this.checkAndInitializeMap();
        });
      };
      document.head.appendChild(script);
    } else {
      google.charts.load('current', { packages: ['geochart'] });
      google.charts.setOnLoadCallback(() => {
        this.chartsLoaded = true;
        this.checkAndInitializeMap();
      });
    }
  }

  private checkAndInitializeMap(): void {
    // If we have both charts and data, initialize the map
    if (this.chartsLoaded && this.locationData && this.locationData.length > 0) {
      this.initializeMapWithLocations();
    }
  }

  private initializeMapWithLocations(): void {
    if (typeof google !== 'undefined' && google.charts) {
      if (this.locationData.length > 0) {
        this.drawMapWithLocations();
      }
    }
  }

  private drawMapWithLocations(): void {
    if (!this.locationData || this.locationData.length === 0) return;
    
    this.fadeState = 'fade-out';
    setTimeout(() => {
      try {
        // Create data table for Google Charts with location data
        const data = google.visualization.arrayToDataTable([
          ['Country', 'Mentions'],
          ...this.locationData.map((location: any) => [
            location.name || 'Unknown',
            1 // Each location gets equal weight
          ])
        ]);

        // Create and draw the chart
        if (document.getElementById('regions_div')) {
          const chart = new google.visualization.GeoChart(document.getElementById('regions_div'));
        const options = {
          backgroundColor: '#000000',
          colorAxis: {
            colors: ['#d5bfff', '#a178f1'],
            minValue: 0,
              maxValue: 1
          },
          datalessRegionColor: '#2f2e2e',
          defaultColor: '#c0c0c0',
          region: 'world',
          displayMode: 'regions',
            enableRegionInteractivity: false,
          resolution: 'countries',
          height: '100%',
          width: '100%',
          legend: 'none',
          tooltip: {
              trigger: 'none',
            textStyle: { 
              color: '#fff',
              fontSize: 14,
              backgroundColor: '#1e1e1e'
            },
            isHtml: true
          }
        };

          chart.draw(data, options);

          // After chart is drawn, fade in and hide loading
          setTimeout(() => {
            this.fadeState = 'fade-in';
            this.hideLoading();
            
            // Start typing effects immediately after map loads
            this.startMultipleTypingEffects();
            
            // Create first typing effect with a tiny delay to let users see the map first
            setTimeout(() => {
              this.createRandomTypingEffect();
            }, 200); // Small delay to let users see the map before first effect appears
          }, 300); // Reduced from 400ms to 300ms for faster map fade-in
        }
      } catch (error) {
        console.error('Error drawing map:', error);
        this.hideLoading();
      }
    }, 300); // Reduced from 600ms to 300ms for faster map appearance
  }


  private setupGSAPAnimations(): void {
    if (!this.isBrowser) return;

    if (this.shouldUseNativeMobileScroll()) {
      this.resetLandingRevealStylesForNativeScroll();
      return;
    }

    // Set initial states for animations
    gsap.set('.animate-title', { opacity: 0, y: 30 });
    // Globe section + heading initial state
    gsap.set('.interactive-globe-section', { opacity: 0, y: 30 });
    gsap.set('.globe-heading', { opacity: 0, y: 10 });

    // Animate architectural connections for second section
    gsap.fromTo('.arch-connection',
      { strokeDasharray: "0 1000", strokeDashoffset: 0 },
      {
        strokeDasharray: "1000 0", duration: 2, ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.gsap-animated-section',
          start: 'top 70%',
          end: 'bottom 30%',
          scrub: 1,
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Fade in globe section
    gsap.to('.interactive-globe-section', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.interactive-globe-section',
        start: 'top 85%',
        end: 'top 55%',
        toggleActions: 'play none none reverse'
      }
    });

    // Fade in globe heading
    gsap.to('.globe-heading', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.interactive-globe-section',
        start: 'top 88%',
        end: 'top 58%',
        toggleActions: 'play none none reverse'
      }
    });

    // Animate title and subtitle
    gsap.to('.animate-title', { 
      opacity: 1, 
      y: 0, 
      duration: 1.2, 
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.animate-title',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    });

    // Animate mission section and intelligence domain cards
    this.setupMissionAnimations();

    // Setup simple fade-in effect for product panels
    this.setupProductSuiteFadeIn();

    // Keep everything from Our Solutions onward on a single, section-scoped animation system.
    this.setupSolutionsAndBelowAnimations();
  }

  private setupMissionAnimations(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.landing-extra-content') as HTMLElement | null;
    const mission = section?.querySelector('.mission-section') as HTMLElement | null;

    if (!section || !mission) return;

    const reduceMotion = this.prefersReducedMotion();
    const skipInitialMobileReveal = this.isMobileViewport();

    const title = mission.querySelector('.mission-title') as HTMLElement | null;
    const statement = mission.querySelector('.mission-statement') as HTMLElement | null;
    const copyParagraphs = gsap.utils.toArray<HTMLElement>('.mission-section .mission-copy p');
    const cards = gsap.utils.toArray<HTMLElement>('.landing-extra-content .feature-card');
    const cardTextItems = cards.flatMap((card) => [
      card.querySelector('h3'),
      card.querySelector('.card-main-text'),
      card.querySelector('.card-expandable-content')
    ].filter((target): target is Element => Boolean(target)));

    const targets = [
      title,
      statement,
      ...copyParagraphs,
      ...cards,
      ...cardTextItems
    ].filter((target): target is Element => Boolean(target));

    if (targets.length === 0) return;

    if (reduceMotion || skipInitialMobileReveal) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    if (title) {
      gsap.set(title, {
        opacity: 0,
        y: 18,
        letterSpacing: '0.08em'
      });
    }

    if (statement) {
      gsap.set(statement, {
        opacity: 0,
        y: 34,
        scale: 0.97,
        filter: 'blur(8px)',
        transformOrigin: '50% 50%'
      });
    }

    gsap.set(copyParagraphs, { opacity: 0, y: 18 });
    gsap.set(cards, {
      opacity: 0,
      clipPath: 'inset(0% 0% 16% 0% round 12px)'
    });
    gsap.set(cardTextItems, { opacity: 0, y: 18 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
        end: 'top 34%',
        toggleActions: 'play none none reverse'
      }
    });

    if (title) {
      tl.to(title, {
        opacity: 1,
        y: 0,
        letterSpacing: '0.18em',
        duration: 0.55,
        ease: 'power2.out'
      }, 0);
    }

    if (statement) {
      tl.to(statement, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power3.out'
      }, 0.12);
    }

    if (copyParagraphs.length > 0) {
      tl.to(copyParagraphs, {
        opacity: 1,
        y: 0,
        duration: 0.58,
        stagger: 0.12,
        ease: 'power2.out'
      }, 0.42);
    }

    cards.forEach((card, index) => {
      const textItems = [
        card.querySelector('h3'),
        card.querySelector('.card-main-text'),
        card.querySelector('.card-expandable-content')
      ].filter((target): target is Element => Boolean(target));
      const offset = 0.78 + index * 0.12;

      tl.to(card, {
        opacity: 1,
        clipPath: 'inset(0% 0% 0% 0% round 12px)',
        duration: 0.62,
        ease: 'power2.out'
      }, offset);

      if (textItems.length > 0) {
        tl.to(textItems, {
          opacity: 1,
          y: 0,
          duration: 0.48,
          stagger: 0.06,
          ease: 'power3.out'
        }, offset + 0.08);
      }
    });
  }

  private setupProductSuiteFadeIn(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.product-suite-section') as HTMLElement | null;

    if (!section) return;

    const panels = gsap.utils.toArray<HTMLElement>('.product-suite-section .product-panel');
    const modules = gsap.utils.toArray<HTMLElement>(
      '.product-suite-section .product-module, .product-suite-section .product-integration-strip'
    );
    const media = gsap.utils.toArray<HTMLElement>('.product-suite-section .product-media');
    const targets = [...panels, ...modules, ...media];

    if (targets.length === 0) return;

    if (this.prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    gsap.set(panels, {
      autoAlpha: 0,
      y: 38,
      scale: 0.99,
      willChange: 'transform, opacity'
    });
    gsap.set(modules, {
      autoAlpha: 0,
      y: 18,
      willChange: 'transform, opacity'
    });
    gsap.set(media, {
      autoAlpha: 0,
      y: 26,
      scale: 1.01,
      willChange: 'transform, opacity'
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 72%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    });

    tl.to(panels, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.82,
      stagger: 0.16,
      ease: 'power3.out'
    }, 0);

    tl.to(media, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.14,
      ease: 'power3.out'
    }, 0.18);

    tl.to(modules, {
      autoAlpha: 1,
      y: 0,
      duration: 0.48,
      stagger: 0.045,
      ease: 'power2.out'
    }, 0.42);

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private isMobileViewport(): boolean {
    return this.isBrowser
      && typeof window !== 'undefined'
      && window.innerWidth <= 768;
  }

  private sectionTargets(section: HTMLElement, selector: string): HTMLElement[] {
    return gsap.utils.toArray<HTMLElement>(section.querySelectorAll(selector));
  }

  private clearRevealInlineProps(targets: Array<Element | null | undefined>): void {
    const cleanTargets = targets.filter((target): target is Element => Boolean(target));
    if (cleanTargets.length === 0) return;

    gsap.set(cleanTargets, {
      clearProps: 'transform,filter,clipPath,willChange'
    });
  }

  private setupSolutionsAndBelowAnimations(): void {
    if (!this.isBrowser) return;

    const lowerSections = gsap.utils.toArray<HTMLElement>(
      '.solutions-section, .contact-section, .landing-footer'
    );

    if (lowerSections.length === 0) return;

    if (this.prefersReducedMotion()) {
      const lowerTargets = gsap.utils.toArray<HTMLElement>(
        '.solutions-section, .solutions-section *, .contact-section, .contact-section *, .landing-footer, .landing-footer *'
      );
      gsap.set(lowerTargets, { clearProps: 'all' });
      return;
    }

    this.setupSolutionsIntroAnimation();
    this.setupContactAnimations();
    this.setupFooterAnimations();

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  private setupSolutionsIntroAnimation(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.solutions-section') as HTMLElement | null;
    if (!section) return;

    const title = section.querySelector('.solutions-main-heading') as HTMLElement | null;
    const subtitle = section.querySelector('.solutions-subtitle') as HTMLElement | null;
    const targets = [title, subtitle].filter((target): target is HTMLElement => Boolean(target));

    if (targets.length === 0) return;

    if (title) {
      gsap.set(title, {
        autoAlpha: 0,
        y: 34,
        scale: 0.97,
        filter: 'blur(8px)',
        transformOrigin: '50% 50%',
        willChange: 'transform, opacity, filter'
      });
    }

    if (subtitle) {
      gsap.set(subtitle, {
        autoAlpha: 0,
        y: 18,
        filter: 'blur(6px)',
        willChange: 'transform, opacity, filter'
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    });

    if (title) {
      tl.to(title, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.78,
        ease: 'power3.out'
      }, 0);
    }

    if (subtitle) {
      tl.to(subtitle, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.68,
        ease: 'power3.out'
      }, 0.16);
    }
  }

  private setupContactAnimations(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.contact-section') as HTMLElement | null;
    if (!section) return;

    const headerItems = this.sectionTargets(section, '.contact-main-heading, .contact-subtitle');
    const cards = this.sectionTargets(section, '.contact-card');
    const cardDetails = cards.flatMap((card) => [
      card.querySelector('h3'),
      ...Array.from(card.querySelectorAll('p'))
    ].filter((target): target is Element => Boolean(target)));
    const form = section.querySelector('.contact-form') as HTMLElement | null;
    const formItems = this.sectionTargets(
      section,
      '.contact-form h2, .contact-form .form-group, .contact-submit-btn'
    );

    const targets = [
      ...headerItems,
      ...cards,
      ...cardDetails,
      form,
      ...formItems
    ].filter((target): target is Element => Boolean(target));

    if (targets.length === 0) return;

    if (this.prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    gsap.set(headerItems, {
      autoAlpha: 0,
      y: 24,
      filter: 'blur(6px)',
      willChange: 'transform, opacity, filter'
    });
    gsap.set(cards, {
      autoAlpha: 0,
      y: 30,
      scale: 0.985,
      willChange: 'transform, opacity'
    });
    gsap.set(cardDetails, {
      autoAlpha: 0,
      y: 12,
      willChange: 'transform, opacity'
    });
    if (form) {
      gsap.set(form, {
        autoAlpha: 0,
        y: 30,
        scale: 0.985,
        willChange: 'transform, opacity'
      });
    }
    gsap.set(formItems, {
      autoAlpha: 0,
      y: 12,
      willChange: 'transform, opacity'
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    });

    tl.to(headerItems, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.58,
      stagger: 0.1,
      ease: 'power3.out'
    }, 0);

    cards.forEach((card, index) => {
      const details = [
        card.querySelector('h3'),
        ...Array.from(card.querySelectorAll('p'))
      ].filter((target): target is Element => Boolean(target));
      const offset = 0.28 + index * 0.12;

      tl.to(card, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.58,
        ease: 'power3.out'
      }, offset);

      if (details.length > 0) {
        tl.to(details, {
          autoAlpha: 1,
          y: 0,
          duration: 0.36,
          stagger: 0.045,
          ease: 'power2.out'
        }, offset + 0.08);
      }
    });

    if (form) {
      tl.to(form, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.64,
        ease: 'power3.out'
      }, 0.44);
    }

    if (formItems.length > 0) {
      tl.to(formItems, {
        autoAlpha: 1,
        y: 0,
        duration: 0.38,
        stagger: 0.045,
        ease: 'power2.out'
      }, 0.56);
    }
  }

  private setupFooterAnimations(): void {
    if (!this.isBrowser) return;

    const footer = document.querySelector('.landing-footer') as HTMLElement | null;
    if (!footer) return;

    const brand = footer.querySelector('.footer-brand') as HTMLElement | null;
    const linkGroups = this.sectionTargets(footer, '.footer-link-group');
    const bottomItems = this.sectionTargets(footer, '.footer-copyright, .footer-social .social-link');
    const targets = [
      brand,
      ...linkGroups,
      ...bottomItems
    ].filter((target): target is HTMLElement => Boolean(target));

    if (targets.length === 0) return;

    if (this.prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    gsap.set(targets, {
      autoAlpha: 0,
      y: 18,
      willChange: 'transform, opacity'
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: 'top 86%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    })
      .to(brand, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out'
      }, 0)
      .to(linkGroups, {
        autoAlpha: 1,
        y: 0,
        duration: 0.46,
        stagger: 0.08,
        ease: 'power3.out'
      }, 0.08)
      .to(bottomItems, {
        autoAlpha: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.05,
        ease: 'power2.out'
      }, 0.24);
  }

  private startLoadingAnimation(): void {
    if (!this.isBrowser) return;

    this.isLoading = true;

    setTimeout(() => {
      if (document.querySelector('.loading-text')) {
        gsap.set('.loading-text', { opacity: 0, y: 12 });
      }
      if (document.querySelector('.loading-logo-mark')) {
        gsap.set('.loading-logo-mark', { opacity: 0, scale: 0.86 });
      }
      if (document.querySelector('.loading-container')) {
        gsap.set('.loading-container', { opacity: 0 });
      }
      // Ensure map starts hidden
      if (document.querySelector('#regions_div')) {
        gsap.set('#regions_div', { opacity: 0 });
      }

      this.loadingAnimationTimeline = gsap.timeline();

      if (document.querySelector('.loading-container')) {
        this.loadingAnimationTimeline.to('.loading-container', {
          opacity: 1,
          duration: 0.45,
          ease: 'power2.out'
        }, 0);
      }

      if (document.querySelector('.loading-logo-mark')) {
        this.loadingAnimationTimeline.to('.loading-logo-mark', {
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: 'power3.out'
        }, 0.15);
      }

      if (document.querySelector('.loading-text')) {
        this.loadingAnimationTimeline.to('.loading-text', {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out'
        }, 0.35);
      }
    }, 50);
  }

  private hideLoading(): void {
    if (!this.isBrowser) return;

    if (this.loadingAnimationTimeline) {
      this.loadingAnimationTimeline.kill();
      this.loadingAnimationTimeline = null;
    }

    if (document.querySelector('.loading-logo-mark')) {
      gsap.killTweensOf('.loading-logo-mark');
    }
    if (document.querySelector('.loading-text')) {
      gsap.killTweensOf('.loading-text');
    }
    if (document.querySelector('.loading-container')) {
      gsap.killTweensOf('.loading-container');
    }

    if (document.querySelector('.loading-logo-mark')) {
      gsap.set('.loading-logo-mark', {
        opacity: 1,
        scale: 1,
        filter: 'none'
      });
    }
    if (document.querySelector('.loading-text')) {
      gsap.set('.loading-text', { opacity: 1, y: 0 });
    }
    if (document.querySelector('.loading-container')) {
      gsap.set('.loading-container', { opacity: 1 });
    }

    // Smoothly fade in the map
    if (document.querySelector('#regions_div')) {
      gsap.to('#regions_div', { opacity: 1, duration: 0.6, ease: 'power2.out' });
    }

    this.isLoading = false;
  }

  private preserveContainerConstraints(): void {
    if (!this.isBrowser) return;
    
    // Add a temporary class to prevent layout shifts
    const sections = document.querySelectorAll('.landing-extra-content, .contact-section');
    sections.forEach(section => {
      section.classList.add('preserving-constraints');
    });
  }

  private restoreContainerConstraints(): void {
    if (!this.isBrowser) return;
    
    // Remove the temporary class
    const sections = document.querySelectorAll('.landing-extra-content, .contact-section');
    sections.forEach(section => {
      section.classList.remove('preserving-constraints');
    });
  }

  // Contact form handling
  onSubmitContactForm(event: Event): void {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Get form values
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const company = formData.get('company') as string;
    const inquiryType = formData.get('inquiryType') as string;
    const message = formData.get('message') as string;
    
    // Validate required fields
    if (!name || !email || !inquiryType || !message) {
      this.snackbar.open('Please fill in all required fields.', 'error');
      return;
    }
    
    // Prepare payload
    const payload = {
      name: name,
      email: email,
      company: company || undefined, // Only include if not empty
      inquiryType: inquiryType,
      message: message
    };
    
    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });
    
    // Show loading state
    this.snackbar.open('Sending your message...', 'info');
    
    // Make API call
    this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/contacts/contact`, payload)
      .subscribe({
        next: () => {
          // Show success message
          this.snackbar.open('Thank you! Your message has been sent successfully. We\'ll get back to you soon.', 'success');
          
          // Reset form
          form.reset();
        },
        error: (error) => {
          console.error('Contact form submission error:', error);
          
          // Show error message
          let errorMessage = 'Sorry, there was an error sending your message. Please try again.';
          if (error.status === 400) {
            errorMessage = 'Please check your information and try again.';
          } else if (error.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment before trying again.';
          }
          
          this.snackbar.open(errorMessage, 'error');
        }
      });
  }

}

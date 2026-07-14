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

  chartsLoaded = false;

  fadeState = 'fade-in';
  isLoading = false; // Start hidden
  private loadingAnimationTimeline: any;
  private viewInitDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private containerRestoreTimer: ReturnType<typeof setTimeout> | null = null;
  private navigationScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private routeFragmentSubscription?: Subscription;
  private isDestroyed = false;
  private readonly pendingTimers = new Set<ReturnType<typeof setTimeout>>();
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
      this.viewInitDelayTimer = this.setLandingTimeout(() => {
        this.viewInitDelayTimer = null;

        // Preserve container constraints before running layout calculations
        this.preserveContainerConstraints();
        
        this.setupGSAPAnimations();
        
        // Restore container constraints after layout calculations
        this.containerRestoreTimer = this.setLandingTimeout(() => {
          this.containerRestoreTimer = null;

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

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.clearLandingTimeout(this.viewInitDelayTimer);
    this.viewInitDelayTimer = null;
    this.clearLandingTimeout(this.containerRestoreTimer);
    this.containerRestoreTimer = null;
    this.clearLandingTimeout(this.navigationScrollTimer);
    this.navigationScrollTimer = null;
    this.clearPendingLandingTimers();
    this.routeFragmentSubscription?.unsubscribe();
    this.routeFragmentSubscription = undefined;
    if (this.isBrowser && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.mobileDetectionResizeHandler);
      document.body.classList.remove(this.nativeMobileScrollClass);
      document.documentElement.classList.remove(this.nativeMobileScrollClass);
    }
    this.killLandingScrollTriggers();
  }

  private setLandingTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer);
      if (this.isDestroyed) {
        return;
      }

      callback();
    }, delay);
    this.pendingTimers.add(timer);
    return timer;
  }

  private clearLandingTimeout(timer: ReturnType<typeof setTimeout> | null): void {
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.pendingTimers.delete(timer);
  }

  private clearPendingLandingTimers(): void {
    this.pendingTimers.forEach((timer) => clearTimeout(timer));
    this.pendingTimers.clear();
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
      this.clearLandingTimeout(this.navigationScrollTimer);
    }

    this.navigationScrollTimer = this.setLandingTimeout(() => {
      this.navigationScrollTimer = null;

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
    this.setLandingTimeout(() => this.scrollToSelectorWithRetry(selector, attempts - 1), 120);
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
    this.setLandingTimeout(() => {
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

    return window.innerWidth <= 900;
  }

  private syncNativeMobileScrollMode(): void {
    if (!this.isBrowser || typeof document === 'undefined') {
      return;
    }

    const useNativeScroll = this.shouldUseNativeMobileScroll();
    document.body.classList.toggle(this.nativeMobileScrollClass, useNativeScroll);
    document.documentElement.classList.toggle(this.nativeMobileScrollClass, useNativeScroll);

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
          if (this.isDestroyed) {
            return;
          }

          if (Array.isArray(response?.data)) {
            this.threatIntelligenceData = response.data.filter((item: any) => item.type !== 'location');
            this.locationData = response.data.find((item: any) => item.type === 'location')?.items || [];

            this.checkAndInitializeMap();
          } else {
            this.threatIntelligenceData = [];
            this.locationData = [];
            this.hideLoading();
          }
        },
        error: (error) => {
          if (this.isDestroyed) {
            return;
          }

          console.error('Error loading threat intelligence data:', error);
          this.threatIntelligenceData = [];
          this.locationData = [];
          this.hideLoading();
        }
      });
  }

  loadGoogleCharts(): void {
    if (typeof google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js?loading=async';
      script.onload = () => {
        if (this.isDestroyed) {
          return;
        }

        google.charts.load('current', { packages: ['geochart'] });
        google.charts.setOnLoadCallback(() => {
          if (this.isDestroyed) {
            return;
          }

          this.chartsLoaded = true;
          this.checkAndInitializeMap();
        });
      };
      document.head.appendChild(script);
    } else {
      google.charts.load('current', { packages: ['geochart'] });
      google.charts.setOnLoadCallback(() => {
        if (this.isDestroyed) {
          return;
        }

        this.chartsLoaded = true;
        this.checkAndInitializeMap();
      });
    }
  }

  private checkAndInitializeMap(): void {
    // If we have both charts and data, initialize the map
    if (this.chartsLoaded && this.locationData && this.locationData.length > 0) {
      this.drawMapWithLocations();
    }
  }

  private drawMapWithLocations(): void {
    if (!this.locationData || this.locationData.length === 0 || typeof google === 'undefined' || !google.charts) return;
    
    this.fadeState = 'fade-out';
    this.setLandingTimeout(() => {
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
          this.setLandingTimeout(() => {
            this.fadeState = 'fade-in';
            this.hideLoading();
            
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

    this.killLandingScrollTriggers();

    const heroTargets = gsap.utils.toArray<HTMLElement>(
      '.landing-taskbar, [data-hero-item], .hero-metric, .map-scroll-cue'
    );
    const groupedTargets = gsap.utils.toArray<HTMLElement>('[data-gsap-item]');
    const footerTargets = gsap.utils.toArray<HTMLElement>(
      '.landing-footer .footer-brand, .landing-footer .footer-link-group, .landing-footer .footer-bottom-content'
    );
    const allTargets = [...heroTargets, ...groupedTargets, ...footerTargets];

    if (this.prefersReducedMotion()) {
      gsap.set(allTargets, { clearProps: 'all' });
      return;
    }

    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const toolbar = document.querySelector('.landing-taskbar');
    const heroPanel = document.querySelector('[data-hero-item]');
    const heroMetrics = gsap.utils.toArray<HTMLElement>('.hero-metric');
    const scrollCue = document.querySelector('.map-scroll-cue');

    if (toolbar) {
      heroTimeline.fromTo(toolbar, { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 0.62 }, 0);
    }
    if (heroPanel) {
      heroTimeline.fromTo(heroPanel, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.78 }, 0.12);
    }
    if (heroMetrics.length) {
      heroTimeline.fromTo(
        heroMetrics,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 },
        0.32
      );
    }
    if (scrollCue) {
      heroTimeline.fromTo(scrollCue, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, 0.62);
    }

    const groups = gsap.utils.toArray<HTMLElement>('[data-gsap-group]');
    groups.forEach((group) => {
      if (group.closest('.landing-initial-viewport')) return;

      const items = gsap.utils.toArray<HTMLElement>(group.querySelectorAll('[data-gsap-item]'));
      if (!items.length) return;

      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.68,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: {
            trigger: group,
            start: 'top 86%',
            once: true
          }
        }
      );
    });

    if (footerTargets.length) {
      gsap.fromTo(
        footerTargets,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.62,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: {
            trigger: '.landing-footer',
            start: 'top 90%',
            once: true
          }
        }
      );
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private startLoadingAnimation(): void {
    if (!this.isBrowser) return;

    this.isLoading = true;

    this.setLandingTimeout(() => {
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

import { __decorate, __param } from "tslib";
import { Component, ViewChild, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { trigger, style, animate, transition, query, stagger } from '@angular/animations';
import { LandingGlobeComponent } from '../landing-globe/landing-globe.component';
import { isPlatformBrowser } from '@angular/common';
import { ScaleType } from '@swimlane/ngx-charts';
import { environment } from '../../environments/environment';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
let LandingPageComponent = class LandingPageComponent {
    constructor(dataService, router, platformId, http, dialog, snackbar, renderer) {
        this.dataService = dataService;
        this.router = router;
        this.platformId = platformId;
        this.http = http;
        this.dialog = dialog;
        this.snackbar = snackbar;
        this.renderer = renderer;
        this.selectedCountry = null;
        this.selectedCountryCode = null;
        this.selectedCountryIocs = [];
        this.selectedCountryGroups = [];
        this.selectedCountryLoading = false;
        this.selectedCountryReport = null;
        this.isBrowser = false;
        this.isMobileMenuOpen = false;
        this.isMobile = false;
        this.showLoginButton = false;
        this.isTaskbarScrolled = false;
        this.expandedCards = [false, false, false];
        // Location data from graph API
        this.locationData = [];
        this.currentLocationIndex = 0;
        this.typedLocationName = '';
        // New threat intelligence properties
        this.threatIntelligenceData = [];
        this.currentThreatType = null;
        this.currentThreatItems = [];
        this.currentThreatIndex = 0;
        this.currentItemIndex = 0;
        this.typedThreatSummary = '';
        // Multiple typing effects properties
        this.typingEffects = [];
        this.nextEffectId = 0;
        // Chart data properties
        this.sentimentData = [];
        this.threatActorData = [];
        // Chart dimensions - adjusted for side-by-side display
        this.sentimentChartView = [400, 300];
        this.pieChartView = [400, 300];
        this.barChartView = [400, 300];
        // Chart options
        this.sentimentChartOptions = {
            showXAxis: true,
            showYAxis: true,
            gradient: true,
            showLegend: true,
            showXAxisLabel: true,
            xAxisLabel: 'Date',
            showYAxisLabel: true,
            yAxisLabel: 'Sentiment Score',
            timeline: true,
            yScaleMin: 0,
            yScaleMax: 10,
            colorScheme: {
                name: 'custom',
                selectable: true,
                group: ScaleType.Ordinal,
                domain: ['#6C5CE7', '#A29BFE', '#8E44AD', '#9B59B6', '#3498DB', '#2980B9']
            }
        };
        this.currentTargetIndex = 0;
        this.chartsLoaded = false;
        this.pendingTargets = [];
        // List of country names for matching in summaries
        this.countryList = [
            'United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia', 'Japan', 'Brazil', 'India', 'China', 'Russia', 'South Korea', 'Singapore', 'United Arab Emirates',
            'Italy', 'Spain', 'Netherlands', 'Sweden', 'Switzerland', 'Norway', 'Denmark', 'Finland', 'Poland', 'Austria', 'Belgium', 'Ireland', 'Portugal', 'Greece', 'Turkey', 'Mexico',
            'Argentina', 'Chile', 'Colombia', 'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Israel', 'Saudi Arabia', 'Iran', 'Pakistan', 'Bangladesh', 'Indonesia', 'Thailand', 'Vietnam',
            'Philippines', 'Malaysia', 'New Zealand', 'Ukraine', 'Romania', 'Czech Republic', 'Hungary', 'Slovakia', 'Bulgaria', 'Croatia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania',
            'Luxembourg', 'Iceland', 'Malta', 'Cyprus', 'Morocco', 'Algeria', 'Tunisia', 'Ghana', 'Ivory Coast', 'Senegal', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia',
            'Panama', 'Costa Rica', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Jamaica', 'Trinidad and Tobago', 'Dominican Republic', 'Cuba', 'Puerto Rico', 'Qatar', 'Kuwait',
            'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Afghanistan', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Georgia', 'Armenia', 'Azerbaijan', 'Mongolia', 'Cambodia',
            'Laos', 'Myanmar', 'Nepal', 'Sri Lanka', 'Maldives', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Samoa', 'Tonga', 'Vanuatu', 'Brunei', 'East Timor', 'Bhutan', 'Liechtenstein',
            'Monaco', 'San Marino', 'Andorra', 'Vatican City', 'Gibraltar', 'Greenland', 'Antarctica'
        ];
        this.typedTargetName = '';
        this.fadeState = 'fade-in';
        this.isAnimating = false;
        this.isLoading = false; // Start hidden
        this.isBrowser = isPlatformBrowser(this.platformId);
        if (this.isBrowser) {
            gsap.registerPlugin(ScrollTrigger);
        }
    }
    onSelectedCountry(selection) {
        this.selectedCountry = selection?.name ?? null;
        this.selectedCountryCode = selection?.code ?? null;
        if (!selection || (!selection.name && !selection.code)) {
            this.selectedCountryIocs = [];
            this.selectedCountryGroups = [];
            this.selectedCountryLoading = false;
            this.selectedCountryReport = null;
            return;
        }
        // Fetch IOC data for the selected country
        this.selectedCountryLoading = true;
        const countryCode = (selection?.code || '').toString().toUpperCase().replace(/[^A-Z]/g, '');
        const countryNameParam = (selection?.name || '').toLowerCase().replace(/'/g, "\\'");
        const countryFilter = countryCode
            ? `loc.country == '${countryCode}'`
            : `CONTAINS(LOWER(loc.name), '${countryNameParam}')`;
        const aql = `LET country_id = FIRST(
  FOR loc IN nodes_vertex_collection 
  FILTER loc.type == 'location' AND loc._is_latest == true AND ${countryFilter}
  RETURN loc._id
)

LET report_ids = (
  FOR v, e IN 1..1 INBOUND country_id GRAPH 'lunargraph_graph'
  FILTER v.type == 'report'
  SORT v.modified DESC
  LIMIT 2
  RETURN v._id
)

FOR report_id IN report_ids
  FOR ioc, e IN 1..1 OUTBOUND report_id GRAPH 'lunargraph_graph'
    FILTER ioc.type IN ['indicator', 'domain-name', 'url', 'ipv4-addr', 'file']
    RETURN DISTINCT {
      type: ioc.type,
      name: ioc.name,
      value: ioc.value,
      pattern: ioc.pattern,
      modified: ioc.modified,
      report: DOCUMENT(report_id).name
    }`;
        const payload = { query: aql };
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/graph/aql-query`, payload)
            .subscribe({
            next: (response) => {
                const rawResults = Array.isArray(response?.result)
                    ? response.result
                    : Array.isArray(response?.results?.result)
                        ? response.results.result
                        : [];
                this.selectedCountryIocs = rawResults;
                // Group by report/article title to drive the linked reports view
                const groupsMap = new Map();
                for (const item of this.selectedCountryIocs) {
                    const rep = typeof item?.report === 'string' && item.report.trim().length
                        ? item.report.trim()
                        : 'Unknown Article';
                    if (!groupsMap.has(rep)) {
                        groupsMap.set(rep, { items: [], modified: item?.modified ?? null });
                    }
                    const group = groupsMap.get(rep);
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
                // If only one report, expose it in the single article header for convenience
                this.selectedCountryReport = this.selectedCountryGroups.length === 1 ? this.selectedCountryGroups[0].report : null;
                this.selectedCountryLoading = false;
            },
            error: (err) => {
                console.error('[Landing] Selected country IOC query error:', err);
                this.selectedCountryIocs = [];
                this.selectedCountryGroups = [];
                this.selectedCountryReport = null;
                this.selectedCountryLoading = false;
            }
        });
    }
    ngOnInit() {
        // Suppress Google Maps API warnings globally when no API key is configured
        const originalWarn = console.warn;
        const originalError = console.error;
        console.warn = function (...args) {
            if (args[0] && typeof args[0] === 'string' &&
                (args[0].includes('NoApiKeys') ||
                    args[0].includes('InvalidKey') ||
                    args[0].includes('Geocoding Service') ||
                    args[0].includes('Google Maps JavaScript API warning') ||
                    args[0].includes('Google Maps JavaScript API has been loaded directly without loading=async') ||
                    args[0].includes('You must use an API key to authenticate each request to Google Maps Platform APIs') ||
                    args[0].includes('maps-no-account'))) {
                return; // Suppress these specific warnings
            }
            originalWarn.apply(console, args);
        };
        console.error = function (...args) {
            if (args[0] && typeof args[0] === 'string' &&
                (args[0].includes('Geocoding Service') ||
                    args[0].includes('maps-no-account') ||
                    args[0].includes('Google Maps Platform APIs'))) {
                return; // Suppress these specific errors
            }
            originalError.apply(console, args);
        };
        if (isPlatformBrowser(this.platformId)) {
            this.loadThreatIntelligenceData();
            // Run latest location + IOCs AQL and log output
            this.runLatestLocationIocsQuery();
            // Detect mobile device
            this.isMobile = window.innerWidth <= 768;
            this.updateTaskbarScrolledState();
        }
        if (this.isBrowser) {
            this.loadGoogleCharts();
        }
        // Start loading animation
        this.startLoadingAnimation();
    }
    // Run the provided AQL to fetch latest locations with their most recent report and IOCs
    runLatestLocationIocsQuery() {
        const aql = `FOR r IN nodes_vertex_collection
  FILTER r.type == 'report' AND r._is_latest == true
  SORT r.modified DESC
  LIMIT 50

  LET first_location = FIRST(
    FOR v, e IN 1..2 OUTBOUND r._id GRAPH 'lunargraph_graph'
      FILTER v.type == 'location'
      SORT v.modified DESC
      LIMIT 1
      RETURN { country: v.country, name: v.name }
  )

  LET iocs = (
    FOR v2, e2 IN 1..2 OUTBOUND r._id GRAPH 'lunargraph_graph'
      FILTER v2.type IN [
        'indicator',
        'domain-name',
        'url',
        'ipv4-addr',
        'file',
        'email-addr',
        'windows-registry-key'
      ]
      SORT v2.modified DESC
      LIMIT 5
      RETURN {
        type: v2.type,
        name: v2.name,
        value: v2.value,
        modified: v2.modified
      }
  )

  FILTER first_location != null
  FILTER LENGTH(iocs) > 0

  COLLECT country = first_location.country, countryName = first_location.name INTO group
  LET chosen = FIRST(group)

  RETURN {
    location: country,
    locationName: countryName,
    report: chosen.report,
    iocs: chosen.iocs
  }

`;
        const payload = { query: aql };
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/graph/aql-query`, payload)
            .subscribe({
            next: (response) => {
                const rawResults = Array.isArray(response?.result)
                    ? response.result
                    : (Array.isArray(response?.results?.result) ? response.results.result : []);
                // Update globe highlights if available
                try {
                    if (Array.isArray(rawResults)) {
                        const normalized = rawResults
                            .map((d) => {
                            const iocs = d.iocs || d.nodes_vertex_collection || [];
                            return {
                                location: d.locationName || d.location,
                                locationCode: d.location,
                                report: d.report || d.report_id,
                                nodes_vertex_collection: iocs,
                                iocs
                            };
                        })
                            .filter((d) => d.location && Array.isArray(d.iocs) && d.iocs.length > 0);
                        this.globeComp?.updateLocationIocs(normalized);
                    }
                }
                catch (e) {
                    console.warn('Failed to update globe highlights', e);
                }
            },
            error: (err) => {
                console.error('[Landing] AQL latest location IOCs error:', err);
            }
        });
    }
    ngAfterViewInit() {
        if (this.isBrowser) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                // Preserve container constraints before running layout calculations
                this.preserveContainerConstraints();
                this.updateReconLinePointsToCardCenters();
                this.updateInvestigationLinePointsToCardCenters();
                this.setupGSAPAnimations();
                this.setupAlertingAnimation();
                // Start animation loop for typing effects
                this.startTypingEffectsAnimationLoop();
                // Restore container constraints after layout calculations
                setTimeout(() => {
                    this.restoreContainerConstraints();
                }, 100);
                if (this.isBrowser && typeof window !== 'undefined') {
                    window.addEventListener('resize', this.updateReconLinePointsToCardCenters.bind(this));
                    window.addEventListener('resize', this.updateInvestigationLinePointsToCardCenters.bind(this));
                    window.addEventListener('resize', this.updateMobileDetection.bind(this));
                }
            }, 300); // Increased delay to 300ms
        }
    }
    // Start animation loop for typing effects
    startTypingEffectsAnimationLoop() {
        const animate = () => {
            this.updateTypingEffects();
            if (this.isBrowser) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    ngOnDestroy() {
        this.stopThreatIntelligenceCycle();
        this.stopLocationCycle();
        this.stopMultipleTypingEffects();
        if (this.parallaxLineAnimationFrame) {
            cancelAnimationFrame(this.parallaxLineAnimationFrame);
        }
        if (this.platformHighlightInterval) {
            clearInterval(this.platformHighlightInterval);
        }
        if (this.platformBreakTimer) {
            clearTimeout(this.platformBreakTimer);
        }
        if (this.isBrowser && typeof window !== 'undefined') {
            window.removeEventListener('resize', this.updateReconLinePointsToCardCenters.bind(this));
            window.removeEventListener('resize', this.updateInvestigationLinePointsToCardCenters.bind(this));
            window.removeEventListener('resize', this.updateMobileDetection.bind(this));
        }
    }
    updateReconLinePointsToCardCenters() {
        // Get the grid container
        const grid = document.querySelector('.recon-steps.grid');
        if (!grid)
            return;
        const cards = Array.from(grid.querySelectorAll('.recon-step.grid-step'));
        if (cards.length !== 6)
            return;
        const svg = grid.previousElementSibling;
        if (!svg)
            return;
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;
        // Set SVG size and viewBox to match grid
        const gridRect = grid.getBoundingClientRect();
        svg.setAttribute('width', `${gridRect.width}`);
        svg.setAttribute('height', `${gridRect.height}`);
        svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);
        // Get center points in grid-local coordinates
        const centers = cards.map(el => {
            const rect = el.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - gridRect.left,
                y: rect.top + rect.height / 2 - gridRect.top
            };
        });
        // Update each polyline's points attribute
        const polylines = svg.querySelectorAll('.recon-grid-line');
        if (polylines.length !== 6)
            return;
        if (!isMobile) {
            // Desktop: Complex grid layout
            // 1 to 2
            polylines[0].setAttribute('points', `${centers[0].x},${centers[0].y} ${(centers[0].x + centers[1].x) / 2},${centers[0].y} ${centers[1].x},${centers[1].y}`);
            // 2 to 3
            polylines[1].setAttribute('points', `${centers[1].x},${centers[1].y} ${(centers[1].x + centers[2].x) / 2},${centers[1].y} ${centers[2].x},${centers[2].y}`);
            // 3 down to 6 (elbow at x3, midway y)
            const midY = (centers[2].y + centers[5].y) / 2;
            polylines[2].setAttribute('points', `${centers[2].x},${centers[2].y} ${centers[2].x},${midY} ${centers[5].x},${midY} ${centers[5].x},${centers[5].y}`);
            // 6 to 5
            polylines[3].setAttribute('points', `${centers[5].x},${centers[5].y} ${(centers[5].x + centers[4].x) / 2},${centers[5].y} ${centers[4].x},${centers[4].y}`);
            // 5 to 4
            polylines[4].setAttribute('points', `${centers[4].x},${centers[4].y} ${(centers[4].x + centers[3].x) / 2},${centers[4].y} ${centers[3].x},${centers[3].y}`);
            // Remove the last line (no upward turn)
            polylines[5].setAttribute('points', '');
        }
        else {
            // Mobile: Simple sequential vertical connections
            // 1 to 2
            polylines[0].setAttribute('points', `${centers[0].x},${centers[0].y} ${centers[1].x},${centers[1].y}`);
            // 2 to 3
            polylines[1].setAttribute('points', `${centers[1].x},${centers[1].y} ${centers[2].x},${centers[2].y}`);
            // 3 to 4
            polylines[2].setAttribute('points', `${centers[2].x},${centers[2].y} ${centers[3].x},${centers[3].y}`);
            // 4 to 5
            polylines[3].setAttribute('points', `${centers[3].x},${centers[3].y} ${centers[4].x},${centers[4].y}`);
            // 5 to 6
            polylines[4].setAttribute('points', `${centers[4].x},${centers[4].y} ${centers[5].x},${centers[5].y}`);
            // Remove the last line (no connection after the last card)
            polylines[5].setAttribute('points', '');
        }
    }
    updateInvestigationLinePointsToCardCenters() {
        if (!this.isBrowser)
            return;
        setTimeout(() => {
            const gridContainer = document.querySelector('.investigation-steps-svg-wrapper');
            const cards = document.querySelectorAll('.investigation-section .grid-step');
            const lines = document.querySelectorAll('.investigation-grid-line');
            if (!gridContainer || cards.length === 0 || lines.length === 0)
                return;
            const containerRect = gridContainer.getBoundingClientRect();
            const cardCenters = [];
            // Calculate center points for each card
            cards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const centerX = ((cardRect.left + cardRect.width / 2) - containerRect.left) / containerRect.width * 100;
                const centerY = ((cardRect.top + cardRect.height / 2) - containerRect.top) / containerRect.height * 100;
                cardCenters.push({ x: centerX, y: centerY });
            });
            // Create a single main line down the middle with branches
            const mainLineY = 50; // Main line runs down the center at 50% width
            const mainLineStartY = 10; // Start at top
            const mainLineEndY = 90; // End at bottom
            // Main vertical line (line 0)
            lines[0].setAttribute('points', `${mainLineY},${mainLineStartY} ${mainLineY},${mainLineEndY}`);
            // Define the card order for animation: 1, 2, 3, 6, 5, 4
            const cardOrder = [0, 1, 2, 5, 4, 3]; // card indices in order
            // Branch lines to each card in the animation order
            cardOrder.forEach((cardIndex, i) => {
                const cardCenter = cardCenters[cardIndex];
                if (cardCenter && lines[i + 1]) {
                    // Create branch from main line to card
                    const branchPoints = `${mainLineY},${cardCenter.y} ${cardCenter.x},${cardCenter.y}`;
                    lines[i + 1].setAttribute('points', branchPoints);
                }
            });
        }, 100);
    }
    // Navigation handler
    navigateTo(path) {
        this.router.navigate([`/${path}`]);
    }
    scrollToSolutions() {
        const solutionsSection = document.querySelector('.solutions-section');
        if (solutionsSection) {
            solutionsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    scrollToContact() {
        const contactSection = document.querySelector('.contact-section');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    scrollToAIAgent() {
        const aiAgentSection = document.querySelector('.ai-agent-section');
        if (aiAgentSection) {
            aiAgentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        // Prevent body scroll when menu is open
        if (this.isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
    }
    toggleCardExpansion(cardIndex) {
        if (this.isMobile) {
            this.expandedCards[cardIndex] = !this.expandedCards[cardIndex];
        }
    }
    updateMobileDetection() {
        this.isMobile = window.innerWidth <= 768;
        this.updateTaskbarScrolledState();
    }
    onWindowScroll() {
        this.updateTaskbarScrolledState();
    }
    updateTaskbarScrolledState() {
        if (!this.isBrowser || typeof window === 'undefined') {
            this.isTaskbarScrolled = false;
            return;
        }
        this.isTaskbarScrolled = window.scrollY > 20;
    }
    // Open Instagram
    followInstagram() {
        if (this.isBrowser && typeof window !== 'undefined') {
            window.open('https://instagram.com/lunarchainco', '_blank');
        }
    }
    loadThreatIntelligenceData() {
        const payload = {
            "query": "FOR doc IN nodes_vertex_collection FILTER doc._is_latest == true AND doc.type IN ['threat-actor','report','indicator','malware','tool','intrusion-set','location'] SORT doc.created DESC COLLECT type = doc.type INTO group LET top5 = SLICE(group[*].doc, 0, 5) RETURN { type: type, items: top5 }"
        };
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/graph/aql-query`, payload)
            .subscribe({
            next: (response) => {
                if (response?.results?.success && response.results.result) {
                    this.threatIntelligenceData = response.results.result.filter((item) => item.type !== 'location');
                    this.locationData = response.results.result.find((item) => item.type === 'location')?.items || [];
                    this.currentThreatIndex = 0;
                    this.currentLocationIndex = 0;
                    this.updateCurrentThreatData(); // Initialize first threat data
                    this.updateCurrentLocationData(); // Initialize first location data
                    this.startRandomThreatIntelligenceCycle();
                    this.startLocationCycle();
                    // Typing effects will start after map loads
                    // Initialize map if charts are loaded, otherwise wait for them
                    if (this.chartsLoaded) {
                        this.initializeMapWithLocations();
                    }
                    else {
                        // Charts not ready yet, wait for them
                        // console.log('Charts not ready yet, waiting...'); // Suppressed
                    }
                    // Also check if we can initialize the map now
                    this.checkAndInitializeMap();
                }
                else {
                    // console.warn('No threat intelligence data received or invalid response format'); // Suppressed
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
    // Randomly cycle through all threat intelligence values
    startRandomThreatIntelligenceCycle() {
        this.stopThreatIntelligenceCycle();
        if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0)
            return;
        this.threatCycleInterval = setInterval(() => {
            try {
                // Randomly select a threat type
                const randomThreatIndex = Math.floor(Math.random() * this.threatIntelligenceData.length);
                this.currentThreatIndex = randomThreatIndex;
                // Randomly select an item within that threat type
                const currentThreat = this.threatIntelligenceData[this.currentThreatIndex];
                if (currentThreat && currentThreat.items && currentThreat.items.length > 0) {
                    const randomItemIndex = Math.floor(Math.random() * currentThreat.items.length);
                    this.currentItemIndex = randomItemIndex;
                    this.updateCurrentThreatData();
                }
            }
            catch (err) {
                console.error('Error in random threat intelligence cycling interval:', err);
                this.stopThreatIntelligenceCycle();
            }
        }, 5000); // Change every 5 seconds for more dynamic feel
    }
    // Start multiple typing effects system
    startMultipleTypingEffects() {
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
    stopMultipleTypingEffects() {
        if (this.typingEffectsInterval) {
            clearTimeout(this.typingEffectsInterval);
            this.typingEffectsInterval = null;
        }
    }
    // Create a random typing effect at a random position
    createRandomTypingEffect() {
        if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0)
            return;
        // Randomly select threat data
        const randomThreatIndex = Math.floor(Math.random() * this.threatIntelligenceData.length);
        const randomThreat = this.threatIntelligenceData[randomThreatIndex];
        if (!randomThreat || !randomThreat.items || randomThreat.items.length === 0)
            return;
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
    startTypingAnimationForEffect(effect) {
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
    updateTypingEffects() {
        const now = Date.now();
        this.typingEffects = this.typingEffects.filter(effect => {
            const age = now - effect.startTime;
            if (age < 500) {
                // Fade in (first 0.5 seconds) - faster fade in
                effect.opacity = age / 500;
            }
            else if (age > effect.duration - 800) {
                // Fade out (last 0.8 seconds) - slightly faster fade out
                effect.opacity = (effect.duration - age) / 800;
            }
            else {
                // Full opacity (middle period)
                effect.opacity = 1;
            }
            // Remove effect if it's expired
            return age < effect.duration;
        });
    }
    loadGoogleCharts() {
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
        }
        else {
            google.charts.load('current', { packages: ['geochart'] });
            google.charts.setOnLoadCallback(() => {
                this.chartsLoaded = true;
                this.checkAndInitializeMap();
            });
        }
    }
    checkAndInitializeMap() {
        // If we have both charts and data, initialize the map
        if (this.chartsLoaded && this.locationData && this.locationData.length > 0) {
            this.initializeMapWithLocations();
        }
    }
    initializeMapWithLocations() {
        if (typeof google !== 'undefined' && google.charts) {
            if (this.locationData.length > 0) {
                this.drawMapWithLocations();
            }
            else {
                // Wait for data to be loaded
                // console.log('Waiting for location data to be loaded...'); // Suppressed
            }
        }
    }
    drawMapWithLocations() {
        if (!this.locationData || this.locationData.length === 0)
            return;
        this.fadeState = 'fade-out';
        setTimeout(() => {
            try {
                // Create data table for Google Charts with location data
                const data = google.visualization.arrayToDataTable([
                    ['Country', 'Mentions'],
                    ...this.locationData.map((location) => [
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
            }
            catch (error) {
                console.error('Error drawing map:', error);
                this.hideLoading();
            }
        }, 300); // Reduced from 600ms to 300ms for faster map appearance
    }
    setupGSAPAnimations() {
        if (!this.isBrowser)
            return;
        // Set initial states for animations
        gsap.set('.animate-title', { opacity: 0, y: 30 });
        gsap.set('.animate-subtitle', { opacity: 0, y: 20 });
        // Globe section + heading initial state
        gsap.set('.interactive-globe-section', { opacity: 0, y: 30 });
        gsap.set('.globe-heading', { opacity: 0, y: 10 });
        // Animate line drawing for first section (disabled - requires DrawSVG plugin)
        // gsap.fromTo('.line-path',
        //   { drawSVG: "0%" },
        //   {
        //     drawSVG: "100%",
        //     duration: 2,
        //     ease: "power2.out",
        //     stagger: 0.3,
        //     scrollTrigger: {
        //       trigger: '.landing-extra-content',
        //       start: 'top 20%',
        //       end: 'bottom 0%',
        //       scrub: 1,
        //       toggleActions: 'play none none reverse'
        //     }
        //   }
        // );
        // Animate architectural connections for second section
        gsap.fromTo('.arch-connection', { strokeDasharray: "0 1000", strokeDashoffset: 0 }, {
            strokeDasharray: "1000 0", duration: 2, ease: "power2.out",
            stagger: 0.1,
            scrollTrigger: {
                trigger: '.gsap-animated-section',
                start: 'top 70%',
                end: 'bottom 30%',
                scrub: 1,
                toggleActions: 'play none none reverse'
            }
        });
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
        // Animate all fade-in elements (first section content)
        gsap.fromTo('.fade-in-element', { opacity: 0, y: 30 }, {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.landing-extra-content',
                start: 'top 85%',
                end: 'bottom 15%',
                toggleActions: 'play none none reverse',
                markers: false
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
        gsap.to('.animate-subtitle', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            delay: 0.3,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.animate-subtitle',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate stats with staggered effect (disabled - elements not found)
        // gsap.to('.animate-stat', {
        //   opacity: 1,
        //   y: 0,
        //   duration: 1,
        //   stagger: 0.2,
        //   ease: 'power3.out',
        //   scrollTrigger: {
        //     trigger: '.animated-stats',
        //     start: 'top 70%',
        //     end: 'bottom 30%',
        //     toggleActions: 'play none none reverse'
        //     }
        //   }
        // );
        // Animate feature items with staggered effect (disabled - elements not found)
        // gsap.to('.animate-feature', {
        //   opacity: 1,
        //   y: 0,
        //   duration: 1.2,
        //   stagger: 0.3,
        //   ease: 'power3.out',
        //   scrollTrigger: {
        //     trigger: '.animated-features',
        //     start: 'top 70%',
        //     end: 'bottom 30%',
        //       toggleActions: 'play none none reverse'
        //     }
        //   }
        // );
        // Animate platform cards with staggered effect
        // gsap.to('.platform-card', {
        //   opacity: 1,
        //   y: 0,
        //   duration: 1.2,
        //   stagger: 0.3,
        //   ease: 'power3.out',
        //   scrollTrigger: {
        //     trigger: '.platform-flow',
        //     start: 'top 70%',
        //     end: 'bottom 30%',
        //     toggleActions: 'play none none reverse'
        //   }
        // });
        // Setup platform architecture card highlighting - DISABLED for sleek design
        // this.setupPlatformArchitectureHighlighting();
        // Setup simple fade-in effect for platform architecture cards
        this.setupPlatformArchitectureFadeIn();
        // Animate number counting
        this.animateNumbers();
        // Animate investigation section
        this.setupInvestigationAnimations();
        // Setup fade-in animations for headings and cards
        this.setupScrollFadeAnimations();
        // Setup AI Agent section animations
        this.setupAIAgentAnimations();
    }
    setupPlatformArchitectureHighlighting() {
        if (!this.isBrowser)
            return;
        // Check if we're on mobile - disable highlighting on mobile
        const isMobile = window.innerWidth <= 768;
        if (isMobile)
            return;
        // Get cards by column (left to right)
        const clientCards = Array.from(document.querySelectorAll('.platform-card-1'));
        const targetCards = Array.from(document.querySelectorAll('.platform-card-2'));
        const reportCards = Array.from(document.querySelectorAll('.platform-card-3'));
        const alertCards = Array.from(document.querySelectorAll('.platform-card-4'));
        // Verify all columns have cards before starting animation
        const totalCards = clientCards.length + targetCards.length + reportCards.length + alertCards.length;
        if (totalCards === 0) {
            return;
        }
        const columns = [clientCards, targetCards, reportCards, alertCards];
        // Remove any existing intervals
        if (this.platformHighlightInterval) {
            clearInterval(this.platformHighlightInterval);
        }
        // Function to highlight a random card in a specific column using GSAP
        const highlightRandomCardInColumn = (columnIndex) => {
            const column = columns[columnIndex];
            if (column.length === 0) {
                return;
            }
            // Select a random card from this column
            const randomIndex = Math.floor(Math.random() * column.length);
            const selectedCard = column[randomIndex];
            // Ensure the card element exists and can be modified
            if (selectedCard) {
                // Animate the card highlight with GSAP
                gsap.to(selectedCard, {
                    boxShadow: '0 8px 24px rgba(145, 94, 255, 0.3)',
                    borderColor: '#915eff',
                    backgroundColor: 'rgba(145, 94, 255, 0.08)',
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        // After highlight animation completes, fade it out
                        gsap.to(selectedCard, {
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                            borderColor: '#e2e8f0',
                            backgroundColor: '#ffffff',
                            duration: 0.6,
                            ease: 'power2.inOut',
                            delay: 0.5 // Stay highlighted for 500ms before fading
                        });
                    }
                });
            }
            else {
            }
        };
        // Animation with fade-out effect and cycle delays
        let currentColumn = 0;
        let isInCycle = true;
        const animateNext = () => {
            if (!isInCycle)
                return;
            // Highlight random card in current column
            highlightRandomCardInColumn(currentColumn);
            // Move to next column
            currentColumn = (currentColumn + 1) % columns.length;
            // If we've completed a full cycle, let the last card fade out then start new cycle
            if (currentColumn === 0) {
                isInCycle = false;
                // Let the last card stay highlighted for a moment, then start new cycle
                setTimeout(() => {
                    // Start new cycle after fade-out completes
                    setTimeout(() => {
                        isInCycle = true;
                    }, 1500); // Wait for fade-out transition (400ms) + extra time for effect to wear off
                }, 500); // Keep last card highlighted for 500ms before allowing new cycle
            }
        };
        // Start the animation with a faster interval for smoother transitions
        this.platformHighlightInterval = setInterval(animateNext, 400);
        // Start the initial animation cycle after a short delay to ensure DOM is ready
        setTimeout(() => {
            // Animation is already started by the interval above
        }, 500);
    }
    setupPlatformArchitectureFadeIn() {
        if (!this.isBrowser)
            return;
        // Get all platform column headings
        const platformHeadings = Array.from(document.querySelectorAll('.platform-col-heading'));
        // Get all platform cards including Client, Reports, and all Target and Alert cards
        const platformCards = [
            ...Array.from(document.querySelectorAll('.platform-card-1')),
            ...Array.from(document.querySelectorAll('.platform-card-2')),
            ...Array.from(document.querySelectorAll('.platform-card-3')),
            ...Array.from(document.querySelectorAll('.platform-card-4')) // All alert cards
        ];
        if (platformCards.length === 0)
            return;
        // Set initial state - headings and cards start invisible
        gsap.set(platformHeadings, { opacity: 0, y: 20 });
        gsap.set(platformCards, { opacity: 0, y: 30 });
        // Create a timeline for the fade-in effect
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.platform-architecture-grid',
                start: 'top 90%',
                end: 'top 40%',
                scrub: 1,
                toggleActions: 'play none none reverse',
            }
        });
        // Add headings to the timeline first
        platformHeadings.forEach((heading, index) => {
            tl.to(heading, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out'
            }, index * 0.1); // Faster stagger for headings
        });
        // Add each card to the timeline with staggered fade-in
        platformCards.forEach((card, index) => {
            tl.to(card, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out'
            }, index * 0.15); // Slightly faster stagger for more cards
        });
    }
    animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach((element) => {
            const target = parseInt(element.getAttribute('data-target') || '0');
            const duration = 2;
            ScrollTrigger.create({
                trigger: element,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(element, {
                        innerHTML: target,
                        duration: duration,
                        ease: 'power2.out',
                        snap: { innerHTML: 1 },
                        onUpdate: function () {
                            element.innerHTML = Math.ceil(parseInt(element.innerHTML) || 0).toLocaleString();
                        }
                    });
                }
            });
        });
    }
    setupReconnaissanceAnimations() {
        if (!this.isBrowser)
            return;
        // Check if we're on mobile - disable line animations on mobile
        const isMobile = window.innerWidth <= 768;
        // Set initial states for reconnaissance elements
        gsap.set('.grid-step', { opacity: 0, y: 40 });
        gsap.set('.recon-grid-line', { opacity: 0, scale: 0.8 });
        // Animate each grid line and card in sequence as you scroll using a timeline
        const lines = gsap.utils.toArray('.recon-grid-line');
        const cards = gsap.utils.toArray('.grid-step');
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.reconnaissance-section',
                start: 'top 50%',
                end: 'bottom 70%',
                scrub: 1,
                toggleActions: 'play none none reverse',
            }
        });
        if (!isMobile) {
            /* Desktop: Complex grid layout with lines
               Desired sequence: cards: 1, 2, 3, 6, 5, 4
               lines: 1-2, 2-3, 3-6, 6-5, 5-4                */
            const desktopCardOrder = [cards[0], cards[1], cards[2], cards[5], cards[4], cards[3]];
            const lineOrder = [lines[0], lines[1], lines[2], lines[3], lines[4]]; // ignore the empty 6th polyline
            /* Card 1 */
            tl.to(desktopCardOrder[0], {
                opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
                onStart: () => desktopCardOrder[0].classList.add('active'),
                onReverseComplete: () => desktopCardOrder[0].classList.remove('active')
            }, 0);
            /* Lines + the rest of the cards */
            lineOrder.forEach((line, i) => {
                tl.fromTo(line, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' }, i === 0 ? 0 : '>-0.1');
                const nextCard = desktopCardOrder[i + 1];
                if (nextCard) {
                    tl.to(nextCard, {
                        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
                        onStart: () => nextCard.classList.add('active'),
                        onReverseComplete: () => nextCard.classList.remove('active')
                    }, '>-0.5');
                }
            });
        }
        else {
            /* Mobile: Simple sequential order with connecting lines
               Desired sequence: cards: 1, 2, 3, 4, 5, 6 */
            const mobileCardOrder = [cards[0], cards[1], cards[2], cards[3], cards[4], cards[5]];
            /* Animate cards with connecting lines in sequential order */
            mobileCardOrder.forEach((card, i) => {
                tl.to(card, {
                    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
                    onStart: () => card.classList.add('active'),
                    onReverseComplete: () => card.classList.remove('active')
                }, i === 0 ? 0 : `>+${0.3 + (i - 1) * 0.2}`);
                /* Add connecting line to next card (except for the last card) */
                if (i < mobileCardOrder.length - 1 && lines[i]) {
                    tl.fromTo(lines[i], { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, `>-0.3`);
                }
            });
        }
    }
    setupInvestigationAnimations() {
        if (!this.isBrowser)
            return;
        // Set initial states for investigation elements
        gsap.set('.capability-card', { opacity: 0, y: 30 });
        // Animate capability cards with staggered effect
        gsap.to('.capability-card', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.investigation-capabilities',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse',
            }
        });
    }
    setupAIAgentAnimations() {
        if (!this.isBrowser)
            return;
        // Set initial states for AI Agent elements
        gsap.set('.ai-agent-main-heading', { opacity: 0, y: 30 });
        gsap.set('.ai-agent-subtitle', { opacity: 0, y: 20 });
        gsap.set('.ai-agent-icon', { opacity: 0, scale: 0.8 });
        gsap.set('.ai-agent-section .feature-item', { opacity: 0, y: 40 });
        gsap.set('.ai-agent-cta', { opacity: 0, y: 30 });
        // Create timeline for AI Agent section animations
        const aiAgentTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.ai-agent-section',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse',
                scrub: false,
            }
        });
        // Animate header elements first
        aiAgentTimeline
            .to('.ai-agent-main-heading', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, 0)
            .to('.ai-agent-subtitle', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, 0.2)
            .to('.ai-agent-icon', {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'back.out(1.7)'
        }, 0.4);
        // Animate feature items with staggered effect
        aiAgentTimeline.to('.ai-agent-section .feature-item', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out'
        }, 0.6);
        // Animate CTA section last
        aiAgentTimeline.to('.ai-agent-cta', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, 1.0);
    }
    setupAlertingAnimation() {
        if (!this.isBrowser)
            return;
        // Set initial states for alerting elements
        // gsap.set('.data-source-card', { opacity: 0, y: 30 });
        // gsap.set('.threshold-card', { opacity: 0, y: 40 });
        // gsap.set('.alert-channel', { opacity: 0, y: 40 });
        // gsap.set('.feature-item', { opacity: 0, y: 30 });
        // Animate data sources with staggered effect
        // gsap.to('.data-source-card', {
        //   opacity: 1,
        //   y: 0,
        //   duration: 0.6,
        //   stagger: 0.1,
        //   ease: 'power2.out',
        //   scrollTrigger: {
        //     trigger: '.data-sources-row',
        //     start: 'top 80%',
        //     end: 'bottom 20%',
        //     toggleActions: 'play none none reverse',
        //   }
        // });
        // Animate threshold card
        // gsap.to('.threshold-card', {
        //   opacity: 1,
        //   y: 0,
        //   duration: 0.8,
        //   ease: 'power2.out',
        //   scrollTrigger: {
        //     trigger: '.threshold-row',
        //     start: 'top 80%',
        //     end: 'bottom 20%',
        //     toggleActions: 'play none none reverse',
        //   }
        // });
        // Animate alert channels with staggered effect
        // gsap.to('.alert-channel', {
        //   opacity: 1,
        //   y: 0,
        //   duration: 0.8,
        //   stagger: 0.15,
        //   ease: 'power2.out',
        //   scrollTrigger: {
        //     trigger: '.alert-delivery-row',
        //     start: 'top 80%',
        //     end: 'bottom 20%',
        //     toggleActions: 'play none none reverse',
        //   }
        // });
        // Animate feature items
        // gsap.to('.feature-item', {
        //   opacity: 1,
        //   y: 0,
        //   duration: 0.6,
        //   stagger: 0.1,
        //   ease: 'power2.out',
        //   scrollTrigger: {
        //     trigger: '.alerting-features',
        //     start: 'top 80%',
        //     end: 'bottom 20%',
        //     toggleActions: 'play none none reverse',
        //   }
        // });
        // Setup the alerting flow animation trigger
        // ScrollTrigger.create({
        //   trigger: '.alerting-flow-container',
        //   start: 'top 70%',
        //   onEnter: () => {
        //     this.startAlertingFlow();
        //   }
        // });
    }
    startAlertingFlow() {
        this.isAnimating = true;
        // Reset animation after 8 seconds
        setTimeout(() => {
            this.isAnimating = false;
        }, 8000);
    }
    startLoadingAnimation() {
        if (!this.isBrowser)
            return;
        this.isLoading = true;
        setTimeout(() => {
            if (document.querySelector('.loading-text')) {
                gsap.set('.loading-text', { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' });
            }
            if (document.querySelector('.loading-logo-img')) {
                gsap.set('.loading-logo-img', { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' });
            }
            if (document.querySelector('.loading-container')) {
                gsap.set('.loading-container', { opacity: 0 });
            }
            // Ensure map starts hidden
            if (document.querySelector('#regions_div')) {
                gsap.set('#regions_div', { opacity: 0 });
            }
            if (document.querySelector('.map')) {
                gsap.set('.map', { opacity: 0 });
            }
            this.loadingAnimationTimeline = gsap.timeline();
            if (document.querySelector('.loading-container')) {
                this.loadingAnimationTimeline.to('.loading-container', {
                    opacity: 1,
                    duration: 0.4,
                    ease: 'power2.out'
                }, 0);
            }
            if (document.querySelector('.loading-logo-img')) {
                this.loadingAnimationTimeline.to('.loading-logo-img', {
                    opacity: 1,
                    clipPath: 'inset(0% 0% 0% 0%)',
                    duration: 0.6,
                    ease: 'power2.out'
                }, 0.1);
            }
            if (document.querySelector('.loading-text')) {
                this.loadingAnimationTimeline.to('.loading-text', {
                    opacity: 1,
                    clipPath: 'inset(0% 0% 0% 0%)',
                    duration: 0.6,
                    ease: 'power2.out'
                }, 0.25);
            }
        }, 50);
    }
    startGlowEffect() {
        // Deprecated: glow/glitch effect removed
    }
    hideLoading() {
        if (!this.isBrowser)
            return;
        if (this.loadingAnimationTimeline) {
            this.loadingAnimationTimeline.kill();
            this.loadingAnimationTimeline = null;
        }
        if (this.glitchTimeline) {
            this.glitchTimeline.kill();
            this.glitchTimeline = null;
        }
        if (document.querySelector('.loading-logo-img')) {
            gsap.killTweensOf('.loading-logo-img');
        }
        if (document.querySelector('.loading-text')) {
            gsap.killTweensOf('.loading-text');
        }
        if (document.querySelector('.loading-container')) {
            gsap.killTweensOf('.loading-container');
        }
        if (document.querySelector('.loading-logo-img')) {
            gsap.set('.loading-logo-img', {
                opacity: 1,
                clipPath: 'inset(0% 0% 0% 0%)',
                filter: 'brightness(0) invert(1)'
            });
        }
        if (document.querySelector('.loading-text')) {
            gsap.set('.loading-text', { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' });
        }
        if (document.querySelector('.loading-container')) {
            gsap.set('.loading-container', { opacity: 1 });
        }
        // Smoothly fade in the map
        if (document.querySelector('#regions_div') || document.querySelector('.map')) {
            gsap.to(['#regions_div', '.map'], { opacity: 1, duration: 0.6, ease: 'power2.out' });
        }
        this.isLoading = false;
    }
    preserveContainerConstraints() {
        if (!this.isBrowser)
            return;
        // Add a temporary class to prevent layout shifts
        const sections = document.querySelectorAll('.landing-extra-content, .investigation-section, .alerting-section, .contact-section');
        sections.forEach(section => {
            section.classList.add('preserving-constraints');
        });
    }
    restoreContainerConstraints() {
        if (!this.isBrowser)
            return;
        // Remove the temporary class
        const sections = document.querySelectorAll('.landing-extra-content, .investigation-section, .alerting-section, .contact-section');
        sections.forEach(section => {
            section.classList.remove('preserving-constraints');
        });
    }
    // Contact form handling
    onSubmitContactForm(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        // Get form values
        const name = formData.get('name');
        const email = formData.get('email');
        const company = formData.get('company');
        const inquiryType = formData.get('inquiryType');
        const message = formData.get('message');
        // Validate required fields
        if (!name || !email || !inquiryType || !message) {
            this.snackbar.open('Please fill in all required fields.', 'error');
            return;
        }
        // Prepare payload
        const payload = {
            name: name,
            email: email,
            company: company || undefined,
            inquiryType: inquiryType,
            message: message
        };
        // Remove undefined values
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) {
                delete payload[key];
            }
        });
        // Show loading state
        this.snackbar.open('Sending your message...', 'info');
        // Make API call
        this.http.post('https://api-dev.lunarchain.net/api/v1/contacts/contact', payload)
            .subscribe({
            next: (response) => {
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
                }
                else if (error.status === 429) {
                    errorMessage = 'Too many requests. Please wait a moment before trying again.';
                }
                this.snackbar.open(errorMessage, 'error');
            }
        });
    }
    setupScrollFadeAnimations() {
        if (!this.isBrowser)
            return;
        // Set initial states for all fade-in elements
        gsap.set('.solutions-main-heading, .recon-main-heading, .investigation-main-heading, .alerting-main-heading, .contact-main-heading', {
            opacity: 0,
            y: 30
        });
        gsap.set('.solutions-subtitle, .investigation-subtitle, .alerting-subtitle, .contact-subtitle, .animate-subtitle', {
            opacity: 0,
            y: 20
        });
        gsap.set('.capability-card, .contact-card, .feature-card', {
            opacity: 0,
            y: 40
        });
        gsap.set('.feature-item', {
            opacity: 0,
            y: 30
        });
        gsap.set('.investigation-description', {
            opacity: 0,
            y: 25
        });
        gsap.set('.capabilities-title, .features-title', {
            opacity: 0,
            y: 30
        });
        gsap.set('.highlight-tag', {
            opacity: 0,
            y: 20
        });
        gsap.set('.alerting-image-wrapper', {
            opacity: 0,
            y: 40
        });
        gsap.set('.contact-form', {
            opacity: 0,
            y: 30
        });
        // Animate all section headings with staggered effect
        gsap.to('.solutions-main-heading, .recon-main-heading, .investigation-main-heading, .alerting-main-heading, .contact-main-heading', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.2,
            scrollTrigger: {
                trigger: '.solutions-main-heading, .recon-main-heading, .investigation-main-heading, .alerting-main-heading, .contact-main-heading',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate all subtitles with staggered effect
        gsap.to('.solutions-subtitle, .investigation-subtitle, .alerting-subtitle, .contact-subtitle, .animate-subtitle', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.15,
            scrollTrigger: {
                trigger: '.solutions-subtitle, .recon-subtitle, .investigation-subtitle, .alerting-subtitle, .contact-subtitle, .animate-subtitle',
                start: 'top 85%',
                end: 'bottom 15%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate capability cards with staggered effect
        gsap.to('.capability-card', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.3,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.solutions-section',
                start: 'top 70%',
                end: 'bottom 30%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate feature cards with staggered effect
        gsap.to('.feature-card', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.3,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.landing-extra-content',
                start: 'top 70%',
                end: 'bottom 30%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate investigation description
        gsap.to('.investigation-description', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.investigation-description',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate capabilities and features titles
        gsap.to('.capabilities-title, .features-title', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.capabilities-title, .features-title',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate highlight tags with staggered effect
        gsap.to('.highlight-tag', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.investigation-highlights',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate alerting image
        gsap.to('.alerting-image-wrapper', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.alerting-image-wrapper',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate feature items with staggered effect
        gsap.to('.feature-item', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.3,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.alerting-section',
                start: 'top 70%',
                end: 'bottom 30%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate contact cards with staggered effect
        gsap.to('.contact-card', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.contact-section',
                start: 'top 70%',
                end: 'bottom 30%',
                toggleActions: 'play none none reverse'
            }
        });
        // Animate contact form
        gsap.to('.contact-form', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.contact-form',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
    }
    startThreatIntelligenceCycle() {
        this.stopThreatIntelligenceCycle();
        if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0)
            return;
        this.threatCycleInterval = setInterval(() => {
            try {
                if (this.threatIntelligenceData.length > 0) {
                    this.currentThreatIndex = (this.currentThreatIndex + 1) % this.threatIntelligenceData.length;
                    this.updateCurrentThreatData();
                }
            }
            catch (err) {
                console.error('Error in threat intelligence cycling interval:', err);
                this.stopThreatIntelligenceCycle();
            }
        }, 8000); // Change threat type every 8 seconds
    }
    stopThreatIntelligenceCycle() {
        if (this.threatCycleInterval) {
            clearInterval(this.threatCycleInterval);
            this.threatCycleInterval = null;
        }
        if (this.itemCycleInterval) {
            clearInterval(this.itemCycleInterval);
            this.itemCycleInterval = null;
        }
    }
    updateCurrentThreatData() {
        if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0)
            return;
        const currentThreat = this.threatIntelligenceData[this.currentThreatIndex];
        if (currentThreat) {
            this.currentThreatType = currentThreat.type;
            this.currentThreatItems = currentThreat.items || [];
            this.currentItemIndex = 0;
            this.startItemCycle();
        }
    }
    startItemCycle() {
        this.stopItemCycle();
        if (!this.currentThreatItems || this.currentThreatItems.length === 0)
            return;
        this.itemCycleInterval = setInterval(() => {
            try {
                if (this.currentThreatItems.length > 0) {
                    this.currentItemIndex = (this.currentItemIndex + 1) % this.currentThreatItems.length;
                }
            }
            catch (err) {
                console.error('Error in item cycling interval:', err);
                this.stopItemCycle();
            }
        }, 4000); // Change item every 4 seconds
    }
    stopItemCycle() {
        if (this.itemCycleInterval) {
            clearInterval(this.itemCycleInterval);
            this.itemCycleInterval = null;
        }
    }
    updateCurrentLocationData() {
        if (!this.locationData || this.locationData.length === 0)
            return;
        const currentLocation = this.locationData[this.currentLocationIndex];
        if (currentLocation) {
            this.typedLocationName = currentLocation.name || 'Unknown Location';
            this.startLocationNameTyping();
        }
    }
    startLocationCycle() {
        this.stopLocationCycle();
        if (!this.locationData || this.locationData.length === 0)
            return;
        this.locationCycleInterval = setInterval(() => {
            try {
                if (this.locationData.length > 0) {
                    this.currentLocationIndex = (this.currentLocationIndex + 1) % this.locationData.length;
                    this.updateCurrentLocationData();
                }
            }
            catch (err) {
                console.error('Error in location cycling interval:', err);
                this.stopLocationCycle();
            }
        }, 6000); // Change location every 6 seconds
    }
    stopLocationCycle() {
        if (this.locationCycleInterval) {
            clearInterval(this.locationCycleInterval);
            this.locationCycleInterval = null;
        }
    }
    startLocationNameTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        this.typedLocationName = '';
        if (!this.typedLocationName)
            return;
        let i = 0;
        const text = this.typedLocationName;
        const typeNext = () => {
            if (i <= text.length) {
                this.typedLocationName = text.slice(0, i);
                i++;
                this.typingTimeout = setTimeout(typeNext, 18 + Math.random() * 32);
            }
        };
        typeNext();
    }
};
__decorate([
    ViewChild(LandingGlobeComponent)
], LandingPageComponent.prototype, "globeComp", void 0);
__decorate([
    HostListener('window:scroll')
], LandingPageComponent.prototype, "onWindowScroll", null);
LandingPageComponent = __decorate([
    Component({
        selector: 'app-landing-page',
        templateUrl: './landing-page.component.html',
        styleUrls: ['./landing-page.component.scss'],
        animations: [
            trigger('iocItem', [
                transition(':enter', [
                    style({ opacity: 0, transform: 'translateY(8px)' }),
                    animate('280ms 30ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
                ]),
                transition(':leave', [
                    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))
                ])
            ]),
            trigger('iocList', [
                transition(':enter', [
                    query('.ioc-item', [
                        style({ opacity: 0, transform: 'translateY(8px)' }),
                        stagger(60, animate('320ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
                    ], { optional: true })
                ])
            ])
        ]
    }),
    __param(2, Inject(PLATFORM_ID))
], LandingPageComponent);
export { LandingPageComponent };
//# sourceMappingURL=landing-page.component.js.map
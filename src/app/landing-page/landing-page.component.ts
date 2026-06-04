import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy, Renderer2, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { trigger, style, animate, transition, query, stagger } from '@angular/animations';
import { InteractiveGlobeComponent } from '../interactive-globe/interactive-globe.component';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GlobalSnackbarService } from '../shared/global-snackbar/global-snackbar.service';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import * as d3 from 'd3';
import { sankey as createD3Sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import { environment } from '../../environments/environment';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

declare var google: any;

interface ReconSankeyGradient {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  from: string;
  via: string;
  to: string;
}

interface ReconSankeyLinkView {
  path: string;
  width: number;
  sheenWidth: number;
  shadowWidth: number;
  gradientId: string;
}

interface ReconSankeyNodeView {
  id: string;
  type: string;
  primary: string;
  secondary: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerY: number;
  labelX: number;
  labelY: number;
  labelWidth: number;
  secondaryY: number;
  color: string;
  visible: boolean;
}

@Component({
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
  selectedCountryReport: string | null = null;

  isBrowser: boolean = false;
  isMobileMenuOpen: boolean = false;
  isMobile: boolean = false;
  showLoginButton: boolean = false;
  isTaskbarScrolled: boolean = false;
  private suppressTaskbarSyncUntil = 0;
  expandedCards: boolean[] = [false, false, false];

  // Location data from graph API
  locationData: any[] = [];
  currentLocationIndex: number = 0;
  typedLocationName: string = '';
  private locationCycleInterval: any;

  // New threat intelligence properties
  threatIntelligenceData: any[] = [];
  currentThreatType: string | null = null;
  currentThreatItems: any[] = [];
  currentThreatIndex: number = 0;
  currentItemIndex: number = 0;
  typedThreatSummary: string = '';
  private threatCycleInterval: any;
  private itemCycleInterval: any;

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

  // Chart data properties
  sentimentData: any[] = [];
  threatActorData: any[] = [];
  
  // Chart dimensions - adjusted for side-by-side display
  sentimentChartView: [number, number] = [400, 300];
  pieChartView: [number, number] = [400, 300];
  barChartView: [number, number] = [400, 300];

  // Chart options
  sentimentChartOptions = {
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

  currentTargetIndex: number = 0;
  targetCycleInterval: any;
  chartsLoaded = false;
  pendingTargets: any[] = [];
  readonly reconSankeyLayout = this.createReconSankeyLayout();
  readonly reconSankeyNodes = this.reconSankeyLayout.nodes;
  readonly reconSankeyLinks = this.reconSankeyLayout.links;
  readonly reconSankeyGradients = this.reconSankeyLayout.gradients;
  readonly reconDomainNodes = this.reconSankeyNodes.filter((node) => node.type === 'domain');
  readonly reconSourceNodes = this.reconSankeyNodes.filter((node) => node.type === 'source');
  readonly reconAnalyticsNodes = this.reconSankeyNodes.filter((node) => node.type === 'core');
  readonly reconDestinationNodes = this.reconSankeyNodes.filter((node) => node.type === 'destination');

  // List of country names for matching in summaries
  private countryList = [
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

  private typingTimeout: any;
  typedTargetName: string = '';
  private targetNameTypingTimeout: any;
  fadeState = 'fade-in';
  private parallaxLineAnimationFrame: any;
  isAnimating = false;
  isLoading = false; // Start hidden
  private loadingAnimationTimeline: any;
  private platformHighlightInterval: any;
  private platformBreakTimer: any;
  private viewInitDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private containerRestoreTimer: ReturnType<typeof setTimeout> | null = null;
  private navigationScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private typingEffectsAnimationFrame: number | null = null;
  private isDestroyed = false;
  private readonly reconResizeHandler = () => this.updateReconLinePointsToCardCenters();
  private readonly investigationResizeHandler = () => this.updateInvestigationLinePointsToCardCenters();
  private readonly mobileDetectionResizeHandler = () => this.handleViewportResize();
  private readonly nativeMobileScrollClass = 'landing-native-mobile-scroll';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private snackbar: GlobalSnackbarService,
    private renderer: Renderer2
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

  private createReconSankeyLayout(): {
    nodes: ReconSankeyNodeView[];
    links: ReconSankeyLinkView[];
    gradients: ReconSankeyGradient[];
  } {
    const domainData = [
      {
        id: 'cyber',
        label: 'Cyber Threat Intelligence',
        metric: 'Actors, malware, IOCs',
        color: '#915eff'
      },
      {
        id: 'geopolitical',
        label: 'Military & Geopolitical Activity',
        metric: 'Operations, regions, incidents',
        color: '#38bdf8'
      },
      {
        id: 'risk',
        label: 'Brand, Supply Chain & Regional Risk',
        metric: 'Exposure, vendors, disruption',
        color: '#14b8a6'
      }
    ];

    const sourceData = [
      { id: 'rss', label: 'RSS & Advisories', metric: '', value: 23, color: '#8b5cf6' },
      { id: 'forums', label: 'Forums & Dark Web', metric: '', value: 16, color: '#915eff' },
      { id: 'social', label: 'Social & Regional Signals', metric: '', value: 19, color: '#60a5fa' },
      { id: 'leaks', label: 'Leaks & Paste Sites', metric: '', value: 12, color: '#d196e6' },
      { id: 'malware', label: 'Malware & CVE Feeds', metric: '', value: 15, color: '#38bdf8' },
      { id: 'field', label: 'News & Field Reporting', metric: '', value: 15, color: '#14b8a6' }
    ];

    const sourceNodes = sourceData.map((source) => ({ ...source, type: 'source' }));
    const sourceTotal = sourceNodes.reduce((total, source) => total + source.value, 0);
    const destinationBase = [
      { id: 'investigations', label: 'Investigations', metric: 'Entity graph search & analyst workflows', value: 34, color: '#915eff' },
      { id: 'alerting', label: 'Alerting', metric: 'Continuous monitoring & signal routing', value: 33, color: '#60a5fa' },
      { id: 'delivery', label: 'API & MCP', metric: 'Integrations for tools and agents', value: 33, color: '#14b8a6' }
    ];
    const destinationTotal = destinationBase.reduce((total, destination) => total + destination.value, 0);
    const destinations = destinationBase.map((destination) => ({
      ...destination,
      type: 'destination',
      value: destination.value * (sourceTotal / destinationTotal)
    }));

    const nodes = [
      ...domainData.map(({ id, label, metric, color }) => ({ id, label, metric, type: 'domain', color })),
      ...sourceNodes.map(({ id, label, metric, type, color }) => ({ id, label, metric, type, color })),
      { id: 'lunarchain', label: 'Intelligence Analytics', metric: '', type: 'core', color: '#14b8a6' },
      ...destinations.map(({ id, label, metric, type, color }) => ({ id, label, metric, type, color }))
    ];

    const links = [
      { source: 'cyber', target: 'rss', value: 8, from: '#915eff', via: '#bca6ff', to: '#8b5cf6' },
      { source: 'cyber', target: 'forums', value: 9, from: '#915eff', via: '#bca6ff', to: '#915eff' },
      { source: 'cyber', target: 'social', value: 5, from: '#915eff', via: '#60a5fa', to: '#60a5fa' },
      { source: 'cyber', target: 'leaks', value: 5, from: '#915eff', via: '#d196e6', to: '#d196e6' },
      { source: 'cyber', target: 'malware', value: 15, from: '#915eff', via: '#38bdf8', to: '#38bdf8' },
      { source: 'geopolitical', target: 'rss', value: 8, from: '#38bdf8', via: '#60a5fa', to: '#8b5cf6' },
      { source: 'geopolitical', target: 'forums', value: 3, from: '#38bdf8', via: '#60a5fa', to: '#915eff' },
      { source: 'geopolitical', target: 'social', value: 9, from: '#38bdf8', via: '#60a5fa', to: '#60a5fa' },
      { source: 'geopolitical', target: 'field', value: 10, from: '#38bdf8', via: '#14b8a6', to: '#14b8a6' },
      { source: 'risk', target: 'rss', value: 7, from: '#14b8a6', via: '#38bdf8', to: '#8b5cf6' },
      { source: 'risk', target: 'forums', value: 4, from: '#14b8a6', via: '#60a5fa', to: '#915eff' },
      { source: 'risk', target: 'social', value: 5, from: '#14b8a6', via: '#38bdf8', to: '#60a5fa' },
      { source: 'risk', target: 'leaks', value: 7, from: '#14b8a6', via: '#d196e6', to: '#d196e6' },
      { source: 'risk', target: 'field', value: 5, from: '#14b8a6', via: '#38bdf8', to: '#14b8a6' },
      ...sourceNodes.map((source) => ({
        source: source.id,
        target: 'lunarchain',
        value: source.value,
        from: source.color,
        via: '#38bdf8',
        to: '#14b8a6'
      })),
      ...destinations.map((destination) => ({
        source: 'lunarchain',
        target: destination.id,
        value: destination.value,
        from: '#14b8a6',
        via: destination.id === 'investigations' ? '#bca6ff' : destination.id === 'alerting' ? '#60a5fa' : '#38bdf8',
        to: destination.color
      }))
    ];

    const sankeyViewBoxWidth = 1500;
    const sankeyLayoutWidth = 870;
    const sankeyLayoutCenterX = sankeyViewBoxWidth / 2;
    const sankeyLayoutLeftX = sankeyLayoutCenterX - sankeyLayoutWidth / 2;
    const sankeyLayoutRightX = sankeyLayoutCenterX + sankeyLayoutWidth / 2;

    const sankeyGenerator = createD3Sankey()
      .nodeId((node: any) => node.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(10)
      .nodePadding(22)
      .nodeSort(null)
      .linkSort(null)
      .extent([[sankeyLayoutLeftX, 112], [sankeyLayoutRightX, 442]]);

    const graph = sankeyGenerator({
      nodes: nodes.map((node) => ({ ...node })),
      links: links.map((link) => ({ ...link }))
    });
    const linkPath = sankeyLinkHorizontal();

    const renderedLinks = graph.links.map((link: any, index: number): ReconSankeyLinkView => {
      const width = Math.max(2.25, (Number(link.width) || 3) * 0.62);
      return {
        path: linkPath(link),
        width,
        sheenWidth: Math.max(1.5, width * 0.44),
        shadowWidth: width + 8,
        gradientId: `recon-sankey-gradient-${index}`
      };
    });

    const gradients = graph.links.map((link: any, index: number): ReconSankeyGradient => ({
      id: `recon-sankey-gradient-${index}`,
      x1: Number(link.source?.x1) || 0,
      y1: Number(link.y0) || 0,
      x2: Number(link.target?.x0) || 0,
      y2: Number(link.y1) || 0,
      from: link.from,
      via: link.via,
      to: link.to
    }));

    const renderedNodes = graph.nodes.map((node: any): ReconSankeyNodeView => {
      const x = Number(node.x0) || 0;
      const y = Number(node.y0) || 0;
      const width = Math.max(4, (Number(node.x1) || 0) - x);
      const height = Math.max(4, (Number(node.y1) || 0) - y);
      const centerY = y + height / 2;
      const isDomain = node.type === 'domain';
      const isSource = node.type === 'source';
      const isDestination = node.type === 'destination';
      const isCore = node.type === 'core';
      const labelX = isCore ? x + width / 2 : isDestination ? 1228 : isSource ? x + width + 34 : 58;
      const labelY = isCore ? y - 14 : isDestination ? centerY - 5 : isDomain ? centerY - 9 : centerY + 4;
      const labelWidth = isSource ? Math.ceil(Math.max(92, node.label.length * 7.1 + 34)) : 0;

      return {
        id: node.id,
        type: node.type,
        primary: node.label,
        secondary: isCore || isSource ? '' : node.metric,
        x,
        y,
        width,
        height,
        centerY,
        labelX,
        labelY,
        labelWidth,
        secondaryY: isCore ? 101 : isDestination ? centerY + 16 : isDomain ? centerY + 11 : centerY + 13,
        color: node.color,
        visible: true
      };
    });

    return {
      nodes: renderedNodes,
      links: renderedLinks,
      gradients
    };
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
      this.selectedCountryReport = null;
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
  ngOnInit(): void {
    // Suppress Google Maps API warnings globally when no API key is configured
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = function(...args) {
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
    
    console.error = function(...args) {
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

  private buildLandingGlobeLightweightAql(): string {
    return `LET recentReports = (
  FOR reportDoc IN nodes_vertex_collection
    FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
      AND reportDoc.created >= "1970-01-01T00:00:00Z"
      AND reportDoc.created <= DATE_ISO8601(DATE_NOW())
    SORT reportDoc.modified DESC
    LIMIT 70
    RETURN reportDoc
)

LET candidateReports = (
  FOR reportDoc IN recentReports
    LET locationInfo = FIRST(
      FOR v IN 1..1 ANY reportDoc._id GRAPH 'lunargraph_graph'
        FILTER v.type == "location"
        LET countryCode = v.country ? UPPER(TRIM(TO_STRING(v.country))) : null
        SORT countryCode != null AND countryCode != "" DESC, v.modified DESC
        LIMIT 1
        RETURN {
          country: countryCode,
          name: v.name
        }
    )
    FILTER locationInfo != null AND locationInfo.country != null AND locationInfo.country != ""
    LIMIT 12
    RETURN {
      reportDoc,
      normalizedLocation: locationInfo
    }
)

FOR candidate IN candidateReports
  LET reportDoc = candidate.reportDoc
  LET normalizedLocation = candidate.normalizedLocation

  LET hasMatchingEntities = LENGTH(
    FOR entity, e IN 1..1 OUTBOUND reportDoc._id GRAPH 'lunargraph_graph'
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : null)))
      FILTER relType IN ["object", "references", "related-to", "uses", "targets", "attributed-to", "indicates", "located-at", "duplicate-of", "correlates-with"]
      FILTER entity.type IN ["indicator", "domain-name", "url", "ipv4-addr", "file", "email-addr", "windows-registry-key", "tool", "malware", "attack-pattern", "campaign", "intrusion-set", "threat-actor", "identity", "relationship", "marking-definition", "infrastructure", "course-of-action", "organization", "directory", "phone-number", "email-message", "software", "vulnerability", "location"]
      LIMIT 1
      RETURN 1
  ) > 0

  FILTER hasMatchingEntities

  LET source_name = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "x_source_name"
      RETURN ref.description
  )

  LET source_link = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "source_link"
      RETURN ref.url
  )

  LET entities = (
    FOR entity, e IN 1..1 OUTBOUND reportDoc._id GRAPH 'lunargraph_graph'
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, "type") ? e.type : null)))
      FILTER relType IN ["object", "references", "related-to", "uses", "targets", "attributed-to", "indicates", "located-at", "duplicate-of", "correlates-with"]
      FILTER entity.type IN ["indicator", "domain-name", "url", "ipv4-addr", "file", "email-addr", "windows-registry-key", "tool", "malware", "attack-pattern", "campaign", "intrusion-set", "threat-actor", "identity", "relationship", "marking-definition", "infrastructure", "course-of-action", "organization", "directory", "phone-number", "email-message", "software", "vulnerability", "location"]
      LIMIT 24
      RETURN DISTINCT {
        type: entity.type,
        name: entity.name,
        value: entity.value,
        pattern: entity.pattern,
        modified: entity.modified,
        report: reportDoc.name,
        source_name: source_name,
        source_link: source_link
      }
  )

  FILTER LENGTH(entities) > 0

  COLLECT locCountry = normalizedLocation.country, locName = normalizedLocation.name INTO grouped = {
    reportDoc,
    sourceName: source_name,
    sourceLink: source_link,
    entities
  }

  LET nodes_vertex_collection = (
    FOR entry IN grouped
      LET doc = entry.reportDoc
      LET detailEntities = SLICE(entry.entities, 0, 24)
      RETURN {
        id: doc._id,
        name: doc.name,
        modified: doc.modified,
        sourceName: entry.sourceName,
        sourceLink: entry.sourceLink,
        entities: detailEntities
      }
  )

  LET highlightIocs = SLICE(
    UNIQUE(
      FOR rep IN nodes_vertex_collection
        FOR ent IN rep.entities
          RETURN {
            type: ent.type,
            name: ent.name,
            value: ent.value,
            pattern: ent.pattern,
            modified: ent.modified,
            report: ent.report,
            source_name: ent.source_name,
            source_link: ent.source_link
          }
    ), 0, 8)

  RETURN {
    location: locCountry,
    locationName: locName,
    locationCode: locCountry,
    report: LENGTH(nodes_vertex_collection) > 0 ? nodes_vertex_collection[0].name : null,
    nodes_vertex_collection,
    highlightIocs
  }`;
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
        
        this.updateReconLinePointsToCardCenters();
        this.updateInvestigationLinePointsToCardCenters();
        this.setupGSAPAnimations();
        this.setupAlertingAnimation();
        
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
          window.addEventListener('resize', this.reconResizeHandler);
          window.addEventListener('resize', this.investigationResizeHandler);
          window.addEventListener('resize', this.mobileDetectionResizeHandler);
        }
      }, 300); // Increased delay to 300ms
    }

    this.consumeNavigationScrollTarget();

    this.route.fragment.subscribe((fragment) => {
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
    this.stopThreatIntelligenceCycle();
    this.stopLocationCycle();
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
      window.removeEventListener('resize', this.reconResizeHandler);
      window.removeEventListener('resize', this.investigationResizeHandler);
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

  private updateReconLinePointsToCardCenters(): void {
    // Get the grid container
    const grid = document.querySelector('.recon-steps.grid') as HTMLElement;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('.recon-step.grid-step')) as HTMLElement[];
    if (cards.length !== 6) return;
    const svg = grid.previousElementSibling as SVGSVGElement;
    if (!svg) return;
    
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
    if (polylines.length !== 6) return;
    
    if (!isMobile) {
      // Desktop: Complex grid layout
    // 1 to 2
    polylines[0].setAttribute('points', `${centers[0].x},${centers[0].y} ${(centers[0].x + centers[1].x)/2},${centers[0].y} ${centers[1].x},${centers[1].y}`);
    // 2 to 3
    polylines[1].setAttribute('points', `${centers[1].x},${centers[1].y} ${(centers[1].x + centers[2].x)/2},${centers[1].y} ${centers[2].x},${centers[2].y}`);
    // 3 down to 6 (elbow at x3, midway y)
    const midY = (centers[2].y + centers[5].y)/2;
    polylines[2].setAttribute('points', `${centers[2].x},${centers[2].y} ${centers[2].x},${midY} ${centers[5].x},${midY} ${centers[5].x},${centers[5].y}`);
    // 6 to 5
    polylines[3].setAttribute('points', `${centers[5].x},${centers[5].y} ${(centers[5].x + centers[4].x)/2},${centers[5].y} ${centers[4].x},${centers[4].y}`);
    // 5 to 4
    polylines[4].setAttribute('points', `${centers[4].x},${centers[4].y} ${(centers[4].x + centers[3].x)/2},${centers[4].y} ${centers[3].x},${centers[3].y}`);
    // Remove the last line (no upward turn)
    polylines[5].setAttribute('points', '');
    } else {
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

  private updateInvestigationLinePointsToCardCenters(): void {
    if (!this.isBrowser) return;
    
    setTimeout(() => {
      const gridContainer = document.querySelector('.investigation-steps-svg-wrapper') as HTMLElement;
      const cards = document.querySelectorAll('.investigation-section .grid-step') as NodeListOf<HTMLElement>;
      const lines = document.querySelectorAll('.investigation-grid-line') as NodeListOf<SVGElement>;
      
      if (!gridContainer || cards.length === 0 || lines.length === 0) return;
      
      const containerRect = gridContainer.getBoundingClientRect();
      const cardCenters: { x: number, y: number }[] = [];
      
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
      '.animate-title, .animate-subtitle, .interactive-globe-section, .globe-heading, .arch-connection, .mission-section *, .product-suite-section *, .solutions-section *, .custom-operations-section *, .contact-section *, .landing-footer *'
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

  // Open Instagram
  followInstagram() {
    if (this.isBrowser && typeof window !== 'undefined') {
      window.open('https://instagram.com/lunarchainco', '_blank');
    }
  }



  loadThreatIntelligenceData(): void {
    this.http.get(`${environment.apiUrl}/api/${environment.apiVersion}/graph/public/landing-threat-intelligence`)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response?.data)) {
            this.threatIntelligenceData = response.data.filter((item: any) => item.type !== 'location');
            this.locationData = response.data.find((item: any) => item.type === 'location')?.items || [];
            
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
            } else {
              // Charts not ready yet, wait for them
              // console.log('Charts not ready yet, waiting...'); // Suppressed
            }
            
            // Also check if we can initialize the map now
            this.checkAndInitializeMap();
          } else {
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
  startRandomThreatIntelligenceCycle(): void {
    this.stopThreatIntelligenceCycle();
    if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0) return;
    
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
      } catch (err) {
        console.error('Error in random threat intelligence cycling interval:', err);
        this.stopThreatIntelligenceCycle();
      }
    }, 5000); // Change every 5 seconds for more dynamic feel
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
      } else {
        // Wait for data to be loaded
        // console.log('Waiting for location data to be loaded...'); // Suppressed
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
    const animateSubtitles = gsap.utils.toArray<HTMLElement>('.animate-subtitle');
    gsap.set('.animate-title', { opacity: 0, y: 30 });
    if (animateSubtitles.length > 0) {
      gsap.set(animateSubtitles, { opacity: 0, y: 20 });
    }
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

    if (animateSubtitles.length > 0) {
      gsap.to(animateSubtitles, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        delay: 0.3,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: animateSubtitles[0],
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      });
    }

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
    
    // Animate mission section and intelligence domain cards
    this.setupMissionAnimations();

    // Setup simple fade-in effect for product panels
    this.setupProductSuiteFadeIn();

    // Animate number counting
    this.animateNumbers();

    // Keep everything from Our Solutions onward on a single, section-scoped animation system.
    this.setupSolutionsAndBelowAnimations();
  }

  private setupPlatformArchitectureHighlighting(): void {
    if (!this.isBrowser) return;

    // Check if we're on mobile - disable highlighting on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;

    // Get cards by column (left to right)
    const clientCards = Array.from(document.querySelectorAll('.platform-card-1')) as HTMLElement[];
    const targetCards = Array.from(document.querySelectorAll('.platform-card-2')) as HTMLElement[];
    const reportCards = Array.from(document.querySelectorAll('.platform-card-3')) as HTMLElement[];
    const alertCards = Array.from(document.querySelectorAll('.platform-card-4')) as HTMLElement[];



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
    const highlightRandomCardInColumn = (columnIndex: number) => {
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

      } else {

      }
    };

    // Animation with fade-out effect and cycle delays
    let currentColumn = 0;
    let isInCycle = true;
    
    const animateNext = () => {
      if (!isInCycle) return;
      
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
    const cardIcons = cards
      .map((card) => card.querySelector('.feature-icon'))
      .filter((target): target is Element => Boolean(target));
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
      ...cardIcons,
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
    gsap.set(cardIcons, { opacity: 0 });
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
      const icon = card.querySelector('.feature-icon');
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

      if (icon) {
        tl.to(icon, {
          opacity: 1,
          duration: 0.36,
          ease: 'power2.out'
        }, offset + 0.06);
      }

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

  private animateNumbers(): void {
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
            onUpdate: function() {
              element.innerHTML = Math.ceil(parseInt(element.innerHTML) || 0).toLocaleString();
            }
          });
        }
      });
    });
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

  private setupReconnaissanceAnimations(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.reconnaissance-section') as HTMLElement | null;
    if (!section) return;

    const copyItems = this.sectionTargets(
      section,
      '.recon-eyebrow, .recon-main-heading, .recon-subheading, .recon-tag'
    );
    const sankeyNodes = this.sectionTargets(section, '.recon-sankey-node');
    const sankeyLinks = this.sectionTargets(
      section,
      '.recon-sankey-link-shadow, .recon-sankey-link, .recon-liquid-wave'
    );
    const sankeyLabels = this.sectionTargets(section, '.recon-svg-label');

    const targets = [
      ...copyItems,
      ...sankeyNodes,
      ...sankeyLinks,
      ...sankeyLabels
    ].filter((target): target is HTMLElement => Boolean(target));

    if (targets.length === 0) return;

    if (this.prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    gsap.set(copyItems, {
      autoAlpha: 0,
      y: 24,
      filter: 'blur(6px)',
      willChange: 'transform, opacity, filter'
    });
    gsap.set(sankeyNodes, {
      autoAlpha: 0,
      scaleY: 0.64,
      transformOrigin: '50% 50%',
      willChange: 'transform, opacity'
    });
    gsap.set(sankeyLinks, { autoAlpha: 0, willChange: 'opacity' });
    gsap.set(sankeyLabels, {
      autoAlpha: 0,
      y: 14,
      willChange: 'transform, opacity'
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 76%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    });

    tl.to(copyItems, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.62,
      stagger: 0.075,
      ease: 'power3.out'
    }, 0);

    tl.to(sankeyNodes, {
      autoAlpha: 1,
      scaleY: 1,
      duration: 0.54,
      stagger: 0.035,
      ease: 'power3.out'
    }, 0.18);

    tl.to(sankeyLinks, {
      autoAlpha: 1,
      duration: 0.82,
      stagger: 0.025,
      ease: 'power2.out'
    }, 0.26);

    tl.to(sankeyLabels, {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.035,
      ease: 'power2.out'
    }, 0.44);
  }

  private setupInvestigationAnimations(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.investigation-section') as HTMLElement | null;
    if (!section) return;

    const copyItems = this.sectionTargets(
      section,
      '.solution-eyebrow, .solution-main-heading, .solution-description, .solution-tag'
    );
    const capabilitiesTitle = section.querySelector('.capabilities-title') as HTMLElement | null;
    const cards = this.sectionTargets(section, '.capability-card');
    const cardDetails = cards.flatMap((card) => [
      card.querySelector('.capability-icon'),
      card.querySelector('h3'),
      card.querySelector('p')
    ].filter((target): target is Element => Boolean(target)));

    const targets = [
      ...copyItems,
      capabilitiesTitle,
      ...cards,
      ...cardDetails
    ].filter((target): target is HTMLElement | Element => Boolean(target));

    if (targets.length === 0) return;

    if (this.prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    gsap.set(copyItems, {
      autoAlpha: 0,
      y: 24,
      filter: 'blur(6px)',
      willChange: 'transform, opacity, filter'
    });
    if (capabilitiesTitle) {
      gsap.set(capabilitiesTitle, {
        autoAlpha: 0,
        y: 24,
        filter: 'blur(6px)',
        willChange: 'transform, opacity, filter'
      });
    }
    gsap.set(cards, {
      autoAlpha: 0,
      y: 34,
      scale: 0.985,
      willChange: 'transform, opacity'
    });
    gsap.set(cardDetails, {
      autoAlpha: 0,
      y: 14,
      willChange: 'transform, opacity'
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 76%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    });

    tl.to(copyItems, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.62,
      stagger: 0.075,
      ease: 'power3.out'
    }, 0);

    if (capabilitiesTitle) {
      tl.to(capabilitiesTitle, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.58,
        ease: 'power3.out'
      }, 0.44);
    }

    cards.forEach((card, index) => {
      const details = [
        card.querySelector('.capability-icon'),
        card.querySelector('h3'),
        card.querySelector('p')
      ].filter((target): target is Element => Boolean(target));
      const offset = 0.68 + index * 0.11;

      tl.to(card, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.62,
        ease: 'power3.out'
      }, offset);

      if (details.length > 0) {
        tl.to(details, {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.045,
          ease: 'power2.out'
        }, offset + 0.08);
      }
    });
  }

  private setupAlertingAnimations(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.alerting-section') as HTMLElement | null;
    if (!section) return;

    const copyItems = this.sectionTargets(
      section,
      '.solution-eyebrow, .solution-main-heading, .solution-description, .solution-tag'
    );
    const featuresTitle = section.querySelector('.features-title') as HTMLElement | null;
    const cards = this.sectionTargets(section, '.feature-item');
    const cardDetails = cards.flatMap((card) => [
      card.querySelector('.feature-icon'),
      card.querySelector('h3'),
      card.querySelector('p')
    ].filter((target): target is Element => Boolean(target)));

    const targets = [
      ...copyItems,
      featuresTitle,
      ...cards,
      ...cardDetails
    ].filter((target): target is Element => Boolean(target));

    if (targets.length === 0) return;

    if (this.prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    gsap.set(copyItems, {
      autoAlpha: 0,
      y: 24,
      filter: 'blur(6px)',
      willChange: 'transform, opacity, filter'
    });
    if (featuresTitle) {
      gsap.set(featuresTitle, {
        autoAlpha: 0,
        y: 24,
        filter: 'blur(6px)',
        willChange: 'transform, opacity, filter'
      });
    }
    gsap.set(cards, {
      autoAlpha: 0,
      y: 34,
      scale: 0.985,
      willChange: 'transform, opacity'
    });
    gsap.set(cardDetails, {
      autoAlpha: 0,
      y: 14,
      willChange: 'transform, opacity'
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 76%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    });

    tl.to(copyItems, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.62,
      stagger: 0.075,
      ease: 'power3.out'
    }, 0);

    if (featuresTitle) {
      tl.to(featuresTitle, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.58,
        ease: 'power3.out'
      }, 0.42);
    }

    cards.forEach((card, index) => {
      const details = [
        card.querySelector('.feature-icon'),
        card.querySelector('h3'),
        card.querySelector('p')
      ].filter((target): target is Element => Boolean(target));
      const offset = 0.66 + index * 0.11;

      tl.to(card, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.62,
        ease: 'power3.out'
      }, offset);

      if (details.length > 0) {
        tl.to(details, {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.045,
          ease: 'power2.out'
        }, offset + 0.08);
      }
    });
  }

  private setupAIAgentAnimations(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.ai-agent-section') as HTMLElement | null;
    if (!section) return;

    const copyItems = this.sectionTargets(
      section,
      '.solution-eyebrow, .solution-main-heading, .solution-description, .solution-tag'
    );
    const orb = section.querySelector('.ai-agent-icon') as HTMLElement | null;
    const featuresTitle = section.querySelector('.features-title') as HTMLElement | null;
    const cards = this.sectionTargets(section, '.feature-item');
    const cardDetails = cards.flatMap((card) => [
      card.querySelector('.feature-icon'),
      card.querySelector('h3'),
      card.querySelector('p')
    ].filter((target): target is Element => Boolean(target)));
    const cta = section.querySelector('.ai-agent-cta') as HTMLElement | null;
    const ctaItems = this.sectionTargets(section, '.ai-agent-cta h2, .ai-agent-cta p, .ai-agent-button');

    const targets = [
      ...copyItems,
      orb,
      featuresTitle,
      ...cards,
      ...cardDetails,
      cta,
      ...ctaItems
    ].filter((target): target is Element => Boolean(target));

    if (targets.length === 0) return;

    if (this.prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }

    gsap.set(copyItems, {
      autoAlpha: 0,
      y: 24,
      filter: 'blur(6px)',
      willChange: 'transform, opacity, filter'
    });
    if (orb) {
      gsap.set(orb, {
        autoAlpha: 0,
        y: 18,
        scale: 0.86,
        filter: 'blur(6px)',
        transformOrigin: '50% 50%',
        willChange: 'transform, opacity, filter'
      });
    }
    if (featuresTitle) {
      gsap.set(featuresTitle, {
        autoAlpha: 0,
        y: 24,
        filter: 'blur(6px)',
        willChange: 'transform, opacity, filter'
      });
    }
    gsap.set(cards, {
      autoAlpha: 0,
      y: 34,
      scale: 0.985,
      willChange: 'transform, opacity'
    });
    gsap.set(cardDetails, {
      autoAlpha: 0,
      y: 14,
      willChange: 'transform, opacity'
    });
    if (cta) {
      gsap.set(cta, {
        autoAlpha: 0,
        y: 30,
        scale: 0.985,
        willChange: 'transform, opacity'
      });
    }
    gsap.set(ctaItems, {
      autoAlpha: 0,
      y: 14,
      willChange: 'transform, opacity'
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 76%',
        toggleActions: 'play none none reverse'
      },
      onComplete: () => this.clearRevealInlineProps(targets)
    });

    tl.to(copyItems, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.62,
      stagger: 0.075,
      ease: 'power3.out'
    }, 0);

    if (orb) {
      tl.to(orb, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.72,
        ease: 'back.out(1.7)'
      }, 0.22);
    }

    if (featuresTitle) {
      tl.to(featuresTitle, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.58,
        ease: 'power3.out'
      }, 0.56);
    }

    cards.forEach((card, index) => {
      const details = [
        card.querySelector('.feature-icon'),
        card.querySelector('h3'),
        card.querySelector('p')
      ].filter((target): target is Element => Boolean(target));
      const offset = 0.78 + index * 0.11;

      tl.to(card, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.62,
        ease: 'power3.out'
      }, offset);

      if (details.length > 0) {
        tl.to(details, {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.045,
          ease: 'power2.out'
        }, offset + 0.08);
      }
    });

    if (cta) {
      tl.to(cta, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.66,
        ease: 'power3.out'
      }, 1.22);
    }

    if (ctaItems.length > 0) {
      tl.to(ctaItems, {
        autoAlpha: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.06,
        ease: 'power2.out'
      }, 1.34);
    }
  }

  private setupContactAnimations(): void {
    if (!this.isBrowser) return;

    const section = document.querySelector('.contact-section') as HTMLElement | null;
    if (!section) return;

    const headerItems = this.sectionTargets(section, '.contact-main-heading, .contact-subtitle');
    const cards = this.sectionTargets(section, '.contact-card');
    const cardDetails = cards.flatMap((card) => [
      card.querySelector('.contact-icon'),
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
        card.querySelector('.contact-icon'),
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

  private setupAlertingAnimation(): void {
    if (!this.isBrowser) return;

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

  private startAlertingFlow(): void {
    this.isAnimating = true;
    
    // Reset animation after 8 seconds
    setTimeout(() => {
      this.isAnimating = false;
    }, 8000);
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
      if (document.querySelector('.map')) {
        gsap.set('.map', { opacity: 0 });
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
    if (document.querySelector('#regions_div') || document.querySelector('.map')) {
      gsap.to(['#regions_div', '.map'], { opacity: 1, duration: 0.6, ease: 'power2.out' });
    }

    this.isLoading = false;
  }

  private preserveContainerConstraints(): void {
    if (!this.isBrowser) return;
    
    // Add a temporary class to prevent layout shifts
    const sections = document.querySelectorAll('.landing-extra-content, .investigation-section, .alerting-section, .contact-section');
    sections.forEach(section => {
      section.classList.add('preserving-constraints');
    });
  }

  private restoreContainerConstraints(): void {
    if (!this.isBrowser) return;
    
    // Remove the temporary class
    const sections = document.querySelectorAll('.landing-extra-content, .investigation-section, .alerting-section, .contact-section');
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
          } else if (error.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment before trying again.';
          }
          
          this.snackbar.open(errorMessage, 'error');
        }
      });
  }

  private setupScrollFadeAnimations(): void {
    if (!this.isBrowser) return;

    // Set initial states for all fade-in elements
    gsap.set('.solutions-main-heading, .investigation-main-heading, .alerting-main-heading, .contact-main-heading', {
      opacity: 0, 
      y: 30 
    });
    
    gsap.set('.solutions-subtitle, .investigation-subtitle, .alerting-subtitle, .contact-subtitle, .animate-subtitle', { 
      opacity: 0, 
      y: 20 
    });
    
    gsap.set('.capability-card, .contact-card', {
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
    gsap.to('.solutions-main-heading, .investigation-main-heading, .alerting-main-heading, .contact-main-heading', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.2,
      scrollTrigger: {
        trigger: '.solutions-main-heading, .investigation-main-heading, .alerting-main-heading, .contact-main-heading',
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

  startThreatIntelligenceCycle(): void {
    this.stopThreatIntelligenceCycle();
    if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0) return;
    
    this.threatCycleInterval = setInterval(() => {
      try {
        if (this.threatIntelligenceData.length > 0) {
          this.currentThreatIndex = (this.currentThreatIndex + 1) % this.threatIntelligenceData.length;
          this.updateCurrentThreatData();
        }
      } catch (err) {
        console.error('Error in threat intelligence cycling interval:', err);
        this.stopThreatIntelligenceCycle();
      }
    }, 8000); // Change threat type every 8 seconds
  }

  stopThreatIntelligenceCycle(): void {
    if (this.threatCycleInterval) {
      clearInterval(this.threatCycleInterval);
      this.threatCycleInterval = null;
    }
    if (this.itemCycleInterval) {
      clearInterval(this.itemCycleInterval);
      this.itemCycleInterval = null;
    }
  }

  updateCurrentThreatData(): void {
    if (!this.threatIntelligenceData || this.threatIntelligenceData.length === 0) return;
    
    const currentThreat = this.threatIntelligenceData[this.currentThreatIndex];
    if (currentThreat) {
      this.currentThreatType = currentThreat.type;
      this.currentThreatItems = currentThreat.items || [];
      this.currentItemIndex = 0;
      this.startItemCycle();
      
    }
  }

  startItemCycle(): void {
    this.stopItemCycle();
    if (!this.currentThreatItems || this.currentThreatItems.length === 0) return;
    
    this.itemCycleInterval = setInterval(() => {
      try {
        if (this.currentThreatItems.length > 0) {
          this.currentItemIndex = (this.currentItemIndex + 1) % this.currentThreatItems.length;
  
        }
      } catch (err) {
        console.error('Error in item cycling interval:', err);
        this.stopItemCycle();
      }
    }, 4000); // Change item every 4 seconds
  }

  stopItemCycle(): void {
    if (this.itemCycleInterval) {
      clearInterval(this.itemCycleInterval);
      this.itemCycleInterval = null;
    }
  }





  updateCurrentLocationData(): void {
    if (!this.locationData || this.locationData.length === 0) return;
    
    const currentLocation = this.locationData[this.currentLocationIndex];
    if (currentLocation) {
      this.typedLocationName = currentLocation.name || 'Unknown Location';
      this.startLocationNameTyping();
    }
  }

  startLocationCycle(): void {
    this.stopLocationCycle();
    if (!this.locationData || this.locationData.length === 0) return;
    
    this.locationCycleInterval = setInterval(() => {
      try {
        if (this.locationData.length > 0) {
          this.currentLocationIndex = (this.currentLocationIndex + 1) % this.locationData.length;
          this.updateCurrentLocationData();
        }
      } catch (err) {
        console.error('Error in location cycling interval:', err);
        this.stopLocationCycle();
      }
    }, 6000); // Change location every 6 seconds
  }

  stopLocationCycle(): void {
    if (this.locationCycleInterval) {
      clearInterval(this.locationCycleInterval);
      this.locationCycleInterval = null;
    }
  }

  startLocationNameTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typedLocationName = '';
    if (!this.typedLocationName) return;
    
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
}

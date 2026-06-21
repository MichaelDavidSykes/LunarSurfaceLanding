import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, Output, EventEmitter, Input, HostBinding, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface ExplorerEntity {
  type?: string | null;
  name?: string | null;
  value?: string | null;
  pattern?: string | null;
  modified?: string | null;
  report?: string | null;
}

interface EntityGroupItem {
  primary: string;
  secondary?: string;
  report?: string;
  modified?: string;
}

interface EntityGroupPresentation {
  label: string;
  icon: string;
  accent: string;
  order: number;
}

interface EntityGroup {
  key: string;
  label: string;
  icon: string;
  accent: string;
  items: EntityGroupItem[];
  order: number;
}

const TYPE_PRESENTATION: Record<string, EntityGroupPresentation> = {
  malware: { label: 'Malware', icon: 'pest_control', accent: 'accent-malware', order: 1 },
  tool: { label: 'Tools', icon: 'handyman', accent: 'accent-tool', order: 2 },
  indicator: { label: 'Indicators', icon: 'flag', accent: 'accent-indicator', order: 3 },
  'attack-pattern': { label: 'Attack Patterns', icon: 'track_changes', accent: 'accent-technique', order: 4 },
  campaign: { label: 'Campaigns', icon: 'campaign', accent: 'accent-campaign', order: 5 },
  'intrusion-set': { label: 'Intrusion Sets', icon: 'group_work', accent: 'accent-intrusion', order: 6 },
  'threat-actor': { label: 'Threat Actors', icon: 'person_search', accent: 'accent-actor', order: 7 },
  identity: { label: 'Identities', icon: 'apartment', accent: 'accent-identity', order: 8 },
  file: { label: 'Files', icon: 'insert_drive_file', accent: 'accent-file', order: 9 },
  relationship: { label: 'Relationships', icon: 'share', accent: 'accent-relationship', order: 10 },
  location: { label: 'Locations', icon: 'public', accent: 'accent-location', order: 11 },
  'marking-definition': { label: 'Marking Definitions', icon: 'verified_user', accent: 'accent-marking', order: 12 }
};

const DEFAULT_PRESENTATION: EntityGroupPresentation = {
  label: 'Related Intelligence',
  icon: 'hub',
  accent: 'accent-generic',
  order: 99
};

@Component({
  selector: 'app-interactive-globe',
  templateUrl: './interactive-globe.component.html',
  styleUrls: ['./interactive-globe.component.scss']
})
export class InteractiveGlobeComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('globeContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @HostBinding('class.stretch-globe') stretchClass = false;
  @HostBinding('class.landing-mode') get landingModeClass(): boolean {
    return !this.explorerMode;
  }
  @HostBinding('class.explorer-mode') get explorerModeClass(): boolean {
    return this.explorerMode;
  }

  private isBrowser: boolean;
  private renderer: any;
  private scene: any;
  private camera: any;
  private controls: any;
  private labelRenderer: any;
  private labelGroup: any;
  private lineGroup: any;
  private relationGroup: any;
  private sphereMat: any;
  private sphereMesh: any;
  private three: any;
  private CSS2DObjectCtor: any;
  private labelOverlays: Array<{ obj: any; tip: any; normal: any; visible: boolean }> = [];
  private lineOverlays: Array<{ line: any; tip: any; normal: any; visible: boolean }> = [];
  private relationOverlays: Array<{ line: any; mid: any; normal: any; visible: boolean; opacity: number }> = [];
  private relationLabelOverlays: Array<{ obj: any; mid: any; normal: any; visible: boolean }> = [];
  private animationId: number | null = null;
  private pendingLabelElements: HTMLElement[] = [];
  private labelRevealTimer: ReturnType<typeof setTimeout> | null = null;
  private focusActive = false;
  private pendingLabelReveal = false;
  private countryCentroids = new Map<string, { lon: number; lat: number }>();
  private focusAnimation: { start: any; end: any; startTime: number; duration: number } | null = null;
  private focusResumeTimer: any = null;
  private autoRotateHoldUntil = 0;
  private selectionFocusPending = false;
  // Texture + geo state
  private textureCanvas!: HTMLCanvasElement;
  private textureCtx!: CanvasRenderingContext2D;
  private d3: any;
  private projection: any;
  private pathGen: any;
  private geojson: any;
  public ready: boolean = false;
  private pendingHighlightData: any[] | null = null;
  private lastOverlayData: any[] | null = null;
  private featureIsoMap = new Map<string, string>();
  private readonly focusDurationMs = 1200;
  private readonly focusHoldMs = 30000;
  private readonly labelRevealBaseDelayMs = 70;
  private readonly labelRevealAfterFocusMs = 140;
  private static readonly regionNameToIsoMap = (() => {
    const map = new Map<string, string>();
    try {
      const DisplayNamesCtor = (Intl as any)?.DisplayNames;
      if (typeof DisplayNamesCtor === 'function') {
        const displayNames = new DisplayNamesCtor(['en'], { type: 'region' });
        for (let i = 65; i <= 90; i++) {
          for (let j = 65; j <= 90; j++) {
            const code = String.fromCharCode(i) + String.fromCharCode(j);
            const name = displayNames.of(code);
            if (typeof name === 'string') {
              map.set(name.toLowerCase(), code);
            }
          }
        }
      }
    } catch {
      /* no-op */
    }
    return map;
  })();
  private static readonly nameAliasToIso: Record<string, string> = {
    'french southern and antarctic lands': 'TF',
    'the bahamas': 'BS',
    'bahamas': 'BS',
    'bosnia and herzegovina': 'BA',
    'ivory coast': 'CI',
    'democratic republic of the congo': 'CD',
    'republic of the congo': 'CG',
    'england': 'GB',
    'northern cyprus': 'CY',
    'czech republic': 'CZ',
    'guinea bissau': 'GW',
    'macedonia': 'MK',
    'myanmar': 'MM',
    'somaliland': 'SO',
    'republic of serbia': 'RS',
    'swaziland': 'SZ',
    'east timor': 'TL',
    'trinidad and tobago': 'TT',
    'united republic of tanzania': 'TZ',
    'usa': 'US',
    'united states of america': 'US',
    'taiwan': 'TW',
    'west bank': 'PS',
    'state of palestine': 'PS'
  };

  @Output() selectedCountryChange = new EventEmitter<{ name: string | null; code: string | null } | null>();
  @Output() entityGroupsChange = new EventEmitter<any[]>();
  @Output() mapViewRequest = new EventEmitter<void>();

  @Input() selectedCountry: string | null = null;
  @Input() selectedCountryCode: string | null = null;
  @Input() selectedCountryGroups: Array<{
    report: string;
    items: any[];
    modified?: string | null;
    sourceName?: string | null;
    sourceLink?: string | null;
  }> = [];
  @Input() selectedCountryLoading = false;
  @Input() explorerMode = false;
  @Input() enableSharedRelationshipArcs = false;
  @Input() autoFocusOnSelection = false;

  @Input() enableDateFilter = false;
  @Input() dateRangeStart?: Date | string | null;
  @Input() dateRangeEnd?: Date | string | null;
  @Input() dateRangeMin?: Date | string | null;
  @Input() dateRangeMax?: Date | string | null;
  @Input() moduleBreakdownCounts: Array<{ key: string; label: string; count: number }> = [];
  @Input() selectedModuleFilterKeys: string[] = [];
  @Output() dateRangeChange = new EventEmitter<{ start: Date; end: Date }>();
  @Output() moduleChipToggle = new EventEmitter<string>();

  private _selectedCountryIocs: ExplorerEntity[] = [];
  entityGroups: EntityGroup[] = [];

  @Input()
  set selectedCountryIocs(value: ExplorerEntity[] | null | undefined) {
    this._selectedCountryIocs = Array.isArray(value) ? value : [];
    this.entityGroups = this.buildEntityGroups(this._selectedCountryIocs);
    this.entityGroupsChange.emit(this.entityGroups);
  }

  get selectedCountryIocs(): ExplorerEntity[] {
    return this._selectedCountryIocs;
  }

  private _stretch = false;

  @Input()
  set stretch(value: boolean) {
    this._stretch = !!value;
    this.stretchClass = this._stretch;
  }

  get stretch(): boolean {
    return this._stretch;
  }

  readonly dayMs = 24 * 60 * 60 * 1000;
  sliderMin = 0;
  sliderMax = 0;
  sliderStartValue = 0;
  sliderEndValue = 0;
  dateRangeReady = false;
  private readonly dateRangeFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  });
  private lastEmittedRange: { start: number; end: number } | null = null;
  private sliderDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private readonly sliderDebounceMs = 500;
  private focusDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private readonly focusDebounceMs = 100;
  private overlayRenderHandle: number | null = null;
  moduleFilterExpanded = false;
  private readonly maxExplorerOverlayLabels = 45;
  private readonly maxExplorerRelationshipArcs = 20;
  private readonly minSharedEntitiesForArc = 2;
  private readonly maxEntityKeysPerLocation = 120;
  private readonly maxPairChecks = 800;
  private readonly arcInterpolationPoints = 36;
  private readonly sharedArcEntityTypes = new Set([
    'indicator',
    'domain-name',
    'url',
    'ipv4-addr',
    'email-addr',
    'windows-registry-key',
    'vulnerability',
    'malware',
    'file',
    'software',
    'tool',
    'attack-pattern',
    'campaign',
    'intrusion-set',
    'threat-actor',
    'infrastructure',
    'organization',
    'course-of-action'
  ]);
  private borderThemeProgress = 0; // 0 = purple (intel), 1 = red (no intel)
  private borderThemeAnimId: number | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  requestMapView(): void {
    this.mapViewRequest.emit();
  }

  isModuleChipSelected(key: string): boolean {
    return (this.selectedModuleFilterKeys ?? []).includes((key || '').trim());
  }

  isModuleChipMuted(key: string): boolean {
    const selected = this.selectedModuleFilterKeys ?? [];
    if (!selected.length) {
      return false;
    }
    return !selected.includes((key || '').trim());
  }

  get moduleFilterSummary(): string {
    const selected = this.selectedModuleFilterKeys?.length ?? 0;
    if (selected > 0) {
      return `${selected} selected`;
    }
    const total = this.moduleBreakdownCounts?.length ?? 0;
    return `${total} available`;
  }

  toggleModuleFilterExpanded(): void {
    this.moduleFilterExpanded = !this.moduleFilterExpanded;
  }

  onModuleChipClick(key: string): void {
    const normalized = (key || '').trim();
    if (!normalized) {
      return;
    }
    this.moduleChipToggle.emit(normalized);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedCountry' in changes && !this.selectedCountry) {
      this.entityGroups = [];
      this.selectionFocusPending = false;
      this.entityGroupsChange.emit([]);
    }

    if (
      this.enableDateFilter &&
      (
        'dateRangeStart' in changes ||
        'dateRangeEnd' in changes ||
        'dateRangeMin' in changes ||
        'dateRangeMax' in changes ||
        'enableDateFilter' in changes
      )
    ) {
      this.syncDateFilterState();
    }

    if ('enableDateFilter' in changes && !this.enableDateFilter) {
      this.dateRangeReady = false;
    }

    if (
      this.explorerMode && this.autoFocusOnSelection &&
      (("selectedCountry" in changes) || ("selectedCountryCode" in changes)) &&
      (this.selectedCountry || this.selectedCountryCode) &&
      !this.selectedCountryLoading
    ) {
      this.scheduleFocusFromSelection();
    }

    if (
      this.explorerMode && this.autoFocusOnSelection &&
      ('selectedCountryLoading' in changes) &&
      this.selectedCountryLoading === false &&
      (this.selectedCountry || this.selectedCountryCode)
    ) {
      this.scheduleFocusFromSelection();
    } else if (!this.explorerMode) {
      this.selectionFocusPending = false;
    }
  }

  private scheduleFocusFromSelection(): void {
    if (this.focusDebounceHandle) {
      clearTimeout(this.focusDebounceHandle);
    }
    this.focusDebounceHandle = setTimeout(() => {
      this.focusDebounceHandle = null;
      this.focusFromSelection();
    }, this.focusDebounceMs);
  }

  get dateRangeLabel(): string {
    if (!this.enableDateFilter || !this.dateRangeReady) {
      return '';
    }

    if (!Number.isFinite(this.sliderStartValue) || !Number.isFinite(this.sliderEndValue)) {
      return '';
    }

    const start = new Date(this.sliderStartValue);
    const end = new Date(this.sliderEndValue);
    const startLabel = this.dateRangeFormatter.format(start);
    const endLabel = this.dateRangeFormatter.format(end);

    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  }

  private buildEntityGroups(entities: ExplorerEntity[] | null | undefined): EntityGroup[] {
    if (!entities || entities.length === 0) {
      return [];
    }

    const groupsMap = new Map<string, EntityGroup>();

    for (const entity of entities) {
      const rawType = (entity.type || 'other').toString().trim().toLowerCase() || 'other';
      const presentation = TYPE_PRESENTATION[rawType] || {
        ...DEFAULT_PRESENTATION,
        label: this.toTitleCase(rawType),
        order: DEFAULT_PRESENTATION.order
      };

      const groupKey = rawType;
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          label: presentation.label,
          icon: presentation.icon,
          accent: presentation.accent,
          items: [],
          order: presentation.order
        });
      }

      const target = groupsMap.get(groupKey)!;
      const primary = this.resolvePrimaryText(entity);
      const secondary = this.resolveSecondaryText(entity, primary);

      target.items.push({
        primary,
        secondary,
        report: entity.report ?? undefined,
        modified: entity.modified ?? undefined
      });
    }

    const groups = Array.from(groupsMap.values()).map((group) => ({
      ...group,
      items: this.sortGroupItems(group.items)
    }));

    return groups
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      .map((group, index) => ({ ...group, order: index }));
  }

  private sortGroupItems(items: EntityGroupItem[]): EntityGroupItem[] {
    return [...items].sort((a, b) => {
      const tsA = a.modified ? Date.parse(a.modified) : 0;
      const tsB = b.modified ? Date.parse(b.modified) : 0;
      if (tsA === tsB) {
        return a.primary.localeCompare(b.primary);
      }
      return tsB - tsA;
    });
  }

  private resolvePrimaryText(entity: ExplorerEntity): string {
    return (
      entity.name?.trim() ||
      entity.value?.toString().trim() ||
      entity.pattern?.toString().trim() ||
      'Unnamed entity'
    );
  }

  private resolveSecondaryText(entity: ExplorerEntity, primary: string): string | undefined {
    if (entity.pattern && entity.pattern !== primary) {
      return entity.pattern;
    }

    if (entity.value && entity.value !== primary) {
      return entity.value;
    }

    return undefined;
  }

  private toTitleCase(value: string): string {
    return value
      .split(/[^a-z0-9]+/gi)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
      || DEFAULT_PRESENTATION.label;
  }
  private normalizeKey(value: string): string {
    return value?.toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';
  }

  private normalizeCountryCode(value: string | null | undefined): string | null {
    const raw = (value || '').toString().trim().toUpperCase();
    return /^[A-Z]{2}$/.test(raw) ? raw : null;
  }

  private resolveIsoFromName(name: string | null | undefined): string | undefined {
    if (!name) return undefined;
    const lower = this.normalizeKey(name);
    return InteractiveGlobeComponent.nameAliasToIso[lower] || InteractiveGlobeComponent.regionNameToIsoMap.get(lower);
  }

  onDateRangeSliderChange(): void {
    if (!this.enableDateFilter || !this.dateRangeReady) {
      return;
    }

    this.ensureSliderOrdering();
    this.scheduleDateRangeEmit();
  }

  private syncDateFilterState(): void {
    const minTimestamp = this.getAlignedTimestamp(this.dateRangeMin ?? this.dateRangeStart, 'floor');
    const maxTimestamp = this.getAlignedTimestamp(
      this.dateRangeMax ?? this.dateRangeEnd ?? this.dateRangeStart,
      'floor'
    );

    if (minTimestamp === null || maxTimestamp === null || minTimestamp >= maxTimestamp) {
      this.dateRangeReady = false;
      return;
    }

    this.sliderMin = minTimestamp;
    this.sliderMax = maxTimestamp;

    const startTimestamp = this.getAlignedTimestamp(this.dateRangeStart ?? minTimestamp, 'floor');
    const endTimestamp = this.getAlignedTimestamp(this.dateRangeEnd ?? maxTimestamp, 'floor');

    this.sliderStartValue = this.clampToSlider(startTimestamp ?? minTimestamp);
    this.sliderEndValue = this.clampToSlider(endTimestamp ?? maxTimestamp);
    this.ensureSliderOrdering();
    this.lastEmittedRange = { start: this.sliderStartValue, end: this.sliderEndValue };
    this.dateRangeReady = true;
  }

  private normalizeDateValue(value?: Date | string | null): number | null {
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? time : null;
  }

  private getAlignedTimestamp(value: Date | string | number | null | undefined, direction: 'floor' | 'ceil'): number | null {
    if (typeof value === 'number') {
      return this.alignToDay(value, direction);
    }
    const normalized = this.normalizeDateValue(value);
    if (normalized === null) {
      return null;
    }
    return this.alignToDay(normalized, direction);
  }

  private alignToDay(timestamp: number, direction: 'floor' | 'ceil'): number {
    const remainder = timestamp % this.dayMs;
    if (remainder === 0) {
      return timestamp;
    }
    return direction === 'floor'
      ? timestamp - remainder
      : timestamp + (this.dayMs - remainder);
  }

  private clampToSlider(value: number): number {
    if (!Number.isFinite(value)) {
      return this.sliderMin;
    }
    return Math.min(Math.max(value, this.sliderMin), this.sliderMax);
  }

  private ensureSliderOrdering(): void {
    if (this.sliderStartValue > this.sliderEndValue) {
      const temp = this.sliderStartValue;
      this.sliderStartValue = this.sliderEndValue;
      this.sliderEndValue = temp;
    }
  }

  get landingEntitySnippets(): string[] {
    if (this.explorerMode || !this.entityGroups.length) {
      return [];
    }
    const snippets: string[] = [];
    for (const group of this.entityGroups) {
      for (const item of group.items.slice(0, 3)) {
        const main = item.primary?.trim();
        if (main) {
          const line = group.label ? `${group.label}: ${main}` : main;
          snippets.push(line);
        }
        if (snippets.length >= 8) {
          return snippets;
        }
      }
      if (snippets.length >= 8) {
        break;
      }
    }
    return snippets;
  }

  get landingReportSnippets(): Array<{ title: string; date?: string | null; source?: string | null; link?: string | null }> {
    if (this.explorerMode || !this.selectedCountryGroups.length) {
      return [];
    }
    return this.selectedCountryGroups.slice(0, 3).map((group) => ({
      title: group.report,
      date: group.modified ?? null,
      source: group.sourceName ?? null,
      link: group.sourceLink ?? null
    }));
  }

  private focusFromSelection(): void {
    if (!this.explorerMode) {
      this.selectionFocusPending = false;
      return;
    }
    const centroid = this.findCentroidForSelection();
    if (centroid) {
      this.selectionFocusPending = false;
      this.focusOnLonLat(centroid!.lon, centroid!.lat);
    } else {
      this.selectionFocusPending = true;
    }
  }

  private findCentroidForSelection(): { lon: number; lat: number } | null {
    const isoRaw = (this.selectedCountryCode || '').toString().trim();
    if (isoRaw) {
      const iso = isoRaw.toUpperCase();
      const fromIso = this.countryCentroids.get(iso) || this.countryCentroids.get(this.normalizeKey(iso));
      if (fromIso) {
        return fromIso;
      }
    }

    if (this.selectedCountry) {
      const nameKey = this.normalizeKey(this.selectedCountry);
      if (nameKey) {
        const fromName = this.countryCentroids.get(nameKey);
        if (fromName) {
          return fromName;
        }
      }
    }

    return null;
  }

  private focusOnLonLat(lon: number, lat: number): void {
    if (!this.explorerMode) {
      return;
    }
    if (!this.camera || !this.controls || !this.three) {
      return;
    }

    const radius = this.camera.position.length() || 3.2;
    const targetVec = this.lonLatToVector3(lon, lat, radius);
    if (!targetVec || typeof targetVec.clone !== 'function') {
      return;
    }

    const startVec = this.camera.position.clone?.();
    if (!startVec) {
      return;
    }

    this.focusAnimation = {
      start: startVec,
      end: targetVec.clone(),
      startTime: performance.now(),
      duration: this.focusDurationMs
    };

    this.focusActive = true;
    this.pendingLabelReveal = true;
    if (this.labelRevealTimer) {
      clearTimeout(this.labelRevealTimer);
      this.labelRevealTimer = null;
    }

    this.controls.autoRotate = false;
    this.autoRotateHoldUntil = Date.now() + this.focusHoldMs;
    if (this.focusResumeTimer) {
      clearTimeout(this.focusResumeTimer);
    }
    this.focusResumeTimer = setTimeout(() => {
      this.focusResumeTimer = null;
      if (!this.controls) {
        return;
      }
      if (Date.now() >= this.autoRotateHoldUntil) {
        this.controls.autoRotate = true;
      }
    }, this.focusHoldMs);

    this.selectionFocusPending = false;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private scheduleDateRangeEmit(): void {
    if (this.sliderDebounceHandle) {
      clearTimeout(this.sliderDebounceHandle);
    }

    this.sliderDebounceHandle = setTimeout(() => {
      this.sliderDebounceHandle = null;
      this.emitDateRangeFromSlider();
    }, this.sliderDebounceMs);
  }

  private emitDateRangeFromSlider(): void {
    if (!Number.isFinite(this.sliderStartValue) || !Number.isFinite(this.sliderEndValue)) {
      return;
    }

    const start = this.sliderStartValue;
    const end = this.sliderEndValue;

    if (this.lastEmittedRange && this.lastEmittedRange.start === start && this.lastEmittedRange.end === end) {
      return;
    }

    this.lastEmittedRange = { start, end };
    this.dateRangeChange.emit({ start: new Date(start), end: new Date(end) });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const [THREE, { OrbitControls }, { CSS2DRenderer, CSS2DObject }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/renderers/CSS2DRenderer.js')
    ]);
    this.three = THREE;
    this.CSS2DObjectCtor = CSS2DObject;

    const container = this.containerRef.nativeElement;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera (outside a unit sphere)
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const initialCameraDistance = this.explorerMode ? 3.2 : 3.8;
    this.camera.position.set(0, 0, initialCameraDistance);
    this.camera.up.set(0, 1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // Label renderer (for floating HTML panels)
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(width, height);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.overflow = 'visible';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelRenderer.domElement.classList.add('globe-label-layer');
    container.appendChild(this.labelRenderer.domElement);

    // Groups for overlays
    this.labelGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    this.relationGroup = new THREE.Group();
    this.scene.add(this.labelGroup);
    this.scene.add(this.lineGroup);
    this.scene.add(this.relationGroup);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 3, 5);
    this.scene.add(dir);

    // Globe sphere (unit radius) with a canvas texture
    const R = 1.0;
    const sphereGeom = new THREE.SphereGeometry(R, 128, 128);
    this.sphereMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 10 });
    this.sphereMesh = new THREE.Mesh(sphereGeom, this.sphereMat);
    this.scene.add(this.sphereMesh);

    // Subtle atmosphere glow (simple rim-light shader)
    const atmosphereGeom = new THREE.SphereGeometry(R * 1.05, 128, 128);
    const atmosphereMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x2a174b) }, // dark purple
        intensity: { value: 1.1 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
          gl_FragColor = vec4(glowColor, rim * 0.25 * intensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    this.scene.add(atmosphereMesh);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 8.0;
    // Avoid polar singularities that can look like vertical wobble.
    this.controls.minPolarAngle = 0.24;
    this.controls.maxPolarAngle = Math.PI - 0.24;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.6;
    // Keep orbit pivot locked to the globe center to avoid visual wobble.
    this.controls.target.set(0, 0, 0);
    this.controls.addEventListener('start', () => {
      this.labelRenderer?.domElement?.classList.add('globe-label-layer--dragging');
    });
    this.controls.addEventListener('end', () => {
      this.labelRenderer?.domElement?.classList.remove('globe-label-layer--dragging');
    });

    const onResize = () => {
      if (!this.renderer || !this.camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.renderer.setSize(w, h);
      this.labelRenderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    onResize();

    const animate = () => {
      if (this.explorerMode && this.focusAnimation && this.camera && this.controls) {
        const now = performance.now();
        const { start, end, startTime, duration } = this.focusAnimation;
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = this.easeInOutCubic(progress);
        const newPos = start.clone().lerp(end, eased);
        this.camera.position.copy(newPos);
        this.camera.lookAt(this.controls.target);
        if (progress >= 1) {
          this.focusAnimation = null;
          this.onFocusAnimationComplete();
        }
      } else if (
        this.explorerMode &&
        this.controls &&
        !this.controls.autoRotate &&
        !this.focusResumeTimer &&
        this.autoRotateHoldUntil &&
        Date.now() >= this.autoRotateHoldUntil
      ) {
        this.controls.autoRotate = true;
      }

      // Keep orbit pivot strictly centered on globe origin.
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      this.updateOverlayVisibility();
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();

    // Apply continents texture from local GeoJSON
    await this.applyLandTexture(THREE);

    // Click-to-highlight interaction
    this.setupClickHighlight();
  }

  private async applyLandTexture(THREE: any): Promise<void> {
    try {
      this.d3 = await import('d3');
      const res = await fetch('assets/data/countries-110m.geojson');
      if (!res.ok) return;
      this.geojson = await res.json();
      if (!this.geojson || !Array.isArray(this.geojson.features)) return;

      // Equirectangular canvas texture (higher resolution for sharp borders)
      const width = 4096;
      const height = 2048;
      this.textureCanvas = document.createElement('canvas');
      this.textureCanvas.width = width;
      this.textureCanvas.height = height;
      const ctx = this.textureCanvas.getContext('2d');
      if (!ctx) return; this.textureCtx = ctx;

      // Ocean background (darker, less blue)
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, width, height);

      // Projection/path
      this.projection = this.d3.geoEquirectangular()
        .translate([width / 2, height / 2])
        .scale(width / (2 * Math.PI));
      this.pathGen = this.d3.geoPath(this.projection, ctx);

      // Subtle graticule (cyber vibe)
      try {
        const graticule = (this.d3 as any).geoGraticule().step([15, 15]);
        ctx.beginPath();
        this.pathGen(graticule());
        ctx.lineWidth = 0.35;
        ctx.strokeStyle = 'rgba(120, 105, 170, 0.10)';
        ctx.stroke();
      } catch {}

      // Land fill (dark theme, less blue)
      ctx.beginPath();
      this.pathGen({ type: 'FeatureCollection', features: this.geojson.features });
      ctx.fillStyle = '#0e0f14';
      ctx.fill();

      // Dark purple borders with a soft glow
      ctx.lineWidth = 0.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(110, 45, 200, 0.45)';
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(110, 45, 200, 0.25)';
      ctx.stroke();
      // reset shadow for future draws
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      const texture = new THREE.CanvasTexture(this.textureCanvas);
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy?.() || 1;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;

      this.sphereMat.map = texture;
      this.sphereMat.color.set(0xffffff);
      this.sphereMat.needsUpdate = true;

      // Mark ready and flush any pending highlights
      this.ready = true;
      if (this.pendingHighlightData) {
        const data = this.pendingHighlightData;
        this.pendingHighlightData = null;
        this.updateLocationIocs(data);
      }
    } catch (e) {
      // Keep base sphere if texture build fails
    }
  }

  // Public API: highlight regions and annotate IOCs on the globe texture
  public updateLocationIocs(data: Array<any>): void {
    if (!this.textureCtx || !this.geojson || !this.d3 || !this.sphereMat?.map) {
      // Not ready yet; queue
      this.pendingHighlightData = data;
      return;
    }
    // Keep a copy to restore overlays after click highlight timeout
    this.lastOverlayData = data;

    // Schedule rendering on next animation frame to avoid blocking rotation
    if (!this.overlayRenderHandle && typeof requestAnimationFrame === 'function') {
      // no-op; will schedule below
    } else if (this.overlayRenderHandle) {
      try { cancelAnimationFrame(this.overlayRenderHandle as any); } catch {}
      this.overlayRenderHandle = null;
    }

    const payload = Array.isArray(data) ? data : [];
    this.overlayRenderHandle = requestAnimationFrame(() => {
      this.overlayRenderHandle = null;
      this.performOverlayRender(payload);
    });
    return;

    // Clear any existing label/line overlays from scene
    this.clearOverlays();
    // Redraw base first
    this.redrawBaseTexture();

    // Build name index for countries
    const features = this.geojson.features || [];
    const nameFields = ['name', 'NAME', 'ADMIN', 'NAME_LONG', 'SOVEREIGNT', 'BRK_NAME', 'FORMAL_EN'];
    const norm = (s: string) => this.normalizeKey(s);
    const byName = new Map<string, any>();
    for (const f of features) {
      for (const field of nameFields) {
        const val = f.properties?.[field];
        if (val) {
          byName.set(norm(val), f);
          const isoFromName = this.normalizeCountryCode(this.resolveIsoFromName(String(val)) || null);
          const isoFromNameKey = norm(isoFromName ?? '');
          if (isoFromNameKey) {
            byName.set(isoFromNameKey, f);
          }
        }
      }
      if (f.id) {
        byName.set(norm(f.id), f);
        const isoFromId = this.normalizeCountryCode(String(f.id));
        const isoFromIdKey = norm(isoFromId ?? '');
        if (isoFromIdKey) {
          byName.set(isoFromIdKey, f);
        }
      }
    }

    // Country alias mapping -> normalize incoming names to dataset names
    const ALIAS_MAP: Record<string, string> = {
      'us': 'usa',
      'u.s.': 'usa',
      'usa': 'usa',
      'america': 'usa',
      'united states': 'usa',
      'united states of america': 'usa',
      'chicago': 'usa',
      'los angeles': 'usa',
      'new york': 'usa',
      'washington': 'usa',
      'beijing': 'china',
      'shanghai': 'china',
      'hong kong': 'china',
      'south korea': 'korea, republic of',
      'north korea': "korea, democratic people's republic of",
      'russia': 'russian federation',
      'uae': 'united arab emirates',
      'uk': 'united kingdom',
      'gb': 'england',
      'ie': 'ireland',
      'fr': 'france',
      'de': 'germany',
      'es': 'spain',
      'it': 'italy',
      'pt': 'portugal',
      'nl': 'netherlands',
      'be': 'belgium',
      'lu': 'luxembourg',
      'ch': 'switzerland',
      'at': 'austria',
      'se': 'sweden',
      'no': 'norway',
      'fi': 'finland',
      'dk': 'denmark',
      'pl': 'poland',
      'cz': 'czech republic',
      'sk': 'slovakia',
      'hu': 'hungary',
      'ro': 'romania',
      'bg': 'bulgaria',
      'gr': 'greece',
      'tr': 'turkey',
      'ua': 'ukraine',
      'by': 'belarus',
      'lt': 'lithuania',
      'lv': 'latvia',
      'ee': 'estonia',
      'is': 'iceland',
      'ca': 'canada',
      'mx': 'mexico',
      'br': 'brazil',
      'ar': 'argentina',
      'cl': 'chile',
      'co': 'colombia',
      'pe': 'peru',
      've': 'venezuela, bolivarian republic of',
      'uy': 'uruguay',
      'py': 'paraguay',
      'bo': 'bolivia',
      'ec': 'ecuador',
      'za': 'south africa',
      'ng': 'nigeria',
      'eg': 'egypt',
      'ma': 'morocco',
      'dz': 'algeria',
      'tn': 'tunisia',
      'ke': 'kenya',
      'gh': 'ghana',
      'sn': 'senegal',
      'sa': 'saudi arabia',
      'ae': 'united arab emirates',
      'qa': 'qatar',
      'kw': 'kuwait',
      'bh': 'bahrain',
      'om': 'oman',
      'jo': 'jordan',
      'il': 'israel',
      'ir': 'iran, islamic republic of',
      'iq': 'iraq',
      'sy': 'syrian arab republic',
      'lb': 'lebanon',
      'pk': 'pakistan',
      'bd': 'bangladesh',
      'in': 'india',
      'np': 'nepal',
      'lk': 'sri lanka',
      'mm': 'myanmar',
      'th': 'thailand',
      'vn': 'viet nam',
      'ph': 'philippines',
      'my': 'malaysia',
      'sg': 'singapore',
      'id': 'indonesia',
      'au': 'australia',
      'nz': 'new zealand',
      'fj': 'fiji',
      'ru': 'russian federation',
      'cn': 'china',
      'jp': 'japan',
      'kr': 'korea, republic of',
      'kp': "korea, democratic people's republic of",
      'hk': 'china',
      'tw': 'taiwan',
      'united kingdom': 'england',
      'great britain': 'england',
      'u k': 'england',
      'u.k.': 'england',
      'britain': 'england',
      'ivory coast': "cote d ivoire",
      'côte d ivoire': "cote d ivoire",
      'cote d ivoire': "cote d ivoire",
      'czechia': 'czech republic',
      'burma': 'myanmar',
      'swaziland': 'eswatini',
      'eswatini': 'eswatini',
      'turkiye': 'turkey',
      'türkiye': 'turkey',
      'laos': "lao people's democratic republic",
      'lao pdr': "lao people's democratic republic",
      'brunei': 'brunei darussalam',
      'cape verde': 'cabo verde',
      'east timor': 'timor-leste',
      'macedonia': 'north macedonia',
      'moldova': 'moldova, republic of',
      'iran': 'iran, islamic republic of',
      'syria': 'syrian arab republic',
      'tanzania': 'tanzania, united republic of',
      'venezuela': 'venezuela, bolivarian republic of',
      'palestine': 'palestine, state of',
      'micronesia': 'micronesia, federated states of',
      'bahamas': 'the bahamas',
      'gambia': 'the gambia',
      'vietnam': 'viet nam'
    };

    const ctx = this.textureCtx as CanvasRenderingContext2D;
    const path = this.pathGen as any;

    // Styles
    const countryFill = 'rgba(110, 45, 200, 0.25)';
    const countryStroke = 'rgba(150, 90, 230, 0.65)';

    this.labelOverlays = [];
    this.lineOverlays = [];

    for (const item of data || []) {
      const toTitle = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());
      const resolveKey = (candidate: string): string | null => {
        if (!candidate) return null;
        if (ALIAS_MAP[candidate]) {
          const aliasKey = norm(ALIAS_MAP[candidate]);
          if (byName.has(aliasKey)) {
            return aliasKey;
          }
        }
        if (byName.has(candidate)) {
          return candidate;
        }
        return null;
      };

      let rawCode = (item.locationCode || item.location || item.code || '').toString();
      let rawName = (item.locationName || item.location || item.Location || '').toString();
      if (!rawCode && (!rawName || /unknown\s*\/\s*unmapped/i.test(rawName))) {
        const fallback = this.extractFallbackLocation(item);
        const fallbackCode = fallback?.code ?? '';
        const fallbackName = fallback?.name ?? '';
        if (fallbackCode) rawCode = fallbackCode;
        if (fallbackName) rawName = fallbackName;
      }
      const normalizedCode = rawCode ? norm(rawCode) : '';
      const normalizedName = rawName ? norm(rawName) : '';

      let key = resolveKey(normalizedCode) || resolveKey(normalizedName);
      if (!key && normalizedName && normalizedName !== normalizedCode) {
        key = resolveKey(normalizedName);
      }
      if (!key && normalizedCode) {
        key = resolveKey(normalizedCode);
      }
      if (!key) continue;

      const feature = byName.get(key as string);
      if (!feature) continue;
      const countries: any[] = [feature];

      const featureName =
        feature.properties?.NAME_LONG ||
        feature.properties?.ADMIN ||
        feature.properties?.NAME ||
        feature.properties?.name ||
        feature.properties?.FORMAL_EN ||
        '';

      const aliasName = normalizedCode && ALIAS_MAP[normalizedCode]
        ? ALIAS_MAP[normalizedCode]
        : (normalizedName && ALIAS_MAP[normalizedName] ? ALIAS_MAP[normalizedName] : '');

      let displayName = rawName && rawName.trim()
        ? rawName.trim()
        : (aliasName || featureName || rawCode.toUpperCase());

      if (!displayName && rawCode) {
        displayName = rawCode.toUpperCase();
      }

      if (displayName && displayName === displayName.toUpperCase() && aliasName) {
        displayName = aliasName;
      }

      if (displayName) {
        const lower = displayName.toLowerCase();
        if (displayName === displayName.toUpperCase() || displayName === lower) {
          displayName = toTitle(lower);
        }
      }

      const rawCodeUpper = rawCode ? rawCode.toUpperCase() : '';
      const isoFromFeatureName = this.resolveIsoFromName(featureName);
      const isoFromDisplayName = this.resolveIsoFromName(displayName);
      const isoCode = rawCodeUpper || isoFromFeatureName || isoFromDisplayName || null;

      if (isoCode) {
        if (feature?.id) {
          this.featureIsoMap.set(feature.id.toString().toUpperCase(), isoCode);
        }
        if (featureName) {
          this.featureIsoMap.set(this.normalizeKey(featureName), isoCode);
        }
        if (displayName) {
          this.featureIsoMap.set(this.normalizeKey(displayName), isoCode);
        }
        if (rawCodeUpper) {
          this.featureIsoMap.set(rawCodeUpper, isoCode);
        }
      }

      const iocs = item.nodes_vertex_collection || item.iocs || [];
      if (!Array.isArray(iocs) || iocs.length === 0) {
        continue;
      }

      // Highlight countries
      for (const f of countries) {
        try {
          ctx.beginPath();
          path(f);
          ctx.fillStyle = countryFill;
          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = countryStroke;
          ctx.stroke();
        } catch {}
      }

      // Marker position: centroid of the country
      let lonlat: [number, number] | null = null;
      if (countries.length) {
        try {
          const c = (this.d3 as any).geoCentroid(countries[0]);
          lonlat = [c[0], c[1]];
        } catch {}
      }

      if (lonlat != null) {
        // Create a 3D overlay: line + floating label
        const lon = lonlat![0];
        const lat = lonlat![1];
        if (this.explorerMode) {
          if (isoCode) {
            this.countryCentroids.set(isoCode.toUpperCase(), { lon, lat });
          }
          if (rawCodeUpper) {
            this.countryCentroids.set(rawCodeUpper, { lon, lat });
            this.countryCentroids.set(this.normalizeKey(rawCodeUpper), { lon, lat });
          }
          if (displayName) {
            this.countryCentroids.set(this.normalizeKey(displayName), { lon, lat });
          }
          if (rawName) {
            this.countryCentroids.set(this.normalizeKey(rawName), { lon, lat });
          }
          if (item.location) {
            this.countryCentroids.set(this.normalizeKey(String(item.location)), { lon, lat });
          }
        }
        const surface = this.lonLatToVector3(lon, lat, 1.0);
        const tip = this.lonLatToVector3(lon, lat, 1.18); // offset outward

        // Line
        try {
          const geom = new this.three.BufferGeometry().setFromPoints([surface, tip]);
          const mat = new this.three.LineBasicMaterial({ color: 0x5a46a8, transparent: true, opacity: 0.55 });
          const line = new this.three.Line(geom, mat);
          this.lineGroup.add(line);
          this.lineOverlays.push({ line, tip, normal: tip.clone().normalize(), visible: true });
        } catch {}

        // Label
        const lines = this.buildOverlayLines(item);
        const el = document.createElement('div');
        el.className = 'globe-label';
        const title = document.createElement('div');
        title.className = 'label-title';
        title.textContent = displayName || rawCode.toUpperCase();
        el.appendChild(title);
        for (const ln of lines) {
          const l = document.createElement('div');
          l.className = 'label-line';
          l.textContent = ln;
          el.appendChild(l);
        }
        this.queueLabelForReveal(el);
        try {
          const obj = new this.CSS2DObjectCtor(el);
          obj.position.copy(tip);
          this.labelGroup.add(obj);
          this.labelOverlays.push({ obj, tip, normal: tip.clone().normalize(), visible: true });
        } catch {}
      }
    }

    this.scheduleLabelReveal();

    // Push updated canvas to texture
    if (this.sphereMat?.map) {
      this.sphereMat.map.needsUpdate = true;
    }

    if (this.autoFocusOnSelection && this.selectionFocusPending && (this.selectedCountry || this.selectedCountryCode)) {
      const centroid = this.findCentroidForSelection();
      if (centroid) {
        this.selectionFocusPending = false;
        this.focusOnLonLat(centroid!.lon, centroid!.lat);
      }
    }
  }

  private performOverlayRender(data: Array<any>): void {
    type RelationshipAnchor = { tip: any; entityKeys: Set<string> };
    const renderRelationshipArcs = this.explorerMode || this.enableSharedRelationshipArcs;
    const hasIntelligence = this.hasAnyIntelligenceData(data);
    this.setNoIntelligenceTheme(!hasIntelligence);

    // Clear any existing label/line overlays from scene
    this.clearOverlays();
    // Redraw base first
    this.redrawBaseTexture();

    // Build name index for countries
    const features = this.geojson.features || [];
    const nameFields = ['name', 'NAME', 'ADMIN', 'NAME_LONG', 'SOVEREIGNT', 'BRK_NAME', 'FORMAL_EN'];
    const norm = (s: string) => this.normalizeKey(s);
    const byName = new Map<string, any>();
    for (const f of features) {
      for (const field of nameFields) {
        const val = f.properties?.[field];
        if (val) {
          byName.set(norm(val), f);
          const isoFromName = this.normalizeCountryCode(this.resolveIsoFromName(String(val)) || null);
          const isoFromNameKey = norm(isoFromName ?? '');
          if (isoFromNameKey) {
            byName.set(isoFromNameKey, f);
          }
        }
      }
      if (f.id) {
        byName.set(norm(f.id), f);
        const isoFromId = this.normalizeCountryCode(String(f.id));
        const isoFromIdKey = norm(isoFromId ?? '');
        if (isoFromIdKey) {
          byName.set(isoFromIdKey, f);
        }
      }
    }

    // Country alias mapping -> normalize incoming names to dataset names
    const ALIAS_MAP: Record<string, string> = {
      'us': 'usa',
      'u.s.': 'usa',
      'usa': 'usa',
      'america': 'usa',
      'united states': 'usa',
      'united states of america': 'usa',
      'chicago': 'usa',
      'los angeles': 'usa',
      'new york': 'usa',
      'washington': 'usa',
      'beijing': 'china',
      'shanghai': 'china',
      'hong kong': 'china',
      'south korea': 'korea, republic of',
      'north korea': "korea, democratic people's republic of",
      'russia': 'russian federation',
      'uae': 'united arab emirates',
      'uk': 'united kingdom',
      'gb': 'england',
      'ie': 'ireland',
      'fr': 'france',
      'de': 'germany',
      'es': 'spain',
      'it': 'italy',
      'pt': 'portugal',
      'nl': 'netherlands',
      'be': 'belgium',
      'lu': 'luxembourg',
      'ch': 'switzerland',
      'at': 'austria',
      'se': 'sweden',
      'no': 'norway',
      'fi': 'finland',
      'dk': 'denmark',
      'pl': 'poland',
      'cz': 'czech republic',
      'sk': 'slovakia',
      'hu': 'hungary',
      'ro': 'romania',
      'bg': 'bulgaria',
      'gr': 'greece',
      'tr': 'turkey',
      'ua': 'ukraine',
      'by': 'belarus',
      'lt': 'lithuania',
      'lv': 'latvia',
      'ee': 'estonia',
      'is': 'iceland',
      'ca': 'canada',
      'mx': 'mexico',
      'br': 'brazil',
      'ar': 'argentina',
      'cl': 'chile',
      'co': 'colombia',
      'pe': 'peru',
      've': 'venezuela, bolivarian republic of',
      'uy': 'uruguay',
      'py': 'paraguay',
      'bo': 'bolivia',
      'ec': 'ecuador',
      'za': 'south africa',
      'ng': 'nigeria',
      'eg': 'egypt',
      'ma': 'morocco',
      'dz': 'algeria',
      'tn': 'tunisia',
      'ke': 'kenya',
      'gh': 'ghana',
      'sn': 'senegal',
      'sa': 'saudi arabia',
      'ae': 'united arab emirates',
      'qa': 'qatar',
      'kw': 'kuwait',
      'bh': 'bahrain',
      'om': 'oman',
      'jo': 'jordan',
      'il': 'israel',
      'ir': 'iran, islamic republic of',
      'iq': 'iraq',
      'sy': 'syrian arab republic',
      'lb': 'lebanon',
      'pk': 'pakistan',
      'bd': 'bangladesh',
      'in': 'india',
      'np': 'nepal',
      'lk': 'sri lanka',
      'mm': 'myanmar',
      'th': 'thailand',
      'vn': 'viet nam',
      'ph': 'philippines',
      'my': 'malaysia',
      'sg': 'singapore',
      'id': 'indonesia',
      'au': 'australia',
      'nz': 'new zealand',
      'fj': 'fiji',
      'ru': 'russian federation',
      'cn': 'china',
      'jp': 'japan',
      'kr': 'korea, republic of',
      'kp': "korea, democratic people's republic of",
      'hk': 'china',
      'tw': 'taiwan',
      'united kingdom': 'england',
      'great britain': 'england',
      'u k': 'england',
      'u.k.': 'england',
      'britain': 'england',
      'ivory coast': "cote d ivoire",
      'côte d ivoire': "cote d ivoire",
      'cote d ivoire': "cote d ivoire",
      'czechia': 'czech republic',
      'burma': 'myanmar',
      'swaziland': 'eswatini',
      'eswatini': 'eswatini',
      'turkiye': 'turkey',
      'türkiye': 'turkey',
      'laos': "lao people's democratic republic",
      'lao pdr': "lao people's democratic republic",
      'brunei': 'brunei darussalam',
      'cape verde': 'cabo verde',
      'east timor': 'timor-leste',
      'macedonia': 'north macedonia',
      'moldova': 'moldova, republic of',
      'iran': 'iran, islamic republic of',
      'syria': 'syrian arab republic',
      'tanzania': 'tanzania, united republic of',
      'venezuela': 'venezuela, bolivarian republic of',
      'palestine': 'palestine, state of',
      'micronesia': 'micronesia, federated states of',
      'bahamas': 'the bahamas',
      'gambia': 'the gambia',
      'vietnam': 'viet nam'
    };

    const ctx = this.textureCtx as CanvasRenderingContext2D;
    const path = this.pathGen as any;

    // Styles
    const countryFill = 'rgba(110, 45, 200, 0.25)';
    const countryStroke = 'rgba(150, 90, 230, 0.65)';

    this.labelOverlays = [];
    this.lineOverlays = [];
    this.relationOverlays = [];
    let renderedOverlayLabels = 0;
    const relationshipAnchors: RelationshipAnchor[] = [];
    const relationshipAnchorByCountry = new Map<string, RelationshipAnchor>();
    const renderedCountryKeys = new Set<string>();

    for (const item of data || []) {
      const toTitle = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());
      const resolveKey = (candidate: string): string | null => {
        if (!candidate) return null;
        if (ALIAS_MAP[candidate]) {
          const aliasKey = norm(ALIAS_MAP[candidate]);
          if (byName.has(aliasKey)) {
            return aliasKey;
          }
        }
        if (byName.has(candidate)) {
          return candidate;
        }
        return null;
      };

      let rawCode = (item.locationCode || item.location || item.code || '').toString();
      let rawName = (item.locationName || item.location || item.Location || '').toString();
      if (!rawCode && (!rawName || /unknown\s*\/\s*unmapped/i.test(rawName))) {
        const fallback = this.extractFallbackLocation(item);
        const fallbackCode = fallback?.code ?? '';
        const fallbackName = fallback?.name ?? '';
        if (fallbackCode) rawCode = fallbackCode;
        if (fallbackName) rawName = fallbackName;
      }
      const normalizedCode = rawCode ? norm(rawCode) : '';
      const normalizedName = rawName ? norm(rawName) : '';

      let key = resolveKey(normalizedCode) || resolveKey(normalizedName);
      if (!key && normalizedName && normalizedName !== normalizedCode) {
        key = resolveKey(normalizedName);
      }
      if (!key && normalizedCode) {
        key = resolveKey(normalizedCode);
      }
      if (!key) continue;

      const feature = byName.get(key);
      if (!feature) continue;
      const countries: any[] = [feature];

      const featureName =
        feature.properties?.NAME_LONG ||
        feature.properties?.ADMIN ||
        feature.properties?.NAME ||
        feature.properties?.name ||
        feature.properties?.FORMAL_EN ||
        '';

      const aliasName = normalizedCode && ALIAS_MAP[normalizedCode]
        ? ALIAS_MAP[normalizedCode]
        : (normalizedName && ALIAS_MAP[normalizedName] ? ALIAS_MAP[normalizedName] : '');

      let displayName = rawName && rawName.trim()
        ? rawName.trim()
        : (aliasName || featureName || rawCode.toUpperCase());

      if (!displayName && rawCode) {
        displayName = rawCode.toUpperCase();
      }

      if (displayName && displayName === displayName.toUpperCase() && aliasName) {
        displayName = aliasName;
      }

      if (displayName) {
        const lower = displayName.toLowerCase();
        if (displayName === displayName.toUpperCase() || displayName === lower) {
          displayName = toTitle(lower);
        }
      }

      const rawCodeUpper = rawCode ? rawCode.toUpperCase() : '';
      const isoFromFeatureName = this.resolveIsoFromName(featureName);
      const isoFromDisplayName = this.resolveIsoFromName(displayName);
      const isoCode = rawCodeUpper || isoFromFeatureName || isoFromDisplayName || null;

      if (isoCode) {
        if (feature?.id) {
          this.featureIsoMap.set(feature.id.toString().toUpperCase(), isoCode);
        }
        if (featureName) {
          this.featureIsoMap.set(this.normalizeKey(featureName), isoCode);
        }
        if (displayName) {
          this.featureIsoMap.set(this.normalizeKey(displayName), isoCode);
        }
        if (rawCodeUpper) {
          this.featureIsoMap.set(rawCodeUpper, isoCode);
        }
      }

      const hasRenderableIntel =
        (Array.isArray(item?.nodes_vertex_collection) && item.nodes_vertex_collection.length > 0) ||
        (Array.isArray(item?.iocs) && item.iocs.length > 0) ||
        (Array.isArray(item?.entities) && item.entities.length > 0) ||
        (Array.isArray(item?.highlightIocs) && item.highlightIocs.length > 0) ||
        !!item?.report;
      if (!hasRenderableIntel) {
        continue;
      }
      const countryOverlayKey = key;

      // Root-cause dedupe: multiple backend rows can resolve to the same country.
      // Render one country overlay and merge any duplicate row entity keys into that anchor.
      if (renderedCountryKeys.has(countryOverlayKey)) {
        if (renderRelationshipArcs) {
          const existingAnchor = relationshipAnchorByCountry.get(countryOverlayKey);
          if (existingAnchor) {
            const mergedEntityKeys = this.buildRelationshipEntityKeys(item);
            for (const mergedKey of mergedEntityKeys) {
              if (existingAnchor.entityKeys.size >= this.maxEntityKeysPerLocation) {
                break;
              }
              existingAnchor.entityKeys.add(mergedKey);
            }
          }
        }
        continue;
      }
      renderedCountryKeys.add(countryOverlayKey);

      // Highlight countries
      for (const f of countries) {
        try {
          ctx.beginPath();
          path(f);
          ctx.fillStyle = countryFill;
          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = countryStroke;
          ctx.stroke();
        } catch {}
      }

      // Marker position: centroid of the country
      let lonlat: [number, number] | null = null;
      if (countries.length) {
        try {
          const c = (this.d3 as any).geoCentroid(countries[0]);
          lonlat = [c[0], c[1]];
        } catch {}
      }

      if (lonlat) {
        const canRenderOverlay =
          !this.explorerMode || renderedOverlayLabels < this.maxExplorerOverlayLabels;

        if (!canRenderOverlay) {
          continue;
        }
        renderedOverlayLabels += 1;

        // Create a 3D overlay: line + floating label
        const [lon, lat] = lonlat;
        if (this.explorerMode) {
          if (isoCode) {
            this.countryCentroids.set(isoCode.toUpperCase(), { lon, lat });
          }
          if (rawCodeUpper) {
            this.countryCentroids.set(rawCodeUpper, { lon, lat });
            this.countryCentroids.set(this.normalizeKey(rawCodeUpper), { lon, lat });
          }
          if (displayName) {
            this.countryCentroids.set(this.normalizeKey(displayName), { lon, lat });
          }
          if (rawName) {
            this.countryCentroids.set(this.normalizeKey(rawName), { lon, lat });
          }
          if (item.location) {
            this.countryCentroids.set(this.normalizeKey(String(item.location)), { lon, lat });
          }
        }
        const surface = this.lonLatToVector3(lon, lat, 1.0);
        const tip = this.lonLatToVector3(lon, lat, 1.18); // offset outward

        // Line
        try {
          const geom = new this.three.BufferGeometry().setFromPoints([surface, tip]);
          const mat = new this.three.LineBasicMaterial({ color: 0x5a46a8, transparent: true, opacity: 0.55 });
          const line = new this.three.Line(geom, mat);
          this.lineGroup.add(line);
          this.lineOverlays.push({ line, tip, normal: tip.clone().normalize(), visible: true });
        } catch {}

        // Label
        const lines = this.buildOverlayLines(item);
        const el = document.createElement('div');
        el.className = 'globe-label';
        const title = document.createElement('div');
        title.className = 'label-title';
        title.textContent = displayName || rawCode.toUpperCase();
        el.appendChild(title);
        for (const ln of lines) {
          const l = document.createElement('div');
          l.className = 'label-line';
          l.textContent = ln;
          el.appendChild(l);
        }
        this.queueLabelForReveal(el);
        try {
          const obj = new this.CSS2DObjectCtor(el);
          obj.position.copy(tip);
          this.labelGroup.add(obj);
          this.labelOverlays.push({ obj, tip, normal: tip.clone().normalize(), visible: true });
        } catch {}

        if (renderRelationshipArcs) {
          const entityKeys = this.buildRelationshipEntityKeys(item);
          if (entityKeys.size) {
            const anchor = { tip, entityKeys };
            relationshipAnchors.push(anchor);
            relationshipAnchorByCountry.set(countryOverlayKey, anchor);
          }
        }
      }
    }

    if (renderRelationshipArcs) {
      this.renderRelationshipArcs(relationshipAnchors);
    }

    this.scheduleLabelReveal();

    // Push updated canvas to texture
    if (this.sphereMat?.map) {
      this.sphereMat.map.needsUpdate = true;
    }

    if (this.autoFocusOnSelection && this.selectionFocusPending && (this.selectedCountry || this.selectedCountryCode)) {
      const centroid = this.findCentroidForSelection();
      if (centroid) {
        this.selectionFocusPending = false;
        this.focusOnLonLat(centroid!.lon, centroid!.lat);
      }
    }
  }

  private hasAnyIntelligenceData(data: Array<any> | null | undefined): boolean {
    if (!Array.isArray(data) || !data.length) {
      return false;
    }

    return data.some((item: any) => {
      const entities = Array.isArray(item?.entities) ? item.entities : [];
      const iocs = Array.isArray(item?.iocs) ? item.iocs : [];
      const highlights = Array.isArray(item?.highlightIocs) ? item.highlightIocs : [];
      const reportNodes = Array.isArray(item?.nodes_vertex_collection) ? item.nodes_vertex_collection : [];
      const nodeEntities = reportNodes.some((node: any) => Array.isArray(node?.entities) && node.entities.length > 0);

      return entities.length > 0 || iocs.length > 0 || highlights.length > 0 || nodeEntities;
    });
  }

  private sanitizeOverlayLineText(value: string): string {
    return value.replace(/^Article(?:\s*[:\-])?\s*/i, '').trim();
  }

  private buildOverlayLines(item: any): string[] {
    const preferredItems = [
      ...(Array.isArray(item?.highlightIocs) ? item.highlightIocs : []),
      ...(Array.isArray(item?.iocs) ? item.iocs : []),
      ...(Array.isArray(item?.entities) ? item.entities : [])
    ];

    const fallbackItems = Array.isArray(item?.nodes_vertex_collection) ? item.nodes_vertex_collection : [];
    const candidates = preferredItems.length ? preferredItems : fallbackItems;
    const seen = new Set<string>();
    const lines: string[] = [];
    const usedTypes = new Set<string>();
    const deferred: string[] = [];

    for (const candidate of candidates) {
      const formatted = this.formatOverlayLine(candidate);
      if (!formatted) {
        continue;
      }
      const dedupeKey = formatted.toLowerCase();
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      const capped = formatted.length > 300 ? `${formatted.slice(0, 297)}…` : formatted;
      const candidateType = String(candidate?.type ?? '').trim().toLowerCase() || '__unknown__';

      if (!usedTypes.has(candidateType)) {
        usedTypes.add(candidateType);
        lines.push(capped);
      } else {
        deferred.push(capped);
      }

      if (lines.length >= 3) {
        return lines;
      }
    }

    for (const deferredLine of deferred) {
      lines.push(deferredLine);
      if (lines.length >= 3) {
        break;
      }
    }

    return lines;
  }

  private extractFallbackLocation(item: any): { code: string; name: string } | null {
    const reportNodes = Array.isArray(item?.nodes_vertex_collection) ? item.nodes_vertex_collection : [];
    for (const report of reportNodes) {
      const entities = Array.isArray(report?.entities) ? report.entities : [];
      for (const entity of entities) {
        if (String(entity?.type ?? '').trim().toLowerCase() !== 'location') {
          continue;
        }
        const code = this.normalizeCountryCode(String((entity as any)?.country ?? '').trim()) || '';
        const name = String(entity?.name ?? '').trim();
        if (code || name) {
          return { code, name };
        }
      }
    }
    return null;
  }

  private buildRelationshipEntityKeys(item: any): Set<string> {
    const keys = new Set<string>();
    const allowedTypes = new Set([
      'indicator',
      'domain-name',
      'url',
      'ipv4-addr',
      'email-addr',
      'windows-registry-key',
      'malware',
      'vulnerability',
      'file',
      'software',
      'tool',
      'attack-pattern',
      'campaign',
      'intrusion-set',
      'threat-actor',
      'infrastructure',
      'organization',
      'course-of-action',
    ]);
    const strongFallbackRelationshipTypes = new Set([
      'uses',
      'targets',
      'attributed-to',
      'indicates',
      'located-at',
      'references',
      'related-to',
      'correlates-with',
    ]);
    const ingest = (candidate: any, source: 'visible' | 'fallback') => {
      if (!candidate || keys.size >= this.maxEntityKeysPerLocation) {
        return;
      }
      const type = String(candidate?.type ?? '').trim().toLowerCase();
      if (type === 'report' || type === 'marking-definition' || !allowedTypes.has(type)) {
        return;
      }
      if (source === 'fallback') {
        const relationshipType = String(candidate?.relationshipType ?? '').trim().toLowerCase();
        if (relationshipType && !strongFallbackRelationshipTypes.has(relationshipType)) {
          return;
        }
      }
      const primary = this.sanitizeOverlayLineText(
        String(candidate?.name ?? candidate?.value ?? candidate?.pattern ?? '').trim()
      ).toLowerCase();
      if (!primary) {
        return;
      }
      const normalized = primary.replace(/\s+/g, ' ').slice(0, 140);
      if (!normalized || normalized.length < 4) {
        return;
      }
      keys.add(`${type || 'unknown'}:${normalized}`);
    };

    const highlights = Array.isArray(item?.highlightIocs) ? item.highlightIocs : [];
    const iocs = Array.isArray(item?.iocs) ? item.iocs : [];
    const directEntities = Array.isArray(item?.entities) ? item.entities : [];
    const visibleCandidates = [...highlights, ...iocs, ...directEntities];

    if (visibleCandidates.length) {
      for (const entity of visibleCandidates) {
        ingest(entity, 'visible');
        if (keys.size >= this.maxEntityKeysPerLocation) {
          return keys;
        }
      }
      const minSharedForCurrentView = this.getMinSharedEntitiesForArc();
      if (keys.size >= minSharedForCurrentView) {
        return keys;
      }
    }

    const reportNodes = Array.isArray(item?.nodes_vertex_collection) ? item.nodes_vertex_collection : [];
    for (const report of reportNodes) {
      const entities = Array.isArray(report?.entities) ? report.entities : [];
      for (const entity of entities) {
        ingest(entity, 'fallback');
        if (keys.size >= this.maxEntityKeysPerLocation) {
          return keys;
        }
      }
    }

    return keys;
  }

  private renderRelationshipArcs(anchors: Array<{ tip: any; entityKeys: Set<string> }>): void {
    if (!this.relationGroup || anchors.length < 2) {
      return;
    }

    const collectPairs = (minShared: number): Array<{ a: number; b: number; shared: number }> => {
      const pairs: Array<{ a: number; b: number; shared: number }> = [];
      let checks = 0;
      for (let i = 0; i < anchors.length; i++) {
        for (let j = i + 1; j < anchors.length; j++) {
          checks += 1;
          if (checks > this.maxPairChecks) {
            break;
          }
          const shared = this.countSharedEntityKeys(anchors[i].entityKeys, anchors[j].entityKeys);
          if (shared >= minShared) {
            pairs.push({ a: i, b: j, shared });
          }
        }
        if (checks > this.maxPairChecks) {
          break;
        }
      }
      return pairs;
    };

    const pairs = collectPairs(this.getMinSharedEntitiesForArc());

    if (!pairs.length) {
      return;
    }

    pairs.sort((left, right) => right.shared - left.shared);
    const topPairs = pairs.slice(0, this.maxExplorerRelationshipArcs);

    for (const pair of topPairs) {
      const from = anchors[pair.a].tip;
      const to = anchors[pair.b].tip;
      const sharedKeys = this.collectSharedEntityKeys(anchors[pair.a].entityKeys, anchors[pair.b].entityKeys, 8);
      if (!sharedKeys.length) {
        continue;
      }
      // Skip self-pairs that can happen when multiple rows collapse to the same country centroid.
      if (from && to && typeof from.distanceTo === 'function' && from.distanceTo(to) < 1e-6) {
        continue;
      }
      const points = this.buildArcPointsAboveGlobe(from, to, pair.shared);
      if (points.length < 2) {
        continue;
      }
      const mid = points[Math.floor(points.length / 2)].clone();
      const geometry = new this.three.BufferGeometry().setFromPoints(points);
      const opacity = Math.min(0.72, 0.18 + pair.shared * 0.08);
      const material = new this.three.LineBasicMaterial({
        color: 0x8b6dff,
        transparent: true,
        opacity
      });
      const arc = new this.three.Line(geometry, material);
      this.relationGroup.add(arc);
      this.relationOverlays.push({ line: arc, mid, normal: mid.clone().normalize(), visible: true, opacity });

      try {
        const labelEl = document.createElement('div');
        labelEl.className = 'globe-arc-label';
        labelEl.textContent = `Shared: ${pair.shared}`;
        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'globe-arc-tooltip';
        const tooltipTitleEl = document.createElement('div');
        tooltipTitleEl.className = 'globe-arc-tooltip-title';
        tooltipTitleEl.textContent = 'Shared entities';
        tooltipEl.appendChild(tooltipTitleEl);
        for (const key of sharedKeys) {
          const lineEl = document.createElement('div');
          lineEl.className = 'globe-arc-tooltip-line';
          lineEl.textContent = this.formatEntityKeyForDisplay(key);
          tooltipEl.appendChild(lineEl);
        }
        labelEl.appendChild(tooltipEl);
        labelEl.setAttribute(
          'title',
          sharedKeys.map(key => this.formatEntityKeyForDisplay(key)).join('\n')
        );
        const labelObj = new this.CSS2DObjectCtor(labelEl);
        labelObj.position.copy(mid);
        this.labelGroup.add(labelObj);
        this.relationLabelOverlays.push({ obj: labelObj, mid, normal: mid.clone().normalize(), visible: true });
      } catch {}
    }
  }

  private buildArcPointsAboveGlobe(from: any, to: any, sharedWeight: number): any[] {
    const start = from.clone().normalize();
    const end = to.clone().normalize();
    const dotRaw = start.dot(end);
    const dot = Math.max(-1, Math.min(1, dotRaw));
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);
    // Scale arc curvature by angular separation so nearby regions don't produce
    // exaggerated high arcs. Keep a small baseline so links remain readable.
    const normalizedDistance = Math.min(1, Math.max(0, omega / 1.2));
    const sharedFactor = Math.min(sharedWeight, 8) / 8;
    const baseRadius = 1.175 + normalizedDistance * 0.01;
    const humpBase = 0.015 + 0.07 * Math.pow(normalizedDistance, 1.2);
    const humpShared = 0.03 * sharedFactor * normalizedDistance;
    const hump = Math.min(0.14, humpBase + humpShared);
    const points: any[] = [];

    for (let i = 0; i <= this.arcInterpolationPoints; i++) {
      const t = i / this.arcInterpolationPoints;
      let direction: any;

      if (sinOmega > 1e-6) {
        const factorA = Math.sin((1 - t) * omega) / sinOmega;
        const factorB = Math.sin(t * omega) / sinOmega;
        direction = start.clone().multiplyScalar(factorA).add(end.clone().multiplyScalar(factorB)).normalize();
      } else if (dot < -0.999) {
        let ortho = new this.three.Vector3(0, 1, 0);
        if (Math.abs(start.dot(ortho)) > 0.9) {
          ortho = new this.three.Vector3(1, 0, 0);
        }
        ortho = ortho.sub(start.clone().multiplyScalar(start.dot(ortho))).normalize();
        direction = start.clone().multiplyScalar(Math.cos(Math.PI * t)).add(ortho.multiplyScalar(Math.sin(Math.PI * t))).normalize();
      } else {
        direction = start.clone().lerp(end, t).normalize();
      }

      const radius = baseRadius + hump * Math.sin(Math.PI * t);
      points.push(direction.multiplyScalar(radius));
    }

    return points;
  }

  private countSharedEntityKeys(left: Set<string>, right: Set<string>): number {
    if (!left.size || !right.size) {
      return 0;
    }
    const smaller = left.size <= right.size ? left : right;
    const larger = smaller === left ? right : left;
    let shared = 0;
    for (const key of smaller) {
      if (this.isShareableEntityKey(key) && larger.has(key)) {
        shared += 1;
      }
    }
    return shared;
  }

  private collectSharedEntityKeys(left: Set<string>, right: Set<string>, limit: number): string[] {
    if (!left.size || !right.size || limit <= 0) {
      return [];
    }
    const smaller = left.size <= right.size ? left : right;
    const larger = smaller === left ? right : left;
    const shared: string[] = [];
    for (const key of smaller) {
      if (!this.isShareableEntityKey(key) || !larger.has(key)) {
        continue;
      }
      shared.push(key);
      if (shared.length >= limit) {
        break;
      }
    }
    return shared;
  }

  private isShareableEntityKey(key: string): boolean {
    if (!key || !key.includes(':')) {
      return false;
    }
    const type = key.slice(0, key.indexOf(':')).trim().toLowerCase();
    return this.sharedArcEntityTypes.has(type);
  }

  private formatEntityKeyForDisplay(key: string): string {
    if (!key || !key.includes(':')) {
      return key || 'Unknown';
    }
    const idx = key.indexOf(':');
    const type = key.slice(0, idx);
    const value = key.slice(idx + 1);
    const prettyType = TYPE_PRESENTATION[type]?.label ?? this.toTitleCase(type);
    return `${prettyType}: ${value}`;
  }

  private getMinSharedEntitiesForArc(): number {
    // Landing globe should visualize cross-location links more readily.
    if (!this.explorerMode && this.enableSharedRelationshipArcs) {
      return 1;
    }
    return this.minSharedEntitiesForArc;
  }

  private formatOverlayLine(candidate: any): string | null {
    if (!candidate) {
      return null;
    }

    const type = String(candidate?.type ?? '').trim();
    const relationshipType = String(candidate?.relationshipType ?? '').trim().toLowerCase();
    const name = this.sanitizeOverlayLineText(String(candidate?.name ?? '').trim());
    const value = this.sanitizeOverlayLineText(String(candidate?.value ?? '').trim());
    const pattern = this.sanitizeOverlayLineText(String(candidate?.pattern ?? '').trim());

    const primary = name || value || pattern;
    if (!primary) {
      return null;
    }

    if (type === 'report' || type === 'marking-definition') {
      return null;
    }

    if (relationshipType === 'created-by' || relationshipType === 'object-marking' || relationshipType === 'duplicate-of') {
      return null;
    }

    if (primary.toLowerCase() === 'lunarengine threat intelligence') {
      return null;
    }

    const preferredTypes = new Set([
      'indicator',
      'domain-name',
      'url',
      'ipv4-addr',
      'file',
      'email-addr',
      'windows-registry-key',
      'tool',
      'malware',
      'attack-pattern',
      'campaign',
      'intrusion-set',
      'threat-actor',
      'infrastructure',
      'vulnerability',
      'location',
      'identity',
      'organization',
      'software'
    ]);

    if (type && !preferredTypes.has(type)) {
      return null;
    }

    if (type && type !== 'report') {
      const label = TYPE_PRESENTATION[type]?.label ?? this.toTitleCase(type);
      return `${label}: ${primary}`;
    }

    return primary;
  }

  private setNoIntelligenceTheme(isNoIntelligence: boolean): void {
    const target = isNoIntelligence ? 1 : 0;
    if (Math.abs(target - this.borderThemeProgress) < 0.001) {
      this.borderThemeProgress = target;
      return;
    }

    if (this.borderThemeAnimId !== null) {
      cancelAnimationFrame(this.borderThemeAnimId);
      this.borderThemeAnimId = null;
    }

    const start = this.borderThemeProgress;
    const delta = target - start;
    const durationMs = 320;
    const startedAt = performance.now();

    const step = () => {
      const elapsed = performance.now() - startedAt;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.borderThemeProgress = start + delta * eased;

      this.redrawBaseTexture();
      if (this.sphereMat?.map) {
        this.sphereMat.map.needsUpdate = true;
      }

      if (t < 1) {
        this.borderThemeAnimId = requestAnimationFrame(step);
      } else {
        this.borderThemeProgress = target;
        this.borderThemeAnimId = null;
      }
    };

    this.borderThemeAnimId = requestAnimationFrame(step);
  }

  private getBaseLineTheme() {
    const mix = (from: number, to: number) => from + (to - from) * this.borderThemeProgress;
    const rgba = (r: number, g: number, b: number, a: number) =>
      `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(3)})`;

    // Intel present (purple) -> no intel (red)
    return {
      graticule: rgba(mix(120, 175), mix(105, 72), mix(170, 72), mix(0.10, 0.14)),
      border: rgba(mix(110, 210), mix(45, 55), mix(200, 70), mix(0.45, 0.58)),
      glow: rgba(mix(110, 190), mix(45, 42), mix(200, 42), mix(0.25, 0.34))
    };
  }

  private queueLabelForReveal(el: HTMLElement): void {
    if (!el) {
      return;
    }
    if (!el.classList.contains('globe-label--hidden')) {
      el.classList.add('globe-label--hidden');
    }
    this.pendingLabelElements.push(el);
  }

  private scheduleLabelReveal(): void {
    if (!this.pendingLabelElements.length) {
      return;
    }
    if (this.focusActive || this.focusAnimation) {
      this.pendingLabelReveal = true;
      return;
    }
    this.scheduleLabelRevealWithDelay(this.labelRevealBaseDelayMs);
  }

  private scheduleLabelRevealWithDelay(delay: number): void {
    if (!this.pendingLabelElements.length) {
      this.pendingLabelReveal = false;
      return;
    }
    if (this.labelRevealTimer) {
      clearTimeout(this.labelRevealTimer);
    }
    this.labelRevealTimer = setTimeout(() => {
      this.labelRevealTimer = null;
      this.revealPendingLabels();
    }, delay);
    this.pendingLabelReveal = false;
  }

  private revealPendingLabels(): void {
    if (!this.pendingLabelElements.length) {
      return;
    }
    const elements = [...this.pendingLabelElements];
    this.pendingLabelElements = [];
    requestAnimationFrame(() => {
      for (const el of elements) {
        el.classList.remove('globe-label--hidden');
      }
    });
  }

  private onFocusAnimationComplete(): void {
    if (!this.focusActive) {
      return;
    }
    this.focusActive = false;
    if (this.pendingLabelReveal || this.pendingLabelElements.length) {
      this.scheduleLabelRevealWithDelay(this.labelRevealAfterFocusMs);
    }
  }

  private clearPendingLabelReveal(): void {
    if (this.labelRevealTimer) {
      clearTimeout(this.labelRevealTimer);
      this.labelRevealTimer = null;
    }
    this.pendingLabelElements = [];
    this.pendingLabelReveal = false;
  }

  private lonLatToVector3(lonDeg: number, latDeg: number, radius: number) {
    // Flip longitude to align with sphere texture orientation
    const lon = (-lonDeg * Math.PI) / 180;
    const lat = (latDeg * Math.PI) / 180;
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    return new (this as any).three.Vector3(x, y, z);
  }

  private clearOverlays(): void {
    // Remove line objects and dispose resources
    if (this.lineGroup) {
      while (this.lineGroup.children.length) {
        const obj: any = this.lineGroup.children.pop();
        if (!obj) continue;
        if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose();
        if (obj.material) {
          const mat: any = obj.material;
          if (typeof mat.dispose === 'function') mat.dispose();
        }
        this.lineGroup.remove(obj);
      }
    }
    if (this.relationGroup) {
      while (this.relationGroup.children.length) {
        const obj: any = this.relationGroup.children.pop();
        if (!obj) continue;
        if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose();
        if (obj.material) {
          const mat: any = obj.material;
          if (typeof mat.dispose === 'function') mat.dispose();
        }
        this.relationGroup.remove(obj);
      }
    }
    // Remove label objects and their DOM elements
    if (this.labelGroup) {
      while (this.labelGroup.children.length) {
        const obj: any = this.labelGroup.children.pop();
        if (!obj) continue;
        // Remove the associated DOM element from the CSS2DRenderer container
        if (obj.element && obj.element.parentNode) {
          try { obj.element.parentNode.removeChild(obj.element); } catch {}
        }
        this.labelGroup.remove(obj);
      }
    }
    // Reset tracking arrays
    this.labelOverlays = [];
    this.lineOverlays = [];
    this.relationOverlays = [];
    this.relationLabelOverlays = [];
    this.clearPendingLabelReveal();
  }

  private updateOverlayVisibility(): void {
    if (!this.labelOverlays || !this.lineOverlays) return;
    const cameraDirection = this.camera.position.clone().normalize();
    const visibilityThreshold = 0.18;

    for (const entry of this.labelOverlays) {
      const isFront = entry.normal.dot(cameraDirection) > visibilityThreshold;
      if (entry.visible === isFront) {
        continue;
      }
      entry.visible = isFront;
      const el: HTMLElement = entry.obj.element as HTMLElement;
      el.style.opacity = isFront ? '1' : '0';
      el.style.visibility = isFront ? 'visible' : 'hidden';
      entry.obj.visible = isFront;
    }
    for (const entry of this.lineOverlays) {
      const isFront = entry.normal.dot(cameraDirection) > visibilityThreshold;
      if (entry.visible === isFront) {
        continue;
      }
      entry.visible = isFront;
      entry.line.visible = isFront;
      const mat = entry.line.material as any;
      if (mat && typeof mat.opacity === 'number' && mat.opacity !== (isFront ? 0.9 : 0.0)) {
        mat.opacity = isFront ? 0.9 : 0.0;
        mat.transparent = true;
      }
    }
    for (const entry of this.relationOverlays) {
      const isFront = entry.normal.dot(cameraDirection) > 0.08;
      if (entry.visible === isFront) {
        continue;
      }
      entry.visible = isFront;
      entry.line.visible = isFront;
      const mat = entry.line.material as any;
      if (mat && typeof mat.opacity === 'number') {
        mat.opacity = isFront ? entry.opacity : 0;
      }
    }
    for (const entry of this.relationLabelOverlays) {
      // Keep relationship labels stricter than arc lines so "Shared" tags
      // don't leak through when arcs skim the rear hemisphere.
      const isFront = entry.normal.dot(cameraDirection) > 0.08;
      if (entry.visible === isFront) {
        continue;
      }
      entry.visible = isFront;
      const el: HTMLElement = entry.obj.element as HTMLElement;
      el.style.opacity = isFront ? '1' : '0';
      el.style.visibility = isFront ? 'visible' : 'hidden';
      entry.obj.visible = isFront;
    }
  }

  private setupClickHighlight(): void {
    if (!this.renderer || !this.camera || !this.sphereMesh) return;
    const canvas: HTMLCanvasElement = this.renderer.domElement as HTMLCanvasElement;
    const raycaster = new this.three.Raycaster();
    const mouse = new this.three.Vector2();

    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);
      const hits = raycaster.intersectObject(this.sphereMesh);
      if (!hits || hits.length === 0) return;
      const point = hits[0].point;

      const lon = Math.atan2(point.z, point.x) * 180 / Math.PI * -1;
      const lat = Math.asin(point.y / point.length()) * 180 / Math.PI;

      let selected: any = null;
      if (this.geojson && this.d3 && Array.isArray(this.geojson.features)) {
        for (const f of this.geojson.features) {
          try {
            if ((this.d3 as any).geoContains(f, [lon, lat])) { selected = f; break; }
          } catch {}
        }
      }
      if (!selected) return;

      // Ensure only one selection: reset base + overlays, then draw current selection
      if (this.lastOverlayData && this.lastOverlayData.length) {
        this.updateLocationIocs(this.lastOverlayData);
      } else {
        this.redrawBaseTexture();
        if (this.sphereMat?.map) this.sphereMat.map.needsUpdate = true;
      }
      this.drawCountryHighlight(selected);

      // Emit selected country metadata to parent
      const featureCode = this.normalizeCountryCode(selected?.id ? selected.id.toString() : null);
      const featureName = selected?.properties?.NAME_LONG ||
        selected?.properties?.ADMIN ||
        selected?.properties?.NAME ||
        selected?.properties?.name ||
        selected?.properties?.FORMAL_EN ||
        featureCode || null;
      const normalizedFeatureName = featureName ? this.normalizeKey(featureName) : '';
      const isoFromId = featureCode ? this.normalizeCountryCode(this.featureIsoMap.get(featureCode) || null) : undefined;
      const isoFromName = normalizedFeatureName
        ? this.normalizeCountryCode(this.featureIsoMap.get(normalizedFeatureName) || null)
        : undefined;
      const isoFromRegion = this.resolveIsoFromName(featureName);
      const isoCode = this.normalizeCountryCode(isoFromId || isoFromName || isoFromRegion || featureCode || null);

      let focusLonLat: [number, number] | null = null;
      if (selected && this.d3 && typeof (this.d3 as any).geoCentroid === 'function') {
        try {
          const centroid = (this.d3 as any).geoCentroid(selected);
          if (Array.isArray(centroid) && centroid.length >= 2) {
            focusLonLat = [centroid[0], centroid[1]];
          }
        } catch {}
      }
      if (!focusLonLat) {
        focusLonLat = [lon, lat];
      }
      if (focusLonLat) {
        this.focusOnLonLat(focusLonLat[0], focusLonLat[1]);
      }

      this.selectedCountryChange.emit({ name: featureName, code: isoCode });

      // Keep highlight for a short window before restoring defaults
      // Leave selection active until user picks another country
    };

    canvas.addEventListener('click', onClick);
  }

  private drawCountryHighlight(feature: any): void {
    if (!this.textureCtx || !this.pathGen) return;
    const ctx = this.textureCtx;
    ctx.save();
    try {
      ctx.beginPath();
      this.pathGen(feature);
      ctx.fillStyle = 'rgba(110, 45, 200, 0.35)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(170, 120, 255, 0.75)';
      ctx.stroke();
      if (this.sphereMat?.map) this.sphereMat.map.needsUpdate = true;
    } finally {
      ctx.restore();
    }
  }

  private redrawBaseTexture(): void {
    if (!this.textureCtx || !this.textureCanvas || !this.d3 || !this.projection || !this.pathGen) return;
    const ctx = this.textureCtx;
    const theme = this.getBaseLineTheme();
    const width = this.textureCanvas.width;
    const height = this.textureCanvas.height;
    // clear
    ctx.clearRect(0, 0, width, height);
    // base ocean
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, width, height);
    // graticule
    try {
      const graticule = (this.d3 as any).geoGraticule().step([15, 15]);
      ctx.beginPath();
      this.pathGen(graticule());
      ctx.lineWidth = 0.35;
      ctx.strokeStyle = theme.graticule;
      ctx.stroke();
    } catch {}
    // land
    ctx.beginPath();
    this.pathGen({ type: 'FeatureCollection', features: this.geojson.features });
    ctx.fillStyle = '#0e0f14';
    ctx.fill();
    // borders
    ctx.lineWidth = 0.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = theme.border;
    ctx.shadowBlur = 6;
    ctx.shadowColor = theme.glow;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.controls) this.controls.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      const el = this.containerRef?.nativeElement;
      if (el && this.renderer.domElement && el.contains(this.renderer.domElement)) {
        el.removeChild(this.renderer.domElement);
      }
    }
    if (this.sliderDebounceHandle) {
      clearTimeout(this.sliderDebounceHandle);
      this.sliderDebounceHandle = null;
    }
    if (this.focusDebounceHandle) {
      clearTimeout(this.focusDebounceHandle);
      this.focusDebounceHandle = null;
    }
    if (this.focusResumeTimer) {
      clearTimeout(this.focusResumeTimer);
      this.focusResumeTimer = null;
    }
    if (this.borderThemeAnimId !== null) {
      cancelAnimationFrame(this.borderThemeAnimId);
      this.borderThemeAnimId = null;
    }
    this.clearPendingLabelReveal();
  }
}

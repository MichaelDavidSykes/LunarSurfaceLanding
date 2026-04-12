var LandingGlobeComponent_1;
import { __decorate, __param } from "tslib";
import { Component, ViewChild, Inject, PLATFORM_ID, Output, EventEmitter, Input, HostBinding } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
const TYPE_PRESENTATION = {
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
const DEFAULT_PRESENTATION = {
    label: 'Related Intelligence',
    icon: 'hub',
    accent: 'accent-generic',
    order: 99
};
let LandingGlobeComponent = class LandingGlobeComponent {
    static { LandingGlobeComponent_1 = this; }
    get landingModeClass() {
        return !this.explorerMode;
    }
    get explorerModeClass() {
        return this.explorerMode;
    }
    static { this.regionNameToIsoMap = (() => {
        const map = new Map();
        try {
            const DisplayNamesCtor = Intl?.DisplayNames;
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
        }
        catch {
            /* no-op */
        }
        return map;
    })(); }
    static { this.nameAliasToIso = {
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
        'west bank': 'PS',
        'state of palestine': 'PS'
    }; }
    set selectedCountryGroups(value) {
        this._selectedCountryGroups = Array.isArray(value) ? value : [];
        this.recomputeLandingReportSnippets();
    }
    get selectedCountryGroups() {
        return this._selectedCountryGroups;
    }
    set selectedCountryIocs(value) {
        this._selectedCountryIocs = Array.isArray(value) ? value : [];
        this.entityGroups = this.buildEntityGroups(this._selectedCountryIocs);
        this.entityGroupsChange.emit(this.entityGroups);
        this.recomputeLandingReportSnippets();
    }
    get selectedCountryIocs() {
        return this._selectedCountryIocs;
    }
    set stretch(value) {
        this._stretch = !!value;
        this.stretchClass = this._stretch;
    }
    get stretch() {
        return this._stretch;
    }
    constructor(platformId) {
        this.stretchClass = false;
        this.labelOverlays = [];
        this.lineOverlays = [];
        this.selectedFeature = null;
        this.selectedIsoCode = null;
        this.selectedFeatureKey = null;
        this.animationId = null;
        this.pendingLabelElements = [];
        this.labelRevealTimer = null;
        this.focusActive = false;
        this.pendingLabelReveal = false;
        this.countryCentroids = new Map();
        this.focusAnimation = null;
        this.focusResumeTimer = null;
        this.autoRotateHoldUntil = 0;
        this.selectionFocusPending = false;
        this.ready = false;
        this.pendingHighlightData = null;
        this.lastOverlayData = null;
        this.featureIsoMap = new Map();
        this.focusDurationMs = 1200;
        this.focusHoldMs = 30000;
        this.labelRevealBaseDelayMs = 70;
        this.labelRevealAfterFocusMs = 140;
        this.selectedCountryChange = new EventEmitter();
        this.entityGroupsChange = new EventEmitter();
        this.selectedCountry = null;
        this.selectedCountryCode = null;
        this._selectedCountryGroups = [];
        this.selectedCountryLoading = false;
        this.explorerMode = false;
        this.autoFocusOnSelection = false;
        this.enableDateFilter = false;
        this.dateRangeChange = new EventEmitter();
        this._selectedCountryIocs = [];
        this.entityGroups = [];
        this.landingReportSnippetsCache = [];
        this._stretch = false;
        this.dayMs = 24 * 60 * 60 * 1000;
        this.sliderMin = 0;
        this.sliderMax = 0;
        this.sliderStartValue = 0;
        this.sliderEndValue = 0;
        this.dateRangeReady = false;
        this.dateRangeFormatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        });
        this.lastEmittedRange = null;
        this.sliderDebounceHandle = null;
        this.sliderDebounceMs = 500;
        this.focusDebounceHandle = null;
        this.focusDebounceMs = 100;
        this.overlayRenderHandle = null;
        this.isBrowser = isPlatformBrowser(platformId);
    }
    ngOnChanges(changes) {
        if ('selectedCountry' in changes && !this.selectedCountry) {
            this.entityGroups = [];
            this.selectionFocusPending = false;
            this.entityGroupsChange.emit([]);
        }
        if (this.enableDateFilter &&
            ('dateRangeStart' in changes ||
                'dateRangeEnd' in changes ||
                'dateRangeMin' in changes ||
                'dateRangeMax' in changes ||
                'enableDateFilter' in changes)) {
            this.syncDateFilterState();
        }
        if ('enableDateFilter' in changes && !this.enableDateFilter) {
            this.dateRangeReady = false;
        }
        if ('selectedCountryGroups' in changes ||
            'explorerMode' in changes ||
            ('selectedCountry' in changes && !this.selectedCountry)) {
            this.recomputeLandingReportSnippets();
        }
        if (this.explorerMode && this.autoFocusOnSelection &&
            (("selectedCountry" in changes) || ("selectedCountryCode" in changes)) &&
            (this.selectedCountry || this.selectedCountryCode) &&
            !this.selectedCountryLoading) {
            this.scheduleFocusFromSelection();
        }
        if (this.explorerMode && this.autoFocusOnSelection &&
            ('selectedCountryLoading' in changes) &&
            this.selectedCountryLoading === false &&
            (this.selectedCountry || this.selectedCountryCode)) {
            this.scheduleFocusFromSelection();
        }
        else if (!this.explorerMode) {
            this.selectionFocusPending = false;
        }
    }
    scheduleFocusFromSelection() {
        if (this.focusDebounceHandle) {
            clearTimeout(this.focusDebounceHandle);
        }
        this.focusDebounceHandle = setTimeout(() => {
            this.focusDebounceHandle = null;
            this.focusFromSelection();
        }, this.focusDebounceMs);
    }
    get dateRangeLabel() {
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
    buildEntityGroups(entities) {
        if (!entities || entities.length === 0) {
            return [];
        }
        const groupsMap = new Map();
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
            const target = groupsMap.get(groupKey);
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
    sortGroupItems(items) {
        return [...items].sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            if (tsA === tsB) {
                return a.primary.localeCompare(b.primary);
            }
            return tsB - tsA;
        });
    }
    resolvePrimaryText(entity) {
        return (entity.name?.trim() ||
            entity.value?.toString().trim() ||
            entity.pattern?.toString().trim() ||
            'Unnamed entity');
    }
    resolveSecondaryText(entity, primary) {
        if (entity.pattern && entity.pattern !== primary) {
            return entity.pattern;
        }
        if (entity.value && entity.value !== primary) {
            return entity.value;
        }
        return undefined;
    }
    toTitleCase(value) {
        return value
            .split(/[^a-z0-9]+/gi)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
            || DEFAULT_PRESENTATION.label;
    }
    normalizeKey(value) {
        return value?.toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';
    }
    resolveIsoFromName(name) {
        if (!name)
            return undefined;
        const lower = name.toLowerCase();
        return LandingGlobeComponent_1.nameAliasToIso[lower] || LandingGlobeComponent_1.regionNameToIsoMap.get(lower);
    }
    onDateRangeSliderChange() {
        if (!this.enableDateFilter || !this.dateRangeReady) {
            return;
        }
        this.ensureSliderOrdering();
        this.scheduleDateRangeEmit();
    }
    syncDateFilterState() {
        const minTimestamp = this.getAlignedTimestamp(this.dateRangeMin ?? this.dateRangeStart, 'floor');
        const maxTimestamp = this.getAlignedTimestamp(this.dateRangeMax ?? this.dateRangeEnd ?? this.dateRangeStart, 'floor');
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
    normalizeDateValue(value) {
        if (!value) {
            return null;
        }
        const date = value instanceof Date ? value : new Date(value);
        const time = date.getTime();
        return Number.isFinite(time) ? time : null;
    }
    getAlignedTimestamp(value, direction) {
        if (typeof value === 'number') {
            return this.alignToDay(value, direction);
        }
        const normalized = this.normalizeDateValue(value);
        if (normalized === null) {
            return null;
        }
        return this.alignToDay(normalized, direction);
    }
    alignToDay(timestamp, direction) {
        const remainder = timestamp % this.dayMs;
        if (remainder === 0) {
            return timestamp;
        }
        return direction === 'floor'
            ? timestamp - remainder
            : timestamp + (this.dayMs - remainder);
    }
    clampToSlider(value) {
        if (!Number.isFinite(value)) {
            return this.sliderMin;
        }
        return Math.min(Math.max(value, this.sliderMin), this.sliderMax);
    }
    ensureSliderOrdering() {
        if (this.sliderStartValue > this.sliderEndValue) {
            const temp = this.sliderStartValue;
            this.sliderStartValue = this.sliderEndValue;
            this.sliderEndValue = temp;
        }
    }
    get landingEntitySnippets() {
        if (this.explorerMode || !this.entityGroups.length) {
            return [];
        }
        const snippets = [];
        const seen = new Set();
        for (const group of this.entityGroups) {
            for (const item of group.items.slice(0, 3)) {
                const main = item.primary?.trim();
                if (main) {
                    const key = main.toLowerCase();
                    if (seen.has(key)) {
                        continue;
                    }
                    seen.add(key);
                    snippets.push(main);
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
    get landingReportSnippets() {
        return this.landingReportSnippetsCache;
    }
    recomputeLandingReportSnippets() {
        if (this.explorerMode) {
            this.landingReportSnippetsCache = [];
            return;
        }
        const reports = new Map();
        const ingest = (rawTitle, modified, source, link) => {
            const normalized = (rawTitle ?? '')
                .replace(/^Article:\s*/i, '')
                .trim() || 'Related report';
            const existing = reports.get(normalized);
            if (existing) {
                if (modified && (!existing.modified || modified > existing.modified)) {
                    existing.modified = modified;
                }
                if (source && !existing.source) {
                    existing.source = source;
                }
                if (link && !existing.link) {
                    existing.link = link;
                }
            }
            else {
                reports.set(normalized, {
                    title: normalized,
                    modified: modified ?? null,
                    source: source ?? null,
                    link: link ?? null
                });
            }
        };
        for (const group of this.selectedCountryGroups) {
            ingest(group.report, group.modified, group.sourceName, group.sourceLink);
        }
        if (!this.selectedCountryGroups.length) {
            for (const entity of this._selectedCountryIocs) {
                ingest(entity.report ?? null, entity.modified ?? null, null, null);
            }
        }
        this.landingReportSnippetsCache = Array.from(reports.values()).slice(0, 3).map((value) => ({
            title: value.title,
            date: value.modified ?? null,
            source: value.source ?? null,
            link: value.link ?? null
        }));
    }
    focusFromSelection() {
        if (!this.explorerMode) {
            this.selectionFocusPending = false;
            return;
        }
        const centroid = this.findCentroidForSelection();
        if (centroid) {
            this.selectionFocusPending = false;
            this.focusOnLonLat(centroid.lon, centroid.lat);
        }
        else {
            this.selectionFocusPending = true;
        }
    }
    findCentroidForSelection() {
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
    focusOnLonLat(lon, lat) {
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
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    scheduleDateRangeEmit() {
        if (this.sliderDebounceHandle) {
            clearTimeout(this.sliderDebounceHandle);
        }
        this.sliderDebounceHandle = setTimeout(() => {
            this.sliderDebounceHandle = null;
            this.emitDateRangeFromSlider();
        }, this.sliderDebounceMs);
    }
    emitDateRangeFromSlider() {
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
    async ngAfterViewInit() {
        if (!this.isBrowser)
            return;
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
        this.camera.position.set(0, 0, 3.2);
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
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(this.labelRenderer.domElement);
        // Groups for overlays
        this.labelGroup = new THREE.Group();
        this.lineGroup = new THREE.Group();
        this.scene.add(this.labelGroup);
        this.scene.add(this.lineGroup);
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
                glowColor: { value: new THREE.Color(0x2a174b) },
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
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.6;
        this.controls.target.set(0, 0, 0);
        const onResize = () => {
            if (!this.renderer || !this.camera)
                return;
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
            }
            else if (this.explorerMode &&
                this.controls &&
                !this.controls.autoRotate &&
                !this.focusResumeTimer &&
                this.autoRotateHoldUntil &&
                Date.now() >= this.autoRotateHoldUntil) {
                this.controls.autoRotate = true;
            }
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
    async applyLandTexture(THREE) {
        try {
            this.d3 = await import('d3');
            const res = await fetch('assets/data/countries-110m.geojson');
            if (!res.ok)
                return;
            this.geojson = await res.json();
            if (!this.geojson || !Array.isArray(this.geojson.features))
                return;
            // Equirectangular canvas texture (higher resolution for sharp borders)
            const width = 4096;
            const height = 2048;
            this.textureCanvas = document.createElement('canvas');
            this.textureCanvas.width = width;
            this.textureCanvas.height = height;
            const ctx = this.textureCanvas.getContext('2d');
            if (!ctx)
                return;
            this.textureCtx = ctx;
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
                const graticule = this.d3.geoGraticule().step([15, 15]);
                ctx.beginPath();
                this.pathGen(graticule());
                ctx.lineWidth = 0.35;
                ctx.strokeStyle = 'rgba(120, 105, 170, 0.10)';
                ctx.stroke();
            }
            catch { }
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
        }
        catch (e) {
            // Keep base sphere if texture build fails
        }
    }
    // Public API: highlight regions and annotate IOCs on the globe texture
    updateLocationIocs(data) {
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
        }
        else if (this.overlayRenderHandle) {
            try {
                cancelAnimationFrame(this.overlayRenderHandle);
            }
            catch { }
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
        const norm = (s) => this.normalizeKey(s);
        const byName = new Map();
        for (const f of features) {
            for (const field of nameFields) {
                const val = f.properties?.[field];
                if (val)
                    byName.set(norm(val), f);
            }
            if (f.id) {
                byName.set(norm(f.id), f);
            }
        }
        // Country alias mapping -> normalize incoming names to dataset names
        const ALIAS_MAP = {
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
        const ctx = this.textureCtx;
        const path = this.pathGen;
        const proj = this.projection;
        // Styles
        const countryFill = 'rgba(110, 45, 200, 0.25)';
        const countryStroke = 'rgba(150, 90, 230, 0.65)';
        const markerFill = 'rgba(220, 220, 230, 0.9)';
        const textColor = '#d3d6de';
        const panelBg = 'rgba(5,6,10,0.8)';
        const panelStroke = 'rgba(110,45,200,0.4)';
        this.labelOverlays = [];
        this.lineOverlays = [];
        const locationSeen = new Set();
        for (const item of data || []) {
            const toTitle = (value) => value.replace(/\b\w/g, (c) => c.toUpperCase());
            const resolveKey = (candidate) => {
                if (!candidate)
                    return null;
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
            const rawCode = (item.locationCode || item.location || item.code || '').toString();
            const rawName = (item.locationName || item.location || item.Location || '').toString();
            const normalizedCode = rawCode ? norm(rawCode) : '';
            const normalizedName = rawName ? norm(rawName) : '';
            let key = resolveKey(normalizedCode) || resolveKey(normalizedName);
            if (!key && normalizedName && normalizedName !== normalizedCode) {
                key = resolveKey(normalizedName);
            }
            if (!key && normalizedCode) {
                key = resolveKey(normalizedCode);
            }
            if (!key)
                continue;
            const feature = byName.get(key);
            if (!feature)
                continue;
            const countries = [feature];
            const featureName = feature.properties?.NAME_LONG ||
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
            const locationKey = (isoCode ? isoCode.toUpperCase() : null)
                || (displayName ? this.normalizeKey(displayName) : null)
                || (normalizedCode || normalizedName || null);
            if (locationKey && locationSeen.has(locationKey)) {
                continue;
            }
            if (locationKey) {
                locationSeen.add(locationKey);
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
                }
                catch { }
            }
            // Marker position: centroid of the country
            let lonlat = null;
            if (countries.length) {
                try {
                    const c = this.d3.geoCentroid(countries[0]);
                    lonlat = [c[0], c[1]];
                }
                catch { }
            }
            if (lonlat != null) {
                // Create a 3D overlay: line + floating label
                const lon = lonlat[0];
                const lat = lonlat[1];
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
                    this.lineOverlays.push({ line, tip });
                }
                catch { }
                // Label
                const lines = [];
                const seen = new Set();
                for (const candidate of Array.isArray(iocs) ? iocs : []) {
                    if (lines.length >= 3) {
                        break;
                    }
                    const potentialValues = [
                        candidate?.name,
                        candidate?.value,
                        candidate?.pattern,
                        candidate?.id,
                        candidate?.type
                    ];
                    let baseValue = '';
                    for (const potential of potentialValues) {
                        const trimmed = typeof potential === 'string' ? potential.trim() : String(potential ?? '').trim();
                        if (trimmed) {
                            baseValue = trimmed;
                            break;
                        }
                    }
                    if (!baseValue) {
                        continue;
                    }
                    const key = baseValue.toLowerCase();
                    if (seen.has(key)) {
                        continue;
                    }
                    const rawText = candidate?.name ?? candidate?.value ?? candidate?.pattern ?? candidate?.type ?? baseValue;
                    const normalized = String(rawText ?? '').trim();
                    if (!normalized) {
                        continue;
                    }
                    const display = normalized.length > 300 ? `${normalized.slice(0, 297)}…` : normalized;
                    const displayKey = display.toLowerCase();
                    if (seen.has(displayKey)) {
                        continue;
                    }
                    seen.add(key);
                    seen.add(displayKey);
                    lines.push(display);
                }
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
                    this.labelOverlays.push({ obj, tip });
                }
                catch { }
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
                this.focusOnLonLat(centroid.lon, centroid.lat);
            }
        }
    }
    performOverlayRender(data) {
        // Clear any existing label/line overlays from scene
        this.clearOverlays();
        // Redraw base first
        this.redrawBaseTexture();
        // Build name index for countries
        const features = this.geojson.features || [];
        const nameFields = ['name', 'NAME', 'ADMIN', 'NAME_LONG', 'SOVEREIGNT', 'BRK_NAME', 'FORMAL_EN'];
        const norm = (s) => this.normalizeKey(s);
        const byName = new Map();
        for (const f of features) {
            for (const field of nameFields) {
                const val = f.properties?.[field];
                if (val)
                    byName.set(norm(val), f);
            }
            if (f.id) {
                byName.set(norm(f.id), f);
            }
        }
        // Country alias mapping -> normalize incoming names to dataset names
        const ALIAS_MAP = {
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
        const ctx = this.textureCtx;
        const path = this.pathGen;
        const proj = this.projection;
        // Styles
        const countryFill = 'rgba(110, 45, 200, 0.25)';
        const countryStroke = 'rgba(150, 90, 230, 0.65)';
        const markerFill = 'rgba(220, 220, 230, 0.9)';
        const textColor = '#d3d6de';
        const panelBg = 'rgba(5,6,10,0.8)';
        const panelStroke = 'rgba(110,45,200,0.4)';
        this.labelOverlays = [];
        this.lineOverlays = [];
        for (const item of data || []) {
            const toTitle = (value) => value.replace(/\b\w/g, (c) => c.toUpperCase());
            const resolveKey = (candidate) => {
                if (!candidate)
                    return null;
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
            const rawCode = (item.locationCode || item.location || item.code || '').toString();
            const rawName = (item.locationName || item.location || item.Location || '').toString();
            const normalizedCode = rawCode ? norm(rawCode) : '';
            const normalizedName = rawName ? norm(rawName) : '';
            let key = resolveKey(normalizedCode) || resolveKey(normalizedName);
            if (!key && normalizedName && normalizedName !== normalizedCode) {
                key = resolveKey(normalizedName);
            }
            if (!key && normalizedCode) {
                key = resolveKey(normalizedCode);
            }
            if (!key)
                continue;
            const feature = byName.get(key);
            if (!feature)
                continue;
            const countries = [feature];
            const featureName = feature.properties?.NAME_LONG ||
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
                }
                catch { }
            }
            // Marker position: centroid of the country
            let lonlat = null;
            if (countries.length) {
                try {
                    const c = this.d3.geoCentroid(countries[0]);
                    lonlat = [c[0], c[1]];
                }
                catch { }
            }
            if (lonlat) {
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
                    this.lineOverlays.push({ line, tip });
                }
                catch { }
                // Label
                const lines = [];
                const seen = new Set();
                for (const candidate of Array.isArray(iocs) ? iocs : []) {
                    if (lines.length >= 3)
                        break;
                    const potentialValues = [
                        candidate?.name,
                        candidate?.value,
                        candidate?.pattern,
                        candidate?.id,
                        candidate?.type
                    ];
                    let baseValue = '';
                    for (const potential of potentialValues) {
                        const trimmed = typeof potential === 'string' ? potential.trim() : String(potential ?? '').trim();
                        if (trimmed) {
                            baseValue = trimmed;
                            break;
                        }
                    }
                    if (!baseValue)
                        continue;
                    const key = baseValue.toLowerCase();
                    if (seen.has(key))
                        continue;
                    const rawText = candidate?.name ?? candidate?.value ?? candidate?.pattern ?? candidate?.type ?? baseValue;
                    const normalized = String(rawText ?? '').trim();
                    if (!normalized)
                        continue;
                    const display = normalized.length > 300 ? `${normalized.slice(0, 297)}…` : normalized;
                    const displayKey = display.toLowerCase();
                    if (seen.has(displayKey))
                        continue;
                    seen.add(key);
                    seen.add(displayKey);
                    lines.push(display);
                }
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
                    this.labelOverlays.push({ obj, tip });
                }
                catch { }
            }
        }
        this.scheduleLabelReveal();
        // Push updated canvas to texture
        if (this.sphereMat?.map) {
            this.sphereMat.map.needsUpdate = true;
        }
        this.applySelectedHighlight();
        if (this.autoFocusOnSelection && this.selectionFocusPending && (this.selectedCountry || this.selectedCountryCode)) {
            const centroid = this.findCentroidForSelection();
            if (centroid) {
                this.selectionFocusPending = false;
                this.focusOnLonLat(centroid.lon, centroid.lat);
            }
        }
    }
    applySelectedHighlight() {
        if (this.selectedFeature) {
            this.drawCountryHighlight(this.selectedFeature);
        }
    }
    clearSelectionHighlight() {
        this.selectedFeature = null;
        this.selectedIsoCode = null;
        this.selectedFeatureKey = null;
        if (this.lastOverlayData && this.lastOverlayData.length) {
            this.updateLocationIocs(this.lastOverlayData);
        }
        else {
            this.clearOverlays();
            this.redrawBaseTexture();
            if (this.sphereMat?.map) {
                this.sphereMat.map.needsUpdate = true;
            }
        }
    }
    queueLabelForReveal(el) {
        if (!el) {
            return;
        }
        if (!el.classList.contains('globe-label--hidden')) {
            el.classList.add('globe-label--hidden');
        }
        this.pendingLabelElements.push(el);
    }
    scheduleLabelReveal() {
        if (!this.pendingLabelElements.length) {
            return;
        }
        if (this.focusActive || this.focusAnimation) {
            this.pendingLabelReveal = true;
            return;
        }
        this.scheduleLabelRevealWithDelay(this.labelRevealBaseDelayMs);
    }
    scheduleLabelRevealWithDelay(delay) {
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
    revealPendingLabels() {
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
    onFocusAnimationComplete() {
        if (!this.focusActive) {
            return;
        }
        this.focusActive = false;
        if (this.pendingLabelReveal || this.pendingLabelElements.length) {
            this.scheduleLabelRevealWithDelay(this.labelRevealAfterFocusMs);
        }
    }
    clearPendingLabelReveal() {
        if (this.labelRevealTimer) {
            clearTimeout(this.labelRevealTimer);
            this.labelRevealTimer = null;
        }
        this.pendingLabelElements = [];
        this.pendingLabelReveal = false;
    }
    lonLatToVector3(lonDeg, latDeg, radius) {
        // Flip longitude to align with sphere texture orientation
        const lon = (-lonDeg * Math.PI) / 180;
        const lat = (latDeg * Math.PI) / 180;
        const x = radius * Math.cos(lat) * Math.cos(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lon);
        return new this.three.Vector3(x, y, z);
    }
    clearOverlays() {
        // Remove line objects and dispose resources
        if (this.lineGroup) {
            while (this.lineGroup.children.length) {
                const obj = this.lineGroup.children.pop();
                if (!obj)
                    continue;
                if (obj.geometry && typeof obj.geometry.dispose === 'function')
                    obj.geometry.dispose();
                if (obj.material) {
                    const mat = obj.material;
                    if (typeof mat.dispose === 'function')
                        mat.dispose();
                }
                this.lineGroup.remove(obj);
            }
        }
        // Remove label objects and their DOM elements
        if (this.labelGroup) {
            while (this.labelGroup.children.length) {
                const obj = this.labelGroup.children.pop();
                if (!obj)
                    continue;
                // Remove the associated DOM element from the CSS2DRenderer container
                if (obj.element && obj.element.parentNode) {
                    try {
                        obj.element.parentNode.removeChild(obj.element);
                    }
                    catch { }
                }
                this.labelGroup.remove(obj);
            }
        }
        // Reset tracking arrays
        this.labelOverlays = [];
        this.lineOverlays = [];
        this.clearPendingLabelReveal();
    }
    updateOverlayVisibility() {
        if (!this.labelOverlays || !this.lineOverlays)
            return;
        // Camera forward direction
        const forward = new this.three.Vector3();
        this.camera.getWorldDirection(forward); // normalized, points where camera looks
        const camPos = this.camera.position.clone();
        for (const entry of this.labelOverlays) {
            const tip = entry.tip; // Vector3 in world space
            const toTip = tip.clone().sub(camPos).normalize();
            const isFront = forward.dot(toTip) > 0.02 && !this.isOccludedBySphere(tip, 1.02);
            const el = entry.obj.element;
            el.style.display = isFront ? 'block' : 'none';
            // Also toggle object visibility for safety
            entry.obj.visible = isFront;
        }
        for (const entry of this.lineOverlays) {
            const tip = entry.tip;
            const toTip = tip.clone().sub(camPos).normalize();
            const isFront = forward.dot(toTip) > 0.02 && !this.isOccludedBySphere(tip, 1.02);
            entry.line.visible = isFront;
            const mat = entry.line.material;
            if (mat && typeof mat.opacity === 'number') {
                mat.opacity = isFront ? 0.9 : 0.0;
                mat.transparent = true;
                mat.needsUpdate = true;
            }
        }
    }
    setupClickHighlight() {
        if (!this.renderer || !this.camera || !this.sphereMesh)
            return;
        const canvas = this.renderer.domElement;
        const raycaster = new this.three.Raycaster();
        const mouse = new this.three.Vector2();
        const onClick = (event) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            const hits = raycaster.intersectObject(this.sphereMesh);
            if (!hits || hits.length === 0)
                return;
            const point = hits[0].point;
            const lon = Math.atan2(point.z, point.x) * 180 / Math.PI * -1;
            const lat = Math.asin(point.y / point.length()) * 180 / Math.PI;
            let selected = null;
            if (this.geojson && this.d3 && Array.isArray(this.geojson.features)) {
                for (const f of this.geojson.features) {
                    try {
                        if (this.d3.geoContains(f, [lon, lat])) {
                            selected = f;
                            break;
                        }
                    }
                    catch { }
                }
            }
            if (!selected) {
                if (this.selectedFeature) {
                    this.clearSelectionHighlight();
                    this.selectedCountryChange.emit(null);
                }
                return;
            }
            // Emit selected country metadata to parent
            const featureCode = selected?.id ? selected.id.toString().toUpperCase() : null;
            const featureName = selected?.properties?.NAME_LONG ||
                selected?.properties?.ADMIN ||
                selected?.properties?.NAME ||
                selected?.properties?.name ||
                selected?.properties?.FORMAL_EN ||
                featureCode || null;
            const normalizedFeatureName = featureName ? this.normalizeKey(featureName) : '';
            const isoFromId = featureCode ? this.featureIsoMap.get(featureCode) : undefined;
            const isoFromName = normalizedFeatureName ? this.featureIsoMap.get(normalizedFeatureName) : undefined;
            const isoFromRegion = this.resolveIsoFromName(featureName);
            const isoCode = isoFromId || isoFromName || isoFromRegion || null;
            const featureKey = featureName ? this.normalizeKey(featureName) : null;
            if ((isoCode && isoCode === this.selectedIsoCode) ||
                (!isoCode && featureKey && featureKey === this.selectedFeatureKey)) {
                this.clearSelectionHighlight();
                this.selectedCountryChange.emit(null);
                return;
            }
            this.selectedFeature = selected;
            this.selectedIsoCode = isoCode;
            this.selectedFeatureKey = featureKey;
            // Ensure only one selection: reset base + overlays, then draw current selection
            if (this.lastOverlayData && this.lastOverlayData.length) {
                this.updateLocationIocs(this.lastOverlayData);
            }
            else {
                this.redrawBaseTexture();
                if (this.sphereMat?.map)
                    this.sphereMat.map.needsUpdate = true;
            }
            this.drawCountryHighlight(selected);
            let focusLonLat = null;
            if (selected && this.d3 && typeof this.d3.geoCentroid === 'function') {
                try {
                    const centroid = this.d3.geoCentroid(selected);
                    if (Array.isArray(centroid) && centroid.length >= 2) {
                        focusLonLat = [centroid[0], centroid[1]];
                    }
                }
                catch { }
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
    drawCountryHighlight(feature) {
        if (!this.textureCtx || !this.pathGen)
            return;
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
            if (this.sphereMat?.map)
                this.sphereMat.map.needsUpdate = true;
        }
        finally {
            ctx.restore();
        }
    }
    // Returns true if the segment from camera -> tip intersects the globe sphere
    isOccludedBySphere(tip, radius = 1.0) {
        const cam = this.camera.position;
        const d = tip.clone().sub(cam); // direction from camera to tip
        const a = d.dot(d);
        const b = 2 * cam.dot(d);
        const c = cam.dot(cam) - radius * radius;
        const disc = b * b - 4 * a * c;
        if (disc <= 0)
            return false; // no intersection
        const sqrtDisc = Math.sqrt(disc);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);
        // If either intersection lies between camera (t>0) and tip (t<1), tip is occluded
        return (t1 > 0 && t1 < 1) || (t2 > 0 && t2 < 1);
    }
    redrawBaseTexture() {
        if (!this.textureCtx || !this.textureCanvas || !this.d3 || !this.projection || !this.pathGen)
            return;
        const ctx = this.textureCtx;
        const width = this.textureCanvas.width;
        const height = this.textureCanvas.height;
        // clear
        ctx.clearRect(0, 0, width, height);
        // base ocean
        ctx.fillStyle = '#05060a';
        ctx.fillRect(0, 0, width, height);
        // graticule
        try {
            const graticule = this.d3.geoGraticule().step([15, 15]);
            ctx.beginPath();
            this.pathGen(graticule());
            ctx.lineWidth = 0.35;
            ctx.strokeStyle = 'rgba(120, 105, 170, 0.10)';
            ctx.stroke();
        }
        catch { }
        // land
        ctx.beginPath();
        this.pathGen({ type: 'FeatureCollection', features: this.geojson.features });
        ctx.fillStyle = '#0e0f14';
        ctx.fill();
        // borders
        ctx.lineWidth = 0.6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(110, 45, 200, 0.45)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(110, 45, 200, 0.25)';
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }
    ngOnDestroy() {
        if (this.animationId)
            cancelAnimationFrame(this.animationId);
        if (this.controls)
            this.controls.dispose();
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
        this.clearPendingLabelReveal();
    }
};
__decorate([
    ViewChild('globeContainer', { static: true })
], LandingGlobeComponent.prototype, "containerRef", void 0);
__decorate([
    HostBinding('class.stretch-globe')
], LandingGlobeComponent.prototype, "stretchClass", void 0);
__decorate([
    HostBinding('class.landing-mode')
], LandingGlobeComponent.prototype, "landingModeClass", null);
__decorate([
    HostBinding('class.explorer-mode')
], LandingGlobeComponent.prototype, "explorerModeClass", null);
__decorate([
    Output()
], LandingGlobeComponent.prototype, "selectedCountryChange", void 0);
__decorate([
    Output()
], LandingGlobeComponent.prototype, "entityGroupsChange", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "selectedCountry", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "selectedCountryCode", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "selectedCountryGroups", null);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "selectedCountryLoading", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "explorerMode", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "autoFocusOnSelection", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "enableDateFilter", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "dateRangeStart", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "dateRangeEnd", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "dateRangeMin", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "dateRangeMax", void 0);
__decorate([
    Output()
], LandingGlobeComponent.prototype, "dateRangeChange", void 0);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "selectedCountryIocs", null);
__decorate([
    Input()
], LandingGlobeComponent.prototype, "stretch", null);
LandingGlobeComponent = LandingGlobeComponent_1 = __decorate([
    Component({
        selector: 'app-landing-globe',
        templateUrl: './landing-globe.component.html',
        styleUrls: ['./landing-globe.component.scss']
    }),
    __param(0, Inject(PLATFORM_ID))
], LandingGlobeComponent);
export { LandingGlobeComponent };
//# sourceMappingURL=landing-globe.component.js.map
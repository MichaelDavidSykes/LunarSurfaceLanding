var ExplorerComponent_1;
import { __decorate, __param } from "tslib";
import { Component, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { renderQueryPreview } from './query-builder.component';
import { InteractiveGlobeComponent } from '../interactive-globe/interactive-globe.component';
import { buildExplorerLocationIocsAql } from './explorer-aql-builder';
import { applyCurrentEndDateLabel } from '../shared/query-preview.util';
import { SaveQueryDialogComponent } from './save-query-dialog.component';
const EXPLORER_ENTITY_PRESENTATION = {
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
    'marking-definition': { label: 'Marking Definitions', icon: 'verified_user', accent: 'accent-marking', order: 12 },
    'course-of-action': { label: 'Courses of Action', icon: 'task_alt', accent: 'accent-coa', order: 13 },
    infrastructure: { label: 'Infrastructure', icon: 'schema', accent: 'accent-infra', order: 14 }
};
const DEFAULT_ENTITY_PRESENTATION = { label: 'Related Intelligence', icon: 'hub', accent: 'accent-generic', order: 99 };
const FRONTEND_INTEL_FEEDS = [
    { id: 'defense-one', name: 'Defense One', category: 'defense', itemType: 'geo-event', rssUrl: 'https://www.defenseone.com/rss/all/', sourceUrl: 'https://www.defenseone.com/' },
    { id: 'breaking-defense', name: 'Breaking Defense', category: 'defense', itemType: 'geo-event', rssUrl: 'https://breakingdefense.com/feed/', sourceUrl: 'https://breakingdefense.com/' },
    { id: 'defense-news', name: 'Defense News', category: 'defense', itemType: 'geo-event', rssUrl: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', sourceUrl: 'https://www.defensenews.com/' },
    { id: 'the-war-zone', name: 'The War Zone', category: 'defense', itemType: 'geo-event', rssUrl: 'https://www.twz.com/feed', sourceUrl: 'https://www.twz.com/' },
    { id: 'foreign-policy', name: 'Foreign Policy', category: 'intl', itemType: 'headline', rssUrl: 'https://foreignpolicy.com/feed/', sourceUrl: 'https://foreignpolicy.com/' },
    { id: 'foreign-affairs', name: 'Foreign Affairs', category: 'intl', itemType: 'headline', rssUrl: 'https://www.foreignaffairs.com/rss.xml', sourceUrl: 'https://www.foreignaffairs.com/' },
    { id: 'bellingcat', name: 'Bellingcat', category: 'osint', itemType: 'headline', rssUrl: 'https://news.google.com/rss/search?q=site:bellingcat.com+when:30d&hl=en-US&gl=US&ceid=US:en', sourceUrl: 'https://www.bellingcat.com/' },
    { id: 'krebs', name: 'Krebs Security', category: 'cyber', itemType: 'cyber-alert', rssUrl: 'https://krebsonsecurity.com/feed/', sourceUrl: 'https://krebsonsecurity.com/' },
    { id: 'ransomware-live', name: 'Ransomware.live', category: 'cyber', itemType: 'cyber-alert', rssUrl: 'https://www.ransomware.live/rss.xml', sourceUrl: 'https://www.ransomware.live/' },
    { id: 'arms-control', name: 'Arms Control Assn', category: 'nuclear', itemType: 'geo-event', rssUrl: 'https://news.google.com/rss/search?q=site:armscontrol.org+when:7d&hl=en-US&gl=US&ceid=US:en', sourceUrl: 'https://www.armscontrol.org/' },
    { id: 'bulletin-atomic', name: 'Bulletin of Atomic Scientists', category: 'nuclear', itemType: 'geo-event', rssUrl: 'https://news.google.com/rss/search?q=site:thebulletin.org+when:7d&hl=en-US&gl=US&ceid=US:en', sourceUrl: 'https://thebulletin.org/' },
    { id: 'stimson', name: 'Stimson Center', category: 'research', itemType: 'headline', rssUrl: 'https://www.stimson.org/feed/', sourceUrl: 'https://www.stimson.org/' }
];
const LIVE_MONITOR_CHANNELS = [
    { id: 'bloomberg', name: 'Bloomberg', handle: '@markets', fallbackVideoId: 'iEpJwprxDdk', region: 'US' },
    { id: 'sky', name: 'Sky News', handle: '@SkyNews', fallbackVideoId: 'uvviIF4725I', region: 'UK' },
    { id: 'euronews', name: 'Euronews', handle: '@euronews', fallbackVideoId: 'pykpO5kQJ98', region: 'EU' },
    { id: 'dw', name: 'DW', handle: '@DWNews', fallbackVideoId: 'LuKwFajn37U', region: 'DE' },
    { id: 'france24', name: 'France 24', handle: '@FRANCE24', fallbackVideoId: 'u9foWyMSETk', region: 'FR' },
    { id: 'aljazeera', name: 'Al Jazeera', handle: '@AlJazeeraEnglish', fallbackVideoId: 'gCNeDWCI0vo', region: 'QAT' },
    { id: 'alarabiya', name: 'Al Arabiya', handle: '@AlArabiya', fallbackVideoId: 'n7eQejkXbnM', region: 'MENA' },
    { id: 'cna', name: 'CNA', handle: '@channelnewsasia', fallbackVideoId: 'XWq5kBlakcQ', region: 'ASIA' }
];
let ExplorerComponent = class ExplorerComponent {
    static { ExplorerComponent_1 = this; }
    static { this.GLOBE_COUNTRY_FILTER_GROUP_ID = '__globe_country_filter__'; }
    static { this.MODULE_FILTER_GROUP_ID = '__module_filter__'; }
    static { this.SAVED_QUERIES_STORAGE_KEY = 'lunar.explorer.savedQueries'; }
    static { this.PENDING_QUERY_STORAGE_KEY = 'lunar.explorer.pendingQuery'; }
    static { this.PENDING_SAVED_QUERY_V2_STORAGE_KEY = 'lunar.explorer.pendingSavedQueryV2'; }
    constructor(http, router, snackbar, clientState, savedQueriesApi, dialog, sanitizer, platformId) {
        this.http = http;
        this.router = router;
        this.snackbar = snackbar;
        this.clientState = clientState;
        this.savedQueriesApi = savedQueriesApi;
        this.dialog = dialog;
        this.sanitizer = sanitizer;
        this.selectedCountry = null;
        this.selectedCountryCode = null;
        this.selectedCountryIocs = [];
        this.selectedCountryGroups = [];
        this.selectedCountryEntityGroups = [];
        this.selectedCountryLoading = false;
        this.selectedCountryReport = null;
        this.queryGraphNodes = [];
        this.queryGraphLinks = [];
        this.graphDisplayNodes = [];
        this.graphDisplayLinks = [];
        this.selectedGraphNode = null;
        this.selectedGraphLink = null;
        this.expandedGraphTypes = [];
        this.reportsGraphExpanded = false;
        this.queryGraphReportTotal = 0;
        this.focusedGraphNodeIds = [];
        this.pinnedGraphNodeIds = [];
        this.queryGraphViewBoxBase = '0 0 1200 620';
        this.graphZoom = 1;
        this.graphPanX = 0;
        this.graphPanY = 0;
        this.latestLocations = [];
        this.selectedClientId = null;
        this.activeIocContextKey = null;
        this.currentGroups = [];
        this.appliedQuery = null;
        this.draftQuery = null;
        this.activeIocDetail = null;
        this.iocPivotTrail = [];
        this.activeIocGroupDetail = null;
        this.reportInsightsGroup = null;
        // Query builder presentation state
        this.showQueryBuilder = false;
        this.currentSelection = null;
        this.dayMs = 24 * 60 * 60 * 1000;
        this.graphWidth = 1200;
        this.graphHeight = 620;
        this.dragState = null;
        this.panDragState = null;
        this.suppressNextNodeClick = false;
        this.suppressNextBackgroundClick = false;
        this.graphSelectionToRestoreId = null;
        this.graphNodePositions = new Map();
        this.overrideCompiledAql = null;
        this.overrideQueryPreview = null;
        this.externalIntelSources = [];
        this.externalIntelItems = [];
        this.externalIntelSections = [];
        this.externalIntelTypeCounts = [];
        this.moduleBreakdownCounts = [];
        this.selectedModuleFilterKeys = [];
        this.knownModuleKeys = [];
        this.externalIntelLoading = false;
        this.externalIntelSourcesLoading = false;
        this.externalIntelError = null;
        this.polymarketItems = [];
        this.polymarketContextTerms = [];
        this.polymarketLoading = false;
        this.polymarketError = null;
        this.aiModeModalOpen = false;
        this.aiModeLoading = false;
        this.aiModeError = null;
        this.aiModeAnswer = null;
        this.aiModeModel = null;
        this.aiModeSummary = null;
        this.polymarketRequestToken = 0;
        this.liveMonitorChannels = LIVE_MONITOR_CHANNELS;
        this.liveGridCount = 6;
        this.liveResolveLoading = false;
        this.resolvedLiveVideoIds = {};
        this.fullEntityTypeList = [
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
            'identity',
            'relationship',
            'marking-definition',
            'infrastructure',
            'course-of-action',
            'organization',
            'directory',
            'phone-number',
            'email-message',
            'software',
            'vulnerability',
            'location'
        ];
        this.isBrowser = isPlatformBrowser(platformId);
        this.initializeDateFilter();
        const defaultQuery = this.buildDefaultQuery();
        this.appliedQuery = defaultQuery;
        this.currentGroups = defaultQuery.groups;
        this.selectedModuleFilterKeys = this.extractModuleFilterKeysFromGroups(this.currentGroups);
    }
    get selectedCountryLabel() {
        const name = (this.selectedCountry || '').trim();
        if (name) {
            return name;
        }
        if (this.selectedCountryCode) {
            return this.selectedCountryCode.toUpperCase();
        }
        return null;
    }
    get reportInsightsDisplayGroup() {
        if (this.reportInsightsGroup?.items?.length) {
            return this.reportInsightsGroup;
        }
        const fromGroups = [];
        if (Array.isArray(this.selectedCountryGroups)) {
            for (const group of this.selectedCountryGroups) {
                const primary = (group?.report || '').toString().trim();
                if (!primary) {
                    continue;
                }
                const sourceName = (group?.sourceName || '').toString().trim();
                const module = (group?.intelligenceModule || '').toString().trim();
                fromGroups.push({
                    primary,
                    secondary: module ? `Module: ${module}` : undefined,
                    report: sourceName || undefined,
                    modified: group?.modified || undefined,
                    type: 'report',
                    raw: group
                });
            }
        }
        if (fromGroups.length) {
            return {
                label: 'Reports',
                icon: 'description',
                accent: 'accent-report',
                isFeature: true,
                items: fromGroups
            };
        }
        const reportMap = new Map();
        for (const entity of Array.isArray(this.selectedCountryIocs) ? this.selectedCountryIocs : []) {
            const reportName = this.sanitizeReportName((entity?.report || '').toString().trim() || 'Unknown Report');
            const modified = typeof entity?.modified === 'string' ? entity.modified : undefined;
            const current = reportMap.get(reportName);
            if (!current || (modified && Date.parse(modified) > Date.parse(current))) {
                reportMap.set(reportName, modified);
            }
        }
        if (!reportMap.size) {
            return null;
        }
        const items = Array.from(reportMap.entries())
            .map(([primary, modified]) => ({
            primary,
            modified,
            type: 'report',
            raw: { type: 'report', name: primary, modified: modified ?? null }
        }))
            .sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            return tsB - tsA || a.primary.localeCompare(b.primary);
        });
        return {
            label: 'Reports',
            icon: 'description',
            accent: 'accent-report',
            isFeature: true,
            items
        };
    }
    get hasDateRange() {
        return Boolean(this.dateFilterRange?.start && this.dateFilterRange?.end);
    }
    get activePreview() {
        return this.appliedQuery?.preview ?? null;
    }
    get activePreviewDetailed() {
        if (!this.appliedQuery) {
            return null;
        }
        const groups = this.appliedQuery.groups ?? [];
        const dateRange = this.appliedQuery.dateRange ?? { start: null, end: null };
        return renderQueryPreview(groups, dateRange, { multiline: true });
    }
    get queryGraphReportCount() {
        return this.queryGraphReportTotal || this.queryGraphNodes.filter(node => node.kind === 'report').length;
    }
    get queryGraphTypeGroupCount() {
        return this.queryGraphNodes.filter(node => node.kind === 'type-group').length;
    }
    get queryGraphEntityCount() {
        return this.queryGraphNodes.filter(node => node.kind === 'entity').length;
    }
    get queryGraphLinkCount() {
        return this.queryGraphLinks.length;
    }
    get queryGraphViewBox() {
        const width = this.graphWidth / this.graphZoom;
        const height = this.graphHeight / this.graphZoom;
        return `${this.graphPanX} ${this.graphPanY} ${width} ${height}`;
    }
    ngOnInit() {
        if (this.isBrowser) {
            this.clientSelectionSub?.unsubscribe();
            this.clientSelectionSub = this.clientState.selectedClientId$.subscribe(id => {
                this.selectedClientId = id;
            });
            this.consumePendingSavedQueryV2();
            this.consumePendingSavedQuery();
        }
    }
    ngAfterViewInit() {
        if (this.isBrowser) {
            if (this.overrideCompiledAql) {
                this.executeLocationIocsAql(this.overrideCompiledAql);
            }
            else {
                this.runLatestLocationIocsQuery(this.dateFilterRange);
            }
        }
    }
    ngOnDestroy() {
        this.locationDataSub?.unsubscribe();
        this.iocContextSub?.unsubscribe();
        this.clientSelectionSub?.unsubscribe();
        this.aiModeSub?.unsubscribe();
    }
    openQueryBuilder() {
        this.currentQuery = this.appliedQuery
            ? this.cloneQueryResult(this.appliedQuery)
            : this.buildDefaultQuery();
        this.showQueryBuilder = true;
    }
    editCurrentQuery() {
        if (!this.appliedQuery) {
            this.openQueryBuilder();
            return;
        }
        this.currentQuery = this.cloneQueryResult(this.appliedQuery);
        this.showQueryBuilder = true;
    }
    onQueryChange(result) {
        this.draftQuery = this.cloneQueryResult(result);
        console.log('Explorer query draft updated:', result);
    }
    onQueryApply(result) {
        // Switching to the query builder output should clear any "compiled AQL override" state.
        this.overrideCompiledAql = null;
        this.overrideQueryPreview = null;
        const appliedClone = this.cloneQueryResult(result);
        this.appliedQuery = appliedClone;
        this.currentGroups = Array.isArray(appliedClone.groups) ? appliedClone.groups : [];
        this.selectedModuleFilterKeys = this.extractModuleFilterKeysFromGroups(this.currentGroups);
        this.draftQuery = null;
        const range = this.normalizeQueryRange(result.dateRange);
        if (range) {
            this.dateFilterRange = range;
            const formattedRange = {
                start: this.formatQueryDate(range.start),
                end: this.formatQueryDate(range.end)
            };
            this.appliedQuery.dateRange = formattedRange;
            this.appliedQuery.preview = renderQueryPreview(this.appliedQuery.groups ?? [], formattedRange);
            if (this.isBrowser) {
                this.runLatestLocationIocsQuery(range);
            }
        }
        else {
            this.appliedQuery.preview = renderQueryPreview(this.appliedQuery.groups ?? [], {
                start: this.appliedQuery.dateRange?.start ?? null,
                end: this.appliedQuery.dateRange?.end ?? null
            });
        }
    }
    onQueryBuilderClose() {
        this.draftQuery = null;
        this.showQueryBuilder = false;
    }
    onSaveCurrentQuery() {
        if (!this.appliedQuery || !this.isBrowser) {
            return;
        }
        const clientId = this.selectedClientId ?? this.clientState.selectedClientSubject.value?._id ?? null;
        if (!clientId) {
            this.snackbar.open('Select a client before saving queries.', 'warning');
            return;
        }
        const fallbackName = `Query ${new Date().toLocaleString()}`;
        const dialogRef = this.dialog.open(SaveQueryDialogComponent, {
            data: { defaultName: fallbackName },
            panelClass: ['lunar-dialog']
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (!result?.name) {
                return;
            }
            const name = result.name;
            const description = result.description ?? null;
            const dynamicEndDate = this.isDynamicEndDateSelected(this.dateFilterRange);
            let compiledAql = this.overrideCompiledAql;
            let preview = this.overrideQueryPreview || this.activePreviewDetailed || this.appliedQuery?.preview || '';
            if (dynamicEndDate) {
                preview = applyCurrentEndDateLabel(preview);
            }
            if (!compiledAql) {
                const { startIso, endIso } = this.buildDateBounds(this.dateFilterRange);
                compiledAql = buildExplorerLocationIocsAql({
                    startIso,
                    endIso,
                    dynamicEndDate,
                    groups: this.currentGroups,
                    fullEntityTypeList: this.fullEntityTypeList
                });
            }
            compiledAql = this.normalizeLegacyCompiledAql(compiledAql);
            this.savedQueriesApi
                .createSavedQuery({
                name,
                client_id: clientId,
                compiled_aql: compiledAql,
                query_preview: preview,
                description,
                is_active: true,
                alerting_enabled: true,
                dynamic_end_date: dynamicEndDate
            })
                .subscribe({
                next: () => this.snackbar.open(`Saved query "${name}"`, 'success'),
                error: (error) => {
                    console.error('[Explorer] Failed to save query', error);
                    this.snackbar.open('Failed to save query', 'error');
                }
            });
        });
    }
    onAiMode() {
        if (!this.appliedQuery || !this.isBrowser) {
            return;
        }
        const compiledAql = this.buildCurrentCompiledAqlForAiMode();
        const dynamicEndDate = this.isDynamicEndDateSelected(this.dateFilterRange);
        let queryPreview = (this.overrideQueryPreview || this.activePreviewDetailed || this.appliedQuery?.preview || '').trim();
        if (dynamicEndDate) {
            queryPreview = applyCurrentEndDateLabel(queryPreview);
        }
        this.aiModeModalOpen = true;
        this.aiModeLoading = true;
        this.aiModeError = null;
        this.aiModeAnswer = null;
        this.aiModeModel = null;
        this.aiModeSummary = null;
        const payload = {
            query: compiledAql,
            query_preview: queryPreview || 'Active Explorer query',
            context: {
                dateStart: this.formatQueryDate(this.dateFilterRange?.start) || null,
                dateEnd: dynamicEndDate
                    ? 'today (dynamic)'
                    : (this.formatQueryDate(this.dateFilterRange?.end) || null),
                selectedCountry: this.selectedCountryLabel,
                moduleScope: this.selectedModuleFilterKeys.length
                    ? this.selectedModuleFilterKeys
                    : ['all-modules']
            }
        };
        this.aiModeSub?.unsubscribe();
        this.aiModeSub = this.http
            .post(`${environment.apiUrl}/api/${environment.apiVersion}/graph/ai-query`, payload)
            .subscribe({
            next: (response) => {
                this.aiModeLoading = false;
                this.aiModeAnswer = typeof response?.answer === 'string' ? response.answer : 'No AI response returned.';
                this.aiModeModel = typeof response?.model === 'string' ? response.model : null;
                this.aiModeSummary = this.normalizeAiModeSummary(response?.summary);
            },
            error: (error) => {
                this.aiModeLoading = false;
                const apiMessage = error?.error?.detail?.details || error?.error?.detail?.message || error?.message;
                this.aiModeError = typeof apiMessage === 'string' && apiMessage.trim()
                    ? apiMessage
                    : 'Failed to run AI Mode for the current query.';
                console.error('[Explorer] AI Mode request failed', error);
            }
        });
    }
    onOpenSavedQueries() {
        this.router.navigate(['/query']);
    }
    closeAiModeModal() {
        this.aiModeModalOpen = false;
        this.aiModeLoading = false;
        this.aiModeError = null;
    }
    normalizeAiModeSummary(summary) {
        if (!summary || typeof summary !== 'object') {
            return null;
        }
        const normalizeCounts = (items) => (Array.isArray(items)
            ? items
                .map((item) => ({
                name: String(item?.name || '').trim(),
                count: Number(item?.count ?? 0)
            }))
                .filter((item) => item.name.length > 0 && Number.isFinite(item.count))
            : []);
        const reportSamples = Array.isArray(summary?.reportSamples)
            ? summary.reportSamples
                .map((sample) => ({
                report: String(sample?.report || '').trim(),
                location: sample?.location ? String(sample.location).trim() : null,
                module: sample?.module ? String(sample.module).trim() : null,
                sourceName: sample?.sourceName ? String(sample.sourceName).trim() : null,
                sourceLink: sample?.sourceLink ? String(sample.sourceLink).trim() : null,
                modified: sample?.modified ? String(sample.modified).trim() : null,
                topEntities: Array.isArray(sample?.topEntities)
                    ? sample.topEntities.map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 6)
                    : []
            }))
                .filter((sample) => sample.report.length > 0)
            : [];
        const reportEntityRelations = Array.isArray(summary?.reportEntityRelations)
            ? summary.reportEntityRelations
                .map((entry) => ({
                report: entry?.report ? String(entry.report).trim() : null,
                relationshipType: String(entry?.relationshipType || '').trim().toLowerCase(),
                entity: String(entry?.entity || '').trim(),
                entityType: entry?.entityType ? String(entry.entityType).trim().toLowerCase() : null,
                count: Number(entry?.count ?? 0)
            }))
                .filter((entry) => entry.relationshipType.length > 0
                && entry.entity.length > 0
                && Number.isFinite(entry.count))
            : [];
        const graphTriples = Array.isArray(summary?.graphTriples)
            ? summary.graphTriples
                .map((entry) => ({
                report: entry?.report ? String(entry.report).trim() : null,
                sourceType: entry?.sourceType ? String(entry.sourceType).trim().toLowerCase() : null,
                source: String(entry?.source || '').trim(),
                relationshipType: String(entry?.relationshipType || '').trim().toLowerCase(),
                targetType: entry?.targetType ? String(entry.targetType).trim().toLowerCase() : null,
                target: String(entry?.target || '').trim(),
                count: Number(entry?.count ?? 0)
            }))
                .filter((entry) => entry.source.length > 0
                && entry.target.length > 0
                && entry.relationshipType.length > 0
                && Number.isFinite(entry.count))
            : [];
        return {
            resultRows: Number(summary?.resultRows ?? 0),
            reportCount: Number(summary?.reportCount ?? 0),
            entityCount: Number(summary?.entityCount ?? 0),
            topLocations: normalizeCounts(summary?.topLocations),
            topModules: normalizeCounts(summary?.topModules),
            topEntityTypes: normalizeCounts(summary?.topEntityTypes),
            topRelationshipTypes: normalizeCounts(summary?.topRelationshipTypes),
            topSources: normalizeCounts(summary?.topSources),
            reportEntityRelations,
            graphTriples,
            reportSamples
        };
    }
    buildCurrentCompiledAqlForAiMode() {
        if (this.overrideCompiledAql) {
            return this.normalizeLegacyCompiledAql(this.overrideCompiledAql);
        }
        const { startIso, endIso } = this.buildDateBounds(this.dateFilterRange);
        const dynamicEndDate = this.isDynamicEndDateSelected(this.dateFilterRange);
        return this.normalizeLegacyCompiledAql(buildExplorerLocationIocsAql({
            startIso,
            endIso,
            dynamicEndDate,
            groups: this.currentGroups,
            fullEntityTypeList: this.fullEntityTypeList
        }));
    }
    consumePendingSavedQueryV2() {
        if (!this.isBrowser) {
            return;
        }
        try {
            const raw = localStorage.getItem(ExplorerComponent_1.PENDING_SAVED_QUERY_V2_STORAGE_KEY);
            if (!raw) {
                return;
            }
            localStorage.removeItem(ExplorerComponent_1.PENDING_SAVED_QUERY_V2_STORAGE_KEY);
            const parsed = JSON.parse(raw);
            const compiled = typeof parsed?.compiled_aql === 'string' ? parsed.compiled_aql.trim() : '';
            if (!compiled) {
                return;
            }
            this.overrideCompiledAql = this.normalizeLegacyCompiledAql(compiled);
            this.overrideQueryPreview = typeof parsed?.query_preview === 'string' ? parsed.query_preview : null;
            // Saved queries currently store compiled AQL + preview only.
            // We keep the query builder state empty and run the compiled AQL directly.
            const preview = (this.overrideQueryPreview || '').trim() || (typeof parsed?.name === 'string' ? parsed.name : 'Saved query');
            this.appliedQuery = {
                preview,
                groups: [],
                dateRange: this.appliedQuery?.dateRange
            };
            this.currentGroups = [];
            this.selectedModuleFilterKeys = [];
        }
        catch (error) {
            console.error('[Explorer] Failed to load pending saved query v2', error);
        }
    }
    consumePendingSavedQuery() {
        try {
            const raw = localStorage.getItem(ExplorerComponent_1.PENDING_QUERY_STORAGE_KEY);
            if (!raw) {
                return;
            }
            localStorage.removeItem(ExplorerComponent_1.PENDING_QUERY_STORAGE_KEY);
            const parsed = JSON.parse(raw);
            const restored = this.cloneQueryResult(parsed);
            this.appliedQuery = restored;
            this.currentGroups = restored.groups ?? [];
            this.selectedModuleFilterKeys = this.extractModuleFilterKeysFromGroups(this.currentGroups);
            const range = this.normalizeQueryRange(restored.dateRange);
            if (range) {
                this.dateFilterRange = range;
                const formattedRange = {
                    start: this.formatQueryDate(range.start),
                    end: this.formatQueryDate(range.end)
                };
                this.appliedQuery.dateRange = formattedRange;
                this.appliedQuery.preview = renderQueryPreview(this.appliedQuery.groups ?? [], formattedRange);
            }
        }
        catch (error) {
            console.error('[Explorer] Failed to load pending saved query', error);
        }
    }
    onIocItemClick(group, entity, options) {
        if (!options?.fromPivot) {
            this.iocPivotTrail = [];
        }
        const baseRaw = (entity?.raw && typeof entity.raw === 'object') ? entity.raw : (entity ?? {});
        const comparable = this.toComparableEntity(baseRaw, entity?.primary);
        const localContext = this.buildLocalIocContext(comparable);
        const contextKey = this.buildIocContextKey(comparable);
        this.activeIocDetail = {
            groupLabel: group?.label ?? 'Intelligence',
            entity: {
                primary: entity?.primary ?? 'Unnamed entity',
                secondary: entity?.secondary,
                report: entity?.report,
                modified: entity?.modified,
                type: entity?.type,
                raw: {
                    ...baseRaw,
                    contextLoading: true,
                    contextError: null,
                    relatedReports: localContext.relatedReports,
                    relatedIocs: localContext.relatedIocs,
                    matchedNodeCount: null
                }
            }
        };
        this.activeIocContextKey = contextKey;
        this.loadIocContext(comparable, contextKey);
    }
    onExpandIocGroup(group) {
        this.activeIocGroupDetail = {
            label: group?.label ?? 'Intelligence',
            icon: group?.icon ?? 'hub',
            accent: group?.accent ?? 'accent-generic',
            items: Array.isArray(group?.items) ? [...group.items] : []
        };
    }
    closeIocGroupDetail() {
        this.activeIocGroupDetail = null;
    }
    onExpandedIocItemClick(entity) {
        const groupLabel = this.activeIocGroupDetail?.label ?? 'Intelligence';
        this.activeIocGroupDetail = null;
        this.onIocItemClick({ label: groupLabel }, entity);
    }
    onIocDetailClose() {
        this.activeIocContextKey = null;
        this.iocContextSub?.unsubscribe();
        this.activeIocDetail = null;
        this.iocPivotTrail = [];
    }
    onIocDetailAdd() {
        if (!this.activeIocDetail) {
            return;
        }
        this.addClauseForIoc(this.activeIocDetail);
        this.activeIocContextKey = null;
        this.iocContextSub?.unsubscribe();
        this.activeIocDetail = null;
        this.iocPivotTrail = [];
    }
    onIocDetailPivot(entity) {
        const groupLabel = entity?.groupLabel || this.activeIocDetail?.groupLabel || 'Related Intelligence';
        const previousStep = this.toPivotTrailEntry(this.activeIocDetail);
        if (previousStep) {
            previousStep.relationToNext =
                this.extractPivotRelationship(entity)
                    || this.inferPivotRelationshipFromCurrentContext(entity)
                    || 'related-to';
        }
        this.appendPivotTrail(previousStep);
        this.activeIocContextKey = null;
        this.iocContextSub?.unsubscribe();
        this.activeIocDetail = null;
        setTimeout(() => {
            this.onIocItemClick({ label: groupLabel }, entity, { fromPivot: true });
        }, 0);
    }
    onIocTrailSelect(index) {
        if (!Number.isFinite(index) || index < 0 || index >= this.iocPivotTrail.length) {
            return;
        }
        const selected = this.iocPivotTrail[index];
        const groupLabel = selected.groupLabel || this.activeIocDetail?.groupLabel || 'Related Intelligence';
        this.activeIocContextKey = null;
        this.iocContextSub?.unsubscribe();
        this.activeIocDetail = null;
        this.iocPivotTrail = this.iocPivotTrail.slice(0, index);
        setTimeout(() => {
            this.onIocItemClick({
                label: groupLabel
            }, {
                primary: selected.primary,
                secondary: selected.secondary,
                report: selected.report,
                modified: selected.modified,
                type: selected.type,
                raw: selected.raw ?? {
                    type: selected.type ?? null,
                    name: selected.primary,
                    value: selected.secondary ?? null,
                    pattern: null,
                    modified: selected.modified ?? null
                }
            }, { fromPivot: true });
        }, 0);
    }
    toPivotTrailEntry(detail) {
        if (!detail || !detail.entity) {
            return null;
        }
        const primary = (detail.entity.primary || '').toString().trim();
        if (!primary) {
            return null;
        }
        return {
            primary,
            secondary: detail.entity.secondary,
            type: detail.entity.type || detail.entity.raw?.type,
            modified: detail.entity.modified || detail.entity.raw?.modified,
            report: detail.entity.report,
            groupLabel: detail.groupLabel,
            relationToNext: undefined,
            raw: detail.entity.raw
        };
    }
    extractPivotRelationship(entity) {
        const topLevel = (entity?.relationshipType || '').toString().trim().toLowerCase();
        if (topLevel) {
            return topLevel;
        }
        const raw = entity?.raw;
        if (!raw || typeof raw !== 'object') {
            return undefined;
        }
        const direct = (raw.relationshipType || '').toString().trim().toLowerCase();
        if (direct) {
            return direct;
        }
        const list = Array.isArray(raw.relationshipTypes) ? raw.relationshipTypes : [];
        const first = list
            .map((item) => (item ?? '').toString().trim().toLowerCase())
            .find((item) => item.length > 0);
        return first || undefined;
    }
    inferPivotRelationshipFromCurrentContext(entity) {
        const raw = this.activeIocDetail?.entity?.raw;
        const related = Array.isArray(raw?.relatedIocs) ? raw.relatedIocs : [];
        if (!related.length || !entity) {
            return undefined;
        }
        const target = this.toComparableEntity(entity.raw ?? entity, entity.primary);
        for (const item of related) {
            if (!this.entityMatchesComparable(item, target)) {
                continue;
            }
            const list = Array.isArray(item?.relationshipTypes) ? item.relationshipTypes : [];
            const inferred = list
                .map((value) => (value ?? '').toString().trim().toLowerCase())
                .find((value) => value.length > 0);
            if (inferred) {
                return inferred;
            }
            const single = (item?.relationshipType || '').toString().trim().toLowerCase();
            if (single) {
                return single;
            }
        }
        return undefined;
    }
    appendPivotTrail(entry) {
        if (!entry) {
            return;
        }
        const key = [
            (entry.type || '').toString().trim().toLowerCase(),
            (entry.primary || '').toString().trim().toLowerCase(),
            (entry.secondary || '').toString().trim().toLowerCase()
        ].join('|');
        const prev = this.iocPivotTrail.length ? this.iocPivotTrail[this.iocPivotTrail.length - 1] : null;
        const prevKey = prev
            ? [
                (prev.type || '').toString().trim().toLowerCase(),
                (prev.primary || '').toString().trim().toLowerCase(),
                (prev.secondary || '').toString().trim().toLowerCase()
            ].join('|')
            : null;
        if (prevKey === key) {
            return;
        }
        this.iocPivotTrail = [...this.iocPivotTrail, entry].slice(-10);
    }
    normalizeComparableValue(value) {
        return (value ?? '').toString().trim().toLowerCase();
    }
    toComparableEntity(raw, primaryFallback) {
        const item = raw && typeof raw === 'object' ? raw : {};
        const type = this.normalizeComparableValue(item.type);
        const name = this.normalizeComparableValue(item.name);
        const value = this.normalizeComparableValue(item.value);
        const pattern = this.normalizeComparableValue(item.pattern);
        const primary = this.normalizeComparableValue(primaryFallback || item.name || item.value || item.pattern);
        return { type, name, value, pattern, primary };
    }
    buildIocContextKey(target) {
        return [target.type, target.name, target.value, target.pattern, target.primary].join('|');
    }
    entityMatchesComparable(entity, target) {
        const entityType = this.normalizeComparableValue(entity?.type);
        if (target.type && entityType !== target.type) {
            return false;
        }
        const entityName = this.normalizeComparableValue(entity?.name);
        const entityValue = this.normalizeComparableValue(entity?.value);
        const entityPattern = this.normalizeComparableValue(entity?.pattern);
        const hasStructuredTarget = Boolean(target.name || target.value || target.pattern);
        if (hasStructuredTarget) {
            if (target.name && entityName !== target.name) {
                return false;
            }
            if (target.value && entityValue !== target.value) {
                return false;
            }
            if (target.pattern && entityPattern !== target.pattern) {
                return false;
            }
            return true;
        }
        if (!target.primary) {
            return false;
        }
        return entityName === target.primary || entityValue === target.primary || entityPattern === target.primary;
    }
    buildEntityDedupeKey(entity) {
        return [
            this.normalizeComparableValue(entity?.type),
            this.normalizeComparableValue(entity?.name),
            this.normalizeComparableValue(entity?.value),
            this.normalizeComparableValue(entity?.pattern)
        ].join('|');
    }
    buildLocalIocContext(target) {
        const reportsMap = new Map();
        const relatedMap = new Map();
        const groups = Array.isArray(this.selectedCountryGroups) ? this.selectedCountryGroups : [];
        for (const group of groups) {
            const reportName = (group?.report || '').toString().trim();
            const reportItems = Array.isArray(group?.items) ? group.items : [];
            if (!reportName || !reportItems.length) {
                continue;
            }
            const matches = reportItems.filter(item => this.entityMatchesComparable(item, target));
            if (!matches.length) {
                continue;
            }
            const reportKey = reportName.toLowerCase();
            if (!reportsMap.has(reportKey)) {
                reportsMap.set(reportKey, {
                    id: null,
                    name: reportName,
                    modified: typeof group?.modified === 'string' ? group.modified : null,
                    sourceName: typeof group?.sourceName === 'string' ? group.sourceName : null,
                    sourceLink: typeof group?.sourceLink === 'string' ? group.sourceLink : null,
                    relationshipTypes: new Set(),
                    mentions: 0
                });
            }
            const reportEntry = reportsMap.get(reportKey);
            reportEntry.mentions += matches.length;
            for (const match of matches) {
                const rel = this.normalizeComparableValue(match?.relationshipType);
                if (rel) {
                    reportEntry.relationshipTypes.add(rel);
                }
            }
            for (const item of reportItems) {
                if (this.entityMatchesComparable(item, target)) {
                    continue;
                }
                const itemType = this.normalizeComparableValue(item?.type);
                if (!itemType || itemType === 'report') {
                    continue;
                }
                const dedupeKey = this.buildEntityDedupeKey(item);
                if (!relatedMap.has(dedupeKey)) {
                    relatedMap.set(dedupeKey, {
                        id: null,
                        type: itemType,
                        name: item?.name ?? null,
                        value: item?.value ?? null,
                        pattern: item?.pattern ?? null,
                        modified: typeof item?.modified === 'string' ? item.modified : null,
                        relationshipTypes: new Set(),
                        references: 0
                    });
                }
                const relatedEntry = relatedMap.get(dedupeKey);
                relatedEntry.references += 1;
                const rel = this.normalizeComparableValue(item?.relationshipType);
                if (rel) {
                    relatedEntry.relationshipTypes.add(rel);
                }
                if (typeof item?.modified === 'string') {
                    const nextTs = Date.parse(item.modified);
                    const currTs = relatedEntry.modified ? Date.parse(relatedEntry.modified) : 0;
                    if (!Number.isNaN(nextTs) && nextTs > currTs) {
                        relatedEntry.modified = item.modified;
                    }
                }
            }
        }
        const relatedReports = Array.from(reportsMap.values())
            .map(report => ({
            id: report.id,
            name: report.name,
            modified: report.modified,
            sourceName: report.sourceName,
            sourceLink: report.sourceLink,
            relationshipTypes: Array.from(report.relationshipTypes).sort((a, b) => a.localeCompare(b)),
            mentions: report.mentions
        }))
            .sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            return tsB - tsA || b.mentions - a.mentions || a.name.localeCompare(b.name);
        })
            .slice(0, 12);
        const relatedIocs = Array.from(relatedMap.values())
            .map(item => ({
            id: item.id,
            type: item.type,
            name: item.name,
            value: item.value,
            pattern: item.pattern,
            modified: item.modified,
            relationshipTypes: Array.from(item.relationshipTypes).sort((a, b) => a.localeCompare(b)),
            references: item.references
        }))
            .sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            const nameA = (a.name || a.value || a.pattern || '').toString();
            const nameB = (b.name || b.value || b.pattern || '').toString();
            return b.references - a.references || tsB - tsA || nameA.localeCompare(nameB);
        })
            .slice(0, 16);
        return { relatedReports, relatedIocs };
    }
    escapeForAqlLiteral(value) {
        return value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\t/g, ' ');
    }
    buildIocContextAql(target, startIso, endIso) {
        const filters = [];
        if (target.type) {
            filters.push(`LOWER(TO_STRING(ioc.type)) == "${this.escapeForAqlLiteral(target.type)}"`);
        }
        if (target.name) {
            filters.push(`LOWER(TRIM(TO_STRING(ioc.name))) == "${this.escapeForAqlLiteral(target.name)}"`);
        }
        if (target.value) {
            filters.push(`LOWER(TRIM(TO_STRING(ioc.value))) == "${this.escapeForAqlLiteral(target.value)}"`);
        }
        if (target.pattern) {
            filters.push(`LOWER(TRIM(TO_STRING(ioc.pattern))) == "${this.escapeForAqlLiteral(target.pattern)}"`);
        }
        if (!target.name && !target.value && !target.pattern && target.primary) {
            const safePrimary = this.escapeForAqlLiteral(target.primary);
            filters.push(`(
      LOWER(TRIM(TO_STRING(ioc.name))) == "${safePrimary}" OR
      LOWER(TRIM(TO_STRING(ioc.value))) == "${safePrimary}" OR
      LOWER(TRIM(TO_STRING(ioc.pattern))) == "${safePrimary}"
    )`);
        }
        if (!filters.length) {
            return null;
        }
        const iocTypes = Array.from(new Set([...this.fullEntityTypeList, 'ipv6-addr']))
            .map(type => `"${this.escapeForAqlLiteral(type.toLowerCase())}"`)
            .join(', ');
        const filterBlock = filters.map(filter => `    FILTER ${filter}`).join('\n');
        return `LET matchedIocs = (
  FOR ioc IN nodes_vertex_collection
${filterBlock}
    SORT ioc.modified DESC
    LIMIT 12
    RETURN ioc
)

LET reports = (
  FOR ioc IN matchedIocs
    FOR reportDoc, e IN 1..2 INBOUND ioc._id GRAPH 'lunargraph_graph'
      FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
        AND reportDoc.created >= "${this.escapeForAqlLiteral(startIso)}"
        AND reportDoc.created <= "${this.escapeForAqlLiteral(endIso)}"
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : 'unknown')))
      FILTER relType IN ["object", "references", "related-to", "uses", "targets", "attributed-to", "indicates", "located-at", "duplicate-of", "correlates-with", "created-by"]
      COLLECT reportId = reportDoc._id INTO grouped = { reportDoc, relType }
      LET doc = grouped[0].reportDoc
      LET relationshipTypes = UNIQUE(FOR row IN grouped RETURN row.relType)
      LET sourceName = FIRST(
        FOR ref IN doc.external_references
          FILTER ref.source_name == "x_source_name"
          RETURN ref.description
      )
      LET sourceLink = FIRST(
        FOR ref IN doc.external_references
          FILTER ref.source_name == "source_link"
          RETURN ref.url
      )
      SORT doc.modified DESC
      LIMIT 12
      RETURN {
        id: doc._id,
        name: doc.name,
        modified: doc.modified,
        sourceName,
        sourceLink,
        relationshipTypes,
        mentions: LENGTH(grouped)
      }
)

LET relatedIocs = (
  FOR ioc IN matchedIocs
    FOR neighbor, e IN 1..1 ANY ioc._id GRAPH 'lunargraph_graph'
      FILTER neighbor._id != ioc._id
      FILTER LOWER(TO_STRING(neighbor.type)) IN [${iocTypes}]
      FILTER LOWER(TO_STRING(neighbor.type)) != "report"
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : 'unknown')))
      FILTER relType != "object-marking"
      LET dedupeKey = CONCAT(
        LOWER(TRIM(TO_STRING(neighbor.type))), "|",
        LOWER(TRIM(TO_STRING(neighbor.name))), "|",
        LOWER(TRIM(TO_STRING(neighbor.value))), "|",
        LOWER(TRIM(TO_STRING(neighbor.pattern)))
      )
      COLLECT key = dedupeKey INTO grouped = { neighbor, relType }
      LET node = grouped[0].neighbor
      LET relationshipTypes = UNIQUE(FOR row IN grouped RETURN row.relType)
      LET references = LENGTH(grouped)
      SORT references DESC, node.modified DESC
      LIMIT 20
      RETURN {
        id: node._id,
        type: node.type,
        name: node.name,
        value: node.value,
        pattern: node.pattern,
        modified: node.modified,
        relationshipTypes,
        references
      }
)

RETURN {
  matchedCount: LENGTH(matchedIocs),
  reports,
  relatedIocs
}`;
    }
    normalizeContextReports(rows) {
        if (!Array.isArray(rows)) {
            return [];
        }
        return rows
            .map(row => ({
            id: row?.id ?? null,
            name: (row?.name || '').toString().trim(),
            modified: typeof row?.modified === 'string' ? row.modified : null,
            sourceName: typeof row?.sourceName === 'string' ? row.sourceName : null,
            sourceLink: typeof row?.sourceLink === 'string' ? row.sourceLink : null,
            relationshipTypes: Array.isArray(row?.relationshipTypes)
                ? row.relationshipTypes.map((rel) => (rel ?? '').toString().trim().toLowerCase()).filter((rel) => rel.length > 0)
                : [],
            mentions: Number(row?.mentions ?? 0)
        }))
            .filter(row => row.name.length > 0)
            .sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            return tsB - tsA || b.mentions - a.mentions || a.name.localeCompare(b.name);
        })
            .slice(0, 12);
    }
    normalizeContextRelatedIocs(rows) {
        if (!Array.isArray(rows)) {
            return [];
        }
        return rows
            .map(row => ({
            id: row?.id ?? null,
            type: (row?.type || '').toString().trim().toLowerCase(),
            name: typeof row?.name === 'string' ? row.name : null,
            value: typeof row?.value === 'string' ? row.value : null,
            pattern: typeof row?.pattern === 'string' ? row.pattern : null,
            modified: typeof row?.modified === 'string' ? row.modified : null,
            relationshipTypes: Array.isArray(row?.relationshipTypes)
                ? row.relationshipTypes.map((rel) => (rel ?? '').toString().trim().toLowerCase()).filter((rel) => rel.length > 0)
                : [],
            references: Number(row?.references ?? 0)
        }))
            .filter(row => row.type.length > 0 && Boolean((row.name || row.value || row.pattern || '').toString().trim()))
            .sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            const labelA = (a.name || a.value || a.pattern || '').toString();
            const labelB = (b.name || b.value || b.pattern || '').toString();
            return b.references - a.references || tsB - tsA || labelA.localeCompare(labelB);
        })
            .slice(0, 16);
    }
    loadIocContext(target, contextKey) {
        const startIso = this.toAqlIso(this.dateFilterRange.start);
        const endIso = this.toAqlIso(this.dateFilterRange.end);
        const aql = this.buildIocContextAql(target, startIso, endIso);
        if (!aql) {
            if (this.activeIocDetail && this.activeIocContextKey === contextKey) {
                this.activeIocDetail = {
                    ...this.activeIocDetail,
                    entity: {
                        ...this.activeIocDetail.entity,
                        raw: {
                            ...(this.activeIocDetail.entity.raw ?? {}),
                            contextLoading: false,
                            contextError: 'Not enough IOC fields to load linked context.'
                        }
                    }
                };
            }
            return;
        }
        this.iocContextSub?.unsubscribe();
        this.iocContextSub = this.http
            .post(`${environment.apiUrl}/api/${environment.apiVersion}/graph/aql-query`, { query: aql })
            .subscribe({
            next: (response) => {
                if (!this.activeIocDetail || this.activeIocContextKey !== contextKey) {
                    return;
                }
                const result = Array.isArray(response?.results?.result) ? response.results.result[0] : null;
                const raw = this.activeIocDetail.entity.raw ?? {};
                const remoteReports = this.normalizeContextReports(result?.reports);
                const remoteRelated = this.normalizeContextRelatedIocs(result?.relatedIocs);
                this.activeIocDetail = {
                    ...this.activeIocDetail,
                    entity: {
                        ...this.activeIocDetail.entity,
                        raw: {
                            ...raw,
                            contextLoading: false,
                            contextError: null,
                            matchedNodeCount: Number(result?.matchedCount ?? 0),
                            relatedReports: remoteReports.length ? remoteReports : (Array.isArray(raw?.relatedReports) ? raw.relatedReports : []),
                            relatedIocs: remoteRelated.length ? remoteRelated : (Array.isArray(raw?.relatedIocs) ? raw.relatedIocs : [])
                        }
                    }
                };
            },
            error: (error) => {
                if (!this.activeIocDetail || this.activeIocContextKey !== contextKey) {
                    return;
                }
                console.error('[Explorer] Failed to load IOC context', error);
                const raw = this.activeIocDetail.entity.raw ?? {};
                this.activeIocDetail = {
                    ...this.activeIocDetail,
                    entity: {
                        ...this.activeIocDetail.entity,
                        raw: {
                            ...raw,
                            contextLoading: false,
                            contextError: 'Failed to load linked IOC context from graph.'
                        }
                    }
                };
            }
        });
    }
    onSelectedCountry(selection) {
        if (!selection || (!selection.name && !selection.code)) {
            this.currentSelection = null;
            this.removeGlobeCountryFilterAndRefresh();
            return;
        }
        this.currentSelection = {
            name: selection.name ?? null,
            code: selection.code ?? null
        };
        this.applyGlobeCountryFilterAndRefresh(this.currentSelection);
    }
    onDateRangeChange(range) {
        // Date filter changes should re-enter "builder mode".
        this.overrideCompiledAql = null;
        this.overrideQueryPreview = null;
        const start = this.startOfDayUtc(range.start);
        const end = this.startOfDayUtc(range.end);
        this.dateFilterRange = { start, end };
        if (this.appliedQuery) {
            const formattedRange = {
                start: this.formatQueryDate(start),
                end: this.formatQueryDate(end)
            };
            this.appliedQuery = {
                ...this.appliedQuery,
                dateRange: formattedRange,
                preview: renderQueryPreview(this.appliedQuery.groups ?? [], formattedRange)
            };
        }
        if (!this.isBrowser) {
            return;
        }
        this.runLatestLocationIocsQuery(this.dateFilterRange);
    }
    onEntityGroupsChange(groups) {
        // The detail panels and globe state are driven from the applied query results, not globe clicks.
        // To prevent globe interactions from overriding the data set, we ignore these events.
        return;
    }
    resetCountryState() {
        this.currentSelection = null;
        this.selectedCountryIocs = [];
        this.selectedCountryGroups = [];
        this.selectedCountryReport = null;
        this.selectedCountryLoading = false;
        this.selectedCountry = null;
        this.selectedCountryCode = null;
        this.selectedCountryEntityGroups = [];
        this.reportInsightsGroup = null;
        this.queryGraphNodes = [];
        this.queryGraphLinks = [];
        this.selectedGraphNode = null;
        this.selectedGraphLink = null;
        this.graphNodePositions.clear();
        this.updateGlobeForSelection();
    }
    cloneQueryResult(result) {
        const clonedGroups = Array.isArray(result.groups)
            ? result.groups.map(group => ({
                id: group.id,
                nodeType: group.nodeType,
                clauseLogic: group.clauseLogic,
                joinWith: group.joinWith,
                clauses: group.clauses.map(clause => ({ ...clause }))
            }))
            : [];
        const dateRange = result.dateRange
            ? { start: result.dateRange.start ?? null, end: result.dateRange.end ?? null }
            : undefined;
        return {
            preview: result.preview,
            groups: clonedGroups,
            dateRange
        };
    }
    buildDefaultQuery() {
        const formattedRange = {
            start: this.formatQueryDate(this.dateFilterRange.start),
            end: this.formatQueryDate(this.dateFilterRange.end)
        };
        return {
            groups: [],
            dateRange: formattedRange,
            preview: renderQueryPreview([], formattedRange)
        };
    }
    runLatestLocationIocsQuery(range) {
        const { startIso, endIso } = this.buildDateBounds(range);
        const dynamicEndDate = this.isDynamicEndDateSelected(range);
        const aql = buildExplorerLocationIocsAql({
            startIso,
            endIso,
            dynamicEndDate,
            groups: this.currentGroups,
            fullEntityTypeList: this.fullEntityTypeList
        });
        this.executeLocationIocsAql(aql);
    }
    executeLocationIocsAql(aql) {
        this.selectedCountryLoading = true;
        const normalizedAql = this.normalizeLegacyCompiledAql(aql);
        const payload = { query: normalizedAql };
        this.locationDataSub?.unsubscribe();
        this.locationDataSub = this.http
            .post(`${environment.apiUrl}/api/${environment.apiVersion}/graph/aql-query`, payload)
            .subscribe({
            next: (response) => {
                const raw = Array.isArray(response?.results?.result) ? response.results.result : [];
                const normalized = raw.map((d) => {
                    const detail = Array.isArray(d?.nodes_vertex_collection)
                        ? d.nodes_vertex_collection.map((rep) => ({
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
                    const allEntities = detail.flatMap((rep) => (Array.isArray(rep?.entities) ? rep.entities : []));
                    const highlights = Array.isArray(d?.highlightIocs) && d.highlightIocs.length
                        ? this.dedupeReportEntities(d.highlightIocs)
                        : allEntities.slice(0, 12);
                    const primaryName = detail.length ? detail[0].name : d?.report ?? null;
                    return {
                        location: d?.locationName || d?.locationCode || d?.location || null,
                        locationName: d?.locationName ?? null,
                        locationCode: d?.locationCode ?? null,
                        report: primaryName,
                        moduleCounts: Array.isArray(d?.moduleCounts) ? d.moduleCounts : [],
                        nodes_vertex_collection: detail,
                        entities: allEntities,
                        highlightIocs: highlights,
                        iocs: highlights
                    };
                });
                this.latestLocations = normalized;
                this.applyAggregatedResults();
            },
            error: (err) => {
                this.selectedCountryLoading = false;
                console.error('[Explorer] Failed to load globe data:', err);
            }
        });
    }
    normalizeLegacyCompiledAql(aql) {
        const source = typeof aql === 'string' ? aql : '';
        if (!source) {
            return source;
        }
        let normalized = source
            .replace(/\n\s*LET depth\d* = LENGTH\(p\d*\.vertices\)\s*/g, '\n')
            .replace(/\n\s*LET firstHopType\d* = depth\d* > 1 \? LOWER\(TO_STRING\(p\d*\.vertices\[1\]\.type\)\) : null\s*/g, '\n')
            .replace(/\n\s*FILTER depth\d* == 2 OR \(depth\d* == 3 AND firstHopType\d* == "relationship"\)\s*/g, '\n');
        normalized = normalized.replace(/(\n(\s*)FOR reportDoc,\s*e(\d*),\s*p\3 IN 1\.\.2 ANY [^\n]+GRAPH 'lunargraph_graph'\n)(?!\s*PRUNE)/g, (_match, loopLine, loopIndent, pathSuffix) => {
            const pathVar = `p${pathSuffix}`;
            return `${loopLine}${loopIndent}  PRUNE LENGTH(${pathVar}.vertices) == 2\n${loopIndent}    AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]\n`;
        });
        return normalized;
    }
    dedupeReportEntities(entities) {
        if (!Array.isArray(entities) || entities.length < 2) {
            return Array.isArray(entities) ? entities : [];
        }
        const buckets = new Map();
        for (const entity of entities) {
            const key = [
                String(entity?.type ?? '').trim().toLowerCase(),
                String(entity?.name ?? '').trim().toLowerCase(),
                String(entity?.value ?? '').trim().toLowerCase(),
                String(entity?.pattern ?? '').trim().toLowerCase()
            ].join('|');
            const list = buckets.get(key);
            if (list) {
                list.push(entity);
            }
            else {
                buckets.set(key, [entity]);
            }
        }
        const rankRelationshipType = (value) => {
            const rel = String(value ?? '').trim().toLowerCase();
            if (rel === 'object')
                return 4;
            if (rel === 'references')
                return 3;
            if (rel === 'related-to')
                return 2;
            if (!rel)
                return 0;
            return 1;
        };
        const result = [];
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
    applyAggregatedResults() {
        const locations = Array.isArray(this.latestLocations) ? this.latestLocations : [];
        if (!locations.length) {
            this.selectedCountryIocs = [];
            this.selectedCountryGroups = [];
            this.selectedCountryEntityGroups = [];
            this.reportInsightsGroup = null;
            this.selectedCountryReport = null;
            this.selectedCountry = null;
            this.selectedCountryCode = null;
            this.selectedCountryLoading = false;
            this.queryGraphNodes = [];
            this.queryGraphLinks = [];
            this.selectedGraphNode = null;
            this.selectedGraphLink = null;
            this.externalIntelItems = [];
            this.externalIntelSections = [];
            this.externalIntelTypeCounts = [];
            this.polymarketItems = [];
            this.polymarketContextTerms = [];
            this.polymarketLoading = false;
            this.polymarketError = null;
            const fallbackKeys = Array.from(new Set([...this.knownModuleKeys, ...this.selectedModuleFilterKeys]))
                .sort((a, b) => a.localeCompare(b));
            this.moduleBreakdownCounts = fallbackKeys.map(key => ({
                key,
                label: this.moduleLabelFromKey(key),
                count: 0
            }));
            this.externalIntelError = null;
            this.updateGlobeForSelection();
            return;
        }
        const aggregatedEntities = [];
        const nodesByKey = new Map();
        locations.forEach(entry => {
            const nodes = Array.isArray(entry?.nodes_vertex_collection) ? entry.nodes_vertex_collection : [];
            nodes.forEach((node) => {
                const key = node?.id ?? `${node?.name ?? 'node'}::${node?.modified ?? ''}`;
                if (!nodesByKey.has(key)) {
                    nodesByKey.set(key, node);
                }
            });
            const entities = Array.isArray(entry?.entities)
                ? entry.entities
                : Array.isArray(entry?.iocs)
                    ? entry.iocs
                    : [];
            entities.forEach((entity) => aggregatedEntities.push(entity));
        });
        const aggregatedNodes = Array.from(nodesByKey.values());
        this.selectedCountryIocs = aggregatedEntities;
        const groupsFromNodes = this.buildGroupsFromReports(aggregatedNodes);
        this.selectedCountryGroups = groupsFromNodes.length
            ? groupsFromNodes
            : this.buildGroupsFromLocationEntries(locations);
        const entityGroups = this.buildEntityGroupsFromEntities(aggregatedEntities);
        this.reportInsightsGroup = this.buildReportInsightsGroup(this.selectedCountryGroups, aggregatedEntities);
        this.selectedCountryEntityGroups = entityGroups;
        this.selectedCountryReport = this.selectedCountryGroups.length === 1
            ? this.selectedCountryGroups[0].report
            : null;
        const selectionName = (this.currentSelection?.name || '').trim();
        const selectionCode = (this.currentSelection?.code || '').trim();
        this.selectedCountry = selectionName || 'Query Results';
        this.selectedCountryCode = selectionCode ? selectionCode.toUpperCase() : null;
        this.selectedCountryLoading = false;
        this.rebuildQueryGraphFromGroups(this.selectedCountryGroups);
        this.rebuildExternalIntelFromGraph();
        this.updateGlobeForSelection();
    }
    trackByExternalIntelItem(_, item) {
        return `${item.source_name}|${item.title}|${item.link || ''}`;
    }
    trackByPolymarketItem(_, item) {
        return item.marketId || item.slug || item.question;
    }
    refreshExternalIntel() {
        this.rebuildExternalIntelFromGraph();
    }
    rebuildExternalIntelFromGraph() {
        const groups = Array.isArray(this.selectedCountryGroups) ? this.selectedCountryGroups : [];
        this.externalIntelLoading = false;
        this.externalIntelError = null;
        const sourceMap = new Map();
        const moduleCounts = new Map();
        const items = [];
        for (const group of groups) {
            const sourceName = (group?.sourceName || '').trim() || 'Graph Source';
            const sourceLink = (group?.sourceLink || '').trim() || null;
            const sourceId = sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'graph-source';
            if (!sourceMap.has(sourceId)) {
                sourceMap.set(sourceId, {
                    id: sourceId,
                    name: sourceName,
                    source_type: 'graph',
                    category: 'graph',
                    url: sourceLink,
                    origin: 'lunargraph'
                });
            }
            const reportTitle = (group?.report || '').trim();
            if (!reportTitle) {
                continue;
            }
            const intelligenceModule = (group?.intelligenceModule || '').toString().trim().toLowerCase();
            if (intelligenceModule) {
                moduleCounts.set(intelligenceModule, (moduleCounts.get(intelligenceModule) ?? 0) + 1);
            }
            const sampleEntities = Array.isArray(group?.items) ? group.items.slice(0, 4) : [];
            const summary = sampleEntities
                .map((entity) => (entity?.name || entity?.value || entity?.pattern || '').toString().trim())
                .filter(Boolean)
                .slice(0, 4)
                .join(' • ');
            items.push({
                title: reportTitle,
                link: sourceLink,
                source_name: sourceName,
                source_url: sourceLink,
                summary: summary || null,
                published_at: group?.modified || null,
                matched_country: Boolean(this.selectedCountryLabel),
                item_type: 'graph-report',
                severity: null,
                metadata: {
                    origin: 'lunargraph',
                    module: intelligenceModule || ''
                }
            });
        }
        items.sort((a, b) => {
            const aTs = a.published_at ? Date.parse(a.published_at) : 0;
            const bTs = b.published_at ? Date.parse(b.published_at) : 0;
            return bTs - aTs;
        });
        this.externalIntelSources = Array.from(sourceMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        this.externalIntelItems = items.slice(0, 48);
        this.externalIntelSections = [];
        const moduleTypeCounts = Array.from(moduleCounts.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([module, count]) => ({
            key: `module-${module}`,
            label: `${module.charAt(0).toUpperCase()}${module.slice(1)} Module`,
            count
        }));
        const currentCountByKey = new Map(moduleTypeCounts.map(item => [item.key, item.count]));
        this.knownModuleKeys = Array.from(new Set([
            ...this.knownModuleKeys,
            ...moduleTypeCounts.map(item => item.key),
            ...this.selectedModuleFilterKeys
        ])).sort((a, b) => a.localeCompare(b));
        this.externalIntelTypeCounts = [];
        this.moduleBreakdownCounts = this.knownModuleKeys.map(key => ({
            key,
            label: this.moduleLabelFromKey(key),
            count: currentCountByKey.get(key) ?? 0
        }));
        this.refreshPolymarketImpliedProbabilities();
    }
    refreshPolymarketImpliedProbabilities() {
        const requestToken = ++this.polymarketRequestToken;
        const context = this.buildPolymarketQueryContext();
        this.polymarketContextTerms = context.terms;
        this.polymarketLoading = true;
        this.polymarketError = null;
        const country = context.country;
        const queryParts = [
            `limit=${encodeURIComponent('10')}`,
            `event_limit=${encodeURIComponent('120')}`
        ];
        if (country) {
            queryParts.push(`country=${encodeURIComponent(country)}`);
        }
        for (const term of context.terms) {
            queryParts.push(`terms=${encodeURIComponent(term)}`);
        }
        const url = `${environment.apiUrl}/api/${environment.apiVersion}/intel/polymarket/implied-probabilities?${queryParts.join('&')}`;
        this.http.get(url).subscribe({
            next: (response) => {
                if (requestToken !== this.polymarketRequestToken) {
                    return;
                }
                const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
                this.polymarketItems = rawItems
                    .map((item) => {
                    const safeItem = (item && typeof item === 'object') ? item : {};
                    const question = (safeItem['question'] || '').toString().trim();
                    if (!question) {
                        return null;
                    }
                    const rawProbability = Number(safeItem['impliedProbability']);
                    const impliedProbability = Number.isFinite(rawProbability)
                        ? Math.max(0, Math.min(1, rawProbability))
                        : 0;
                    const rawOutcomes = Array.isArray(safeItem['outcomes']) ? safeItem['outcomes'] : [];
                    const outcomes = rawOutcomes
                        .map((outcome) => {
                        const safeOutcome = (outcome && typeof outcome === 'object') ? outcome : {};
                        const label = (safeOutcome['label'] || '').toString().trim();
                        const probabilityRaw = Number(safeOutcome['probability']);
                        if (!label || !Number.isFinite(probabilityRaw)) {
                            return null;
                        }
                        return {
                            label,
                            probability: Math.max(0, Math.min(1, probabilityRaw))
                        };
                    })
                        .filter((outcome) => outcome !== null)
                        .sort((a, b) => b.probability - a.probability)
                        .slice(0, 3);
                    const rawHistorySeries = Array.isArray(safeItem['historySeries']) ? safeItem['historySeries'] : [];
                    const historySeries = this.compressPolymarketHistorySeries(rawHistorySeries
                        .map((value) => Number(value))
                        .filter((value) => Number.isFinite(value))
                        .map((value) => Math.max(0, Math.min(1, value))), 56);
                    const computedHistoryChange = historySeries.length >= 2
                        ? historySeries[historySeries.length - 1] - historySeries[0]
                        : null;
                    const suppliedHistoryChange = Number(safeItem['historyChange']);
                    const historyChange = Number.isFinite(suppliedHistoryChange)
                        ? suppliedHistoryChange
                        : computedHistoryChange;
                    return {
                        marketId: (safeItem['marketId'] || '').toString(),
                        historyTokenId: safeItem['historyTokenId'] ? safeItem['historyTokenId'].toString() : null,
                        question,
                        slug: safeItem['slug'] ? safeItem['slug'].toString() : null,
                        url: safeItem['url'] ? safeItem['url'].toString() : null,
                        eventTitle: safeItem['eventTitle'] ? safeItem['eventTitle'].toString() : null,
                        endDate: safeItem['endDate'] ? safeItem['endDate'].toString() : null,
                        outcomeLabel: (safeItem['outcomeLabel'] || outcomes[0]?.label || 'Top Outcome').toString(),
                        impliedProbability,
                        outcomes,
                        volume: Number.isFinite(Number(safeItem['volume'])) ? Number(safeItem['volume']) : 0,
                        liquidity: Number.isFinite(Number(safeItem['liquidity'])) ? Number(safeItem['liquidity']) : 0,
                        matchedTerms: Array.isArray(safeItem['matchedTerms'])
                            ? safeItem['matchedTerms'].map((term) => String(term ?? '').trim()).filter(Boolean)
                            : [],
                        relevance: Number.isFinite(Number(safeItem['relevance'])) ? Number(safeItem['relevance']) : 0,
                        topicPriority: Number.isFinite(Number(safeItem['topicPriority'])) ? Number(safeItem['topicPriority']) : null,
                        trendingScore: Number.isFinite(Number(safeItem['trendingScore'])) ? Number(safeItem['trendingScore']) : null,
                        trendRank: Number.isFinite(Number(safeItem['trendRank'])) ? Number(safeItem['trendRank']) : null,
                        historySeries,
                        historySvgPath: this.buildPolymarketHistoryPath(historySeries),
                        historyChange,
                        historyLoading: false
                    };
                })
                    .filter((item) => item !== null)
                    .slice(0, 10);
                this.polymarketLoading = false;
                if (!this.polymarketItems.length) {
                    this.polymarketError = 'No active Polymarket markets matched this query context.';
                    return;
                }
                void this.loadPolymarketHistory(requestToken, this.polymarketItems);
            },
            error: (error) => {
                if (requestToken !== this.polymarketRequestToken) {
                    return;
                }
                console.error('[Explorer] Failed to load Polymarket implied probabilities', error);
                this.polymarketItems = [];
                this.polymarketLoading = false;
                this.polymarketError = 'Failed to load Polymarket implied probability data.';
            }
        });
    }
    async loadPolymarketHistory(requestToken, markets) {
        const targets = markets.filter((market) => {
            const historySourceId = (market?.historyTokenId || market?.marketId || '').trim();
            return !!historySourceId && !market.historySvgPath;
        });
        if (!targets.length) {
            return;
        }
        for (const market of targets) {
            market.historyLoading = true;
        }
        this.polymarketItems = [...this.polymarketItems];
        await Promise.all(targets.map(async (market) => {
            const marketId = (market.historyTokenId || market.marketId || '').trim();
            if (!marketId) {
                market.historyLoading = false;
                return;
            }
            try {
                const endpoint = `https://clob.polymarket.com/prices-history?market=${encodeURIComponent(marketId)}&interval=max&fidelity=1440`;
                const response = await fetch(endpoint);
                if (!response.ok) {
                    return;
                }
                const payload = await response.json();
                if (requestToken !== this.polymarketRequestToken) {
                    return;
                }
                const rawSeries = Array.isArray(payload?.history)
                    ? payload.history
                        .map((point) => Number(point?.p))
                        .filter((value) => Number.isFinite(value))
                        .map((value) => Math.max(0, Math.min(1, value)))
                    : [];
                const historySeries = this.compressPolymarketHistorySeries(rawSeries, 56);
                market.historySeries = historySeries;
                market.historySvgPath = this.buildPolymarketHistoryPath(historySeries);
                market.historyChange = historySeries.length >= 2
                    ? historySeries[historySeries.length - 1] - historySeries[0]
                    : null;
            }
            catch {
                // Ignore per-market history failures and keep card rendering stable.
            }
            finally {
                if (requestToken === this.polymarketRequestToken) {
                    market.historyLoading = false;
                }
            }
        }));
        if (requestToken === this.polymarketRequestToken) {
            this.polymarketItems = [...this.polymarketItems];
        }
    }
    compressPolymarketHistorySeries(series, maxPoints) {
        if (series.length <= maxPoints) {
            return series;
        }
        const step = Math.max(1, Math.floor(series.length / maxPoints));
        const out = [];
        for (let index = 0; index < series.length; index += step) {
            out.push(series[index]);
        }
        const finalPoint = series[series.length - 1];
        if (out[out.length - 1] !== finalPoint) {
            out.push(finalPoint);
        }
        return out.slice(-maxPoints);
    }
    buildPolymarketHistoryPath(series) {
        if (series.length < 2) {
            return null;
        }
        const width = 120;
        const height = 28;
        const inset = 1.5;
        const drawableHeight = height - inset * 2;
        return series
            .map((probability, index) => {
            const x = series.length === 1 ? 0 : (index / (series.length - 1)) * width;
            const y = inset + (1 - probability) * drawableHeight;
            return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
            .join(' ');
    }
    buildPolymarketQueryContext() {
        const terms = [];
        const seen = new Set();
        const stopWords = new Set([
            'article',
            'report',
            'news',
            'analysis',
            'update',
            'today',
            'will',
            'after',
            'before',
            'with'
        ]);
        const pushTerm = (value) => {
            const normalized = String(value ?? '')
                .trim()
                .replace(/\s+/g, ' ')
                .toLowerCase();
            if (!normalized || normalized.length < 3 || stopWords.has(normalized) || seen.has(normalized)) {
                return null;
            }
            seen.add(normalized);
            terms.push(normalized);
            return normalized;
        };
        const resolveRegionName = (input) => {
            const code = (input || '').trim().toUpperCase();
            if (!/^[A-Z]{2}$/.test(code)) {
                return null;
            }
            if (!this.isBrowser || typeof Intl === 'undefined' || !Intl.DisplayNames) {
                return null;
            }
            try {
                const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
                const resolved = displayNames.of(code);
                return typeof resolved === 'string' ? resolved : null;
            }
            catch {
                return null;
            }
        };
        let countryContext = null;
        const locationGroup = this.currentGroups.find(group => group.id === ExplorerComponent_1.GLOBE_COUNTRY_FILTER_GROUP_ID || group.nodeType === 'location');
        for (const group of this.currentGroups) {
            const clauses = Array.isArray(group?.clauses) ? group.clauses : [];
            for (const clause of clauses) {
                const field = (clause?.field || '').toString().trim().toLowerCase();
                const operator = (clause?.operator || '').toString().trim().toLowerCase();
                const rawValue = clause?.value;
                const splitValues = operator === 'in'
                    ? String(rawValue ?? '').split(',').map(part => part.trim()).filter(Boolean)
                    : [String(rawValue ?? '').trim()].filter(Boolean);
                for (const value of splitValues) {
                    const normalizedFieldValue = value.trim();
                    if (!normalizedFieldValue) {
                        continue;
                    }
                    if (group.nodeType === 'location' && field === 'country') {
                        const regionName = resolveRegionName(normalizedFieldValue);
                        if (regionName) {
                            const pushed = pushTerm(regionName);
                            if (group.id === ExplorerComponent_1.GLOBE_COUNTRY_FILTER_GROUP_ID && pushed && !countryContext) {
                                countryContext = regionName;
                            }
                        }
                        else {
                            pushTerm(normalizedFieldValue);
                        }
                        continue;
                    }
                    const pushed = pushTerm(normalizedFieldValue);
                    if (group.id === ExplorerComponent_1.GLOBE_COUNTRY_FILTER_GROUP_ID && group.nodeType === 'location' && field === 'name' && pushed && !countryContext) {
                        countryContext = normalizedFieldValue;
                    }
                }
            }
        }
        if (!countryContext && locationGroup && this.selectedCountry && this.selectedCountry !== 'Query Results') {
            const pushed = pushTerm(this.selectedCountry);
            if (pushed) {
                countryContext = this.selectedCountry;
            }
        }
        return {
            country: countryContext,
            terms: terms.slice(0, 12)
        };
    }
    setLiveGridCount(count) {
        this.liveGridCount = count;
        this.resolveLiveMonitorStreams();
    }
    refreshLiveMonitorStreams() {
        this.resolveLiveMonitorStreams(true);
    }
    getVisibleLiveMonitorChannels() {
        return this.liveMonitorChannels.slice(0, this.liveGridCount);
    }
    getLiveEmbedUrl(channel) {
        const resolved = this.resolvedLiveVideoIds[channel.id];
        return this.buildYoutubeEmbedUrl(resolved || channel.fallbackVideoId);
    }
    buildYoutubeEmbedUrl(videoId) {
        const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(src);
    }
    resolveLiveMonitorStreams(forceRefresh = false) {
        const channels = this.getVisibleLiveMonitorChannels()
            .map(channel => channel.handle)
            .join(',');
        if (!channels) {
            return;
        }
        this.liveResolveLoading = true;
        const refreshQuery = forceRefresh ? '&refresh=true' : '';
        this.http
            .get(`${environment.apiUrl}/api/${environment.apiVersion}/intel/live-streams?channels=${encodeURIComponent(channels)}${refreshQuery}`)
            .subscribe({
            next: (response) => {
                const items = Array.isArray(response?.data?.items) ? response.data.items : [];
                const byChannel = new Map();
                for (const item of items) {
                    const key = String(item?.channel || '').toLowerCase();
                    if (key) {
                        byChannel.set(key, item);
                    }
                }
                const nextResolved = {};
                for (const channel of this.liveMonitorChannels) {
                    const resolved = byChannel.get(channel.handle.toLowerCase());
                    const videoId = resolved?.video_id ? String(resolved.video_id) : '';
                    if (videoId) {
                        nextResolved[channel.id] = videoId;
                    }
                }
                this.resolvedLiveVideoIds = nextResolved;
                this.liveResolveLoading = false;
            },
            error: (error) => {
                console.error('[Explorer] Failed to resolve live streams', error);
                this.liveResolveLoading = false;
            }
        });
    }
    loadExternalIntelSources() {
        this.externalIntelSourcesLoading = true;
        this.externalIntelSources = FRONTEND_INTEL_FEEDS.map(feed => ({
            id: feed.id,
            name: feed.name,
            source_type: 'rss',
            category: feed.category,
            url: feed.sourceUrl,
            origin: 'worldmonitor-frontend'
        }));
        this.externalIntelSourcesLoading = false;
    }
    loadExternalIntel(country) {
        void this.loadExternalIntelFrontend(country);
    }
    async loadExternalIntelFrontend(country) {
        const countryTerm = (country || '').trim().toLowerCase();
        this.externalIntelLoading = true;
        this.externalIntelError = null;
        const proxyBase = 'https://api.rss2json.com/v1/api.json?rss_url=';
        const requests = FRONTEND_INTEL_FEEDS.map(async (feed) => {
            try {
                const response = await fetch(`${proxyBase}${encodeURIComponent(feed.rssUrl)}`);
                if (!response.ok) {
                    return [];
                }
                const data = (await response.json());
                const items = Array.isArray(data?.items) ? data.items : [];
                return items.slice(0, 4).map((item) => {
                    const title = String(item?.title || '').trim();
                    const summaryRaw = String(item?.description || '')
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    const summary = summaryRaw ? summaryRaw.slice(0, 240) : null;
                    const text = `${title} ${summaryRaw}`.toLowerCase();
                    const matchedCountry = countryTerm ? text.includes(countryTerm) : false;
                    const severity = this.deriveFrontendIntelSeverity(feed.category, text);
                    return {
                        title,
                        link: item?.link ? String(item.link) : null,
                        source_name: feed.name,
                        source_url: feed.sourceUrl,
                        summary,
                        published_at: item?.pubDate ? String(item.pubDate) : null,
                        matched_country: matchedCountry,
                        item_type: feed.itemType,
                        severity,
                        metadata: { category: feed.category, origin: 'worldmonitor-frontend' }
                    };
                }).filter(item => !!item.title);
            }
            catch {
                return [];
            }
        });
        try {
            const list = await Promise.all(requests);
            const allItems = list.flat();
            const ranked = allItems
                .sort((a, b) => {
                const scoreA = (a.matched_country ? 2 : 0) + (a.severity === 'high' ? 1 : 0);
                const scoreB = (b.matched_country ? 2 : 0) + (b.severity === 'high' ? 1 : 0);
                if (scoreA !== scoreB) {
                    return scoreB - scoreA;
                }
                const aTs = a.published_at ? Date.parse(a.published_at) : 0;
                const bTs = b.published_at ? Date.parse(b.published_at) : 0;
                return bTs - aTs;
            })
                .slice(0, 48);
            this.externalIntelItems = ranked;
            this.rebuildExternalIntelPresentation();
            this.externalIntelLoading = false;
            if (!ranked.length) {
                this.externalIntelError = 'No feed items were returned from the selected WorldMonitor sources.';
            }
        }
        catch (error) {
            console.error('[Explorer] Failed to fetch frontend external intel', error);
            this.externalIntelItems = [];
            this.externalIntelSections = [];
            this.externalIntelTypeCounts = [];
            this.moduleBreakdownCounts = [];
            this.externalIntelLoading = false;
            this.externalIntelError = 'Failed to load frontend intelligence feeds.';
        }
    }
    deriveFrontendIntelSeverity(category, text) {
        if (category === 'cyber') {
            if (/(ransomware|zero-day|critical|breach|exploit)/i.test(text)) {
                return 'high';
            }
            if (/(malware|phishing|cve|incident)/i.test(text)) {
                return 'medium';
            }
        }
        if (/(missile|strike|attack|conflict|war|nuclear)/i.test(text)) {
            return 'high';
        }
        if (/(risk|warning|alert|threat|sanction)/i.test(text)) {
            return 'medium';
        }
        return null;
    }
    rebuildExternalIntelPresentation() {
        const typeLabel = (key) => {
            switch (key) {
                case 'geo-event':
                    return 'Geo Events';
                case 'environmental-event':
                    return 'Environmental Events';
                case 'cyber-alert':
                    return 'Cyber Alerts';
                case 'headline':
                    return 'Headlines';
                default:
                    return key
                        .split(/[^a-z0-9]+/gi)
                        .filter(Boolean)
                        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ') || 'Other';
            }
        };
        const order = (key) => {
            switch (key) {
                case 'cyber-alert':
                    return 1;
                case 'geo-event':
                    return 2;
                case 'environmental-event':
                    return 3;
                case 'headline':
                    return 4;
                default:
                    return 99;
            }
        };
        const grouped = new Map();
        for (const item of this.externalIntelItems) {
            const key = (item.item_type || 'headline').trim().toLowerCase() || 'headline';
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(item);
        }
        const sections = Array.from(grouped.entries())
            .map(([key, items]) => ({
            key,
            label: typeLabel(key),
            items
        }))
            .sort((a, b) => order(a.key) - order(b.key) || a.label.localeCompare(b.label));
        this.externalIntelSections = sections.map(section => ({
            ...section,
            items: section.items.slice(0, 12)
        }));
        this.externalIntelTypeCounts = sections.map(section => ({
            key: section.key,
            label: section.label,
            count: section.items.length
        }));
        this.moduleBreakdownCounts = [];
    }
    applyGlobeCountryFilterAndRefresh(selection) {
        const rawCountryCode = (selection.code || '').trim();
        const countryCode = /^[A-Z]{2}$/i.test(rawCountryCode) ? rawCountryCode.toUpperCase() : '';
        const countryName = (selection.name || '').trim();
        const clauses = [];
        if (countryCode) {
            clauses.push({
                field: 'country',
                operator: 'equals',
                value: countryCode
            });
        }
        else if (countryName) {
            clauses.push({
                field: 'name',
                operator: 'equals',
                value: countryName
            });
        }
        if (!clauses.length) {
            return;
        }
        const groupsClone = this.currentGroups.map(group => ({
            ...group,
            clauses: [...(group.clauses ?? [])]
        }));
        const countryGroup = {
            id: ExplorerComponent_1.GLOBE_COUNTRY_FILTER_GROUP_ID,
            nodeType: 'location',
            clauseLogic: clauses.length > 1 ? 'OR' : 'AND',
            joinWith: 'AND',
            clauses
        };
        const existingIndex = groupsClone.findIndex(group => group.id === ExplorerComponent_1.GLOBE_COUNTRY_FILTER_GROUP_ID);
        if (existingIndex >= 0) {
            groupsClone[existingIndex] = countryGroup;
        }
        else {
            groupsClone.push(countryGroup);
        }
        this.applyGroupsAndRefresh(groupsClone);
    }
    removeGlobeCountryFilterAndRefresh() {
        const groupsClone = this.currentGroups
            .filter(group => group.id !== ExplorerComponent_1.GLOBE_COUNTRY_FILTER_GROUP_ID)
            .map(group => ({
            ...group,
            clauses: [...(group.clauses ?? [])]
        }));
        this.applyGroupsAndRefresh(groupsClone);
    }
    applyGroupsAndRefresh(groups) {
        // Any mutation to the builder groups should clear "compiled AQL override" mode.
        this.overrideCompiledAql = null;
        this.overrideQueryPreview = null;
        this.currentGroups = groups;
        this.selectedModuleFilterKeys = this.extractModuleFilterKeysFromGroups(this.currentGroups);
        const dateRange = this.appliedQuery?.dateRange ?? {
            start: this.formatQueryDate(this.dateFilterRange.start),
            end: this.formatQueryDate(this.dateFilterRange.end)
        };
        const appliedGroups = this.currentGroups.map(group => ({
            ...group,
            clauses: [...(group.clauses ?? [])]
        }));
        this.appliedQuery = {
            preview: renderQueryPreview(appliedGroups, dateRange ?? { start: null, end: null }),
            groups: appliedGroups,
            dateRange
        };
        if (this.isBrowser && this.dateFilterRange) {
            this.runLatestLocationIocsQuery(this.dateFilterRange);
        }
        else {
            this.applyAggregatedResults();
        }
    }
    onModuleChipToggle(moduleKey) {
        const key = (moduleKey || '').trim();
        if (!key) {
            return;
        }
        const selected = new Set(this.selectedModuleFilterKeys);
        if (selected.has(key)) {
            selected.delete(key);
        }
        else {
            selected.add(key);
        }
        const nextKeys = Array.from(selected).sort((a, b) => a.localeCompare(b));
        this.applyModuleFiltersAndRefresh(nextKeys);
    }
    applyModuleFiltersAndRefresh(moduleKeys) {
        const values = moduleKeys
            .map(key => this.moduleValueFromKey(key))
            .map(value => value.trim().toLowerCase())
            .filter(Boolean);
        const groupsClone = this.currentGroups
            .filter(group => group.id !== ExplorerComponent_1.MODULE_FILTER_GROUP_ID)
            .map(group => ({
            ...group,
            clauses: [...(group.clauses ?? [])]
        }));
        if (values.length) {
            const moduleGroup = {
                id: ExplorerComponent_1.MODULE_FILTER_GROUP_ID,
                nodeType: 'report',
                clauseLogic: 'AND',
                joinWith: 'AND',
                clauses: [{
                        field: 'intelligence_module',
                        operator: 'in',
                        value: values.join(', ')
                    }]
            };
            groupsClone.push(moduleGroup);
        }
        this.applyGroupsAndRefresh(groupsClone);
    }
    extractModuleFilterKeysFromGroups(groups) {
        const moduleGroup = (groups ?? []).find(group => group.id === ExplorerComponent_1.MODULE_FILTER_GROUP_ID);
        if (!moduleGroup) {
            return [];
        }
        const values = (moduleGroup.clauses ?? [])
            .filter(clause => (clause?.field || '').trim().toLowerCase() === 'intelligence_module')
            .flatMap(clause => String(clause?.value ?? '')
            .split(',')
            .map(item => item.trim().toLowerCase())
            .filter(Boolean));
        return Array.from(new Set(values)).map(value => `module-${value}`).sort((a, b) => a.localeCompare(b));
    }
    moduleValueFromKey(key) {
        const normalized = (key || '').trim().toLowerCase();
        return normalized.startsWith('module-') ? normalized.slice('module-'.length) : normalized;
    }
    moduleLabelFromKey(key) {
        const module = this.moduleValueFromKey(key);
        if (!module) {
            return 'Module';
        }
        return `${module.charAt(0).toUpperCase()}${module.slice(1)} Module`;
    }
    buildGroupsFromReports(reports) {
        if (!Array.isArray(reports)) {
            return [];
        }
        return reports.map(rep => {
            const sanitizedName = this.sanitizeReportName(typeof rep?.name === 'string' ? rep.name : 'Unknown Report');
            const items = Array.isArray(rep?.entities)
                ? rep.entities.map((entity) => ({
                    ...entity,
                    report: sanitizedName
                }))
                : [];
            let latestModified = null;
            for (const item of items) {
                const candidate = typeof item?.modified === 'string' ? item.modified : null;
                if (candidate && (!latestModified || Date.parse(candidate) > Date.parse(latestModified))) {
                    latestModified = candidate;
                }
            }
            return {
                report: sanitizedName,
                items,
                modified: latestModified ?? (typeof rep?.modified === 'string' ? rep.modified : null),
                sourceName: typeof rep?.sourceName === 'string' ? rep.sourceName : null,
                sourceLink: typeof rep?.sourceLink === 'string' ? rep.sourceLink : null,
                intelligenceModule: typeof rep?.intelligenceModule === 'string' ? rep.intelligenceModule : null,
                description: typeof rep?.description === 'string' ? rep.description : null
            };
        });
    }
    buildGroupsFromLocationEntries(entries) {
        if (!Array.isArray(entries) || !entries.length) {
            return [];
        }
        const grouped = new Map();
        const upsertGroup = (rawReport, entry) => {
            const reportName = this.sanitizeReportName(typeof rawReport?.name === 'string' ? rawReport.name : (typeof entry?.report === 'string' ? entry.report : 'Unknown Report'));
            const reportKey = reportName.toLowerCase();
            const current = grouped.get(reportKey);
            const repEntities = Array.isArray(rawReport?.entities)
                ? rawReport.entities
                : Array.isArray(entry?.entities)
                    ? entry.entities
                    : [];
            const items = repEntities.map((entity) => ({
                ...entity,
                report: reportName
            }));
            let latestModified = null;
            for (const item of items) {
                const candidate = typeof item?.modified === 'string' ? item.modified : null;
                if (candidate && (!latestModified || Date.parse(candidate) > Date.parse(latestModified))) {
                    latestModified = candidate;
                }
            }
            const rawModified = typeof rawReport?.modified === 'string'
                ? rawReport.modified
                : (typeof entry?.modified === 'string' ? entry.modified : null);
            const mergedModified = latestModified ?? rawModified;
            const sourceName = typeof rawReport?.sourceName === 'string'
                ? rawReport.sourceName
                : (typeof entry?.sourceName === 'string' ? entry.sourceName : null);
            const sourceLink = typeof rawReport?.sourceLink === 'string'
                ? rawReport.sourceLink
                : (typeof entry?.sourceLink === 'string' ? entry.sourceLink : null);
            const intelligenceModule = typeof rawReport?.intelligenceModule === 'string'
                ? rawReport.intelligenceModule
                : (typeof entry?.intelligenceModule === 'string' ? entry.intelligenceModule : null);
            const description = typeof rawReport?.description === 'string'
                ? rawReport.description
                : (typeof entry?.description === 'string' ? entry.description : null);
            if (!current) {
                grouped.set(reportKey, {
                    report: reportName,
                    items,
                    modified: mergedModified,
                    sourceName,
                    sourceLink,
                    intelligenceModule,
                    description
                });
                return;
            }
            const seen = new Set((current.items ?? []).map(item => [
                (item?.type ?? '').toString().toLowerCase(),
                (item?.name ?? '').toString().toLowerCase(),
                (item?.value ?? '').toString().toLowerCase(),
                (item?.pattern ?? '').toString().toLowerCase(),
                (item?.relationshipType ?? '').toString().toLowerCase()
            ].join('|')));
            for (const item of items) {
                const key = [
                    (item?.type ?? '').toString().toLowerCase(),
                    (item?.name ?? '').toString().toLowerCase(),
                    (item?.value ?? '').toString().toLowerCase(),
                    (item?.pattern ?? '').toString().toLowerCase(),
                    (item?.relationshipType ?? '').toString().toLowerCase()
                ].join('|');
                if (!seen.has(key)) {
                    seen.add(key);
                    current.items.push(item);
                }
            }
            if (mergedModified && (!current.modified || Date.parse(mergedModified) > Date.parse(current.modified))) {
                current.modified = mergedModified;
            }
            if (!current.sourceName && sourceName) {
                current.sourceName = sourceName;
            }
            if (!current.sourceLink && sourceLink) {
                current.sourceLink = sourceLink;
            }
            if (!current.intelligenceModule && intelligenceModule) {
                current.intelligenceModule = intelligenceModule;
            }
            if (!current.description && description) {
                current.description = description;
            }
        };
        for (const entry of entries) {
            const reports = Array.isArray(entry?.nodes_vertex_collection) ? entry.nodes_vertex_collection : [];
            if (reports.length) {
                for (const report of reports) {
                    upsertGroup(report, entry);
                }
            }
            else {
                upsertGroup(null, entry);
            }
        }
        return Array.from(grouped.values()).sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            return tsB - tsA || a.report.localeCompare(b.report);
        });
    }
    sanitizeReportName(value) {
        if (typeof value !== 'string') {
            return 'Unknown Report';
        }
        return value.replace(/^Article(?:\s*[:\-])?\s*/i, '').trim() || 'Unknown Report';
    }
    initializeDateFilter() {
        const now = new Date();
        const max = this.startOfDayUtc(now);
        const sixMonthsAgo = new Date(max);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const min = this.startOfDayUtc(sixMonthsAgo);
        const tentativeStart = this.startOfDayUtc(new Date(max.getTime() - this.dayMs));
        const start = tentativeStart.getTime() < min.getTime() ? min : tentativeStart;
        this.dateFilterMin = min;
        this.dateFilterMax = max;
        this.dateFilterRange = { start, end: max };
    }
    updateGlobeForSelection() {
        if (!this.globeComp) {
            return;
        }
        const dataset = Array.isArray(this.latestLocations) ? [...this.latestLocations] : [];
        if (!dataset.length && this.selectedCountryGroups.length) {
            dataset.push({
                location: null,
                locationName: 'Query Results',
                locationCode: null,
                report: this.selectedCountryReport ?? null,
                nodes_vertex_collection: this.buildNodesFromGroups(this.selectedCountryGroups),
                entities: this.selectedCountryIocs,
                highlightIocs: this.selectedCountryIocs.slice(0, 12),
                iocs: this.selectedCountryIocs.slice(0, 12)
            });
        }
        this.globeComp.updateLocationIocs(dataset);
    }
    buildNodesFromGroups(groups) {
        if (!Array.isArray(groups) || !groups.length) {
            return [];
        }
        return groups.map(group => ({
            id: null,
            name: group.report,
            modified: group.modified ?? null,
            sourceName: group.sourceName ?? null,
            sourceLink: group.sourceLink ?? null,
            intelligenceModule: group.intelligenceModule ?? null,
            entities: Array.isArray(group.items)
                ? group.items.map(item => ({
                    type: item?.type ?? null,
                    name: item?.primary ?? null,
                    value: item?.secondary ?? null,
                    pattern: item?.pattern ?? null,
                    modified: item?.modified ?? null,
                    report: group.report,
                    source_name: group.sourceName ?? null,
                    source_link: group.sourceLink ?? null
                }))
                : []
        }));
    }
    buildEntityGroupsFromEntities(entities) {
        if (!Array.isArray(entities) || entities.length === 0) {
            return [];
        }
        const titleCase = (value) => value
            ?.split(/[^a-z0-9]+/gi)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') || DEFAULT_ENTITY_PRESENTATION.label;
        const groups = new Map();
        entities.forEach(entity => {
            const rawType = (entity?.type || 'other').toString().trim().toLowerCase() || 'other';
            const presentation = EXPLORER_ENTITY_PRESENTATION[rawType] ?? {
                label: titleCase(rawType),
                icon: 'hub',
                accent: 'accent-generic',
                order: 99
            };
            if (!groups.has(rawType)) {
                groups.set(rawType, {
                    label: presentation.label,
                    icon: presentation.icon,
                    accent: presentation.accent,
                    items: [],
                    order: presentation.order
                });
            }
            const target = groups.get(rawType);
            const primary = (entity?.name || entity?.value || entity?.pattern || 'Unnamed entity').toString().trim() || 'Unnamed entity';
            const secondaryCandidate = entity?.pattern || entity?.value;
            const secondary = secondaryCandidate && secondaryCandidate !== primary ? secondaryCandidate : undefined;
            target.items.push({
                primary,
                secondary,
                report: entity?.report ?? undefined,
                modified: entity?.modified ?? undefined,
                type: entity?.type ?? undefined,
                raw: entity
            });
        });
        return Array.from(groups.values())
            .map(group => ({
            label: group.label,
            icon: group.icon,
            accent: group.accent,
            order: group.order,
            items: group.items.sort((a, b) => {
                const tsA = a.modified ? Date.parse(a.modified) : 0;
                const tsB = b.modified ? Date.parse(b.modified) : 0;
                if (tsA === tsB) {
                    return a.primary.localeCompare(b.primary);
                }
                return tsB - tsA;
            })
        }))
            .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
            .map(({ order, ...rest }) => rest);
    }
    buildReportInsightsGroup(groups, entities = []) {
        const items = [];
        for (const group of Array.isArray(groups) ? groups : []) {
            const primary = (group?.report || '').toString().trim();
            if (!primary) {
                continue;
            }
            const sourceName = (group?.sourceName || '').toString().trim();
            const sourceLink = (group?.sourceLink || '').toString().trim();
            const module = (group?.intelligenceModule || '').toString().trim();
            const reportEntities = Array.isArray(group?.items) ? group.items : [];
            const entityTypeCountsMap = new Map();
            const relationshipTypeCountsMap = new Map();
            const uniqueEntityKeys = new Set();
            let iocCount = 0;
            for (const entity of reportEntities) {
                const entityType = (entity?.type || '').toString().trim().toLowerCase();
                if (entityType) {
                    entityTypeCountsMap.set(entityType, (entityTypeCountsMap.get(entityType) ?? 0) + 1);
                }
                const relationshipType = (entity?.relationshipType || '').toString().trim().toLowerCase();
                if (relationshipType) {
                    relationshipTypeCountsMap.set(relationshipType, (relationshipTypeCountsMap.get(relationshipType) ?? 0) + 1);
                }
                const dedupeKey = [
                    entityType,
                    (entity?.name || '').toString().trim().toLowerCase(),
                    (entity?.value || '').toString().trim().toLowerCase(),
                    (entity?.pattern || '').toString().trim().toLowerCase()
                ].join('|');
                uniqueEntityKeys.add(dedupeKey);
                if (['indicator', 'domain-name', 'url', 'ipv4-addr', 'ipv6-addr', 'file', 'email-addr', 'windows-registry-key', 'phone-number'].includes(entityType)) {
                    iocCount += 1;
                }
            }
            const entityTypeCounts = Array.from(entityTypeCountsMap.entries())
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .map(([type, count]) => ({ type, count }));
            const relationshipTypeCounts = Array.from(relationshipTypeCountsMap.entries())
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .map(([relationshipType, count]) => ({ relationshipType, count }));
            items.push({
                primary,
                secondary: module ? `Module: ${module}` : undefined,
                report: sourceName || undefined,
                modified: group?.modified || undefined,
                type: 'report',
                raw: {
                    type: 'report',
                    name: primary,
                    sourceName: sourceName || null,
                    sourceLink: sourceLink || null,
                    intelligenceModule: module || null,
                    modified: group?.modified || null,
                    description: group?.description || null,
                    totalEntities: reportEntities.length,
                    uniqueEntities: uniqueEntityKeys.size,
                    iocCount,
                    relationshipCount: entityTypeCountsMap.get('relationship') ?? 0,
                    entityTypeCounts,
                    relationshipTypeCounts
                }
            });
        }
        items.sort((a, b) => {
            const tsA = a.modified ? Date.parse(a.modified) : 0;
            const tsB = b.modified ? Date.parse(b.modified) : 0;
            return tsB - tsA || a.primary.localeCompare(b.primary);
        });
        if (!items.length && Array.isArray(entities) && entities.length) {
            const byReport = new Map();
            for (const entity of entities) {
                const reportName = this.sanitizeReportName((entity?.report || '').toString().trim() || 'Unknown Report');
                const modified = typeof entity?.modified === 'string' ? entity.modified : null;
                const existing = byReport.get(reportName);
                if (!existing) {
                    byReport.set(reportName, { modified });
                    continue;
                }
                if (modified && (!existing.modified || Date.parse(modified) > Date.parse(existing.modified))) {
                    existing.modified = modified;
                }
            }
            for (const [primary, meta] of byReport.entries()) {
                items.push({
                    primary,
                    secondary: undefined,
                    report: undefined,
                    modified: meta.modified ?? undefined,
                    type: 'report',
                    raw: {
                        type: 'report',
                        name: primary,
                        sourceName: null,
                        sourceLink: null,
                        intelligenceModule: null,
                        modified: meta.modified ?? null
                    }
                });
            }
            items.sort((a, b) => {
                const tsA = a.modified ? Date.parse(a.modified) : 0;
                const tsB = b.modified ? Date.parse(b.modified) : 0;
                return tsB - tsA || a.primary.localeCompare(b.primary);
            });
        }
        if (!items.length) {
            return null;
        }
        return {
            label: 'Reports',
            icon: 'description',
            accent: 'accent-report',
            isFeature: true,
            items
        };
    }
    rebuildQueryGraphFromGroups(groups) {
        this.rememberCurrentGraphPositions();
        if (!Array.isArray(groups) || !groups.length) {
            this.queryGraphNodes = [];
            this.queryGraphLinks = [];
            this.graphDisplayNodes = [];
            this.graphDisplayLinks = [];
            this.queryGraphReportTotal = 0;
            return;
        }
        const nodeById = new Map();
        const reportGroupNodes = [];
        const reportNodes = [];
        const typeNodes = [];
        const entityNodes = [];
        const linkKeys = new Set();
        const links = [];
        const reportCounts = new Map();
        const typeCounts = new Map();
        const entityCounts = new Map();
        const seenReportIds = new Set();
        for (const group of groups) {
            const reportName = (group?.report || 'Unknown Report').trim() || 'Unknown Report';
            seenReportIds.add(`report:${reportName.toLowerCase()}`);
        }
        this.queryGraphReportTotal = seenReportIds.size;
        const reportGroupNode = this.ensureGraphNode(nodeById, reportGroupNodes, {
            id: 'report-group:all',
            label: 'Reports',
            type: 'report',
            kind: 'report-group',
            count: this.queryGraphReportTotal,
            size: 18,
            x: 0,
            y: 0
        });
        // When reports are collapsed, we use a single source (report-group) to avoid
        // duplicating report->type edges.
        const typeSeenForCollapsedReports = new Set();
        for (const group of groups) {
            const reportName = (group?.report || 'Unknown Report').trim() || 'Unknown Report';
            const reportId = `report:${reportName.toLowerCase()}`;
            const reportNode = this.reportsGraphExpanded
                ? this.ensureGraphNode(nodeById, reportNodes, {
                    id: reportId,
                    label: reportName,
                    type: 'report',
                    kind: 'report',
                    raw: {
                        report: reportName,
                        modified: group?.modified ?? null,
                        sourceName: group?.sourceName ?? null,
                        sourceLink: group?.sourceLink ?? null,
                        entityCount: Array.isArray(group?.items) ? group.items.length : 0
                    },
                    size: 16,
                    x: 0,
                    y: 0
                })
                : null;
            if (reportNode) {
                const raw = (reportNode.raw ?? {});
                if (!raw.modified && group?.modified) {
                    raw.modified = group.modified;
                }
                if (!raw.sourceName && group?.sourceName) {
                    raw.sourceName = group.sourceName;
                }
                if (!raw.sourceLink && group?.sourceLink) {
                    raw.sourceLink = group.sourceLink;
                }
                raw.entityCount = (raw.entityCount ?? 0) + (Array.isArray(group?.items) ? group.items.length : 0);
                reportNode.raw = raw;
            }
            const reportNodeForEdges = reportNode ?? reportGroupNode;
            if (reportNode) {
                const groupToReportKey = `${reportGroupNode.id}->${reportNode.id}->contains_report`;
                if (!linkKeys.has(groupToReportKey)) {
                    linkKeys.add(groupToReportKey);
                    links.push({ source: reportGroupNode, target: reportNode, relationshipType: 'contains_report' });
                }
            }
            const typeSeenForReport = this.reportsGraphExpanded ? new Set() : typeSeenForCollapsedReports;
            const items = Array.isArray(group?.items) ? group.items : [];
            for (const item of items) {
                const itemType = (item?.type || 'entity').toString().trim().toLowerCase() || 'entity';
                const typeNodeId = `type-group:${itemType}`;
                const typeNode = this.ensureGraphNode(nodeById, typeNodes, {
                    id: typeNodeId,
                    label: this.getReadableTypeLabel(itemType),
                    type: itemType,
                    kind: 'type-group',
                    size: 14,
                    count: 0,
                    x: 0,
                    y: 0
                });
                typeNode.count = (typeNode.count ?? 0) + 1;
                if (!typeSeenForReport.has(typeNodeId)) {
                    typeSeenForReport.add(typeNodeId);
                    reportCounts.set(reportNodeForEdges.id, (reportCounts.get(reportNodeForEdges.id) ?? 0) + 1);
                    typeCounts.set(typeNode.id, (typeCounts.get(typeNode.id) ?? 0) + 1);
                    const reportToTypeKey = `${reportNodeForEdges.id}->${typeNode.id}->has_type_group`;
                    if (!linkKeys.has(reportToTypeKey)) {
                        linkKeys.add(reportToTypeKey);
                        links.push({ source: reportNodeForEdges, target: typeNode, relationshipType: 'has_type_group' });
                    }
                }
                const entityLabel = (item?.primary || item?.secondary || item?.value || item?.name || 'Unnamed entity').toString().trim() || 'Unnamed entity';
                const entityId = `${itemType}:${entityLabel.toLowerCase()}`;
                const isPinnedEntity = this.pinnedGraphNodeIds.includes(entityId);
                const shouldRenderEntity = this.isGraphTypeExpanded(itemType) || isPinnedEntity;
                if (!shouldRenderEntity) {
                    continue;
                }
                const entityNode = this.ensureGraphNode(nodeById, entityNodes, {
                    id: entityId,
                    label: entityLabel,
                    type: itemType,
                    kind: 'entity',
                    parentTypeId: typeNode.id,
                    raw: item,
                    size: 10,
                    x: 0,
                    y: 0
                });
                typeCounts.set(typeNode.id, (typeCounts.get(typeNode.id) ?? 0) + 1);
                entityCounts.set(entityNode.id, (entityCounts.get(entityNode.id) ?? 0) + 1);
                const relationshipType = this.normalizeRelationshipType(item?.relationshipType || item?.relationship_type);
                const linkKey = `${typeNode.id}->${entityNode.id}->${relationshipType}`;
                if (!linkKeys.has(linkKey)) {
                    linkKeys.add(linkKey);
                    links.push({ source: typeNode, target: entityNode, relationshipType });
                }
                // Keep provenance visible: expanded entities also connect to their source report.
                const reportEntityKey = `${reportNodeForEdges.id}->${entityNode.id}->source_report`;
                if (!linkKeys.has(reportEntityKey)) {
                    linkKeys.add(reportEntityKey);
                    links.push({ source: reportNodeForEdges, target: entityNode, relationshipType: 'source_report' });
                }
            }
        }
        reportGroupNode.count = this.queryGraphReportTotal;
        reportGroupNode.size = Math.min(24, 14 + Math.log2((reportGroupNode.count ?? 0) + 1) * 2.4);
        reportNodes.forEach(node => {
            const degree = reportCounts.get(node.id) ?? 0;
            node.size = Math.min(18, 8 + Math.log2(degree + 1) * 2.2);
        });
        typeNodes.forEach(node => {
            const degree = typeCounts.get(node.id) ?? 0;
            node.size = Math.min(22, 10 + Math.log2(degree + 1) * 2.2);
        });
        entityNodes.forEach(node => {
            const degree = entityCounts.get(node.id) ?? 0;
            node.size = Math.min(20, 7 + Math.log2(degree + 1) * 2.4);
        });
        this.positionNodesRadially(reportGroupNode, reportNodes, typeNodes, entityNodes);
        const nextNodes = [reportGroupNode, ...reportNodes, ...typeNodes, ...entityNodes];
        this.restoreGraphPositions(nextNodes);
        this.queryGraphNodes = nextNodes;
        this.queryGraphLinks = links;
        this.refreshGraphDisplay();
        const targetSelectionId = this.graphSelectionToRestoreId ?? this.selectedGraphNode?.id ?? null;
        if (targetSelectionId) {
            this.selectedGraphNode = this.queryGraphNodes.find(node => node.id === targetSelectionId) ?? null;
            if (!this.selectedGraphNode) {
                this.selectedGraphLink = null;
            }
        }
        this.graphSelectionToRestoreId = null;
    }
    refreshGraphDisplay() {
        const focusIds = Array.isArray(this.focusedGraphNodeIds) ? this.focusedGraphNodeIds : [];
        const pinIds = Array.isArray(this.pinnedGraphNodeIds) ? this.pinnedGraphNodeIds : [];
        // Drop stale pins when nodes disappear after query changes.
        this.pinnedGraphNodeIds = pinIds.filter(id => this.queryGraphNodes.some(node => node.id === id));
        if (!focusIds.length) {
            this.graphDisplayNodes = this.queryGraphNodes;
            this.graphDisplayLinks = this.queryGraphLinks;
            return;
        }
        // Focus view = union of focused nodes + their 1-hop neighbors (both directions).
        const allowedNodeIds = new Set();
        const allowedLinkKeys = new Set();
        for (const focusId of focusIds) {
            const focusNode = this.queryGraphNodes.find(node => node.id === focusId);
            if (!focusNode) {
                continue;
            }
            allowedNodeIds.add(focusNode.id);
            for (const link of this.queryGraphLinks) {
                if (link.source.id === focusNode.id || link.target.id === focusNode.id) {
                    allowedNodeIds.add(link.source.id);
                    allowedNodeIds.add(link.target.id);
                    allowedLinkKeys.add(`${link.source.id}->${link.target.id}->${link.relationshipType}`);
                }
            }
        }
        // Pinned nodes must never be hidden by focus mode.
        for (const pinId of this.pinnedGraphNodeIds) {
            const pinNode = this.queryGraphNodes.find(node => node.id === pinId);
            if (!pinNode) {
                continue;
            }
            allowedNodeIds.add(pinNode.id);
            for (const link of this.queryGraphLinks) {
                if (link.source.id === pinNode.id || link.target.id === pinNode.id) {
                    allowedNodeIds.add(link.source.id);
                    allowedNodeIds.add(link.target.id);
                    allowedLinkKeys.add(`${link.source.id}->${link.target.id}->${link.relationshipType}`);
                }
            }
        }
        // If focus points disappeared (e.g. query changed), drop them.
        this.focusedGraphNodeIds = focusIds.filter(id => this.queryGraphNodes.some(node => node.id === id));
        const displayNodes = this.queryGraphNodes.filter(node => allowedNodeIds.has(node.id));
        const displayNodeIds = new Set(displayNodes.map(node => node.id));
        const displayLinks = this.queryGraphLinks.filter(link => {
            if (!displayNodeIds.has(link.source.id) || !displayNodeIds.has(link.target.id)) {
                return false;
            }
            const key = `${link.source.id}->${link.target.id}->${link.relationshipType}`;
            return allowedLinkKeys.has(key);
        });
        this.graphDisplayNodes = displayNodes;
        this.graphDisplayLinks = displayLinks;
        if (this.selectedGraphNode && !displayNodeIds.has(this.selectedGraphNode.id)) {
            this.selectedGraphNode = null;
            this.selectedGraphLink = null;
        }
    }
    isGraphGroupNode(node) {
        return node.kind === 'type-group' || node.kind === 'report-group';
    }
    isGraphNodeFocused(node) {
        return this.focusedGraphNodeIds.includes(node.id);
    }
    isGraphNodePinned(node) {
        return this.pinnedGraphNodeIds.includes(node.id);
    }
    hasGraphFocusActive() {
        return this.focusedGraphNodeIds.length > 0;
    }
    getGraphNodeActionOffsetY(node) {
        if (this.isGraphGroupNode(node)) {
            return this.getGraphTypeNodeY(node) - 16;
        }
        return 0;
    }
    getGraphGroupActionOffsetY(node) {
        return this.getGraphTypeNodeY(node) - 16;
    }
    getGraphNodeFocusActionTransform(node) {
        if (this.isGraphGroupNode(node)) {
            return 'translate(14, 0)';
        }
        return `translate(${node.size + 16}, 0)`;
    }
    canToggleSelectedGraphNodeFocus() {
        return !!this.selectedGraphNode && this.selectedGraphNode.kind === 'entity';
    }
    isSelectedGraphNodeFocused() {
        return !!this.selectedGraphNode && this.isGraphNodeFocused(this.selectedGraphNode);
    }
    canToggleSelectedGraphNodePin() {
        return !!this.selectedGraphNode;
    }
    isSelectedGraphNodePinned() {
        return !!this.selectedGraphNode && this.isGraphNodePinned(this.selectedGraphNode);
    }
    zoomGraphIn(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.zoomGraphAt(1.15);
    }
    zoomGraphOut(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.zoomGraphAt(1 / 1.15);
    }
    resetGraphViewport(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.graphZoom = 1;
        this.graphPanX = 0;
        this.graphPanY = 0;
    }
    rememberCurrentGraphPositions() {
        for (const node of this.queryGraphNodes) {
            this.graphNodePositions.set(node.id, { x: node.x, y: node.y });
        }
    }
    restoreGraphPositions(nodes) {
        for (const node of nodes) {
            const persisted = this.graphNodePositions.get(node.id);
            if (!persisted) {
                continue;
            }
            node.x = persisted.x;
            node.y = persisted.y;
        }
    }
    ensureGraphNode(index, target, node) {
        const existing = index.get(node.id);
        if (existing) {
            return existing;
        }
        index.set(node.id, node);
        target.push(node);
        return node;
    }
    positionNodesRadially(reportGroupNode, reportNodes, typeNodes, entityNodes) {
        const centerX = this.graphWidth / 2;
        const centerY = this.graphHeight / 2;
        reportGroupNode.x = centerX;
        reportGroupNode.y = centerY;
        const hasReportNodes = reportNodes.length > 0;
        const reportRadius = hasReportNodes ? Math.max(70, Math.min(120, 84 + reportNodes.length * 4)) : 0;
        const typeRadius = hasReportNodes
            ? Math.max(200, Math.min(285, 230 + reportNodes.length * 5))
            : Math.max(170, Math.min(255, 210 + reportNodes.length * 5));
        reportNodes.forEach((node, index) => {
            const angle = (Math.PI * 2 * index) / Math.max(reportNodes.length, 1) - Math.PI / 2;
            node.x = reportGroupNode.x + Math.cos(angle) * reportRadius;
            node.y = reportGroupNode.y + Math.sin(angle) * reportRadius;
        });
        typeNodes.forEach((node, index) => {
            const angle = (Math.PI * 2 * index) / Math.max(typeNodes.length, 1) - Math.PI / 2;
            node.x = reportGroupNode.x + Math.cos(angle) * typeRadius;
            node.y = reportGroupNode.y + Math.sin(angle) * typeRadius;
        });
        const entitiesByType = new Map();
        entityNodes.forEach(node => {
            const parentId = node.parentTypeId ?? '';
            if (!entitiesByType.has(parentId)) {
                entitiesByType.set(parentId, []);
            }
            entitiesByType.get(parentId).push(node);
        });
        typeNodes.forEach((typeNode, typeIndex) => {
            const children = entitiesByType.get(typeNode.id) ?? [];
            const baseAngle = (Math.PI * 2 * typeIndex) / Math.max(typeNodes.length, 1) - Math.PI / 2;
            const ringGap = 52;
            const firstRingRadius = 150;
            const baseSlots = 8;
            const maxSlots = 18;
            let placed = 0;
            let ring = 0;
            while (placed < children.length) {
                const ringRadius = firstRingRadius + ring * ringGap;
                const ringSlots = Math.min(maxSlots, baseSlots + ring * 6);
                const remaining = children.length - placed;
                const countInRing = Math.min(ringSlots, remaining);
                const step = (Math.PI * 2) / countInRing;
                const ringRotation = ring % 2 === 0 ? 0 : step / 2;
                for (let i = 0; i < countInRing; i++) {
                    const child = children[placed + i];
                    const angle = baseAngle + ringRotation + (i * step);
                    child.x = typeNode.x + Math.cos(angle) * ringRadius;
                    child.y = typeNode.y + Math.sin(angle) * ringRadius;
                }
                placed += countInRing;
                ring += 1;
            }
        });
    }
    getGraphNodeColor(type) {
        if (type === 'report') {
            return '#c4b5fd';
        }
        return '#a78bfa';
    }
    getGraphLinkColor(type) {
        if (type === 'source_report') {
            return 'rgba(196, 181, 253, 0.62)';
        }
        return '#b794f4';
    }
    getGraphLinkDasharray(type) {
        if (type === 'source_report') {
            return '2 4';
        }
        if (type === 'indicates' || type === 'related_to') {
            return '0';
        }
        if (type === 'uses' || type === 'targets') {
            return '5 3';
        }
        return '2 5';
    }
    getGraphLinkLabelX(link) {
        return (link.source.x + link.target.x) / 2;
    }
    getGraphLinkLabelY(link) {
        return ((link.source.y + link.target.y) / 2) - 4;
    }
    getReadableTypeLabel(value) {
        return (value || '')
            .split(/[-_]/g)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }
    getGraphNodeLabel(node) {
        const label = node?.label ?? '';
        if (label.length <= 22) {
            return label;
        }
        return `${label.slice(0, 19)}...`;
    }
    getGraphNodeTypeLabel(node) {
        if (node.kind === 'report') {
            return 'Report';
        }
        if (node.kind === 'report-group') {
            return 'Reports';
        }
        if (node.kind === 'type-group') {
            return node.label;
        }
        return this.getReadableTypeLabel(node?.type || 'entity');
    }
    getGraphNodeValueLabel(node) {
        if (node.kind === 'type-group') {
            const count = node.count ?? 0;
            return `${count} item${count === 1 ? '' : 's'}`;
        }
        if (node.kind === 'report-group') {
            const count = node.count ?? this.queryGraphReportTotal ?? 0;
            return `${count} report${count === 1 ? '' : 's'}`;
        }
        return this.getGraphNodeLabel(node);
    }
    getGraphNodeFillOpacity(node) {
        if (node.kind === 'report') {
            return 0.16;
        }
        if (node.kind === 'report-group') {
            return 0.18;
        }
        if (node.kind === 'type-group') {
            return 0.24;
        }
        return 0.22;
    }
    isGraphTypeExpanded(type) {
        const normalized = String(type || '').trim().toLowerCase();
        return this.expandedGraphTypes.includes(normalized);
    }
    toggleGraphType(type) {
        const normalized = String(type || '').trim().toLowerCase();
        if (!normalized) {
            return;
        }
        if (this.isGraphTypeExpanded(normalized)) {
            this.expandedGraphTypes = this.expandedGraphTypes.filter(t => t !== normalized);
            const focusId = `type-group:${normalized}`;
            this.focusedGraphNodeIds = this.focusedGraphNodeIds.filter(id => id !== focusId);
        }
        else {
            this.expandedGraphTypes = [...this.expandedGraphTypes, normalized];
        }
        this.rebuildQueryGraphFromGroups(this.selectedCountryGroups);
    }
    getGraphTypeNodeWidth(node) {
        return Math.max(96, node.size * 5.6);
    }
    getGraphTypeNodeHeight(node) {
        return Math.max(44, node.size * 2.5);
    }
    getGraphTypeNodeX(node) {
        return -this.getGraphTypeNodeWidth(node) / 2;
    }
    getGraphTypeNodeY(node) {
        return -this.getGraphTypeNodeHeight(node) / 2;
    }
    getGraphTypeNodeRadius(node) {
        return Math.max(8, node.size * 0.7);
    }
    isGraphNodeSelected(node) {
        return !!this.selectedGraphNode && this.selectedGraphNode.id === node.id;
    }
    isGraphNodeDragging(node) {
        return !!this.dragState && this.dragState.node.id === node.id;
    }
    isGraphNodeInQuery(node) {
        if (node.kind === 'entity') {
            return this.isGraphEntityInQuery(node);
        }
        if (node.kind === 'type-group') {
            return this.currentGroups.some(group => group.nodeType === node.type && (group.clauses ?? []).length > 0);
        }
        if (node.kind === 'report') {
            return this.currentGroups.some(group => group.nodeType === 'report' && (group.clauses ?? []).length > 0);
        }
        if (node.kind === 'report-group') {
            return this.currentGroups.some(group => group.nodeType === 'report' && (group.clauses ?? []).length > 0);
        }
        return false;
    }
    isGraphLinkSelected(link) {
        return !!this.selectedGraphLink
            && this.selectedGraphLink.source.id === link.source.id
            && this.selectedGraphLink.target.id === link.target.id
            && this.selectedGraphLink.relationshipType === link.relationshipType;
    }
    onGraphNodeClick(node, event) {
        if (event) {
            event.stopPropagation();
        }
        if (this.suppressNextNodeClick) {
            this.suppressNextNodeClick = false;
            return;
        }
        if (node.kind === 'type-group') {
            this.toggleGraphType(node.type);
            const refreshedNode = this.queryGraphNodes.find(candidate => candidate.id === node.id);
            this.selectedGraphNode = refreshedNode ?? node;
            this.selectedGraphLink = null;
            return;
        }
        if (node.kind === 'report-group') {
            this.reportsGraphExpanded = !this.reportsGraphExpanded;
            this.rebuildQueryGraphFromGroups(this.selectedCountryGroups);
            const refreshedNode = this.queryGraphNodes.find(candidate => candidate.id === node.id);
            this.selectedGraphNode = refreshedNode ?? node;
            this.selectedGraphLink = null;
            return;
        }
        this.selectedGraphNode = node;
        this.selectedGraphLink = null;
    }
    onGraphGroupExpand(node, event) {
        event.stopPropagation();
        this.onGraphNodeClick(node);
    }
    onGraphGroupFocus(node, event) {
        event.stopPropagation();
        this.toggleGraphNodeFocus(node, { expandIfGroup: true });
    }
    onGraphNodeFocus(node, event) {
        event.stopPropagation();
        this.toggleGraphNodeFocus(node, { expandIfGroup: true });
    }
    toggleGraphNodeFocus(node, opts) {
        const expandIfGroup = opts?.expandIfGroup ?? false;
        if (this.isGraphNodeFocused(node)) {
            this.focusedGraphNodeIds = this.focusedGraphNodeIds.filter(id => id !== node.id);
            this.refreshGraphDisplay();
            return;
        }
        this.focusedGraphNodeIds = [...this.focusedGraphNodeIds, node.id];
        this.selectedGraphNode = node;
        this.selectedGraphLink = null;
        if (expandIfGroup) {
            if (node.kind === 'type-group' && !this.isGraphTypeExpanded(node.type)) {
                // Focus implies expand.
                this.expandedGraphTypes = [...this.expandedGraphTypes, String(node.type || '').trim().toLowerCase()].filter(Boolean);
                this.rebuildQueryGraphFromGroups(this.selectedCountryGroups);
                return;
            }
            if (node.kind === 'report-group' && !this.reportsGraphExpanded) {
                this.reportsGraphExpanded = true;
                this.rebuildQueryGraphFromGroups(this.selectedCountryGroups);
                return;
            }
        }
        this.refreshGraphDisplay();
    }
    onGraphLinkClick(link, event) {
        if (event) {
            event.stopPropagation();
        }
        this.selectedGraphLink = link;
        this.selectedGraphNode = null;
    }
    clearGraphSelection(event) {
        if (this.suppressNextBackgroundClick) {
            if (event) {
                event.stopPropagation();
            }
            this.suppressNextBackgroundClick = false;
            return;
        }
        this.selectedGraphNode = null;
        this.selectedGraphLink = null;
    }
    onToggleSelectedGraphNodeFocus(event) {
        event.stopPropagation();
        if (!this.selectedGraphNode || this.selectedGraphNode.kind !== 'entity') {
            return;
        }
        this.toggleGraphNodeFocus(this.selectedGraphNode, { expandIfGroup: false });
    }
    onToggleSelectedGraphNodePin(event) {
        event.stopPropagation();
        if (!this.selectedGraphNode) {
            return;
        }
        const nodeId = this.selectedGraphNode.id;
        if (this.pinnedGraphNodeIds.includes(nodeId)) {
            this.pinnedGraphNodeIds = this.pinnedGraphNodeIds.filter(id => id !== nodeId);
        }
        else {
            this.pinnedGraphNodeIds = [...this.pinnedGraphNodeIds, nodeId];
        }
        this.refreshGraphDisplay();
    }
    resetGraphLayout(event) {
        if (event) {
            event.stopPropagation();
        }
        this.expandedGraphTypes = [];
        this.reportsGraphExpanded = false;
        this.focusedGraphNodeIds = [];
        this.graphNodePositions.clear();
        this.resetGraphViewport();
        this.selectedGraphNode = null;
        this.selectedGraphLink = null;
        this.rebuildQueryGraphFromGroups(this.selectedCountryGroups);
    }
    canAddSelectedGraphNodeToQuery() {
        return !!this.selectedGraphNode && this.selectedGraphNode.kind === 'entity' && !this.hasSelectedGraphNodeClauseInQuery();
    }
    canRemoveSelectedGraphNodeFromQuery() {
        return !!this.selectedGraphNode && this.selectedGraphNode.kind === 'entity' && this.hasSelectedGraphNodeClauseInQuery();
    }
    getSelectedGraphNodeAddButtonY() {
        if (!this.selectedGraphNode) {
            return 0;
        }
        return this.selectedGraphNode.y - (this.selectedGraphNode.size + 24);
    }
    onAddSelectedGraphNodeToQuery(event) {
        event.stopPropagation();
        if (!this.selectedGraphNode || this.selectedGraphNode.kind !== 'entity') {
            return;
        }
        const node = this.selectedGraphNode;
        const raw = node.raw ?? {};
        this.graphSelectionToRestoreId = node.id;
        this.addClauseForIoc({
            groupLabel: this.getReadableTypeLabel(node.type),
            entity: {
                primary: node.label,
                secondary: raw?.value ?? raw?.pattern ?? undefined,
                type: node.type,
                raw: {
                    ...raw,
                    type: raw?.type ?? node.type,
                    name: raw?.name ?? node.label
                }
            }
        }, { clauseLogic: 'OR', joinWith: 'OR' });
    }
    onRemoveSelectedGraphNodeFromQuery(event) {
        event.stopPropagation();
        if (!this.selectedGraphNode || this.selectedGraphNode.kind !== 'entity') {
            return;
        }
        const node = this.selectedGraphNode;
        const raw = node.raw ?? {};
        const nodeType = (node.type || raw.type || 'indicator').toString().trim().toLowerCase();
        const { field, value } = this.determineClauseTarget(raw, {
            primary: node.label,
            secondary: raw?.value ?? raw?.pattern ?? undefined,
            type: node.type,
            raw
        });
        if (!nodeType || !field || !value) {
            return;
        }
        const normalizedValue = value.trim().toLowerCase();
        const groupsClone = this.currentGroups
            .map(group => ({
            ...group,
            clauses: [...(group.clauses ?? [])]
        }))
            .map(group => {
            if (group.nodeType !== nodeType) {
                return group;
            }
            return {
                ...group,
                clauses: (group.clauses ?? []).filter(clause => !(clause.field === field &&
                    (clause.operator || 'equals') === 'equals' &&
                    (clause.value || '').trim().toLowerCase() === normalizedValue))
            };
        })
            .filter(group => (group.clauses ?? []).length > 0 || group.id === ExplorerComponent_1.GLOBE_COUNTRY_FILTER_GROUP_ID);
        this.graphSelectionToRestoreId = node.id;
        this.applyGroupsAndRefresh(groupsClone);
    }
    onGraphNodePointerDown(node, event) {
        if (!this.graphSvgRef) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.dragState = {
            pointerId: event.pointerId,
            node,
            moved: false
        };
    }
    onGraphBackgroundPointerDown(event) {
        if (!this.graphSvgRef) {
            return;
        }
        if (event.target !== event.currentTarget) {
            return;
        }
        const point = this.toSvgPoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }
        event.preventDefault();
        this.panDragState = {
            pointerId: event.pointerId,
            lastClientX: event.clientX,
            lastClientY: event.clientY,
            moved: false
        };
    }
    onGraphPointerMove(event) {
        if (this.dragState && this.dragState.pointerId === event.pointerId) {
            const point = this.toSvgPoint(event.clientX, event.clientY);
            if (!point) {
                return;
            }
            const node = this.dragState.node;
            if (Math.abs(node.x - point.x) > 1 || Math.abs(node.y - point.y) > 1) {
                this.dragState.moved = true;
            }
            node.x = point.x;
            node.y = point.y;
            return;
        }
        if (this.panDragState && this.panDragState.pointerId === event.pointerId) {
            const svg = this.graphSvgRef?.nativeElement;
            if (!svg) {
                return;
            }
            const rect = svg.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return;
            }
            const clientDx = event.clientX - this.panDragState.lastClientX;
            const clientDy = event.clientY - this.panDragState.lastClientY;
            if (Math.abs(clientDx) > 0.3 || Math.abs(clientDy) > 0.3) {
                this.panDragState.moved = true;
            }
            const visibleWidth = this.graphWidth / this.graphZoom;
            const visibleHeight = this.graphHeight / this.graphZoom;
            const dxGraph = (clientDx / rect.width) * visibleWidth;
            const dyGraph = (clientDy / rect.height) * visibleHeight;
            this.graphPanX -= dxGraph;
            this.graphPanY -= dyGraph;
            this.panDragState.lastClientX = event.clientX;
            this.panDragState.lastClientY = event.clientY;
        }
    }
    onGraphPointerUp(event) {
        if (this.dragState && this.dragState.pointerId === event.pointerId) {
            if (this.dragState.moved) {
                this.graphNodePositions.set(this.dragState.node.id, {
                    x: this.dragState.node.x,
                    y: this.dragState.node.y
                });
            }
            this.suppressNextNodeClick = this.dragState.moved;
            this.dragState = null;
        }
        if (this.panDragState && this.panDragState.pointerId === event.pointerId) {
            this.suppressNextBackgroundClick = this.panDragState.moved;
            this.panDragState = null;
        }
    }
    onGraphWheel(event) {
        if (!this.graphSvgRef) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const zoomMultiplier = event.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.zoomGraphAt(zoomMultiplier, event.clientX, event.clientY);
    }
    zoomGraphAt(multiplier, clientX, clientY) {
        const previousZoom = this.graphZoom;
        const nextZoom = Math.max(0.45, Math.min(2.8, previousZoom * multiplier));
        if (Math.abs(nextZoom - previousZoom) < 0.0001) {
            return;
        }
        const oldVisibleWidth = this.graphWidth / previousZoom;
        const oldVisibleHeight = this.graphHeight / previousZoom;
        const newVisibleWidth = this.graphWidth / nextZoom;
        const newVisibleHeight = this.graphHeight / nextZoom;
        // Keep either the pointer position (wheel) or center (buttons) anchored during zoom.
        let anchorX = this.graphPanX + oldVisibleWidth / 2;
        let anchorY = this.graphPanY + oldVisibleHeight / 2;
        let tX = 0.5;
        let tY = 0.5;
        if (typeof clientX === 'number' && typeof clientY === 'number') {
            const anchor = this.toSvgPoint(clientX, clientY);
            if (anchor) {
                anchorX = anchor.x;
                anchorY = anchor.y;
                tX = (anchorX - this.graphPanX) / oldVisibleWidth;
                tY = (anchorY - this.graphPanY) / oldVisibleHeight;
            }
        }
        this.graphZoom = nextZoom;
        this.graphPanX = anchorX - (newVisibleWidth * tX);
        this.graphPanY = anchorY - (newVisibleHeight * tY);
    }
    toSvgPoint(clientX, clientY) {
        const svg = this.graphSvgRef?.nativeElement;
        if (!svg) {
            return null;
        }
        const point = svg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) {
            return null;
        }
        const transformed = point.matrixTransform(ctm.inverse());
        return {
            x: transformed.x,
            y: transformed.y
        };
    }
    getGraphNodeConnectionCount(node) {
        return this.queryGraphLinks.filter(link => link.source.id === node.id || link.target.id === node.id).length;
    }
    hasSelectedGraphNodeClauseInQuery() {
        if (!this.selectedGraphNode || this.selectedGraphNode.kind !== 'entity') {
            return false;
        }
        return this.isGraphEntityInQuery(this.selectedGraphNode);
    }
    isGraphEntityInQuery(node) {
        const raw = node.raw ?? {};
        const nodeType = (node.type || raw.type || 'indicator').toString().trim().toLowerCase();
        const { field, value } = this.determineClauseTarget(raw, {
            primary: node.label,
            secondary: raw?.value ?? raw?.pattern ?? undefined,
            type: node.type,
            raw
        });
        if (!nodeType || !field || !value) {
            return false;
        }
        const normalizedValue = value.trim().toLowerCase();
        const targetGroup = this.currentGroups.find(group => group.nodeType === nodeType);
        if (!targetGroup) {
            return false;
        }
        return (targetGroup.clauses ?? []).some(clause => clause.field === field &&
            (clause.operator || 'equals') === 'equals' &&
            (clause.value || '').trim().toLowerCase() === normalizedValue);
    }
    normalizeRelationshipType(value) {
        const normalized = String(value ?? '').trim().toLowerCase();
        if (!normalized) {
            return 'related_to';
        }
        return normalized;
    }
    normalizeQueryRange(dateRange) {
        const start = this.parseQueryDate(dateRange?.start);
        const end = this.parseQueryDate(dateRange?.end);
        if (!start || !end) {
            return null;
        }
        if (end.getTime() < start.getTime()) {
            return null;
        }
        return { start, end };
    }
    parseQueryDate(value) {
        if (!value) {
            return null;
        }
        const parsed = new Date(`${value}T00:00:00Z`);
        if (!Number.isFinite(parsed.getTime())) {
            return null;
        }
        return this.startOfDayUtc(parsed);
    }
    formatQueryDate(value) {
        if (!value) {
            return null;
        }
        return value.toISOString().slice(0, 10);
    }
    startOfDayUtc(date) {
        const copy = new Date(date);
        copy.setUTCHours(0, 0, 0, 0);
        return copy;
    }
    endOfDayUtc(date) {
        const copy = new Date(date);
        copy.setUTCHours(23, 59, 59, 0);
        return copy;
    }
    toAqlIso(date) {
        return date.toISOString().split('.')[0] + 'Z';
    }
    buildDateBounds(range) {
        const start = this.startOfDayUtc(range.start);
        const end = this.endOfDayUtc(range.end);
        return {
            startIso: this.toAqlIso(start),
            endIso: this.toAqlIso(end)
        };
    }
    isDynamicEndDateSelected(range) {
        const selectedEnd = this.startOfDayUtc(range.end).getTime();
        const maxEnd = this.startOfDayUtc(this.dateFilterMax).getTime();
        return selectedEnd >= maxEnd;
    }
    addClauseForIoc(detail, options) {
        const raw = detail.entity.raw ?? {};
        const nodeType = (detail.entity.type || raw.type || 'indicator').toString().trim().toLowerCase();
        const { field, value } = this.determineClauseTarget(raw, detail.entity);
        if (!nodeType || !field || !value) {
            return;
        }
        const groupsClone = this.currentGroups.map(group => ({
            ...group,
            clauses: [...(group.clauses ?? [])]
        }));
        let targetGroup = groupsClone.find(group => group.nodeType === nodeType);
        if (!targetGroup) {
            targetGroup = {
                id: `auto-${nodeType}-${Date.now()}`,
                nodeType,
                clauseLogic: options?.clauseLogic ?? 'AND',
                joinWith: options?.joinWith ?? 'AND',
                clauses: []
            };
            if (groupsClone.length) {
                groupsClone[groupsClone.length - 1] = {
                    ...groupsClone[groupsClone.length - 1],
                    joinWith: options?.joinWith ?? groupsClone[groupsClone.length - 1].joinWith ?? 'AND'
                };
            }
            groupsClone.push(targetGroup);
        }
        else if (options?.clauseLogic) {
            targetGroup.clauseLogic = options.clauseLogic;
        }
        targetGroup.clauses = targetGroup.clauses ?? [];
        const normalizedValue = value.trim();
        const hasClause = targetGroup.clauses.some(clause => clause.field === field &&
            (clause.operator || 'equals') === 'equals' &&
            clause.value?.toLowerCase() === normalizedValue.toLowerCase());
        if (!hasClause) {
            targetGroup.clauses.push({
                field,
                operator: 'equals',
                value: normalizedValue
            });
        }
        this.currentGroups = groupsClone;
        const dateRange = this.appliedQuery?.dateRange ?? {
            start: this.formatQueryDate(this.dateFilterRange.start),
            end: this.formatQueryDate(this.dateFilterRange.end)
        };
        const appliedGroups = this.currentGroups.map(group => ({
            ...group,
            clauses: [...(group.clauses ?? [])]
        }));
        this.appliedQuery = {
            preview: renderQueryPreview(appliedGroups, dateRange ?? { start: null, end: null }),
            groups: appliedGroups,
            dateRange
        };
        if (this.isBrowser && this.dateFilterRange) {
            this.runLatestLocationIocsQuery(this.dateFilterRange);
        }
    }
    determineClauseTarget(raw, entity) {
        const candidates = [
            { field: 'name', value: raw?.name },
            { field: 'value', value: raw?.value },
            { field: 'pattern', value: raw?.pattern },
            { field: 'value', value: entity.secondary },
            { field: 'name', value: entity.primary }
        ];
        for (const candidate of candidates) {
            if (candidate.value !== null && candidate.value !== undefined) {
                const valueStr = String(candidate.value).trim();
                if (valueStr.length) {
                    return { field: candidate.field, value: valueStr };
                }
            }
        }
        return { field: 'name', value: String(entity.primary ?? '').trim() };
    }
};
__decorate([
    ViewChild(InteractiveGlobeComponent)
], ExplorerComponent.prototype, "globeComp", void 0);
__decorate([
    ViewChild('graphSvg')
], ExplorerComponent.prototype, "graphSvgRef", void 0);
ExplorerComponent = ExplorerComponent_1 = __decorate([
    Component({
        selector: 'app-explorer',
        templateUrl: './explorer.component.html',
        styleUrls: ['./explorer.component.scss']
    }),
    __param(7, Inject(PLATFORM_ID))
], ExplorerComponent);
export { ExplorerComponent };
//# sourceMappingURL=explorer.component.js.map
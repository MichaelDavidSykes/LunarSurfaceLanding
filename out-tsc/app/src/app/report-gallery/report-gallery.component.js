import { __decorate, __param } from "tslib";
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
let ReportGalleryComponent = class ReportGalleryComponent {
    constructor(clientState, landingDataService, platformId) {
        this.clientState = clientState;
        this.landingDataService = landingDataService;
        this.subs = new Subscription();
        this.chartsLoaded = false;
        this.selectedClientId = null;
        this.isLoading = false;
        this.hasLoadedOnce = false;
        this.error = null;
        this.selectedRange = '30d';
        this.selectedInterval = 'day';
        this.customStartDate = '';
        this.customEndDate = '';
        this.statuses = {
            active: true,
            pending: true,
            resolved: true,
            dismissed: true
        };
        this.summary = {
            total_alerts: 0,
            active: 0,
            pending: 0,
            resolved: 0,
            dismissed: 0,
            total_matches: 0,
            total_reports: 0,
            total_iocs: 0,
            unique_queries: 0,
        };
        this.timeline = [];
        this.topQueries = [];
        this.topIocs = [];
        this.topLocations = [];
        this.topReports = [];
        this.topSources = [];
        this.recentAlerts = [];
        this.selectedRecentAlert = null;
        this.showLayoutModal = false;
        this.isExportingPdf = false;
        this.draggedSectionIndex = null;
        this.sectionOrder = [
            'summary',
            'timeline',
            'trends',
            'activity',
            'iocsLocations',
            'linkedIntel',
            'alertDetail'
        ];
        this.sectionLabels = {
            summary: 'Summary',
            timeline: 'Timeline',
            trends: 'Trend Charts',
            activity: 'Top Queries & Recent Alerts',
            iocsLocations: 'Top IOCs & Top Locations',
            linkedIntel: 'Linked Reports & Source Intelligence',
            alertDetail: 'Alert Detail'
        };
        this.queryFilters = { query: '', alerts: '', matches: '', updated: '' };
        this.recentFilters = { alert: '', status: '', triggered: '' };
        this.iocFilters = { value: '' };
        this.reportFilters = { report: '' };
        this.sourceFilters = { source: '' };
        this.queryTrendChartData = { labels: [], datasets: [] };
        this.iocTrendChartData = { labels: [], datasets: [] };
        this.locationTrendChartData = { labels: [], datasets: [] };
        this.trendChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#b6c0ea', maxRotation: 0, autoSkip: true },
                    grid: { color: 'rgba(130, 112, 210, 0.18)' },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#b6c0ea', precision: 0 },
                    grid: { color: 'rgba(130, 112, 210, 0.16)' },
                },
            },
            plugins: {
                legend: {
                    labels: { color: '#dfe6ff', usePointStyle: false, boxWidth: 26, boxHeight: 2 },
                },
            },
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 4,
                },
            },
        };
        this.rangeOptions = [
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '90d', label: '90D' },
            { id: 'custom', label: 'Custom' },
        ];
        this.intervalOptions = [
            { id: 'day', label: 'Daily' },
            { id: 'week', label: 'Weekly' },
            { id: 'month', label: 'Monthly' },
        ];
        this.isBrowser = isPlatformBrowser(platformId);
    }
    ngOnInit() {
        if (this.isBrowser) {
            this.loadGoogleCharts();
        }
        this.subs.add(this.clientState.selectedClientId$.subscribe(clientId => {
            this.selectedClientId = clientId;
            if (!clientId) {
                this.resetData();
                this.hasLoadedOnce = false;
                this.error = 'Select a client to load reporting analytics.';
                return;
            }
            this.error = null;
            this.fetchReporting();
        }));
    }
    ngOnDestroy() {
        this.subs.unsubscribe();
    }
    get hasData() {
        return this.summary.total_alerts > 0;
    }
    get selectedStatuses() {
        const all = Object.entries(this.statuses)
            .filter(([, enabled]) => enabled)
            .map(([status]) => status);
        return all.length ? all : ['active', 'pending', 'resolved', 'dismissed'];
    }
    get maxTimelineAlerts() {
        return Math.max(1, ...this.timeline.map(row => row.alerts));
    }
    get timelineRows() {
        const maxAlerts = this.maxTimelineAlerts;
        return this.timeline.map(row => ({
            ...row,
            barWidth: Math.max(4, Math.round((row.alerts / maxAlerts) * 100)),
        }));
    }
    selectRange(range) {
        this.selectedRange = range;
        if (range !== 'custom') {
            this.customStartDate = '';
            this.customEndDate = '';
            this.fetchReporting();
        }
    }
    onCustomRangeApply() {
        this.fetchReporting();
    }
    onIntervalChange(interval) {
        this.selectedInterval = interval;
        this.fetchReporting();
    }
    toggleStatus(status) {
        this.statuses[status] = !this.statuses[status];
        this.fetchReporting();
    }
    refresh() {
        this.fetchReporting();
    }
    openLayoutModal() {
        this.showLayoutModal = true;
    }
    closeLayoutModal() {
        this.showLayoutModal = false;
        this.draggedSectionIndex = null;
    }
    onSectionDragStart(index) {
        this.draggedSectionIndex = index;
    }
    onSectionDragOver(event) {
        event.preventDefault();
    }
    onSectionDrop(targetIndex) {
        if (this.draggedSectionIndex === null || this.draggedSectionIndex === targetIndex) {
            return;
        }
        const next = [...this.sectionOrder];
        const [moved] = next.splice(this.draggedSectionIndex, 1);
        next.splice(targetIndex, 0, moved);
        this.sectionOrder = next;
        this.draggedSectionIndex = null;
    }
    sectionVisible(sectionId) {
        if (sectionId === 'alertDetail') {
            return !!this.selectedRecentAlert;
        }
        return true;
    }
    sectionRank(sectionId) {
        const idx = this.sectionOrder.indexOf(sectionId);
        return idx === -1 ? 999 : idx;
    }
    async exportAsPdf() {
        if (!this.isBrowser) {
            return;
        }
        if (this.isExportingPdf) {
            return;
        }
        const reportRoot = document.querySelector('.reporting-page');
        if (!reportRoot) {
            return;
        }
        this.isExportingPdf = true;
        this.showLayoutModal = false;
        try {
            // Let modal close animation/render settle before capture.
            await new Promise(resolve => setTimeout(resolve, 180));
            const canvas = await html2canvas(reportRoot, {
                backgroundColor: '#01040c',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollY: -window.scrollY,
                logging: false,
            });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const imgData = canvas.toDataURL('image/png');
            const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));
            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                if (pageIndex > 0) {
                    pdf.addPage();
                }
                const yOffset = -pageIndex * pageHeight;
                pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight, undefined, 'FAST');
            }
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            pdf.save(`lunarsurface-report-${stamp}.pdf`);
        }
        catch (err) {
            console.error('[Reporting] PDF export failed', err);
        }
        finally {
            this.isExportingPdf = false;
        }
    }
    pickRecentAlert(alert) {
        this.selectedRecentAlert = alert;
    }
    formatDateTime(value) {
        if (!value) {
            return 'N/A';
        }
        const dt = new Date(value);
        if (!Number.isFinite(dt.getTime())) {
            return value;
        }
        return dt.toLocaleString();
    }
    textMatch(value, query) {
        const q = String(query || '').trim().toLowerCase();
        if (!q)
            return true;
        return String(value ?? '').toLowerCase().includes(q);
    }
    get filteredTopQueries() {
        return this.topQueries.filter(item => this.textMatch(item.saved_query_name, this.queryFilters.query));
    }
    get filteredRecentAlerts() {
        return this.recentAlerts.filter(item => this.textMatch(item.title, this.recentFilters.alert) &&
            this.textMatch(item.status, this.recentFilters.status) &&
            this.textMatch(this.formatDateTime(item.triggered_at), this.recentFilters.triggered));
    }
    get filteredTopIocs() {
        return this.topIocs.filter(item => this.textMatch(item.value, this.iocFilters.value));
    }
    get groupedTopIocs() {
        const groups = new Map();
        for (const item of this.filteredTopIocs) {
            const key = String(item.type || 'unknown').toLowerCase();
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        }
        return Array.from(groups.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .map(([type, items]) => ({ type, items }));
    }
    get groupedTopIocsLeft() {
        const groups = this.groupedTopIocs;
        const splitIndex = Math.ceil(groups.length / 2);
        return groups.slice(0, splitIndex);
    }
    get groupedTopIocsRight() {
        const groups = this.groupedTopIocs;
        const splitIndex = Math.ceil(groups.length / 2);
        return groups.slice(splitIndex);
    }
    get filteredTopReports() {
        return this.topReports.filter(item => this.textMatch(item.report, this.reportFilters.report));
    }
    get filteredTopSources() {
        return this.topSources.filter(item => this.textMatch(item.source_name, this.sourceFilters.source));
    }
    fetchReporting() {
        if (!this.selectedClientId) {
            return;
        }
        const range = this.buildDateRange();
        if (this.selectedRange === 'custom' && (!range.start || !range.end)) {
            this.error = 'Please select both custom start and end dates.';
            return;
        }
        this.isLoading = true;
        this.error = null;
        this.landingDataService.getAlertReportingAnalytics({
            client_id: this.selectedClientId,
            statuses: this.selectedStatuses,
            start_date: range.start,
            end_date: range.end,
            interval: this.selectedInterval,
            limit_recent: 100,
        }).subscribe({
            next: (data) => {
                const summary = data?.summary ?? {};
                this.summary = {
                    total_alerts: Number(summary.total_alerts ?? 0),
                    active: Number(summary.active ?? 0),
                    pending: Number(summary.pending ?? 0),
                    resolved: Number(summary.resolved ?? 0),
                    dismissed: Number(summary.dismissed ?? 0),
                    total_matches: Number(summary.total_matches ?? 0),
                    total_reports: Number(summary.total_reports ?? 0),
                    total_iocs: Number(summary.total_iocs ?? 0),
                    unique_queries: Number(summary.unique_queries ?? 0),
                };
                this.timeline = Array.isArray(data?.timeline) ? data.timeline : [];
                this.topQueries = Array.isArray(data?.top_queries) ? data.top_queries : [];
                this.topIocs = Array.isArray(data?.top_iocs) ? data.top_iocs : [];
                this.topLocations = Array.isArray(data?.top_locations) ? data.top_locations : [];
                this.topReports = Array.isArray(data?.top_reports) ? data.top_reports : [];
                this.topSources = Array.isArray(data?.top_sources) ? data.top_sources : [];
                this.recentAlerts = Array.isArray(data?.recent_alerts) ? data.recent_alerts : [];
                this.selectedRecentAlert = this.recentAlerts.length ? this.recentAlerts[0] : null;
                this.rebuildTrendCharts(data?.trend_series ?? {});
                this.drawTopLocationMap();
                this.isLoading = false;
                this.hasLoadedOnce = true;
            },
            error: (err) => {
                console.error('[Reporting] Failed to load analytics', err);
                this.error = 'Failed to load reporting analytics.';
                this.isLoading = false;
            }
        });
    }
    buildDateRange() {
        if (this.selectedRange === 'custom') {
            return {
                start: this.customStartDate ? new Date(`${this.customStartDate}T00:00:00`).toISOString() : undefined,
                end: this.customEndDate ? new Date(`${this.customEndDate}T23:59:59`).toISOString() : undefined,
            };
        }
        const now = new Date();
        const start = new Date(now);
        if (this.selectedRange === '7d') {
            start.setDate(start.getDate() - 6);
        }
        else if (this.selectedRange === '30d') {
            start.setDate(start.getDate() - 29);
        }
        else if (this.selectedRange === '90d') {
            start.setDate(start.getDate() - 89);
        }
        return {
            start: new Date(start.setHours(0, 0, 0, 0)).toISOString(),
            end: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
        };
    }
    resetData() {
        this.summary = {
            total_alerts: 0,
            active: 0,
            pending: 0,
            resolved: 0,
            dismissed: 0,
            total_matches: 0,
            total_reports: 0,
            total_iocs: 0,
            unique_queries: 0,
        };
        this.timeline = [];
        this.topQueries = [];
        this.topIocs = [];
        this.topLocations = [];
        this.topReports = [];
        this.topSources = [];
        this.recentAlerts = [];
        this.selectedRecentAlert = null;
        this.queryTrendChartData = { labels: [], datasets: [] };
        this.iocTrendChartData = { labels: [], datasets: [] };
        this.locationTrendChartData = { labels: [], datasets: [] };
    }
    rebuildTrendCharts(trendSeries) {
        this.queryTrendChartData = this.buildLineChartData(Array.isArray(trendSeries?.queries) ? trendSeries.queries : [], 'Top Queries');
        this.iocTrendChartData = this.buildLineChartData(Array.isArray(trendSeries?.iocs) ? trendSeries.iocs : [], 'Top IOCs');
        this.locationTrendChartData = this.buildLineChartData(Array.isArray(trendSeries?.locations) ? trendSeries.locations : [], 'Top Locations');
    }
    buildLineChartData(seriesList, fallbackLabel) {
        const labels = this.timeline.map(row => row.bucket);
        if (!seriesList.length || !labels.length) {
            return { labels: [], datasets: [] };
        }
        const palette = ['#b896ff', '#a97dff', '#9664f3', '#854be2', '#7438d2', '#652cc2'];
        const datasets = seriesList.slice(0, 6).map((series, idx) => {
            const byBucket = new Map();
            for (const point of (series.series || [])) {
                byBucket.set(point.bucket, Number(point.value || 0));
            }
            const color = palette[idx % palette.length];
            return {
                label: series.name || `${fallbackLabel} ${idx + 1}`,
                data: labels.map(bucket => byBucket.get(bucket) ?? 0),
                borderColor: color,
                backgroundColor: color,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
                tension: 0.28,
                fill: false,
            };
        });
        return { labels, datasets };
    }
    loadGoogleCharts() {
        if (!this.isBrowser) {
            return;
        }
        if (typeof google === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/charts/loader.js?loading=async';
            script.onload = () => {
                google.charts.load('current', { packages: ['geochart'] });
                google.charts.setOnLoadCallback(() => {
                    this.chartsLoaded = true;
                    this.drawTopLocationMap();
                });
            };
            document.head.appendChild(script);
            return;
        }
        google.charts.load('current', { packages: ['geochart'] });
        google.charts.setOnLoadCallback(() => {
            this.chartsLoaded = true;
            this.drawTopLocationMap();
        });
    }
    toMapRegionCode(loc) {
        const country = String(loc.country || '').trim();
        const name = String(loc.name || '').trim();
        if (/^[A-Za-z]{2,3}$/.test(country))
            return country.toUpperCase();
        if (/^[A-Za-z]{2,3}$/.test(name))
            return name.toUpperCase();
        return country || name;
    }
    toLocationDisplayName(loc) {
        const country = String(loc.country || '').trim();
        const name = String(loc.name || '').trim();
        const preferred = country || name;
        if (!preferred)
            return 'Unknown';
        if (/^[A-Za-z]{2}$/.test(preferred) && typeof Intl !== 'undefined' && Intl.DisplayNames) {
            try {
                const dn = new Intl.DisplayNames(['en'], { type: 'region' });
                return dn.of(preferred.toUpperCase()) || preferred.toUpperCase();
            }
            catch {
                return preferred.toUpperCase();
            }
        }
        return preferred;
    }
    drawTopLocationMap() {
        if (!this.isBrowser || !this.chartsLoaded || !Array.isArray(this.topLocations) || !this.topLocations.length) {
            return;
        }
        const container = document.getElementById('report_locations_map');
        if (!container) {
            setTimeout(() => this.drawTopLocationMap(), 80);
            return;
        }
        const rows = this.topLocations
            .slice(0, 10)
            .map(loc => ({
            code: this.toMapRegionCode(loc),
            mentions: Number(loc.count || 0),
            label: this.toLocationDisplayName(loc),
        }))
            .filter(row => Boolean(row.code) && Number.isFinite(row.mentions) && row.mentions > 0);
        if (!rows.length) {
            return;
        }
        const maxValue = Math.max(...rows.map(row => row.mentions), 1);
        const data = google.visualization.arrayToDataTable([
            ['Country', 'Mentions'],
            ...rows.map(row => [row.code, row.mentions]),
        ]);
        const chart = new google.visualization.GeoChart(container);
        chart.draw(data, {
            backgroundColor: 'transparent',
            colorAxis: {
                colors: ['#d8c3ff', '#a67cf0', '#7b4ad8'],
                minValue: 1,
                maxValue,
            },
            datalessRegionColor: '#272a3f',
            defaultColor: '#474d71',
            region: 'world',
            displayMode: 'regions',
            resolution: 'countries',
            legend: 'none',
            enableRegionInteractivity: true,
            tooltip: {
                trigger: 'none',
                textStyle: {
                    color: '#f4edff',
                    fontSize: 12,
                },
            },
        });
    }
};
ReportGalleryComponent = __decorate([
    Component({
        selector: 'app-report-gallery',
        templateUrl: './report-gallery.component.html',
        styleUrls: ['./report-gallery.component.scss']
    }),
    __param(2, Inject(PLATFORM_ID))
], ReportGalleryComponent);
export { ReportGalleryComponent };
//# sourceMappingURL=report-gallery.component.js.map
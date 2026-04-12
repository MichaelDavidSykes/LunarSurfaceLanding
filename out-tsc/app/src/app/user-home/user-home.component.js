import { __decorate, __param } from "tslib";
import { Component, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { ScaleType } from '@swimlane/ngx-charts';
import { environment } from '../../environments/environment';
Chart.register(...registerables);
let UserHomeComponent = class UserHomeComponent {
    constructor(dataService, platformId, clientStateService) {
        this.dataService = dataService;
        this.platformId = platformId;
        this.clientStateService = clientStateService;
        this.publicTargets = []; // Array to hold API targets
        this.latestReports = []; // Array to hold latest reports
        this.selectedReport = null; // Selected report for modal
        this.isBrowser = false;
        this.homeReports = [];
        this.isLoadingTargets = true;
        this.isLoadingAnalytics = true;
        this.isLoading = true;
        this.error = null;
        this.username = ''; // Add username property
        this.alerts = []; // Add alerts array
        this.avgThreatScore = null;
        this.highThreatCount = null;
        this.totalReports = null;
        this.avgThreatScoreChange = null;
        this.highThreatCountChange = null;
        this.totalReportsChange = null;
        this.threatTableData = [];
        this.threatEntitiesTimeseriesList = [];
        this.threatEntitiesChartData = [];
        this.threatEntitiesItemChartData = [];
        this.geoLocationTrends = [];
        // Chart data for ngx-charts pie chart
        this.chartData = [];
        // Chart data for ngx-charts bar chart
        this.geoDistributionData = [
            { name: 'United States', value: 450 },
            { name: 'United Kingdom', value: 380 },
            { name: 'Germany', value: 290 },
            { name: 'France', value: 250 },
            { name: 'Canada', value: 220 }
        ];
        // Chart options for both charts
        this.chartView = [450, 350];
        this.geoChartView = [500, 500]; // Made taller to fit more data
        this.chartOptions = {
            gradient: true,
            showLegend: false,
            showLabels: true,
            isDoughnut: false,
            trimLabels: true,
            maxLabelLength: 12,
            colorScheme: {
                name: 'custom',
                selectable: true,
                group: ScaleType.Ordinal,
                domain: [
                    '#6C5CE7',
                    '#A29BFE',
                    '#8E44AD',
                    '#9B59B6',
                    '#3498DB',
                    '#2980B9',
                    '#4ECDC4',
                    '#95E1D3' // Dark Web - Light Teal
                ]
            }
        };
        this.geoChartOptions = {
            gradient: true,
            showLegend: false,
            showXAxis: true,
            showYAxis: true,
            showXAxisLabel: true,
            showYAxisLabel: true,
            xAxisLabel: 'Country',
            yAxisLabel: 'Mentions',
            barPadding: 2,
            groupPadding: 8,
            roundDomains: true,
            animations: true,
            colorScheme: {
                name: 'custom',
                selectable: true,
                group: ScaleType.Ordinal,
                domain: ['#a178f1', '#6C5CE7', '#4ECDC4', '#95E1D3', '#7a4dcb', '#915eff']
            }
        };
        // Bar chart configuration (for "Your Targets")
        this.targetConfig = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                        label: 'Average Sentiment Score',
                        data: [],
                        backgroundColor: '#a178f1',
                        borderColor: '#a178f1',
                        borderWidth: 2,
                    }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                layout: {
                    padding: {
                        top: 30,
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    x: {
                        title: { display: false },
                        ticks: { display: true }
                    },
                    y: {
                        title: { display: false },
                        ticks: { display: true }
                    }
                }
            }
        };
        // Geographic distribution chart configuration
        this.geoDistributionConfig = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                        label: 'Mentions by Region',
                        data: [],
                        backgroundColor: '#a178f1',
                        borderColor: '#a178f1',
                        borderWidth: 2,
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        },
                        beginAtZero: true
                    }
                }
            }
        };
        // Add new properties for target cycling
        this.currentTargetIndex = 0;
        this.currentTarget = null;
        this.currentTargetSummary = '';
        this.sentimentData = [];
        this.sentimentChartView = [400, 300];
        this.sentimentChartOptions = {
            showXAxis: true,
            showYAxis: true,
            gradient: true,
            showLegend: false,
            showXAxisLabel: true,
            xAxisLabel: 'Date',
            showYAxisLabel: true,
            yAxisLabel: 'Sentiment Score',
            timeline: false,
            yScaleMin: 0,
            yScaleMax: 10,
            animations: false,
            colorScheme: {
                name: 'custom',
                selectable: true,
                group: ScaleType.Ordinal,
                domain: ['#6C5CE7']
            }
        };
        this.themeObserver = null;
        this.lastTheme = null;
        this.geoMapDrawAttempts = 0;
        this.maxGeoMapDrawAttempts = 10;
        this.geoMapDrawRetryDelay = 150; // ms
        this.isBrowser = isPlatformBrowser(this.platformId);
    }
    ngOnInit() {
        // Suppress Google Maps API warnings globally when no API key is configured
        const originalWarn = console.warn;
        console.warn = function (...args) {
            if (args[0] && typeof args[0] === 'string' &&
                (args[0].includes('NoApiKeys') ||
                    args[0].includes('InvalidKey') ||
                    args[0].includes('Geocoding Service') ||
                    args[0].includes('Google Maps JavaScript API warning'))) {
                return; // Suppress these specific warnings
            }
            originalWarn.apply(console, args);
        };
        if (this.isBrowser) {
            // Initialize TargetGraph
            const targetGraphCanvas = document.getElementById('TargetGraph');
            if (targetGraphCanvas) {
                if (this.targetChart) {
                    this.targetChart.destroy();
                }
                this.targetChart = new Chart(targetGraphCanvas, this.targetConfig);
            }
            // Initialize geographic distribution chart
            const geoChartCanvas = document.getElementById('GeoDistributionChart');
            if (geoChartCanvas) {
                if (this.geoDistributionChart) {
                    this.geoDistributionChart.destroy();
                }
                this.geoDistributionChart = new Chart(geoChartCanvas, this.geoDistributionConfig);
            }
            // Then load Google Charts
            this.loadGoogleCharts();
            // Fetch public targets first
            this.dataService.getPublicTargets().subscribe({
                next: (response) => {
                    if (response && response.targets) {
                        this.publicTargets = response.targets;
                        // Process sentiment data with public targets
                        this.processSentimentData('');
                    }
                    else {
                        console.error('Invalid response format from getPublicTargets:', response);
                        this.publicTargets = [];
                    }
                },
                error: (error) => {
                    console.error('Error fetching public targets:', error);
                    this.publicTargets = [];
                }
            });
            // Only subscribe to client state if we have an access token
            if (localStorage.getItem('access_token')) {
                this.clientSubscription = this.clientStateService.selectedClientId$.subscribe(clientId => {
                    if (clientId) {
                        this.fetchHomeReports(clientId);
                        this.fetchAnalytics(clientId);
                        this.fetchAlerts(clientId);
                    }
                });
            }
            else {
                console.log('No access token found, skipping client state subscription');
                this.homeReports = [];
                this.alerts = [];
                this.avgThreatScore = null;
                this.highThreatCount = null;
                this.totalReports = null;
                this.avgThreatScoreChange = null;
                this.highThreatCountChange = null;
                this.totalReportsChange = null;
            }
            // Set up MutationObserver to watch for theme changes
            this.themeObserver = new MutationObserver((mutations) => {
                const newTheme = this.getCurrentTheme();
                if (newTheme !== this.lastTheme) {
                    this.lastTheme = newTheme;
                    setTimeout(() => this.redrawGeoMap(), 0);
                }
            });
            this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            this.lastTheme = this.getCurrentTheme();
        }
    }
    ngAfterViewInit() {
        // Ensure map is drawn with correct theme after view is initialized
        setTimeout(() => this.redrawGeoMap(), 0);
    }
    ngOnDestroy() {
        if (this.clientSubscription) {
            this.clientSubscription.unsubscribe();
        }
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
    }
    fetchHomeReports(clientId) {
        this.isLoadingTargets = true;
        this.updateGlobalLoading();
        this.error = null;
        this.dataService.getClientTargets(clientId).subscribe({
            next: (reports) => {
                this.homeReports = reports;
                this.isLoadingTargets = false;
                this.updateGlobalLoading();
            },
            error: (err) => {
                this.error = 'Failed to load reports.';
                this.isLoadingTargets = false;
                this.updateGlobalLoading();
                console.error(err);
            }
        });
    }
    fetchAnalytics(clientId) {
        this.isLoadingAnalytics = true;
        this.updateGlobalLoading();
        this.dataService.getReportAnalytics(clientId).subscribe({
            next: (analytics) => {
                console.log('DEBUG: analytics', analytics);
                // Get total metrics
                this.avgThreatScore = analytics.total?.avg_threat_score ?? null;
                this.highThreatCount = analytics.total?.high_threat_count ?? null;
                this.totalReports = analytics.total?.total_reports ?? null;
                // Set chartData for Data Sources pie chart from API
                this.chartData = Array.isArray(analytics.total?.source_distribution)
                    ? analytics.total.source_distribution.map((src) => ({
                        name: src.source,
                        value: src.count
                    }))
                    : [];
                // Make timeSeriesData available for fallback calculation
                const timeSeriesData = analytics.time_series_per_target;
                // Calculate percent changes using new yesterday_* fields if available
                if (analytics.total?.yesterday_avg_threat_score !== undefined &&
                    analytics.total?.yesterday_avg_threat_score !== null) {
                    this.avgThreatScoreChange = analytics.total.yesterday_avg_threat_score !== 0
                        ? ((analytics.total.avg_threat_score - analytics.total.yesterday_avg_threat_score) / Math.abs(analytics.total.yesterday_avg_threat_score)) * 100
                        : 0;
                }
                if (analytics.total?.yesterday_high_threat_count !== undefined &&
                    analytics.total?.yesterday_high_threat_count !== null) {
                    this.highThreatCountChange = analytics.total.yesterday_high_threat_count !== 0
                        ? ((analytics.total.high_threat_count - analytics.total.yesterday_high_threat_count) / Math.abs(analytics.total.yesterday_high_threat_count)) * 100
                        : 0;
                }
                if (analytics.total?.yesterday_total_reports !== undefined &&
                    analytics.total?.yesterday_total_reports !== null) {
                    this.totalReportsChange = analytics.total.yesterday_total_reports !== 0
                        ? ((analytics.total.total_reports - analytics.total.yesterday_total_reports) / Math.abs(analytics.total.yesterday_total_reports)) * 100
                        : 0;
                }
                // Fallback: Calculate percent changes from time series data if yesterday fields are not available
                if ((this.avgThreatScoreChange === null || this.avgThreatScoreChange === undefined) &&
                    timeSeriesData) {
                    // Get the first target's data (since we're showing aggregate metrics)
                    const targetId = Object.keys(timeSeriesData)[0];
                    if (targetId) {
                        const dailyData = timeSeriesData[targetId].daily;
                        const dates = Object.keys(dailyData).sort().reverse(); // newest first
                        if (dates.length >= 2) {
                            const today = dailyData[dates[0]];
                            const prev = dailyData[dates[1]];
                            this.avgThreatScoreChange = prev.avg_threat_score !== 0
                                ? ((today.avg_threat_score - prev.avg_threat_score) / prev.avg_threat_score) * 100
                                : 0;
                            this.highThreatCountChange = prev.high_threat_count !== 0
                                ? ((today.high_threat_count - prev.high_threat_count) / prev.high_threat_count) * 100
                                : 0;
                            this.totalReportsChange = prev.total_reports !== 0
                                ? ((today.total_reports - prev.total_reports) / prev.total_reports) * 100
                                : 0;
                        }
                        else {
                            this.avgThreatScoreChange = 0;
                            this.highThreatCountChange = 0;
                            this.totalReportsChange = 0;
                        }
                    }
                }
                // Build threatTableData for Target Sentiment Analysis table
                this.threatTableData = [];
                if (analytics.time_series_per_target) {
                    for (const targetId of Object.keys(analytics.time_series_per_target)) {
                        const target = analytics.time_series_per_target[targetId];
                        const daily = target.daily;
                        const sortedDates = Object.keys(daily).sort();
                        const series = sortedDates.map(date => ({
                            name: date,
                            value: daily[date].avg_threat_score
                        }));
                        const highThreatCountSum = sortedDates.reduce((sum, date) => sum + (daily[date].high_threat_count || 0), 0);
                        const totalReportsSum = sortedDates.reduce((sum, date) => sum + (daily[date].total_reports || 0), 0);
                        this.threatTableData.push({
                            name: target.name,
                            series,
                            highThreatCountSum,
                            totalReportsSum
                        });
                    }
                }
                // Process threat_entities_timeseries for Threat Entities card
                this.threatEntitiesTimeseriesList = [];
                const threatEntitiesTimeseries = analytics.total?.threat_entities_timeseries;
                console.log('DEBUG: threatEntitiesTimeseries', threatEntitiesTimeseries);
                if (threatEntitiesTimeseries) {
                    for (const date of Object.keys(threatEntitiesTimeseries).sort()) {
                        const entityTypes = threatEntitiesTimeseries[date];
                        const entities = Object.keys(entityTypes).map(type => ({
                            type,
                            items: entityTypes[type]
                        }));
                        this.threatEntitiesTimeseriesList.push({ date, entities });
                    }
                }
                // Prepare chart data for threat entity mentions over time
                this.threatEntitiesChartData = [];
                if (threatEntitiesTimeseries) {
                    // Get all unique entity types
                    const allTypes = new Set();
                    for (const date of Object.keys(threatEntitiesTimeseries)) {
                        const entityTypes = threatEntitiesTimeseries[date];
                        Object.keys(entityTypes).forEach(type => allTypes.add(type));
                    }
                    // For each entity type, build a series of { name: date, value: sum of counts }
                    for (const type of allTypes) {
                        const series = [];
                        for (const date of Object.keys(threatEntitiesTimeseries).sort()) {
                            const items = threatEntitiesTimeseries[date][type] || [];
                            const value = items.reduce((sum, item) => sum + (item.count || 0), 0);
                            series.push({ name: date, value });
                        }
                        this.threatEntitiesChartData.push({ type, series });
                    }
                }
                // Prepare chart data for each entity value (item) over time
                this.threatEntitiesItemChartData = [];
                if (threatEntitiesTimeseries) {
                    // Get all unique entity types and their values
                    const allTypes = new Set();
                    const allValuesByType = {};
                    for (const date of Object.keys(threatEntitiesTimeseries)) {
                        const entityTypes = threatEntitiesTimeseries[date];
                        for (const type of Object.keys(entityTypes)) {
                            allTypes.add(type);
                            if (!allValuesByType[type])
                                allValuesByType[type] = new Set();
                            for (const item of entityTypes[type]) {
                                allValuesByType[type].add(item.value);
                            }
                        }
                    }
                    // For each entity type and value, build a series of { name: date, value: count }
                    for (const type of allTypes) {
                        for (const value of allValuesByType[type]) {
                            const series = [];
                            for (const date of Object.keys(threatEntitiesTimeseries).sort()) {
                                const items = threatEntitiesTimeseries[date][type] || [];
                                const found = items.find((item) => item.value === value);
                                series.push({ name: date, value: found ? found.count : 0 });
                            }
                            // Calculate percent change from previous day to last day (always use last two points)
                            let percentChange = null;
                            if (series.length > 1) {
                                const prev = series[series.length - 2].value;
                                const last = series[series.length - 1].value;
                                if (prev !== 0) {
                                    percentChange = ((last - prev) / Math.abs(prev)) * 100;
                                }
                                else if (last !== 0) {
                                    percentChange = 100;
                                }
                                else {
                                    percentChange = 0;
                                }
                            }
                            else {
                                percentChange = 0;
                            }
                            this.threatEntitiesItemChartData.push({ type, value, series, percentChange });
                        }
                    }
                }
                // Use API-provided locations for Geographical Distribution if available
                const locationPercentages = analytics.total?.locations;
                if (locationPercentages && typeof locationPercentages === 'object') {
                    // For Google GeoChart
                    const mapData = [
                        ['Country', 'Mentions', { type: 'string', role: 'tooltip' }]
                    ];
                    Object.entries(locationPercentages).forEach(([location, percent]) => {
                        mapData.push([
                            String(location),
                            Number(percent),
                            `${location} - Threat Makeup: ${Math.round(Number(percent))}%`
                        ]);
                    });
                    // Update the map (if Google Charts is loaded)
                    try {
                        if (typeof google !== 'undefined' && google.visualization && google.visualization.arrayToDataTable) {
                            const data = google.visualization.arrayToDataTable(mapData);
                            const theme = this.getCurrentTheme();
                            const isLight = theme === 'light';
                            const options = {
                                backgroundColor: isLight ? '#fff' : '#000000',
                                colorAxis: {
                                    colors: isLight ? ['#a178f1', '#6C5CE7'] : ['#d5bfff', '#a178f1'],
                                    minValue: 0,
                                    maxValue: Math.max(...Object.values(locationPercentages).map(Number))
                                },
                                datalessRegionColor: isLight ? '#f3f3f3' : '#2f2e2e',
                                defaultColor: isLight ? '#c0c0c0' : '#c0c0c0',
                                region: 'world',
                                displayMode: 'regions',
                                enableRegionInteractivity: true,
                                resolution: 'countries',
                                height: 400,
                                width: '100%',
                                legend: {
                                    textStyle: {
                                        color: isLight ? '#222' : '#fff',
                                        fontSize: 14
                                    },
                                    position: 'bottom'
                                },
                                tooltip: {
                                    isHtml: false
                                }
                            };
                            const chartDiv = document.getElementById('regions_div');
                            if (chartDiv) {
                                const chart = new google.visualization.GeoChart(chartDiv);
                                chart.draw(data, options);
                            }
                        }
                    }
                    catch (e) {
                        console.error('Error drawing map with API data:', e);
                    }
                    // For right-side trends: build geoLocationTrends from locations
                    this.geoLocationTrends = Object.entries(locationPercentages).map(([location, percent]) => ({
                        name: String(location),
                        series: [
                            { name: 'Now', value: Number(percent) }
                        ]
                    }));
                    // Trigger map redrawing after data is loaded
                    setTimeout(() => this.redrawGeoMap(), 100);
                }
                this.isLoadingAnalytics = false;
                this.updateGlobalLoading();
            },
            error: (err) => {
                this.isLoadingAnalytics = false;
                this.updateGlobalLoading();
            }
        });
    }
    fetchAlerts(clientId) {
        // For now, using mock data since the alerts API endpoint isn't implemented yet
        this.alerts = [
            {
                name: 'Unauthorized Access Attempt',
                threat_level: 'HIGH',
                description: 'Unauthorized access attempt detected from external IP',
                timestamp: new Date()
            },
            {
                name: 'Suspicious Login Activity',
                threat_level: 'HIGH',
                description: 'Suspicious login activity from new device',
                timestamp: new Date()
            },
            {
                name: 'Unusual Data Transfer',
                threat_level: 'MEDIUM',
                description: 'Unusual data transfer pattern detected',
                timestamp: new Date()
            },
            {
                name: 'Outdated Software',
                threat_level: 'LOW',
                description: 'Outdated software version detected',
                timestamp: new Date()
            }
        ];
        // TODO: Replace with actual API call when endpoint is available
        // this.dataService.getClientAlerts(clientId).subscribe({
        //   next: (alerts: Alert[]) => {
        //     this.alerts = alerts;
        //   },
        //   error: (err) => {
        //     console.error('Error fetching alerts:', err);
        //     this.alerts = [];
        //   }
        // });
    }
    // Helper function to extract sources from the report
    getSources(report) {
        return Object.keys(report.sources || {});
    }
    // Show report details in modal
    showReportDetails(report, event) {
        event.preventDefault(); // Prevent default navigation
        this.selectedReport = report;
        const modal = document.getElementById('reportModal');
        if (modal) {
            modal.style.display = 'block'; // Make modal visible
        }
    }
    // Close modal
    closeModal() {
        this.selectedReport = null;
        const modal = document.getElementById('reportModal');
        if (modal) {
            modal.style.display = 'none'; // Hide modal
        }
    }
    // Load Google Charts
    loadGoogleCharts() {
        // Check if API key is configured
        if (!environment.googleMaps.apiKey || environment.googleMaps.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            console.warn('Google Maps API key is not configured. Please add your API key to the environment configuration.');
            console.warn('The World Map may not display properly without a valid API key.');
        }
        if (typeof google === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/charts/loader.js?loading=async';
            script.type = 'text/javascript';
            script.onload = () => {
                // Suppress Google Maps API warnings when no API key is configured
                if (window.google && window.google.maps) {
                    window.google.maps.event.addListenerOnce(window.google.maps, 'idle', () => {
                        // Suppress console warnings for missing API keys
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
                    });
                }
                google.charts.load('current', {
                    packages: ['geochart'],
                    mapsApiKey: environment.googleMaps.apiKey || undefined
                });
                google.charts.setOnLoadCallback(() => this.ensureAndDrawGeoMap());
            };
            document.body.appendChild(script);
        }
        else {
            // Suppress Google Maps API warnings when no API key is configured
            if (window.google && window.google.maps) {
                window.google.maps.event.addListenerOnce(window.google.maps, 'idle', () => {
                    // Suppress console warnings for missing API keys
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
                });
            }
            google.charts.load('current', {
                packages: ['geochart'],
                mapsApiKey: environment.googleMaps.apiKey || undefined
            });
            google.charts.setOnLoadCallback(() => this.ensureAndDrawGeoMap());
        }
    }
    ensureAndDrawGeoMap() {
        const chartDiv = document.getElementById('regions_div');
        if (chartDiv && typeof google !== 'undefined' && google.visualization) {
            this.geoMapDrawAttempts = 0;
            this.drawRegionsMap();
        }
        else if (this.geoMapDrawAttempts < this.maxGeoMapDrawAttempts) {
            this.geoMapDrawAttempts++;
            console.log(`Attempt ${this.geoMapDrawAttempts} to find regions_div element...`);
            setTimeout(() => this.ensureAndDrawGeoMap(), this.geoMapDrawRetryDelay);
        }
        else {
            console.error('Failed to find regions_div element after multiple attempts. This may be due to:');
            console.error('1. The element not being rendered yet (no geoLocationTrends data)');
            console.error('2. Google Charts not being loaded properly');
            console.error('3. Missing or invalid Google Maps API key');
            // Check if we have data but the element doesn't exist
            if (this.geoLocationTrends && this.geoLocationTrends.length > 0) {
                console.log('GeoLocationTrends data is available, but regions_div element is missing');
            }
            else {
                console.log('No geoLocationTrends data available yet');
            }
        }
    }
    // Draw Regions Map
    drawRegionsMap() {
        console.log('Drawing regions map...'); // Debug log
        // Use real API data only
        if (!this.geoLocationTrends || this.geoLocationTrends.length === 0) {
            console.warn('No geoLocationTrends data available for map.');
            return;
        }
        // Build mapData from geoLocationTrends
        const mapData = [
            ['Country', 'Mentions', { type: 'string', role: 'tooltip' }]
        ];
        for (const loc of this.geoLocationTrends) {
            const value = loc.series && loc.series.length > 0 ? loc.series[0].value : 0;
            mapData.push([
                loc.name,
                value,
                `${loc.name} - Threat Makeup: ${Math.round(value)}%`
            ]);
        }
        try {
            const data = google.visualization.arrayToDataTable(mapData);
            const theme = this.getCurrentTheme();
            const isLight = theme === 'light';
            const options = {
                backgroundColor: isLight ? '#fff' : '#000000',
                colorAxis: {
                    colors: isLight ? ['#a178f1', '#6C5CE7'] : ['#d5bfff', '#a178f1'],
                    minValue: 0,
                    maxValue: Math.max(...mapData.slice(1).map(row => Number(row[1])))
                },
                datalessRegionColor: isLight ? '#f3f3f3' : '#2f2e2e',
                defaultColor: isLight ? '#c0c0c0' : '#c0c0c0',
                region: 'world',
                displayMode: 'regions',
                enableRegionInteractivity: true,
                resolution: 'countries',
                height: 400,
                width: '100%',
                legend: {
                    textStyle: {
                        color: isLight ? '#222' : '#fff',
                        fontSize: 14
                    },
                    position: 'bottom'
                },
                tooltip: {
                    isHtml: false
                }
            };
            const chartDiv = document.getElementById('regions_div');
            if (chartDiv) {
                const chart = new google.visualization.GeoChart(chartDiv);
                chart.draw(data, options);
            }
            else {
                console.error('Could not find regions_div element');
            }
        }
        catch (error) {
            console.error('Error drawing map:', error); // Debug log
        }
    }
    // Update the processSentimentData method
    processSentimentData(clientId) {
        console.log('Processing sentiment data for public targets');
        // Reset current state
        this.sentimentData = [];
        this.currentTarget = null;
        this.currentTargetIndex = 0;
        // Process public targets
        this.sentimentData = this.publicTargets.map((target) => {
            // Check target state
            const hasReports = Array.isArray(target.reports) && target.reports.length > 0;
            const hasLastRun = !!target.last_run;
            if (!hasLastRun) {
                // Target hasn't been analyzed yet
                return {
                    name: target.name,
                    series: [{
                            name: 'Not Analyzed',
                            value: 0
                        }],
                    status: 'not_analyzed'
                };
            }
            else if (!hasReports) {
                // Analysis is in progress
                return {
                    name: target.name,
                    series: [{
                            name: 'Analysis in Progress',
                            value: 0
                        }],
                    status: 'in_progress',
                    lastRun: target.last_run
                };
            }
            else {
                // Analysis is complete, show sentiment data
                const reports = target.reports || [];
                const sortedReports = [...reports]
                    .sort((a, b) => new Date(a.date_of_analysis).getTime() - new Date(b.date_of_analysis).getTime());
                // Process sentiment scores with better validation
                const series = sortedReports.map(report => {
                    let score;
                    // Try to parse the sentiment score - using average_sentiment instead of average_sentiment_score
                    if (typeof report.average_sentiment === 'string') {
                        // Remove any non-numeric characters except decimal point and minus sign
                        const cleanScore = report.average_sentiment.replace(/[^0-9.-]/g, '');
                        score = parseFloat(cleanScore);
                    }
                    else if (typeof report.average_sentiment === 'number') {
                        score = report.average_sentiment;
                    }
                    else {
                        console.warn(`Invalid sentiment score for target ${target.name}:`, report.average_sentiment);
                        score = 0;
                    }
                    // Do NOT convert score; use original 1-10 value for chart
                    // Log the original score for debugging
                    console.log(`Sentiment score for ${target.name}:`, {
                        original: report.average_sentiment,
                        value: score,
                        date: report.date_of_analysis
                    });
                    return {
                        name: new Date(report.date_of_analysis).toLocaleDateString(),
                        value: score
                    };
                });
                // Log the complete series for debugging
                console.log('Complete series for target:', target.name, series);
                return {
                    name: target.name,
                    series: series,
                    status: 'complete',
                    latestReport: sortedReports[sortedReports.length - 1]
                };
            }
        });
        // Set the first target immediately
        if (this.sentimentData.length > 0) {
            this.currentTarget = this.sentimentData[0];
            this.updateCurrentTargetSummary();
        }
    }
    // Simplify the cycle target method
    cycleTarget(direction) {
        if (!this.sentimentData.length)
            return;
        if (direction === 'next') {
            this.currentTargetIndex = (this.currentTargetIndex + 1) % this.sentimentData.length;
        }
        else {
            this.currentTargetIndex = (this.currentTargetIndex - 1 + this.sentimentData.length) % this.sentimentData.length;
        }
        this.currentTarget = this.sentimentData[this.currentTargetIndex];
        this.updateCurrentTargetSummary();
    }
    // Add method to update target summary
    updateCurrentTargetSummary() {
        if (!this.currentTarget) {
            this.currentTargetSummary = '';
            return;
        }
        // Update summary based on target state
        switch (this.currentTarget.status) {
            case 'not_analyzed':
                this.currentTargetSummary = 'This target has not been analyzed yet. Analysis will be triggered automatically when the target is created or updated.';
                break;
            case 'in_progress':
                const lastRunDate = new Date(this.currentTarget.lastRun || '').toLocaleString();
                this.currentTargetSummary = `Analysis is in progress. Started on ${lastRunDate}. Please check back later for results.`;
                break;
            case 'complete':
                const report = this.currentTarget.latestReport;
                this.currentTargetSummary = report?.summary || 'No summary available for this analysis.';
                break;
            default:
                this.currentTargetSummary = 'No information available for this target.';
        }
    }
    // Helper to get unique entity types for chart grouping
    getEntityTypes() {
        const types = new Set();
        for (const chart of this.threatEntitiesItemChartData) {
            types.add(chart.type);
        }
        return Array.from(types);
    }
    // Helper to get all charts for a given entity type
    getChartsByType(type) {
        return this.threatEntitiesItemChartData.filter(c => c.type === type);
    }
    // Utility to get current theme
    getCurrentTheme() {
        if (typeof document !== 'undefined') {
            return document.body.classList.contains('light-theme') ? 'light' : 'dark';
        }
        return 'dark';
    }
    redrawGeoMap() {
        console.log('Redrawing geo map...');
        this.geoMapDrawAttempts = 0;
        this.ensureAndDrawGeoMap();
    }
    updateGlobalLoading() {
        this.isLoading = this.isLoadingTargets || this.isLoadingAnalytics;
    }
};
__decorate([
    ViewChild('customTooltip', { static: true })
], UserHomeComponent.prototype, "customTooltip", void 0);
UserHomeComponent = __decorate([
    Component({
        selector: 'app-user-home',
        templateUrl: './user-home.component.html',
        styleUrls: ['./user-home.component.scss']
    }),
    __param(1, Inject(PLATFORM_ID))
], UserHomeComponent);
export { UserHomeComponent };
//# sourceMappingURL=user-home.component.js.map
import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
let AlertGalleryComponent = class AlertGalleryComponent {
    constructor(http, clientState) {
        this.http = http;
        this.clientState = clientState;
        this.statusOrder = ['active', 'pending', 'resolved', 'dismissed'];
        this.allAlerts = [];
        this.filteredAlerts = [];
        this.selectedAlert = null;
        this.selectedAlertDraft = null;
        this.selectedClientId = null;
        this.searchTerm = '';
        this.isLoading = false;
        this.errorMessage = null;
        this.statusFilters = {
            active: true,
            pending: true,
            resolved: true,
            dismissed: false
        };
    }
    ngOnInit() {
        this.clientSub = this.clientState.selectedClientId$.subscribe(clientId => {
            this.selectedClientId = clientId;
            this.refreshAlertsFromBackend();
        });
    }
    ngOnDestroy() {
        this.clientSub?.unsubscribe();
    }
    get totalCount() {
        return this.filteredAlerts.length;
    }
    get activeCount() {
        return this.filteredAlerts.filter(alert => alert.status === 'active').length;
    }
    get criticalCount() {
        return this.filteredAlerts.filter(alert => alert.severity === 'critical').length;
    }
    get unresolvedCount() {
        return this.filteredAlerts.filter(alert => alert.status === 'active' || alert.status === 'pending').length;
    }
    get hasFilters() {
        return this.searchTerm.trim().length > 0 || this.statusOrder.some(status => !this.statusFilters[status]);
    }
    get currentAssignees() {
        if (!this.selectedAlert?.clientMembers?.length) {
            return ['Unassigned'];
        }
        const members = this.selectedAlert.clientMembers.filter(Boolean);
        return ['Unassigned', ...members];
    }
    clearFilters() {
        this.searchTerm = '';
        this.statusFilters = {
            active: true,
            pending: true,
            resolved: true,
            dismissed: false
        };
        this.onStatusFilterChange();
    }
    applyTextFilter() {
        this.applyLocalSearchFilter();
    }
    onStatusFilterChange() {
        this.refreshAlertsFromBackend();
    }
    openAlert(alert) {
        this.selectedAlert = alert;
        this.selectedAlertDraft = {
            status: alert.status,
            assignedTo: alert.assignedTo || 'Unassigned',
            comment: alert.comment
        };
    }
    closeAlertPanel() {
        this.selectedAlert = null;
        this.selectedAlertDraft = null;
    }
    saveAlertEdits() {
        if (!this.selectedClientId || !this.selectedAlert || !this.selectedAlertDraft) {
            return;
        }
        const payload = {
            alert_id: this.selectedAlert.id,
            status: this.selectedAlertDraft.status,
            assigned_to: this.selectedAlertDraft.assignedTo === 'Unassigned' ? '' : this.selectedAlertDraft.assignedTo,
            comment: this.selectedAlertDraft.comment?.trim() ?? ''
        };
        this.http
            .post(`${environment.apiUrl}/api/${environment.apiVersion}/alerts/update`, payload)
            .subscribe({
            next: res => {
                const mapped = res?.data ? this.mapBackendAlert(res.data) : null;
                const target = this.allAlerts.find(item => item.id === this.selectedAlert?.id);
                if (!target) {
                    return;
                }
                if (mapped) {
                    Object.assign(target, mapped);
                }
                else {
                    target.status = payload.status;
                    target.assignedTo = this.selectedAlertDraft?.assignedTo ?? 'Unassigned';
                    target.comment = payload.comment;
                    target.updatedAt = new Date().toISOString();
                }
                this.applyLocalSearchFilter();
                this.openAlert(target);
            },
            error: err => {
                console.error('[Alerts] Failed to update alert', err);
                this.errorMessage = 'Failed to update alert.';
            }
        });
    }
    toggleAlertStatus(alert) {
        if (!this.selectedClientId) {
            return;
        }
        const nextStatus = alert.status === 'active' ? 'dismissed' : 'active';
        this.http
            .post(`${environment.apiUrl}/api/${environment.apiVersion}/alerts/update`, {
            alert_id: alert.id,
            status: nextStatus
        })
            .subscribe({
            next: res => {
                const mapped = res?.data ? this.mapBackendAlert(res.data) : null;
                const target = this.allAlerts.find(item => item.id === alert.id);
                if (!target) {
                    return;
                }
                if (mapped) {
                    Object.assign(target, mapped);
                }
                else {
                    target.status = nextStatus;
                    target.updatedAt = new Date().toISOString();
                }
                this.applyLocalSearchFilter();
                if (this.selectedAlert?.id === alert.id) {
                    this.openAlert(target);
                }
            },
            error: err => {
                console.error('[Alerts] Failed to toggle alert status', err);
                this.errorMessage = 'Failed to update alert status.';
            }
        });
    }
    getStatusLabel(status) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
    getSeverityLabel(severity) {
        return severity.charAt(0).toUpperCase() + severity.slice(1);
    }
    trackByAlertId(index, alert) {
        return alert.id;
    }
    refreshAlertsFromBackend() {
        this.errorMessage = null;
        if (!this.selectedClientId) {
            this.allAlerts = [];
            this.filteredAlerts = [];
            this.closeAlertPanel();
            return;
        }
        this.isLoading = true;
        const selectedStatuses = this.statusOrder.filter(status => this.statusFilters[status]);
        const statuses = selectedStatuses.length ? selectedStatuses : this.statusOrder;
        const payload = {
            client_id: this.selectedClientId,
            status: statuses
        };
        this.http
            .post(`${environment.apiUrl}/api/${environment.apiVersion}/alerts/client/alerts`, payload)
            .subscribe({
            next: res => {
                const rows = Array.isArray(res?.data) ? res.data : [];
                this.allAlerts = rows.map(row => this.mapBackendAlert(row));
                this.applyLocalSearchFilter();
                this.isLoading = false;
            },
            error: err => {
                console.error('[Alerts] Failed to fetch alerts', err);
                this.errorMessage = 'Failed to load alerts.';
                this.allAlerts = [];
                this.filteredAlerts = [];
                this.closeAlertPanel();
                this.isLoading = false;
            }
        });
    }
    applyLocalSearchFilter() {
        const term = this.searchTerm.trim().toLowerCase();
        this.filteredAlerts = this.allAlerts
            .filter(alert => {
            if (!term) {
                return true;
            }
            return (alert.title.toLowerCase().includes(term) ||
                alert.summary.toLowerCase().includes(term) ||
                alert.sourceQuery.toLowerCase().includes(term) ||
                alert.tags.some(tag => tag.toLowerCase().includes(term)));
        })
            .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        if (this.selectedAlert && !this.filteredAlerts.find(alert => alert.id === this.selectedAlert?.id)) {
            this.closeAlertPanel();
        }
    }
    mapBackendAlert(raw) {
        const status = this.normalizeStatus(raw?.status);
        const severity = this.normalizeSeverity(raw?.severity ?? raw?.risk_level ?? raw?.level);
        const members = Array.isArray(raw?.client_members)
            ? raw.client_members.filter((item) => typeof item === 'string')
            : [];
        return {
            id: String(raw?._id ?? raw?.id ?? `alert-${Math.random().toString(36).slice(2)}`),
            title: String(raw?.title ?? 'Untitled Alert'),
            summary: String(raw?.severe_threat_desc ?? raw?.summary ?? ''),
            status,
            severity,
            sourceQuery: String(raw?.query_name ?? raw?.source_query ?? raw?.source ?? 'Unknown Query'),
            module: String(raw?.module ?? 'Threat Intel'),
            tags: Array.isArray(raw?.threat_keywords)
                ? raw.threat_keywords.map((tag) => String(tag))
                : Array.isArray(raw?.tags)
                    ? raw.tags.map((tag) => String(tag))
                    : [],
            createdAt: String(raw?.created_at ?? raw?.createdAt ?? new Date().toISOString()),
            updatedAt: String(raw?.updated_at ?? raw?.updatedAt ?? raw?.created_at ?? new Date().toISOString()),
            affectedEntity: String(raw?.affected_entity ?? raw?.entity ?? 'Unspecified'),
            assignedTo: String(raw?.assigned_to ?? raw?.assignedTo ?? 'Unassigned') || 'Unassigned',
            comment: String(raw?.comment ?? ''),
            clientMembers: members
        };
    }
    normalizeStatus(value) {
        const candidate = String(value ?? '').toLowerCase();
        if (candidate === 'active' || candidate === 'pending' || candidate === 'resolved' || candidate === 'dismissed') {
            return candidate;
        }
        return 'pending';
    }
    normalizeSeverity(value) {
        const candidate = String(value ?? '').toLowerCase();
        if (candidate === 'critical' || candidate === 'high' || candidate === 'medium' || candidate === 'low') {
            return candidate;
        }
        return 'medium';
    }
};
AlertGalleryComponent = __decorate([
    Component({
        selector: 'app-alert-gallery',
        templateUrl: './alert-gallery.component.html',
        styleUrls: ['./alert-gallery.component.scss']
    })
], AlertGalleryComponent);
export { AlertGalleryComponent };
//# sourceMappingURL=alert-gallery.component.js.map
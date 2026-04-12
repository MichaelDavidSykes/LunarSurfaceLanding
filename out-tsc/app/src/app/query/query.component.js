var QueryComponent_1;
import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { EditSavedQueryDialogComponent } from './edit-saved-query-dialog.component';
import { applyCurrentEndDateLabel } from '../shared/query-preview.util';
let QueryComponent = class QueryComponent {
    static { QueryComponent_1 = this; }
    static { this.PENDING_SAVED_QUERY_V2_STORAGE_KEY = 'lunar.explorer.pendingSavedQueryV2'; }
    constructor(router, clientState, savedQueriesApi, dialog, snackbar) {
        this.router = router;
        this.clientState = clientState;
        this.savedQueriesApi = savedQueriesApi;
        this.dialog = dialog;
        this.snackbar = snackbar;
        this.savedQueries = [];
        this.loading = true;
        this.subs = new Subscription();
    }
    ngOnInit() {
        this.loading = true;
        this.subs.add(this.clientState.selectedClientId$.subscribe(clientId => {
            if (!clientId) {
                this.savedQueries = [];
                this.loading = false;
                return;
            }
            this.fetchClientSavedQueries(clientId);
        }));
    }
    ngOnDestroy() {
        this.subs.unsubscribe();
    }
    get hasQueries() {
        return this.savedQueries.length > 0;
    }
    get queryCountLabel() {
        const count = this.savedQueries.length;
        return `${count} ${count === 1 ? 'query' : 'queries'}`;
    }
    get activeQueryCount() {
        return this.savedQueries.filter(record => record.is_active).length;
    }
    get inactiveQueryCount() {
        return this.savedQueries.length - this.activeQueryCount;
    }
    get alertingEnabledCount() {
        return this.savedQueries.filter(record => record.alerting_enabled).length;
    }
    get alertingDisabledCount() {
        return this.savedQueries.length - this.alertingEnabledCount;
    }
    getDetailedPreview(record) {
        const preview = (record.query_preview || '').trim();
        if (!preview) {
            return 'No query summary available.';
        }
        return record.dynamic_end_date ? applyCurrentEndDateLabel(preview) : preview;
    }
    formatSavedAt(value) {
        const parsed = new Date(value);
        if (!Number.isFinite(parsed.getTime())) {
            return 'Unknown save time';
        }
        return parsed.toLocaleString();
    }
    refresh() {
        const clientId = this.clientState.selectedClientSubject.value?._id ?? null;
        if (!clientId) {
            return;
        }
        this.fetchClientSavedQueries(clientId);
    }
    openInExplorer(record) {
        if (!this.canUseStorage()) {
            return;
        }
        try {
            const payload = {
                name: record.name,
                saved_query_id: record.id,
                compiled_aql: record.compiled_aql,
                query_preview: this.getDetailedPreview(record)
            };
            localStorage.setItem(QueryComponent_1.PENDING_SAVED_QUERY_V2_STORAGE_KEY, JSON.stringify(payload));
            this.router.navigate(['/explorer']);
        }
        catch (error) {
            console.error('[Saved Queries] Failed to open query in Explorer', error);
        }
    }
    duplicateQuery(record) {
        const clientId = record.client_id;
        if (!clientId) {
            return;
        }
        this.savedQueriesApi
            .createSavedQuery({
            name: `${record.name} (copy)`,
            client_id: clientId,
            compiled_aql: record.compiled_aql,
            query_preview: record.query_preview,
            description: record.description,
            dynamic_end_date: record.dynamic_end_date,
            is_active: record.is_active,
            alerting_enabled: record.alerting_enabled
        })
            .subscribe({
            next: () => {
                this.snackbar.open('Saved query duplicated', 'success');
                this.fetchClientSavedQueries(clientId);
            },
            error: (err) => {
                console.error('[Saved Queries] Failed to duplicate query', err);
                this.snackbar.open('Failed to duplicate query', 'error');
            }
        });
    }
    deleteQuery(recordId) {
        // No backend delete endpoint yet.
        return;
    }
    clearAllQueries() {
        // No backend delete endpoint yet.
        return;
    }
    seedDemoQuery() {
        // Demo seeding is no longer used once hooked to backend saved queries.
        return;
    }
    trackByQueryId(index, record) {
        return record.id;
    }
    toggleIsActive(record) {
        const next = !record.is_active;
        this.savedQueriesApi.updateSavedQuery(record.id, { is_active: next }).subscribe({
            next: (updated) => {
                record.is_active = updated.is_active;
                record.alerting_enabled = updated.alerting_enabled;
                record.updated_at = updated.updated_at;
                record.savedAt = updated.updated_at;
                this.snackbar.open(`Query marked ${record.is_active ? 'active' : 'inactive'}`, 'success');
            },
            error: (err) => {
                console.error('[Saved Queries] Failed to update is_active', err);
                this.snackbar.open('Failed to update query', 'error');
            }
        });
    }
    toggleAlertingEnabled(record) {
        const next = !record.alerting_enabled;
        this.savedQueriesApi.updateSavedQuery(record.id, { alerting_enabled: next }).subscribe({
            next: (updated) => {
                record.is_active = updated.is_active;
                record.alerting_enabled = updated.alerting_enabled;
                record.updated_at = updated.updated_at;
                record.savedAt = updated.updated_at;
                this.snackbar.open(`Alerting ${record.alerting_enabled ? 'enabled' : 'disabled'}`, 'success');
            },
            error: (err) => {
                console.error('[Saved Queries] Failed to update alerting_enabled', err);
                this.snackbar.open('Failed to update query', 'error');
            }
        });
    }
    editQueryMeta(record) {
        const dialogRef = this.dialog.open(EditSavedQueryDialogComponent, {
            data: { name: record.name, description: record.description ?? null },
            panelClass: ['lunar-dialog']
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (!result) {
                return;
            }
            this.savedQueriesApi.updateSavedQuery(record.id, {
                name: result.name,
                description: result.description
            }).subscribe({
                next: (updated) => {
                    record.name = updated.name;
                    record.description = updated.description ?? null;
                    record.updated_at = updated.updated_at;
                    record.savedAt = updated.updated_at;
                    this.snackbar.open('Saved query updated', 'success');
                },
                error: (err) => {
                    console.error('[Saved Queries] Failed to update query meta', err);
                    this.snackbar.open('Failed to update query', 'error');
                }
            });
        });
    }
    fetchClientSavedQueries(clientId) {
        this.loading = true;
        this.savedQueriesApi.getClientSavedQueries(clientId, true).subscribe({
            next: (records) => {
                const normalized = (Array.isArray(records) ? records : [])
                    .map(record => this.normalizeApiRecord(record))
                    .filter((item) => item !== null)
                    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
                this.savedQueries = normalized;
                this.loading = false;
            },
            error: (err) => {
                console.error('[Saved Queries] Failed to fetch saved queries', err);
                this.savedQueries = [];
                this.loading = false;
                this.snackbar.open('Failed to load saved queries', 'error');
            }
        });
    }
    normalizeApiRecord(value) {
        if (!value || typeof value !== 'object') {
            return null;
        }
        const record = value;
        const id = typeof record._id === 'string' && record._id.trim() ? record._id.trim() : null;
        const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : null;
        const clientId = typeof record.client_id === 'string' && record.client_id.trim() ? record.client_id.trim() : null;
        const compiled = typeof record.compiled_aql === 'string' && record.compiled_aql.trim() ? record.compiled_aql : null;
        const preview = typeof record.query_preview === 'string' ? record.query_preview : '';
        const description = record.description === null || record.description === undefined
            ? null
            : String(record.description);
        const createdBy = typeof record.created_by === 'string' ? record.created_by : '';
        const createdAt = typeof record.created_at === 'string' ? record.created_at : '';
        const updatedAt = typeof record.updated_at === 'string' ? record.updated_at : '';
        const savedAt = typeof record.updated_at === 'string'
            ? record.updated_at
            : typeof record.created_at === 'string'
                ? record.created_at
                : new Date().toISOString();
        if (!id || !name || !clientId || !compiled) {
            return null;
        }
        return {
            id,
            name,
            savedAt,
            client_id: clientId,
            compiled_aql: compiled,
            query_preview: preview,
            description,
            dynamic_end_date: Boolean(record.dynamic_end_date),
            created_by: createdBy,
            created_at: createdAt,
            updated_at: updatedAt,
            is_active: Boolean(record.is_active),
            alerting_enabled: Boolean(record.alerting_enabled)
        };
    }
    canUseStorage() {
        return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    }
};
QueryComponent = QueryComponent_1 = __decorate([
    Component({
        selector: 'app-query',
        templateUrl: './query.component.html',
        styleUrls: ['./query.component.scss']
    })
], QueryComponent);
export { QueryComponent };
//# sourceMappingURL=query.component.js.map
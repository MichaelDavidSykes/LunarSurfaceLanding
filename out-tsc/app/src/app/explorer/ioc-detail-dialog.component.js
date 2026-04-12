import { __decorate } from "tslib";
import { Component, EventEmitter, Input, Output } from '@angular/core';
let IocDetailDialogComponent = class IocDetailDialogComponent {
    constructor() {
        this.pivotTrail = [];
        this.close = new EventEmitter();
        this.addToFilters = new EventEmitter();
        this.trailSelect = new EventEmitter();
        this.pivotToIoc = new EventEmitter();
    }
    get entityType() {
        const type = this.detail?.entity?.type || this.detail?.entity?.raw?.type;
        return type ? type.toString() : 'Entity';
    }
    get isReportEntity() {
        return this.entityType.toLowerCase() === 'report';
    }
    get modifiedLabel() {
        const value = this.detail?.entity?.modified || this.detail?.entity?.raw?.modified;
        return value ? new Date(value).toLocaleString() : null;
    }
    get currentTrailEntry() {
        return {
            primary: this.detail?.entity?.primary || 'Current IOC',
            secondary: this.detail?.entity?.secondary,
            type: this.detail?.entity?.type || this.detail?.entity?.raw?.type,
            modified: this.detail?.entity?.modified || this.detail?.entity?.raw?.modified
        };
    }
    get rawPayload() {
        const payload = this.detail?.entity?.raw ?? this.detail?.entity;
        try {
            return JSON.stringify(payload, null, 2);
        }
        catch {
            return String(payload ?? '');
        }
    }
    get reportSummary() {
        if (!this.isReportEntity) {
            return null;
        }
        const raw = this.detail?.entity?.raw ?? {};
        const source = (raw?.summary || raw?.snippet || raw?.description || this.detail?.entity?.secondary || '').toString().trim();
        if (!source) {
            return null;
        }
        return source.length > 900 ? `${source.slice(0, 900)}...` : source;
    }
    get reportModule() {
        if (!this.isReportEntity) {
            return null;
        }
        const raw = this.detail?.entity?.raw ?? {};
        const value = (raw?.intelligenceModule || '').toString().trim();
        return value ? value : null;
    }
    get reportLink() {
        if (!this.isReportEntity) {
            return null;
        }
        const raw = this.detail?.entity?.raw ?? {};
        const value = (raw?.sourceLink || '').toString().trim();
        return value ? value : null;
    }
    get normalizedReportLink() {
        return this.normalizeExternalUrl(this.reportLink);
    }
    get reportEntityTypeCounts() {
        const raw = this.detail?.entity?.raw ?? {};
        const rows = Array.isArray(raw?.entityTypeCounts) ? raw.entityTypeCounts : [];
        return rows
            .map((row) => ({
            type: String(row?.type ?? '').trim(),
            count: Number(row?.count ?? 0)
        }))
            .filter((row) => row.type.length > 0 && row.count > 0);
    }
    get reportRelationshipTypeCounts() {
        const raw = this.detail?.entity?.raw ?? {};
        const rows = Array.isArray(raw?.relationshipTypeCounts) ? raw.relationshipTypeCounts : [];
        return rows
            .map((row) => ({
            relationshipType: String(row?.relationshipType ?? '').trim(),
            count: Number(row?.count ?? 0)
        }))
            .filter((row) => row.relationshipType.length > 0 && row.count > 0);
    }
    get contextLoading() {
        return Boolean(this.detail?.entity?.raw?.contextLoading);
    }
    get contextError() {
        const value = this.detail?.entity?.raw?.contextError;
        return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
    }
    get matchedNodeCount() {
        const value = this.detail?.entity?.raw?.matchedNodeCount;
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
    }
    get relatedReports() {
        const rows = Array.isArray(this.detail?.entity?.raw?.relatedReports) ? this.detail.entity.raw.relatedReports : [];
        return rows
            .map((row) => ({
            id: row?.id ?? null,
            name: String(row?.name ?? '').trim(),
            modified: typeof row?.modified === 'string' ? row.modified : null,
            sourceName: typeof row?.sourceName === 'string' ? row.sourceName : null,
            sourceLink: typeof row?.sourceLink === 'string' ? row.sourceLink : null,
            relationshipTypes: Array.isArray(row?.relationshipTypes)
                ? row.relationshipTypes.map((rel) => String(rel ?? '').trim()).filter((rel) => rel.length > 0)
                : [],
            mentions: Number(row?.mentions ?? 0)
        }))
            .filter((row) => row.name.length > 0);
    }
    get relatedIocs() {
        const rows = Array.isArray(this.detail?.entity?.raw?.relatedIocs) ? this.detail.entity.raw.relatedIocs : [];
        return rows
            .map((row) => ({
            id: row?.id ?? null,
            type: String(row?.type ?? '').trim(),
            name: typeof row?.name === 'string' ? row.name : null,
            value: typeof row?.value === 'string' ? row.value : null,
            pattern: typeof row?.pattern === 'string' ? row.pattern : null,
            modified: typeof row?.modified === 'string' ? row.modified : null,
            relationshipTypes: Array.isArray(row?.relationshipTypes)
                ? row.relationshipTypes.map((rel) => String(rel ?? '').trim()).filter((rel) => rel.length > 0)
                : [],
            references: Number(row?.references ?? 0)
        }))
            .filter((row) => row.type.length > 0 && Boolean((row.name || row.value || row.pattern || '').toString().trim()));
    }
    getRelatedIocPrimary(item) {
        return (item.name || item.value || item.pattern || 'Unnamed related IOC').toString();
    }
    getRelatedIocSecondary(item) {
        const primary = this.getRelatedIocPrimary(item);
        const value = (item.value || '').toString().trim();
        const pattern = (item.pattern || '').toString().trim();
        if (value && value !== primary) {
            return value;
        }
        if (pattern && pattern !== primary) {
            return pattern;
        }
        return undefined;
    }
    onClose(event) {
        event?.stopPropagation();
        this.close.emit();
    }
    onAddToFilters() {
        this.addToFilters.emit();
    }
    onRelatedIocSelect(item, event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.pivotToIoc.emit({
            primary: this.getRelatedIocPrimary(item),
            secondary: this.getRelatedIocSecondary(item),
            modified: item.modified ?? undefined,
            report: this.detail?.entity?.report,
            type: item.type,
            groupLabel: this.detail?.groupLabel,
            relationshipType: Array.isArray(item.relationshipTypes) && item.relationshipTypes.length
                ? item.relationshipTypes[0]
                : undefined,
            raw: {
                id: item.id ?? null,
                type: item.type,
                name: item.name ?? null,
                value: item.value ?? null,
                pattern: item.pattern ?? null,
                modified: item.modified ?? null,
                relationshipTypes: Array.isArray(item.relationshipTypes) ? item.relationshipTypes : [],
                references: Number(item.references ?? 0)
            }
        });
    }
    onRelatedIocKeydown(item, event) {
        const key = event.key;
        if (key !== 'Enter' && key !== ' ') {
            return;
        }
        this.onRelatedIocSelect(item, event);
    }
    onRelatedIocPointer(item, event) {
        this.onRelatedIocSelect(item, event);
    }
    onRelatedReportSelect(report, event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.pivotToIoc.emit({
            primary: (report?.name || 'Unknown report').toString(),
            secondary: report?.sourceName ? `Source: ${report.sourceName}` : undefined,
            report: report?.name,
            modified: report?.modified ?? undefined,
            type: 'report',
            groupLabel: this.detail?.groupLabel,
            relationshipType: Array.isArray(report?.relationshipTypes) && report.relationshipTypes.length
                ? report.relationshipTypes[0]
                : undefined,
            raw: {
                id: report?.id ?? null,
                type: 'report',
                name: report?.name ?? null,
                sourceName: report?.sourceName ?? null,
                sourceLink: report?.sourceLink ?? null,
                modified: report?.modified ?? null,
                relationshipTypes: Array.isArray(report?.relationshipTypes) ? report.relationshipTypes : [],
                mentions: Number(report?.mentions ?? 0)
            }
        });
    }
    onRelatedReportKeydown(report, event) {
        const key = event.key;
        if (key !== 'Enter' && key !== ' ') {
            return;
        }
        this.onRelatedReportSelect(report, event);
    }
    onTrailSelect(index, event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.trailSelect.emit(index);
    }
    normalizeExternalUrl(value) {
        const raw = (value ?? '').toString().trim();
        if (!raw) {
            return null;
        }
        if (/^(https?:|mailto:|tel:)/i.test(raw)) {
            return raw;
        }
        if (raw.startsWith('//')) {
            return `https:${raw}`;
        }
        return `https://${raw.replace(/^\/+/, '')}`;
    }
    onOpenExternal(value, event) {
        event?.stopPropagation();
        const url = this.normalizeExternalUrl(value);
        if (!url) {
            return;
        }
        event?.preventDefault();
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.style.display = 'none';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        }
        this.close.emit();
    }
    getTrailGlyph(type) {
        const raw = (type || '').toString().trim().toLowerCase();
        if (!raw) {
            return 'IO';
        }
        const parts = raw.split(/[^a-z0-9]+/g).filter(Boolean);
        if (!parts.length) {
            return raw.slice(0, 2).toUpperCase();
        }
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    formatRelationLabel(value) {
        const raw = (value || '').toString().trim();
        if (!raw) {
            return '';
        }
        return raw
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }
};
__decorate([
    Input()
], IocDetailDialogComponent.prototype, "detail", void 0);
__decorate([
    Input()
], IocDetailDialogComponent.prototype, "pivotTrail", void 0);
__decorate([
    Output()
], IocDetailDialogComponent.prototype, "close", void 0);
__decorate([
    Output()
], IocDetailDialogComponent.prototype, "addToFilters", void 0);
__decorate([
    Output()
], IocDetailDialogComponent.prototype, "trailSelect", void 0);
__decorate([
    Output()
], IocDetailDialogComponent.prototype, "pivotToIoc", void 0);
IocDetailDialogComponent = __decorate([
    Component({
        selector: 'app-ioc-detail-dialog',
        templateUrl: './ioc-detail-dialog.component.html',
        styleUrls: ['./ioc-detail-dialog.component.scss']
    })
], IocDetailDialogComponent);
export { IocDetailDialogComponent };
//# sourceMappingURL=ioc-detail-dialog.component.js.map
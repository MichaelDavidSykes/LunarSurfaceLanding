import { __decorate } from "tslib";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { formatDate } from "@angular/common";
export function renderQueryPreview(groups, dateRange, options) {
    if (options?.multiline) {
        return renderDetailedQueryPreview(groups, dateRange);
    }
    const entityPhrase = buildEntityPhrase(groups);
    const datePhrase = buildDatePhrase(dateRange);
    let description = "Reports";
    if (entityPhrase) {
        description += ` involving ${entityPhrase}`;
    }
    if (datePhrase) {
        description += ` ${datePhrase}`;
    }
    if (!entityPhrase && !datePhrase) {
        description += " overview";
    }
    return description.trim();
}
function renderDetailedQueryPreview(groups, dateRange) {
    const lines = ["Reports"];
    const conditionLines = buildEntityPhraseLines(groups);
    const datePhrase = buildDatePhrase(dateRange);
    if (conditionLines.length) {
        lines.push("Conditions:");
        conditionLines.forEach(line => lines.push(`- ${line}`));
    }
    if (datePhrase) {
        lines.push(`Date: ${datePhrase}`);
    }
    if (!conditionLines.length && !datePhrase) {
        lines.push("Overview");
    }
    return lines.join("\n");
}
function buildEntityPhrase(groups) {
    return buildEntityPhraseLines(groups).join(" ");
}
function buildEntityPhraseLines(groups) {
    if (!groups.length) {
        return [];
    }
    const lines = [];
    groups.forEach((group, index) => {
        const clauseParts = (group.clauses ?? [])
            .map(clause => describeClause(clause))
            .filter(Boolean);
        const clauseText = clauseParts.join(` ${group.clauseLogic.toLowerCase()} `);
        const groupedClauseText = clauseParts.length > 1 ? `(${clauseText})` : clauseText;
        const nodeName = toTitleCase(group.nodeType);
        const segmentCore = groupedClauseText ? `${nodeName} where ${groupedClauseText}` : nodeName;
        const segment = `(${segmentCore})`;
        if (!segment) {
            return;
        }
        if (!lines.length) {
            lines.push(segment);
            return;
        }
        const previousGroup = groups[index - 1];
        const joinWith = previousGroup?.joinWith?.toUpperCase() ?? "AND";
        lines.push(`${joinWith} ${segment}`);
    });
    return lines;
}
function buildDatePhrase(dateRange) {
    const start = parseDateString(dateRange?.start);
    const end = parseDateString(dateRange?.end);
    if (!start && !end) {
        return "";
    }
    if (start && end) {
        const startLabel = formatDate(start, "MMM d, y", "en-US", "UTC");
        const endLabel = formatDate(end, "MMM d, y", "en-US", "UTC");
        if (startLabel === endLabel) {
            return `on ${startLabel}`;
        }
        return `between ${startLabel} and ${endLabel}`;
    }
    if (start) {
        const startLabel = formatDate(start, "MMM d, y", "en-US", "UTC");
        return `from ${startLabel}`;
    }
    const endLabel = formatDate(end, "MMM d, y", "en-US", "UTC");
    return `up to ${endLabel}`;
}
function describeClause(clause) {
    const field = clause.field?.trim();
    const value = clause.value?.toString().trim();
    if (!field) {
        return "";
    }
    const operatorText = describeOperator(clause.operator);
    const valueText = value ? `"${value}"` : "*";
    return `${field} ${operatorText} ${valueText}`;
}
function describeOperator(operator) {
    switch (operator) {
        case "startsWith":
            return "starts with";
        case "endsWith":
            return "ends with";
        case "matches":
            return "matches";
        case "contains":
            return "contains";
        case "in":
            return "is in";
        case "equals":
        default:
            return "equals";
    }
}
function toTitleCase(value) {
    return value
        ?.split(/[^a-z0-9]+/gi)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "Entity";
}
function parseDateString(value) {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
}
let QueryBuilderComponent = class QueryBuilderComponent {
    constructor(fb) {
        this.fb = fb;
        this.queryChange = new EventEmitter();
        this.applyQuery = new EventEmitter();
        this.close = new EventEmitter();
        this.nodeTypes = [
            "ipv4-addr",
            "attack-pattern",
            "course-of-action",
            "identity",
            "indicator",
            "report",
            "tool",
            "file",
            "malware",
            "infrastructure",
            "threat-actor",
            "location",
            "campaign",
            "intrusion-set",
            "organization",
            "directory",
            "domain-name",
            "url",
            "email-addr",
            "marking-definition",
            "windows-registry-key",
            "extension-definition",
            "phone-number"
        ];
        this.defaultFields = [
            "name",
            "description",
            "type",
            "id",
            "created",
            "modified"
        ];
        this.fieldDictionary = {
            campaign: [
                "name",
                "aliases",
                "objective",
                "first_seen",
                "last_seen",
                "created",
                "modified"
            ],
            "threat-actor": [
                "name",
                "aliases",
                "roles",
                "sophistication",
                "first_seen",
                "last_seen"
            ],
            malware: [
                "name",
                "malware_types",
                "is_family",
                "last_seen",
                "architecture_execution_envs"
            ],
            "attack-pattern": [
                "name",
                "description",
                "kill_chain_phases",
                "external_references",
                "x_mitre_id"
            ],
            indicator: [
                "name",
                "value",
                "pattern",
                "pattern_type",
                "valid_from",
                "valid_until"
            ],
            report: [
                "name",
                "published",
                "description",
                "confidence",
                "intelligence_module",
                "created",
                "modified"
            ],
            infrastructure: [
                "name",
                "infrastructure_types",
                "description",
                "first_seen",
                "last_seen"
            ],
            location: [
                "name",
                "country",
                "region",
                "latitude",
                "longitude"
            ],
            identity: [
                "name",
                "identity_class",
                "sectors",
                "country",
                "created"
            ],
            organization: [
                "name",
                "industry",
                "country",
                "description"
            ],
            tool: [
                "name",
                "tool_types",
                "description",
                "created",
                "modified"
            ],
            "ipv4-addr": [
                "value",
                "belongs_to_ref",
                "created",
                "modified"
            ],
            "domain-name": [
                "value",
                "resolves_to_refs",
                "created",
                "modified"
            ],
            url: [
                "value",
                "x_tls_certificate",
                "created",
                "modified"
            ],
            "email-addr": [
                "value",
                "display_name",
                "belongs_to_ref"
            ],
            file: [
                "name",
                "hashes",
                "size",
                "mime_type"
            ],
            "windows-registry-key": [
                "key",
                "values",
                "modified"
            ]
        };
        this.operators = [
            "equals",
            "contains",
            "startsWith",
            "endsWith",
            "in",
            "matches"
        ];
        this.logicOptions = ["AND", "OR"];
        this.builderForm = this.fb.group({
            dateRange: this.fb.group({
                start: [null],
                end: [null]
            }),
            groups: this.fb.array([])
        });
        this.groupIdCounter = 0;
        this.currentPreview = "";
        this.dayMs = 24 * 60 * 60 * 1000;
        this.sliderMin = 0;
        this.sliderMax = 0;
        this.sliderStartValue = 0;
        this.sliderEndValue = 0;
        this.dateRangeReady = false;
        this.lastEmittedSliderRange = null;
        this.dateFormatter = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC"
        });
        this.syncDateSliderFromSources(false);
    }
    ngOnChanges(changes) {
        if (changes["initialQuery"] && changes["initialQuery"].currentValue) {
            this.loadQuery(changes["initialQuery"].currentValue);
        }
        if ("dateRangeStart" in changes ||
            "dateRangeEnd" in changes ||
            "dateRangeMin" in changes ||
            "dateRangeMax" in changes) {
            this.syncDateSliderFromSources(false);
            this.emitQuery();
        }
    }
    get groups() {
        return this.builderForm.get("groups");
    }
    get dateRangeGroup() {
        return this.builderForm.get("dateRange");
    }
    getClauses(groupIndex) {
        return this.groups.at(groupIndex).get("clauses");
    }
    addGroup(joinWith = "AND") {
        const groupCount = this.groups.length;
        if (groupCount > 0) {
            const previousGroup = this.groups.at(groupCount - 1);
            previousGroup.get("joinWith")?.setValue(joinWith);
        }
        this.groups.push(this.createGroup());
        this.realignClausesToNode(this.groups.length - 1);
        this.emitQuery();
    }
    removeGroup(index) {
        if (this.groups.length === 0 || index < 0 || index >= this.groups.length) {
            return;
        }
        const removed = this.groups.at(index);
        const removedJoin = removed.get("joinWith")?.value;
        this.groups.removeAt(index);
        if (this.groups.length > 0) {
            if (index > 0 && index < this.groups.length) {
                const previousGroup = this.groups.at(index - 1);
                previousGroup.get("joinWith")?.setValue(removedJoin ?? "AND");
            }
            else if (index > 0 && index === this.groups.length) {
                const previousGroup = this.groups.at(index - 1);
                previousGroup.get("joinWith")?.setValue("AND");
            }
        }
        this.emitQuery();
    }
    setGroupJoin(index, join) {
        const group = this.groups.at(index);
        if (group.get("joinWith")?.value !== join) {
            group.get("joinWith")?.setValue(join);
            this.emitQuery();
        }
    }
    addClauseToGroup(groupIndex) {
        const group = this.groups.at(groupIndex);
        const nodeType = group.get("nodeType")?.value;
        this.getClauses(groupIndex).push(this.createClause(nodeType));
        this.emitQuery();
    }
    removeClauseFromGroup(groupIndex, clauseIndex) {
        const clauses = this.getClauses(groupIndex);
        if (clauses.length <= 1) {
            return;
        }
        clauses.removeAt(clauseIndex);
        this.emitQuery();
    }
    toggleClauseLogic(groupIndex) {
        const group = this.groups.at(groupIndex);
        const current = group.get("clauseLogic")?.value ?? "AND";
        const next = current === "AND" ? "OR" : "AND";
        group.get("clauseLogic")?.setValue(next);
        this.emitQuery();
    }
    onNodeTypeChange(groupIndex, nodeType) {
        const group = this.groups.at(groupIndex);
        group.get("nodeType")?.setValue(nodeType);
        this.realignClausesToNode(groupIndex);
        this.emitQuery();
    }
    onDateRangeSliderChange() {
        if (!this.dateRangeReady) {
            return;
        }
        this.ensureSliderOrdering();
        const currentRange = { start: this.sliderStartValue, end: this.sliderEndValue };
        if (this.lastEmittedSliderRange &&
            this.lastEmittedSliderRange.start === currentRange.start &&
            this.lastEmittedSliderRange.end === currentRange.end) {
            return;
        }
        this.updateDateFormFromSlider(true);
        this.lastEmittedSliderRange = { ...currentRange };
    }
    apply() {
        const result = this.emitQuery();
        if (result) {
            this.applyQuery.emit(result);
        }
        this.close.emit();
    }
    cancel() {
        this.close.emit();
    }
    availableFields(groupIndex) {
        const nodeType = this.groups.at(groupIndex)?.get("nodeType")?.value;
        return this.fieldDictionary[nodeType] ?? this.defaultFields;
    }
    createGroup(seed) {
        const nodeType = seed?.nodeType ?? "report";
        return this.fb.group({
            id: [seed?.id ?? this.generateGroupId()],
            nodeType: [nodeType],
            clauseLogic: [seed?.clauseLogic ?? "AND"],
            joinWith: [seed?.joinWith ?? "AND"],
            clauses: this.fb.array((seed?.clauses?.length ? seed.clauses : [this.createClauseValue(nodeType)])
                .map(clause => this.createClause(nodeType, clause)))
        });
    }
    createClause(nodeType, clause) {
        const fields = this.fieldDictionary[nodeType] ?? this.defaultFields;
        const defaultField = fields[0] ?? this.defaultFields[0];
        return this.fb.group({
            field: [clause?.field ?? defaultField],
            operator: [clause?.operator ?? "equals"],
            value: [clause?.value ?? ""]
        });
    }
    createClauseValue(nodeType) {
        const fields = this.fieldDictionary[nodeType] ?? this.defaultFields;
        const defaultField = fields[0] ?? this.defaultFields[0];
        return {
            field: defaultField,
            operator: "equals",
            value: ""
        };
    }
    loadQuery(query) {
        this.groups.clear();
        this.dateRangeGroup.patchValue({
            start: query?.dateRange?.start ?? null,
            end: query?.dateRange?.end ?? null
        });
        if (query?.groups?.length) {
            query.groups.forEach(group => {
                this.groups.push(this.createGroup(group));
            });
        }
        this.syncDateSliderFromSources(false);
        this.emitQuery();
    }
    emitQuery() {
        const dateRange = this.dateRangeGroup.value;
        const groups = this.groups.controls.map((control, index) => {
            const group = control;
            const nodeType = group.get("nodeType")?.value;
            const clauseLogic = group.get("clauseLogic")?.value;
            const joinWith = index < this.groups.length - 1
                ? group.get("joinWith")?.value
                : undefined;
            const clausesArray = group.get("clauses");
            const clauses = clausesArray.controls.map(clauseControl => {
                const clauseGroup = clauseControl;
                return {
                    field: clauseGroup.get("field")?.value,
                    operator: clauseGroup.get("operator")?.value,
                    value: clauseGroup.get("value")?.value
                };
            });
            return {
                id: group.get("id")?.value,
                nodeType,
                clauseLogic,
                joinWith,
                clauses
            };
        });
        const preview = renderQueryPreview(groups, dateRange);
        this.currentPreview = preview;
        const result = {
            groups,
            dateRange,
            preview
        };
        this.queryChange.emit(result);
        return result;
    }
    realignClausesToNode(groupIndex) {
        const group = this.groups.at(groupIndex);
        if (!group) {
            return;
        }
        const nodeType = group.get("nodeType")?.value;
        const validFields = this.fieldDictionary[nodeType] ?? this.defaultFields;
        const preferredField = validFields[0] ?? this.defaultFields[0];
        const clauses = group.get("clauses");
        clauses.controls.forEach(control => {
            const clauseGroup = control;
            const fieldControl = clauseGroup.get("field");
            if (!fieldControl) {
                return;
            }
            const currentValue = fieldControl.value;
            if (!validFields.includes(currentValue)) {
                fieldControl.setValue(preferredField);
            }
        });
    }
    generateGroupId() {
        this.groupIdCounter += 1;
        return `group-${Date.now()}-${this.groupIdCounter}`;
    }
    get dateRangeLabel() {
        if (!this.dateRangeReady) {
            return "";
        }
        const startLabel = this.dateFormatter.format(this.sliderStartValue);
        const endLabel = this.dateFormatter.format(this.sliderEndValue);
        return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
    }
    syncDateSliderFromSources(triggerEmit) {
        const min = this.getAlignedTimestamp(this.dateRangeMin, "floor") ?? this.defaultMinTimestamp();
        const max = this.getAlignedTimestamp(this.dateRangeMax, "ceil") ?? this.defaultMaxTimestamp();
        let sliderMin = min;
        let sliderMax = max;
        if (sliderMin >= sliderMax) {
            sliderMax = sliderMin + 30 * this.dayMs;
        }
        this.sliderMin = sliderMin;
        this.sliderMax = sliderMax;
        const formRange = this.dateRangeGroup.value;
        const startCandidate = this.getAlignedTimestamp(formRange.start, "floor") ??
            this.getAlignedTimestamp(this.dateRangeStart, "floor") ??
            sliderMin;
        const endCandidate = this.getAlignedTimestamp(formRange.end, "floor") ??
            this.getAlignedTimestamp(this.dateRangeEnd, "floor") ??
            sliderMax;
        this.sliderStartValue = this.clampToSlider(startCandidate);
        this.sliderEndValue = this.clampToSlider(endCandidate);
        this.ensureSliderOrdering();
        this.dateRangeReady = true;
        this.updateDateFormFromSlider(triggerEmit);
        this.lastEmittedSliderRange = {
            start: this.sliderStartValue,
            end: this.sliderEndValue
        };
    }
    updateDateFormFromSlider(triggerEmit) {
        const startDate = new Date(this.sliderStartValue);
        const endDate = new Date(this.sliderEndValue);
        const startValue = formatDate(startDate, "yyyy-MM-dd", "en-US", "UTC");
        const endValue = formatDate(endDate, "yyyy-MM-dd", "en-US", "UTC");
        this.dateRangeGroup.patchValue({
            start: startValue,
            end: endValue
        }, { emitEvent: false });
        if (triggerEmit) {
            this.emitQuery();
        }
    }
    defaultMaxTimestamp() {
        return this.alignToDay(Date.now(), "floor");
    }
    defaultMinTimestamp() {
        return this.alignToDay(Date.now() - 30 * this.dayMs, "floor");
    }
    clampToSlider(value) {
        if (!Number.isFinite(value ?? NaN)) {
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
    getAlignedTimestamp(value, direction) {
        if (value == null) {
            return null;
        }
        if (typeof value === "number" && Number.isFinite(value)) {
            return this.alignToDay(value, direction);
        }
        const date = value instanceof Date ? value : new Date(value);
        const timestamp = date.getTime();
        if (!Number.isFinite(timestamp)) {
            return null;
        }
        return this.alignToDay(timestamp, direction);
    }
    alignToDay(timestamp, direction) {
        const remainder = timestamp % this.dayMs;
        if (remainder === 0) {
            return timestamp;
        }
        return direction === "floor"
            ? timestamp - remainder
            : timestamp + (this.dayMs - remainder);
    }
};
__decorate([
    Input()
], QueryBuilderComponent.prototype, "initialQuery", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "dateRangeStart", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "dateRangeEnd", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "dateRangeMin", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "dateRangeMax", void 0);
__decorate([
    Output()
], QueryBuilderComponent.prototype, "queryChange", void 0);
__decorate([
    Output()
], QueryBuilderComponent.prototype, "applyQuery", void 0);
__decorate([
    Output()
], QueryBuilderComponent.prototype, "close", void 0);
QueryBuilderComponent = __decorate([
    Component({
        selector: "app-query-builder",
        templateUrl: "./query-builder.component.html",
        styleUrls: ["./query-builder.component.scss"]
    })
], QueryBuilderComponent);
export { QueryBuilderComponent };
//# sourceMappingURL=query-builder.component.js.map
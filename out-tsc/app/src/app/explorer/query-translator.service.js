import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
let QueryTranslatorService = class QueryTranslatorService {
    /**
     * Translates QueryGroups into AQL filter conditions
     * @param groups Array of QueryGroups from the query builder
     * @param entityAlias The alias used for the entity in the AQL query (e.g., 'r' for reports, 'entity' for entities)
     * @returns AQL filter string or null if no groups
     */
    translateGroupsToAql(groups, entityAlias) {
        if (!groups || groups.length === 0) {
            return null;
        }
        const groupFilters = groups.map(group => this.translateGroupToAql(group, entityAlias));
        return groupFilters.join(' ');
    }
    /**
     * Translates a single QueryGroup into AQL filter conditions
     */
    translateGroupToAql(group, entityAlias) {
        const nodeTypeFilter = `${entityAlias}.type == '${group.nodeType}'`;
        if (!group.clauses || group.clauses.length === 0) {
            return nodeTypeFilter;
        }
        const clauseFilters = group.clauses
            .map(clause => this.translateClauseToAql(clause, entityAlias))
            .filter(Boolean);
        if (clauseFilters.length === 0) {
            return nodeTypeFilter;
        }
        const clauseLogic = group.clauseLogic.toLowerCase();
        const clauseFilter = clauseFilters.join(` ${clauseLogic} `);
        return `(${nodeTypeFilter} AND (${clauseFilter}))`;
    }
    /**
     * Translates a single QueryClause into AQL filter condition
     */
    translateClauseToAql(clause, entityAlias) {
        if (!clause.field || !clause.value) {
            return null;
        }
        const field = clause.field;
        const value = clause.value.trim();
        const operator = clause.operator;
        if (!value) {
            return null;
        }
        // Escape single quotes in values
        const escapedValue = value.replace(/'/g, "\\'");
        switch (operator) {
            case 'equals':
                return `${entityAlias}.${field} == '${escapedValue}'`;
            case 'contains':
                return `CONTAINS(${entityAlias}.${field}, '${escapedValue}')`;
            case 'startsWith':
                return `STARTS_WITH(${entityAlias}.${field}, '${escapedValue}')`;
            case 'endsWith':
                return `ENDS_WITH(${entityAlias}.${field}, '${escapedValue}')`;
            case 'matches':
                return `${entityAlias}.${field} =~ '${escapedValue}'`;
            case 'in':
                // Handle comma-separated values for 'in' operator
                const values = escapedValue.split(',').map(v => `'${v.trim()}'`).join(', ');
                return `${entityAlias}.${field} IN [${values}]`;
            default:
                return `${entityAlias}.${field} == '${escapedValue}'`;
        }
    }
    /**
     * Builds a complete AQL filter string with group joins
     * @param groups Array of QueryGroups
     * @param entityAlias The entity alias in the AQL query
     * @returns Complete AQL filter string or null
     */
    buildCompleteFilter(groups, entityAlias) {
        if (!groups || groups.length === 0) {
            return null;
        }
        const groupFilters = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const groupFilter = this.translateGroupToAql(group, entityAlias);
            if (groupFilter) {
                groupFilters.push(groupFilter);
                // Add join logic between groups (except for the last group)
                if (i < groups.length - 1 && group.joinWith) {
                    groupFilters.push(group.joinWith);
                }
            }
        }
        return groupFilters.length > 0 ? groupFilters.join(' ') : null;
    }
    /**
     * Checks if the query groups would filter for specific entity types
     * @param groups Array of QueryGroups
     * @returns Array of unique node types being filtered
     */
    getFilteredNodeTypes(groups) {
        if (!groups || groups.length === 0) {
            return [];
        }
        return [...new Set(groups.map(group => group.nodeType))];
    }
    /**
     * Determines if a query has any meaningful filters (beyond just node type)
     * @param groups Array of QueryGroups
     * @returns true if query has field-based filters
     */
    hasFieldFilters(groups) {
        if (!groups || groups.length === 0) {
            return false;
        }
        return groups.some(group => group.clauses && group.clauses.some(clause => clause.field && clause.value && clause.value.trim()));
    }
};
QueryTranslatorService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], QueryTranslatorService);
export { QueryTranslatorService };
//# sourceMappingURL=query-translator.service.js.map
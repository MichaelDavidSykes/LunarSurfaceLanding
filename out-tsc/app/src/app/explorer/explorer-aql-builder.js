const countryDisplayNames = typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;
const legacyIsoAliasToCanonical = {
    SU: 'RU',
    UK: 'GB'
};
const isoCountryValueAliases = {
    US: ['us', 'usa', 'united states', 'united states of america'],
    GB: ['gb', 'uk', 'great britain', 'united kingdom'],
    RU: ['ru', 'russia', 'russian federation'],
    IR: ['ir', 'iran', 'iran, islamic republic of'],
    SA: ['sa', 'saudi arabia', 'kingdom of saudi arabia']
};
const countryNameToIso = (() => {
    const map = new Map();
    if (countryDisplayNames) {
        for (let i = 65; i <= 90; i += 1) {
            for (let j = 65; j <= 90; j += 1) {
                const code = String.fromCharCode(i) + String.fromCharCode(j);
                const name = countryDisplayNames.of(code);
                if (typeof name === 'string' && name.trim()) {
                    map.set(name.trim().toLowerCase(), code);
                }
            }
        }
    }
    // Common aliases we frequently see in user-entered filters.
    map.set('usa', 'US');
    map.set('u.s.', 'US');
    map.set('u.s.a.', 'US');
    map.set('uk', 'GB');
    map.set('u.k.', 'GB');
    map.set('great britain', 'GB');
    map.set('england', 'GB');
    map.set('iran, islamic republic of', 'IR');
    map.set('russia', 'RU');
    map.set('russian federation', 'RU');
    map.set('south korea', 'KR');
    map.set('north korea', 'KP');
    map.set('syria', 'SY');
    map.set('venezuela', 'VE');
    return map;
})();
function resolveIsoFromCountryLikeInput(rawValue) {
    const normalized = String(rawValue || '').trim().toLowerCase();
    if (!normalized) {
        return null;
    }
    if (/^[a-z]{2}$/.test(normalized)) {
        const code = normalized.toUpperCase();
        return legacyIsoAliasToCanonical[code] ?? code;
    }
    const resolved = countryNameToIso.get(normalized);
    if (!resolved) {
        return null;
    }
    return legacyIsoAliasToCanonical[resolved] ?? resolved;
}
function getCountryFilterAliases(code, countryName) {
    const normalizedCode = (code || '').trim().toUpperCase();
    const aliases = new Set();
    aliases.add(normalizedCode.toLowerCase());
    const known = isoCountryValueAliases[normalizedCode] ?? [];
    for (const alias of known) {
        const value = String(alias || '').trim().toLowerCase();
        if (value) {
            aliases.add(value);
        }
    }
    if (countryName && String(countryName).trim()) {
        aliases.add(String(countryName).trim().toLowerCase());
    }
    return Array.from(aliases);
}
export function buildExplorerLocationIocsAql(params) {
    const activeGroups = (params.groups ?? []).filter(group => group?.nodeType && Array.isArray(group.clauses) && group.clauses.length > 0);
    if (!activeGroups.length) {
        return buildReportFirstExplorerAql(params);
    }
    if (hasAnchoredNodeGroups(activeGroups)) {
        return buildAnchoredExplorerAql(params, activeGroups);
    }
    return buildReportFirstExplorerAql(params);
}
function hasAnchoredNodeGroups(groups) {
    return (groups ?? []).some(group => (group?.nodeType || '').trim().toLowerCase() !== 'report');
}
function buildReportFirstExplorerAql(params) {
    const { startIso, endIso, dynamicEndDate, groups, fullEntityTypeList } = params;
    const hasMixedLocationOr = hasMixedLocationWithOrJoin(groups);
    const applyEntityMatchFilters = !hasMixedLocationOr;
    const reportFilter = buildQueryFilterExpression(groups, 'reportDoc', !hasMixedLocationOr);
    const matchEntityFilter = applyEntityMatchFilters
        ? buildRelatedEntityFilterFragment(groups, 'entity', '      ', undefined, false, true)
        : '';
    const projectedEntityFilter = applyEntityMatchFilters
        ? buildRelatedEntityFilterFragment(groups, 'entity', '      ', undefined, false, true)
        : '';
    const locationSelectionFilter = hasMixedLocationOr ? '' : buildLocationSelectionFilterExpression(groups, 'normalizedLocation');
    const locationCandidatePrefilter = hasMixedLocationOr ? '' : buildLocationCandidatePrefilter(groups, 'reportDoc');
    const isDefaultQuery = (groups?.length ?? 0) === 0;
    const uniqueEntityTypes = Array.from(new Set(fullEntityTypeList));
    const defaultEntityProjectionDenylist = new Set(['identity', 'relationship', 'marking-definition']);
    const projectedEntityTypes = isDefaultQuery
        ? uniqueEntityTypes.filter(type => !defaultEntityProjectionDenylist.has(String(type).toLowerCase()))
        : uniqueEntityTypes;
    const allowedEntityTypesLiteral = `[${(projectedEntityTypes.length ? projectedEntityTypes : uniqueEntityTypes).map(type => `"${type}"`).join(', ')}]`;
    const allowedEntityRelationshipTypesLiteral = `["object", "references", "related-to", "uses", "targets", "attributed-to", "indicates", "located-at", "duplicate-of", "correlates-with"]`;
    const entityTraversalDepth = isDefaultQuery ? '1..1' : '1..2';
    const requiresEntityMatch = applyEntityMatchFilters && hasEntityFilters(groups);
    const entityProjectionTraversalLimit = requiresEntityMatch ? 400 : 160;
    // Keep the graph aggregation bounded while allowing a denser default globe.
    const candidateLimit = 75;
    const candidatePrefilterLimit = 140;
    const recentReportScanLimit = 500;
    const endBoundExpr = dynamicEndDate ? 'DATE_ISO8601(DATE_NOW())' : `"${endIso}"`;
    return `LET recentReports = (
  FOR reportDoc IN nodes_vertex_collection
    FILTER reportDoc.type == 'report' AND reportDoc._is_latest == true
      AND reportDoc.created >= "${startIso}"
      AND reportDoc.created <= ${endBoundExpr}
    SORT reportDoc.modified DESC
    LIMIT ${recentReportScanLimit}
    RETURN reportDoc
)

LET candidateReports = (
  FOR reportDoc IN recentReports
    ${reportFilter ? `FILTER ${reportFilter}` : ''}
    ${locationCandidatePrefilter ? `FILTER ${locationCandidatePrefilter}` : ''}
    LET reportTitle = LOWER(TO_STRING(reportDoc.name))
    LET locationInfo = FIRST(
      FOR v, e, p IN 1..2 ANY reportDoc._id GRAPH 'lunargraph_graph'
        PRUNE LENGTH(p.vertices) == 2
          AND LOWER(TO_STRING(v.type)) IN ["marking-definition", "identity"]
        FILTER v.type == 'location'
        LET relType = LOWER(TO_STRING(e.relationship_type))
        LET edgeType = LOWER(TO_STRING(e.type))
        LET locationName = LOWER(TRIM(TO_STRING(v.name)))
        LET isLocatedAt = relType == 'located-at' OR edgeType == 'located-at'
        LET isObjectMarking = relType == 'object-marking' OR edgeType == 'object-marking'
        LET titleMatch = LENGTH(locationName) >= 3 AND CONTAINS(reportTitle, locationName)
        LET priority = isLocatedAt ? 3 : (titleMatch ? 2 : (!isObjectMarking ? 1 : 0))
        FILTER priority > 0
        SORT priority DESC, LENGTH(locationName) DESC, v.modified DESC
        LIMIT 1
        RETURN {
          country: v.country ? v.country : (titleMatch AND LENGTH(locationName) == 2 ? UPPER(locationName) : null),
          name: v.name
        }
    )
    LET normalizedLocation = locationInfo != null
      ? locationInfo
      : { country: "unknown", name: "Unknown / Unmapped" }
    ${locationSelectionFilter ? `FILTER ${locationSelectionFilter}` : ''}
    LIMIT ${locationCandidatePrefilter ? candidatePrefilterLimit : candidateLimit}
    RETURN {
      reportDoc,
      normalizedLocation
    }
)

FOR candidate IN candidateReports
  LET reportDoc = candidate.reportDoc
  LET normalizedLocation = candidate.normalizedLocation
  FILTER normalizedLocation.country != "unknown" AND normalizedLocation.country != null

  LET hasMatchingEntities = ${requiresEntityMatch ? `LENGTH(
    FOR entity, e, p IN ${entityTraversalDepth} OUTBOUND reportDoc._id GRAPH 'lunargraph_graph'
      PRUNE LENGTH(p.vertices) == 2
        AND LOWER(TO_STRING(entity.type)) IN ["marking-definition", "identity", "report"]
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : null)))
      FILTER relType IN ${allowedEntityRelationshipTypesLiteral}
      FILTER entity.type IN ${allowedEntityTypesLiteral}${matchEntityFilter}
      LIMIT 1
      RETURN 1
  ) > 0` : 'true'}

  FILTER hasMatchingEntities

  LET source_name = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "x_source_name"
      RETURN ref.description
  )

  LET source_link = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "source_link"
      RETURN ref.url
  )

  LET intelligence_module = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER LOWER(TO_STRING(ref.source_name)) == "x_intelligence_module"
      RETURN LOWER(TRIM(TO_STRING(ref.description)))
  )

  LET entities = (
    FOR entity, e, p IN ${entityTraversalDepth} OUTBOUND reportDoc._id GRAPH 'lunargraph_graph'
      PRUNE LENGTH(p.vertices) == 2
        AND LOWER(TO_STRING(entity.type)) IN ["marking-definition", "identity", "report"]
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : null)))
      FILTER relType IN ${allowedEntityRelationshipTypesLiteral}
      FILTER entity.type IN ${allowedEntityTypesLiteral}${projectedEntityFilter}
      LIMIT ${entityProjectionTraversalLimit}
      RETURN DISTINCT {
        type: entity.type,
        name: entity.name,
        value: entity.value,
        pattern: entity.pattern,
        relationshipType: e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : 'related_to'),
        modified: entity.modified,
        report: reportDoc.name,
        source_name: source_name,
        source_link: source_link
      }
  )

  FILTER LENGTH(entities) > 0

  COLLECT locCountry = normalizedLocation.country, locName = normalizedLocation.name INTO grouped = {
    reportDoc,
    sourceName: source_name,
    sourceLink: source_link,
    intelligenceModule: intelligence_module,
    entities
  }

  LET nodes_vertex_collection = (
    FOR entry IN grouped
      LET doc = entry.reportDoc
      LET detailEntities = SLICE(entry.entities, 0, 50)
      RETURN {
        id: doc._id,
        name: doc.name,
        description: doc.description,
        modified: doc.modified,
        sourceName: entry.sourceName,
        sourceLink: entry.sourceLink,
        intelligenceModule: entry.intelligenceModule,
        entities: detailEntities
      }
  )

  LET moduleCounts = (
    FOR rep IN nodes_vertex_collection
      FILTER rep.intelligenceModule != null AND rep.intelligenceModule != ""
      COLLECT module = rep.intelligenceModule WITH COUNT INTO count
      SORT count DESC, module ASC
      RETURN { module, count }
  )

  LET highlightIocs = SLICE(
    UNIQUE(
      FOR rep IN nodes_vertex_collection
        FOR ent IN rep.entities
          RETURN {
            type: ent.type,
            name: ent.name,
            value: ent.value,
            pattern: ent.pattern,
            modified: ent.modified,
            report: ent.report,
            source_name: ent.source_name,
            source_link: ent.source_link
          }
    ), 0, 12)

  RETURN {
    location: locCountry,
    locationName: locName,
    locationCode: locCountry,
    report: LENGTH(nodes_vertex_collection) > 0 ? nodes_vertex_collection[0].name : null,
    nodes_vertex_collection,
    highlightIocs,
    moduleCounts
  }`;
}
function buildAnchoredExplorerAql(params, activeGroups) {
    const { startIso, endIso, dynamicEndDate, fullEntityTypeList } = params;
    const endBoundExpr = dynamicEndDate ? 'DATE_ISO8601(DATE_NOW())' : `"${endIso}"`;
    const hasEntityScopedFilters = hasEntityFilters(activeGroups);
    const uniqueEntityTypes = Array.from(new Set(fullEntityTypeList));
    const defaultEntityProjectionDenylist = new Set(['identity', 'relationship', 'marking-definition']);
    const projectedEntityTypes = hasEntityScopedFilters
        ? uniqueEntityTypes
        : uniqueEntityTypes.filter(type => !defaultEntityProjectionDenylist.has(String(type).toLowerCase()));
    const allowedEntityTypesLiteral = `[${(projectedEntityTypes.length ? projectedEntityTypes : uniqueEntityTypes).map(type => `"${type}"`).join(', ')}]`;
    const allowedEntityRelationshipTypesLiteral = `["object", "references", "related-to", "uses", "targets", "attributed-to", "indicates", "located-at", "duplicate-of", "correlates-with"]`;
    const entityTraversalDepth = hasEntityScopedFilters ? '1..2' : '1..1';
    const entityProjectionTraversalLimit = hasEntityScopedFilters ? 400 : 160;
    const candidateLimit = 60;
    const anchorToReportDepth = '1..2';
    const selectedLocationExpr = buildLocationSelectionFilterExpression(activeGroups, 'v');
    const selectedAnchoredLocationExpr = buildLocationSelectionFilterExpression(activeGroups, 'loc');
    const hasLocationGroups = activeGroups.some(group => (group?.nodeType || '').trim() === 'location');
    const groupVarNames = [];
    const locationMatchVarNames = [];
    const groupBlocks = [];
    activeGroups.forEach((group, index) => {
        const nodeType = (group?.nodeType || '').trim();
        const clauseLogic = group?.clauseLogic === 'OR' ? 'OR' : 'AND';
        const varName = `groupReportIds${index}`;
        groupVarNames.push(varName);
        if (nodeType === 'report') {
            const clauseExpr = buildClauseExpressions(group.clauses ?? [], 'reportDoc', clauseLogic);
            groupBlocks.push(`LET ${varName} = (
  FOR reportDoc IN nodes_vertex_collection
    FILTER reportDoc.type == 'report' AND reportDoc._is_latest == true
      AND reportDoc.created >= "${startIso}"
      AND reportDoc.created <= ${endBoundExpr}
    ${clauseExpr ? `FILTER ${clauseExpr}` : ''}
    RETURN DISTINCT reportDoc._id
)`);
            return;
        }
        const alias = `n${index}`;
        const clauseExpr = nodeType === 'location'
            ? buildLocationClauseExpressions(group.clauses ?? [], alias, clauseLogic)
            : buildClauseExpressions(group.clauses ?? [], alias, clauseLogic);
        if (nodeType === 'location') {
            locationMatchVarNames.push(`${varName}_matches`);
            groupBlocks.push(`LET ${varName}_matchedLocations = (
  FOR ${alias} IN nodes_vertex_collection
    FILTER ${alias}.type == "${escapeForAql(nodeType)}"
    ${clauseExpr ? `FILTER ${clauseExpr}` : ''}
    RETURN DISTINCT {
      id: ${alias}._id,
      country: ${alias}.country,
      name: ${alias}.name
    }
)

LET ${varName}_outboundMatches = (
  FOR locEntry IN ${varName}_matchedLocations
    FOR reportDoc, e${index}, p${index} IN ${anchorToReportDepth} OUTBOUND locEntry.id GRAPH 'lunargraph_graph'
      PRUNE LENGTH(p${index}.vertices) == 2
        AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
      FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
        AND reportDoc.created >= "${startIso}"
        AND reportDoc.created <= ${endBoundExpr}
      RETURN DISTINCT {
        reportId: reportDoc._id,
        location: {
          country: locEntry.country,
          name: locEntry.name
        }
      }
)

LET ${varName}_inboundMatches = (
  FOR locEntry IN ${varName}_matchedLocations
    FOR reportDoc, e${index}, p${index} IN ${anchorToReportDepth} INBOUND locEntry.id GRAPH 'lunargraph_graph'
      PRUNE LENGTH(p${index}.vertices) == 2
        AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
      FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
        AND reportDoc.created >= "${startIso}"
        AND reportDoc.created <= ${endBoundExpr}
      RETURN DISTINCT {
        reportId: reportDoc._id,
        location: {
          country: locEntry.country,
          name: locEntry.name
        }
      }
)

LET ${varName}_matches = UNION_DISTINCT(${varName}_outboundMatches, ${varName}_inboundMatches)

LET ${varName} = (
  FOR match IN ${varName}_matches
    RETURN DISTINCT match.reportId
)`);
            return;
        }
        groupBlocks.push(`LET ${varName} = (
  FOR ${alias} IN nodes_vertex_collection
    FILTER ${alias}.type == "${escapeForAql(nodeType)}"
    ${clauseExpr ? `FILTER ${clauseExpr}` : ''}
    FOR reportDoc, e${index}, p${index} IN ${anchorToReportDepth} ANY ${alias}._id GRAPH 'lunargraph_graph'
      PRUNE LENGTH(p${index}.vertices) == 2
        AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
      FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
        AND reportDoc.created >= "${startIso}"
        AND reportDoc.created <= ${endBoundExpr}
      RETURN DISTINCT reportDoc._id
)`);
    });
    let combinedVar = groupVarNames[0];
    const combinedBlocks = [];
    for (let index = 1; index < groupVarNames.length; index += 1) {
        const joinWith = activeGroups[index - 1]?.joinWith === 'OR' ? 'UNION_DISTINCT' : 'INTERSECTION';
        const combinedName = `candidateReportIds${index}`;
        combinedBlocks.push(`LET ${combinedName} = ${joinWith}(${combinedVar}, ${groupVarNames[index]})`);
        combinedVar = combinedName;
    }
    const combinedBlockText = combinedBlocks.join('\n');
    const locationMatchesUnionExpr = locationMatchVarNames.length === 0
        ? '[]'
        : locationMatchVarNames.length === 1
            ? locationMatchVarNames[0]
            : `UNION_DISTINCT(${locationMatchVarNames.join(', ')})`;
    const anchoredLocationPrep = hasLocationGroups
        ? `LET anchoredLocationMatches = ${locationMatchesUnionExpr}

LET anchoredLocationsByReport = (
  FOR match IN anchoredLocationMatches
    LET locationCountryRaw = TRIM(TO_STRING(match.location.country))
    LET locationCountry = locationCountryRaw != "" ? UPPER(locationCountryRaw) : null
    LET locationNameRaw = TRIM(TO_STRING(match.location.name))
    LET locationName = locationNameRaw != "" ? locationNameRaw : (locationCountry != null ? locationCountry : "Unknown / Unmapped")
    LET loc = { country: locationCountry, name: locationName }
    LET selectedPriority = ${selectedAnchoredLocationExpr ? `((${selectedAnchoredLocationExpr}) ? 1 : 0)` : '0'}
    COLLECT reportId = match.reportId INTO grouped = {
      locationCountry,
      locationName,
      selectedPriority
    }
    LET preferred = FIRST(
      FOR row IN grouped
        SORT row.selectedPriority DESC, LENGTH(TO_STRING(row.locationName)) DESC
        LIMIT 1
        RETURN {
          country: row.locationCountry,
          name: row.locationName
        }
    )
    RETURN {
      reportId,
      location: preferred
    }
)

LET anchoredLocationMap = MERGE(
  FOR row IN anchoredLocationsByReport
    RETURN { [row.reportId]: row.location }
)`
        : 'LET anchoredLocationMap = {}';
    const locationFallbackExpr = `FIRST(
      FOR v, e, p IN 1..2 ANY reportDoc._id GRAPH 'lunargraph_graph'
        PRUNE LENGTH(p.vertices) == 2
          AND LOWER(TO_STRING(v.type)) IN ["marking-definition", "identity"]
        FILTER v.type == 'location'
        LET matchesSelectedLocation = ${selectedLocationExpr ? `(${selectedLocationExpr})` : 'false'}
        LET relType = LOWER(TO_STRING(e.relationship_type))
        LET edgeType = LOWER(TO_STRING(e.type))
        LET locationName = LOWER(TRIM(TO_STRING(v.name)))
        LET isLocatedAt = relType == 'located-at' OR edgeType == 'located-at'
        LET isObjectMarking = relType == 'object-marking' OR edgeType == 'object-marking'
        LET titleMatch = LENGTH(locationName) >= 3 AND CONTAINS(reportTitle, locationName)
        LET basePriority = isLocatedAt ? 3 : (titleMatch ? 2 : (!isObjectMarking ? 1 : 0))
        LET priority = (matchesSelectedLocation ? 100 : 0) + basePriority
        FILTER priority > 0 OR matchesSelectedLocation
        SORT priority DESC, LENGTH(locationName) DESC, v.modified DESC
        LIMIT 1
        RETURN {
          country: v.country ? v.country : (titleMatch AND LENGTH(locationName) == 2 ? UPPER(locationName) : null),
          name: v.name
        }
    )`;
    const locationInfoExpr = hasLocationGroups ? 'anchoredLocation' : locationFallbackExpr;
    return `${groupBlocks.join('\n\n')}

${combinedBlockText}

${anchoredLocationPrep}

LET candidateReports = (
  FOR reportId IN ${combinedVar}
    LET reportDoc = DOCUMENT(reportId)
    FILTER reportDoc != null
    FILTER reportDoc.type == 'report' AND reportDoc._is_latest == true
      AND reportDoc.created >= "${startIso}"
      AND reportDoc.created <= ${endBoundExpr}
    SORT reportDoc.modified DESC
    LIMIT ${candidateLimit}
    LET reportTitle = LOWER(TO_STRING(reportDoc.name))
    LET anchoredLocation = anchoredLocationMap[reportDoc._id]
    LET locationInfo = ${locationInfoExpr}
    LET normalizedLocation = locationInfo != null
      ? locationInfo
      : { country: "unknown", name: "Unknown / Unmapped" }
    RETURN {
      reportDoc,
      normalizedLocation
    }
)

FOR candidate IN candidateReports
  LET reportDoc = candidate.reportDoc
  LET normalizedLocation = candidate.normalizedLocation

  LET source_name = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "x_source_name"
      RETURN ref.description
  )

  LET source_link = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "source_link"
      RETURN ref.url
  )

  LET intelligence_module = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER LOWER(TO_STRING(ref.source_name)) == "x_intelligence_module"
      RETURN LOWER(TRIM(TO_STRING(ref.description)))
  )

  LET entities = (
    FOR entity, e, p IN ${entityTraversalDepth} OUTBOUND reportDoc._id GRAPH 'lunargraph_graph'
      PRUNE LENGTH(p.vertices) == 2
        AND LOWER(TO_STRING(entity.type)) IN ["marking-definition", "identity", "report"]
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : null)))
      FILTER relType IN ${allowedEntityRelationshipTypesLiteral}
      FILTER entity.type IN ${allowedEntityTypesLiteral}
      LIMIT ${entityProjectionTraversalLimit}
      RETURN DISTINCT {
        type: entity.type,
        name: entity.name,
        value: entity.value,
        pattern: entity.pattern,
        relationshipType: e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : 'related_to'),
        modified: entity.modified,
        report: reportDoc.name,
        source_name: source_name,
        source_link: source_link
      }
  )

  FILTER LENGTH(entities) > 0

  COLLECT locCountry = normalizedLocation.country, locName = normalizedLocation.name INTO grouped = {
    reportDoc,
    sourceName: source_name,
    sourceLink: source_link,
    intelligenceModule: intelligence_module,
    entities
  }

  LET nodes_vertex_collection = (
    FOR entry IN grouped
      LET doc = entry.reportDoc
      LET detailEntities = SLICE(entry.entities, 0, 50)
      RETURN {
        id: doc._id,
        name: doc.name,
        description: doc.description,
        modified: doc.modified,
        sourceName: entry.sourceName,
        sourceLink: entry.sourceLink,
        intelligenceModule: entry.intelligenceModule,
        entities: detailEntities
      }
  )

  LET moduleCounts = (
    FOR rep IN nodes_vertex_collection
      FILTER rep.intelligenceModule != null AND rep.intelligenceModule != ""
      COLLECT module = rep.intelligenceModule WITH COUNT INTO count
      SORT count DESC, module ASC
      RETURN { module, count }
  )

  LET highlightIocs = SLICE(
    UNIQUE(
      FOR rep IN nodes_vertex_collection
        FOR ent IN rep.entities
          RETURN {
            type: ent.type,
            name: ent.name,
            value: ent.value,
            pattern: ent.pattern,
            modified: ent.modified,
            report: ent.report,
            source_name: ent.source_name,
            source_link: ent.source_link
          }
    ), 0, 12)

  RETURN {
    location: locCountry,
    locationName: locName,
    locationCode: locCountry,
    report: LENGTH(nodes_vertex_collection) > 0 ? nodes_vertex_collection[0].name : null,
    nodes_vertex_collection,
    highlightIocs,
    moduleCounts
  }`;
}
function buildLocationFirstExplorerAql(params) {
    const { startIso, endIso, dynamicEndDate, groups, fullEntityTypeList } = params;
    const endBoundExpr = dynamicEndDate ? 'DATE_ISO8601(DATE_NOW())' : `"${endIso}"`;
    const locationNodeFilter = buildLocationNodeFilterExpression(groups, 'loc');
    const hasEntityScopedFilters = hasEntityFilters(groups ?? []);
    const uniqueEntityTypes = Array.from(new Set(fullEntityTypeList));
    const defaultEntityProjectionDenylist = new Set(['identity', 'relationship', 'marking-definition']);
    const projectedEntityTypes = hasEntityScopedFilters
        ? uniqueEntityTypes
        : uniqueEntityTypes.filter(type => !defaultEntityProjectionDenylist.has(String(type).toLowerCase()));
    const allowedEntityTypesLiteral = `[${(projectedEntityTypes.length ? projectedEntityTypes : uniqueEntityTypes).map(type => `"${type}"`).join(', ')}]`;
    const allowedEntityRelationshipTypesLiteral = `["object", "references", "related-to", "uses", "targets", "attributed-to", "indicates", "located-at", "duplicate-of", "correlates-with"]`;
    const entityTraversalDepth = hasEntityScopedFilters ? '1..2' : '1..1';
    const entityProjectionTraversalLimit = hasEntityScopedFilters ? 400 : 160;
    const candidateLimit = 60;
    const perLocationReportLimit = 80;
    const locationToReportDepth = '1..2';
    return `LET matchingLocationsRaw = (
  FOR loc IN nodes_vertex_collection
    FILTER loc.type == "location"
    ${locationNodeFilter ? `FILTER ${locationNodeFilter}` : ''}
    RETURN DISTINCT {
      id: loc._id,
      country: loc.country,
      name: loc.name,
      modified: loc.modified
    }
)

LET matchingLocations = (
  FOR loc IN matchingLocationsRaw
    LET bucket = loc.country
      ? CONCAT("country:", LOWER(TO_STRING(loc.country)))
      : CONCAT("name:", LOWER(TRIM(TO_STRING(loc.name))))
    COLLECT locationBucket = bucket INTO grouped = loc
    LET limited = (
      FOR row IN grouped
        SORT row.loc.modified DESC
        LIMIT 250
        RETURN {
          id: row.loc.id,
          country: row.loc.country,
          name: row.loc.name
        }
    )
    FOR entry IN limited
      RETURN entry
)

LET matchingLocationIds = (
  FOR loc IN matchingLocations
    RETURN loc.id
)

LET candidateReportsRaw = LENGTH(matchingLocationIds) > 0 ? (
    FOR locationEntry IN matchingLocations
    LET locationBucket = locationEntry.country
      ? CONCAT("country:", LOWER(TO_STRING(locationEntry.country)))
      : CONCAT("name:", LOWER(TRIM(TO_STRING(locationEntry.name))))
    LET outboundMatches = (
      FOR reportDoc, e, p IN ${locationToReportDepth} OUTBOUND locationEntry.id GRAPH 'lunargraph_graph'
        PRUNE LENGTH(p.vertices) == 2
          AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
        FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
          AND reportDoc.created >= "${startIso}"
          AND reportDoc.created <= ${endBoundExpr}
        RETURN DISTINCT {
          reportId: reportDoc._id,
          locationBucket,
          matchedLocation: {
            country: locationEntry.country,
            name: locationEntry.name
          },
          modified: reportDoc.modified
        }
    )
    LET inboundMatches = (
      FOR reportDoc, e, p IN ${locationToReportDepth} INBOUND locationEntry.id GRAPH 'lunargraph_graph'
        PRUNE LENGTH(p.vertices) == 2
          AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
        FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
          AND reportDoc.created >= "${startIso}"
          AND reportDoc.created <= ${endBoundExpr}
        RETURN DISTINCT {
          reportId: reportDoc._id,
          locationBucket,
          matchedLocation: {
            country: locationEntry.country,
            name: locationEntry.name
          },
          modified: reportDoc.modified
        }
    )
    LET mergedMatches = UNION_DISTINCT(outboundMatches, inboundMatches)
    FOR reportEntry IN mergedMatches
      SORT reportEntry.modified DESC
      LIMIT ${perLocationReportLimit}
      RETURN reportEntry
) : []

LET candidateReportsDeduped = (
  FOR entry IN candidateReportsRaw
    COLLECT reportId = entry.reportId, bucket = entry.locationBucket, locCountry = entry.matchedLocation.country, locName = entry.matchedLocation.name INTO grouped = entry
    LET firstMatch = grouped[0]
    RETURN {
      reportId,
      locationBucket: bucket,
      matchedLocation: {
        country: locCountry,
        name: locName
      },
      modified: firstMatch.entry.modified
    }
)

LET candidateReportsBucketed = (
  FOR entry IN candidateReportsDeduped
    COLLECT bucket = entry.locationBucket INTO bucketed = entry
    LET topBucket = (
      FOR row IN bucketed
        SORT row.entry.modified DESC
        LIMIT 20
        RETURN row.entry
    )
    FOR result IN topBucket
      RETURN result
)

LET candidateReports = (
  FOR candidate IN candidateReportsBucketed
    SORT candidate.modified DESC
    LIMIT ${candidateLimit}
    RETURN candidate
)

FOR candidate IN candidateReports
  LET reportDoc = DOCUMENT(candidate.reportId)
  FILTER reportDoc != null
  LET matchedLocation = candidate.matchedLocation
  LET normalizedLocation = {
    country: matchedLocation.country
      ? matchedLocation.country
      : "unknown",
    name: matchedLocation.name
      ? matchedLocation.name
      : "Unknown / Unmapped"
  }

  LET source_name = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "x_source_name"
      RETURN ref.description
  )

  LET source_link = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER ref.source_name == "source_link"
      RETURN ref.url
  )

  LET intelligence_module = FIRST(
    FOR ref IN reportDoc.external_references
      FILTER LOWER(TO_STRING(ref.source_name)) == "x_intelligence_module"
      RETURN LOWER(TRIM(TO_STRING(ref.description)))
  )

  LET entities = (
    FOR entity, e, p IN ${entityTraversalDepth} OUTBOUND reportDoc._id GRAPH 'lunargraph_graph'
      PRUNE LENGTH(p.vertices) == 2
        AND LOWER(TO_STRING(entity.type)) IN ["marking-definition", "identity", "report"]
      LET relType = LOWER(TO_STRING(e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : null)))
      FILTER relType IN ${allowedEntityRelationshipTypesLiteral}
      FILTER entity.type IN ${allowedEntityTypesLiteral}
      LIMIT ${entityProjectionTraversalLimit}
      RETURN DISTINCT {
        type: entity.type,
        name: entity.name,
        value: entity.value,
        pattern: entity.pattern,
        relationshipType: e.relationship_type ? e.relationship_type : (HAS(e, 'type') ? e.type : 'related_to'),
        modified: entity.modified,
        report: reportDoc.name,
        source_name: source_name,
        source_link: source_link
      }
  )

  FILTER LENGTH(entities) > 0

  COLLECT locCountry = normalizedLocation.country, locName = normalizedLocation.name INTO grouped = {
    reportDoc,
    sourceName: source_name,
    sourceLink: source_link,
    intelligenceModule: intelligence_module,
    entities
  }

  LET nodes_vertex_collection = (
    FOR entry IN grouped
      LET doc = entry.reportDoc
      LET detailEntities = SLICE(entry.entities, 0, 50)
      RETURN {
        id: doc._id,
        name: doc.name,
        description: doc.description,
        modified: doc.modified,
        sourceName: entry.sourceName,
        sourceLink: entry.sourceLink,
        intelligenceModule: entry.intelligenceModule,
        entities: detailEntities
      }
  )

  LET moduleCounts = (
    FOR rep IN nodes_vertex_collection
      FILTER rep.intelligenceModule != null AND rep.intelligenceModule != ""
      COLLECT module = rep.intelligenceModule WITH COUNT INTO count
      SORT count DESC, module ASC
      RETURN { module, count }
  )

  LET highlightIocs = SLICE(
    UNIQUE(
      FOR rep IN nodes_vertex_collection
        FOR ent IN rep.entities
          RETURN {
            type: ent.type,
            name: ent.name,
            value: ent.value,
            pattern: ent.pattern,
            modified: ent.modified,
            report: ent.report,
            source_name: ent.source_name,
            source_link: ent.source_link
          }
    ), 0, 12)

  RETURN {
    location: locCountry,
    locationName: locName,
    locationCode: locCountry,
    report: LENGTH(nodes_vertex_collection) > 0 ? nodes_vertex_collection[0].name : null,
    nodes_vertex_collection,
    highlightIocs,
    moduleCounts
  }`;
}
function canUseLocationFirstQuery(groups) {
    const activeGroups = (groups ?? []).filter(group => group?.nodeType && Array.isArray(group.clauses) && group.clauses.length > 0);
    if (!activeGroups.length) {
        return false;
    }
    return activeGroups.every(group => {
        if (group.nodeType !== 'location') {
            return false;
        }
        return (group.clauses ?? []).every(clause => {
            const field = (clause?.field || '').trim();
            const operator = (clause?.operator || '').trim();
            return (field === 'country' || field === 'name') && operator === 'equals';
        });
    });
}
function hasMixedLocationWithOrJoin(groups) {
    const activeGroups = (groups ?? []).filter(group => group?.nodeType && Array.isArray(group.clauses) && group.clauses.length > 0);
    const hasLocation = activeGroups.some(group => group.nodeType === 'location');
    const hasNonLocation = activeGroups.some(group => group.nodeType !== 'location');
    if (!hasLocation || !hasNonLocation) {
        return false;
    }
    for (let index = 0; index < activeGroups.length - 1; index += 1) {
        if (activeGroups[index]?.joinWith === 'OR') {
            return true;
        }
    }
    return false;
}
function buildLocationNodeFilterExpression(groups, alias) {
    const locationGroups = (groups ?? []).filter(group => group?.nodeType === 'location');
    if (!locationGroups.length) {
        return '';
    }
    let expression = '';
    let previousGroup = null;
    locationGroups.forEach(group => {
        const clauseLogic = group?.clauseLogic === 'OR' ? 'OR' : 'AND';
        const groupExpr = buildLocationClauseExpressions(group.clauses ?? [], alias, clauseLogic);
        if (!groupExpr) {
            return;
        }
        if (!expression) {
            expression = `(${groupExpr})`;
        }
        else {
            const joinWith = previousGroup?.joinWith === 'OR' ? 'OR' : 'AND';
            expression = `(${expression}) ${joinWith} (${groupExpr})`;
        }
        previousGroup = group;
    });
    return expression;
}
function buildLocationClauseExpressions(clauses, alias, logic) {
    const parts = [];
    clauses.forEach(clause => {
        const expr = buildLocationClauseExpression(alias, clause);
        if (expr) {
            parts.push(`(${expr})`);
        }
    });
    if (!parts.length) {
        return '';
    }
    return parts.join(` ${logic} `);
}
function buildLocationClauseExpression(alias, clause) {
    const field = (clause?.field || '').trim();
    const operator = (clause?.operator || '').trim();
    const rawValue = clause?.value ?? '';
    if (field === 'country' && operator === 'equals' && rawValue !== null && rawValue !== undefined) {
        const rawCode = String(rawValue).trim().toUpperCase();
        const code = legacyIsoAliasToCanonical[rawCode] ?? rawCode;
        if (code.length === 2) {
            const countryName = countryDisplayNames?.of(code)?.trim();
            const escapedCode = escapeForAql(code.toLowerCase());
            const countryAliases = getCountryFilterAliases(code, countryName);
            const aliasesLiteral = `[${countryAliases.map(value => `"${escapeForAql(value)}"`).join(', ')}]`;
            if (countryName) {
                const escapedName = escapeForAql(countryName.toLowerCase());
                return `(LOWER(TRIM(TO_STRING(${alias}.country))) IN ${aliasesLiteral} OR LOWER(TO_STRING(${alias}.country)) == "${escapedCode}" OR LOWER(TRIM(TO_STRING(${alias}.name))) == "${escapedName}" OR CONTAINS(LOWER(TRIM(TO_STRING(${alias}.name))), "${escapedName}"))`;
            }
            return `(LOWER(TRIM(TO_STRING(${alias}.country))) IN ${aliasesLiteral} OR LOWER(TO_STRING(${alias}.country)) == "${escapedCode}")`;
        }
    }
    if (field === 'name' && operator === 'equals' && rawValue !== null && rawValue !== undefined) {
        const normalizedName = String(rawValue).trim().toLowerCase();
        if (!normalizedName) {
            return null;
        }
        const escapedName = escapeForAql(normalizedName);
        const isoCode = resolveIsoFromCountryLikeInput(normalizedName);
        if (isoCode) {
            const escapedIso = escapeForAql(isoCode.toLowerCase());
            const resolvedCountryName = countryDisplayNames?.of(isoCode)?.trim() ?? null;
            const countryAliases = getCountryFilterAliases(isoCode, resolvedCountryName);
            const aliasesLiteral = `[${countryAliases.map(value => `"${escapeForAql(value)}"`).join(', ')}]`;
            return `(LOWER(TRIM(TO_STRING(${alias}.name))) == "${escapedName}" OR LOWER(TRIM(TO_STRING(${alias}.country))) IN ${aliasesLiteral} OR LOWER(TO_STRING(${alias}.country)) == "${escapedIso}")`;
        }
        return `LOWER(TRIM(TO_STRING(${alias}.name))) == "${escapedName}"`;
    }
    return buildClauseExpression(alias, clause);
}
function hasEntityFilters(groups) {
    return (groups ?? []).some(group => {
        if (!group?.nodeType || group.nodeType === 'report' || group.nodeType === 'location') {
            return false;
        }
        return Array.isArray(group.clauses) && group.clauses.length > 0;
    });
}
function buildQueryFilterExpression(groups, alias, excludeLocationGroups = false) {
    if (!Array.isArray(groups) || groups.length === 0) {
        return '';
    }
    let expression = '';
    let previousIncludedGroup = null;
    groups.forEach((group, index) => {
        if (excludeLocationGroups && group?.nodeType === 'location') {
            return;
        }
        const groupExpr = buildGroupExpression(group, index, alias);
        if (!groupExpr) {
            return;
        }
        if (!expression) {
            expression = `(${groupExpr})`;
        }
        else {
            const joinWith = previousIncludedGroup?.joinWith === 'OR' ? 'OR' : 'AND';
            expression = `(${expression}) ${joinWith} (${groupExpr})`;
        }
        previousIncludedGroup = group;
    });
    return expression;
}
function buildLocationSelectionFilterExpression(groups, alias) {
    const locationGroups = (groups ?? []).filter(group => group?.nodeType === 'location');
    if (!locationGroups.length) {
        return '';
    }
    let expression = '';
    let previousGroup = null;
    locationGroups.forEach(group => {
        const clauseLogic = group?.clauseLogic === 'OR' ? 'OR' : 'AND';
        const groupExpr = buildLocationClauseExpressions(group.clauses ?? [], alias, clauseLogic);
        if (!groupExpr) {
            return;
        }
        if (!expression) {
            expression = `(${groupExpr})`;
        }
        else {
            const joinWith = previousGroup?.joinWith === 'OR' ? 'OR' : 'AND';
            expression = `(${expression}) ${joinWith} (${groupExpr})`;
        }
        previousGroup = group;
    });
    return expression;
}
function buildLocationCandidatePrefilter(groups, rootAlias) {
    const locationGroups = (groups ?? []).filter(group => group?.nodeType === 'location');
    if (!locationGroups.length) {
        return '';
    }
    const expressionEntries = [];
    locationGroups.forEach((group, index) => {
        const clauses = Array.isArray(group?.clauses) ? group.clauses : [];
        const clauseParts = [];
        clauses.forEach(clause => {
            const field = (clause?.field || '').trim();
            const operator = (clause?.operator || '').trim();
            const value = String(clause?.value ?? '').trim().toLowerCase();
            if (operator !== 'equals' || !value) {
                return;
            }
            if (field === 'country') {
                clauseParts.push(`LOWER(TO_STRING(loc.country)) == "${escapeForAql(value)}"`);
            }
            else if (field === 'name') {
                clauseParts.push(`LOWER(TO_STRING(loc.name)) == "${escapeForAql(value)}"`);
            }
        });
        if (!clauseParts.length) {
            return;
        }
        const clauseLogic = group?.clauseLogic === 'OR' ? ' OR ' : ' AND ';
        const combinedClauses = clauseParts.length > 1 ? `(${clauseParts.join(clauseLogic)})` : clauseParts[0];
        expressionEntries.push({
            group,
            expr: `LENGTH(
      FOR loc, edge${index}, p${index} IN 1..2 ANY ${rootAlias}._id GRAPH 'lunargraph_graph'
        PRUNE LENGTH(p${index}.vertices) == 2
          AND LOWER(TO_STRING(loc.type)) IN ["marking-definition", "identity"]
        FILTER loc.type == "location" AND ${combinedClauses}
        LIMIT 1
        RETURN 1
    ) > 0`
        });
    });
    if (!expressionEntries.length) {
        return '';
    }
    let combined = expressionEntries[0].expr;
    for (let index = 1; index < expressionEntries.length; index += 1) {
        const joinWith = expressionEntries[index - 1].group?.joinWith === 'OR' ? 'OR' : 'AND';
        combined = `(${combined}) ${joinWith} (${expressionEntries[index].expr})`;
    }
    return combined;
}
function buildGroupExpression(group, index, rootAlias) {
    const nodeType = (group?.nodeType || '').trim();
    if (!nodeType) {
        return null;
    }
    const clauseLogic = group?.clauseLogic === 'OR' ? 'OR' : 'AND';
    const alias = nodeType === 'report' ? rootAlias : `g${index}`;
    const clauseExpression = nodeType === 'location'
        ? buildLocationClauseExpressions(group.clauses ?? [], alias, clauseLogic)
        : buildClauseExpressions(group.clauses ?? [], alias, clauseLogic);
    if (nodeType === 'report') {
        return clauseExpression || null;
    }
    const typeCheck = `${alias}.type == "${escapeForAql(nodeType)}"`;
    const clauseSegment = clauseExpression ? `${typeCheck} AND (${clauseExpression})` : typeCheck;
    const traversalDirection = nodeType === 'location' ? 'ANY' : 'OUTBOUND';
    return `LENGTH(
      FOR ${alias}, e${index}, p${index} IN 1..2 ${traversalDirection} ${rootAlias}._id GRAPH 'lunargraph_graph'
        PRUNE LENGTH(p${index}.vertices) == 2
          AND LOWER(TO_STRING(${alias}.type)) IN ["marking-definition", "identity"]
        FILTER ${clauseSegment}
        LIMIT 1
        RETURN 1
    ) > 0`;
}
function buildClauseExpressions(clauses, alias, logic) {
    const parts = [];
    clauses.forEach(clause => {
        const expr = buildClauseExpression(alias, clause);
        if (expr) {
            parts.push(`(${expr})`);
        }
    });
    if (!parts.length) {
        return '';
    }
    return parts.join(` ${logic} `);
}
function buildClauseExpression(alias, clause) {
    const field = (clause?.field || '').trim();
    const operator = (clause?.operator || '').trim();
    const rawValue = clause?.value ?? '';
    const normalizedField = field.toLowerCase();
    if (!field) {
        return null;
    }
    if (normalizedField === 'intelligence_module') {
        const moduleValueRef = `FIRST(
      FOR __ref IN ${alias}.external_references
        FILTER LOWER(TO_STRING(__ref.source_name)) == "x_intelligence_module"
        RETURN LOWER(TRIM(TO_STRING(__ref.description)))
    )`;
        if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
            return `${moduleValueRef} != null AND ${moduleValueRef} != ""`;
        }
        const value = String(rawValue).trim();
        const escapedValue = escapeForAql(value);
        const lowerValue = escapedValue.toLowerCase();
        switch (operator) {
            case 'contains':
                return `CONTAINS(${moduleValueRef}, "${lowerValue}")`;
            case 'startsWith':
                return `STARTS_WITH(${moduleValueRef}, "${lowerValue}")`;
            case 'endsWith':
                return `RIGHT(${moduleValueRef}, LENGTH("${lowerValue}")) == "${lowerValue}"`;
            case 'in': {
                const values = value
                    .split(',')
                    .map(v => v.trim())
                    .filter(v => v.length > 0)
                    .map(v => `"${escapeForAql(v.toLowerCase())}"`);
                if (!values.length) {
                    return `${moduleValueRef} != null AND ${moduleValueRef} != ""`;
                }
                return `${moduleValueRef} IN [${values.join(', ')}]`;
            }
            case 'matches':
                return `REGEX_TEST(${moduleValueRef}, "${lowerValue}")`;
            case 'equals':
            default:
                return `${moduleValueRef} == "${lowerValue}"`;
        }
    }
    const sanitizedField = escapeForAql(field);
    const fieldRef = `${alias}.${sanitizedField}`;
    const stringRef = `LOWER(TO_STRING(${fieldRef}))`;
    if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
        return `HAS(${alias}, "${sanitizedField}")`;
    }
    const value = String(rawValue).trim();
    const escapedValue = escapeForAql(value);
    const lowerValue = escapedValue.toLowerCase();
    switch (operator) {
        case 'contains':
            return `CONTAINS(${stringRef}, "${lowerValue}")`;
        case 'startsWith':
            return `STARTS_WITH(${stringRef}, "${lowerValue}")`;
        case 'endsWith':
            return `RIGHT(${stringRef}, LENGTH("${lowerValue}")) == "${lowerValue}"`;
        case 'in':
            return buildInExpression(alias, sanitizedField, value);
        case 'matches':
            return `REGEX_TEST(TO_STRING(${fieldRef}), "${escapedValue}")`;
        case 'equals':
        default:
            return `${stringRef} == "${lowerValue}"`;
    }
}
function buildInExpression(alias, field, rawValue) {
    const values = rawValue
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .map(v => `"${escapeForAql(v.toLowerCase())}"`);
    if (!values.length) {
        return `HAS(${alias}, "${field}")`;
    }
    const fieldRef = `${alias}.${field}`;
    const stringRef = `LOWER(TO_STRING(${fieldRef}))`;
    return `${stringRef} IN [${values.join(', ')}]`;
}
function buildRelatedEntityFilterFragment(groups, alias, indent, specificNodeType, includeEmptyClauses = false, excludeLocationGroups = false) {
    if (!Array.isArray(groups) || groups.length === 0) {
        return '';
    }
    let entityGroups = groups.filter(group => group.nodeType && group.nodeType !== 'report');
    if (excludeLocationGroups) {
        entityGroups = entityGroups.filter(group => group.nodeType !== 'location');
    }
    if (specificNodeType) {
        entityGroups = entityGroups.filter(group => group.nodeType === specificNodeType);
    }
    if (!entityGroups.length) {
        return '';
    }
    const expressions = entityGroups
        .map(group => {
        const clauseLogic = group?.clauseLogic === 'OR' ? 'OR' : 'AND';
        const clauseExpr = buildClauseExpressions(group.clauses ?? [], alias, clauseLogic);
        const typeCheck = `${alias}.type == "${escapeForAql(group.nodeType)}"`;
        if (clauseExpr) {
            return `(${typeCheck} AND (${clauseExpr}))`;
        }
        return includeEmptyClauses ? `(${typeCheck})` : '';
    })
        .filter(Boolean);
    if (!expressions.length) {
        return '';
    }
    return `\n${indent}FILTER ${expressions.join(' OR ')}`;
}
function escapeForAql(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ');
}
//# sourceMappingURL=explorer-aql-builder.js.map
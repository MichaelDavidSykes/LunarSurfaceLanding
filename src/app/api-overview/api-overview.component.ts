import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../shared/services/api.service';

type ExampleLevel = 'Simple' | 'Intermediate' | 'Advanced';

interface AqlExample {
  level: ExampleLevel;
  title: string;
  goal: string;
  query: string;
}

interface ExampleRunResult {
  isRunning: boolean;
  hasRun: boolean;
  showFullResponse: boolean;
  durationMs: number | null;
  responseCount: number | null;
  previewText: string | null;
  fullResponseText: string | null;
  error: string | null;
}

@Component({
  selector: 'app-api-overview',
  templateUrl: './api-overview.component.html',
  styleUrls: ['./api-overview.component.scss']
})
export class ApiOverviewComponent implements OnInit {
  constructor(
    private readonly apiService: ApiService,
    private readonly route: ActivatedRoute
  ) {}

  protected page = 'overview';

  protected readonly mcpEndpoint = 'https://api.lunarchain.net/api/v1/graph/mcp';

  protected readonly mcpInstallExample = `# Python MCP client (example)
pip install "mcp>=1.18.0,<2.0.0"

# Or use your preferred MCP-compatible client/runtime`;

  protected readonly mcpInitExample = `# Initialize MCP session (capture mcp-session-id from response headers)
curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"init-1",
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-03-26",
      "capabilities":{},
      "clientInfo":{"name":"local-test","version":"1.0.0"}
    }
  }'`;

  protected readonly mcpToolsExample = `# List available MCP tools (use mcp-session-id from initialize response)
curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <SESSION_ID>" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"tools-1",
    "method":"tools/list",
    "params":{}
  }'`;

  protected readonly mcpIntentPreviewExample = `# Convert natural-language request into guarded AQL (preview only)
curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <SESSION_ID>" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"intent-1",
    "method":"tools/call",
    "params":{
      "name":"build_query_from_intent",
      "arguments":{
        "question":"latest intel in iran about ford in last 7 days",
        "result_limit":40
      }
    }
  }'`;

  protected readonly mcpQueryIntelExample = `# Primary tool: ask in natural language and execute
curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <SESSION_ID>" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"intel-1",
    "method":"tools/call",
    "params":{
      "name":"query_intel",
      "arguments":{
        "question":"what is the latest intel in iran",
        "result_limit":30
      }
    }
  }'`;

  protected readonly curlExample = `curl -X POST https://api.lunarchain.net/api/v1/graph/aql-query \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "query": "FOR r IN nodes_vertex_collection FILTER r.type == \\"report\\" AND r._is_latest == true SORT r.modified DESC LIMIT 25 RETURN { id: r._id, name: r.name, modified: r.modified }"
  }'`;

  protected readonly payloadExample = `{
  "query": "LET startDate = DATE_ISO8601(DATE_SUBTRACT(DATE_NOW(), 30, \\"days\\"))\\nFOR r IN nodes_vertex_collection\\n  FILTER r.type == \\"report\\" AND r._is_latest == true\\n  FILTER r.created >= startDate\\n  SORT r.modified DESC\\n  LIMIT 50\\n  RETURN { id: r._id, name: r.name, modified: r.modified }"
}`;

  protected readonly successResponseExample = `{
  "ok": true,
  "data": [
    {
      "id": "nodes_vertex_collection/report--...",
      "name": "Article: ...",
      "modified": "2026-03-17T20:10:11Z"
    }
  ],
  "meta": { "requestId": "..." }
}`;

  protected readonly errorResponseExample = `{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query payload"
  }
}`;

  protected readonly endpointHighlights = [
    {
      title: 'Primary Endpoint',
      summary: 'POST /api/v1/graph/aql-query executes authenticated custom AQL directly against the intelligence graph.'
    },
    {
      title: 'Agent Ready',
      summary: 'AI agents can convert user intent into AQL, execute, then summarize graph-backed intelligence results.'
    },
    {
      title: 'Bounded By Design',
      summary: 'Use LIMITs, date filters, and constrained traversals to keep response time predictable.'
    },
    {
      title: 'Schema-Aware',
      summary: 'Queries target nodes_vertex_collection and graph traversals over lunargraph_graph.'
    }
  ];

  protected readonly mcpToolHighlights = [
    {
      name: 'query_intel',
      use: 'Default tool for agentic graph querying from natural language.',
      why: 'Prevents debugger-style workflows for normal intel questions and enforces bounded safe AQL generation.'
    },
    {
      name: 'build_query_from_intent',
      use: 'Generate/inspect AQL + bind vars from natural language without execution.',
      why: 'Enables transparent review and deterministic retries before runtime execution.'
    },
    {
      name: 'run_read_query',
      use: 'Execute explicit custom read-only AQL with strict runtime/row caps.',
      why: 'Provides full flexibility for advanced operators and agent-authored custom AQL.'
    },
    {
      name: 'query_examples',
      use: 'Retrieve known-good AQL templates by use case.',
      why: 'Gives agents high-signal patterns to adapt instead of inventing fragile traversals.'
    }
  ];

  protected readonly aqlExamples: AqlExample[] = [
    {
      level: 'Simple',
      title: 'Latest Reports',
      goal: 'Get the most recent reports in the graph.',
      query: `FOR reportDoc IN nodes_vertex_collection
  FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
  SORT reportDoc.modified DESC
  LIMIT 25
  RETURN {
    id: reportDoc._id,
    name: reportDoc.name,
    modified: reportDoc.modified
  }`
    },
    {
      level: 'Simple',
      title: 'Latest Reports In A Date Window',
      goal: 'Get reports in the last 14 days.',
      query: `LET startDate = DATE_ISO8601(DATE_SUBTRACT(DATE_NOW(), 14, "days"))

FOR reportDoc IN nodes_vertex_collection
  FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
  FILTER reportDoc.created >= startDate
  SORT reportDoc.modified DESC
  LIMIT 50
  RETURN {
    id: reportDoc._id,
    name: reportDoc.name,
    created: reportDoc.created,
    modified: reportDoc.modified
  }`
    },
    {
      level: 'Simple',
      title: 'Reports Linked To A Country',
      goal: 'Pivot from location to reports (example: US).',
      query: `LET countryCode = "US"
LET locationIds = (
  FOR loc IN nodes_vertex_collection
    FILTER loc.type == "location"
    FILTER UPPER(TRIM(TO_STRING(loc.country))) == countryCode
    RETURN loc._id
)

FOR locId IN locationIds
  FOR reportDoc, edge, path IN 1..2 ANY locId GRAPH "lunargraph_graph"
    PRUNE LENGTH(path.vertices) == 2
      AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
    FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
    COLLECT reportId = reportDoc._id, reportName = reportDoc.name, modified = reportDoc.modified
    SORT modified DESC
    LIMIT 50
    RETURN { reportId, reportName, modified }`
    },
    {
      level: 'Intermediate',
      title: 'Indicator To Reports Pivot',
      goal: 'Find reports connected to a specific indicator.',
      query: `LET indicatorName = "email address: tyler@twz.com"

FOR indicator IN nodes_vertex_collection
  FILTER indicator.type == "indicator"
  FILTER LOWER(TRIM(TO_STRING(indicator.name))) == LOWER(indicatorName)
  FOR reportDoc, edge, path IN 1..2 ANY indicator._id GRAPH "lunargraph_graph"
    PRUNE LENGTH(path.vertices) == 2
      AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
    FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
    COLLECT reportId = reportDoc._id, reportName = reportDoc.name, modified = reportDoc.modified
    SORT modified DESC
    LIMIT 40
    RETURN { reportId, reportName, modified }`
    },
    {
      level: 'Intermediate',
      title: 'Entity Bundle Per Recent Report',
      goal: 'Pull high-value linked entities for each recent report.',
      query: `FOR reportDoc IN nodes_vertex_collection
  FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
  SORT reportDoc.modified DESC
  LIMIT 15
  LET entities = (
    FOR ent, edge IN 1..1 OUTBOUND reportDoc._id GRAPH "lunargraph_graph"
      LET relType = LOWER(TO_STRING(edge.relationship_type ? edge.relationship_type : edge.type))
      FILTER relType IN ["object", "references", "related-to", "uses", "targets", "attributed-to", "indicates", "located-at"]
      FILTER ent.type IN ["threat-actor", "campaign", "malware", "tool", "location", "intrusion-set", "attack-pattern", "vulnerability"]
      RETURN DISTINCT {
        type: ent.type,
        name: ent.name
      }
  )
  FILTER LENGTH(entities) > 0
  RETURN {
    report: reportDoc.name,
    modified: reportDoc.modified,
    entities: SLICE(entities, 0, 25)
  }`
    },
    {
      level: 'Intermediate',
      title: 'Top Threat Actors By Report Coverage',
      goal: 'Rank threat actors by number of distinct linked reports.',
      query: `FOR actor IN nodes_vertex_collection
  FILTER actor.type == "threat-actor"
  LET reportIds = UNIQUE(
    FOR reportDoc, edge, path IN 1..2 ANY actor._id GRAPH "lunargraph_graph"
      PRUNE LENGTH(path.vertices) == 2
        AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
      FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
      RETURN reportDoc._id
  )
  LET reportCount = LENGTH(reportIds)
  FILTER reportCount > 0
  SORT reportCount DESC
  LIMIT 20
  RETURN {
    threatActor: actor.name,
    reportCount
  }`
    },
    {
      level: 'Intermediate',
      title: 'Campaign Neighborhood (2-Hop)',
      goal: 'Explore key entities around a campaign node.',
      query: `LET campaignName = "operation epic fury"

FOR campaign IN nodes_vertex_collection
  FILTER campaign.type == "campaign"
  FILTER LOWER(TRIM(TO_STRING(campaign.name))) == LOWER(campaignName)
  FOR node, edge, path IN 1..2 ANY campaign._id GRAPH "lunargraph_graph"
    PRUNE LENGTH(path.vertices) == 2
      AND LOWER(TO_STRING(node.type)) IN ["marking-definition", "identity"]
    FILTER node.type IN ["report", "threat-actor", "intrusion-set", "tool", "malware", "location", "attack-pattern"]
    FILTER node.type != "report" OR (node._is_latest == true)
    RETURN DISTINCT {
      type: node.type,
      id: node._id,
      name: node.name
    }`
    },
    {
      level: 'Advanced',
      title: 'Shared Threat Actors Between Two Countries',
      goal: 'Measure overlap between country-level threat-actor exposure.',
      query: `LET countryA = "US"
LET countryB = "IR"

LET countryAActors = UNIQUE(
  FOR loc IN nodes_vertex_collection
    FILTER loc.type == "location"
    FILTER UPPER(TRIM(TO_STRING(loc.country))) == countryA
    FOR actor, edge, path IN 1..2 ANY loc._id GRAPH "lunargraph_graph"
      PRUNE LENGTH(path.vertices) == 2
        AND LOWER(TO_STRING(actor.type)) IN ["marking-definition", "identity"]
      FILTER actor.type == "threat-actor"
      RETURN LOWER(TRIM(TO_STRING(actor.name)))
)

LET countryBActors = UNIQUE(
  FOR loc IN nodes_vertex_collection
    FILTER loc.type == "location"
    FILTER UPPER(TRIM(TO_STRING(loc.country))) == countryB
    FOR actor, edge, path IN 1..2 ANY loc._id GRAPH "lunargraph_graph"
      PRUNE LENGTH(path.vertices) == 2
        AND LOWER(TO_STRING(actor.type)) IN ["marking-definition", "identity"]
      FILTER actor.type == "threat-actor"
      RETURN LOWER(TRIM(TO_STRING(actor.name)))
)

LET sharedActors = INTERSECTION(countryAActors, countryBActors)

RETURN {
  countryA,
  countryB,
  sharedCount: LENGTH(sharedActors),
  sharedThreatActors: SLICE(sharedActors, 0, 25)
}`
    },
    {
      level: 'Advanced',
      title: 'CVE To Reports Lookup',
      goal: 'Pivot from vulnerabilities to linked latest reports and source links.',
      query: `FOR vuln IN nodes_vertex_collection
  FILTER vuln.type == "vulnerability"
  FILTER LIKE(UPPER(TO_STRING(vuln.name)), "CVE-%", true)
  FOR reportDoc, edge, path IN 1..2 ANY vuln._id GRAPH "lunargraph_graph"
    PRUNE LENGTH(path.vertices) == 2
      AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
    FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
    LET sourceLink = FIRST(
      FOR ref IN reportDoc.external_references
        FILTER ref.source_name == "source_link"
        RETURN ref.url
    )
    COLLECT cve = vuln.name, reportName = reportDoc.name, modified = reportDoc.modified, sourceLink = sourceLink
    SORT modified DESC
    LIMIT 60
    RETURN {
      cve,
      reportName,
      modified,
      sourceLink
    }`
    },
    {
      level: 'Advanced',
      title: 'Daily Report Trend For A Country',
      goal: 'Build a time-series of report volume for a location.',
      query: `LET countryCode = "US"
LET reportIds = UNIQUE(
  FOR loc IN nodes_vertex_collection
    FILTER loc.type == "location"
    FILTER UPPER(TRIM(TO_STRING(loc.country))) == countryCode
    FOR reportDoc, edge, path IN 1..2 ANY loc._id GRAPH "lunargraph_graph"
      PRUNE LENGTH(path.vertices) == 2
        AND LOWER(TO_STRING(reportDoc.type)) IN ["marking-definition", "identity"]
      FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
      RETURN reportDoc._id
)

FOR reportId IN reportIds
  LET reportDoc = DOCUMENT(reportId)
  FILTER reportDoc != null
  COLLECT day = DATE_FORMAT(reportDoc.created, "%yyyy-%mm-%dd") WITH COUNT INTO count
  SORT day ASC
  RETURN { day, count }`
    },
    {
      level: 'Advanced',
      title: 'Top Co-Occurring Entity Pairs',
      goal: 'Find frequently co-mentioned entity pairs across recent reports.',
      query: `LET recentReports = (
  FOR reportDoc IN nodes_vertex_collection
    FILTER reportDoc.type == "report" AND reportDoc._is_latest == true
    SORT reportDoc.modified DESC
    LIMIT 120
    RETURN reportDoc._id
)

LET pairs = (
  FOR reportId IN recentReports
    LET entities = (
      FOR ent, edge IN 1..1 OUTBOUND reportId GRAPH "lunargraph_graph"
        FILTER ent.type IN ["threat-actor", "malware", "tool", "campaign", "intrusion-set"]
        RETURN DISTINCT CONCAT(ent.type, ":", LOWER(TRIM(TO_STRING(ent.name))))
    )
    FOR leftEnt, i IN entities
      FOR rightEnt, j IN entities
        FILTER j > i
        RETURN CONCAT(leftEnt, " <-> ", rightEnt)
)

FOR pair IN pairs
  COLLECT pairLabel = pair WITH COUNT INTO count
  SORT count DESC
  LIMIT 30
  RETURN { pair: pairLabel, count }`
    },
    {
      level: 'Advanced',
      title: 'Intrusion-Set Multi-Hop Correlation',
      goal: 'From one intrusion set, pull related malware, tools, campaigns, patterns, and reports.',
      query: `LET intrusionSetName = "lazarus group"

FOR intr IN nodes_vertex_collection
  FILTER intr.type == "intrusion-set"
  FILTER LOWER(TRIM(TO_STRING(intr.name))) == LOWER(intrusionSetName)
  LET neighbors = (
    FOR node, edge, path IN 1..2 ANY intr._id GRAPH "lunargraph_graph"
      PRUNE LENGTH(path.vertices) == 2
        AND LOWER(TO_STRING(node.type)) IN ["marking-definition", "identity"]
      FILTER node.type IN ["malware", "tool", "campaign", "attack-pattern", "report", "location"]
      FILTER node.type != "report" OR node._is_latest == true
      RETURN DISTINCT {
        type: node.type,
        id: node._id,
        name: node.name
      }
  )
  RETURN {
    intrusionSet: intr.name,
    neighborCount: LENGTH(neighbors),
    neighbors
  }`
    }
  ];

  protected readonly runResults: Partial<Record<number, ExampleRunResult>> = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const rawPage = params.get('page')?.toLowerCase() ?? 'overview';
      const allowed = new Set([
        'overview',
        'quick-start',
        'base-configuration',
        'endpoint-focus',
        'mcp-server',
        'payload-response',
        'aql-playbook'
      ]);
      this.page = allowed.has(rawPage) ? rawPage : 'overview';
    });
  }

  protected runExample(example: AqlExample, index: number): void {
    const startedAt = Date.now();
    this.runResults[index] = {
      isRunning: true,
      hasRun: true,
      showFullResponse: false,
      durationMs: null,
      responseCount: null,
      previewText: null,
      fullResponseText: null,
      error: null
    };

    this.apiService.post<any>('/graph/aql-query', { query: example.query }).subscribe({
      next: (response: any) => {
        const raw = this.extractResultArray(response);
        const durationMs = Date.now() - startedAt;
        const previewRows = raw.slice(0, 5);

        this.runResults[index] = {
          isRunning: false,
          hasRun: true,
          showFullResponse: false,
          durationMs,
          responseCount: raw.length,
          previewText: JSON.stringify(previewRows, null, 2),
          fullResponseText: JSON.stringify(response, null, 2),
          error: null
        };
      },
      error: (err: HttpErrorResponse) => {
        const durationMs = Date.now() - startedAt;
        const errorText = this.describeHttpError(err);
        this.runResults[index] = {
          isRunning: false,
          hasRun: true,
          showFullResponse: false,
          durationMs,
          responseCount: null,
          previewText: null,
          fullResponseText: null,
          error: errorText
        };
      }
    });
  }

  protected toggleFullResponse(index: number): void {
    const current = this.runResults[index];
    if (!current) {
      return;
    }
    this.runResults[index] = {
      ...current,
      showFullResponse: !current.showFullResponse
    };
  }

  private extractResultArray(response: any): any[] {
    if (Array.isArray(response?.results?.result)) {
      return response.results.result;
    }
    if (Array.isArray(response?.result)) {
      return response.result;
    }
    return [];
  }

  private describeHttpError(err: HttpErrorResponse): string {
    const backendMessage =
      typeof err?.error?.detail === 'string'
        ? err.error.detail
        : typeof err?.error?.message === 'string'
          ? err.error.message
          : null;
    return backendMessage ?? `${err.status} ${err.statusText}`.trim();
  }
}

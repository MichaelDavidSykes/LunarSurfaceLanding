import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

type ExampleLevel = 'Simple' | 'Intermediate' | 'Advanced';

interface OverviewMetric {
  value: string;
  label: string;
  detail: string;
}

interface PlatformSurface {
  title: string;
  audience: string;
  access: string;
  summary: string;
  bullets: string[];
}

interface CapabilityCard {
  title: string;
  summary: string;
}

interface ArchitectureLayer {
  title: string;
  summary: string;
  responsibilities: string[];
}

interface GraphFact {
  title: string;
  value: string;
  detail: string;
}

interface IntegrationPath {
  title: string;
  audience: string;
  route: string;
  access: string;
  whenToUse: string;
  bullets: string[];
}

interface EndpointCard {
  title: string;
  route: string;
  access: string;
  summary: string;
  bullets: string[];
}

interface McpResourceCard {
  name: string;
  uri: string;
  purpose: string;
}

interface McpToolCard {
  name: string;
  use: string;
  why: string;
}

interface AuthoringRule {
  title: string;
  detail: string;
}

interface AqlExample {
  level: ExampleLevel;
  title: string;
  goal: string;
  query: string;
}

@Component({
  selector: 'app-api-overview',
  templateUrl: './api-overview.component.html',
  styleUrls: ['./api-overview.component.scss']
})
export class ApiOverviewComponent implements OnInit {
  constructor(private readonly route: ActivatedRoute) {}

  protected page = 'overview';

  protected readonly apiBase = 'https://api.lunarchain.net/api/v1';
  protected readonly mcpEndpoint = 'https://api.lunarchain.net/api/v1/graph/mcp';

  protected readonly overviewMetrics: OverviewMetric[] = [
    {
      value: 'AI-Enriched',
      label: 'Threat intelligence ready for action',
      detail: 'LunarChain helps organizations work with AI-enriched threat intelligence for investigation, monitoring, automation, and predictive analysis.'
    },
    {
      value: 'Connected Context',
      label: 'One intelligence graph, not isolated records',
      detail: 'Reports, indicators, infrastructure, actors, malware, tools, and locations stay connected inside one shared intelligence graph.'
    },
    {
      value: 'Multi-Access',
      label: 'People, apps, and agents use the same intelligence',
      detail: 'The frontend, the API, and LunarMCP all expose the same intelligence graph through the access model that best fits the workflow.'
    }
  ];

  protected readonly platformSurfaces: PlatformSurface[] = [
    {
      title: 'Frontend',
      audience: 'Analysts, operators, and evaluators',
      access: 'Public and authenticated UI',
      summary: 'The frontend is the human-facing layer of LunarChain. It includes the public site as well as the authenticated product experience.',
      bullets: [
        'Public pages explain the platform and show safe, curated intelligence views.',
        'Authenticated screens support exploration, reporting, targets, alerts, and day-to-day analyst workflows.',
        'It is where people consume and act on the intelligence.'
      ]
    },
    {
      title: 'LunarGraph',
      audience: 'Core intelligence data model',
      access: 'Underlying intelligence graph',
      summary: 'LunarGraph is the shared intelligence graph underneath every product surface and integration path.',
      bullets: [
        'Stores reports, indicators, actors, malware, tools, infrastructure, locations, vulnerabilities, and related entities.',
        'Preserves the relationships between those entities so users can pivot from one signal to surrounding context.',
        'Acts as the system of record for the platform.'
      ]
    },
    {
      title: 'API',
      audience: 'Frontends, internal services, and integrations',
      access: 'HTTP endpoints',
      summary: 'The API is the traditional programmatic access layer for applications that want threat intelligence backed by the intelligence graph over standard requests.',
      bullets: [
        'Supports authenticated product requests as well as narrow public routes for the landing experience.',
        'Best fit for web apps, services, and conventional integrations.',
        'Handles intelligence graph queries, summaries, metadata, and workflow endpoints.'
      ]
    },
    {
      title: 'LunarMCP',
      audience: 'MCP clients, automation frameworks, and AI agents',
      access: 'MCP session lifecycle over the backend proxy',
      summary: 'LunarMCP is the agent-facing access layer for AI systems that need guided, read-only interaction with threat intelligence.',
      bullets: [
        'Lets agents inspect schema, retrieve query guidance, and run bounded read-only queries.',
        'Designed for tool-using runtimes rather than human UI calls.',
        'Sits alongside the API, but is optimized for agentic workflows.'
      ]
    }
  ];

  protected readonly capabilityCards: CapabilityCard[] = [
    {
      title: 'Threat investigation',
      summary: 'Pivot from reports into indicators, infrastructure, actors, malware, tools, and locations through the intelligence graph.'
    },
    {
      title: 'Customer monitoring',
      summary: 'Track client targets, alerts, and report-linked activity in one operational system.'
    },
    {
      title: 'Connected enrichment',
      summary: 'Move from a single entity to nearby context through the intelligence graph instead of relying on isolated point lookups.'
    },
    {
      title: 'Agentic workflows',
      summary: 'Give agents a stable, read-only path to schema context, query guidance, and bounded execution.'
    }
  ];

  protected readonly aqlOverviewCards: CapabilityCard[] = [
    {
      title: 'What AQL is',
      summary: 'AQL, or Arango Query Language, is the query language used to read, filter, sort, and traverse the intelligence graph stored in LunarGraph.'
    },
    {
      title: 'When teams use it',
      summary: 'Use AQL when an analyst, backend service, or integration needs exact control over intelligence graph logic and the shape of the returned data.'
    },
    {
      title: 'When not to start with it',
      summary: 'If a public route, higher-level API endpoint, or MCP helper already covers the use case, use that first and drop to AQL only when you need more control.'
    }
  ];

  protected readonly architectureLayers: ArchitectureLayer[] = [
    {
      title: 'Presentation layer',
      summary: 'The public site and the analyst app are separate frontends with different trust models.',
      responsibilities: [
        'The landing site renders public visuals and docs.',
        'The analyst app drives investigation, reporting, targets, alerts, and client workflows.'
      ]
    },
    {
      title: 'Backend orchestration layer',
      summary: 'The FastAPI backend exposes auth, app APIs, intelligence graph routes, and the MCP proxy under one domain.',
      responsibilities: [
        'Separates anonymous landing-safe routes from authenticated product routes.',
        'Handles user, client, target, alert, invitation, and notification workflows.'
      ]
    },
    {
      title: 'Agent access layer',
      summary: 'LunarMCP sits in front of LunarGraph as a stable, read-only contract for agents.',
      responsibilities: [
        'Provides bootstrap resources, intelligence graph schema inspection, and bounded read-only AQL execution.',
        'Normalizes common aliases and enforces query guardrails.'
      ]
    },
    {
      title: 'Canonical intelligence graph layer',
      summary: 'LunarGraph stores the intelligence model as vertices, edges, and traversable relationships.',
      responsibilities: [
        'Uses nodes_vertex_collection for entities and reports, nodes_edge_collection for relationships, and lunargraph_graph for traversals.',
        'Supports report pivots, neighborhood exploration, and topology-aware investigation.'
      ]
    }
  ];

  protected readonly graphFacts: GraphFact[] = [
    {
      title: 'Vertex collection',
      value: 'nodes_vertex_collection',
      detail: 'Canonical home for reports, indicators, threat actors, malware, tools, infrastructure, locations, vulnerabilities, and related entities.'
    },
    {
      title: 'Edge collection',
      value: 'nodes_edge_collection',
      detail: 'Canonical relationship store for object, references, uses, targets, attributed-to, located-at, and other intelligence graph edges.'
    },
    {
      title: 'Intelligence graph name',
      value: 'lunargraph_graph',
      detail: 'Use this intelligence graph in traversal queries whenever you move from a report or entity to neighboring nodes.'
    },
    {
      title: 'Traversal key',
      value: 'Arango document _id',
      detail: 'Traversals use collection/key document identifiers, not STIX ids, when walking the intelligence graph.'
    },
    {
      title: 'Collection aliases',
      value: 'objects, nodes, relationships, edges',
      detail: 'LunarMCP and related helpers rewrite friendly aliases to the canonical vertex and edge collections.'
    },
    {
      title: 'Report freshness convention',
      value: '_is_latest == true',
      detail: 'Latest-report filters are the default way to avoid duplicate historical versions when querying operational content.'
    }
  ];

  protected readonly integrationPaths: IntegrationPath[] = [
    {
      title: 'Public landing data',
      audience: 'Public site and anonymous visitors',
      route: 'GET /graph/public/landing-threat-intelligence and related routes',
      access: 'No bearer token',
      whenToUse: 'Use this only when you need fixed, presentation-safe intelligence graph slices for the public site.',
      bullets: [
        'Backs the landing map, globe, and country drill-down.',
        'Returns pre-scoped results instead of accepting arbitrary queries.',
        'Built for presentation safety, not analyst flexibility.'
      ]
    },
    {
      title: 'Authenticated intelligence API',
      audience: 'Frontend app, internal services, and controlled integrations',
      route: 'POST /graph/aql-query, /graph/simple-query, /graph/ai-query',
      access: 'Bearer token required',
      whenToUse: 'Use this when you need analyst-grade intelligence graph access, deterministic payloads, or product orchestration.',
      bullets: [
        'Raw AQL gives the most control.',
        'simple-query handles common intelligence graph lookups with structured filters.',
        'ai-query adds product-facing summarization on top of AQL.'
      ]
    },
    {
      title: 'LunarMCP interface',
      audience: 'MCP clients and agentic systems',
      route: 'POST /graph/mcp',
      access: 'MCP initialize + session lifecycle',
      whenToUse: 'Use this when an agent needs schema context, curated guidance, and guarded read-only AQL execution.',
      bullets: [
        'Bootstrap context via resources before writing queries.',
        'Inspect schema first, then run bounded read-only AQL.',
        'Built for agent reliability, not browser interaction.'
      ]
    }
  ];

  protected readonly endpointCards: EndpointCard[] = [
    {
      title: 'Landing threat feed',
      route: 'GET /graph/public/landing-threat-intelligence',
      access: 'Public',
      summary: 'Returns grouped, recent slices of indicators, reports, malware, tools, actors, and locations for the landing site.',
      bullets: [
        'Landing only.',
        'Fixed AQL on the backend.',
        'No arbitrary query input.'
      ]
    },
    {
      title: 'Landing globe dataset',
      route: 'GET /graph/public/landing-globe',
      access: 'Public',
      summary: 'Returns globe-ready, country-linked report clusters with IOC snippets for the public visualization.',
      bullets: [
        'Optimized for the landing globe.',
        'Pre-bounded for responsiveness.',
        'Not intended as a general data export.'
      ]
    },
    {
      title: 'Country IOC preview',
      route: 'POST /graph/public/landing-country-iocs',
      access: 'Public',
      summary: 'Returns a narrow IOC preview for a selected country on the public site.',
      bullets: [
        'Accepts country name/code only.',
        'Backend builds the real query.',
        'Used for public exploration, not analyst querying.'
      ]
    },
    {
      title: 'Direct AQL',
      route: 'POST /graph/aql-query',
      access: 'Authenticated',
      summary: 'Executes explicit AQL against LunarGraph and returns the intelligence graph result with request context.',
      bullets: [
        'Best for deterministic analyst views and custom integrations.',
        'Requires a bearer token.',
        'Use bounded traversals and explicit time windows.'
      ]
    },
    {
      title: 'Structured query helper',
      route: 'POST /graph/simple-query',
      access: 'Authenticated',
      summary: 'Provides a structured filter and relationship API for common intelligence graph access patterns without hand-authoring AQL.',
      bullets: [
        'Supports boolean filters and relationship configuration.',
        'Useful for product workflows that do not need raw AQL.',
        'Still targets the same intelligence graph model underneath.'
      ]
    },
    {
      title: 'AI summary',
      route: 'POST /graph/ai-query',
      access: 'Authenticated',
      summary: 'Runs AQL and then returns an AI-generated summary of the result set for product workflows.',
      bullets: [
        'Useful when analysts need quick narrative output.',
        'Relies on a compiled AQL query from the frontend or another orchestration layer.',
        'Not a replacement for schema-aware intelligence graph querying.'
      ]
    },
    {
      title: 'Metadata helpers',
      route: 'GET /graph/collections, /graph/query-options, /graph/stix-types, /graph/aliases',
      access: 'Authenticated',
      summary: 'Expose reference metadata and platform hints for building safer queries and integrations.',
      bullets: [
        'Useful for frontend configuration and tooling support.',
        'Return collection info, aliases, and supported intelligence graph query options.',
        'Should be treated as reference helpers, not the primary integration surface.'
      ]
    },
    {
      title: 'MCP proxy',
      route: 'POST /graph/mcp',
      access: 'MCP session-based',
      summary: 'Proxies LunarMCP over streamable HTTP so agents can use the same backend domain while following MCP session semantics.',
      bullets: [
        'Supports initialize, resources/list, resources/read, tools/list, and tools/call.',
        'Carries MCP session ids in headers.',
        'Designed for agent runtimes rather than browser users.'
      ]
    }
  ];

  protected get publicEndpoints(): EndpointCard[] {
    return this.endpointCards.filter((endpoint) => endpoint.access === 'Public');
  }

  protected get authenticatedEndpoints(): EndpointCard[] {
    return this.endpointCards.filter((endpoint) => endpoint.access === 'Authenticated');
  }

  protected get agentEndpoints(): EndpointCard[] {
    return this.endpointCards.filter((endpoint) => endpoint.access !== 'Public' && endpoint.access !== 'Authenticated');
  }

  protected readonly mcpResourceHighlights: McpResourceCard[] = [
    {
      name: 'Agent Bootstrap Guide',
      uri: 'lunar://agent-bootstrap',
      purpose: 'First-session checklist that tells agents what to read before writing AQL.'
    },
    {
      name: 'LunarGraph Query Guide',
      uri: 'lunar://query-guide',
      purpose: 'Guidance for writing bounded, useful, high-signal intelligence graph queries.'
    },
    {
      name: 'Relationship Ontology',
      uri: 'lunar://relationship-ontology',
      purpose: 'Explains which relationship types are strong signals versus weak linkage.'
    },
    {
      name: 'Intelligence Graph Schema Context',
      uri: 'lunar://graph-schema',
      purpose: 'Documents canonical collections, intelligence graph name, aliases, and core query conventions.'
    },
    {
      name: 'Collection Aliases',
      uri: 'lunar://collection-aliases',
      purpose: 'Shows the friendly names that LunarMCP rewrites to the canonical collections.'
    }
  ];

  protected readonly mcpToolHighlights: McpToolCard[] = [
    {
      name: 'health_check',
      use: 'Confirm MCP availability, Arango connectivity, and current guardrail settings.',
      why: 'Use it before you run any query workload.'
    },
    {
      name: 'schema_overview',
      use: 'Inspect the current node-type and relationship-type distributions in the intelligence graph.',
      why: 'Keeps agents grounded in the live intelligence graph shape instead of stale assumptions.'
    },
    {
      name: 'relationship_type_overview',
      use: 'Get relationship counts plus guidance on the signal quality of each relationship type.',
      why: 'Helps agents avoid weak pivots and prefer stronger edges.'
    },
    {
      name: 'query_examples',
      use: 'Retrieve curated AQL examples by use case such as freshness, location, IOC, or ontology.',
      why: 'Gives agents a grounded starting point instead of inventing traversals from scratch.'
    },
    {
      name: 'run_read_query',
      use: 'Execute explicit custom AQL with read-only enforcement, result caps, runtime caps, and alias normalization.',
      why: 'This is the execution path once the agent has enough context.'
    }
  ];

  protected readonly authoringRules: AuthoringRule[] = [
    {
      title: 'Start with freshness',
      detail: 'Use _is_latest == true and explicit date bounds so you do not overcount historical versions.'
    },
    {
      title: 'Traverse with document _id',
      detail: 'When moving through the intelligence graph via lunargraph_graph, traverse from collection/key ids rather than STIX ids.'
    },
    {
      title: 'Keep queries bounded',
      detail: 'Keep traversals shallow unless you have a reason to go wider, and always constrain result volume with LIMIT and filters.'
    },
    {
      title: 'Prefer stronger edges',
      detail: 'Treat references and correlates-with as weaker evidence than uses, targets, attributed-to, indicates, or located-at.'
    }
  ];

  protected readonly mcpInstallExample = `# Python MCP client (example)
pip install "mcp>=1.18.0,<2.0.0"

# Or use any MCP-compatible client/runtime that supports streamable HTTP`;

  protected readonly mcpInitExample = `curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
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

  protected readonly mcpResourcesExample = `curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <SESSION_ID>" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"resources-1",
    "method":"resources/list",
    "params":{}
  }'`;

  protected readonly mcpToolsExample = `curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <SESSION_ID>" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"tools-1",
    "method":"tools/list",
    "params":{}
  }'`;

  protected readonly mcpHealthCheckExample = `curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <SESSION_ID>" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"tool-1",
    "method":"tools/call",
    "params":{
      "name":"health_check",
      "arguments":{}
    }
  }'`;

  protected readonly mcpQueryExample = `curl -i -X POST https://api.lunarchain.net/api/v1/graph/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <SESSION_ID>" \\
  -d '{
    "jsonrpc":"2.0",
    "id":"tool-2",
    "method":"tools/call",
    "params":{
      "name":"run_read_query",
      "arguments":{
        "query":"FOR doc IN reports FILTER doc.type == \\\"report\\\" AND doc._is_latest == true SORT doc.modified DESC LIMIT 10 RETURN { id: doc._id, name: doc.name, modified: doc.modified }",
        "result_limit":10,
        "max_runtime_seconds":12
      }
    }
  }'`;

  protected readonly curlExample = `curl -X POST https://api.lunarchain.net/api/v1/graph/aql-query \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "query": "FOR doc IN nodes_vertex_collection FILTER doc.type == \\\"report\\\" AND doc._is_latest == true SORT doc.modified DESC LIMIT 25 RETURN { id: doc._id, name: doc.name, modified: doc.modified }"
  }'`;

  protected readonly publicLandingExample = `curl https://api.lunarchain.net/api/v1/graph/public/landing-globe`;

  protected readonly publicCountryExample = `curl -X POST https://api.lunarchain.net/api/v1/graph/public/landing-country-iocs \\
  -H "Content-Type: application/json" \\
  -d '{
    "country_code": "US",
    "country_name": "United States"
  }'`;

  protected readonly payloadExample = `{
  "query": "LET startDate = DATE_ISO8601(DATE_SUBTRACT(DATE_NOW(), \\\"30 days\\\"))\\nFOR doc IN nodes_vertex_collection\\n  FILTER doc.type == \\\"report\\\" AND doc._is_latest == true\\n  FILTER doc.created >= startDate\\n  SORT doc.modified DESC\\n  LIMIT 50\\n  RETURN { id: doc._id, name: doc.name, modified: doc.modified }",
  "bind_vars": {},
  "options": {
    "maxRuntime": 20
  }
}`;

  protected readonly successResponseExample = `{
  "validation": {
    "skipped": true,
    "reason": "validation handled by gateway"
  },
  "results": {
    "result": [
      {
        "id": "nodes_vertex_collection/report--...",
        "name": "Article: ...",
        "modified": "2026-04-14T02:18:28.261361Z"
      }
    ]
  },
  "query": "FOR doc IN nodes_vertex_collection ...",
  "rewritten": false,
  "bind_vars": {}
}`;

  protected readonly publicResponseExample = `{
  "status": "success",
  "data": [
    {
      "location": "US",
      "locationName": "United States",
      "report": "Article: ...",
      "highlightIocs": [
        {
          "type": "indicator",
          "name": "Domain: example.com",
          "value": null,
          "pattern": "[ domain-name:value = 'example.com' ]"
        }
      ]
    }
  ]
}`;

  protected readonly errorResponseExample = `{
  "detail": {
    "message": "Graph API validation error",
    "details": "collection or view not found: reports"
  }
}`;

  protected readonly mcpRequestExample = `{
  "jsonrpc": "2.0",
  "id": "tool-1",
  "method": "tools/call",
  "params": {
    "name": "health_check",
    "arguments": {}
  }
}`;

  protected readonly mcpResponseExample = `event: message
data: {
  "jsonrpc": "2.0",
  "id": "tool-1",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{ ... health payload ... }"
      }
    ],
    "structuredContent": {
      "status": "ok",
      "config": {
        "mcp_transport": "streamable-http",
        "default_runtime_seconds": 20.0,
        "max_result_limit": 300
      },
      "arango": {
        "version": "3.11.14"
      }
    },
    "isError": false
  }
}`;

  protected readonly aqlExamples: AqlExample[] = [
    {
      level: 'Simple',
      title: 'Latest Reports',
      goal: 'Get the most recent reports in the intelligence graph.',
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
}

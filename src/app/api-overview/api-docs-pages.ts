export const API_DOCS_PAGE_IDS = [
  'overview',
  'quick-start',
  'base-configuration',
  'endpoint-focus',
  'mcp-server',
  'payload-response',
  'aql-playbook'
] as const;

export type ApiDocsPageId = typeof API_DOCS_PAGE_IDS[number];

const API_DOCS_PAGE_ID_SET: ReadonlySet<string> = new Set(API_DOCS_PAGE_IDS);

export function isApiDocsPageId(page: string | undefined): page is ApiDocsPageId {
  return page !== undefined && API_DOCS_PAGE_ID_SET.has(page);
}

import { decodeDocsFragment } from './api-docs-layout.component';

describe('decodeDocsFragment', () => {
  it('falls back to the raw fragment when a URL hash is malformed', () => {
    expect(decodeDocsFragment('%E0%A4%A')).toBe('%E0%A4%A');
  });

  it('decodes valid URL fragments for element lookup', () => {
    expect(decodeDocsFragment('mcp%20examples')).toBe('mcp examples');
  });
});

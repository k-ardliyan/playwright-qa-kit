import { test, expect } from '@playwright/test';
import { normalizeOrigin, resolveAllowedOrigins } from '../../shared/mcp/origin-resolver';

test.describe('MCP origin resolution (MCP-011)', () => {
  test('normalizes local and staging URLs to canonical origins', () => {
    expect(normalizeOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    expect(normalizeOrigin('https://staging.app.com')).toBe('https://staging.app.com');
    expect(normalizeOrigin('https://staging.app.com:8080/path?x=1')).toBe(
      'https://staging.app.com:8080',
    );
  });

  test('rejects malformed input instead of ever allowing wildcard-all', () => {
    expect(normalizeOrigin('*')).toBeNull();
    expect(normalizeOrigin('')).toBeNull();
    expect(normalizeOrigin('   ')).toBeNull();
    expect(normalizeOrigin('staging.app.com')).toBeNull(); // no scheme
    expect(normalizeOrigin('ftp://staging.app.com')).toBeNull(); // non-http
    expect(normalizeOrigin('https://')).toBeNull(); // no hostname
    expect(normalizeOrigin('not a url')).toBeNull();
  });

  test('resolves from baseUrl and apiBaseUrl, dedupes, and never emits a wildcard', () => {
    const r = resolveAllowedOrigins({
      baseUrl: 'https://app.test',
      apiBaseUrl: 'https://api.app.test',
      extraOrigins: ['https://app.test'], // duplicate
    });
    expect(r).toEqual(['https://app.test', 'https://api.app.test']);
    expect(r).not.toContain('*');
  });

  test('falls back to localhost:3000 when nothing resolves', () => {
    const r = resolveAllowedOrigins({ baseUrl: 'malformed', apiBaseUrl: 'https://' });
    expect(r).toEqual(['http://localhost:3000']);
  });
});

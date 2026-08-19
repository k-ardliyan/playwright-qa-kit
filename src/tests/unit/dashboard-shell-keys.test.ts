import { test, expect } from '@playwright/test';
import { renderDocumentShell, jsonForScript } from '../../support/custom-dashboard/shared';
import type { TestSummary } from '../../support/custom-dashboard/types';

const emptySummary: TestSummary = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  passRate: 0,
  timestamp: new Date().toISOString(),
  reportMode: 'general',
  rolesInScope: [],
  runMeta: {
    appEnv: 'local',
    runId: 'run-1',
    ci: false,
    totalDurationMs: 0,
    generatedAt: new Date().toISOString(),
  },
  testCases: [],
};

test.describe('dashboard shell interactive state keys', () => {
  test('column visibility key is v3 (bust stale v2 localStorage)', () => {
    const html = renderDocumentShell({
      pageTitle: 'test',
      mode: 'local',
      summary: emptySummary,
      collectedTests: [],
      body: '',
      includeChart: false,
    });
    expect(html).toContain("var COL_KEY = 'dashboard-columns-v3'");
    // Must NOT still reference v2 (stale state would hide new taxonomy columns).
    expect(html).not.toContain('dashboard-columns-v2');
  });

  test('jsonForScript keeps embedded JSON parseable with hostile strings', () => {
    const out = jsonForScript({ qaNotes: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out)).toEqual({ qaNotes: '</script><script>alert(1)</script>' });
  });
});

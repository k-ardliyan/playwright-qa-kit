import { test, expect } from '@playwright/test';
import { buildHistorySection } from '../../support/custom-dashboard/build-history-view';
import type { ReportHistoryEntry } from '../../agents/reporter/report-history';

const sampleEntry: ReportHistoryEntry = {
  runId: 'run-20260730-140422-162',
  ranAt: '2026-07-30T14:04:20.000Z',
  savedAt: '2026-07-30T14:04:22.000Z',
  appEnv: 'local',
  passRate: 75,
  totalTests: 12,
  passed: 9,
  failed: 2,
  skipped: 1,
  status: 'partial',
  qaDecision: 'FIX_TEST',
  qaNotes: 'flaky selector',
  triggerSource: 'test',
  requirementPath: 'requirements/sample.md',
  reportMode: 'general',
};

test.describe('history section static vs serve mode', () => {
  test('static mode renders Compare button with server hint (no dead hash link)', () => {
    const html = buildHistorySection([{ ...sampleEntry }], { serveMode: false });
    expect(html).toContain('Compare requires the dashboard server');
    expect(html).not.toContain("window.location.hash='#/compare");
  });

  test('serve mode renders Compare button with working hash navigation', () => {
    const html = buildHistorySection([{ ...sampleEntry }], { serveMode: true });
    expect(html).toContain("window.location.hash='#/compare?current=");
    expect(html).not.toContain('Compare requires the dashboard server');
  });

  test('escapeHtml on runId stays safe in onclick attrs', () => {
    const html = buildHistorySection([{ ...sampleEntry, runId: 'run-1' }], { serveMode: true });
    expect(html).toContain("showArchiveDetail('run-1')");
  });
});

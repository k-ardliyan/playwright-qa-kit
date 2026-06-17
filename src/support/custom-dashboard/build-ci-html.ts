import { renderDocumentShell, renderDonutPanel } from './shared';
import { renderTestAccordion } from './render-test-detail';
import type { CollectedTestData, TestSummary } from './types';

export function buildCiHtml(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  const failedTests = collectedTests.filter((testData) =>
    ['failed', 'timedOut', 'interrupted'].includes(testData.status),
  );

  const body = `
    <div class="layout">
      ${renderDonutPanel()}
      <div class="panel">
        <h2 class="panel__title">Overview</h2>
        <p class="empty-state" style="margin: 0 0 8px;"><strong>Mode:</strong> CI · <strong>Total:</strong> ${summary.total} · <strong>Unhealthy:</strong> ${failedTests.length}</p>
      </div>
    </div>

    <h2 class="section-title">Detailed Test Records</h2>
    <div class="test-accordion">
      ${renderTestAccordion(collectedTests)}
    </div>

    <div class="alert alert--warning">
      <strong>Unhealthy Cases:</strong> ${failedTests.length} failing/timed out/interrupted test(s) detected.
    </div>
  `;

  return renderDocumentShell({
    pageTitle: 'Playwright Custom Dashboard (CI Detailed)',
    mode: 'ci',
    summary,
    body,
    includeChart: true,
  });
}

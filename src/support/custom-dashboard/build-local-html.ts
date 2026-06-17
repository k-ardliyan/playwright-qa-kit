import { renderDocumentShell, renderDonutPanel } from './shared';
import { renderTestAccordion } from './render-test-detail';
import type { CollectedTestData, TestSummary } from './types';

export function buildLocalHtml(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  const body = `
    <div class="layout">
      ${renderDonutPanel()}
      <div class="panel">
        <h2 class="panel__title">Overview</h2>
        <p class="empty-state" style="margin: 0 0 8px;"><strong>Mode:</strong> Local · <strong>Total:</strong> ${summary.total}</p>
      </div>
    </div>

    <h2 class="section-title">Detailed Test Records</h2>
    <div class="test-accordion">
      ${renderTestAccordion(collectedTests)}
    </div>
  `;

  return renderDocumentShell({
    pageTitle: 'Playwright Custom Dashboard (Local)',
    mode: 'local',
    summary,
    body,
    includeChart: true,
  });
}

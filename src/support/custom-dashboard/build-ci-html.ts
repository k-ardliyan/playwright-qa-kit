import {
  renderDeepLinksPanel,
  renderDocumentShell,
  renderFailureAlert,
  renderLegendPanel,
  renderOpsSummaryPanel,
  renderRunHealthPanel,
} from './shared';
import { renderTestAccordion } from './render-test-detail';
import type { CollectedTestData, TestSummary } from './types';

const UNHEALTHY_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);

export function buildCiHtml(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  const unhealthyCount = collectedTests.filter((testData) =>
    UNHEALTHY_STATUSES.has(testData.status),
  ).length;

  const body = `
    <div class="report-layout">
      <aside class="rail">
        ${renderRunHealthPanel()}
        ${renderOpsSummaryPanel('ci', summary, collectedTests)}
        ${renderLegendPanel()}
        ${renderDeepLinksPanel()}
      </aside>

      <section class="main-column">
        ${renderFailureAlert(unhealthyCount)}

        <section class="panel">
          <div class="section-head">
            <div>
              <h2 class="section-title">Detailed test records</h2>
              <div class="section-copy">CI incident board. Unhealthy cases surface first so engineers can isolate regression paths fast.</div>
            </div>
          </div>
          ${renderTestAccordion(collectedTests)}
        </section>
      </section>
    </div>
  `;

  return renderDocumentShell({
    pageTitle: 'Playwright Custom Dashboard (CI Detailed)',
    mode: 'ci',
    summary,
    collectedTests,
    body,
    includeChart: true,
  });
}

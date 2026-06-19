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

export function buildLocalHtml(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  const unhealthyCount = collectedTests.filter((testData) =>
    UNHEALTHY_STATUSES.has(testData.status),
  ).length;

  const body = `
    <div class="report-layout">
      <aside class="rail">
        ${renderRunHealthPanel()}
        ${renderOpsSummaryPanel('local', summary, collectedTests)}
        ${renderLegendPanel()}
        ${renderDeepLinksPanel()}
      </aside>

      <section class="main-column">
        ${renderFailureAlert(unhealthyCount)}

        <section class="panel">
          <div class="section-head">
            <div>
              <h2 class="section-title">Detailed test records</h2>
              <div class="section-copy">Failure-first triage view for local debugging, reruns, and evidence review.</div>
            </div>
          </div>
          ${renderTestAccordion(collectedTests)}
        </section>
      </section>
    </div>
  `;

  return renderDocumentShell({
    pageTitle: 'Playwright Custom Dashboard (Local)',
    mode: 'local',
    summary,
    collectedTests,
    body,
    includeChart: true,
  });
}

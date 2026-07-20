import {
  renderDeepLinksPanel,
  renderDocumentShell,
  renderFailureAlert,
  renderLegendPanel,
  renderOpsSummaryPanel,
  renderRunHealthPanel,
} from './shared';
import { renderTestAccordion } from './render-test-detail';
import { buildTableView } from './build-table-view';
import type { CollectedTestData, TestSummary } from './types';

const UNHEALTHY_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);

const MODE_COPY: Record<'ci' | 'local', { title: string; copy: string }> = {
  ci: {
    title: 'Playwright Custom Dashboard (CI Detailed)',
    copy: 'CI incident board. Unhealthy cases surface first so engineers can isolate regression paths fast.',
  },
  local: {
    title: 'Playwright Custom Dashboard (Local)',
    copy: 'Failure-first triage view for local debugging, reruns, and evidence review.',
  },
};

/**
 * Shared dashboard HTML builder used by both buildCiHtml and buildLocalHtml.
 * The only differences between CI and Local are the page title, the ops summary
 * panel mode label, and the section copy text — everything else is identical.
 */
export function buildDashboardHtml(
  mode: 'ci' | 'local',
  summary: TestSummary,
  collectedTests: CollectedTestData[],
): string {
  const unhealthyCount = collectedTests.filter((t) => UNHEALTHY_STATUSES.has(t.status)).length;
  const { title, copy } = MODE_COPY[mode];

  const viewToggle = `
    <div class="view-toggle" role="tablist" aria-label="View mode">
      <button class="toggle-btn toggle-btn--active" role="tab"
              aria-selected="true" data-view="table"
              id="tab-table" aria-controls="view-table" type="button">
        ⊞ Table
      </button>
      <button class="toggle-btn" role="tab"
              aria-selected="false" data-view="accordion"
              id="tab-accordion" aria-controls="view-accordion" type="button">
        ☰ Accordion
      </button>
    </div>
  `;

  const dualPanel = `
    <div id="view-accordion" class="view-panel view-panel--hidden"
         role="tabpanel" aria-labelledby="tab-accordion" aria-hidden="true">
      ${renderTestAccordion(collectedTests)}
    </div>
    <div id="view-table" class="view-panel view-panel--active"
         role="tabpanel" aria-labelledby="tab-table">
      ${buildTableView(summary, collectedTests)}
    </div>
  `;

  const body = `
    <details class="info-strip">
      <summary class="info-strip__toggle">Info & References</summary>
      <div class="info-strip__grid">
        <div class="info-panel">
          ${renderRunHealthPanel()}
        </div>
        <div class="info-panel">
          ${renderOpsSummaryPanel(mode, summary, collectedTests)}
        </div>
        <div class="info-panel">
          ${renderLegendPanel()}
        </div>
        <div class="info-panel">
          ${renderDeepLinksPanel()}
        </div>
      </div>
    </details>

    <div class="report-layout">
      <section class="main-column">
        ${renderFailureAlert(unhealthyCount)}

        <section class="panel">
          <div class="section-head">
            <div>
              <h2 class="section-title">Detailed test records</h2>
              <div class="section-copy">${copy}</div>
            </div>
            ${viewToggle}
          </div>
          ${dualPanel}
        </section>
      </section>
    </div>
  `;

  return renderDocumentShell({
    pageTitle: title,
    mode,
    summary,
    collectedTests,
    body,
    includeChart: true,
  });
}

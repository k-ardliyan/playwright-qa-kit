import {
  renderArtifactsStrip,
  renderDocumentShell,
  renderFailureAlert,
  renderRoleHealthStrip,
} from './shared';
import { renderAccordionToolbar, renderTestAccordion } from './render-test-detail';
import { buildTableView, renderTableToolbar } from './build-table-view';
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

function renderCommandBar(summary: TestSummary): string {
  const roles = summary.rolesInScope || [];
  const roleOptions =
    roles.length > 0
      ? `<select id="filter-role" class="cmd-select" aria-label="Filter by role">
          <option value="">All roles</option>
          ${roles.map((r) => `<option value="${r}">${r}</option>`).join('')}
        </select>`
      : '';

  return `
    <div class="command-bar" id="command-bar">
      <label class="cmd-search-wrap" for="dash-search">
        <span class="cmd-search__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </span>
        <span class="sr-only">Search tests</span>
        <input id="dash-search" class="cmd-search" type="search" placeholder="Search test id, title, error..." autocomplete="off" />
      </label>

      <select id="filter-status" class="cmd-select" aria-label="Filter by status">
        <option value="">All statuses</option>
        <option value="failed">Failed / unhealthy</option>
        <option value="passed">Passed</option>
        <option value="skipped">Skipped</option>
      </select>

      <select id="filter-priority" class="cmd-select" aria-label="Filter by priority">
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      ${roleOptions}

      <label class="cmd-check">
        <input type="checkbox" id="filter-evidence" />
        <span>Has evidence</span>
      </label>

      <span id="filter-count" class="filter-count" aria-live="polite">Showing …</span>
    </div>
  `;
}

/**
 * Shared dashboard HTML builder used by both buildCiHtml and buildLocalHtml.
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
        Table
      </button>
      <button class="toggle-btn" role="tab"
              aria-selected="false" data-view="accordion"
              id="tab-accordion" aria-controls="view-accordion" type="button">
        Accordion
      </button>
    </div>
  `;

  // View panels only (no toolbars nested here).
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

  // Toolbars are top-level siblings of .report-layout (NOT inside panel/view).
  const body = `
    ${renderCommandBar(summary)}
    ${renderRoleHealthStrip(summary, collectedTests)}
    ${renderFailureAlert(unhealthyCount)}

    <section class="command-zone" aria-label="View controls">
      <div class="section-head section-head--toolbar">
        <div>
          <h2 class="section-title">Detailed test records</h2>
          <div class="section-copy">${copy}</div>
        </div>
        ${viewToggle}
      </div>
    </section>

    ${renderTableToolbar()}
    ${renderAccordionToolbar()}

    <div class="report-layout">
      <section class="main-column">
        <section class="panel panel--bleed">
          ${dualPanel}
        </section>
      </section>
    </div>

    <p class="results-footer" id="results-footer">Total ${collectedTests.length} results</p>

    ${renderArtifactsStrip(collectedTests)}
  `;

  return renderDocumentShell({
    pageTitle: title,
    mode,
    summary,
    collectedTests,
    body,
    includeChart: false,
  });
}

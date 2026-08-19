import {
  renderArtifactsStrip,
  renderDocumentShell,
  renderFailureAlert,
  renderHero,
  renderRoleHealthStrip,
  jsonForScript,
} from './shared';
import { renderAccordionToolbar, renderTestAccordion } from './render-test-detail';
import { buildTableView, renderTableToolbar } from './build-table-view';
import { buildHistoryJs, buildSaveModal, buildHistorySection } from './build-history-view';
import { renderHashNav, buildHashRouterJs } from './build-hash-router';
import type { ReportHistoryEntry } from '../../agents/reporter/report-history';
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

export interface DashboardOptions {
  /** Whether a latest test run exists (for Save to History banner). */
  hasLatestRun?: boolean;
  /** Whether the latest run has already been archived by QA. */
  latestRunArchived?: boolean;
  /**
   * When true, the dashboard is served via dashboard-server.ts (localhost).
   * Buttons call fetch() API instead of copying CLI commands.
   * Default: false (static HTML mode).
   */
  serveMode?: boolean;
}

/** Slide-over Test Inspection Drawer shell. */
function renderInspectionDrawer(): string {
  return `
    <div class="drawer-backdrop" id="drawer-backdrop" hidden onclick="closeTestDrawer()"></div>
    <aside class="test-drawer" id="test-drawer" hidden aria-label="Test Inspection Details">
      <div class="drawer-header">
        <div class="drawer-header__title-group">
          <span class="drawer-test-id" id="drawer-test-id">SC-01</span>
          <h2 class="drawer-test-title" id="drawer-test-title">Test Title</h2>
        </div>
        <button type="button" class="drawer-close-btn" onclick="closeTestDrawer()" aria-label="Close drawer">✕</button>
      </div>

      <div class="drawer-meta-bar" id="drawer-meta-bar"></div>

      <div class="drawer-tabs" role="tablist" aria-label="Inspection tabs">
        <button class="drawer-tab drawer-tab--active" id="dtab-trace" role="tab" aria-selected="true" data-drawer-tab="trace" onclick="switchDrawerTab('trace')">
          Error & Stack Trace
        </button>
        <button class="drawer-tab" id="dtab-steps" role="tab" aria-selected="false" data-drawer-tab="steps" onclick="switchDrawerTab('steps')">
          Steps Timeline
        </button>
        <button class="drawer-tab" id="dtab-evidence" role="tab" aria-selected="false" data-drawer-tab="evidence" onclick="switchDrawerTab('evidence')">
          Evidence & Media
        </button>
        <button class="drawer-tab" id="dtab-diagnosis" role="tab" aria-selected="false" data-drawer-tab="diagnosis" onclick="switchDrawerTab('diagnosis')">
          AI Triage & Cause
        </button>
      </div>

      <div class="drawer-body">
        <div class="drawer-panel drawer-panel--active" id="drawer-panel-trace">
          <div id="drawer-content-trace" class="drawer-content">Select a test to view error details.</div>
        </div>
        <div class="drawer-panel drawer-panel--hidden" id="drawer-panel-steps">
          <div id="drawer-content-steps" class="drawer-content">Select a test to view steps.</div>
        </div>
        <div class="drawer-panel drawer-panel--hidden" id="drawer-panel-evidence">
          <div id="drawer-content-evidence" class="drawer-content">No media attachments available.</div>
        </div>
        <div class="drawer-panel drawer-panel--hidden" id="drawer-panel-diagnosis">
          <div id="drawer-content-diagnosis" class="drawer-content">No diagnosis available.</div>
        </div>
      </div>
    </aside>
  `;
}

function buildDrawerClientJs(): string {
  return `
    <script>
    (function() {
      window.openTestDrawer = function(testId) {
        var testDataMap = window.__TEST_DATA_MAP__ || {};
        var data = testDataMap[testId];

        if (!data) {
          var keys = Object.keys(testDataMap);
          for (var i = 0; i < keys.length; i++) {
            if (keys[i].toLowerCase() === String(testId).toLowerCase()) {
              data = testDataMap[keys[i]];
              break;
            }
          }
        }
        if (!data) return;

        var drawer = document.getElementById('test-drawer');
        var backdrop = document.getElementById('drawer-backdrop');
        if (!drawer || !backdrop) return;

        document.getElementById('drawer-test-id').textContent = data.testId || 'TEST';
        document.getElementById('drawer-test-title').textContent = data.title || 'Untitled Test';

        var metaBar = document.getElementById('drawer-meta-bar');
        var statusCls = data.status === 'passed' ? 'status-pill--passed' : data.status === 'skipped' ? 'status-pill--skipped' : 'status-pill--failed';
        // All test-controlled strings are escaped before innerHTML (XSS fix).
        var html = '<span class="status-pill ' + statusCls + '">' + escapeHtml(String(data.status || 'unknown').toUpperCase()) + '</span>';
        if (data.priority) {
          html += ' <span class="priority-badge priority-badge--' + escapeHtml(String(data.priority).toLowerCase()) + '">' + escapeHtml(String(data.priority).toUpperCase()) + '</span>';
        }
        if (data.module) {
          html += ' <span class="module-chip">' + escapeHtml(data.module) + '</span>';
        }
        if (data.feature) {
          html += ' <span class="feature-chip">' + escapeHtml(data.feature) + '</span>';
        }
        if (data.failureSource) {
          html += ' <span class="failure-source failure-source--' + escapeHtml(String(data.failureSource)) + '">Cause: ' + escapeHtml(String(data.failureSource).toUpperCase()) + '</span>';
        }
        metaBar.innerHTML = html;

        var traceContent = document.getElementById('drawer-content-trace');
        var errText = data.errorMessage || (data.errors && data.errors.length > 0 ? data.errors.map(function(e){ return e.message + (e.stack ? String.fromCharCode(10) + e.stack : ''); }).join(String.fromCharCode(10) + String.fromCharCode(10)) : '');
        if (errText) {
          traceContent.innerHTML = '<pre class="test-error-view error-block">' + escapeHtml(errText) + '</pre>';
        } else if (data.status === 'passed') {
          traceContent.innerHTML = '<div class="drawer-ok-view"><svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="var(--passed)"/><path d="M4.5 8.2l2.3 2.3 4.7-4.8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="empty-state--ok">Test passed cleanly — no errors recorded.</span></div>';
        } else {
          traceContent.innerHTML = '<p class="empty-state">No errors recorded for this test case.</p>';
        }

        var stepsContent = document.getElementById('drawer-content-steps');
        if (data.steps && data.steps.length > 0) {
          stepsContent.innerHTML = '<div class="tree-item-list">' + data.steps.map(function(st) {
            var icon = st.status === 'passed' ? '✓' : st.status === 'skipped' ? '⊘' : '✕';
            var iconCls = st.status === 'passed' ? 'tree-item__status--passed' : st.status === 'skipped' ? 'tree-item__status--skipped' : 'tree-item__status--failed';
            return '<div class="tree-item"><span class="tree-item__status ' + iconCls + '">' + icon + '</span> ' + escapeHtml(st.title) + ' <span class="tree-item__duration">' + st.duration + 'ms</span></div>';
          }).join('') + '</div>';
        } else {
          stepsContent.innerHTML = '<p class="empty-state">' + (data.status === 'passed'
            ? 'No step-level trace recorded. Test completed successfully.'
            : 'No steps recorded.' + (data.duration ? ' Total duration: ' + data.duration + 'ms.' : '')) + '</p>';
        }

        var evContent = document.getElementById('drawer-content-evidence');
        if (data.attachments && data.attachments.length > 0) {
          evContent.innerHTML = data.attachments.map(function(att) {
            if (att.kind === 'screenshot') {
              return '<figure class="attachment-card"><img src="' + escapeHtml(att.relativePath) + '" style="max-width:100%;border-radius:6px;" /><figcaption>' + escapeHtml(att.name) + '</figcaption></figure>';
            }
            if (att.kind === 'trace') {
              return '<a class="attachment-chip attachment-chip--trace" href="' + escapeHtml(att.relativePath) + '" target="_blank" rel="noopener">Open Trace Viewer · ' + escapeHtml(att.name) + '</a>';
            }
            return '<div class="attachment-chip">' + escapeHtml(att.name) + '</div>';
          }).join('<br>');
        } else {
          var evNote = 'No attachments or evidence captured for this test.';
          if ((data.attachmentCount || 0) > 0) {
            evNote = data.attachmentCount + ' attachment(s) recorded but unavailable in serve mode.';
          }
          evContent.innerHTML = '<p class="empty-state">' + evNote + '</p>';
        }

        var diagContent = document.getElementById('drawer-content-diagnosis');
        if (data.failureSource) {
          diagContent.innerHTML = '<div class="src-cell"><p><strong>Failure Source:</strong> ' + escapeHtml(data.failureSource.toUpperCase()) + '</p><p><strong>Expected vs Actual:</strong></p><pre>Expected: ' + escapeHtml(data.expectedResult || '-') + String.fromCharCode(10) + 'Actual: ' + escapeHtml(data.actualResult || '-') + '</pre></div>';
        } else {
          // Passed test — surface the verifiable evidence instead of an empty state
          var kv = '';
          if (data.inputData && Object.keys(data.inputData).length) {
            kv = '<p><strong>Input Data:</strong></p><div class="drawer-kv">' + Object.keys(data.inputData).map(function(k) {
              return '<div class="drawer-kv__row"><span class="drawer-kv__k">' + escapeHtml(k) + '</span><span class="drawer-kv__v">' + escapeHtml(data.inputData[k]) + '</span></div>';
            }).join('') + '</div>';
          }
          var layers = (data.affectedLayer && data.affectedLayer.length) ? data.affectedLayer.join(', ') : '-';
          diagContent.innerHTML = '<div class="src-cell src-cell--ok"><p><strong>✅ Test verified — no diagnosis needed</strong></p>' +
            '<p><strong>Expected:</strong> ' + escapeHtml(data.expectedResult || '-') + '</p>' +
            '<p><strong>Actual:</strong> ' + escapeHtml(data.actualResult || '-') + '</p>' +
            kv +
            '<p><strong>Affected Layer:</strong> ' + escapeHtml(layers) + '</p>' +
            '<p><strong>Duration:</strong> ' + escapeHtml(String(data.duration || 0)) + 'ms</p></div>';
        }

        window.switchDrawerTab('trace');
        drawer.hidden = false;
        backdrop.hidden = false;
      };

      window.closeTestDrawer = function() {
        var drawer = document.getElementById('test-drawer');
        var backdrop = document.getElementById('drawer-backdrop');
        if (drawer && backdrop) {
          drawer.hidden = true;
          backdrop.hidden = true;
        }
      };

      window.switchDrawerTab = function(tabName) {
        var tabs = ['trace', 'steps', 'evidence', 'diagnosis'];
        tabs.forEach(function(t) {
          var tabBtn = document.getElementById('dtab-' + t);
          var panel = document.getElementById('drawer-panel-' + t);
          if (tabBtn && panel) {
            var active = t === tabName;
            tabBtn.classList.toggle('drawer-tab--active', active);
            tabBtn.setAttribute('aria-selected', active ? 'true' : 'false');
            panel.classList.toggle('drawer-panel--active', active);
            panel.classList.toggle('drawer-panel--hidden', !active);
          }
        });
      };

      // Event delegation: clicking any row with [data-test-id] opens the drawer.
      // Avoids inline onclick with interpolated testId (quote-injection safe).
      document.addEventListener('click', function(ev) {
        var el = ev.target;
        while (el && el !== document) {
          if (el.getAttribute && el.hasAttribute('data-test-id')) {
            var id = el.getAttribute('data-test-id');
            if (id) window.openTestDrawer(id);
            break;
          }
          el = el.parentNode;
        }
      });

      function escapeHtml(str) {
        return String(str == null ? '' : str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    })();
    </script>
  `;
}

/**
 * Shared dashboard HTML builder used by both buildCiHtml and buildLocalHtml.
 */
export function buildDashboardHtml(
  mode: 'ci' | 'local',
  summary: TestSummary,
  collectedTests: CollectedTestData[],
  history?: ReportHistoryEntry[],
  options?: DashboardOptions,
): string {
  const unhealthyCount = collectedTests.filter((t) => UNHEALTHY_STATUSES.has(t.status)).length;
  const { title, copy } = MODE_COPY[mode];

  const hasLatestRun = options?.hasLatestRun ?? false;
  const latestRunArchived = options?.latestRunArchived ?? false;
  const serveMode = options?.serveMode ?? false;

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

  const saveBannerTop =
    hasLatestRun && !latestRunArchived
      ? `<div class="save-banner-top" id="save-banner">
          <div class="save-banner-top__content">
            <span class="save-banner-top__icon">💾</span>
            <span class="save-banner-top__text">Run selesai — belum disimpan ke history</span>
          </div>
          <div class="save-banner-top__actions">
            <button class="btn-save-primary" onclick="openSaveModal()" type="button">
              💾 Save to History
            </button>
            <button class="btn-dismiss-sm" onclick="dismissSaveBanner()" type="button" aria-label="Dismiss">✕</button>
          </div>
        </div>`
      : '';

  const testDataMapJson = jsonForScript(
    collectedTests.reduce(
      (acc, t, idx) => {
        const key = t.testId || `test-${idx}`;
        acc[key] = t;
        return acc;
      },
      {} as Record<string, CollectedTestData>,
    ),
  );

  const body = `
    ${serveMode ? renderHashNav() : ''}
    ${saveBannerTop}
    ${buildSaveModal()}
    ${renderInspectionDrawer()}

    <script>
      window.__TEST_DATA_MAP__ = ${testDataMapJson};
      window.__SERVE_MODE__ = ${serveMode};
    </script>

    <div id="primary-view">
      ${renderHero(mode, summary, collectedTests)}
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
    </div>

    <div id="frag-host" hidden aria-live="polite"></div>

    ${
      !serveMode
        ? `<section class="view-panel static-history" id="view-history-static" aria-label="Report History">
          ${buildHistorySection(history ?? [], { hasLatestRun, latestRunArchived, serveMode })}
        </section>`
        : ''
    }

    ${buildHistoryJs({ serveMode })}
    ${serveMode ? buildHashRouterJs() : ''}
    ${buildDrawerClientJs()}
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

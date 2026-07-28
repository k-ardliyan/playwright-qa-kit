import type { CollectedTestData, ReportMode, RoleGroup, TestSummary } from './types';
import {
  buildExportScript,
  renderActualResultCell,
  renderInputDataCell,
  renderMultilineTextCell,
  renderNotesCell,
  renderPriorityBadge,
  renderStatusBadge,
  renderStepsCell,
  toConfluenceHtml,
  toCsv,
  toConfluenceMarkup,
  toTsv,
} from './export-helpers';
import { escapeHtml } from './shared';
import { buildFilterDataAttrs, toExportPayload } from './filter-attrs';
import { decisionHintFor, decisionHintTooltipFor, decisionHintBlurbFor } from './failure-source';

function buildRoleGroups(tests: CollectedTestData[]): RoleGroup[] {
  const roleMap = new Map<string, CollectedTestData[]>();
  for (const test of tests) {
    const role = test.role || 'general';
    if (!roleMap.has(role)) roleMap.set(role, []);
    roleMap.get(role)!.push(test);
  }
  return [...roleMap.entries()].map(([role, roleTests]) => ({ role, tests: roleTests }));
}

function renderFailureSourceCell(test: CollectedTestData): string {
  if (!test.failureSource) {
    return '<span class="muted">-</span>';
  }
  const src = test.failureSource;
  const hint = decisionHintFor(src);
  const tip = decisionHintTooltipFor(src, test.errorMessage);
  const blurb = decisionHintBlurbFor(src, test.errorMessage);
  // Stacked: source badge → decision → short blurb (tooltip = full meaning)
  return `<div class="src-cell" title="${escapeHtml(tip)}">
      <div class="src-cell__row">
        <span class="src-cell__k">Cause</span>
        <span class="failure-source failure-source--${escapeHtml(src)}">${escapeHtml(src.toUpperCase())}</span>
      </div>
      <div class="src-cell__row">
        <span class="src-cell__k">Do</span>
        <span class="decision-hint">${escapeHtml(hint)}</span>
      </div>
      <p class="src-cell__blurb">${escapeHtml(blurb)}</p>
    </div>`;
}

function renderTableRow(test: CollectedTestData, rowKey: string): string {
  // Only Test ID sticks on the left.
  return `
    <tr class="tbl-row tbl-row--${test.status}" ${buildFilterDataAttrs(test, rowKey)}>
      <td class="tbl-test-id col-sticky-0" data-col="testId"><code>${escapeHtml(test.testId || '-')}</code></td>
      <td class="tbl-module" data-col="module"><span class="module-chip">${escapeHtml(test.module || 'general')}</span></td>
      <td class="tbl-feature" data-col="feature"><span class="feature-chip">${escapeHtml(test.feature || 'general')}</span></td>
      <td class="tbl-description" data-col="description">${renderMultilineTextCell(test.title, 'tbl-title')}</td>
      <td class="tbl-steps col-tertiary" data-col="steps">${renderStepsCell(test.steps)}</td>
      <td class="tbl-input col-secondary" data-col="input">${renderInputDataCell(test.inputData)}</td>
      <td class="tbl-expected col-secondary" data-col="expected">${renderMultilineTextCell(test.expectedResult || '-', 'tbl-expected__text')}</td>
      <td class="tbl-actual" data-col="actual">${renderActualResultCell(test)}</td>
      <td class="tbl-status" data-col="status">${renderStatusBadge(test.status)}</td>
      <td class="tbl-priority" data-col="priority">${renderPriorityBadge(test.priority)}</td>
      <td class="tbl-source" data-col="source">${renderFailureSourceCell(test)}</td>
      <td class="tbl-notes" data-col="notes">${renderNotesCell(test)}</td>
    </tr>
  `;
}

function headerRow(): string {
  return `
    <tr>
      <th class="col-sticky-0" data-col="testId">TEST ID</th>
      <th data-col="module">MODULE</th>
      <th data-col="feature">FEATURE</th>
      <th data-col="description">DESCRIPTION</th>
      <th class="col-tertiary" data-col="steps">TEST STEP</th>
      <th class="col-secondary" data-col="input">INPUT DATA</th>
      <th class="col-secondary" data-col="expected">EXPECTED RESULT</th>
      <th data-col="actual">ACTUAL RESULT</th>
      <th data-col="status">STATUS</th>
      <th data-col="priority">PRIORITY</th>
      <th data-col="source">SOURCE</th>
      <th data-col="notes">NOTES</th>
    </tr>
  `;
}

function buildGeneralTable(tests: CollectedTestData[]): string {
  if (tests.length === 0) {
    return '<p class="empty-state">No test cases captured.</p>';
  }
  const rows = tests.map((t, i) => renderTableRow(t, `${t.testId || 'row'}-${i}`)).join('');
  return `
    <div class="table-wrapper">
      <table class="qa-report-table">
        <thead>${headerRow()}</thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildRoleSection(group: RoleGroup): string {
  const roleSlug = (group.role || 'general').toLowerCase().replace(/[^a-z0-9]/g, '_');
  // Local index per role group (matches toExportPayload key scheme)
  const rows = group.tests
    .map((t, i) => renderTableRow(t, `${roleSlug}__${t.testId || 'row'}-${i}`))
    .join('');
  const roleLabel = group.role === 'general' ? 'General' : group.role;
  return `
    <div class="role-section">
      <div class="role-section-header">
        ROLE: ${escapeHtml(roleLabel.toUpperCase())}
        <span class="role-section-count">${group.tests.length} test${group.tests.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="table-wrapper">
        <table class="qa-report-table">
          <thead>${headerRow()}</thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function buildRoleAwareTable(tests: CollectedTestData[]): string {
  return buildRoleGroups(tests)
    .map((g) => buildRoleSection(g))
    .join('');
}

/** Table-only: column visibility + sticky pin toggles. */
export function renderTableColumnPicker(): string {
  return `
    <div class="column-picker" id="column-picker">
      <button type="button" class="column-picker__btn" id="column-picker-btn" aria-haspopup="true" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="5" height="16" rx="1"/>
        </svg>
        Filter columns
      </button>
      <div class="column-picker__menu" id="column-picker-menu" role="menu" hidden>
        <div class="column-picker__title">Visible columns</div>
        <label class="column-picker__item column-picker__item--locked"><input type="checkbox" data-col-toggle="testId" checked disabled /> Test ID</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="module" /> Module</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="feature" /> Feature</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="description" checked /> Description</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="steps" checked /> Test Step</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="input" checked /> Input Data</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="expected" checked /> Expected Result</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="actual" checked /> Actual Result</label>
        <label class="column-picker__item column-picker__item--locked"><input type="checkbox" data-col-toggle="status" checked disabled /> Status</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="priority" checked /> Priority</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="source" /> Source</label>
        <label class="column-picker__item"><input type="checkbox" data-col-toggle="notes" checked /> Notes</label>

        <div class="column-picker__title column-picker__title--section">Pin / sticky</div>
        <label class="column-picker__item" title="Keep header row visible while scrolling the table">
          <input type="checkbox" id="pin-sticky-header" data-pin-sticky="header" checked />
          <span>Pin header <span class="column-picker__hint">sticky top</span></span>
        </label>
        <label class="column-picker__item" title="Keep Test ID column visible while scrolling horizontally">
          <input type="checkbox" id="pin-sticky-left" data-pin-sticky="left" checked />
          <span>Pin Test ID <span class="column-picker__hint">sticky left</span></span>
        </label>

        <div class="column-picker__actions">
          <button type="button" id="column-picker-show-all">Show all</button>
          <button type="button" id="column-picker-reset">Reset</button>
        </div>
      </div>
    </div>
  `;
}

function renderSortDropdown(id = 'table-sort-select'): string {
  return `
    <select class="sort-select cmd-select" id="${id}" aria-label="Sort test cases">
      <option value="default">Default order</option>
      <option value="status-fail-first">Status (fail first)</option>
      <option value="priority-high-first">Priority (high first)</option>
      <option value="duration-desc">Duration (longest first)</option>
    </select>
  `;
}

/** Standalone toolbar — must sit OUTSIDE #view-table. */
export function renderTableToolbar(): string {
  return `
    <div class="table-toolbar" id="table-toolbar" data-toolbar-for="table" role="toolbar" aria-label="Table controls">
      <span class="table-toolbar__label">Table</span>
      ${renderSortDropdown('table-sort-select')}
      <select class="sort-select cmd-select" id="module-filter-select" aria-label="Filter by module">
        <option value="">All modules</option>
      </select>
      <select class="sort-select cmd-select" id="feature-filter-select" aria-label="Filter by feature">
        <option value="">All features</option>
      </select>
      ${renderTableColumnPicker()}
    </div>
    <script>
    (function () {
      // Populate module filter from live rows
      function populateModuleFilter() {
        var sel = document.getElementById('module-filter-select');
        if (!sel) return;
        var rows = document.querySelectorAll('tr[data-module]');
        var modules = new Set();
        rows.forEach(function (r) {
          var m = r.getAttribute('data-module');
          if (m && m !== '') modules.add(m);
        });
        Array.from(modules).sort().forEach(function (m) {
          var opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          sel.appendChild(opt);
        });
      }
      // Populate feature filter (optionally filtered by active module)
      function populateFeatureFilter(activeModule) {
        var sel = document.getElementById('feature-filter-select');
        if (!sel) return;
        // Clear existing options except first
        while (sel.options.length > 1) sel.remove(1);
        var rows = document.querySelectorAll('tr[data-feature]');
        var features = new Set();
        rows.forEach(function (r) {
          if (activeModule && r.getAttribute('data-module') !== activeModule) return;
          var f = r.getAttribute('data-feature');
          if (f && f !== '') features.add(f);
        });
        Array.from(features).sort().forEach(function (f) {
          var opt = document.createElement('option');
          opt.value = f;
          opt.textContent = f;
          sel.appendChild(opt);
        });
      }
      // Apply both filters
      function applyFilters() {
        var modSel = document.getElementById('module-filter-select');
        var featSel = document.getElementById('feature-filter-select');
        var modVal = modSel ? modSel.value : '';
        var featVal = featSel ? featSel.value : '';
        var rows = document.querySelectorAll('tr.tbl-row');
        rows.forEach(function (r) {
          var modMatch = !modVal || r.getAttribute('data-module') === modVal;
          var featMatch = !featVal || r.getAttribute('data-feature') === featVal;
          r.style.display = modMatch && featMatch ? '' : 'none';
        });
      }
      document.addEventListener('DOMContentLoaded', function () {
        populateModuleFilter();
        populateFeatureFilter('');
        var modSel = document.getElementById('module-filter-select');
        var featSel = document.getElementById('feature-filter-select');
        if (modSel) modSel.addEventListener('change', function () {
          populateFeatureFilter(modSel.value);
          if (featSel) featSel.value = '';
          applyFilters();
        });
        if (featSel) featSel.addEventListener('change', applyFilters);
      });
    })();
    </script>
  `;
}

export function buildTableView(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  const mode: ReportMode = summary.reportMode ?? 'general';
  const tableBody =
    mode === 'role-aware' ? buildRoleAwareTable(collectedTests) : buildGeneralTable(collectedTests);

  const featureName = new Date().toISOString().slice(0, 10);
  const tsvData = toTsv(collectedTests, mode);
  const csvData = toCsv(collectedTests, mode);
  const confluenceData = toConfluenceMarkup(collectedTests, mode);
  const confluenceHtml = toConfluenceHtml(collectedTests, mode);
  const exportScript = buildExportScript(
    tsvData,
    csvData,
    confluenceData,
    confluenceHtml,
    featureName,
    toExportPayload(collectedTests),
    mode,
  );

  // Content only — toolbar is composed OUTSIDE #view-table by build-dashboard-html.
  return `
      <div class="table-view" id="view-table-content">
        ${tableBody}
      </div>
      <script>
      (function () {
        var originalOrders = {};
        var panel = document.getElementById('view-table');
        if (panel) {
          var tables = Array.prototype.slice.call(panel.querySelectorAll('table.qa-report-table'));
          tables.forEach(function (tbl, tIdx) {
            var tbody = tbl.tBodies[0];
            if (tbody) {
              originalOrders[tIdx] = Array.prototype.slice.call(tbody.rows).map(function (r) { return r; });
            }
          });
        }

        function getTableValue(row, colIndex, sortKey) {
          var cell = row.cells[colIndex];
          if (!cell) return '';
          var text = (cell.textContent || cell.innerText || '').trim().toLowerCase();
          if (sortKey === 'duration') {
            var m = text.match(/([0-9]+[.]?[0-9]*)s/);
            return m ? parseFloat(m[1]) : 0;
          }
          return text;
        }

        function sortTable(table, sortKey, tableIndex) {
          var thead = table.tHead;
          var tbody = table.tBodies[0];
          if (!thead || !tbody) return;
          var headers = Array.prototype.slice.call(thead.rows[0].cells);
          var colMap = { status: -1, priority: -1, notes: -1 };
          headers.forEach(function (th, i) {
            var t = (th.textContent || '').trim().toUpperCase();
            if (t === 'STATUS') colMap.status = i;
            if (t === 'PRIORITY') colMap.priority = i;
            if (t === 'NOTES') colMap.notes = i;
          });
          if (sortKey === 'default' && originalOrders[tableIndex]) {
            originalOrders[tableIndex].forEach(function (row) { tbody.appendChild(row); });
            return;
          }
          var rows = Array.prototype.slice.call(tbody.rows);
          var statusOrder = { failed: 0, timedout: 0, interrupted: 0, skipped: 1, passed: 2 };
          var priorityOrder = { high: 0, medium: 1, low: 2 };
          rows.sort(function (a, b) {
            if (sortKey === 'status-fail-first') {
              var av = getTableValue(a, colMap.status, 'status');
              var bv = getTableValue(b, colMap.status, 'status');
              return (statusOrder[av] ?? 99) - (statusOrder[bv] ?? 99);
            }
            if (sortKey === 'priority-high-first') {
              var av2 = getTableValue(a, colMap.priority, 'priority');
              var bv2 = getTableValue(b, colMap.priority, 'priority');
              return (priorityOrder[av2] ?? 99) - (priorityOrder[bv2] ?? 99);
            }
            if (sortKey === 'duration-desc') {
              return getTableValue(b, colMap.notes, 'duration') - getTableValue(a, colMap.notes, 'duration');
            }
            return 0;
          });
          rows.forEach(function (row) { tbody.appendChild(row); });
        }

        var sortSelect = document.getElementById('table-sort-select');
        if (sortSelect) {
          sortSelect.addEventListener('change', function () {
            var key = sortSelect.value;
            var panel2 = document.getElementById('view-table');
            if (!panel2) return;
            Array.prototype.slice.call(panel2.querySelectorAll('table.qa-report-table')).forEach(function (tbl, idx) {
              sortTable(tbl, key, idx);
            });
          });
        }

        ${exportScript}
      })();
      </script>
    `;
}

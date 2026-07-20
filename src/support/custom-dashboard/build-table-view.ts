import type { CollectedTestData, ReportMode, RoleGroup, TestSummary } from './types';
import {
  buildExportScript,
  renderActualResultCell,
  renderInputDataCell,
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

// ---------------------------------------------------------------------------
// Role group builder
// ---------------------------------------------------------------------------

function buildRoleGroups(tests: CollectedTestData[]): RoleGroup[] {
  const roleMap = new Map<string, CollectedTestData[]>();

  for (const test of tests) {
    const role = test.role || 'general';
    if (!roleMap.has(role)) roleMap.set(role, []);
    roleMap.get(role)!.push(test);
  }

  return [...roleMap.entries()].map(([role, roleTests]) => ({ role, tests: roleTests }));
}

// ---------------------------------------------------------------------------
// Table row renderer
// ---------------------------------------------------------------------------

function renderTableRow(test: CollectedTestData, index: number, showNo: boolean): string {
  const noCell = showNo ? `<td class="tbl-no">${index + 1}</td>` : '';
  return `
    <tr class="tbl-row tbl-row--${test.status}">
      ${noCell}
      <td class="tbl-test-id"><code>${escapeHtml(test.testId || '-')}</code></td>
      <td class="tbl-description">
        <span class="tbl-title" title="${escapeHtml(test.fullTitle)}">${escapeHtml(test.title)}</span>
      </td>
      <td class="tbl-steps">${renderStepsCell(test.steps)}</td>
      <td class="tbl-input">${renderInputDataCell(test.inputData)}</td>
      <td class="tbl-expected">${escapeHtml(test.expectedResult || '-')}</td>
      <td class="tbl-actual">${renderActualResultCell(test)}</td>
      <td class="tbl-status">${renderStatusBadge(test.status)}</td>
      <td class="tbl-priority">${renderPriorityBadge(test.priority)}</td>
      <td class="tbl-notes">${renderNotesCell(test)}</td>
    </tr>
  `;
}

// ---------------------------------------------------------------------------
// General mode — flat table
// ---------------------------------------------------------------------------

function buildGeneralTable(tests: CollectedTestData[]): string {
  if (tests.length === 0) {
    return '<p class="empty-state">No test cases captured.</p>';
  }

  const rows = tests.map((t, i) => renderTableRow(t, i, false)).join('');

  return `
    <div class="table-wrapper">
      <table class="qa-report-table">
        <thead>
          <tr>
            <th>TEST ID</th>
            <th>DESCRIPTION</th>
            <th>TEST STEP</th>
            <th>INPUT DATA</th>
            <th>EXPECTED RESULT</th>
            <th>ACTUAL RESULT</th>
            <th>STATUS</th>
            <th>PRIORITY</th>
            <th>NOTES</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Role-aware mode — grouped per role with teal header
// ---------------------------------------------------------------------------

function buildRoleSection(group: RoleGroup): string {
  const rows = group.tests.map((t, i) => renderTableRow(t, i, true)).join('');
  const roleLabel = group.role === 'general' ? 'General' : group.role;

  return `
    <div class="role-section">
      <div class="role-section-header">
        ROLE: ${escapeHtml(roleLabel.toUpperCase())}
        <span class="role-section-count">${group.tests.length} test${group.tests.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="table-wrapper">
        <table class="qa-report-table">
          <thead>
            <tr>
              <th>No</th>
              <th>TEST ID</th>
              <th>DESCRIPTION</th>
              <th>TEST STEP</th>
              <th>INPUT DATA</th>
              <th>EXPECTED RESULT</th>
              <th>ACTUAL RESULT</th>
              <th>STATUS</th>
              <th>PRIORITY</th>
              <th>NOTES</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function buildRoleAwareTable(tests: CollectedTestData[]): string {
  const groups = buildRoleGroups(tests);
  return groups.map((g) => buildRoleSection(g)).join('');
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function renderSortDropdown(): string {
  return `
    <select class="sort-select" id="table-sort-select" aria-label="Sort test cases">
      <option value="default">Default</option>
      <option value="status-fail-first">Status (fail first)</option>
      <option value="priority-high-first">Priority (high first)</option>
      <option value="duration-desc">Duration (longest first)</option>
    </select>
  `;
}

function renderExportButtons(): string {
  return `
    <div class="export-buttons" role="group" aria-label="Export options">
      <button class="btn btn--ghost btn--sm" id="btn-copy-confluence" type="button">
        Copy for Confluence
      </button>
      <button class="btn btn--ghost btn--sm" id="btn-copy-tsv" type="button">
        Copy Data (TSV)
      </button>
      <button class="btn btn--ghost btn--sm" id="btn-download-csv" type="button">
        Download CSV
      </button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function buildTableView(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  const mode: ReportMode = summary.reportMode ?? 'general';

  const tableBody =
    mode === 'role-aware' ? buildRoleAwareTable(collectedTests) : buildGeneralTable(collectedTests);

  // Pre-compute export data (embedded in script — no server round-trip)
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
  );

  return `
    <div class="table-view" id="view-table-content" style="max-width: 100%; overflow-x: auto;">
      <div class="table-toolbar">
        ${renderSortDropdown()}
        ${renderExportButtons()}
      </div>
      ${tableBody}
    </div>
    <script>
    (function () {
      // ---------------------------------------------------------------------------
      // Client-side sort — works on all <table class="qa-report-table"> in the view
      // ---------------------------------------------------------------------------

      // Save original row order per table on load
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

        // Find column index by header text
        var headers = Array.prototype.slice.call(thead.rows[0].cells);
        var colMap = { status: -1, priority: -1, notes: -1 };
        headers.forEach(function (th, i) {
          var t = (th.textContent || '').trim().toUpperCase();
          if (t === 'STATUS') colMap.status = i;
          if (t === 'PRIORITY') colMap.priority = i;
          if (t === 'NOTES') colMap.notes = i;
        });

        // Default — restore original order
        if (sortKey === 'default' && originalOrders[tableIndex]) {
          originalOrders[tableIndex].forEach(function (row) { tbody.appendChild(row); });
          renumber(tbody, headers);
          return;
        }

        var rows = Array.prototype.slice.call(tbody.rows);

        var statusOrder = { 'failed': 0, 'timedout': 0, 'interrupted': 0, 'skipped': 1, 'passed': 2 };
        var priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };

        rows.sort(function (a, b) {
          if (sortKey === 'status-fail-first') {
            var av = getTableValue(a, colMap.status, 'status');
            var bv = getTableValue(b, colMap.status, 'status');
            var ao = statusOrder[av] !== undefined ? statusOrder[av] : 99;
            var bo = statusOrder[bv] !== undefined ? statusOrder[bv] : 99;
            return ao - bo;
          }
          if (sortKey === 'priority-high-first') {
            var av = getTableValue(a, colMap.priority, 'priority');
            var bv = getTableValue(b, colMap.priority, 'priority');
            var ao = priorityOrder[av] !== undefined ? priorityOrder[av] : 99;
            var bo = priorityOrder[bv] !== undefined ? priorityOrder[bv] : 99;
            return ao - bo;
          }
          if (sortKey === 'duration-desc') {
            var av = getTableValue(a, colMap.notes, 'duration');
            var bv = getTableValue(b, colMap.notes, 'duration');
            return bv - av;
          }
          return 0;
        });

        rows.forEach(function (row) { tbody.appendChild(row); });
        renumber(tbody, headers);
      }

      function renumber(tbody, headers) {
        var hasNo = headers.length > 0 && (headers[0].textContent || '').trim().toUpperCase() === 'NO';
        if (hasNo) {
          Array.prototype.slice.call(tbody.rows).forEach(function (row, i) {
            if (row.cells[0]) row.cells[0].textContent = String(i + 1);
          });
        }
      }

      var sortSelect = document.getElementById('table-sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', function () {
          var key = sortSelect.value;
          var panel = document.getElementById('view-table');
          if (!panel) return;
          var tables = Array.prototype.slice.call(panel.querySelectorAll('table.qa-report-table'));
          tables.forEach(function (tbl, idx) { sortTable(tbl, key, idx); });
        });
      }

      ${exportScript}
    })();
    </script>
  `;
}

import type { CollectedTestData, ReportMode } from './types';
import { escapeHtml } from './shared';

// ---------------------------------------------------------------------------
// Column definitions — same order for all export formats
// ---------------------------------------------------------------------------

type ExportRow = {
  testId: string;
  description: string;
  steps: string;
  inputData: string;
  expectedResult: string;
  actualResult: string;
  status: string;
  priority: string;
  notes: string;
};

const GENERAL_HEADERS = [
  'TEST ID',
  'DESCRIPTION',
  'TEST STEP',
  'INPUT DATA',
  'EXPECTED RESULT',
  'ACTUAL RESULT',
  'STATUS',
  'PRIORITY',
  'NOTES',
];

const ROLE_HEADERS = [
  'TEST ID',
  'DESCRIPTION',
  'TEST STEP',
  'INPUT DATA',
  'EXPECTED RESULT',
  'ACTUAL RESULT',
  'STATUS',
  'PRIORITY',
  'NOTES',
];

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatInputData(inputData: Record<string, string>): string {
  const entries = Object.entries(inputData);
  if (entries.length === 0) return '-';
  return entries.map(([k, v]) => `${k}: ${v}`).join('\n');
}

const STEP_NOISE = ['Before', 'After', 'Worker Cleanup', 'worker', 'Fixture'];

function formatSteps(steps: Array<{ title: string }>): string {
  if (steps.length === 0) return '-';
  const filtered = steps.filter((s) => !STEP_NOISE.some((prefix) => s.title.startsWith(prefix)));
  if (filtered.length === 0) return '-';
  return filtered.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
}

function formatNotes(test: CollectedTestData): string {
  const parts: string[] = [];
  parts.push(formatDuration(test.duration));
  if (test.affectedLayer && test.affectedLayer.length > 0) {
    parts.push(test.affectedLayer.map((l) => `[${l}]`).join(''));
  }
  const traceCount = test.attachments.filter((a) => a.kind === 'trace').length;
  const ssCount = test.attachments.filter((a) => a.kind === 'screenshot').length;
  if (traceCount > 0) parts.push(`${traceCount} trace`);
  if (ssCount > 0) parts.push(`${ssCount} screenshot`);
  return parts.join(' · ');
}

function buildRow(test: CollectedTestData): ExportRow {
  return {
    testId: test.testId || '-',
    description: test.title,
    steps: formatSteps(test.steps || []),
    inputData: formatInputData(test.inputData || {}),
    expectedResult: test.expectedResult || '-',
    actualResult: test.actualResult || '-',
    status: (test.status || '').toUpperCase(),
    priority: (test.priority || '').toUpperCase(),
    notes: formatNotes(test),
  };
}

// ---------------------------------------------------------------------------
// TSV (Tab-Separated Values) — paste directly into Google Sheets / Excel
// ---------------------------------------------------------------------------

function rowToTsvLine(values: string[]): string {
  return values.map((v) => v.replace(/\t/g, ' ').replace(/\n/g, ' | ')).join('\t');
}

export function toTsv(tests: CollectedTestData[], mode: ReportMode): string {
  const lines: string[] = [];

  if (mode === 'role-aware') {
    // Single table with ROLE column (not multiple tables)
    lines.push(rowToTsvLine(['ROLE', ...ROLE_HEADERS]));
    const roles = [...new Set(tests.map((t) => t.role).filter(Boolean))];
    for (const role of roles) {
      const roleTests = tests.filter((t) => t.role === role);
      roleTests.forEach((test) => {
        const r = buildRow(test);
        lines.push(
          rowToTsvLine([
            role.toUpperCase(),
            r.testId,
            r.description,
            r.steps,
            r.inputData,
            r.expectedResult,
            r.actualResult,
            r.status,
            r.priority,
            r.notes,
          ]),
        );
      });
    }
  } else {
    lines.push(rowToTsvLine(GENERAL_HEADERS));
    tests.forEach((test) => {
      const r = buildRow(test);
      lines.push(
        rowToTsvLine([
          r.testId,
          r.description,
          r.steps,
          r.inputData,
          r.expectedResult,
          r.actualResult,
          r.status,
          r.priority,
          r.notes,
        ]),
      );
    });
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CSV (RFC 4180) — for file download
// ---------------------------------------------------------------------------

function csvQuote(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function rowToCsvLine(values: string[]): string {
  return values.map(csvQuote).join(',');
}

export function toCsv(tests: CollectedTestData[], mode: ReportMode): string {
  const lines: string[] = [];

  if (mode === 'role-aware') {
    // Single table with ROLE column (not multiple tables)
    lines.push(rowToCsvLine(['ROLE', ...ROLE_HEADERS]));
    const roles = [...new Set(tests.map((t) => t.role).filter(Boolean))];
    for (const role of roles) {
      const roleTests = tests.filter((t) => t.role === role);
      roleTests.forEach((test) => {
        const r = buildRow(test);
        lines.push(
          rowToCsvLine([
            role.toUpperCase(),
            r.testId,
            r.description,
            r.steps,
            r.inputData,
            r.expectedResult,
            r.actualResult,
            r.status,
            r.priority,
            r.notes,
          ]),
        );
      });
    }
  } else {
    lines.push(rowToCsvLine(GENERAL_HEADERS));
    tests.forEach((test) => {
      const r = buildRow(test);
      lines.push(
        rowToCsvLine([
          r.testId,
          r.description,
          r.steps,
          r.inputData,
          r.expectedResult,
          r.actualResult,
          r.status,
          r.priority,
          r.notes,
        ]),
      );
    });
  }

  return lines.join('\r\n');
}

// ---------------------------------------------------------------------------
// Confluence Wiki Markup — paste directly into Confluence page editor
// ---------------------------------------------------------------------------

function confluenceCell(value: string, isHeader = false): string {
  const delimiter = isHeader ? '||' : '|';
  const safe = value.replace(/\|/g, '\\|').replace(/\n/g, ' · ');
  return `${delimiter} ${safe} `;
}

function rowToConfluenceLine(values: string[], isHeader = false): string {
  const cells = values.map((v) => confluenceCell(v, isHeader)).join('');
  return cells + (isHeader ? '||' : '|');
}

export function toConfluenceMarkup(tests: CollectedTestData[], mode: ReportMode): string {
  const lines: string[] = [];

  if (mode === 'role-aware') {
    // Single table with ROLE column — Confluence wiki markup doesn't support colspan
    lines.push(rowToConfluenceLine(['ROLE', ...ROLE_HEADERS], true));
    const roles = [...new Set(tests.map((t) => t.role).filter(Boolean))];
    for (const role of roles) {
      const roleTests = tests.filter((t) => t.role === role);
      roleTests.forEach((test) => {
        const r = buildRow(test);
        lines.push(
          rowToConfluenceLine([
            role.toUpperCase(),
            r.testId,
            r.description,
            r.steps,
            r.inputData,
            r.expectedResult,
            r.actualResult,
            r.status,
            r.priority,
            r.notes,
          ]),
        );
      });
    }
  } else {
    lines.push(rowToConfluenceLine(GENERAL_HEADERS, true));
    tests.forEach((test) => {
      const r = buildRow(test);
      lines.push(
        rowToConfluenceLine([
          r.testId,
          r.description,
          r.steps,
          r.inputData,
          r.expectedResult,
          r.actualResult,
          r.status,
          r.priority,
          r.notes,
        ]),
      );
    });
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Confluence HTML — styled table for rich paste into Confluence editor
// ---------------------------------------------------------------------------

function htmlCell(value: string, rowStyle?: string): string {
  const safe = escapeHtml(value).replace(/\n/g, '<br>');
  const style = rowStyle
    ? `padding:6px 10px;border:1px solid #ccc;vertical-align:top;font-size:13px;${rowStyle}`
    : 'padding:6px 10px;border:1px solid #ccc;vertical-align:top;font-size:13px;';
  return `<td style="${style}">${safe}</td>`;
}

function htmlHeaderCell(value: string): string {
  return `<th style="padding:6px 10px;border:1px solid #ccc;background:#f1f5f9;text-align:left;font-size:12px;font-weight:600;">${escapeHtml(value)}</th>`;
}

function getRowBg(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'failed' || s === 'timedout' || s === 'interrupted') return 'background:#fef2f2;';
  if (s === 'skipped') return 'background:#fffbeb;';
  return '';
}

const STATUS_ICON: Record<string, string> = {
  passed: '✓',
  failed: '✗',
  timedout: '⏱',
  interrupted: '✗',
  skipped: '⊘',
};

function confluenceStatus(status: string): string {
  const s = (status || '').toLowerCase();
  const icon = STATUS_ICON[s] ?? '?';
  return `${icon} ${(status || 'UNKNOWN').toUpperCase()}`;
}

export function toConfluenceHtml(tests: CollectedTestData[], mode: ReportMode): string {
  const headers = mode === 'role-aware' ? ['ROLE', ...ROLE_HEADERS] : GENERAL_HEADERS;

  let html =
    '<table border="1" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;width:100%;">';
  html += '<thead><tr>' + headers.map(htmlHeaderCell).join('') + '</tr></thead>';
  html += '<tbody>';

  if (mode === 'role-aware') {
    const roles = [...new Set(tests.map((t) => t.role).filter(Boolean))];
    for (const role of roles) {
      const roleTests = tests.filter((t) => t.role === role);
      roleTests.forEach((test, idx) => {
        const r = buildRow(test);
        const bg = getRowBg(r.status);
        html += '<tr>';
        // Add ROLE cell with rowspan only on first row of each role group
        if (idx === 0) {
          html += `<td rowspan="${roleTests.length}" style="padding:6px 10px;border:1px solid #ccc;font-weight:600;vertical-align:middle;text-align:center;font-size:13px;${bg}">${escapeHtml(role.toUpperCase())}</td>`;
        }
        html += htmlCell(r.testId, bg);
        html += htmlCell(r.description, bg);
        html += htmlCell(r.steps, bg);
        html += htmlCell(r.inputData, bg);
        html += htmlCell(r.expectedResult, bg);
        html += htmlCell(r.actualResult, bg);
        html += htmlCell(confluenceStatus(r.status), bg);
        html += htmlCell(r.priority, bg);
        html += htmlCell(r.notes, bg);
        html += '</tr>';
      });
    }
  } else {
    tests.forEach((test) => {
      const r = buildRow(test);
      const bg = getRowBg(r.status);
      html += '<tr>';
      html += htmlCell(r.testId, bg);
      html += htmlCell(r.description, bg);
      html += htmlCell(r.steps, bg);
      html += htmlCell(r.inputData, bg);
      html += htmlCell(r.expectedResult, bg);
      html += htmlCell(r.actualResult, bg);
      html += htmlCell(confluenceStatus(r.status), bg);
      html += htmlCell(r.priority, bg);
      html += htmlCell(r.notes, bg);
      html += '</tr>';
    });
  }

  html += '</tbody></table>';
  return html;
}

// ---------------------------------------------------------------------------
// Inline JS snippets — embedded in HTML dashboard for clipboard/download
// ---------------------------------------------------------------------------

/**
 * Returns an inline <script> block that wires up the three export buttons.
 * Must be called AFTER the table view HTML has been injected into the DOM.
 */
export function buildExportScript(
  tsvContent: string,
  csvContent: string,
  confluenceContent: string,
  confluenceHtml: string,
  featureName: string,
): string {
  const safeTsv = JSON.stringify(tsvContent);
  const safeCsv = JSON.stringify(csvContent);
  const safeConfluence = JSON.stringify(confluenceContent);
  const safeConfluenceHtml = JSON.stringify(confluenceHtml);
  const safeFilename = JSON.stringify(`qa-report-${featureName}.csv`);

  return `
(function () {
  function showFeedback(btnId, msg) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = orig; }, 2000);
  }

  function copyPlainText(text, btnId) {
    navigator.clipboard.writeText(text).then(function () {
      showFeedback(btnId, '\\u2713 Copied!');
    }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showFeedback(btnId, '\\u2713 Copied!');
    });
  }

  function copyRichText(plainText, htmlContent, btnId) {
    try {
      var htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      var textBlob = new Blob([plainText], { type: 'text/plain' });
      var item = new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob });
      navigator.clipboard.write([item]).then(function () {
        showFeedback(btnId, '\\u2713 Copied!');
      }).catch(function () {
        copyPlainText(plainText, btnId);
      });
    } catch (err) {
      copyPlainText(plainText, btnId);
    }
  }

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[id]') : e.target;
    if (!btn || !btn.id) return;
    if (btn.id === 'btn-copy-confluence') {
      copyRichText(${safeConfluence}, ${safeConfluenceHtml}, 'btn-copy-confluence');
    } else if (btn.id === 'btn-copy-tsv') {
      copyPlainText(${safeTsv}, 'btn-copy-tsv');
    } else if (btn.id === 'btn-download-csv') {
      var csvWithBom = '\\uFEFF' + ${safeCsv};
      downloadFile(csvWithBom, ${safeFilename}, 'text/csv;charset=utf-8;');
    }
  });
})();
  `.trim();
}

// ---------------------------------------------------------------------------
// HTML rendering helpers used by build-table-view.ts
// ---------------------------------------------------------------------------

export function renderStatusBadge(status: string): string {
  const map: Record<string, { cls: string; icon: string; label: string }> = {
    passed: { cls: 'status-pill--passed', icon: '✓', label: 'PASSED' },
    failed: { cls: 'status-pill--failed', icon: '✗', label: 'FAILED' },
    timedOut: { cls: 'status-pill--failed', icon: '⏱', label: 'TIMED OUT' },
    interrupted: { cls: 'status-pill--failed', icon: '✗', label: 'INTERRUPTED' },
    skipped: { cls: 'status-pill--skipped', icon: '⊘', label: 'SKIPPED' },
  };
  const entry = map[status] ?? {
    cls: 'status-pill--skipped',
    icon: '?',
    label: (status || 'UNKNOWN').toUpperCase(),
  };
  return `<span class="status-pill status-pill--full ${entry.cls}"><span class="status-pill__icon">${entry.icon}</span> ${entry.label}</span>`;
}

export function renderPriorityBadge(priority: string): string {
  const map: Record<string, string> = {
    high: 'priority-badge--high',
    medium: 'priority-badge--medium',
    low: 'priority-badge--low',
  };
  const safe = (priority || '').toLowerCase();
  const cls = map[safe] ?? 'priority-badge--medium';
  return `<span class="priority-badge ${cls}">${(priority || 'MEDIUM').toUpperCase()}</span>`;
}

export function renderLayerBadges(layers: string[]): string {
  if (layers.length === 0) return '';
  return layers
    .map((l) => `<span class="layer-badge layer-badge--${l.toLowerCase()}">${escapeHtml(l)}</span>`)
    .join('');
}

export function renderInputDataCell(inputData: Record<string, string>): string {
  if (!inputData || typeof inputData !== 'object') return '<span class="muted">-</span>';
  const entries = Object.entries(inputData);
  if (entries.length === 0) return '<span class="muted">-</span>';
  return `<div class="input-kv">${entries
    .map(([k, v]) => `<div><span class="key">${escapeHtml(k)}:</span> ${escapeHtml(v)}</div>`)
    .join('')}</div>`;
}

export function renderStepsCell(steps: Array<{ title: string }>): string {
  const visible = steps.filter(
    (s) => !s.title.startsWith('Before') && !s.title.startsWith('After'),
  );
  if (visible.length === 0) return '<span class="muted">-</span>';
  return `<ol class="steps-list">${visible
    .map((s) => `<li>${escapeHtml(s.title)}</li>`)
    .join('')}</ol>`;
}

export function renderActualResultCell(test: CollectedTestData): string {
  const isUnhealthy = ['failed', 'timedOut', 'interrupted'].includes(test.status);
  const cls = isUnhealthy ? 'actual-result--failed' : 'actual-result--passed';
  return `<div class="${cls}">${escapeHtml(test.actualResult || '-')}</div>`;
}

export function renderNotesCell(test: CollectedTestData): string {
  const parts: string[] = [];

  // Row 1: Duration
  parts.push(
    `<div class="notes-row notes-row--time"><span class="duration">${formatDuration(test.duration)}</span></div>`,
  );

  // Row 2: Screenshot thumbnails (clickable — open new tab)
  const screenshots = test.attachments.filter((a) => a.kind === 'screenshot');
  if (screenshots.length > 0) {
    const thumbnails = screenshots
      .slice(0, 2)
      .map(
        (ss) =>
          `<a href="${escapeHtml(ss.relativePath)}" target="_blank" rel="noopener noreferrer" class="evidence-thumb"><img src="${escapeHtml(ss.relativePath)}" alt="screenshot" loading="lazy"></a>`,
      )
      .join('');
    parts.push(`<div class="notes-row notes-row--evidence">${thumbnails}</div>`);
  }

  // Row 3: Video (HTML5 <video> tag — click opens new tab via overlay link)
  const videos = test.attachments.filter((a) => a.kind === 'video');
  if (videos.length > 0) {
    const v = videos[0];
    parts.push(
      `<div class="notes-row notes-row--evidence"><a class="evidence-video" href="${escapeHtml(v.relativePath)}" target="_blank" rel="noopener noreferrer"><video preload="metadata" muted><source src="${escapeHtml(v.relativePath)}" /></video><span class="evidence-video__overlay">↗</span></a></div>`,
    );
  }

  // Row 4: Trace link
  const trace = test.attachments.find((a) => a.kind === 'trace');
  if (trace) {
    parts.push(
      `<div class="notes-row notes-row--evidence"><a class="evidence-link" href="${escapeHtml(trace.relativePath)}" target="_blank" rel="noopener noreferrer">trace</a></div>`,
    );
  }

  return `<div class="notes-cell">${parts.join('')}</div>`;
}

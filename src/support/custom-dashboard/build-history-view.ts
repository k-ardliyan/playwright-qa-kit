/**
 * Dashboard History View — HTML section for browsing archived reports.
 *
 * Features:
 * - History list with QA decision, savedAt, notes columns
 * - Save to History banner + modal (copies CLI command to clipboard)
 * - Archive Detail View (click row → full detail)
 * - Trend sparkline
 * - Compare diff table
 *
 * @module src/support/custom-dashboard/build-history-view
 */

import { escapeHtml } from './shared';
import type { ReportHistoryEntry } from '../../agents/reporter/report-history';
import type { ReportComparison } from '../../agents/reporter/report-compare';

// ─── History Section ─────────────────────────────────────────────────────────

export function buildHistorySection(
  history: ReportHistoryEntry[],
  options?: {
    maxEntries?: number;
    hasLatestRun?: boolean;
    latestRunArchived?: boolean;
    serveMode?: boolean;
  },
): string {
  const max = options?.maxEntries ?? 20;
  const entries = history.slice(0, max);
  const hasLatestRun = options?.hasLatestRun ?? false;
  const latestRunArchived = options?.latestRunArchived ?? false;
  // serveMode reserved for future use (passed from dashboard builder)
  // const _serveMode = options?.serveMode ?? false;

  // Save banner (only if latest run exists and not yet archived)
  const saveBanner = hasLatestRun && !latestRunArchived ? buildSaveBanner() : '';

  if (entries.length === 0) {
    return `
      <div class="history-section" id="history-section">
        ${saveBanner}
        <div class="history-empty">
          <p>No archived reports found.</p>
          <p class="muted">Run tests and save results to build your history.</p>
        </div>
      </div>`;
  }

  const rows = entries
    .map((entry) => {
      const statusIcon =
        entry.status === 'success' ? '✅' : entry.status === 'partial' ? '🟡' : '❌';
      const passRateClass =
        entry.passRate >= 80 ? 'rate-good' : entry.passRate >= 50 ? 'rate-warn' : 'rate-bad';
      const decisionBadge = entry.qaDecision
        ? `<span class="decision-badge decision-${entry.qaDecision.toLowerCase().replace('_', '-')}">${escapeHtml(entry.qaDecision)}</span>`
        : '<span class="muted">—</span>';
      const savedAtShort = entry.savedAt ? formatTimestampShort(entry.savedAt) : '—';
      const notesShort = entry.qaNotes
        ? entry.qaNotes.length > 30
          ? escapeHtml(entry.qaNotes.slice(0, 30)) + '…'
          : escapeHtml(entry.qaNotes)
        : '—';

      return `
        <tr class="history-row" data-run-id="${escapeHtml(entry.runId)}" onclick="showArchiveDetail('${escapeHtml(entry.runId)}')">
          <td class="history-status">${statusIcon}</td>
          <td class="history-run-id" title="${escapeHtml(entry.runId)}">${escapeHtml(entry.runId)}</td>
          <td class="history-date" title="${escapeHtml(entry.savedAt)}">${savedAtShort}</td>
          <td class="history-env">${escapeHtml(entry.appEnv)}</td>
          <td class="history-rate ${passRateClass}">${entry.passRate}%</td>
          <td class="history-tests">${entry.totalTests}</td>
          <td class="history-decision">${decisionBadge}</td>
          <td class="history-notes" title="${escapeHtml(entry.qaNotes || '')}">${notesShort}</td>
          <td class="history-actions" onclick="event.stopPropagation()">
            <button class="btn-sm btn-view" onclick="showArchiveDetail('${escapeHtml(entry.runId)}')" title="View details">View</button>
            <button class="btn-sm btn-compare" data-run-id="${escapeHtml(entry.runId)}" title="Compare with another run">Compare</button>
            <button class="btn-sm btn-delete" onclick="deleteArchive('${escapeHtml(entry.runId)}')" title="Delete archive">🗑️</button>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <div class="history-section" id="history-section">
      ${saveBanner}
      <div class="history-toolbar">
        <h3>Report History</h3>
        <span class="muted">${entries.length} saved run(s)</span>
      </div>
      ${entries.length >= 2 ? `<div class="history-trend" id="history-trend">${buildTrendSparkline(entries)}</div>` : ''}
      <table class="history-table">
        <thead>
          <tr>
            <th></th>
            <th>Run ID</th>
            <th>Saved</th>
            <th>Env</th>
            <th>Pass Rate</th>
            <th>Tests</th>
            <th>Decision</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    ${buildArchiveDetailPanel()}
    ${buildSaveModal()}`;
}

// ─── Save Banner ─────────────────────────────────────────────────────────────

function buildSaveBanner(): string {
  return `
    <div class="save-banner" id="save-banner">
      <span>💾 Save this run to history?</span>
      <div class="save-banner__actions">
        <button class="btn-sm btn-save" onclick="openSaveModal()">Save to History</button>
        <button class="btn-sm btn-dismiss" onclick="dismissSaveBanner()">Dismiss</button>
      </div>
    </div>`;
}

// ─── Save Modal ──────────────────────────────────────────────────────────────

function buildSaveModal(): string {
  return `
    <div class="save-modal" id="save-modal" style="display:none">
      <div class="save-modal__overlay" onclick="closeSaveModal()"></div>
      <div class="save-modal__content">
        <h3>Save Run to History</h3>
        <div class="save-modal__form">
          <label>
            QA Decision <span class="required">*</span>
            <select id="save-decision">
              <option value="">— Select —</option>
              <option value="APPROVE">✅ APPROVE</option>
              <option value="FILE_BUG">🐛 FILE_BUG</option>
              <option value="REVISE_REQUIREMENT">📝 REVISE_REQUIREMENT</option>
              <option value="FIX_TEST">🔧 FIX_TEST</option>
              <option value="FIX_ENV">🏗️ FIX_ENV</option>
              <option value="MARK_BLOCKED">🚫 MARK_BLOCKED</option>
            </select>
          </label>
          <label>
            Notes
            <textarea id="save-notes" rows="3" placeholder="Optional notes about this run..."></textarea>
          </label>
          <div class="save-modal__preview" id="save-preview"></div>
          <div id="save-feedback" class="save-modal__feedback"></div>
          <div class="save-modal__actions">
            <button class="btn-save-confirm" onclick="confirmSave()">💾 Save to History</button>
            <button class="btn-cancel" onclick="closeSaveModal()">Cancel</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Archive Detail Panel ────────────────────────────────────────────────────

function buildArchiveDetailPanel(): string {
  return `
    <div class="archive-detail" id="archive-detail" style="display:none">
      <div class="archive-detail__header">
        <button class="btn-back" onclick="hideArchiveDetail()">← Back to History</button>
        <h3 id="detail-run-id"></h3>
      </div>
      <div class="archive-detail__meta" id="detail-meta"></div>
      <div class="archive-detail__summary" id="detail-summary"></div>
      <div class="archive-detail__breakdown" id="detail-breakdown"></div>
      <div class="archive-detail__cases" id="detail-cases"></div>
    </div>`;
}

// ─── Trend Sparkline ─────────────────────────────────────────────────────────

export function buildTrendSparkline(
  entries: ReportHistoryEntry[],
  options?: { width?: number; height?: number },
): string {
  if (entries.length < 2) return '';

  const width = options?.width ?? 300;
  const height = options?.height ?? 40;
  const padding = 4;

  const data = [...entries].reverse();
  const passRates = data.map((e) => e.passRate);
  const maxRate = Math.max(...passRates, 100);
  const minRate = Math.min(...passRates, 0);

  const range = maxRate - minRate || 1;
  const xStep = (width - 2 * padding) / (data.length - 1);

  const points = data
    .map((entry, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((entry.passRate - minRate) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return `
    <svg class="trend-sparkline" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <polyline fill="none" stroke="var(--accent, #c4956a)" stroke-width="1.5" stroke-linejoin="round" points="${points}" />
      ${data
        .map((entry, i) => {
          const x = padding + i * xStep;
          const y =
            height - padding - ((entry.passRate - minRate) / range) * (height - 2 * padding);
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="var(--accent, #c4956a)" title="${entry.passRate}% — ${formatTimestampShort(entry.savedAt || entry.ranAt)}" />`;
        })
        .join('\n      ')}
    </svg>`;
}

// ─── Comparison Diff ─────────────────────────────────────────────────────────

export function buildComparisonSection(comparison: ReportComparison): string {
  const allScenarios = [
    ...comparison.regressions.map((s) => ({ ...s, change: 'regressed' as const })),
    ...comparison.fixes.map((s) => ({ ...s, change: 'fixed' as const })),
    ...comparison.newScenarios.map((s) => ({ ...s, change: 'new' as const })),
    ...comparison.removedScenarios.map((s) => ({ ...s, change: 'removed' as const })),
    ...comparison.stableFailures.map((s) => ({ ...s, change: 'stable' as const })),
    ...comparison.flakyScenarios.map((s) => ({ ...s, change: 'flaky' as const })),
  ];

  const rows = allScenarios
    .map((s) => {
      const icon =
        s.change === 'regressed'
          ? '🔴'
          : s.change === 'fixed'
            ? '🟢'
            : s.change === 'new'
              ? '✨'
              : s.change === 'removed'
                ? '🗑️'
                : s.change === 'stable'
                  ? '🟡'
                  : '🔄';
      const beforeIcon =
        s.previousStatus === 'passed' ? '✅' : s.previousStatus === 'failed' ? '❌' : '⏭️';
      const afterIcon =
        s.currentStatus === 'passed' ? '✅' : s.currentStatus === 'failed' ? '❌' : '⏭️';
      return `
        <tr class="diff-row diff-${s.change}">
          <td>${icon}</td>
          <td>${escapeHtml(s.scenarioId)}</td>
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.role ?? '')}</td>
          <td>${escapeHtml(s.module ?? '')}</td>
          <td>${beforeIcon} ${s.previousStatus}</td>
          <td>${afterIcon} ${s.currentStatus}</td>
          <td>${s.currentError ? escapeHtml(s.currentError.slice(0, 80)) : '—'}</td>
        </tr>`;
    })
    .join('');

  return `
    <div class="comparison-section">
      <div class="comparison-header">
        <h3>Comparison</h3>
        <div class="comparison-stats">
          <span>🔴 ${comparison.summary.regressed} regressions</span>
          <span>🟢 ${comparison.summary.fixed} fixes</span>
          <span>🟡 ${comparison.summary.stableFailures} stable failures</span>
          <span>🔄 ${comparison.summary.flaky} flaky</span>
          <span>✨ ${comparison.summary.new} new</span>
          <span>🗑️ ${comparison.summary.removed} removed</span>
        </div>
      </div>
      <table class="comparison-table">
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Module</th>
            <th>Before</th>
            <th>After</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8" class="muted">No changes between runs.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

// ─── Inline JS ───────────────────────────────────────────────────────────────

export function buildHistoryJs(opts?: { serveMode?: boolean }): string {
  const serveMode = opts?.serveMode ?? false;
  const flag = serveMode ? 'true' : 'false';

  // Build inline JS via array join — avoids nested template-literal escape bugs.
  const lines: string[] = [
    '<script>',
    'window.__SERVE_MODE__ = ' + flag + ';',
    '',
    '// Clipboard helper',
    'function copyToClipboard(t,el){',
    '  navigator.clipboard.writeText(t).then(function(){',
    '    if(el){el.textContent="\u2705 Copied!";setTimeout(function(){el.textContent="";},2000);}',
    '  }).catch(function(){',
    '    var ta=document.createElement("textarea");',
    '    ta.value=t;ta.style.position="fixed";ta.style.opacity="0";',
    '    document.body.appendChild(ta);ta.select();',
    '    try{',
    '      document.execCommand("copy");',
    '      if(el){el.textContent="\u2705 Copied!";setTimeout(function(){el.textContent="";},2000);}',
    '    }catch(e){if(el)el.textContent="\u26a0\ufe0f Copy failed";}',
    '    document.body.removeChild(ta);',
    '  });',
    '}',
    '',
    '// Heartbeat + SSE (serve mode only)',
    'if(window.__SERVE_MODE__){',
    '  setInterval(function(){fetch("/heartbeat",{method:"POST"}).catch(function(){});},5000);',
    '  var sse=new EventSource("/events");',
    '  sse.addEventListener("archive-saved",function(){location.reload();});',
    '  sse.addEventListener("archive-deleted",function(){location.reload();});',
    '  sse.onerror=function(){sse.close();};',
    '}',
    '',
    '// Save modal',
    'function openSaveModal(){',
    '  var m=document.getElementById("save-modal");if(m)m.style.display="flex";',
    '  var p=document.getElementById("save-preview");',
    '  if(p)p.innerHTML=window.__SERVE_MODE__',
    '    ?"<span class="muted">Fill in decision and notes, then click Save.</span>"',
    '    :"<code>npm run archive:save</code>";',
    '  var fb=document.getElementById("save-feedback");if(fb)fb.textContent="";',
    '}',
    'function closeSaveModal(){var m=document.getElementById("save-modal");if(m)m.style.display="none";}',
    'function dismissSaveBanner(){var b=document.getElementById("save-banner");if(b)b.style.display="none";}',
    '',
    'function confirmSave(){',
    '  var de=document.getElementById("save-decision");',
    '  var ne=document.getElementById("save-notes");',
    '  var fe=document.getElementById("save-feedback");',
    '  var decision=de?de.value:"";',
    '  var notes=ne?ne.value.trim():"";',
    '  if(!decision){alert("Please select a QA Decision");return;}',
    '  if(window.__SERVE_MODE__){',
    '    var btn=document.querySelector(".btn-save-confirm");',
    '    if(btn){btn.textContent="Saving\u2026";btn.disabled=true;}',
    '    fetch("/api/archive/save",{method:"POST",headers:{"Content-Type":"application/json"},',
    '      body:JSON.stringify({decision:decision,notes:notes})})',
    '      .then(function(r){return r.json();})',
    '      .then(function(d){',
    '        if(d.ok){',
    '          if(fe)fe.innerHTML="\u2705 Saved! Run ID: <code>"+d.runId+"</code>";',
    '          setTimeout(function(){closeSaveModal();dismissSaveBanner();},1200);',
    '        }else{',
    '          if(fe)fe.textContent="\u274c "+(d.error||"Save failed");',
    '          if(btn){btn.textContent="\ud83d\udcbe Save to History";btn.disabled=false;}',
    '        }',
    '      })',
    '      .catch(function(e){',
    '        if(fe)fe.textContent="\u274c "+e.message;',
    '        if(btn){btn.textContent="\ud83d\udcbe Save to History";btn.disabled=false;}',
    '      });',
    '  }else{',
    '    var sn=notes.replace(/"/g,"\\"");',
    '    var cmd="npm run archive:save -- --decision="+decision+(notes?" --notes=""+sn+""":"")+" --yes";',
    '    copyToClipboard(cmd,fe);',
    '    if(fe)fe.innerHTML="\u2705 Command copied! Paste in your terminal:<br><code>"+cmd+"</code>";',
    '  }',
    '}',
    '',
    '// Archive detail view',
    'function showArchiveDetail(runId){',
    '  var sec=document.getElementById("history-section");',
    '  var det=document.getElementById("archive-detail");',
    '  if(!sec||!det)return;',
    '  sec.style.display="none";det.style.display="block";',
    '  var idEl=document.getElementById("detail-run-id");',
    '  if(idEl)idEl.textContent="Run: "+runId;',
    '  var cmd="npm run archive:view -- --run="+runId+" --verbose";',
    '  var me=document.getElementById("detail-meta");',
    '  if(me)me.innerHTML="<p>CLI details:</p><div class="detail-cli-block"><code>"+cmd+',
    '    "</code><button class="btn-sm btn-copy" onclick="copyCmd(&quot;"+runId+"&quot;,this)">\ud83d\udccb Copy</button></div>";',
    '  ["detail-summary","detail-breakdown","detail-cases"].forEach(function(i){',
    '    var e=document.getElementById(i);if(e)e.innerHTML="";',
    '  });',
    '}',
    'function hideArchiveDetail(){',
    '  var d=document.getElementById("archive-detail");',
    '  var s=document.getElementById("history-section");',
    '  if(d)d.style.display="none";if(s)s.style.display="";',
    '}',
    'function copyCmd(runId,btn){',
    '  copyToClipboard("npm run archive:view -- --run="+runId+" --verbose",btn);',
    '}',
    '',
    '// Delete archive',
    'function deleteArchive(runId){',
    '  if(!confirm("Delete archive "+runId+"?\\n\\nThis CANNOT be undone."))return;',
    '  if(window.__SERVE_MODE__){',
    '    fetch("/api/archive/"+encodeURIComponent(runId),{method:"DELETE"})',
    '      .then(function(r){return r.json();})',
    '      .then(function(d){if(!d.ok)alert("Delete failed: "+(d.error||"unknown"));})',
    '      .catch(function(e){alert("Network error: "+e.message);});',
    '  }else{',
    '    var cmd="npm run archive:delete -- --run="+runId+" --yes";',
    '    copyToClipboard(cmd,null);',
    '    alert("Delete command copied!\\n\\nPaste in your terminal:\\n"+cmd);',
    '  }',
    '}',
    '<' + '/script>',
  ];

  return lines.join('\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestampShort(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
}

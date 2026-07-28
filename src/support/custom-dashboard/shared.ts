import path from 'node:path';
import { getDashboardStyles } from './styles';
import type {
  CollectedAttachment,
  CollectedError,
  CollectedStep,
  CollectedTestData,
  TestSummary,
} from './types';

export const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const UNHEALTHY_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);

export function toReportRelativePath(absolutePath: string): string {
  return path.relative(REPORT_DIR, absolutePath).replace(/\\/g, '/');
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderTraceLinkFromAttachments(attachments: CollectedAttachment[]): string {
  const trace = attachments.find((attachment) => attachment.kind === 'trace');
  if (!trace) {
    return '<span class="muted">No trace</span>';
  }

  return `<a class="btn btn--ghost" href="${escapeHtml(trace.relativePath)}" target="_blank" rel="noopener">View trace</a>`;
}

export function renderErrorsSection(errors: CollectedError[]): string {
  if (errors.length === 0) {
    return '<p class="empty-state">No errors recorded.</p>';
  }

  return errors
    .map((error, index) => {
      const full = [error.message, error.stack]
        .filter((part) => part && part.trim().length > 0)
        .filter((part, i, parts) => i === 0 || !parts[0]?.includes(part ?? ''))
        .join('\n\n');
      return `
        <div class="test-error-container test-error-text" data-error-index="${index}">
          <pre class="test-error-view error-block">${escapeHtml(full)}</pre>
        </div>
      `;
    })
    .join('');
}

function stepHasFailedDescendant(step: CollectedStep): boolean {
  if (step.status === 'failed') {
    return true;
  }

  return step.steps.some(stepHasFailedDescendant);
}

function stepStatusIcon(status: string): string {
  if (status === 'failed')
    return '<span class="tree-item__status tree-item__status--failed" aria-hidden="true">✕</span>';
  if (status === 'skipped')
    return '<span class="tree-item__status tree-item__status--skipped" aria-hidden="true">⊘</span>';
  return '<span class="tree-item__status tree-item__status--passed" aria-hidden="true">✓</span>';
}

function renderStepTree(steps: CollectedStep[], level = 0): string {
  if (steps.length === 0) {
    return '';
  }

  return steps
    .map((step) => {
      const failed = step.status === 'failed';
      const hasChildren = step.steps.length > 0;
      const errorBlock = step.errorMessage
        ? `<div class="test-error-container"><pre class="test-error-view step-error">${escapeHtml(step.errorMessage)}</pre></div>`
        : '';
      const indentPx = 4 + level * 22;
      const titleText = escapeHtml(step.title);
      const titleAttr = escapeHtml(step.title.toLowerCase());
      const titleRow = `
        <div class="tree-item__title" style="padding-left:${indentPx}px">
          ${hasChildren ? '' : '<span class="tree-item__spacer" aria-hidden="true"></span>'}
          ${stepStatusIcon(step.status)}
          <span class="tree-item__label">${titleText}</span>
          <span class="tree-item__duration">${step.duration}ms</span>
        </div>
      `;

      if (!hasChildren) {
        return `
          <div class="tree-item${failed ? ' tree-item--failed' : ''}" role="treeitem" data-step-title="${titleAttr}">
            ${titleRow}
            ${errorBlock}
          </div>
        `;
      }

      const shouldOpen = failed || stepHasFailedDescendant(step);
      const openAttr = shouldOpen ? ' open' : '';

      return `
        <details class="tree-item tree-item--branch${failed ? ' tree-item--failed' : ''}" role="treeitem" data-step-title="${titleAttr}"${openAttr}>
          <summary class="tree-item__title" style="padding-left:${indentPx}px">
            ${stepStatusIcon(step.status)}
            <span class="tree-item__label">${titleText}</span>
            <span class="tree-item__duration">${step.duration}ms</span>
          </summary>
          <div class="tree-item__body">
            ${errorBlock}
            <div class="tree-item__children" role="group">${renderStepTree(step.steps, level + 1)}</div>
          </div>
        </details>
      `;
    })
    .join('');
}

export function renderStepsTimeline(steps: CollectedStep[]): string {
  if (steps.length === 0) {
    return '<p class="empty-state">No recorded test steps.</p>';
  }

  return `
    <div class="steps-panel" data-steps-panel>
      <form class="step-filter" role="search" onsubmit="return false;">
        <span class="step-filter__icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          class="step-filter__input"
          data-step-filter
          spellcheck="false"
          autocomplete="off"
          placeholder="Filter steps"
          aria-label="Filter steps"
        />
      </form>
      <div class="tree-item-list steps-tree" role="tree">${renderStepTree(steps)}</div>
      <p class="step-filter-empty" data-step-filter-empty hidden>No steps match this filter.</p>
    </div>
  `;
}

function renderScreenshotAttachment(attachment: CollectedAttachment): string {
  if (!attachment.relativePath) {
    return `<div class="attachment-chip attachment-chip--missing">Missing screenshot · ${escapeHtml(attachment.name)}</div>`;
  }
  return `
    <figure class="attachment-card attachment-card--screenshot">
      <img src="${escapeHtml(attachment.relativePath)}" alt="${escapeHtml(attachment.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'attachment-chip attachment-chip--missing',textContent:'Missing file'}))" />
      <figcaption>${escapeHtml(attachment.name)}</figcaption>
    </figure>
  `;
}

function renderVideoAttachment(attachment: CollectedAttachment): string {
  if (!attachment.relativePath) {
    return `<div class="attachment-chip attachment-chip--missing">Missing video · ${escapeHtml(attachment.name)}</div>`;
  }
  const typeAttr = attachment.contentType ? ` type="${escapeHtml(attachment.contentType)}"` : '';
  return `
    <figure class="attachment-card attachment-card--video">
      <video controls preload="metadata">
        <source src="${escapeHtml(attachment.relativePath)}"${typeAttr} />
      </video>
      <figcaption>${escapeHtml(attachment.name)}</figcaption>
    </figure>
  `;
}

function renderTraceAttachment(attachment: CollectedAttachment): string {
  if (!attachment.relativePath) {
    return `<span class="attachment-chip attachment-chip--missing">Missing trace · ${escapeHtml(attachment.name)}</span>`;
  }
  return `
    <a class="attachment-chip attachment-chip--trace" href="${escapeHtml(attachment.relativePath)}" target="_blank" rel="noopener">
      Trace · ${escapeHtml(attachment.name)}
    </a>
  `;
}

function renderOtherAttachment(attachment: CollectedAttachment): string {
  if (!attachment.relativePath) {
    return `<span class="attachment-chip attachment-chip--missing">${escapeHtml(attachment.name)}</span>`;
  }
  return `
    <a class="attachment-chip" href="${escapeHtml(attachment.relativePath)}" target="_blank" rel="noopener" download>
      ${escapeHtml(attachment.name)}
    </a>
  `;
}

export function renderAttachmentsSection(attachments: CollectedAttachment[]): string {
  if (attachments.length === 0) {
    return '<p class="empty-state">No attachments recorded.</p>';
  }

  const screenshots = attachments.filter((attachment) => attachment.kind === 'screenshot');
  const videos = attachments.filter((attachment) => attachment.kind === 'video');
  const traces = attachments.filter((attachment) => attachment.kind === 'trace');
  const others = attachments.filter((attachment) => attachment.kind === 'other');

  const mediaGrid = [...screenshots, ...videos]
    .map((attachment) =>
      attachment.kind === 'screenshot'
        ? renderScreenshotAttachment(attachment)
        : renderVideoAttachment(attachment),
    )
    .join('');

  const chipRow = [...traces, ...others]
    .map((attachment) =>
      attachment.kind === 'trace'
        ? renderTraceAttachment(attachment)
        : renderOtherAttachment(attachment),
    )
    .join('');

  return `
    ${mediaGrid ? `<div class="attachment-grid">${mediaGrid}</div>` : ''}
    ${chipRow ? `<div class="attachment-chips">${chipRow}</div>` : ''}
  `;
}

export function flattenSteps(
  steps: CollectedStep[],
  level = 0,
): Array<CollectedStep & { level: number }> {
  const rows: Array<CollectedStep & { level: number }> = [];

  for (const step of steps) {
    rows.push({ ...step, level });
    if (step.steps.length > 0) {
      rows.push(...flattenSteps(step.steps, level + 1));
    }
  }

  return rows;
}

export function renderStatusPill(status: string): string {
  const safe = escapeHtml(status);
  const cls = UNHEALTHY_STATUSES.has(status)
    ? 'status-pill--failed'
    : status === 'skipped'
      ? 'status-pill--skipped'
      : 'status-pill--passed';
  return `<span class="status-pill ${cls}">${safe}</span>`;
}

export function renderPriorityBadge(priority: string): string {
  const p = (priority || 'medium').toLowerCase();
  const cls = `priority-badge priority-badge--${p}`;
  return `<span class="${cls}">${(priority || 'MEDIUM').toUpperCase()}</span>`;
}

export function renderLayerBadges(layers: string[]): string {
  if (layers.length === 0) return '-';
  return layers
    .map((l) => `<span class="layer-badge layer-badge--${l.toLowerCase()}">${escapeHtml(l)}</span>`)
    .join(' ');
}

function getVerdict(summary: TestSummary): {
  label: string;
  tone: 'healthy' | 'warning' | 'critical';
  summaryLine: string;
} {
  if (summary.failed > 0) {
    return {
      label: 'Run failed',
      tone: 'critical',
      summaryLine: `${summary.failed} unhealthy test${summary.failed === 1 ? '' : 's'} need${summary.failed === 1 ? 's' : ''} triage.`,
    };
  }

  if (summary.skipped > 0) {
    return {
      label: 'Run degraded',
      tone: 'warning',
      summaryLine: `${summary.skipped} skipped test${summary.skipped === 1 ? '' : 's'} reduced coverage.`,
    };
  }

  return {
    label: 'Run healthy',
    tone: 'healthy',
    summaryLine:
      summary.total > 0 ? 'All executed tests passed.' : 'No tests were captured in this run.',
  };
}

export function formatDisplayTime(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const day = d.getDate();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${mon} ${yr}, ${hh}:${mm}`;
  } catch {
    return raw;
  }
}

function formatDurationMs(ms: number): string {
  if (!ms || ms < 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function truncateMiddle(value: string, max = 18): string {
  if (!value || value.length <= max) return value;
  const keep = Math.floor((max - 1) / 2);
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

function iconSvg(name: string): string {
  const common =
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  switch (name) {
    case 'doc':
      // Square document glyph (less flat than tall-only page path)
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7 3.5h7.5L19 8v12.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path ${common} d="M14 3.5V8h5"/><path ${common} d="M9 13h6M9 16.5h4"/></svg>`;
    case 'layers':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="m12 3 9 5-9 5-9-5 9-5z"/><path ${common} d="m3 12 9 5 9-5"/><path ${common} d="m3 16 9 5 9-5"/></svg>`;
    case 'calendar':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect ${common} x="3" y="5" width="18" height="16" rx="2"/><path ${common} d="M8 3v4M16 3v4M3 10h18"/></svg>`;
    case 'clock':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle ${common} cx="12" cy="12" r="9"/><path ${common} d="M12 7v5l3 2"/></svg>`;
    case 'heart':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z"/></svg>`;
    case 'list':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/></svg>`;
    case 'check':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="m6 12 4 4 8-8"/></svg>`;
    case 'x':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7 7l10 10M17 7 7 17"/></svg>`;
    case 'skip':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M6 7v10l7-5-7-5zM15 7v10"/></svg>`;
    case 'chart':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path ${common} d="M13.5 3.5A8.5 8.5 0 0 1 20.5 10.5H13.5V3.5z"/></svg>`;
    case 'pin':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"/><circle ${common} cx="12" cy="10" r="2.5"/></svg>`;
    case 'search':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle ${common} cx="11" cy="11" r="7"/><path ${common} d="m20 20-3.5-3.5"/></svg>`;
    case 'warn':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 3 2 20h20L12 3z"/><path ${common} d="M12 10v4M12 17h.01"/></svg>`;
    case 'download':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>`;
    case 'table':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect ${common} x="3" y="4" width="18" height="16" rx="2"/><path ${common} d="M3 10h18M3 15h18M9 10v10M15 10v10"/></svg>`;
    case 'sun':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle ${common} cx="12" cy="12" r="4"/><path ${common} d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M5 19l1.5-1.5"/></svg>`;
    default:
      return '';
  }
}

export function renderHero(
  mode: 'local' | 'ci',
  summary: TestSummary,
  collectedTests: CollectedTestData[],
): string {
  const verdict = getVerdict(summary);
  const unhealthyCount = collectedTests.filter((testData) =>
    UNHEALTHY_STATUSES.has(testData.status),
  ).length;

  const displayTime = formatDisplayTime(summary.timestamp);
  const appEnv = summary.runMeta?.appEnv ?? 'unknown';
  const runId = summary.runMeta?.runId;
  const totalDuration = formatDurationMs(summary.runMeta?.totalDurationMs ?? 0);
  const showFailMark = verdict.tone === 'critical';

  return `
    <header class="hero hero--${verdict.tone}">
      <div class="hero__top-row">
        <div class="hero__identity">
          <div class="hero__mark" aria-hidden="true">
            ${iconSvg('doc')}
            ${showFailMark ? `<span class="hero__mark-x">×</span>` : ''}
          </div>
          <div class="hero__copy">
            <div class="hero__eyebrow">${mode === 'ci' ? 'CI EXECUTION REPORT' : 'LOCAL EXECUTION REPORT'}</div>
            <h1 class="hero__title">${verdict.label === 'Run failed' ? 'Run Failed' : verdict.label === 'Run healthy' ? 'Run Healthy' : 'Run Degraded'}</h1>
            <p class="hero__subtitle">${verdict.summaryLine}</p>
          </div>
        </div>
        <div class="hero__top-actions">
          <span class="badge ${mode === 'ci' ? 'badge--ci' : 'badge--local'}">${iconSvg('pin')} ${mode === 'ci' ? 'CI MODE' : 'LOCAL MODE'}</span>
          <button class="theme-toggle" id="themeToggle" type="button" aria-label="Switch to dark mode" aria-pressed="false">
            <span class="theme-toggle__icon" aria-hidden="true">${iconSvg('sun')}</span>
            <span class="theme-toggle__label">Light</span>
          </button>
        </div>
      </div>
      <div class="hero__meta-inline">
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">${iconSvg('layers')}</span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">APP_ENV</span>
            <strong>${escapeHtml(appEnv)}</strong>
          </span>
        </div>
        ${
          runId
            ? `<div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">${iconSvg('list')}</span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">Run ID</span>
            <strong title="${escapeHtml(runId)}">${escapeHtml(truncateMiddle(runId, 16))}</strong>
          </span>
        </div>`
            : ''
        }
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">${iconSvg('calendar')}</span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">Generated</span>
            <strong>${escapeHtml(displayTime)}</strong>
          </span>
        </div>
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">${iconSvg('clock')}</span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">Duration</span>
            <strong>${escapeHtml(totalDuration)}</strong>
          </span>
        </div>
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">${iconSvg('heart')}</span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">Unhealthy</span>
            <strong>${unhealthyCount}</strong>
          </span>
        </div>
      </div>
      <div class="hero-stat-bar">
        <div class="hero-stat">
          <span class="hero-stat__icon" aria-hidden="true">${iconSvg('list')}</span>
          <span class="hero-stat__copy"><span class="hero-stat__num">${summary.total}</span><span class="hero-stat__lbl">Total</span></span>
        </div>
        <div class="hero-stat hero-stat--passed">
          <span class="hero-stat__icon" aria-hidden="true">${iconSvg('check')}</span>
          <span class="hero-stat__copy"><span class="hero-stat__num">${summary.passed}</span><span class="hero-stat__lbl">Passed</span></span>
        </div>
        <div class="hero-stat hero-stat--failed">
          <span class="hero-stat__icon" aria-hidden="true">${iconSvg('x')}</span>
          <span class="hero-stat__copy"><span class="hero-stat__num">${summary.failed}</span><span class="hero-stat__lbl">Failed</span></span>
        </div>
        <div class="hero-stat hero-stat--skipped">
          <span class="hero-stat__icon" aria-hidden="true">${iconSvg('skip')}</span>
          <span class="hero-stat__copy"><span class="hero-stat__num">${summary.skipped}</span><span class="hero-stat__lbl">Skipped</span></span>
        </div>
        <div class="hero-stat hero-stat--accent">
          <span class="hero-stat__icon" aria-hidden="true">${iconSvg('chart')}</span>
          <span class="hero-stat__copy"><span class="hero-stat__num">${summary.passRate}%</span><span class="hero-stat__lbl">Pass rate</span></span>
        </div>
      </div>
    </header>
  `;
}

export function renderRoleHealthStrip(
  summary: TestSummary,
  collectedTests: CollectedTestData[],
): string {
  if (summary.reportMode !== 'role-aware' || !summary.rolesInScope?.length) {
    return '';
  }

  const chips = summary.rolesInScope
    .map((role) => {
      const tests = collectedTests.filter((t) => (t.role || '') === role);
      const total = tests.length;
      const passed = tests.filter((t) => t.status === 'passed').length;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      const tone = rate >= 90 ? 'good' : rate >= 70 ? 'warn' : 'bad';
      return `<div class="role-health__chip role-health__chip--${tone}" title="${escapeHtml(role)}">
        <strong>${escapeHtml(role)}</strong>
        <span>${passed}/${total}</span>
        <span class="role-health__rate">${rate}%</span>
      </div>`;
    })
    .join('');

  return `<section class="role-health" aria-label="Pass rate by role">${chips}</section>`;
}

export function renderStatGrid(summary: TestSummary): string {
  return `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-card__label">Total</div><div class="stat-card__value">${summary.total}</div></div>
      <div class="stat-card stat-card--passed"><div class="stat-card__label">Passed</div><div class="stat-card__value">${summary.passed}</div></div>
      <div class="stat-card stat-card--failed"><div class="stat-card__label">Failed</div><div class="stat-card__value">${summary.failed}</div></div>
      <div class="stat-card stat-card--skipped"><div class="stat-card__label">Skipped</div><div class="stat-card__value">${summary.skipped}</div></div>
      <div class="stat-card stat-card--accent"><div class="stat-card__label">Pass rate</div><div class="stat-card__value">${summary.passRate}%</div></div>
    </div>
  `;
}

const ARTIFACTS_LIST_LIMIT = 4;

function collectAttachmentsByKind(
  tests: CollectedTestData[],
  kind: CollectedAttachment['kind'],
): Array<{ testId: string; title: string; name: string; href: string }> {
  const rows: Array<{ testId: string; title: string; name: string; href: string }> = [];
  for (const test of tests) {
    for (const attachment of test.attachments) {
      if (attachment.kind !== kind || !attachment.relativePath) continue;
      rows.push({
        testId: test.testId || '-',
        title: test.title || test.fullTitle || 'test',
        name: attachment.name || kind,
        href: attachment.relativePath,
      });
    }
  }
  return rows;
}

function collectRetriedTests(
  tests: CollectedTestData[],
): Array<{ testId: string; title: string; retry: number }> {
  return tests
    .filter((t) => t.retry > 0)
    .map((t) => ({
      testId: t.testId || '-',
      title: t.title || t.fullTitle || 'test',
      retry: t.retry,
    }));
}

function renderArtifactFileList(
  items: Array<{ testId: string; title: string; name?: string; href?: string; retry?: number }>,
  emptyLabel: string,
  limit = ARTIFACTS_LIST_LIMIT,
): string {
  if (items.length === 0) {
    return `<p class="artifacts-card__empty">${escapeHtml(emptyLabel)}</p>`;
  }

  const visible = items.slice(0, limit);
  const remaining = items.length - visible.length;

  return `
    <ul class="artifacts-card__files">
      ${visible
        .map((item) => {
          const label = item.name
            ? `${item.testId} · ${item.name}`
            : `${item.testId}${item.retry != null ? ` · retry ×${item.retry}` : ''}`;
          const sub = escapeHtml(item.title);
          if (item.href) {
            return `<li>
              <a class="artifacts-card__file" href="${escapeHtml(item.href)}" target="_blank" rel="noopener" title="${sub}">
                <span class="artifacts-card__file-name">${escapeHtml(label)}</span>
                <span class="artifacts-card__file-sub">${sub}</span>
              </a>
            </li>`;
          }
          return `<li>
            <div class="artifacts-card__file artifacts-card__file--static" title="${sub}">
              <span class="artifacts-card__file-name">${escapeHtml(label)}</span>
              <span class="artifacts-card__file-sub">${sub}</span>
            </div>
          </li>`;
        })
        .join('')}
    </ul>
    ${
      remaining > 0
        ? `<p class="artifacts-card__more">+${remaining} more — open Attachments folder</p>`
        : ''
    }
  `;
}

/**
 * Single Operate-surface card: evidence inventory (with real files) + related report links.
 * Default collapsed so table triage stays primary; expand when QA needs drill-down.
 */
export function renderArtifactsStrip(collectedTests: CollectedTestData[]): string {
  const retried = collectRetriedTests(collectedTests);
  const traces = collectAttachmentsByKind(collectedTests, 'trace');
  const screenshots = collectAttachmentsByKind(collectedTests, 'screenshot');
  const videos = collectAttachmentsByKind(collectedTests, 'video');

  const totalEvidence = traces.length + screenshots.length + videos.length;
  const readiness =
    totalEvidence === 0 && retried.length === 0
      ? 'No retries or attachments in this run'
      : `${retried.length} retried · ${traces.length} trace · ${screenshots.length} ss · ${videos.length} video`;

  const buckets = [
    {
      key: 'retries',
      label: 'Retries',
      count: retried.length,
      body: renderArtifactFileList(
        retried.map((r) => ({ testId: r.testId, title: r.title, retry: r.retry })),
        'No retried tests',
      ),
    },
    {
      key: 'traces',
      label: 'Traces',
      count: traces.length,
      body: renderArtifactFileList(traces, 'No trace files'),
    },
    {
      key: 'screenshots',
      label: 'Screenshots',
      count: screenshots.length,
      body: renderArtifactFileList(screenshots, 'No screenshots'),
    },
    {
      key: 'videos',
      label: 'Videos',
      count: videos.length,
      body: renderArtifactFileList(videos, 'No videos'),
    },
  ];

  return `
    <details class="artifacts-card" aria-label="Evidence and related reports">
      <summary class="artifacts-card__summary">
        <div class="artifacts-card__titles">
          <span class="artifacts-card__eyebrow">Evidence &amp; reports</span>
          <span class="artifacts-card__title">Drill-down inventory</span>
          <span class="artifacts-card__readiness">${escapeHtml(readiness)}</span>
        </div>
        <span class="artifacts-card__chevron" aria-hidden="true"></span>
      </summary>

      <div class="artifacts-card__body">
        <p class="artifacts-card__hint">Open a file or related report. Preview paths resolve one level up to <code>reports/</code>.</p>

        <div class="artifacts-card__grid">
          ${buckets
            .map(
              (b) => `
            <article class="artifacts-bucket artifacts-bucket--${b.key}${b.count === 0 ? ' artifacts-bucket--empty' : ''}">
              <header class="artifacts-bucket__head">
                <span class="artifacts-bucket__label">${b.label}</span>
                <strong class="artifacts-bucket__count">${b.count}</strong>
              </header>
              ${b.body}
            </article>`,
            )
            .join('')}
        </div>

        <div class="artifacts-card__links" id="deep-links">
          <span class="artifacts-card__links-label">Related</span>
          <a class="artifacts-link" href="html/index.html" data-deep-link="html" target="_blank" rel="noopener">
            <span class="artifacts-link__title">Playwright HTML</span>
            <span class="artifacts-link__path">reports/html/index.html</span>
          </a>
          <a class="artifacts-link" href="test-summary.json" data-deep-link="summary" target="_blank" rel="noopener">
            <span class="artifacts-link__title">Test summary JSON</span>
            <span class="artifacts-link__path">reports/test-summary.json</span>
          </a>
          <a class="artifacts-link" href="attachments/" data-deep-link="attachments" target="_blank" rel="noopener">
            <span class="artifacts-link__title">Attachments folder</span>
            <span class="artifacts-link__path">reports/attachments/</span>
          </a>
        </div>
      </div>
    </details>
    <script>
    (function () {
      try {
        var raw = String(location.pathname || '') + ' ' + String(location.href || '');
        var path = raw.split('\\\\').join('/').toLowerCase();
        var inPreview = path.indexOf('/preview/') !== -1 || path.indexOf('/preview\\\\') !== -1;
        if (!inPreview) return;
        document.querySelectorAll('#deep-links a.artifacts-link, #deep-links a.deep-link').forEach(function (a) {
          var link = a.getAttribute('href') || '';
          if (link && link.charAt(0) !== '.' && link.charAt(0) !== '/' && link.indexOf('../') !== 0) {
            a.setAttribute('href', '../' + link);
          }
        });
        document.querySelectorAll('.artifacts-card a.artifacts-card__file').forEach(function (a) {
          var link = a.getAttribute('href') || '';
          if (link && link.charAt(0) !== '.' && link.charAt(0) !== '/' && link.indexOf('../') !== 0 && link.indexOf('http') !== 0) {
            a.setAttribute('href', '../' + link);
          }
        });
      } catch (e) {}
    })();
    </script>
  `;
}

export function renderFailureAlert(unhealthyCount: number): string {
  const exportButtons = `
    <div class="alert__actions export-buttons" role="group" aria-label="Export options">
      <button class="btn btn--ghost btn--sm" id="btn-copy-confluence" type="button">
        <span class="btn__icon" aria-hidden="true">${iconSvg('doc')}</span>
        Copy for Confluence
      </button>
      <button class="btn btn--ghost btn--sm" id="btn-copy-tsv" type="button">
        <span class="btn__icon" aria-hidden="true">${iconSvg('table')}</span>
        Copy Data (TSV)
      </button>
      <button class="btn btn--primary btn--sm" id="btn-download-csv" type="button">
        <span class="btn__icon" aria-hidden="true">${iconSvg('download')}</span>
        Download CSV
      </button>
    </div>
  `;

  if (unhealthyCount === 0) {
    return `
      <div class="alert alert--success">
        <div class="alert__body">
          <span class="alert__icon" aria-hidden="true">${iconSvg('check')}</span>
          <div class="alert__copy">
            <strong>Queue clear.</strong>
            <span>No unhealthy tests were captured in this run.</span>
          </div>
        </div>
        ${exportButtons}
      </div>
    `;
  }

  return `
    <div class="alert alert--warning">
      <div class="alert__body">
        <span class="alert__icon" aria-hidden="true">${iconSvg('warn')}</span>
        <div class="alert__copy">
          <strong>Incident queue active.</strong>
          <span>${unhealthyCount} unhealthy test${unhealthyCount === 1 ? '' : 's'} surfaced in this run.</span>
        </div>
      </div>
      ${exportButtons}
    </div>
  `;
}

export function renderChartScript(summary: TestSummary): string {
  const verdict = getVerdict(summary);

  return `
    <script>
      const chartData = {
        passed: ${summary.passed},
        failed: ${summary.failed},
        skipped: ${summary.skipped},
        passRate: ${summary.passRate},
        label: ${JSON.stringify(verdict.label)}
      };

      function readThemeColor(name, fallback) {
        const root = document.documentElement;
        const value = getComputedStyle(root).getPropertyValue(name).trim();
        return value || fallback;
      }

      const centerTextPlugin = {
        id: 'centerText',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);
          if (!meta || !meta.data || !meta.data[0]) return;
          const x = meta.data[0].x;
          const y = meta.data[0].y;

          ctx.save();
          ctx.font = '700 28px Inter, system-ui, sans-serif';
          ctx.fillStyle = readThemeColor('--chart-center-text', '#0f172a');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(chartData.passRate + '%', x, y - 8);
          ctx.font = '500 11px Inter, system-ui, sans-serif';
          ctx.fillStyle = readThemeColor('--chart-center-subtext', '#64748b');
          ctx.fillText(chartData.label, x, y + 16);
          ctx.restore();
        }
      };

      function buildChart() {
        const canvas = document.getElementById('resultDonut');
        if (!canvas) return;
        if (!(window.Chart)) {
          // Offline / CDN blocked — simple bar fallback
          const wrap = canvas.parentElement;
          if (wrap && !wrap.querySelector('.fallback-bars')) {
            const total = Math.max(1, chartData.passed + chartData.failed + chartData.skipped);
            wrap.innerHTML = '<div class="fallback-bars">'
              + '<div><strong>Passed</strong> ' + chartData.passed + '<div class="bar bar--passed"><span style="--w:' + Math.round(chartData.passed/total*100) + '%"></span></div></div>'
              + '<div><strong>Failed</strong> ' + chartData.failed + '<div class="bar bar--failed"><span style="--w:' + Math.round(chartData.failed/total*100) + '%"></span></div></div>'
              + '<div><strong>Skipped</strong> ' + chartData.skipped + '<div class="bar bar--skipped"><span style="--w:' + Math.round(chartData.skipped/total*100) + '%"></span></div></div>'
              + '</div>';
          }
          return;
        }
        const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        const palette = {
          light: {
            data: ['#9fc5a8', '#e2b6b0', '#e4c48a'],
            hover: ['#87b694', '#d49f98', '#d4b06e'],
            border: '#fffbf7',
            legend: '#6b5b4f',
          },
          dark: {
            data: ['#7dcea0', '#e8b4b0', '#e0c070'],
            hover: ['#6bb88c', '#d49f9a', '#c9a84e'],
            border: '#221a14',
            legend: '#b9a594',
          },
        }[theme];

        const existing = window.Chart.getChart ? window.Chart.getChart('resultDonut') : null;
        if (existing) existing.destroy();

        new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: ['Passed', 'Failed', 'Skipped'],
            datasets: [{
              data: [chartData.passed, chartData.failed, chartData.skipped],
              backgroundColor: palette.data,
              hoverBackgroundColor: palette.hover,
              borderColor: palette.border,
              borderWidth: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '72%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: palette.legend,
                  padding: 18,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  boxWidth: 8,
                  font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: '600' }
                }
              }
            }
          },
          plugins: [centerTextPlugin]
        });
      }

      buildChart();
      window.__rebuildDashboardChart = buildChart;
    </script>
  `;
}

export function renderThemeScript(): string {
  return `
    <script>
      (function () {
        const STORAGE_KEY = 'dashboard-theme';
        const root = document.documentElement;
        const toggle = document.getElementById('themeToggle');
        const iconEl = toggle ? toggle.querySelector('.theme-toggle__icon') : null;
        const labelEl = toggle ? toggle.querySelector('.theme-toggle__label') : null;

        function detectInitial() {
          try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
          } catch (error) {
            // ignore storage access errors
          }
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
          }
          return 'light';
        }

        function applyTheme(theme) {
          const next = theme === 'dark' ? 'dark' : 'light';
          root.dataset.theme = next;
          if (toggle) {
            toggle.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
            toggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          }
          if (iconEl) iconEl.textContent = next === 'dark' ? '☾' : '☀';
          if (labelEl) labelEl.textContent = next === 'dark' ? 'Dark' : 'Light';
          try { window.localStorage.setItem(STORAGE_KEY, next); } catch (error) { /* ignore */ }
          if (typeof window.__rebuildDashboardChart === 'function') {
            window.__rebuildDashboardChart();
          }
          window.dispatchEvent(new CustomEvent('dashboard-theme-change', { detail: { theme: next } }));
        }

        applyTheme(detectInitial());

        if (toggle) {
          toggle.addEventListener('click', () => {
            applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
          });
        }
      })();
    </script>
  `;
}

export function renderDocumentShell(options: {
  pageTitle: string;
  mode: 'local' | 'ci';
  summary: TestSummary;
  collectedTests: CollectedTestData[];
  body: string;
  includeChart: boolean;
}): string {
  const { pageTitle, mode, summary, collectedTests, body, includeChart } = options;
  const chartScript = includeChart ? renderChartScript(summary) : '';
  const themeScript = renderThemeScript();
  const interactiveScript = renderInteractiveScript();

  return `<!doctype html>
<html lang="en" data-density="dense">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  ${includeChart ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>' : ''}
  <style>${getDashboardStyles()}</style>
</head>
<body>
  <div class="page-shell">
    <div class="page-backdrop" aria-hidden="true"></div>
    <main class="page">
      ${renderHero(mode, summary, collectedTests)}
      ${body}
    </main>
  </div>
  ${themeScript}
  ${chartScript}
  ${interactiveScript}
</body>
</html>`;
}

/** View toggle + filter/search + density + keyboard shortcuts. */
function renderInteractiveScript(): string {
  return `
  <script>
  (function () {
    /* ---- View toggle (Accordion ↔ Table) ---- */
        document.querySelectorAll('.toggle-btn[data-view]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var view = btn.getAttribute('data-view');
            document.querySelectorAll('.view-panel').forEach(function (panel) {
              var active = panel.id === 'view-' + view;
              panel.classList.toggle('view-panel--active', active);
              panel.classList.toggle('view-panel--hidden', !active);
              panel.setAttribute('aria-hidden', String(!active));
            });
            // Toolbars sit OUTSIDE view panels — toggle by data-toolbar-for
            document.querySelectorAll('[data-toolbar-for]').forEach(function (tb) {
              var forView = tb.getAttribute('data-toolbar-for');
              var show = forView === view;
              tb.hidden = !show;
              tb.setAttribute('aria-hidden', String(!show));
              tb.classList.toggle('view-toolbar--hidden', !show);
            });
            document.querySelectorAll('.toggle-btn[data-view]').forEach(function (b) {
              var isActive = b === btn;
              b.classList.toggle('toggle-btn--active', isActive);
              b.setAttribute('aria-selected', String(isActive));
            });
            // Recount after view switch
            if (typeof applyFilters === 'function') applyFilters();
            else {
              var evt = new Event('change');
              var statusEl2 = document.getElementById('filter-status');
              if (statusEl2) statusEl2.dispatchEvent(evt);
            }
          });
        });
        // Initial toolbar visibility (table active by default)
                document.querySelectorAll('[data-toolbar-for]').forEach(function (tb) {
                  var forView = tb.getAttribute('data-toolbar-for');
                  var show = forView === 'table';
                  tb.hidden = !show;
                  tb.setAttribute('aria-hidden', String(!show));
                  tb.classList.toggle('view-toolbar--hidden', !show);
                });

    /* ---- Column visibility (Filter columns) ---- */
    var COL_KEY = 'dashboard-columns-v2';
    var LOCKED_COLS = { testId: true, status: true, no: true };
    var DEFAULT_COLS = {
      no: true,
      testId: true,
      module: false,
      feature: false,
      description: true,
      steps: true,
      input: true,
      expected: true,
      actual: true,
      status: true,
      priority: true,
      source: false,
      notes: true
    };
    var colPicker = document.getElementById('column-picker');
    var colBtn = document.getElementById('column-picker-btn');
    var colMenu = document.getElementById('column-picker-menu');

    function loadColState() {
      try {
        var raw = localStorage.getItem(COL_KEY);
        if (!raw) return Object.assign({}, DEFAULT_COLS);
        var parsed = JSON.parse(raw);
        return Object.assign({}, DEFAULT_COLS, parsed, { testId: true, status: true, no: true });
      } catch (e) {
        return Object.assign({}, DEFAULT_COLS);
      }
    }

    function saveColState(state) {
      try { localStorage.setItem(COL_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function applyColumnVisibility(state) {
      document.querySelectorAll('.qa-report-table [data-col]').forEach(function (cell) {
        var key = cell.getAttribute('data-col');
        if (!key) return;
        var visible = state[key] !== false || LOCKED_COLS[key];
        if (visible) {
          cell.removeAttribute('data-col-hidden');
        } else {
          cell.setAttribute('data-col-hidden', '1');
        }
      });
      document.querySelectorAll('[data-col-toggle]').forEach(function (input) {
        var key = input.getAttribute('data-col-toggle');
        if (!key) return;
        input.checked = state[key] !== false;
      });
    }

    function currentColStateFromUI() {
      var state = Object.assign({}, DEFAULT_COLS);
      document.querySelectorAll('[data-col-toggle]').forEach(function (input) {
        var key = input.getAttribute('data-col-toggle');
        if (!key || LOCKED_COLS[key]) return;
        state[key] = !!input.checked;
      });
      state.testId = true;
      state.status = true;
      state.no = true;
      return state;
    }

    var colState = loadColState();
    applyColumnVisibility(colState);

    if (colBtn && colPicker && colMenu) {
      colBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !colPicker.classList.contains('is-open');
        colPicker.classList.toggle('is-open', open);
        colBtn.setAttribute('aria-expanded', String(open));
        if (open) colMenu.removeAttribute('hidden');
        else colMenu.setAttribute('hidden', '');
      });
      document.addEventListener('click', function (e) {
        if (!colPicker.contains(e.target)) {
          colPicker.classList.remove('is-open');
          colBtn.setAttribute('aria-expanded', 'false');
          colMenu.setAttribute('hidden', '');
        }
      });
      colMenu.addEventListener('click', function (e) { e.stopPropagation(); });
      document.querySelectorAll('[data-col-toggle]').forEach(function (input) {
        input.addEventListener('change', function () {
          colState = currentColStateFromUI();
          applyColumnVisibility(colState);
          saveColState(colState);
        });
      });
      var showAllBtn = document.getElementById('column-picker-show-all');
      var resetBtn = document.getElementById('column-picker-reset');
      if (showAllBtn) {
        showAllBtn.addEventListener('click', function () {
          colState = Object.assign({}, DEFAULT_COLS);
          applyColumnVisibility(colState);
          saveColState(colState);
        });
      }
      if (resetBtn) {
              resetBtn.addEventListener('click', function () {
                colState = Object.assign({}, DEFAULT_COLS);
                applyColumnVisibility(colState);
                saveColState(colState);
                // Restore sticky pins to default (on)
                var pinH = document.getElementById('pin-sticky-header');
                var pinL = document.getElementById('pin-sticky-left');
                if (pinH) pinH.checked = true;
                if (pinL) pinL.checked = true;
                applyStickyPins();
                saveStickyPins();
              });
            }
          }

          /* ---- Sticky pin toggles (table-only) ---- */
          var STICKY_KEY = 'dashboard-sticky-pins-v1';
          function applyStickyPins() {
            var pinHeader = document.getElementById('pin-sticky-header');
            var pinLeft = document.getElementById('pin-sticky-left');
            var headerOn = !pinHeader || pinHeader.checked;
            var leftOn = !pinLeft || pinLeft.checked;
            document.documentElement.setAttribute('data-sticky-header', headerOn ? 'on' : 'off');
            document.documentElement.setAttribute('data-sticky-left', leftOn ? 'on' : 'off');
          }
          function saveStickyPins() {
            try {
              var pinHeader = document.getElementById('pin-sticky-header');
              var pinLeft = document.getElementById('pin-sticky-left');
              localStorage.setItem(STICKY_KEY, JSON.stringify({
                header: !pinHeader || pinHeader.checked,
                left: !pinLeft || pinLeft.checked
              }));
            } catch (e) {}
          }
          try {
            var savedPins = JSON.parse(localStorage.getItem(STICKY_KEY) || 'null');
            if (savedPins) {
              var pinHeaderEl = document.getElementById('pin-sticky-header');
              var pinLeftEl = document.getElementById('pin-sticky-left');
              if (pinHeaderEl && typeof savedPins.header === 'boolean') pinHeaderEl.checked = savedPins.header;
              if (pinLeftEl && typeof savedPins.left === 'boolean') pinLeftEl.checked = savedPins.left;
            }
          } catch (e) {}
          applyStickyPins();
          document.querySelectorAll('[data-pin-sticky]').forEach(function (input) {
            input.addEventListener('change', function () {
              applyStickyPins();
              saveStickyPins();
            });
          });

          /* ---- Filters ---- */
    var FILTER_KEY = 'dashboard-filters-v1';
    var searchEl = document.getElementById('dash-search');
    var statusEl = document.getElementById('filter-status');
    var priorityEl = document.getElementById('filter-priority');
    var roleEl = document.getElementById('filter-role');
    var evidenceEl = document.getElementById('filter-evidence');
    var countEl = document.getElementById('filter-count');

    function readState() {
      return {
        q: (searchEl && searchEl.value || '').trim().toLowerCase(),
        status: statusEl && statusEl.value || '',
        priority: priorityEl && priorityEl.value || '',
        role: roleEl && roleEl.value || '',
        evidence: !!(evidenceEl && evidenceEl.checked)
      };
    }

    function rowMatches(el, state) {
      var search = el.getAttribute('data-search') || '';
      var status = el.getAttribute('data-status') || '';
      var priority = el.getAttribute('data-priority') || '';
      var role = el.getAttribute('data-role') || '';
      if (state.q && search.indexOf(state.q) === -1) return false;
      if (state.status === 'failed') {
        if (['failed','timedOut','interrupted'].indexOf(status) === -1) return false;
      } else if (state.status && status !== state.status) return false;
      if (state.priority && priority !== state.priority) return false;
      if (state.role && role !== state.role) return false;
      if (state.evidence) {
        if (el.getAttribute('data-has-trace') !== '1'
          && el.getAttribute('data-has-screenshot') !== '1'
          && el.getAttribute('data-has-video') !== '1') return false;
      }
      return true;
    }

    function applyFilters() {
      var state = readState();
      // Count unique tests from active view only (avoid accordion+table double count)
      var activePanel = document.querySelector('.view-panel--active') || document;
      var nodes = activePanel.querySelectorAll('[data-search]');
      // Still apply hide/show to ALL data-search nodes so switching views stays consistent
      document.querySelectorAll('[data-search]').forEach(function (el) {
        var ok = rowMatches(el, state);
        if (ok) {
          el.hidden = false;
          el.removeAttribute('hidden');
          if (el.style) el.style.display = '';
        } else {
          el.hidden = true;
          if (el.tagName === 'TR') el.style.display = 'none';
        }
      });
      var shown = 0, total = 0;
      nodes.forEach(function (el) {
        total += 1;
        if (!el.hidden && !(el.style && el.style.display === 'none')) shown += 1;
      });
      document.querySelectorAll('.role-section').forEach(function (section) {
        var any = section.querySelector('[data-search]:not([hidden])');
        section.hidden = !any;
      });
      document.querySelectorAll('.test-group').forEach(function (group) {
        var any = group.querySelector('[data-search]:not([hidden])');
        group.hidden = !any;
      });
      if (countEl) countEl.textContent = 'Showing ' + shown + ' of ' + total;
      try { localStorage.setItem(FILTER_KEY, JSON.stringify(state)); } catch (e) {}
      window.__DASHBOARD_FILTER_STATE__ = state;
    }

    try {
      var savedF = JSON.parse(localStorage.getItem(FILTER_KEY) || 'null');
      if (savedF) {
        if (searchEl && savedF.q) searchEl.value = savedF.q;
        if (statusEl && savedF.status) statusEl.value = savedF.status;
        if (priorityEl && savedF.priority) priorityEl.value = savedF.priority;
        if (roleEl && savedF.role) roleEl.value = savedF.role;
        if (evidenceEl) evidenceEl.checked = !!savedF.evidence;
      }
    } catch (e) {}

    ['input','change'].forEach(function (evt) {
      [searchEl, statusEl, priorityEl, roleEl, evidenceEl].forEach(function (el) {
        if (el) el.addEventListener(evt, applyFilters);
      });
    });
    applyFilters();

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && e.target && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        if (searchEl) searchEl.focus();
      }
    });

    /* ---- Copy failure packet ---- */
        document.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('[data-copy-packet]') : null;
          if (!btn) return;
          var packet = btn.getAttribute('data-copy-packet') || '';
          try {
            navigator.clipboard.writeText(packet).then(function () {
              var orig = btn.textContent;
              btn.textContent = 'Copied';
              setTimeout(function () { btn.textContent = orig; }, 1500);
            });
          } catch (err) {
            /* ignore */
          }
        });

        /* ---- Native-like step filter (per test card)
         * Critical: .tree-item { display:flex } overrides UA [hidden].
         * Always toggle class .tree-item--filtered-out + CSS display:none !important.
         */
        function setTreeItemVisible(item, show) {
          if (!item) return;
          if (show) {
            item.hidden = false;
            item.removeAttribute('hidden');
            if (item.style) item.style.display = '';
            item.classList.remove('tree-item--filtered-out');
          } else {
            item.hidden = true;
            item.setAttribute('hidden', '');
            if (item.style) item.style.display = 'none';
            item.classList.add('tree-item--filtered-out');
          }
        }

        function directChildrenRoot(item) {
          if (!item || !item.children) return null;
          var body = null;
          for (var c = 0; c < item.children.length; c++) {
            var ch = item.children[c];
            if (ch.classList && ch.classList.contains('tree-item__body')) {
              body = ch;
              break;
            }
          }
          if (!body) return null;
          for (var k = 0; k < body.children.length; k++) {
            var g = body.children[k];
            if (g.classList && g.classList.contains('tree-item__children')) return g;
          }
          return null;
        }

        function applyStepFilter(input) {
          if (!input || !input.closest) return;
          var panel = input.closest('[data-steps-panel], .steps-panel, .chip-body--steps, .detail-chip');
          if (!panel) return;
          var tree = panel.querySelector('.steps-tree') || panel.querySelector('.tree-item-list');
          if (!tree) return;
          var emptyEl = panel.querySelector('[data-step-filter-empty]');

          var q = String(input.value || '').trim().toLowerCase();
          var items = Array.prototype.slice.call(tree.querySelectorAll('.tree-item'));

          if (!q) {
            items.forEach(function (item) { setTreeItemVisible(item, true); });
            if (emptyEl) {
              emptyEl.hidden = true;
              emptyEl.setAttribute('hidden', '');
            }
            return;
          }

          var selfHits = new Map();
          items.forEach(function (item) {
            var title = (item.getAttribute('data-step-title') || '').toLowerCase();
            if (!title) {
              var labelEl = item.querySelector('.tree-item__label');
              title = labelEl ? String(labelEl.textContent || '').toLowerCase() : '';
            }
            selfHits.set(item, title.indexOf(q) !== -1);
          });

          // Bottom-up: keep parent if any direct child remains visible.
          var visibleCount = 0;
          items.slice().reverse().forEach(function (item) {
            var selfMatch = !!selfHits.get(item);
            var childVisible = false;
            var kidsRoot = directChildrenRoot(item);
            if (kidsRoot) {
              for (var i = 0; i < kidsRoot.children.length; i++) {
                var child = kidsRoot.children[i];
                if (!child.classList || !child.classList.contains('tree-item')) continue;
                if (!child.classList.contains('tree-item--filtered-out')) {
                  childVisible = true;
                  break;
                }
              }
            }
            var show = selfMatch || childVisible;
            setTreeItemVisible(item, show);
            if (show) visibleCount += 1;
            if (show && childVisible && item.tagName === 'DETAILS') item.open = true;
          });

          if (emptyEl) {
            if (visibleCount === 0) {
              emptyEl.hidden = false;
              emptyEl.removeAttribute('hidden');
            } else {
              emptyEl.hidden = true;
              emptyEl.setAttribute('hidden', '');
            }
          }
        }

        function isStepFilterInput(t) {
          return !!(t && t.nodeType === 1 && t.matches && t.matches('[data-step-filter], .step-filter__input'));
        }

        document.addEventListener('input', function (e) {
          if (isStepFilterInput(e.target)) applyStepFilter(e.target);
        });
        // type=search fires "search" on clear (×) in Chromium
        document.addEventListener('search', function (e) {
          if (isStepFilterInput(e.target)) applyStepFilter(e.target);
        });
        document.addEventListener('keyup', function (e) {
          if (isStepFilterInput(e.target)) applyStepFilter(e.target);
        });
        document.addEventListener('submit', function (e) {
          var form = e.target;
          if (form && form.classList && form.classList.contains('step-filter')) {
            e.preventDefault();
          }
        });
      })();
      </script>`;
}

export type { CollectedStep, CollectedTestData, TestSummary };

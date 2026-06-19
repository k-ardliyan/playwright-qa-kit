import path from 'node:path';
import { JIRA_CONSTANTS } from '@/utils/configuration';
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

function applyDescriptionTemplate(template: string, testData: CollectedTestData): string {
  return template
    .replaceAll('{title}', testData.fullTitle)
    .replaceAll('{file}', testData.filePath)
    .replaceAll('{error}', testData.errorMessage || 'Unknown Playwright error');
}

export function buildJiraUrl(testData: CollectedTestData): string {
  const domain = JIRA_CONSTANTS.domain.replace(/\/$/, '');
  const summary = encodeURIComponent(`[E2E-FAIL] ${testData.fullTitle}`);
  const description = encodeURIComponent(
    applyDescriptionTemplate(JIRA_CONSTANTS.descriptionTemplate, testData),
  );

  return `${domain}/secure/CreateIssueDetails!init.jspa?project=${encodeURIComponent(
    JIRA_CONSTANTS.projectKey,
  )}&issuetype=${encodeURIComponent(JIRA_CONSTANTS.bugIssueTypeId)}&summary=${summary}&description=${description}`;
}

export function renderJiraButton(testData: CollectedTestData): string {
  return `<a class="btn btn--primary" href="${buildJiraUrl(testData)}" target="_blank" rel="noopener">Create JIRA</a>`;
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
    .map((error) => {
      const text = [error.message, error.stack]
        .filter((part) => part && part.trim().length > 0)
        .filter((part, index, parts) => index === 0 || !parts[0]?.includes(part ?? ''))
        .join('\n\n');

      return `<pre class="error-block">${escapeHtml(text)}</pre>`;
    })
    .join('');
}

function stepHasFailedDescendant(step: CollectedStep): boolean {
  if (step.status === 'failed') {
    return true;
  }

  return step.steps.some(stepHasFailedDescendant);
}

function renderStepTree(steps: CollectedStep[], level = 0): string {
  if (steps.length === 0) {
    return '';
  }

  return steps
    .map((step) => {
      const failed = step.status === 'failed';
      const icon = failed ? '✕' : '✓';
      const header = `
        <span class="steps-timeline__icon">${icon}</span>
        <span class="steps-timeline__title">${escapeHtml(step.title)}</span>
        <span class="steps-timeline__duration">${step.duration}ms</span>
      `;
      const errorBlock = step.errorMessage
        ? `<pre class="step-error">${escapeHtml(step.errorMessage)}</pre>`
        : '';

      if (step.steps.length === 0) {
        return `
          <div class="steps-timeline__item${failed ? ' steps-timeline__item--failed' : ''}">
            <div class="steps-timeline__header">${header}</div>
            ${errorBlock}
          </div>
        `;
      }

      const shouldOpen = failed || stepHasFailedDescendant(step);
      const openAttr = shouldOpen ? ' open' : '';
      const nestedClass = level > 0 ? ` step-details--nested-${Math.min(level, 3)}` : '';

      return `
        <details class="step-details${failed ? ' step-details--failed' : ''}${nestedClass}"${openAttr}>
          <summary class="steps-timeline__header">${header}</summary>
          <div class="step-details__body">
            ${errorBlock}
            <div class="steps-timeline__nested">${renderStepTree(step.steps, level + 1)}</div>
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

  return `<div class="steps-timeline">${renderStepTree(steps)}</div>`;
}

function renderScreenshotAttachment(attachment: CollectedAttachment): string {
  return `
    <figure class="attachment-card attachment-card--screenshot">
      <img src="${escapeHtml(attachment.relativePath)}" alt="${escapeHtml(attachment.name)}" loading="lazy" />
      <figcaption>${escapeHtml(attachment.name)}</figcaption>
    </figure>
  `;
}

function renderVideoAttachment(attachment: CollectedAttachment): string {
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
  return `
    <a class="attachment-chip attachment-chip--trace" href="${escapeHtml(attachment.relativePath)}" target="_blank" rel="noopener">
      Trace · ${escapeHtml(attachment.name)}
    </a>
  `;
}

function renderOtherAttachment(attachment: CollectedAttachment): string {
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

function getVerdict(summary: TestSummary): {
  label: string;
  tone: 'healthy' | 'warning' | 'critical';
  summaryLine: string;
} {
  if (summary.failed > 0) {
    return {
      label: 'Run failed',
      tone: 'critical',
      summaryLine: `${summary.failed} unhealthy test${summary.failed === 1 ? '' : 's'} need triage.`,
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

function countAttachmentsByKind(
  tests: CollectedTestData[],
  kind: CollectedAttachment['kind'],
): number {
  return tests.reduce(
    (count, testData) =>
      count + testData.attachments.filter((attachment) => attachment.kind === kind).length,
    0,
  );
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

  return `
    <header class="hero hero--${verdict.tone}">
      <div class="hero__copy">
        <span class="hero__eyebrow">${mode === 'ci' ? 'CI execution report' : 'Local execution report'}</span>
        <h1 class="hero__title">${verdict.label}</h1>
        <p class="hero__subtitle">${verdict.summaryLine}</p>
      </div>
      <div class="hero__meta">
        <div class="hero__top-row">
          <span class="badge ${mode === 'ci' ? 'badge--ci' : 'badge--local'}">${mode === 'ci' ? 'CI mode' : 'Local mode'}</span>
          <button class="theme-toggle" id="themeToggle" type="button" aria-label="Switch to dark mode" aria-pressed="false">
            <span class="theme-toggle__icon" aria-hidden="true">☀</span>
            <span class="theme-toggle__label">Light</span>
          </button>
        </div>
        <div class="hero__meta-grid">
          <div>
            <span class="hero__meta-label">Generated</span>
            <strong>${escapeHtml(summary.timestamp)}</strong>
          </div>
          <div>
            <span class="hero__meta-label">Tests</span>
            <strong>${summary.total}</strong>
          </div>
          <div>
            <span class="hero__meta-label">Unhealthy</span>
            <strong>${unhealthyCount}</strong>
          </div>
        </div>
      </div>
    </header>
  `;
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

export function renderRunHealthPanel(): string {
  return `
    <section class="panel panel--rail panel--chart">
      <div class="panel__eyebrow">Run health</div>
      <h2 class="panel__title">Status distribution</h2>
      <div class="chart-wrap">
        <canvas id="resultDonut"></canvas>
      </div>
    </section>
  `;
}

export function renderOpsSummaryPanel(
  mode: 'local' | 'ci',
  summary: TestSummary,
  collectedTests: CollectedTestData[],
): string {
  const unhealthyCount = collectedTests.filter((testData) =>
    UNHEALTHY_STATUSES.has(testData.status),
  ).length;
  const retryCount = collectedTests.filter((testData) => testData.retry > 0).length;
  const traceCount = countAttachmentsByKind(collectedTests, 'trace');
  const screenshotCount = countAttachmentsByKind(collectedTests, 'screenshot');
  const videoCount = countAttachmentsByKind(collectedTests, 'video');

  return `
    <section class="panel panel--rail">
      <div class="panel__eyebrow">Ops summary</div>
      <h2 class="panel__title">${mode === 'ci' ? 'Pipeline posture' : 'Run posture'}</h2>
      <dl class="summary-list">
        <div><dt>Mode</dt><dd>${mode === 'ci' ? 'Continuous integration' : 'Local verification'}</dd></div>
        <div><dt>Unhealthy</dt><dd>${unhealthyCount}</dd></div>
        <div><dt>Retries</dt><dd>${retryCount}</dd></div>
        <div><dt>Traces</dt><dd>${traceCount}</dd></div>
        <div><dt>Screenshots</dt><dd>${screenshotCount}</dd></div>
        <div><dt>Videos</dt><dd>${videoCount}</dd></div>
      </dl>
    </section>
  `;
}

export function renderLegendPanel(): string {
  return `
    <section class="panel panel--rail">
      <div class="panel__eyebrow">Scan guide</div>
      <h2 class="panel__title">Priority legend</h2>
      <ul class="legend-list">
        <li><span class="legend-swatch legend-swatch--failed"></span><div><strong>Unhealthy</strong><span>Failed, timed out, or interrupted. Review first.</span></div></li>
        <li><span class="legend-swatch legend-swatch--passed"></span><div><strong>Passed</strong><span>Execution succeeded. Keep collapsed unless auditing.</span></div></li>
        <li><span class="legend-swatch legend-swatch--skipped"></span><div><strong>Skipped</strong><span>Coverage gap. Verify intent before closing run.</span></div></li>
      </ul>
    </section>
  `;
}

export function renderDeepLinksPanel(): string {
  return `
    <section class="panel panel--rail">
      <div class="panel__eyebrow">Deep links</div>
      <h2 class="panel__title">Related reports</h2>
      <ul class="deep-links">
        <li>
          <a class="deep-link" href="html/index.html" target="_blank" rel="noopener">
            <span class="deep-link__title">Playwright HTML report</span>
            <span class="deep-link__copy">Trace viewer, search, and per-test drill-down from the official Playwright UI.</span>
            <span class="deep-link__path">reports/html/index.html</span>
          </a>
        </li>
        <li>
          <a class="deep-link" href="test-summary.json" target="_blank" rel="noopener">
            <span class="deep-link__title">Test summary JSON</span>
            <span class="deep-link__copy">Machine-readable counts for CI checks and dashboards.</span>
            <span class="deep-link__path">reports/test-summary.json</span>
          </a>
        </li>
        <li>
          <a class="deep-link" href="html/data" target="_blank" rel="noopener">
            <span class="deep-link__title">Raw report data</span>
            <span class="deep-link__copy">Attachments folder for screenshots, videos, and traces.</span>
            <span class="deep-link__path">reports/html/data</span>
          </a>
        </li>
      </ul>
    </section>
  `;
}

export function renderFailureAlert(unhealthyCount: number): string {
  if (unhealthyCount === 0) {
    return `
      <div class="alert alert--success">
        <strong>Queue clear.</strong> No unhealthy tests were captured in this run.
      </div>
    `;
  }

  return `
    <div class="alert alert--warning">
      <strong>Incident queue active.</strong> ${unhealthyCount} unhealthy test${unhealthyCount === 1 ? '' : 's'} surfaced in this run.
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
        const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        const palette = {
          light: {
            data: ['#22c55e', '#e11d48', '#d97706'],
            hover: ['#16a34a', '#be123c', '#b45309'],
            border: '#ffffff',
            legend: '#475569',
          },
          dark: {
            data: ['#4ade80', '#fb7185', '#f59e0b'],
            hover: ['#22c55e', '#f43f5e', '#d97706'],
            border: '#0f172a',
            legend: '#9fb2cf',
          },
        }[theme];

        const existing = window.Chart && window.Chart.getChart ? window.Chart.getChart('resultDonut') : null;
        if (existing) existing.destroy();

        new Chart(document.getElementById('resultDonut'), {
          type: 'doughnut',
          data: {
            labels: ['Passed', 'Failed', 'Skipped'],
            datasets: [{
              data: [chartData.passed, chartData.failed, chartData.skipped],
              backgroundColor: palette.data,
              hoverBackgroundColor: palette.hover,
              borderColor: palette.border,
              borderWidth: 6
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  ${includeChart ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
  <style>${getDashboardStyles()}</style>
</head>
<body>
  <div class="page-shell">
    <div class="page-backdrop"></div>
    <main class="page">
      ${renderHero(mode, summary, collectedTests)}
      ${renderStatGrid(summary)}
      ${body}
    </main>
  </div>
  ${themeScript}
  ${chartScript}
</body>
</html>`;
}

export type { CollectedStep, CollectedTestData, TestSummary };

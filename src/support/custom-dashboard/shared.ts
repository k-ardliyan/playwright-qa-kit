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
    return '<span class="muted">—</span>';
  }

  return `<a class="btn btn--ghost" href="${escapeHtml(trace.relativePath)}" target="_blank" rel="noopener">View Trace</a>`;
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
      const icon = step.status === 'failed' ? '❌' : '✅';
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
          <div class="steps-timeline__item steps-timeline__item--leaf">
            <div class="steps-timeline__header">${header}</div>
            ${errorBlock}
          </div>
        `;
      }

      const shouldOpen = step.status === 'failed' || stepHasFailedDescendant(step);
      const openAttr = shouldOpen ? ' open' : '';
      const nestedClass = level > 0 ? ` step-details--nested-${Math.min(level, 3)}` : '';

      return `
        <details class="step-details${nestedClass}"${openAttr}>
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
      Trace: ${escapeHtml(attachment.name)}
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
  const cls =
    status === 'passed'
      ? 'status-pill--passed'
      : status === 'skipped'
        ? 'status-pill--skipped'
        : 'status-pill--failed';
  return `<span class="status-pill ${cls}">${safe}</span>`;
}

export function renderStatGrid(summary: TestSummary): string {
  return `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-card__label">Total</div><div class="stat-card__value">${summary.total}</div></div>
      <div class="stat-card stat-card--passed"><div class="stat-card__label">Passed</div><div class="stat-card__value">${summary.passed}</div></div>
      <div class="stat-card stat-card--failed"><div class="stat-card__label">Failed</div><div class="stat-card__value">${summary.failed}</div></div>
      <div class="stat-card stat-card--skipped"><div class="stat-card__label">Skipped</div><div class="stat-card__value">${summary.skipped}</div></div>
      <div class="stat-card"><div class="stat-card__label">Pass rate</div><div class="stat-card__value">${summary.passRate}%</div></div>
    </div>
  `;
}

export function renderDonutPanel(): string {
  return `
    <div class="panel">
      <h2 class="panel__title">Run Health</h2>
      <div class="chart-wrap">
        <canvas id="resultDonut"></canvas>
      </div>
    </div>
  `;
}

export function renderChartScript(summary: TestSummary): string {
  return `
    <script>
      const chartData = {
        passed: ${summary.passed},
        failed: ${summary.failed},
        skipped: ${summary.skipped},
        passRate: ${summary.passRate}
      };

      const centerTextPlugin = {
        id: 'centerText',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);
          if (!meta || !meta.data || !meta.data[0]) return;
          const x = meta.data[0].x;
          const y = meta.data[0].y;

          ctx.save();
          ctx.font = 'bold 24px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(chartData.passRate + '%', x, y);
          ctx.restore();
        }
      };

      new Chart(document.getElementById('resultDonut'), {
        type: 'doughnut',
        data: {
          labels: ['Passed', 'Failed', 'Skipped'],
          datasets: [{
            data: [chartData.passed, chartData.failed, chartData.skipped],
            backgroundColor: ['#059669', '#dc2626', '#d97706'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
          }
        },
        plugins: [centerTextPlugin]
      });
    </script>
  `;
}

export function renderDocumentShell(options: {
  pageTitle: string;
  mode: 'local' | 'ci';
  summary: TestSummary;
  body: string;
  includeChart: boolean;
}): string {
  const { pageTitle, mode, summary, body, includeChart } = options;
  const chartScript = includeChart ? renderChartScript(summary) : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  ${includeChart ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
  <style>${getDashboardStyles()}</style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <div>
        <h1 class="hero__title">Playwright QA Kit</h1>
        <p class="hero__subtitle">Generated at ${escapeHtml(summary.timestamp)}</p>
      </div>
      <span class="badge ${mode === 'ci' ? 'badge--ci' : 'badge--local'}">${mode === 'ci' ? 'CI' : 'Local'}</span>
    </header>

    ${renderStatGrid(summary)}

    ${body}
  </div>
  ${chartScript}
</body>
</html>`;
}

export type { CollectedStep, CollectedTestData, TestSummary };

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';
import { JIRA_CONSTANTS } from '@/utils/configuration';
import { logger } from '@/utils/logger';

type StepStatus = 'passed' | 'failed';

interface CollectedStep {
  title: string;
  status: StepStatus;
  duration: number;
  steps: CollectedStep[];
}

interface CollectedTestData {
  title: string;
  fullTitle: string;
  filePath: string;
  status: TestResult['status'];
  duration: number;
  errorMessage: string;
  steps: CollectedStep[];
  traceFile?: string;
  retry: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  timestamp: string;
}

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const DASHBOARD_PATH = path.join(REPORT_DIR, 'custom-dashboard.html');
const SUMMARY_PATH = path.join(REPORT_DIR, 'test-summary.json');

function collectSteps(steps: TestStep[]): CollectedStep[] {
  return steps.map((step) => ({
    title: step.title,
    status: step.error ? 'failed' : 'passed',
    duration: step.duration,
    steps: collectSteps(step.steps ?? []),
  }));
}

function findTraceFile(result: TestResult): string | undefined {
  const traceAttachment = result.attachments.find(
    (attachment) => attachment.path && attachment.name.toLowerCase().includes('trace'),
  );

  return traceAttachment?.path;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderStepsAsList(steps: CollectedStep[]): string {
  if (steps.length === 0) {
    return '<li>No recorded test.step() entries</li>';
  }

  return steps
    .map((step) => {
      const icon = step.status === 'failed' ? '❌' : '✅';
      const nested = step.steps.length > 0 ? `<ul>${renderStepsAsList(step.steps)}</ul>` : '';
      return `<li>${icon} ${escapeHtml(step.title)} <small>(${step.duration}ms)</small>${nested}</li>`;
    })
    .join('');
}

function flattenSteps(steps: CollectedStep[], level = 0): Array<CollectedStep & { level: number }> {
  const rows: Array<CollectedStep & { level: number }> = [];

  for (const step of steps) {
    rows.push({ ...step, level });
    if (step.steps.length > 0) {
      rows.push(...flattenSteps(step.steps, level + 1));
    }
  }

  return rows;
}

function applyDescriptionTemplate(template: string, testData: CollectedTestData): string {
  return template
    .replaceAll('{title}', testData.fullTitle)
    .replaceAll('{file}', testData.filePath)
    .replaceAll('{error}', testData.errorMessage || 'Unknown Playwright error');
}

function buildJiraUrl(testData: CollectedTestData): string {
  const domain = JIRA_CONSTANTS.domain.replace(/\/$/, '');
  const summary = encodeURIComponent(`[E2E-FAIL] ${testData.fullTitle}`);
  const description = encodeURIComponent(
    applyDescriptionTemplate(JIRA_CONSTANTS.descriptionTemplate, testData),
  );

  return `${domain}/secure/CreateIssueDetails!init.jspa?project=${encodeURIComponent(
    JIRA_CONSTANTS.projectKey,
  )}&issuetype=${encodeURIComponent(JIRA_CONSTANTS.bugIssueTypeId)}&summary=${summary}&description=${description}`;
}

function ensureReportDirectory(): void {
  try {
    fs.mkdirSync(REPORT_DIR);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'EEXIST') {
      throw error;
    }
  }
}

function renderTraceLink(testData: CollectedTestData): string {
  if (!testData.traceFile) {
    return '-';
  }

  const relativeTracePath = path.relative(process.cwd(), testData.traceFile);
  return `<a href="${escapeHtml(relativeTracePath)}" target="_blank">📊 View Trace</a>`;
}

function buildLocalHtml(summary: TestSummary, failedTests: CollectedTestData[]): string {
  const failedRows = failedTests
    .map((testData, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(testData.fullTitle)}</td>
          <td><code>${escapeHtml(testData.filePath)}</code></td>
          <td>${testData.duration}ms</td>
          <td><a href="${buildJiraUrl(testData)}" target="_blank">Create JIRA</a></td>
          <td>${renderTraceLink(testData)}</td>
        </tr>
        <tr>
          <td></td>
          <td colspan="5">
            <details>
              <summary>View error and test steps</summary>
              <p><strong>Error</strong></p>
              <pre>${escapeHtml(testData.errorMessage || 'Unknown Playwright error')}</pre>
              <p><strong>Steps</strong></p>
              <ul>${renderStepsAsList(testData.steps)}</ul>
            </details>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Playwright Custom Dashboard (Local)</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    .cards { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fff; }
    .layout { display: grid; grid-template-columns: minmax(260px, 320px) 1fr; gap: 20px; align-items: start; }
    .panel { border: 1px solid #ddd; border-radius: 10px; padding: 16px; background: #fff; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #e2e2e2; padding: 8px; vertical-align: top; }
    th { background: #f6f6f6; text-align: left; }
    pre { white-space: pre-wrap; margin: 0; }
    code { font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <h1>Playwright Custom Dashboard</h1>
  <p>Generated at: ${summary.timestamp}</p>

  <div class="cards">
    <div class="card"><strong>Total</strong><div>${summary.total}</div></div>
    <div class="card"><strong>Passed</strong><div>${summary.passed}</div></div>
    <div class="card"><strong>Failed</strong><div>${summary.failed}</div></div>
    <div class="card"><strong>Skipped</strong><div>${summary.skipped}</div></div>
    <div class="card"><strong>Pass rate</strong><div>${summary.passRate}%</div></div>
  </div>

  <div class="layout">
    <div class="panel">
      <h2>Run Health</h2>
      <canvas id="resultDonut" width="280" height="280"></canvas>
    </div>

    <div class="panel">
      <h2>Failures</h2>
      ${
        failedTests.length === 0
          ? '<p>No failing tests recorded.</p>'
          : `
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Test</th>
                  <th>File</th>
                  <th>Duration</th>
                  <th>JIRA</th>
                  <th>Trace</th>
                </tr>
              </thead>
              <tbody>
                ${failedRows}
              </tbody>
            </table>
          `
      }
    </div>
  </div>

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
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#111';
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
          backgroundColor: ['#10B981', '#EF4444', '#F59E0B']
        }]
      },
      options: {
        responsive: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom' }
        }
      },
      plugins: [centerTextPlugin]
    });
  </script>
</body>
</html>
`;
}

function buildCiHtml(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  const failedTests = collectedTests.filter((testData) =>
    ['failed', 'timedOut', 'interrupted'].includes(testData.status),
  );

  const rows = collectedTests
    .map((testData, index) => {
      const stack = testData.errorMessage || '-';
      const flattenedSteps = flattenSteps(testData.steps)
        .map((step) => {
          const icon = step.status === 'failed' ? '❌' : '✅';
          const indentation = '&nbsp;'.repeat(step.level * 4);
          return `<tr><td>${indentation}${icon} ${escapeHtml(step.title)}</td><td>${step.duration}ms</td></tr>`;
        })
        .join('');

      return `
        <section class="test-block">
          <h3>${index + 1}. ${escapeHtml(testData.fullTitle)}</h3>
          <table class="meta-table">
            <tr><th>Status</th><td>${escapeHtml(String(testData.status))}</td></tr>
            <tr><th>File</th><td><code>${escapeHtml(testData.filePath)}</code></td></tr>
            <tr><th>Duration</th><td>${testData.duration}ms</td></tr>
            <tr><th>Retry</th><td>${testData.retry}</td></tr>
            <tr><th>JIRA</th><td><a href="${buildJiraUrl(testData)}" target="_blank">Create JIRA</a></td></tr>
            <tr><th>Trace</th><td>${renderTraceLink(testData)}</td></tr>
          </table>

          <h4>Stack Trace / Error Details</h4>
          <pre>${escapeHtml(stack)}</pre>

          <h4>Step Timings</h4>
          <table class="steps-table">
            <thead><tr><th>Step</th><th>Duration</th></tr></thead>
            <tbody>${flattenedSteps || '<tr><td colspan="2">No recorded test.step() entries</td></tr>'}</tbody>
          </table>
        </section>
      `;
    })
    .join('');

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Playwright Custom Dashboard (CI Detailed)</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    .summary { border: 1px solid #ddd; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 12px; }
    .cell { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
    .test-block { border: 1px solid #ddd; border-radius: 8px; padding: 14px; margin-top: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #e2e2e2; padding: 8px; vertical-align: top; }
    th { background: #f6f6f6; text-align: left; width: 180px; }
    pre { white-space: pre-wrap; background: #fafafa; border: 1px solid #eee; padding: 8px; }
    code { font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <h1>Playwright Custom Dashboard (CI Detailed)</h1>
  <p>Generated at: ${summary.timestamp}</p>

  <div class="summary">
    <p><strong>Mode:</strong> CI</p>
    <p><strong>Total Tests:</strong> ${summary.total}</p>
    <p><strong>Failed Tests:</strong> ${summary.failed}</p>
    <div class="grid">
      <div class="cell"><strong>Total</strong><div>${summary.total}</div></div>
      <div class="cell"><strong>Passed</strong><div>${summary.passed}</div></div>
      <div class="cell"><strong>Failed</strong><div>${summary.failed}</div></div>
      <div class="cell"><strong>Skipped</strong><div>${summary.skipped}</div></div>
      <div class="cell"><strong>Pass rate</strong><div>${summary.passRate}%</div></div>
    </div>
  </div>

  <h2>Detailed Test Records</h2>
  ${rows || '<p>No test records were captured.</p>'}

  <h2>Unhealthy Cases</h2>
  <p>${failedTests.length} failing/timed out/interrupted test(s) detected.</p>
</body>
</html>
`;
}

export default class CustomReporter implements Reporter {
  private totalTests = 0;
  private passedTests = 0;
  private failedTests = 0;
  private skippedTests = 0;
  private collectedTests: CollectedTestData[] = [];

  onBegin(_config: FullConfig, suite: Suite): void {
    this.totalTests = suite.allTests().length;
    logger.info('Custom reporter started.', { totalTests: this.totalTests });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed') {
      this.passedTests += 1;
    } else if (result.status === 'skipped') {
      this.skippedTests += 1;
    } else {
      this.failedTests += 1;
    }

    const errorMessage = result.errors
      .map((error) => {
        const messagePart = error.message ?? '';
        const valuePart = error.value ? String(error.value) : '';
        const stackPart = error.stack ?? '';
        return [messagePart, valuePart, stackPart]
          .filter((part) => part.trim().length > 0)
          .join('\n');
      })
      .filter((message) => message.trim().length > 0)
      .join('\n\n');

    const filePath = path.relative(process.cwd(), test.location.file);
    const fullTitle = test.titlePath().join(' > ');

    this.collectedTests.push({
      title: test.title,
      fullTitle,
      filePath,
      status: result.status,
      duration: result.duration,
      errorMessage,
      steps: collectSteps(result.steps ?? []),
      traceFile: findTraceFile(result),
      retry: result.retry,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    const isCiMode = process.env.CI === 'true';

    try {
      ensureReportDirectory();

      const summary: TestSummary = {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        skipped: this.skippedTests,
        passRate: this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0,
        timestamp: new Date().toISOString(),
      };

      const failedTests = this.collectedTests.filter((testData) =>
        ['failed', 'timedOut', 'interrupted'].includes(testData.status),
      );

      const html = isCiMode
        ? buildCiHtml(summary, this.collectedTests)
        : buildLocalHtml(summary, failedTests);

      fs.writeFileSync(DASHBOARD_PATH, html, 'utf-8');
      fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf-8');

      logger.info('Custom reports generated.', {
        mode: isCiMode ? 'ci' : 'local',
        dashboard: path.relative(process.cwd(), DASHBOARD_PATH),
        summary: path.relative(process.cwd(), SUMMARY_PATH),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to generate custom reporter output.', {
        mode: isCiMode ? 'ci' : 'local',
        message,
      });

      if (isCiMode) {
        process.exitCode = 1;
        throw error;
      }
    }
  }
}

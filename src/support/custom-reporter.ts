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
import { buildCiHtml } from './custom-dashboard/build-ci-html';
import { buildLocalHtml } from './custom-dashboard/build-local-html';
import type {
  AffectedLayer,
  AttachmentKind,
  CollectedAttachment,
  CollectedError,
  CollectedStep,
  CollectedTestCase,
  CollectedTestData,
  Priority,
  ReportMode,
  TestSummary,
} from './custom-dashboard/types';
import { toReportRelativePath } from './custom-dashboard/shared';
import { logger } from '@/utils/logger';

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const DASHBOARD_PATH = path.join(REPORT_DIR, 'custom-dashboard.html');
const SUMMARY_PATH = path.join(REPORT_DIR, 'test-summary.json');
const HTML_REPORT_DIR = path.join(REPORT_DIR, 'html');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');

/** Copy screenshots to reports/screenshots/ and rewrite relativePath to screenshots/<filename>. */
function copyScreenshotsToReportDir(tests: CollectedTestData[]): void {
  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
    for (const test of tests) {
      for (const attachment of test.attachments) {
        if (attachment.kind !== 'screenshot') continue;
        const absPath = path.resolve(REPORT_DIR, attachment.relativePath.replace(/\//g, path.sep));
        if (!fs.existsSync(absPath)) continue;
        const destName = path.basename(absPath);
        // Add test prefix to avoid name collisions across tests
        const safePrefix = (test.testId || test.title).replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 40);
        const uniqueDest = path.join(SCREENSHOTS_DIR, `${safePrefix}__${destName}`);
        fs.copyFileSync(absPath, uniqueDest);
        // Rewrite relativePath to point inside reports/screenshots/ (same folder as dashboard)
        attachment.relativePath = `screenshots/${safePrefix}__${destName}`;
      }
    }
  } catch (err) {
    logger.warn('Failed to copy screenshots to reports/screenshots/', { err: String(err) });
  }
}

// ---------------------------------------------------------------------------
// Annotation extraction helpers
// ---------------------------------------------------------------------------

function getAnnotation(test: TestCase, type: string): string {
  return (test.annotations ?? []).find((a) => a.type === type)?.description ?? '';
}

function safeParseJson<T>(raw: string, fallback: T): T {
  if (!raw || raw.trim() === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Derive a testId from the test title when the annotation is absent.
 * Matches the pattern "TC-LOGIN-001: ..." or "TC-AUTH-EXT-002: ..."
 */
function deriveTestId(title: string): string {
  return title.match(/^(TC-[A-Z0-9-]+)/)?.[1] ?? '';
}

// ---------------------------------------------------------------------------
// Existing helpers
// ---------------------------------------------------------------------------

function collectSteps(steps: TestStep[]): CollectedStep[] {
  return steps.map((step) => ({
    title: step.title,
    status: step.error ? 'failed' : 'passed',
    duration: step.duration,
    errorMessage: step.error?.message,
    steps: collectSteps(step.steps ?? []),
  }));
}

function collectErrors(result: TestResult): CollectedError[] {
  const errors: CollectedError[] = [];

  for (const error of result.errors) {
    const messagePart = error.message ?? '';
    const valuePart = error.value ? String(error.value) : '';
    const message = [messagePart, valuePart].filter((part) => part.trim().length > 0).join('\n');
    const stack = error.stack?.trim() || undefined;

    if (message.trim().length === 0 && !stack) {
      continue;
    }

    errors.push({
      message: message.trim() || stack || 'Unknown Playwright error',
      stack,
    });
  }

  return errors;
}

/** Strip ANSI terminal escape codes (color/dim/bold sequences). */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function formatErrorMessage(errors: CollectedError[]): string {
  const seen = new Set<string>();
  return errors
    .map((error) => {
      const parts = [error.message];
      if (error.stack && !error.message.includes(error.stack)) {
        parts.push(error.stack);
      }
      return stripAnsi(parts.filter((part) => part.trim().length > 0).join('\n'));
    })
    .filter((message) => {
      if (!message.trim() || seen.has(message)) return false;
      seen.add(message);
      return true;
    })
    .join('\n\n');
}

function classifyAttachment(name: string, contentType?: string): AttachmentKind {
  const normalizedName = name.toLowerCase();
  const normalizedType = (contentType ?? '').toLowerCase();

  if (normalizedName.includes('trace')) {
    return 'trace';
  }
  if (normalizedName.includes('screenshot') || normalizedType.startsWith('image/')) {
    return 'screenshot';
  }
  if (normalizedName.includes('video') || normalizedType.startsWith('video/')) {
    return 'video';
  }

  return 'other';
}

function collectAttachments(result: TestResult): CollectedAttachment[] {
  const attachments: CollectedAttachment[] = [];

  for (const attachment of result.attachments) {
    if (!attachment.path) {
      continue;
    }

    attachments.push({
      name: attachment.name,
      contentType: attachment.contentType,
      relativePath: toReportRelativePath(attachment.path),
      kind: classifyAttachment(attachment.name, attachment.contentType),
    });
  }

  return attachments;
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

const HTML_THEME_OVERRIDE_STYLE = `
<style data-dashboard-theme-override="light">
  :root:not(.dark-mode):not(.light-mode) { color-scheme: light; }
  :root { color-scheme: light; }
</style>
<script data-dashboard-theme-override="light">
  (function () {
    function forceLight() {
      try {
        var root = document.documentElement;
        var meta = document.querySelector("meta[name='color-scheme']");
        if (meta) meta.setAttribute('content', 'light');
        if (root.classList.contains('dark-mode')) {
          root.classList.remove('dark-mode');
          root.classList.add('light-mode');
        }
        try { localStorage.setItem('playwright-report-theme', 'light'); } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }
    }
    forceLight();
    document.addEventListener('DOMContentLoaded', forceLight);
    new MutationObserver(forceLight).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  })();
</script>
`;

function forcePlaywrightHtmlToLight(htmlFolder: string): void {
  const indexPath = path.join(htmlFolder, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return;
  }

  let content = fs.readFileSync(indexPath, 'utf-8');
  if (content.includes('data-dashboard-theme-override="light"')) {
    return;
  }

  const injection = `    ${HTML_THEME_OVERRIDE_STYLE.trim()}\n`;
  const headCloseIdx = content.indexOf('</head>');
  if (headCloseIdx === -1) {
    return;
  }

  content = content.slice(0, headCloseIdx) + injection + content.slice(headCloseIdx);
  fs.writeFileSync(indexPath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Reporter class
// ---------------------------------------------------------------------------

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

    const errors = collectErrors(result);
    const errorMessage = formatErrorMessage(errors);
    const filePath = path.relative(process.cwd(), test.location.file);
    const fullTitle = test.titlePath().join(' > ');
    const attachments = collectAttachments(result);

    // ----- Table View metadata from test.info().annotations -----
    const testId = getAnnotation(test, 'testId') || deriveTestId(test.title);
    const scenarioId = getAnnotation(test, 'scenarioId');
    const role = getAnnotation(test, 'role');
    const priority = (getAnnotation(test, 'priority') as Priority) || 'medium';
    const inputData = safeParseJson<Record<string, string>>(getAnnotation(test, 'inputData'), {});
    const expectedResult = getAnnotation(test, 'expectedResult');
    const affectedLayer = safeParseJson<AffectedLayer[]>(getAnnotation(test, 'affectedLayer'), []);

    // actualResult: explicit annotation when passed; error message when failed
    const actualResultAnnotation = getAnnotation(test, 'actualResult');
    const actualResult =
      result.status === 'passed'
        ? actualResultAnnotation || '-'
        : actualResultAnnotation || result.error?.message || result.errors?.[0]?.message || '-';

    this.collectedTests.push({
      title: test.title,
      fullTitle,
      filePath,
      status: result.status,
      duration: result.duration,
      errorMessage,
      errors,
      steps: collectSteps(result.steps ?? []),
      attachments,
      retry: result.retry,
      // Table View fields
      testId,
      scenarioId,
      role,
      priority,
      inputData,
      expectedResult,
      actualResult,
      affectedLayer,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    const isCiMode = process.env.CI === 'true';

    try {
      ensureReportDirectory();

      // Copy screenshots to reports/screenshots/ so dashboard can render them inline
      copyScreenshotsToReportDir(this.collectedTests);

      // Determine report mode from collected data
      const reportMode: ReportMode = this.collectedTests.some((t) => t.role && t.role.length > 0)
        ? 'role-aware'
        : 'general';

      const rolesInScope = [
        ...new Set(this.collectedTests.map((t) => t.role).filter((r): r is string => !!r)),
      ];

      // Build testCases[] for MCP tool consumption
      const testCases: CollectedTestCase[] = this.collectedTests.map((t) => ({
        testId: t.testId,
        scenarioId: t.scenarioId,
        title: t.title,
        role: t.role,
        status: t.status,
        priority: t.priority,
        duration: t.duration,
        inputData: t.inputData,
        expectedResult: t.expectedResult,
        actualResult: t.actualResult,
        affectedLayer: t.affectedLayer,
        attachmentCount: t.attachments.length,
        hasTrace: t.attachments.some((a) => a.kind === 'trace'),
      }));

      const summary: TestSummary = {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        skipped: this.skippedTests,
        passRate: this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0,
        timestamp: new Date().toISOString(),
        reportMode,
        rolesInScope,
        testCases,
      };

      const html = isCiMode
        ? buildCiHtml(summary, this.collectedTests)
        : buildLocalHtml(summary, this.collectedTests);

      fs.writeFileSync(DASHBOARD_PATH, html, 'utf-8');
      fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf-8');

      forcePlaywrightHtmlToLight(HTML_REPORT_DIR);

      logger.info('Custom reports generated.', {
        mode: isCiMode ? 'ci' : 'local',
        reportMode,
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

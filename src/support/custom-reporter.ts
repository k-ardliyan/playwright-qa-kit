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
  AttachmentKind,
  CollectedAttachment,
  CollectedError,
  CollectedStep,
  CollectedTestData,
  TestSummary,
} from './custom-dashboard/types';
import { toReportRelativePath } from './custom-dashboard/shared';
import { logger } from '@/utils/logger';

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const DASHBOARD_PATH = path.join(REPORT_DIR, 'custom-dashboard.html');
const SUMMARY_PATH = path.join(REPORT_DIR, 'test-summary.json');

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

function formatErrorMessage(errors: CollectedError[]): string {
  return errors
    .map((error) => {
      const parts = [error.message];
      if (error.stack && !error.message.includes(error.stack)) {
        parts.push(error.stack);
      }
      return parts.filter((part) => part.trim().length > 0).join('\n');
    })
    .filter((message) => message.trim().length > 0)
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

    this.collectedTests.push({
      title: test.title,
      fullTitle,
      filePath,
      status: result.status,
      duration: result.duration,
      errorMessage,
      errors,
      steps: collectSteps(result.steps ?? []),
      attachments: collectAttachments(result),
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

      const html = isCiMode
        ? buildCiHtml(summary, this.collectedTests)
        : buildLocalHtml(summary, this.collectedTests);

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

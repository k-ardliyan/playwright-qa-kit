/// <reference types="node" />

// Feature: playwright-ai-agent-framework, Property 5: Reporter Output Completeness
// Feature: playwright-ai-agent-framework, Property 6: Reporter Trace Link Generation
// Feature: playwright-ai-agent-framework, Property 7: Reporter CI Mode Selection
// Feature: playwright-ai-agent-framework, Property 8: Reporter Attachment Rendering

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';
import type {
  FullConfig,
  FullResult,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import CustomReporter from '../../support/custom-reporter';

type SyntheticStatus = 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';

interface SyntheticCase {
  status: SyntheticStatus;
  duration: number;
  traceFile?: string;
  screenshotFile?: string;
  videoFile?: string;
  failedStep?: boolean;
}

interface ReporterRunOutput {
  html: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    timestamp: string;
  };
}

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const DASHBOARD_PATH = path.join(REPORT_DIR, 'custom-dashboard.html');
const SUMMARY_PATH = path.join(REPORT_DIR, 'test-summary.json');

function toReportRelativePath(absolutePath: string): string {
  return path.relative(REPORT_DIR, absolutePath).replace(/\\/g, '/');
}

function makeSyntheticTest(index: number): TestCase {
  const file = path.join(process.cwd(), 'example/erpku/tests/ui/smoke/smoke.spec.ts');
  return {
    title: `synthetic-${index}`,
    titlePath: () => ['Property Suite', `synthetic-${index}`],
    location: { file },
  } as unknown as TestCase;
}

function makeSyntheticResult(index: number, data: SyntheticCase): TestResult {
  const error = ['failed', 'timedOut', 'interrupted'].includes(data.status)
    ? {
        message: `Synthetic failure ${index}`,
        value: `Failure value ${index}`,
        stack: `Error: stack-${index}`,
      }
    : null;

  const attachments = [
    ...(data.traceFile ? [{ name: 'trace', path: data.traceFile }] : []),
    ...(data.screenshotFile
      ? [{ name: 'screenshot', path: data.screenshotFile, contentType: 'image/png' }]
      : []),
    ...(data.videoFile ? [{ name: 'video', path: data.videoFile, contentType: 'video/webm' }] : []),
  ];

  return {
    status: data.status,
    duration: data.duration,
    retry: 0,
    errors: error ? [error] : [],
    steps: [
      {
        title: `step-${index}`,
        duration: Math.max(1, Math.floor(data.duration / 2)),
        error: data.failedStep ? { message: `step failed ${index}` } : undefined,
        steps: [],
      },
    ],
    attachments,
  } as unknown as TestResult;
}

function cleanReportArtifacts(): void {
  if (fs.existsSync(DASHBOARD_PATH)) {
    fs.rmSync(DASHBOARD_PATH, { force: true });
  }
  if (fs.existsSync(SUMMARY_PATH)) {
    fs.rmSync(SUMMARY_PATH, { force: true });
  }
}

async function runReporter(cases: SyntheticCase[], ciValue?: string): Promise<ReporterRunOutput> {
  const previousCi = process.env.CI;

  if (ciValue === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = ciValue;
  }

  cleanReportArtifacts();

  const reporter = new CustomReporter();
  reporter.onBegin(
    {} as unknown as FullConfig,
    {
      allTests: () => Array.from({ length: cases.length }, () => ({})),
    } as unknown as Suite,
  );

  for (let i = 0; i < cases.length; i += 1) {
    reporter.onTestEnd(makeSyntheticTest(i), makeSyntheticResult(i, cases[i]));
  }

  await reporter.onEnd({} as unknown as FullResult);

  const html = fs.readFileSync(DASHBOARD_PATH, 'utf8');
  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8')) as ReporterRunOutput['summary'];

  if (previousCi === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = previousCi;
  }

  return { html, summary };
}

async function property5ReporterOutputCompleteness(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 0, max: 5 }),
      fc.integer({ min: 1, max: 5 }),
      fc.integer({ min: 0, max: 3 }),
      async (passedCount, failedCount, skippedCount) => {
        const cases: SyntheticCase[] = [
          ...Array.from({ length: passedCount }, () => ({
            status: 'passed' as const,
            duration: 120,
          })),
          ...Array.from({ length: failedCount }, () => ({
            status: 'failed' as const,
            duration: 220,
            failedStep: true,
          })),
          ...Array.from({ length: skippedCount }, () => ({
            status: 'skipped' as const,
            duration: 20,
          })),
        ];

        const total = cases.length;
        const expectedPassRate = total > 0 ? Math.round((passedCount / total) * 100) : 0;

        const output = await runReporter(cases, 'false');

        assert.equal(output.summary.total, total);
        assert.equal(output.summary.passed, passedCount);
        assert.equal(output.summary.failed, failedCount);
        assert.equal(output.summary.skipped, skippedCount);
        assert.equal(output.summary.passRate, expectedPassRate);
        assert.ok(!Number.isNaN(Date.parse(output.summary.timestamp)));

        assert.match(output.html, /cdn\.jsdelivr\.net\/npm\/chart\.js/);
        assert.match(output.html, /id="resultDonut"/);
        assert.match(output.html, /Detailed test records/);
        assert.match(output.html, /Run healthy|Run degraded|Run failed/);
        if (total > 0) {
          const cardMatches = output.html.match(/class="test-card"/g) ?? [];
          assert.equal(cardMatches.length, total);
        }
        if (failedCount > 0) {
          assert.match(output.html, /Synthetic failure/);
          assert.match(output.html, /step failed/);
          assert.match(output.html, /Unhealthy tests/);
        }
        assert.match(output.html, new RegExp(`${expectedPassRate}%`));
      },
    ),
    { numRuns: 12 },
  );

  console.log('✓ Property 5 passed: reporter output completeness');
}

async function property6ReporterTraceLinkGeneration(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.uniqueArray(fc.stringMatching(/^[a-z0-9]{3,8}$/), {
        minLength: 1,
        maxLength: 5,
      }),
      async (traceNames) => {
        const cases: SyntheticCase[] = traceNames.map((name) => ({
          status: 'failed',
          duration: 250,
          failedStep: true,
          traceFile: path.join(process.cwd(), 'test-results', `${name}.zip`),
        }));

        const output = await runReporter(cases, 'false');

        const traceMatches = output.html.match(/View trace/g) ?? [];
        assert.equal(traceMatches.length, traceNames.length);

        for (const name of traceNames) {
          const relative = toReportRelativePath(
            path.join(process.cwd(), 'test-results', `${name}.zip`),
          );
          assert.equal(output.html.includes(relative), true);
        }
      },
    ),
    { numRuns: 10 },
  );

  console.log('✓ Property 6 passed: reporter trace link generation');
}

async function property7ReporterCiModeSelection(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.option(
        fc.string().filter((value) => value !== 'true'),
        {
          nil: undefined,
        },
      ),
      async (ciValue) => {
        const output = await runReporter(
          [
            { status: 'passed', duration: 100 },
            { status: 'failed', duration: 220, failedStep: true },
          ],
          ciValue,
        );

        assert.match(output.html, /Playwright Custom Dashboard \(Local\)/);
        assert.match(output.html, /cdn\.jsdelivr\.net\/npm\/chart\.js/);
        assert.doesNotMatch(output.html, /Playwright Custom Dashboard \(CI Detailed\)/);
        assert.match(output.html, /Local mode/);
        assert.match(output.html, /class="test-card"/);
      },
    ),
    { numRuns: 12 },
  );

  console.log('✓ Property 7 passed: CI mode selection for non-true values');
}

async function property8ReporterAttachmentRendering(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.uniqueArray(fc.stringMatching(/^[a-z0-9]{3,8}$/), {
        minLength: 1,
        maxLength: 3,
      }),
      async (names) => {
        const cases: SyntheticCase[] = names.map((name) => ({
          status: 'failed',
          duration: 300,
          failedStep: true,
          screenshotFile: path.join(process.cwd(), 'test-results', `${name}.png`),
          videoFile: path.join(process.cwd(), 'test-results', `${name}.webm`),
        }));

        const output = await runReporter(cases, 'false');

        assert.match(output.html, /<img/);
        assert.match(output.html, /<video/);

        for (const name of names) {
          const screenshotPath = toReportRelativePath(
            path.join(process.cwd(), 'test-results', `${name}.png`),
          );
          const videoPath = toReportRelativePath(
            path.join(process.cwd(), 'test-results', `${name}.webm`),
          );
          assert.equal(output.html.includes(screenshotPath), true);
          assert.equal(output.html.includes(videoPath), true);
        }
      },
    ),
    { numRuns: 8 },
  );

  console.log('✓ Property 8 passed: reporter attachment rendering');
}

async function main(): Promise<void> {
  try {
    await property5ReporterOutputCompleteness();
    await property6ReporterTraceLinkGeneration();
    await property7ReporterCiModeSelection();
    await property8ReporterAttachmentRendering();
  } finally {
    cleanReportArtifacts();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

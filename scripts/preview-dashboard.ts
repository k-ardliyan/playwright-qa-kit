import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCiHtml } from '../src/support/custom-dashboard/build-ci-html';
import { buildLocalHtml } from '../src/support/custom-dashboard/build-local-html';
import type { CollectedTestData, TestSummary } from '../src/support/custom-dashboard/types';

const summary: TestSummary = {
  total: 3,
  passed: 1,
  failed: 1,
  skipped: 1,
  passRate: 33,
  timestamp: new Date().toISOString(),
};

const collectedTests: CollectedTestData[] = [
  {
    title: 'login flow',
    fullTitle: 'Auth > login flow',
    filePath: 'tests/auth/login.spec.ts',
    status: 'passed',
    duration: 1820,
    errorMessage: '',
    errors: [],
    steps: [
      { title: 'open login page', status: 'passed', duration: 420, steps: [] },
      { title: 'fill credentials', status: 'passed', duration: 320, steps: [] },
      { title: 'submit form', status: 'passed', duration: 1080, steps: [] },
    ],
    attachments: [],
    retry: 0,
  },
  {
    title: 'invoice checkout',
    fullTitle: 'Sales > invoice checkout',
    filePath: 'tests/sales/checkout.spec.ts',
    status: 'failed',
    duration: 4220,
    errorMessage: 'TimeoutError: locator.click: Timeout 10000ms exceeded',
    errors: [
      {
        message: `TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByText("Pay")`,
        stack: 'at checkout.spec.ts:42',
      },
    ],
    steps: [
      { title: 'add item', status: 'passed', duration: 410, steps: [] },
      { title: 'open checkout', status: 'passed', duration: 320, steps: [] },
      {
        title: 'click Pay',
        status: 'failed',
        duration: 10000,
        errorMessage: 'TimeoutError: locator.click',
        steps: [],
      },
    ],
    attachments: [
      {
        name: 'screenshot',
        contentType: 'image/png',
        relativePath: 'test-results/checkout.png',
        kind: 'screenshot',
      },
      {
        name: 'video',
        contentType: 'video/webm',
        relativePath: 'test-results/checkout.webm',
        kind: 'video',
      },
      { name: 'trace', relativePath: 'test-results/checkout.zip', kind: 'trace' },
    ],
    retry: 2,
  },
  {
    title: 'tax report',
    fullTitle: 'Reports > tax report',
    filePath: 'tests/reports/tax.spec.ts',
    status: 'skipped',
    duration: 0,
    errorMessage: '',
    errors: [],
    steps: [],
    attachments: [],
    retry: 0,
  },
];

async function main(): Promise<void> {
  const dir = path.resolve('reports/preview');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'ci.html'), buildCiHtml(summary, collectedTests));
  await fs.writeFile(path.join(dir, 'local.html'), buildLocalHtml(summary, collectedTests));
  console.log(
    JSON.stringify({ dir, ci: 'reports/preview/ci.html', local: 'reports/preview/local.html' }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

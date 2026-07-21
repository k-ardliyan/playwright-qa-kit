/// <reference types="node" />
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCiHtml } from '../src/support/custom-dashboard/build-ci-html';
import { buildLocalHtml } from '../src/support/custom-dashboard/build-local-html';
import type { CollectedTestData, TestSummary } from '../src/support/custom-dashboard/types';

const summary: TestSummary = {
  total: 5,
  passed: 3,
  failed: 1,
  skipped: 1,
  passRate: 60,
  timestamp: new Date().toISOString(),
  reportMode: 'general',
  rolesInScope: [],
  testCases: [],
};

const collectedTests: CollectedTestData[] = [
  {
    title: 'search documentation for coding agent',
    fullTitle: 'Docs > search documentation for coding agent',
    filePath: 'tests/docs/search.spec.ts',
    status: 'passed',
    duration: 2340,
    errorMessage: '',
    errors: [],
    steps: [
      { title: 'navigate to homepage', status: 'passed', duration: 310, steps: [] },
      { title: 'click search input', status: 'passed', duration: 180, steps: [] },
      { title: 'type "coding agent"', status: 'passed', duration: 420, steps: [] },
      { title: 'click search result', status: 'passed', duration: 890, steps: [] },
      { title: 'verify documentation page loaded', status: 'passed', duration: 540, steps: [] },
    ],
    attachments: [],
    retry: 0,
    testId: 'TC-DOCS-001',
    scenarioId: 'SC-DOCS-01',
    role: '',
    priority: 'high',
    inputData: { keyword: 'coding agent', target: 'documentation page' },
    expectedResult: 'Documentation page for coding agent is displayed',
    actualResult: 'Documentation page loaded with correct title and content',
    affectedLayer: ['FE'],
  },
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
    testId: 'TC-AUTH-001',
    scenarioId: 'SC-AUTH-01',
    role: '',
    priority: 'high',
    inputData: { email: 'admin@erpku.com', password: '••••••••' },
    expectedResult: 'User is redirected to dashboard',
    actualResult: 'Dashboard loaded with welcome message',
    affectedLayer: ['FE', 'BE'],
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
        message: `TimeoutError: locator.click: Timeout 10000ms exceeded.\nCall log:\n  - waiting for getByText("Pay")`,
        stack: 'at checkout.spec.ts:42',
      },
    ],
    steps: [
      { title: 'add item to cart', status: 'passed', duration: 410, steps: [] },
      { title: 'open checkout page', status: 'passed', duration: 320, steps: [] },
      {
        title: 'click Pay button',
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
    testId: 'TC-SALES-003',
    scenarioId: 'SC-SALES-03',
    role: '',
    priority: 'high',
    inputData: { item: 'ERP License', qty: '1', amount: 'Rp 5.000.000' },
    expectedResult: 'Payment page opens and transaction completes',
    actualResult: 'TimeoutError: Pay button not found within 10s',
    affectedLayer: ['FE'],
  },
  {
    title: 'export report to PDF',
    fullTitle: 'Reports > export report to PDF',
    filePath: 'tests/reports/export.spec.ts',
    status: 'passed',
    duration: 3150,
    errorMessage: '',
    errors: [],
    steps: [
      { title: 'open report page', status: 'passed', duration: 380, steps: [] },
      { title: 'select date range', status: 'passed', duration: 220, steps: [] },
      { title: 'click export button', status: 'passed', duration: 150, steps: [] },
      { title: 'wait for PDF download', status: 'passed', duration: 2400, steps: [] },
    ],
    attachments: [],
    retry: 0,
    testId: 'TC-RPT-002',
    scenarioId: 'SC-RPT-02',
    role: '',
    priority: 'medium',
    inputData: {
      reportType: 'Monthly Sales',
      dateFrom: '2026-06-01',
      dateTo: '2026-06-30',
      format: 'PDF',
    },
    expectedResult: 'PDF file is downloaded with correct data',
    actualResult: 'PDF exported successfully, 2 pages, 142KB',
    affectedLayer: ['FE', 'BE'],
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
    testId: 'TC-RPT-005',
    scenarioId: 'SC-RPT-05',
    role: '',
    priority: 'low',
    inputData: {},
    expectedResult: 'Tax summary report is generated',
    actualResult: '-',
    affectedLayer: [],
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

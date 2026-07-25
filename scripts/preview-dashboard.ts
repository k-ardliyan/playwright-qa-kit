/// <reference types="node" />
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCiHtml } from '../src/support/custom-dashboard/build-ci-html';
import { buildLocalHtml } from '../src/support/custom-dashboard/build-local-html';
import type { CollectedTestData, TestSummary } from '../src/support/custom-dashboard/types';

// ─────────────────────────────────────────────────────────────────────────────
// Preview fixture: SAME shape as CustomReporter produces (see custom-reporter.ts).
// Scenarios share a base but vary stats + failure mix so QA can compare to a
// real run (reports/html/index.html + reports/test-summary.json).
// ─────────────────────────────────────────────────────────────────────────────

const NOW_ISO = '2026-07-24T16:30:00.000Z';

function meta(env: string, ci: boolean, totalDurationMs: number): TestSummary['runMeta'] {
  return {
    appEnv: env,
    ci,
    totalDurationMs,
    generatedAt: NOW_ISO,
    runId: `preview-${env}-${totalDurationMs}`,
  };
}

function mkSteps(
  titles: Array<{ title: string; status: 'passed' | 'failed' | 'timedOut'; duration: number }>,
) {
  return titles.map((s) => ({
    ...s,
    errorMessage: s.status === 'failed' ? 'TimeoutError: locator.click' : undefined,
    steps: [] as never[],
  }));
}

interface FixtureCase {
  id: string;
  title: string;
  fullTitle: string;
  filePath: string;
  status: 'passed' | 'failed' | 'timedOut' | 'interrupted' | 'skipped';
  duration: number;
  retry: number;
  priority: 'high' | 'medium' | 'low';
  testId: string;
  scenarioId: string;
  inputData: Record<string, string>;
  expectedResult: string;
  actualResult: string;
  affectedLayer: Array<'FE' | 'BE' | 'API'>;
  failureSource?: 'app' | 'test' | 'requirement' | 'env' | 'ai_generation' | 'unknown';
  steps: ReturnType<typeof mkSteps>;
  attachments: CollectedTestData['attachments'];
}

// ── Scenario A: healthy (matches 3-feature login run in reports/pipeline-report-9r-login) ──
function buildHealthyCases(): FixtureCase[] {
  return [
    {
      id: 'TC-9R-LOGIN-001',
      title: 'Login Berhasil dengan Password Valid',
      fullTitle: 'Login 9Router > Login Berhasil dengan Password Valid',
      filePath: 'tests/auth/login-9router.spec.ts',
      status: 'passed',
      duration: 1240,
      retry: 0,
      priority: 'high',
      testId: 'TC-9R-LOGIN-001',
      scenarioId: 'SC-LOGIN-001',
      inputData: { email: 'finance@erpku.com', password: '••••••••' },
      expectedResult: "Redirect ke '/dashboard'; form login hilang",
      actualResult: 'Redirect ke /dashboard berhasil; form login tidak terlihat; title 9Router',
      affectedLayer: ['FE', 'BE'],
      steps: mkSteps([
        { title: 'goto /login', status: 'passed', duration: 220 },
        { title: 'fill email + password', status: 'passed', duration: 180 },
        { title: 'click submit', status: 'passed', duration: 320 },
        { title: 'expect redirect /dashboard', status: 'passed', duration: 520 },
      ]),
      attachments: [],
    },
    {
      id: 'TC-9R-LOGIN-002',
      title: 'Login Gagal dengan Password Acak',
      fullTitle: 'Login 9Router > Login Gagal dengan Password Acak',
      filePath: 'tests/auth/login-9router.spec.ts',
      status: 'passed',
      duration: 980,
      retry: 0,
      priority: 'high',
      testId: 'TC-9R-LOGIN-002',
      scenarioId: 'SC-LOGIN-002',
      inputData: { email: 'finance@erpku.com', password: 'wrong-pass' },
      expectedResult: "Tetap di '/login'; tampil 'Invalid password'",
      actualResult: 'Tetap di /login; tampil Invalid password; form usable',
      affectedLayer: ['FE', 'BE'],
      steps: mkSteps([
        { title: 'goto /login', status: 'passed', duration: 200 },
        { title: 'fill wrong password', status: 'passed', duration: 160 },
        { title: 'click submit', status: 'passed', duration: 280 },
        { title: 'expect error Invalid password', status: 'passed', duration: 340 },
      ]),
      attachments: [],
    },
    {
      id: 'TC-9R-LOGIN-003',
      title: 'Login Gagal Lalu Berhasil',
      fullTitle: 'Login 9Router > Login Gagal Lalu Berhasil',
      filePath: 'tests/auth/login-9router.spec.ts',
      status: 'passed',
      duration: 1200,
      retry: 1,
      priority: 'medium',
      testId: 'TC-9R-LOGIN-003',
      scenarioId: 'SC-LOGIN-003',
      inputData: { email: 'finance@erpku.com', password: 'corrected' },
      expectedResult: 'Gagal → error; benar → /dashboard',
      actualResult: 'Setelah 1 gagal, password benar redirect ke /dashboard',
      affectedLayer: ['FE', 'BE'],
      steps: mkSteps([
        { title: 'attempt 1 with wrong pass', status: 'failed', duration: 380 },
        { title: 'retry with correct pass', status: 'passed', duration: 820 },
      ]),
      attachments: [],
    },
  ];
}

// ── Scenario B: mixed (matches the original preview shape but with 1 fail + retries) ──
function buildMixedCases(): FixtureCase[] {
  return [
    {
      id: 'TC-DOCS-001',
      title: 'search documentation for coding agent',
      fullTitle: 'Docs > search documentation for coding agent',
      filePath: 'tests/docs/search.spec.ts',
      status: 'passed',
      duration: 2340,
      retry: 0,
      priority: 'high',
      testId: 'TC-DOCS-001',
      scenarioId: 'SC-DOCS-01',
      role: 'general',
      inputData: { keyword: 'coding agent', target: 'documentation page' },
      expectedResult: 'Documentation page for coding agent is displayed',
      actualResult: 'Documentation page loaded with correct title and content',
      affectedLayer: ['FE'],
      steps: mkSteps([
        { title: 'navigate to homepage', status: 'passed', duration: 310 },
        { title: 'click search input', status: 'passed', duration: 180 },
        { title: 'type "coding agent"', status: 'passed', duration: 420 },
        { title: 'click search result', status: 'passed', duration: 890 },
        { title: 'verify documentation page loaded', status: 'passed', duration: 540 },
      ]),
      attachments: [],
    },
    {
      id: 'TC-AUTH-001',
      title: 'login flow',
      fullTitle: 'Auth > login flow',
      filePath: 'tests/auth/login.spec.ts',
      status: 'passed',
      duration: 1820,
      retry: 0,
      priority: 'high',
      testId: 'TC-AUTH-001',
      scenarioId: 'SC-AUTH-01',
      role: 'finance',
      inputData: { email: 'admin@erpku.com', password: '••••••••' },
      expectedResult: 'User is redirected to dashboard',
      actualResult: 'Dashboard loaded with welcome message',
      affectedLayer: ['FE', 'BE'],
      steps: mkSteps([
        { title: 'open login page', status: 'passed', duration: 420 },
        { title: 'fill credentials', status: 'passed', duration: 320 },
        { title: 'submit form', status: 'passed', duration: 1080 },
      ]),
      attachments: [],
    },
    {
      id: 'TC-SALES-003',
      title: 'invoice checkout',
      fullTitle: 'Sales > invoice checkout',
      filePath: 'tests/sales/checkout.spec.ts',
      status: 'failed',
      duration: 4220,
      retry: 2,
      priority: 'high',
      testId: 'TC-SALES-003',
      scenarioId: 'SC-SALES-03',
      role: 'finance',
      inputData: { item: 'ERP License', qty: '1', amount: 'Rp 5.000.000' },
      expectedResult: 'Payment page opens and transaction completes',
      actualResult: 'TimeoutError: Pay button not found within 10s',
      affectedLayer: ['FE'],
      failureSource: 'test',
      steps: mkSteps([
        { title: 'add item to cart', status: 'passed', duration: 410 },
        { title: 'open checkout page', status: 'passed', duration: 320 },
        { title: 'click Pay button', status: 'failed', duration: 10000 },
      ]),
      attachments: [
        {
          name: 'screenshot',
          contentType: 'image/png',
          relativePath: 'attachments/screenshots/TC-SALES-003.png',
          kind: 'screenshot',
        },
        {
          name: 'video',
          contentType: 'video/webm',
          relativePath: 'attachments/videos/TC-SALES-003.webm',
          kind: 'video',
        },
        { name: 'trace', relativePath: 'attachments/traces/TC-SALES-003.zip', kind: 'trace' },
      ],
    },
    {
      id: 'TC-RPT-002',
      title: 'export report to PDF',
      fullTitle: 'Reports > export report to PDF',
      filePath: 'tests/reports/export.spec.ts',
      status: 'passed',
      duration: 3150,
      retry: 0,
      priority: 'medium',
      testId: 'TC-RPT-002',
      scenarioId: 'SC-RPT-02',
      inputData: {
        reportType: 'Monthly Sales',
        dateFrom: '2026-06-01',
        dateTo: '2026-06-30',
        format: 'PDF',
      },
      expectedResult: 'PDF file is downloaded with correct data',
      actualResult: 'PDF exported successfully, 2 pages, 142KB',
      affectedLayer: ['FE', 'BE'],
      steps: mkSteps([
        { title: 'open report page', status: 'passed', duration: 380 },
        { title: 'select date range', status: 'passed', duration: 220 },
        { title: 'click export button', status: 'passed', duration: 150 },
        { title: 'wait for PDF download', status: 'passed', duration: 2400 },
      ]),
      attachments: [],
    },
    {
      id: 'TC-RPT-005',
      title: 'tax report',
      fullTitle: 'Reports > tax report',
      filePath: 'tests/reports/tax.spec.ts',
      status: 'skipped',
      duration: 0,
      retry: 0,
      priority: 'low',
      testId: 'TC-RPT-005',
      scenarioId: 'SC-RPT-05',
      inputData: {},
      expectedResult: 'Tax summary report is generated',
      actualResult: '-',
      affectedLayer: [],
      steps: [],
      attachments: [],
    },
  ];
}

// ── Scenario C: heavy triage (multiple unhealthy + retries + 2 fail sources) ──
function buildHeavyCases(): FixtureCase[] {
  // Helper: multiply a single case into N copies with unique IDs to stress
  // the evidence buckets beyond the 4-item cap.
  const expand = (
    base: Omit<FixtureCase, 'id' | 'testId' | 'scenarioId'>,
    n: number,
    prefix: string,
  ): FixtureCase[] =>
    Array.from({ length: n }, (_, i) => {
      const idx = String(i + 1).padStart(3, '0');
      return {
        ...base,
        id: `${prefix}-${idx}`,
        testId: `${prefix}-${idx}`,
        scenarioId: `${prefix}-SC`,
        fullTitle: `${base.fullTitle} #${idx}`,
        title: `${base.title} #${idx}`,
        filePath: base.filePath,
      } as FixtureCase;
    });
  const heavyBase: FixtureCase[] = [
    {
      id: 'TC-CHECKOUT-002',
      title: 'guest checkout — submit payment',
      fullTitle: 'Checkout > guest checkout — submit payment',
      filePath: 'tests/sales/checkout-guest.spec.ts',
      status: 'failed',
      duration: 9200,
      retry: 3,
      priority: 'high',
      testId: 'TC-CHECKOUT-002',
      scenarioId: 'SC-CHK-002',
      role: 'finance',
      inputData: { item: 'Annual Plan', amount: 'Rp 12.000.000', coupon: 'WELCOME10' },
      expectedResult: 'Payment success page',
      actualResult: 'HTTP 500 from /api/payment — Internal Server Error',
      affectedLayer: ['BE', 'API'],
      failureSource: 'app',
      steps: mkSteps([
        { title: 'fill billing form', status: 'passed', duration: 320 },
        { title: 'apply coupon', status: 'passed', duration: 180 },
        { title: 'POST /api/payment', status: 'failed', duration: 8700 },
      ]),
      attachments: [
        {
          name: 'screenshot',
          contentType: 'image/png',
          relativePath: 'attachments/screenshots/TC-CHECKOUT-002.png',
          kind: 'screenshot',
        },
        { name: 'trace', relativePath: 'attachments/traces/TC-CHECKOUT-002.zip', kind: 'trace' },
      ],
    },
    {
      id: 'TC-CHECKOUT-005',
      title: 'discount coupon invalid',
      fullTitle: 'Checkout > discount coupon invalid',
      filePath: 'tests/sales/coupon.spec.ts',
      status: 'failed',
      duration: 4100,
      retry: 1,
      priority: 'high',
      testId: 'TC-CHECKOUT-005',
      scenarioId: 'SC-CHK-005',
      role: 'finance',
      inputData: { coupon: 'EXPIRED-CODE' },
      expectedResult: 'Inline error "Coupon not valid"',
      actualResult: 'getByText("Coupon not valid") timed out',
      affectedLayer: ['FE'],
      failureSource: 'test',
      steps: mkSteps([
        { title: 'fill coupon input', status: 'passed', duration: 180 },
        { title: 'expect inline error', status: 'failed', duration: 3920 },
      ]),
      attachments: [
        {
          name: 'screenshot',
          contentType: 'image/png',
          relativePath: 'attachments/screenshots/TC-CHECKOUT-005.png',
          kind: 'screenshot',
        },
        {
          name: 'video',
          contentType: 'video/webm',
          relativePath: 'attachments/videos/TC-CHECKOUT-005.webm',
          kind: 'video',
        },
      ],
    },
    {
      id: 'TC-HEALER-01',
      title: 'AI-generated test auto-heal probe',
      fullTitle: 'Healer > AI-generated test auto-heal probe',
      filePath: 'tests/ai/healer-probe.spec.ts',
      status: 'passed',
      duration: 6800,
      retry: 2,
      priority: 'medium',
      testId: 'TC-HEALER-01',
      scenarioId: 'SC-HEAL-01',
      inputData: { prompt: 'verify home dashboard loads' },
      expectedResult: 'Healer fix applied, page loaded',
      actualResult: 'Healer applied alternative locator; page loaded',
      affectedLayer: ['FE'],
      failureSource: 'ai_generation',
      steps: mkSteps([
        { title: 'initial locator failed', status: 'failed', duration: 2400 },
        { title: 'healer generated new locator', status: 'passed', duration: 800 },
        { title: 'retry with healed locator', status: 'passed', duration: 3600 },
      ]),
      attachments: [],
    },
    {
      id: 'TC-NET-02',
      title: 'live API contract — /search',
      fullTitle: 'Network > live API contract — /search',
      filePath: 'tests/api/search-contract.spec.ts',
      status: 'failed',
      duration: 3300,
      retry: 0,
      priority: 'high',
      testId: 'TC-NET-02',
      scenarioId: 'SC-NET-02',
      role: 'admin',
      inputData: { query: 'docs', url: '/api/search' },
      expectedResult: '200 with { results: [] }',
      actualResult: '401 Unauthorized — token expired',
      affectedLayer: ['API', 'BE'],
      failureSource: 'env',
      steps: mkSteps([
        { title: 'attach storage state', status: 'passed', duration: 240 },
        { title: 'GET /api/search', status: 'failed', duration: 3060 },
      ]),
      attachments: [
        { name: 'trace', relativePath: 'attachments/traces/TC-NET-02.zip', kind: 'trace' },
      ],
    },
    {
      id: 'TC-DASH-001',
      title: 'dashboard KPI loads',
      fullTitle: 'Dashboard > KPI loads',
      filePath: 'tests/dashboard/kpi.spec.ts',
      status: 'passed',
      duration: 2900,
      retry: 0,
      priority: 'high',
      testId: 'TC-DASH-001',
      scenarioId: 'SC-DASH-01',
      role: 'finance',
      inputData: { role: 'finance' },
      expectedResult: 'KPI cards visible with totals',
      actualResult: 'All 4 KPI cards rendered',
      affectedLayer: ['FE', 'BE'],
      steps: mkSteps([
        { title: 'login as finance', status: 'passed', duration: 1100 },
        { title: 'navigate /dashboard', status: 'passed', duration: 540 },
        { title: 'expect 4 KPI cards', status: 'passed', duration: 1260 },
      ]),
      attachments: [],
    },
  ];
  const expandedCases: FixtureCase[] = [
    ...heavyBase,
    // 6 retries (so retry bucket hits the >4 cap)
    ...expand(
      {
        title: 'flaky checkout retry',
        fullTitle: 'Checkout > flaky retry',
        filePath: 'tests/sales/flaky.spec.ts',
        status: 'passed',
        duration: 800,
        retry: 1,
        priority: 'medium',
        testId: '',
        scenarioId: '',
        inputData: { item: 'Plan' },
        expectedResult: 'OK after retry',
        actualResult: 'OK after retry',
        affectedLayer: ['FE'],
        steps: mkSteps([
          { title: 'first attempt', status: 'failed', duration: 200 },
          { title: 'retry', status: 'passed', duration: 600 },
        ]),
        attachments: [],
      },
      6,
      'TC-FLAKY',
    ),
    // 7 trace attachments
    ...expand(
      {
        title: 'trace burst',
        fullTitle: 'Healer > trace burst',
        filePath: 'tests/ai/trace-burst.spec.ts',
        status: 'failed',
        duration: 6000,
        retry: 0,
        priority: 'low',
        testId: '',
        scenarioId: '',
        inputData: {},
        expectedResult: 'Trace captured',
        actualResult: 'NetworkError',
        affectedLayer: ['BE'],
        failureSource: 'env',
        steps: mkSteps([{ title: 'run', status: 'failed', duration: 6000 }]),
        attachments: [
          { name: 'trace', relativePath: 'attachments/traces/TC-HEALER-EXTRA.zip', kind: 'trace' },
        ],
      },
      7,
      'TC-TRACE',
    ),
    // 6 screenshots
    ...expand(
      {
        title: 'screenshot burst',
        fullTitle: 'Healer > screenshot burst',
        filePath: 'tests/ai/screenshot-burst.spec.ts',
        status: 'failed',
        duration: 4200,
        retry: 0,
        priority: 'low',
        testId: '',
        scenarioId: '',
        inputData: {},
        expectedResult: 'Screenshot captured',
        actualResult: 'AssertionError',
        affectedLayer: ['FE'],
        failureSource: 'test',
        steps: mkSteps([{ title: 'run', status: 'failed', duration: 4200 }]),
        attachments: [
          {
            name: 'screenshot',
            contentType: 'image/png',
            relativePath: 'attachments/screenshots/TC-SS-EXTRA.png',
            kind: 'screenshot',
          },
        ],
      },
      6,
      'TC-SS',
    ),
    // 5 videos
    ...expand(
      {
        title: 'video burst',
        fullTitle: 'Healer > video burst',
        filePath: 'tests/ai/video-burst.spec.ts',
        status: 'failed',
        duration: 5400,
        retry: 0,
        priority: 'low',
        testId: '',
        scenarioId: '',
        inputData: {},
        expectedResult: 'Video captured',
        actualResult: 'Heal failed',
        affectedLayer: ['FE'],
        failureSource: 'ai_generation',
        steps: mkSteps([{ title: 'run', status: 'failed', duration: 5400 }]),
        attachments: [
          {
            name: 'video',
            contentType: 'video/webm',
            relativePath: 'attachments/videos/TC-VID-EXTRA.webm',
            kind: 'video',
          },
        ],
      },
      5,
      'TC-VID',
    ),
    // 1 extra skipped to close the run
    {
      id: 'TC-CUST-002',
      title: 'customer create new',
      fullTitle: 'Customers > create new',
      filePath: 'tests/customers/new.spec.ts',
      status: 'skipped',
      duration: 0,
      retry: 0,
      priority: 'low',
      testId: 'TC-CUST-002',
      scenarioId: 'SC-CUST-02',
      inputData: {},
      expectedResult: 'Customer created',
      actualResult: '-',
      affectedLayer: [],
      steps: [],
      attachments: [],
    },
  ];
  // Strip duplicate ids if expansion collided (none expected, but safe).
  const seen = new Set<string>();
  return expandedCases.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

interface Scenario {
  key: 'healthy' | 'mixed' | 'heavy';
  title: string;
  description: string;
  cases: FixtureCase[];
}

const SCENARIOS: Scenario[] = [
  {
    key: 'healthy',
    title: 'Healthy 9Router login (3/3 pass)',
    description: 'Mirrors reports/pipeline-report-9r-login-*.md — feature tests only, 100% pass.',
    cases: buildHealthyCases(),
  },
  {
    key: 'mixed',
    title: 'Mixed triage (4 pass · 1 fail · 1 skip)',
    description: 'Failure-first column SOURCE = test (selector timeout); 1 retry; evidence ready.',
    cases: buildMixedCases(),
  },
  {
    key: 'heavy',
    title: 'Heavy triage (3 pass · 3 fail · 1 skip)',
    description:
      'Multi SOURCE mix: app / test / env / ai_generation; retries + evidence for triage.',
    cases: buildHeavyCases(),
  },
];

function derive(cases: FixtureCase[]): TestSummary {
  const total = cases.length;
  const passed = cases.filter((c) => c.status === 'passed').length;
  const failed = cases.filter(
    (c) => c.status === 'failed' || c.status === 'timedOut' || c.status === 'interrupted',
  ).length;
  const skipped = cases.filter((c) => c.status === 'skipped').length;
  const totalDurationMs = cases.reduce((sum, c) => sum + c.duration, 0);
  return {
    total,
    passed,
    failed,
    skipped,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    timestamp: NOW_ISO,
    reportMode: cases.some((c) => c.role && c.role.length > 0) ? 'role-aware' : 'general',
    rolesInScope: [...new Set(cases.map((c) => c.role).filter((r): r is string => !!r))],
    testCases: cases.map((c) => ({
      testId: c.testId,
      title: c.title,
      status: c.status,
      duration: c.duration,
      priority: c.priority,
      role: c.role || null,
      failureSource: c.failureSource || null,
    })),
    runMeta: meta(process.env.APP_ENV?.trim() || 'local', false, totalDurationMs),
  };
}

function toCollected(cases: FixtureCase[]): CollectedTestData[] {
  return cases.map((c) => ({
    title: c.title,
    fullTitle: c.fullTitle,
    filePath: c.filePath,
    status: c.status,
    duration: c.duration,
    errorMessage:
      c.status === 'failed' || c.status === 'timedOut' || c.status === 'interrupted'
        ? c.actualResult
        : '',
    errors:
      c.status === 'failed' || c.status === 'timedOut' || c.status === 'interrupted'
        ? [{ message: c.actualResult, stack: `at ${c.filePath}:1` }]
        : [],
    steps: c.steps,
    attachments: c.attachments,
    retry: c.retry,
    testId: c.testId,
    scenarioId: c.scenarioId,
    role: c.role || '',
    priority: c.priority,
    inputData: c.inputData,
    expectedResult: c.expectedResult,
    actualResult: c.actualResult,
    affectedLayer: c.affectedLayer,
    failureSource: c.failureSource,
  }));
}

async function writeAttachments(cases: FixtureCase[]): Promise<void> {
  // Materialize attachment placeholders so deep-links resolve from preview.
  const attRoot = path.resolve('reports/attachments');
  await fs.mkdir(path.join(attRoot, 'screenshots'), { recursive: true });
  await fs.mkdir(path.join(attRoot, 'videos'), { recursive: true });
  await fs.mkdir(path.join(attRoot, 'traces'), { recursive: true });
  for (const c of cases) {
    for (const a of c.attachments) {
      const rel = a.relativePath.replace(/^attachments\//, '');
      const abs = path.join(attRoot, rel);
      try {
        await fs.access(abs);
      } catch {
        // 1-byte placeholder — preview only needs the path to resolve.
        await fs.writeFile(abs, '');
      }
    }
  }
}

async function main(): Promise<void> {
  const dir = path.resolve('reports/preview');
  const reportsDir = path.resolve('reports');
  await fs.mkdir(dir, { recursive: true });

  const summary: Record<string, { summary: TestSummary; html: string }> = {};
  for (const sc of SCENARIOS) {
    const s = derive(sc.cases);
    const collected = toCollected(sc.cases);
    await writeAttachments(sc.cases);
    const localHtml = buildLocalHtml(s, collected);
    const ciHtml = buildCiHtml(s, collected);
    const fileKey = sc.key;
    await fs.writeFile(path.join(dir, `${fileKey}-local.html`), localHtml);
    await fs.writeFile(path.join(dir, `${fileKey}-ci.html`), ciHtml);
    summary[fileKey] = { summary: s, html: fileKey === 'mixed' ? '' : '' };

    // Default preview files (kept for qa-run / wizard) = the "mixed" scenario.
    if (sc.key === 'mixed') {
      await fs.writeFile(
        path.join(reportsDir, 'test-summary.json'),
        JSON.stringify(
          {
            ...s,
            testCases: sc.cases.map((c) => ({
              testId: c.testId,
              title: c.title,
              status: c.status,
              duration: c.duration,
              priority: c.priority,
              failureSource: c.failureSource || null,
            })),
          },
          null,
          2,
        ),
        'utf8',
      );
      await fs.writeFile(path.join(dir, 'local.html'), localHtml);
      await fs.writeFile(path.join(dir, 'ci.html'), ciHtml);
    }
  }

  const manifest = {
    generatedAt: NOW_ISO,
    baseDir: 'reports/preview',
    scenarios: SCENARIOS.map((sc) => ({
      key: sc.key,
      title: sc.title,
      description: sc.description,
      files: {
        local: `reports/preview/${sc.key}-local.html`,
        ci: `reports/preview/${sc.key}-ci.html`,
      },
      stats: {
        total: summary[sc.key].summary.total,
        passed: summary[sc.key].summary.passed,
        failed: summary[sc.key].summary.failed,
        skipped: summary[sc.key].summary.skipped,
        passRate: summary[sc.key].summary.passRate,
      },
    })),
    compareWith: [
      'reports/html/index.html (Playwright HTML report)',
      'reports/custom-dashboard.html (CustomReporter output)',
      'reports/test-summary.json',
    ],
  };
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(
    JSON.stringify(
      {
        dir,
        scenarios: manifest.scenarios.map((s) => ({ key: s.key, stats: s.stats })),
        summary: 'reports/test-summary.json',
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * Dashboard Serve Mode — Local HTTP server for interactive QA dashboard.
 *
 * Features:
 * - Serves dynamic dashboard HTML (rebuilt on every GET /)
 * - REST API: save, delete, compare, history
 * - Server-Sent Events (SSE) for auto-refresh after mutations
 * - Heartbeat-based auto-shutdown when browser tab is closed
 * - Zero external dependencies — uses Node.js built-in http/fs/url
 *
 * Usage:
 *   npm run dashboard:serve
 *   npm run dashboard:serve -- --port=4567 --no-open
 *
 * @module src/cli/dashboard-server
 */

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { exec } from 'node:child_process';

import { listReportHistory } from '../agents/reporter/report-history';
import {
  saveLatestRun,
  deleteArchivedReport,
  getLatestRunInfo,
  generateRunId,
  listArchivedRunIds,
  isLatestRunArchived,
} from '../agents/reporter/report-archive';
import { compareLatestVsPrevious, compareReports } from '../agents/reporter/report-compare';
import { buildLocalHtml } from '../support/custom-dashboard/build-local-html';
import type { DashboardOptions } from '../support/custom-dashboard/build-dashboard-html';
import type { QaDecision } from '../agents/reporter/report-archive';

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_PORT = 4567;
const HEARTBEAT_TIMEOUT_MS = 20_000; // server shuts down if no heartbeat for 20s
const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const SUMMARY_PATH = path.join(REPORT_DIR, 'test-summary.json');

// ─── Arg parsing ─────────────────────────────────────────────────────────────

function parseServArgs(argv: string[]): { port: number; open: boolean } {
  let port = DEFAULT_PORT;
  let open = true;
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--port=(\d+)$/);
    if (m) port = parseInt(m[1], 10);
    if (arg === '--no-open') open = false;
  }
  return { port, open };
}

// ─── SSE clients ─────────────────────────────────────────────────────────────

const sseClients = new Set<http.ServerResponse>();

function broadcastEvent(event: string, data: unknown = {}) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// ─── Heartbeat ───────────────────────────────────────────────────────────────

let shutdownTimer: ReturnType<typeof setTimeout> | null = null;

function resetHeartbeat() {
  if (shutdownTimer) clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(() => {
    console.log('\n[dashboard-server] No heartbeat received — shutting down.');
    process.exit(0);
  }, HEARTBEAT_TIMEOUT_MS);
}

// ─── Normalize CollectedTestCase → CollectedTestData ─────────────────────────
// test-summary.json stores CollectedTestCase (flat summary per test).
// The dashboard renderers expect CollectedTestData (full runtime data with
// errors, steps, attachments, retry, fullTitle, filePath, etc.).
// This normalizer bridges the gap with safe defaults for serve mode.
function normalizeTestCases(
  testCases: unknown[],
): import('../support/custom-dashboard/types').CollectedTestData[] {
  return testCases.map((tc) => {
    const t = tc as Record<string, unknown>;
    return {
      // Fields present in CollectedTestCase
      testId: (t['testId'] as string) || '',
      scenarioId: (t['scenarioId'] as string) || '',
      title: (t['title'] as string) || '',
      role: (t['role'] as string) || '',
      module: (t['module'] as string) || '',
      feature: (t['feature'] as string) || '',
      status: t[
        'status'
      ] as string as import('../support/custom-dashboard/types').CollectedTestData['status'],
      priority: (t['priority'] as import('../support/custom-dashboard/types').Priority) || 'medium',
      duration: (t['duration'] as number) || 0,
      inputData: (t['inputData'] as Record<string, string>) || {},
      expectedResult: (t['expectedResult'] as string) || '',
      actualResult: (t['actualResult'] as string) || '',
      affectedLayer:
        (t['affectedLayer'] as import('../support/custom-dashboard/types').AffectedLayer[]) || [],
      failureSource: t['failureSource'] as
        import('../support/custom-dashboard/types').FailureSource | undefined,
      // Fields not in CollectedTestCase — safe defaults for serve mode
      fullTitle: (t['title'] as string) || '',
      filePath: '',
      errorMessage: (t['errorMessage'] as string) || '',
      errors: [],
      steps: [],
      attachments: [],
      retry: 0,
    };
  });
}

// ─── Dashboard HTML builder ───────────────────────────────────────────────────

function buildDashboard(): string {
  let summary: object | undefined;
  let collectedTests: object[] = [];

  try {
    if (fs.existsSync(SUMMARY_PATH)) {
      const raw = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
      summary = raw;
      // test-summary.json stores CollectedTestCase[] (flat), but renderers
      // expect CollectedTestData[] (with errors, steps, attachments, retry, etc.)
      // normalizeTestCases bridges the gap with safe defaults.
      collectedTests = Array.isArray(raw.testCases) ? normalizeTestCases(raw.testCases) : [];
    }
  } catch {
    // Use empty state
  }

  if (!summary) {
    // No test run yet — show placeholder
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>QA Dashboard</title>
<style>body{font-family:system-ui;background:#1a1a1a;color:#e0d6c8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px}
.msg{font-size:1.1rem;color:#c4956a}.cmd{background:#2a2a2a;padding:8px 16px;border-radius:6px;font-family:monospace;color:#c4956a}</style></head>
<body><p class="msg">📊 No test run found yet.</p>
<p>Run tests first:</p><code class="cmd">npx playwright test</code>
<p class="msg">Then refresh this page.</p></body></html>`;
  }

  const history = listReportHistory({ sort: 'newest', limit: 20 });
  const latestRun = getLatestRunInfo();
  const latestRunArchived = latestRun
    ? listArchivedRunIds().includes(generateRunId(latestRun.timestamp))
    : false;

  const options: DashboardOptions = {
    hasLatestRun: latestRun !== null,
    latestRunArchived,
    serveMode: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return buildLocalHtml(summary as any, collectedTests as any[], history, options);
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res: http.ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(json);
}

// ─── Request router ───────────────────────────────────────────────────────────

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const parsed = url.parse(req.url ?? '/', true);
  const pathname = parsed.pathname ?? '/';
  const method = req.method ?? 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ── SSE /events ──────────────────────────────────────────────────────────
  if (pathname === '/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(':connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  if (pathname === '/heartbeat' && method === 'POST') {
    resetHeartbeat();
    jsonResponse(res, 200, { ok: true });
    return;
  }

  // ── GET / — serve dynamic dashboard ──────────────────────────────────────
  if (pathname === '/' && method === 'GET') {
    try {
      const html = buildDashboard();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error building dashboard: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

  // ── GET /api/status ───────────────────────────────────────────────────────
  if (pathname === '/api/status' && method === 'GET') {
    const latestRun = getLatestRunInfo();
    const archived = isLatestRunArchived();
    jsonResponse(res, 200, {
      hasLatestRun: latestRun !== null,
      latestRunArchived: archived,
      latestRun,
      archiveCount: listArchivedRunIds().length,
    });
    return;
  }

  // ── GET /api/history ──────────────────────────────────────────────────────
  if (pathname === '/api/history' && method === 'GET') {
    const limit = parseInt((parsed.query['limit'] as string) ?? '20', 10);
    const history = listReportHistory({ sort: 'newest', limit });
    jsonResponse(res, 200, { history });
    return;
  }

  // ── POST /api/archive/save ─────────────────────────────────────────────────
  if (pathname === '/api/archive/save' && method === 'POST') {
    try {
      const body = (await readBody(req)) as Record<string, string>;
      const { decision, notes } = body;

      if (!decision) {
        jsonResponse(res, 400, { error: 'decision is required' });
        return;
      }

      const result = saveLatestRun({
        qaDecision: decision as QaDecision,
        qaNotes: notes ?? '',
        triggerSource: 'dashboard-button',
      });

      broadcastEvent('archive-saved', { runId: result.runId });
      jsonResponse(res, 200, { ok: true, runId: result.runId, archivePath: result.archivePath });
    } catch (err) {
      jsonResponse(res, 400, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // ── DELETE /api/archive/:runId ─────────────────────────────────────────────
  if (pathname.startsWith('/api/archive/') && method === 'DELETE') {
    const runId = pathname.replace('/api/archive/', '');
    try {
      const deleted = deleteArchivedReport(runId);
      if (!deleted) {
        jsonResponse(res, 404, { error: `Archive ${runId} not found` });
        return;
      }
      broadcastEvent('archive-deleted', { runId });
      jsonResponse(res, 200, { ok: true, runId });
    } catch (err) {
      jsonResponse(res, 400, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // ── GET /api/archive/compare ───────────────────────────────────────────────
  if (pathname === '/api/archive/compare' && method === 'GET') {
    const baseline = parsed.query['baseline'] as string | undefined;
    const current = parsed.query['current'] as string | undefined;

    try {
      const result =
        baseline && current ? compareReports(baseline, current) : compareLatestVsPrevious();

      if (!result) {
        jsonResponse(res, 404, {
          error: 'Not enough archived runs to compare (need at least 2)',
        });
        return;
      }
      jsonResponse(res, 200, result);
    } catch (err) {
      jsonResponse(res, 400, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // ── 404 ───────────────────────────────────────────────────────────────────
  jsonResponse(res, 404, { error: `Not found: ${pathname}` });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { port, open } = parseServArgs(process.argv);

  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error('[dashboard-server] Unhandled error:', err);
      try {
        jsonResponse(res, 500, { error: 'Internal server error' });
      } catch {
        // Response already sent
      }
    });
  });

  server.listen(port, '127.0.0.1', () => {
    const dashboardUrl = `http://localhost:${port}`;
    console.log('');
    console.log('────────────────────────────────────────────────────────');
    console.log(`  🌐 Dashboard running at: ${dashboardUrl}`);
    console.log(`  💾 Save / view / delete runs directly from the browser`);
    console.log(`  🔄 Auto-refresh via Server-Sent Events`);
    console.log(`  ⏱️  Server shuts down ${HEARTBEAT_TIMEOUT_MS / 1000}s after tab is closed`);
    console.log('  Press Ctrl+C to stop manually');
    console.log('────────────────────────────────────────────────────────');
    console.log('');

    if (open) {
      // Cross-platform open — Windows: start, macOS: open, Linux: xdg-open
      const cmd =
        process.platform === 'win32'
          ? `start ${dashboardUrl}`
          : process.platform === 'darwin'
            ? `open ${dashboardUrl}`
            : `xdg-open ${dashboardUrl}`;
      exec(cmd, (err) => {
        if (err) console.log(`  [info] Could not auto-open browser: ${err.message}`);
      });
    }

    // Start heartbeat watchdog
    resetHeartbeat();
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n❌ Port ${port} already in use. Try: npm run dashboard:serve -- --port=4568`,
      );
    } else {
      console.error('\n❌ Server error:', err.message);
    }
    process.exit(1);
  });

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n[dashboard-server] Stopping...');
    server.close(() => process.exit(0));
  });
}

main();

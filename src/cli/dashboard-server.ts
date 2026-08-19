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
  listArchivedRunIds,
  isLatestRunArchived,
  loadArchivedSummary,
  loadArchivedMetadata,
  generateRunId,
  isValidRunId,
} from '../agents/reporter/report-archive';
import { compareLatestVsPrevious, compareReports } from '../agents/reporter/report-compare';
import type { ReportComparison } from '../agents/reporter/report-compare';
import { buildLocalHtml } from '../support/custom-dashboard/build-local-html';
import {
  buildComparePage,
  buildHistoryPage,
  buildDetailPage,
} from '../support/custom-dashboard/build-fragments';
import { escapeHtml } from '../support/custom-dashboard/shared'; // Fix #4: import, tidak duplikat
import type { DashboardOptions } from '../support/custom-dashboard/build-dashboard-html';
import type { QaDecision } from '../agents/reporter/report-archive';

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_PORT = 4567;
const HEARTBEAT_TIMEOUT_MS = 20_000; // server shuts down if no heartbeat for 20s
const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const SUMMARY_PATH = path.join(REPORT_DIR, 'test-summary.json');

// ─── Arg parsing ─────────────────────────────────────────────────────────────

function parseServArgs(argv: string[]): { port: number; open: boolean; idle: boolean } {
  let port = DEFAULT_PORT;
  let open = true;
  let idle = true;
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--port=(\d+)$/);
    if (m) port = parseInt(m[1], 10);
    if (arg === '--no-open') open = false;
    if (arg === '--no-idle') idle = false;
  }
  return { port, open, idle };
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
let idleEnabled = true;

function resetHeartbeat() {
  if (!idleEnabled) return;
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
      // Fix #6: status fallback 'skipped' jika nilai undefined/unknown.
      status: ((t['status'] as string) ||
        'skipped') as import('../support/custom-dashboard/types').CollectedTestData['status'],
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
      errors: (t['errors'] as import('../support/custom-dashboard/types').CollectedError[]) || [],
      steps: (t['steps'] as import('../support/custom-dashboard/types').CollectedStep[]) || [],
      attachments: [],
      retry: 0,
      attachmentCount: (t['attachmentCount'] as number) ?? 0,
      hasTrace: (t['hasTrace'] as boolean) ?? false,
    };
  });
}

// ─── Error & orphan run pages ────────────────────────────────────────────────

function buildErrorPage(title: string, body: string, command?: string): string {
  const cmdBlock = command ? `<code class="cmd">${escapeHtml(command)}</code>` : '';
  const escapedTitle = escapeHtml(title);
  const escapedBody = escapeHtml(body).replace(/\n/g, '<br>');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>QA Dashboard</title>
<style>body{font-family:system-ui;background:#1a1a1a;color:#e0d6c8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;flex-direction:column;gap:14px;padding:24px;text-align:left;max-width:680px;margin:0 auto}
.msg{font-size:1.1rem;color:#c4956a;margin:0}
.body{font-size:0.95rem;line-height:1.6;color:#cfc4b6;margin:0}
.cmd{background:#2a2a2a;padding:10px 16px;border-radius:6px;font-family:monospace;color:#c4956a;display:block;width:fit-content}
.summary-box{background:#221a14;border:1px solid #4a3a2c;border-radius:8px;padding:14px 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;width:100%}
.summary-box strong{color:#c4956a}
.actions{display:flex;gap:8px;flex-wrap:wrap}
.btn{background:#c4956a;color:#1a1a1a;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;text-decoration:none;display:inline-block}
.btn:hover{background:#d4a47a}
</style></head>
<body>
  <p class="msg">📊 ${escapedTitle}</p>
  <p class="body">${escapedBody}</p>
  ${cmdBlock}
</body></html>`;
}

function buildOrphanRunPage(latestRun: {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  reportMode: string;
}): string {
  const escapedTitle = escapeHtml('Run summary found, but test-summary.json is missing');
  const escapedBody = escapeHtml(
    `The latest run marker (.latest-run) shows the run completed, but the summary ` +
      `file is gone. Without test-summary.json the dashboard cannot render test details.\n\n` +
      `Quick fix — re-run the tests to regenerate the summary, OR view the archived ` +
      `history (saved runs are still safe in reports/archive/).`,
  );
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>QA Dashboard</title>
<style>body{font-family:system-ui;background:#1a1a1a;color:#e0d6c8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;flex-direction:column;gap:14px;padding:24px;text-align:left;max-width:680px;margin:0 auto}
.msg{font-size:1.1rem;color:#c4956a;margin:0}
.body{font-size:0.95rem;line-height:1.6;color:#cfc4b6;margin:0}
.cmd{background:#2a2a2a;padding:10px 16px;border-radius:6px;font-family:monospace;color:#c4956a;display:block;width:fit-content}
.summary-box{background:#221a14;border:1px solid #4a3a2c;border-radius:8px;padding:14px 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;width:100%}
.summary-box strong{color:#c4956a}
.actions{display:flex;gap:8px;flex-wrap:wrap}
.btn{background:#c4956a;color:#1a1a1a;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;text-decoration:none;display:inline-block}
.btn:hover{background:#d4a47a}
</style></head>
<body>
  <p class="msg">📊 ${escapedTitle}</p>
  <div class="summary-box">
    <div><strong>Total</strong><br>${latestRun.total}</div>
    <div><strong>Passed</strong><br>${latestRun.passed}</div>
    <div><strong>Failed</strong><br>${latestRun.failed}</div>
    <div><strong>Skipped</strong><br>${latestRun.skipped}</div>
    <div><strong>Pass rate</strong><br>${latestRun.passRate}%</div>
    <div><strong>Mode</strong><br>${escapeHtml(latestRun.reportMode)}</div>
    <div><strong>Timestamp</strong><br>${escapeHtml(latestRun.timestamp)}</div>
  </div>
  <p class="body">${escapedBody}</p>
  <code class="cmd">npx playwright test</code>
  <div class="actions">
    <a class="btn" href="/api/history">View saved history (JSON)</a>
  </div>
</body></html>`;
}

// Fix #4: escapeHtml diimpor dari shared, tidak didefinisikan ulang di sini.
// (Lihat import di atas — duplikasi lokal dihapus.)

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
  } catch (err) {
    // test-summary.json exists but is unreadable — surface the error
    const message = err instanceof Error ? err.message : String(err);
    return buildErrorPage(
      'test-summary.json is unreadable',
      `The file exists but could not be parsed:\n\n${message}\n\nDelete the corrupt file and re-run tests.`,
    );
  }

  if (!summary) {
    // test-summary.json is missing. .latest-run marker may still have basic
    // metadata (totals + pass rate) — surface that so QA knows a run exists.
    const latestRun = getLatestRunInfo();
    if (latestRun) {
      return buildOrphanRunPage(latestRun);
    }
    return buildErrorPage(
      'No test run found yet.',
      'Run tests first, then refresh this page.',
      'npx playwright test',
    );
  }

  // Fix #5: validasi minimal struct summary sebelum di-cast ke any.
  // Jika field kritis hilang, render error page daripada crash di renderer.
  const rawSummary = summary as Record<string, unknown>;
  if (
    typeof rawSummary['total'] === 'undefined' &&
    typeof rawSummary['testCases'] === 'undefined'
  ) {
    return buildErrorPage(
      'test-summary.json has unexpected format',
      'The file exists but is missing required fields (total / testCases).\n\nDelete the file and re-run tests to regenerate it.',
    );
  }

  const history = listReportHistory({ sort: 'newest', limit: 20 });
  const latestRun = getLatestRunInfo();
  // Fix #10: gunakan isLatestRunArchived() yang sudah ada daripada reimplementasi
  // listArchivedRunIds().includes(generateRunId(...)) — satu titik kebenaran.
  const latestRunArchived = isLatestRunArchived();

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
  const MAX_BYTES = 64 * 1024; // 64 KB — more than enough for decision+notes JSON
  return new Promise((resolve, reject) => {
    let data = '';
    let bytes = 0;
    req.on('data', (chunk: Buffer | string) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > MAX_BYTES) {
        req.destroy();
        reject(Object.assign(new Error('Request body too large'), { code: 413 }));
        return;
      }
      data += chunk;
    });
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
    // No CORS wildcard — the dashboard is same-origin (served by this server),
    // and a wildcard would let ANY website read archived QA data via fetch.
    // Archive/history data is mutable (save/delete) — never cache GETs so
    // post-SSE refreshes always see fresh data.
    'Cache-Control': 'no-store',
  });
  res.end(json);
}

// ─── Request router ───────────────────────────────────────────────────────────

export async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const parsed = url.parse(req.url ?? '/', true);
  const pathname = parsed.pathname ?? '/';
  const method = req.method ?? 'GET';

  // CORS preflight — kept minimal; dashboard is same-origin so no wildcard.
  if (method === 'OPTIONS') {
    res.writeHead(204, {
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
      // Same-origin only (no CORS wildcard) — see jsonResponse comment.
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

  // ── GET /favicon.ico — silence browser 404 noise ─────────────────────────
  if (pathname === '/favicon.ico' && method === 'GET') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── GET / — serve dynamic dashboard ──────────────────────────────────────
  if (pathname === '/' && method === 'GET') {
    try {
      const html = buildDashboard();
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        // Dynamic HTML embeds mutable archive data — never cache (consistency
        // with fragment + API responses).
        'Cache-Control': 'no-store',
      });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error building dashboard: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

  // ── GET /fragment/:view — server-rendered HTML fragment for hash-router ──
  // The client's hash (#/history, #/compare, #/detail/:id) never reaches the
  // server, so the router fetches these fragments and swaps them into <main>.
  if (pathname.startsWith('/fragment/') && method === 'GET') {
    try {
      const frag = pathname.replace('/fragment/', '').split('/');
      const view = frag[0];
      let fragmentHtml: string;

      if (view === 'history') {
        const history = listReportHistory({ sort: 'newest', limit: 50 });
        const latestRun = getLatestRunInfo();
        fragmentHtml = buildHistoryPage({
          history,
          hasLatestRun: latestRun !== null,
          latestRunArchived: isLatestRunArchived(),
          latestRunId: latestRun ? generateRunId(latestRun.timestamp) : undefined,
          serveMode: true,
        });
      } else if (view === 'compare') {
        const runIds = listArchivedRunIds();
        const baseline = parsed.query['baseline'] as string | undefined;
        const current = parsed.query['current'] as string | undefined;
        // Defense-in-depth: runIds come from query params — validate before any
        // file access (compareReports reads from the archive dir).
        if (baseline && !isValidRunId(baseline)) {
          jsonResponse(res, 400, { error: 'Invalid baseline runId' });
          return;
        }
        if (current && !isValidRunId(current)) {
          jsonResponse(res, 400, { error: 'Invalid current runId' });
          return;
        }
        let comparison: ReportComparison | null = null;
        if (baseline && current) {
          const result = compareReports(baseline, current);
          if (!('error' in result)) comparison = result;
        }
        fragmentHtml = buildComparePage({ runIds, comparison, baseline, current });
      } else if (view === 'detail') {
        const runId = frag[1] ?? '';
        if (!runId || !isValidRunId(runId)) {
          jsonResponse(res, 400, { error: 'Invalid runId' });
          return;
        }
        const summary = loadArchivedSummary(runId);
        const metadata = loadArchivedMetadata(runId);
        const scenarios = Array.isArray((summary as Record<string, unknown> | null)?.testCases)
          ? ((summary as Record<string, unknown>).testCases as Array<Record<string, unknown>>)
          : [];
        fragmentHtml = buildDetailPage({
          runId,
          summary,
          metadata,
          scenarios: scenarios.map((s) => ({
            testId: (s['testId'] as string) ?? '',
            scenarioId: (s['scenarioId'] as string) ?? '',
            title: (s['title'] as string) ?? '',
            status: (s['status'] as string) ?? 'skipped',
            role: (s['role'] as string) ?? '',
            module: (s['module'] as string) ?? '',
            feature: (s['feature'] as string) ?? '',
            priority: (s['priority'] as string) ?? 'medium',
            duration: (s['duration'] as number) ?? undefined,
            failureSource: (s['failureSource'] as string) ?? '',
            errorMessage: (s['errorMessage'] as string) ?? '',
            inputData: (s['inputData'] as Record<string, string>) ?? {},
            expectedResult: (s['expectedResult'] as string) ?? '',
            actualResult: (s['actualResult'] as string) ?? '',
            affectedLayer: (s['affectedLayer'] as string[]) ?? [],
            attachmentCount: (s['attachmentCount'] as number) ?? 0,
            hasTrace: (s['hasTrace'] as boolean) ?? false,
          })),
        });
      } else {
        jsonResponse(res, 404, { error: `Unknown fragment: ${view}` });
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(fragmentHtml);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error building fragment: ${err instanceof Error ? err.message : String(err)}`);
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
      const status = (err as { code?: number }).code === 413 ? 413 : 400;
      jsonResponse(res, status, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // ── GET /api/archive/:runId — load archived summary + metadata for detail view ──
  if (
    pathname.startsWith('/api/archive/') &&
    method === 'GET' &&
    pathname !== '/api/archive/compare' &&
    pathname !== '/api/archive/save' // POST-only, guard against accidental GET
  ) {
    const runId = pathname.replace('/api/archive/', '');
    // Guard: runId harus valid (alphanum + dash, no traversal chars)
    if (!runId || /[/\\.]/.test(runId) || runId.includes('..')) {
      jsonResponse(res, 400, { error: 'Invalid runId' });
      return;
    }
    try {
      const summary = loadArchivedSummary(runId);
      const metadata = loadArchivedMetadata(runId);
      if (!summary && !metadata) {
        jsonResponse(res, 404, { error: `Archive ${escapeHtml(runId)} not found` });
        return;
      }
      // Merge summary fields dengan metadata agar detail view mendapat passRate, appEnv, reportMode
      const merged = {
        runId,
        ...(summary ?? {}),
        ...(metadata
          ? {
              qaDecision: metadata.qaDecision,
              qaNotes: metadata.qaNotes,
              savedAt: metadata.savedAt,
              appEnv: metadata.appEnv,
              reportMode: metadata.reportMode ?? 'general',
              durationMs: metadata.durationMs,
            }
          : {}),
      };
      jsonResponse(res, 200, merged);
    } catch (err) {
      jsonResponse(res, 500, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // ── DELETE /api/archive/:runId ─────────────────────────────────────────────
  if (pathname.startsWith('/api/archive/') && method === 'DELETE') {
    const runId = pathname.replace('/api/archive/', '');
    // Fix #7: path traversal guard di sisi server — tolak runId yang mengandung
    // path separator atau komponen berbahaya (../ dll). deleteArchivedReport() juga
    // memiliki guard sendiri, tapi defense-in-depth: reject di router sebelum masuk.
    if (!runId || /[/\\.]/.test(runId) || runId.includes('..')) {
      jsonResponse(res, 400, { error: 'Invalid runId' });
      return;
    }
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

    // Defense-in-depth: validate query runIds before any file access
    // (compareReports reads from the archive dir).
    if (baseline && !isValidRunId(baseline)) {
      jsonResponse(res, 400, { error: 'Invalid baseline runId' });
      return;
    }
    if (current && !isValidRunId(current)) {
      jsonResponse(res, 400, { error: 'Invalid current runId' });
      return;
    }

    try {
      const result =
        baseline && current ? compareReports(baseline, current) : compareLatestVsPrevious();

      // compare* returns either a ReportComparison or { error: string } — the
      // error object is truthy, so distinguish by shape, not by falsiness.
      if (!result || 'error' in result) {
        const message =
          result && 'error' in result
            ? result.error
            : 'Not enough archived runs to compare (need at least 2)';
        jsonResponse(res, 404, { error: message });
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
  const { port, open, idle } = parseServArgs(process.argv);
  idleEnabled = idle;

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
    console.log(
      `  ⏱️  Server ${idleEnabled ? `shuts down ${HEARTBEAT_TIMEOUT_MS / 1000}s after tab is closed` : 'persists (idle disabled)'}`,
    );
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

// Only start the server when executed directly (not when imported by tests).
// tsx runs this as CJS (package.json has no "type":"module"), so the
// require.main check works; avoid import.meta (breaks CJS test transpile).
const isMain = typeof require !== 'undefined' && require.main === module;
if (isMain) {
  main();
}

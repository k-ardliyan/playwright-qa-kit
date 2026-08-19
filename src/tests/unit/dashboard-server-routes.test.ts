import { test, expect } from '@playwright/test';
import * as http from 'node:http';
import { handleRequest } from '../../cli/dashboard-server';

/** Boot a real http server wired to the dashboard's handleRequest. */
async function withServer(fn: (base: string) => Promise<void>): Promise<void> {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch(() => {
      try {
        res.writeHead(500);
        res.end();
      } catch {
        /* already sent */
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/**
 * Raw GET with an explicit path (no URL normalization — http.request sends the
 * path verbatim, which is required to test ../ traversal guards that fetch
 * would resolve client-side).
 */
function getRaw(
  base: string,
  path: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(base);
    const req = http.request({ hostname: u.hostname, port: u.port, path, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test.describe('dashboard server routes', () => {
  test('GET / returns HTML with no-store and no CORS wildcard', async () => {
    await withServer(async (base) => {
      const r = await getRaw(base, '/');
      expect(r.status).toBe(200);
      expect(r.headers['content-type']).toContain('text/html');
      expect(r.headers['cache-control']).toContain('no-store');
      expect(r.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  test('GET /api/history returns JSON, no-store, no CORS wildcard', async () => {
    await withServer(async (base) => {
      const r = await getRaw(base, '/api/history');
      expect(r.status).toBe(200);
      expect(r.headers['content-type']).toContain('application/json');
      expect(r.headers['cache-control']).toContain('no-store');
      expect(r.headers['access-control-allow-origin']).toBeUndefined();
      const parsed = JSON.parse(r.body);
      expect(Array.isArray(parsed.history)).toBe(true);
    });
  });

  test('fragment detail path traversal returns 400', async () => {
    await withServer(async (base) => {
      const r = await getRaw(base, '/fragment/detail/../etc/passwd');
      expect(r.status).toBe(400);
    });
  });

  test('api archive path traversal returns 400', async () => {
    await withServer(async (base) => {
      const r = await getRaw(base, '/api/archive/../etc/passwd');
      expect(r.status).toBe(400);
    });
  });

  test('compare with invalid runId params returns 400', async () => {
    await withServer(async (base) => {
      const r = await getRaw(base, '/api/archive/compare?baseline=../etc&current=run-1');
      expect(r.status).toBe(400);
    });
  });

  test('compare with valid-format but nonexistent runs returns 404 (error shape)', async () => {
    await withServer(async (base) => {
      const r = await getRaw(
        base,
        '/api/archive/compare?baseline=run-20000101-000000-000&current=run-20000101-000001-000',
      );
      expect(r.status).toBe(404);
      const parsed = JSON.parse(r.body);
      expect(typeof parsed.error).toBe('string');
    });
  });

  test('unknown fragment returns 404', async () => {
    await withServer(async (base) => {
      const r = await getRaw(base, '/fragment/does-not-exist');
      expect(r.status).toBe(404);
    });
  });
});

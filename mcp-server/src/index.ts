import * as http from 'node:http';
import { getTestFailures } from './tools/get-test-failures';
import { normalizeRequirements } from './tools/normalize-requirements';
import { logger } from './utils/logger';

/**
 * Port contract aligned with framework configuration:
 * - default: 3100
 * - override via environment variable MCP_SERVER_PORT
 */
const DEFAULT_MCP_SERVER_PORT = 3100;
const rawPort = process.env.MCP_SERVER_PORT ?? String(DEFAULT_MCP_SERVER_PORT);
const MCP_SERVER_PORT = Number(rawPort);

if (!Number.isInteger(MCP_SERVER_PORT) || MCP_SERVER_PORT < 0 || MCP_SERVER_PORT > 65535) {
  throw new Error(
    `[mcp-server] Invalid port configuration: MCP_SERVER_PORT='${rawPort}'. ` +
      'Set MCP_SERVER_PORT to an integer between 1 and 65535.',
  );
}

if (MCP_SERVER_PORT === 0) {
  throw new Error(
    '[mcp-server] Invalid port configuration: MCP_SERVER_PORT is 0. ' +
      'Set MCP_SERVER_PORT to a fixed valid port (e.g. 3100).',
  );
}

function sendJson(res: http.ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw) as Record<string, unknown>;
}

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    const method = req.method ?? 'GET';
    const url = req.url ?? '/';

    if (method === 'GET' && url === '/health') {
      sendJson(res, 200, { status: 'ok', server: 'playwright-qa' });
      return;
    }

    if (method === 'POST' && url === '/tools/get_test_failures') {
      const output = getTestFailures();
      sendJson(res, 200, output);
      return;
    }

    if (method === 'POST' && url === '/tools/normalize_requirements') {
      const body = await readJsonBody(req);
      const requirementsText = body.requirementsText;

      if (typeof requirementsText !== 'string') {
        sendJson(res, 400, {
          status: 'error',
          error: {
            code: 'INVALID_INPUT',
            message: 'Body must include requirementsText as a string.',
          },
        });
        return;
      }

      const output = normalizeRequirements(requirementsText);
      sendJson(res, output.status === 'success' ? 200 : 400, output);
      return;
    }

    sendJson(res, 404, {
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: `Route not found: ${method} ${url}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    logger.error('Unhandled MCP server error.', { message });

    sendJson(res, 500, {
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    });
  }
});

server.listen(MCP_SERVER_PORT, () => {
  logger.info('Custom MCP server listening.', { port: MCP_SERVER_PORT });
});

export default server;

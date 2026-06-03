"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("node:http"));
const get_test_failures_1 = require("./tools/get-test-failures");
const normalize_requirements_1 = require("./tools/normalize-requirements");
const logger_1 = require("./utils/logger");
/**
 * Port contract aligned with framework configuration:
 * - default: 3100
 * - override via environment variable MCP_SERVER_PORT
 */
const DEFAULT_MCP_SERVER_PORT = 3100;
const rawPort = process.env.MCP_SERVER_PORT ?? String(DEFAULT_MCP_SERVER_PORT);
const MCP_SERVER_PORT = Number(rawPort);
if (!Number.isInteger(MCP_SERVER_PORT) || MCP_SERVER_PORT < 0 || MCP_SERVER_PORT > 65535) {
    throw new Error(`[mcp-server] Invalid port configuration: MCP_SERVER_PORT='${rawPort}'. ` +
        'Set MCP_SERVER_PORT to an integer between 1 and 65535.');
}
if (MCP_SERVER_PORT === 0) {
    throw new Error('[mcp-server] Invalid port configuration: MCP_SERVER_PORT is 0. ' +
        'Set MCP_SERVER_PORT to a fixed valid port (e.g. 3100).');
}
function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}
async function readJsonBody(req) {
    const chunks = [];
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
    return JSON.parse(raw);
}
const server = http.createServer(async (req, res) => {
    try {
        const method = req.method ?? 'GET';
        const url = req.url ?? '/';
        if (method === 'GET' && url === '/health') {
            sendJson(res, 200, { status: 'ok', server: 'playwright-qa' });
            return;
        }
        if (method === 'POST' && url === '/tools/get_test_failures') {
            const output = (0, get_test_failures_1.getTestFailures)();
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
            const output = (0, normalize_requirements_1.normalizeRequirements)(requirementsText);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected server error';
        logger_1.logger.error('Unhandled MCP server error.', { message });
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
    logger_1.logger.info('Custom MCP server listening.', { port: MCP_SERVER_PORT });
});
exports.default = server;
//# sourceMappingURL=index.js.map
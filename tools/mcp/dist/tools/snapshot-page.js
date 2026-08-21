"use strict";
/**
 * MCP tool: `snapshot_page`.
 *
 * Navigate to a URL, capture an ARIA snapshot, and persist a structured
 * selector catalog under `selector-catalog/<featureName>/<pageName>.{aria.yml,json}`.
 * The full tree is written to disk so the AI agent only sees a compact summary
 * in the MCP response.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotPage = snapshotPage;
const safety_1 = require("../utils/safety");
const snapshot_core_1 = require("./_internal/snapshot-core");
function readString(value, _field) {
    if (typeof value !== 'string')
        return null;
    if (value.trim().length === 0)
        return null;
    return value.trim();
}
function readNumber(value, _field) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim().length > 0) {
        const n = Number.parseFloat(value);
        if (Number.isFinite(n))
            return n;
    }
    return null;
}
function readBoolean(value) {
    return value === true || value === 'true';
}
function readWaitUntil(value) {
    if (value === 'networkidle' || value === 'domcontentloaded' || value === 'load')
        return value;
    return undefined;
}
async function snapshotPage(args) {
    if (!args || typeof args !== 'object') {
        return {
            status: 'error',
            message: 'Invalid arguments object.',
            error: { code: 'INVALID_INPUT', message: 'args must be an object.' },
        };
    }
    const url = readString(args.url, 'url');
    const featureName = readString(args.featureName, 'featureName');
    const pageName = readString(args.pageName, 'pageName');
    if (!url) {
        const err = (0, safety_1.createToolError)('INVALID_INPUT', '`url` is required and must be a non-empty string.');
        return { status: 'error', message: err.error.message, error: err.error };
    }
    if (!featureName) {
        const err = (0, safety_1.createToolError)('INVALID_INPUT', '`featureName` is required and must be a non-empty string.');
        return { status: 'error', message: err.error.message, error: err.error };
    }
    if (!pageName) {
        const err = (0, safety_1.createToolError)('INVALID_INPUT', '`pageName` is required and must be a non-empty string.');
        return { status: 'error', message: err.error.message, error: err.error };
    }
    const include = Array.isArray(args.include)
        ? args.include.filter((v) => typeof v === 'string')
        : undefined;
    const maxElements = readNumber(args.maxElements, 'maxElements') ?? snapshot_core_1.DEFAULT_MAX_ELEMENTS;
    const force = readBoolean(args.force);
    const waitUntil = readWaitUntil(args.waitUntil);
    const navigationTimeoutMs = readNumber(args.navigationTimeoutMs, 'navigationTimeoutMs') ?? undefined;
    try {
        const result = await (0, snapshot_core_1.snapshotPageCore)({
            url,
            featureName,
            pageName,
            waitForSelector: readString(args.waitForSelector, 'waitForSelector') ?? undefined,
            include,
            maxElements,
            force,
            waitUntil,
            navigationTimeoutMs: navigationTimeoutMs ?? undefined,
        });
        return {
            status: 'success',
            featureName: result.featureName,
            pageName: result.pageName,
            url: result.url,
            hash: result.hash,
            elementCount: result.elementCount,
            truncated: result.truncated,
            ariaYmlPath: result.ariaYmlRelativePath,
            selectorsJsonPath: result.selectorsJsonRelativePath,
            skipped: result.skipped,
            skipReason: result.skipReason,
            message: result.skipped
                ? `Catalog already fresh for "${result.pageName}". Reuse ${result.selectorsJsonRelativePath}.`
                : `Captured ${result.elementCount} element(s) → ${result.selectorsJsonRelativePath}`,
        };
    }
    catch (error) {
        if (error instanceof snapshot_core_1.SnapshotCoreError) {
            const err = (0, safety_1.createToolError)(error.code, error.message);
            return { status: 'error', message: err.error.message, error: err.error };
        }
        const message = error instanceof Error ? error.message : String(error);
        const err = (0, safety_1.createToolError)('TOOL_ERROR', message);
        return { status: 'error', message: err.error.message, error: err.error };
    }
}
//# sourceMappingURL=snapshot-page.js.map
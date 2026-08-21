"use strict";
/**
 * MCP tool: `discover_pages`.
 *
 * BFS auto-crawl a public site from a single entry point. For each unique URL:
 *   - extract `<a href>` (same origin only) for the frontier queue
 *   - skip URLs matching `excludePatterns` (regex) or with non-HTML extensions
 *   - respect robots.txt when enabled
 *   - call snapshotPageCore to persist the ARIA + selector catalog
 *
 * Output:
 *   - per-page catalog: selector-catalog/<featureName>/<pageName>.{aria.yml,json}
 *   - aggregate index: selector-catalog/<featureName>/page-map.json
 *   - checkpoint (every 5 pages): selector-catalog/<featureName>/.discover-state.json
 */
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
exports.discoverPages = discoverPages;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const playwright_1 = require("playwright");
const safety_1 = require("../utils/safety");
const workspace_paths_1 = require("../utils/workspace-paths");
const logger_1 = require("../utils/logger");
const snapshot_core_1 = require("./_internal/snapshot-core");
const BLOCKED_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.webp',
    '.ico',
    '.pdf',
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.gz',
    '.css',
    '.js',
    '.mjs',
    '.map',
    '.mp4',
    '.webm',
    '.mp3',
    '.wav',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
]);
const CHECKPOINT_INTERVAL = 5;
function readString(value, _field) {
    if (typeof value !== 'string')
        return null;
    if (value.trim().length === 0)
        return null;
    return value.trim();
}
function readNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim().length > 0) {
        const n = Number.parseFloat(value);
        if (Number.isFinite(n))
            return n;
    }
    return fallback;
}
function readBoolean(value, fallback = false) {
    if (typeof value === 'boolean')
        return value;
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    return fallback;
}
function normalizeUrl(rawUrl, baseUrl) {
    try {
        const cleaned = rawUrl.trim().split('#')[0];
        if (cleaned.length === 0)
            return null;
        if (/^(javascript:|mailto:|tel:|data:|about:)/i.test(cleaned))
            return null;
        const u = new URL(cleaned, baseUrl);
        if (!['http:', 'https:'].includes(u.protocol))
            return null;
        if (u.origin !== baseUrl.origin)
            return null;
        const pathname = u.pathname.toLowerCase();
        for (const ext of BLOCKED_EXTENSIONS) {
            if (pathname.endsWith(ext))
                return null;
        }
        return u;
    }
    catch {
        return null;
    }
}
function pageNameFromUrl(u) {
    const segments = u.pathname.split('/').filter((s) => s.length > 0);
    if (segments.length === 0)
        return 'home';
    const raw = segments[segments.length - 1].replace(/\.[a-z0-9]+$/i, '');
    const slug = raw
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
    return slug || 'page';
}
async function fetchRobots(baseUrl, userAgent) {
    try {
        const res = await fetch(`${baseUrl.origin}/robots.txt`, {
            headers: { 'User-Agent': userAgent },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok)
            return { disallowedPrefixes: [], crawlDelayMs: 0 };
        const text = await res.text();
        return parseRobots(text, userAgent);
    }
    catch {
        return { disallowedPrefixes: [], crawlDelayMs: 0 };
    }
}
function parseRobots(text, userAgent) {
    const lines = text.split(/\r?\n/);
    let applies = false;
    const disallowedPrefixes = [];
    let crawlDelayMs = 0;
    for (const rawLine of lines) {
        const line = rawLine.replace(/#.*$/, '').trim();
        if (line.length === 0)
            continue;
        const directive = line.split(':')[0]?.trim().toLowerCase();
        const value = line.slice(line.indexOf(':') + 1).trim();
        if (directive === 'user-agent') {
            const wildcardActive = value === '*';
            applies = value === userAgent || wildcardActive;
            continue;
        }
        if (!applies)
            continue;
        if (directive === 'disallow' && value.length > 0) {
            disallowedPrefixes.push(value);
        }
        else if (directive === 'crawl-delay') {
            const seconds = Number.parseFloat(value);
            if (Number.isFinite(seconds))
                crawlDelayMs = Math.round(seconds * 1000);
        }
    }
    return { disallowedPrefixes, crawlDelayMs };
}
function matchesAnyPattern(url, patterns) {
    return patterns.some((p) => url.pathname.startsWith(p));
}
function matchesExcludePatterns(url, patterns) {
    return patterns.some((re) => re.test(url.pathname) || re.test(url.href));
}
async function writeCheckpoint(absoluteDir, state) {
    const checkpointPath = path.join(absoluteDir, '.discover-state.json');
    fs.writeFileSync(checkpointPath, JSON.stringify(state, null, 2), 'utf8');
}
async function snapshotUrl(ctx, url, pageName) {
    try {
        return await (0, snapshot_core_1.snapshotPageCore)({
            url: url.href,
            featureName: ctx.featureName,
            pageName,
            maxElements: snapshot_core_1.DEFAULT_MAX_ELEMENTS,
            force: ctx.force,
            waitUntil: ctx.waitUntil,
        });
    }
    catch (error) {
        ctx.errors.push({
            url: url.href,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
async function discoverPages(args) {
    const start = Date.now();
    try {
        if (!args || typeof args !== 'object') {
            return {
                status: 'error',
                message: 'Invalid arguments object.',
                error: { code: 'INVALID_INPUT', message: 'args must be an object.' },
            };
        }
        const rootUrl = readString(args.rootUrl, 'rootUrl');
        const featureName = readString(args.featureName, 'featureName');
        if (!rootUrl) {
            const err = (0, safety_1.createToolError)('INVALID_INPUT', '`rootUrl` is required.');
            return { status: 'error', message: err.error.message, error: err.error };
        }
        if (!featureName) {
            const err = (0, safety_1.createToolError)('INVALID_INPUT', '`featureName` is required.');
            return { status: 'error', message: err.error.message, error: err.error };
        }
        let baseUrl;
        try {
            baseUrl = new URL(rootUrl);
        }
        catch {
            const err = (0, safety_1.createToolError)('INVALID_INPUT', `Invalid rootUrl: ${rootUrl}`);
            return { status: 'error', message: err.error.message, error: err.error };
        }
        const maxDepth = readNumber(args.maxDepth, 2);
        const maxPages = readNumber(args.maxPages, 25);
        const requestDelayMs = readNumber(args.requestDelayMs, 200);
        const respectRobots = readBoolean(args.respectRobots, true);
        const force = readBoolean(args.force, false);
        const waitUntil = args.waitUntil === 'domcontentloaded' || args.waitUntil === 'load'
            ? args.waitUntil
            : 'networkidle';
        const excludePatterns = Array.isArray(args.excludePatterns)
            ? args.excludePatterns.filter((v) => typeof v === 'string')
            : [];
        let excludeRegex;
        try {
            excludeRegex = excludePatterns.map((p) => new RegExp(p));
        }
        catch (error) {
            const err = (0, safety_1.createToolError)('INVALID_INPUT', `Invalid excludePatterns regex: ${error instanceof Error ? error.message : String(error)}`);
            return { status: 'error', message: err.error.message, error: err.error };
        }
        return await runDiscover({
            baseUrl,
            featureName,
            maxDepth,
            maxPages,
            excludeRegex,
            requestDelayMs,
            respectRobots,
            waitUntil,
            force,
            startedAt: start,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const err = (0, safety_1.createToolError)('TOOL_ERROR', message);
        return { status: 'error', message: err.error.message, error: err.error };
    }
}
async function runDiscover(input) {
    const userAgent = 'playwright-qa-kit/2.1 (discover_pages)';
    let robotsPrefixes = [];
    if (input.respectRobots) {
        const robots = await fetchRobots(input.baseUrl, userAgent);
        robotsPrefixes = robots.disallowedPrefixes;
        if (robots.crawlDelayMs > input.requestDelayMs) {
            // Use the more conservative of the two.
            Object.assign(input, { requestDelayMs: robots.crawlDelayMs });
        }
    }
    // Resolve the feature directory up front for checkpoint + page-map writes.
    const { resolveAllowedPath } = await Promise.resolve().then(() => __importStar(require('../utils/safety')));
    const dirResolved = resolveAllowedPath(`${workspace_paths_1.mcpWorkspace.selectorCatalogRel}/${input.featureName}`, 'selector-catalog', { mustExist: false, readOnly: false });
    if (!dirResolved.ok) {
        return {
            status: 'error',
            message: dirResolved.error.message,
            error: dirResolved.error,
        };
    }
    const absoluteDir = dirResolved.absolutePath;
    if (!fs.existsSync(absoluteDir))
        fs.mkdirSync(absoluteDir, { recursive: true });
    const ctx = {
        browser: await playwright_1.chromium.launch({ headless: true }),
        baseUrl: input.baseUrl,
        featureName: input.featureName,
        maxDepth: input.maxDepth,
        maxPages: input.maxPages,
        excludeRegex: input.excludeRegex,
        robotsPrefixes,
        requestDelayMs: input.requestDelayMs,
        waitUntil: input.waitUntil,
        force: input.force,
        visited: new Set(),
        pages: [],
        skipped: [],
        errors: [],
    };
    try {
        const context = await ctx.browser.newContext({ userAgent });
        const page = await context.newPage();
        const queue = [{ url: input.baseUrl, depth: 0 }];
        while (queue.length > 0) {
            if (ctx.pages.length >= ctx.maxPages)
                break;
            const current = queue.shift();
            if (!current)
                break;
            const { url, depth } = current;
            const normalized = url.href.replace(/\/$/, '') || '/';
            if (ctx.visited.has(normalized))
                continue;
            ctx.visited.add(normalized);
            if (ctx.robotsPrefixes.length > 0 && matchesAnyPattern(url, ctx.robotsPrefixes)) {
                ctx.skipped.push({ url: url.href, reason: 'robots_disallow' });
                continue;
            }
            if (matchesExcludePatterns(url, ctx.excludeRegex)) {
                ctx.skipped.push({ url: url.href, reason: 'exclude_pattern' });
                continue;
            }
            // Politeness delay.
            if (ctx.requestDelayMs > 0) {
                await new Promise((r) => setTimeout(r, ctx.requestDelayMs));
            }
            const pageName = pageNameFromUrl(url);
            const result = await snapshotUrl(ctx, url, pageName);
            if (result && !result.skipped) {
                const title = await page.title().catch(() => '');
                ctx.pages.push({
                    url: url.href,
                    pageName: result.pageName,
                    title: title ?? '',
                    hash: result.hash,
                    elementCount: result.elementCount,
                    depth,
                    truncated: result.truncated,
                });
            }
            else if (result?.skipped) {
                ctx.skipped.push({ url: url.href, reason: result.skipReason ?? 'catalog_fresh' });
            }
            // Discover more links if we still have depth budget.
            if (depth < ctx.maxDepth) {
                try {
                    await page.goto(url.href, { waitUntil: ctx.waitUntil });
                    const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href') ?? ''));
                    for (const href of hrefs) {
                        const nextUrl = normalizeUrl(href, input.baseUrl);
                        if (!nextUrl)
                            continue;
                        const nextNormalized = nextUrl.href.replace(/\/$/, '') || '/';
                        if (ctx.visited.has(nextNormalized))
                            continue;
                        if (ctx.robotsPrefixes.length > 0 && matchesAnyPattern(nextUrl, ctx.robotsPrefixes))
                            continue;
                        if (matchesExcludePatterns(nextUrl, ctx.excludeRegex))
                            continue;
                        queue.push({ url: nextUrl, depth: depth + 1 });
                    }
                }
                catch (error) {
                    ctx.errors.push({
                        url: url.href,
                        error: `link extraction failed: ${error instanceof Error ? error.message : String(error)}`,
                    });
                }
            }
            // Checkpoint
            if (ctx.pages.length % CHECKPOINT_INTERVAL === 0 && ctx.pages.length > 0) {
                await writeCheckpoint(absoluteDir, {
                    visited: Array.from(ctx.visited),
                    queue: queue.map((q) => ({ url: q.url.href, depth: q.depth })),
                    startedAt: new Date(input.startedAt).toISOString(),
                });
            }
        }
        await context.close();
    }
    finally {
        await ctx.browser.close();
    }
    const pageMap = {
        rootUrl: input.baseUrl.href,
        featureName: input.featureName,
        crawledAt: new Date().toISOString(),
        pages: ctx.pages,
        skipped: ctx.skipped,
        errors: ctx.errors,
    };
    const pageMapPath = path.join(absoluteDir, 'page-map.json');
    fs.writeFileSync(pageMapPath, JSON.stringify(pageMap, null, 2), 'utf8');
    // Cleanup checkpoint on success.
    const checkpointPath = path.join(absoluteDir, '.discover-state.json');
    if (fs.existsSync(checkpointPath))
        fs.unlinkSync(checkpointPath);
    const relativePageMapPath = path.relative((0, safety_1.getRepoRoot)(), pageMapPath).replace(/\\/g, '/');
    logger_1.logger.info('discover_pages completed', {
        featureName: input.featureName,
        pagesDiscovered: ctx.pages.length,
        skipped: ctx.skipped.length,
        errors: ctx.errors.length,
        durationMs: Date.now() - input.startedAt,
    });
    return {
        status: 'success',
        rootUrl: input.baseUrl.href,
        featureName: input.featureName,
        pagesDiscovered: ctx.pages.length,
        skippedCount: ctx.skipped.length,
        errorCount: ctx.errors.length,
        pageMapPath: relativePageMapPath,
        durationMs: Date.now() - input.startedAt,
        message: `Discovered ${ctx.pages.length} page(s) under ${input.featureName}/ (skipped ${ctx.skipped.length}, errors ${ctx.errors.length}).`,
    };
}
//# sourceMappingURL=discover-pages.js.map
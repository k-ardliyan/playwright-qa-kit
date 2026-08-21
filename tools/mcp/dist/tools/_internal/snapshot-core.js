"use strict";
/**
 * Shared core for snapshot_page and discover_pages MCP tools.
 *
 * - Launches a headless Chromium via `playwright`.
 * - Navigates to a URL with optional waitForSelector.
 * - Captures ARIA snapshot (YAML accessibility tree).
 * - Extracts structured selector candidates for interactive nodes, prioritised
 *   according to Playwright 2026 best practice:
 *     getByRole > getByLabel > getByText > getByPlaceholder > getByTestId > CSS.
 * - Writes two files under `selector-catalog/<featureName>/`:
 *     `<pageName>.aria.yml`  — full ARIA tree (for `toMatchAriaSnapshot()`).
 *     `<pageName>.json`      — flat selector index (for AI agents).
 * - Returns a `SnapshotResult` summary. The MCP boundary formats this as a
 *   compact response so AI agents only see the path / counts / hash, not the
 *   full tree.
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
exports.SnapshotCoreError = exports.DEFAULT_WAIT_UNTIL = exports.DEFAULT_NAVIGATION_TIMEOUT_MS = exports.DEFAULT_MAX_ELEMENTS = exports.SELECTOR_CATALOG_MAX_FILES = void 0;
exports.snapshotPageCore = snapshotPageCore;
const crypto = __importStar(require("node:crypto"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const playwright_1 = require("playwright");
const safety_1 = require("../../utils/safety");
const logger_1 = require("../../utils/logger");
exports.SELECTOR_CATALOG_MAX_FILES = Number.parseInt(process.env.SELECTOR_CATALOG_MAX_FILES ?? '100', 10);
exports.DEFAULT_MAX_ELEMENTS = 500;
exports.DEFAULT_NAVIGATION_TIMEOUT_MS = 30000;
exports.DEFAULT_WAIT_UNTIL = 'networkidle';
class SnapshotCoreError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'SnapshotCoreError';
    }
}
exports.SnapshotCoreError = SnapshotCoreError;
const INTERACTIVE_ROLES = new Set([
    'button',
    'link',
    'textbox',
    'checkbox',
    'radio',
    'combobox',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'switch',
    'tab',
    'searchbox',
    'spinbutton',
    'slider',
    'heading',
]);
// Captures: [1] role token, [2] quoted name, [3] unquoted name (no brackets)
const FRAGMENT_LINE_RE = /^\s*-\s+([a-zA-Z][\w-]*)(?:\s+(?:"([^"]+)"|([^\s["]+)))?(?:\s+\[[^\]]*\])?/;
function parseAriaTree(yaml) {
    const lines = yaml.split(/\r?\n/);
    const nodes = [];
    for (const line of lines) {
        const trimmed = line.replace(/\s+$/, '');
        if (trimmed.length === 0)
            continue;
        const match = trimmed.match(FRAGMENT_LINE_RE);
        if (!match)
            continue;
        const role = match[1].toLowerCase();
        const name = match[2] ?? match[3] ?? null;
        nodes.push({
            raw: trimmed,
            indent: line.search(/\S/),
            role,
            name: name ? name.trim() : null,
        });
    }
    return nodes;
}
function escapeForStringLiteral(value) {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
function buildCandidates(role, name, hasTestId, testId) {
    const candidates = [];
    if (name) {
        candidates.push({
            source: 'role',
            expression: `page.getByRole('${role}', { name: '${escapeForStringLiteral(name)}', exact: true })`,
        });
        if (['textbox', 'searchbox', 'combobox', 'spinbutton'].includes(role)) {
            candidates.push({
                source: 'label',
                expression: `page.getByLabel('${escapeForStringLiteral(name)}')`,
            });
        }
        candidates.push({
            source: 'text',
            expression: `page.getByText('${escapeForStringLiteral(name)}', { exact: true })`,
        });
    }
    if (hasTestId && testId) {
        candidates.push({
            source: 'testId',
            expression: `page.getByTestId('${escapeForStringLiteral(testId)}')`,
        });
    }
    candidates.push({
        source: 'css',
        expression: `[role="${role}"]${name ? `:has-text("${escapeForStringLiteral(name)}")` : ''}`,
    });
    return candidates;
}
async function pickPrimary(page, role, name, hasTestId, testId) {
    const roleArg = role;
    // P1: getByRole(name, exact)
    if (name) {
        try {
            const locator = page.getByRole(roleArg, { name, exact: true });
            if ((await locator.count()) === 1) {
                return {
                    primary: `page.getByRole('${role}', { name: '${escapeForStringLiteral(name)}', exact: true })`,
                    fragile: false,
                };
            }
        }
        catch {
            // Role may not be valid for this element; skip.
        }
        // P2: getByLabel
        if (['textbox', 'searchbox', 'combobox', 'spinbutton'].includes(role)) {
            try {
                const locator = page.getByLabel(name);
                if ((await locator.count()) === 1) {
                    return {
                        primary: `page.getByLabel('${escapeForStringLiteral(name)}')`,
                        fragile: false,
                    };
                }
            }
            catch {
                // No associated label.
            }
        }
        // P3: getByText
        try {
            const locator = page.getByText(name, { exact: true });
            if ((await locator.count()) === 1) {
                return {
                    primary: `page.getByText('${escapeForStringLiteral(name)}', { exact: true })`,
                    fragile: false,
                };
            }
        }
        catch {
            // Text not unique.
        }
    }
    // P4: getByTestId
    if (hasTestId && testId) {
        try {
            const locator = page.getByTestId(testId);
            if ((await locator.count()) === 1) {
                return {
                    primary: `page.getByTestId('${escapeForStringLiteral(testId)}')`,
                    fragile: false,
                };
            }
        }
        catch {
            // Test ID invalid.
        }
    }
    // P5: CSS fallback (fragile)
    return {
        primary: null,
        fragile: true,
    };
}
async function extractElements(page, scope, maxElements) {
    const ariaYaml = scope
        ? await page.locator(scope).first().ariaSnapshot()
        : await page.ariaSnapshot();
    const nodes = parseAriaTree(ariaYaml ?? '');
    const interactiveNodes = nodes.filter((n) => n.role && INTERACTIVE_ROLES.has(n.role));
    const truncated = interactiveNodes.length > maxElements;
    const sliced = interactiveNodes.slice(0, maxElements);
    const testIdMap = await page.evaluate(`(() => {
    const out = {};
    document.querySelectorAll('[data-testid]').forEach((el) => {
      const name = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 80);
      if (name) out[name] = el.getAttribute('data-testid');
    });
    return out;
  })()`);
    const elements = [];
    for (const node of sliced) {
        const name = node.name ?? '';
        const role = node.role ?? '';
        const testId = testIdMap[name];
        const hasTestId = typeof testId === 'string' && testId.length > 0;
        const candidates = buildCandidates(role, name, hasTestId, testId ?? null);
        const { primary, fragile } = await pickPrimary(page, role, name, hasTestId, testId ?? null);
        elements.push({
            role,
            name,
            primary,
            candidates,
            fragile,
        });
    }
    return { elements, truncated };
}
function sanitizePageName(name) {
    const cleaned = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-');
    return cleaned.length > 0 ? cleaned.slice(0, 64) : 'page';
}
function sanitizeFeatureName(name) {
    const cleaned = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-');
    if (cleaned.length === 0 || cleaned.startsWith('-')) {
        throw new SnapshotCoreError(`Invalid featureName: "${name}". Use lowercase letters, digits, '-' or '_'.`, 'INVALID_INPUT');
    }
    return cleaned.slice(0, 64);
}
function ensureFeatureDir(featureName) {
    const resolved = (0, safety_1.resolveAllowedPath)(`selector-catalog/${featureName}`, 'selector-catalog', {
        mustExist: false,
        readOnly: false,
    });
    if (!resolved.ok) {
        throw new SnapshotCoreError(`Cannot resolve feature directory: ${resolved.error.message}`, resolved.error.code);
    }
    if (!fs.existsSync(resolved.absolutePath)) {
        fs.mkdirSync(resolved.absolutePath, { recursive: true });
    }
    return { absoluteDir: resolved.absolutePath, relativeDir: resolved.relativePath };
}
function countFilesInFeatureDir(absoluteDir) {
    if (!fs.existsSync(absoluteDir))
        return 0;
    return fs.readdirSync(absoluteDir, { withFileTypes: true }).filter((entry) => entry.isFile())
        .length;
}
async function navigateAndCapture(page, options, ariaYamlOverride) {
    const navigationTimeout = options.navigationTimeoutMs ?? exports.DEFAULT_NAVIGATION_TIMEOUT_MS;
    page.setDefaultNavigationTimeout(navigationTimeout);
    page.setDefaultTimeout(navigationTimeout);
    const waitUntil = options.waitUntil ?? exports.DEFAULT_WAIT_UNTIL;
    await page.goto(options.url, { waitUntil });
    if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: navigationTimeout });
    }
    const ariaYaml = ariaYamlOverride ?? (await page.ariaSnapshot());
    const scope = options.include?.[0] ?? null;
    const { elements, truncated } = await extractElements(page, scope, options.maxElements ?? exports.DEFAULT_MAX_ELEMENTS);
    return { ariaYaml, truncated, elements };
}
async function snapshotPageCore(options) {
    if (!options.url || !/^https?:\/\//i.test(options.url)) {
        throw new SnapshotCoreError(`Invalid url: "${options.url}". Must start with http:// or https://.`, 'INVALID_INPUT');
    }
    const featureName = sanitizeFeatureName(options.featureName);
    const pageName = sanitizePageName(options.pageName);
    const { absoluteDir, relativeDir } = ensureFeatureDir(featureName);
    const ariaRelPath = `${relativeDir}/${pageName}.aria.yml`;
    const jsonRelPath = `${relativeDir}/${pageName}.json`;
    const ariaAbsPath = path.join((0, safety_1.getRepoRoot)(), ariaRelPath);
    const jsonAbsPath = path.join((0, safety_1.getRepoRoot)(), jsonRelPath);
    if (!options.force && fs.existsSync(ariaAbsPath) && fs.existsSync(jsonAbsPath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(jsonAbsPath, 'utf8'));
            const sameUrl = existing.url === options.url;
            return {
                featureName,
                pageName,
                url: options.url,
                hash: existing.hash,
                elementCount: existing.elementCount,
                truncated: existing.truncated,
                ariaYmlRelativePath: ariaRelPath,
                selectorsJsonRelativePath: jsonRelPath,
                skipped: sameUrl,
                skipReason: sameUrl ? 'catalog_fresh' : 'catalog_url_changed_force_required',
            };
        }
        catch {
            // Fall through to re-snapshot if the existing file is unreadable.
        }
    }
    const existingCount = countFilesInFeatureDir(absoluteDir);
    if (existingCount >= exports.SELECTOR_CATALOG_MAX_FILES) {
        throw new SnapshotCoreError(`Feature "${featureName}" already has ${existingCount} catalog files. Hard cap ${exports.SELECTOR_CATALOG_MAX_FILES}. Set SELECTOR_CATALOG_MAX_FILES to raise or delete old files.`, 'CAP_EXCEEDED');
    }
    const browser = await playwright_1.chromium.launch({ headless: true });
    let context = null;
    try {
        context = await browser.newContext();
        const page = await context.newPage();
        const { ariaYaml, truncated, elements } = await navigateAndCapture(page, options);
        const hash = crypto.createHash('sha256').update(ariaYaml).digest('hex');
        fs.writeFileSync(ariaAbsPath, ariaYaml, 'utf8');
        const index = {
            featureName,
            pageName,
            url: options.url,
            hash,
            capturedAt: new Date().toISOString(),
            truncated,
            elementCount: elements.length,
            elements,
        };
        fs.writeFileSync(jsonAbsPath, JSON.stringify(index, null, 2), 'utf8');
        logger_1.logger.info('snapshot_page persisted catalog', {
            featureName,
            pageName,
            elementCount: elements.length,
            truncated,
            hash,
        });
        return {
            featureName,
            pageName,
            url: options.url,
            hash,
            elementCount: elements.length,
            truncated,
            ariaYmlRelativePath: ariaRelPath,
            selectorsJsonRelativePath: jsonRelPath,
        };
    }
    finally {
        if (context)
            await context.close();
        await browser.close();
    }
}
//# sourceMappingURL=snapshot-core.js.map
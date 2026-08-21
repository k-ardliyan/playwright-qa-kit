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
exports.normalizePinnedVersion = normalizePinnedVersion;
exports.assessPlaywrightMcp = assessPlaywrightMcp;
exports.healthCheck = healthCheck;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const playwright_paths_1 = require("../utils/playwright-paths");
const safety_1 = require("../utils/safety");
const workspace_paths_1 = require("../utils/workspace-paths");
function checkNodeVersion() {
    const version = process.versions.node;
    const [major, minor] = version.split('.').map(Number);
    const ok = major > 20 || (major === 20 && minor >= 19);
    if (ok) {
        return { name: 'node', status: 'ok', message: `Node.js ${version}` };
    }
    return {
        name: 'node',
        status: 'fail',
        message: `Node.js ${version} — requires >= 20.19.0`,
    };
}
function checkMcpBuild() {
    const entry = path.join((0, safety_1.getRepoRoot)(), 'tools', 'mcp', 'dist', 'index-mcp.js');
    if (fs.existsSync(entry)) {
        return { name: 'mcp_build', status: 'ok', message: 'playwright-qa MCP build present' };
    }
    return {
        name: 'mcp_build',
        status: 'fail',
        message: 'Missing tools/mcp/dist/index-mcp.js — run: npm run mcp:build',
    };
}
/**
 * Normalize a package spec like "^0.0.79", "~0.0.79" or "0.0.79" to the exact version.
 * Returns null when no concrete version can be pinned.
 */
function normalizePinnedVersion(spec) {
    if (!spec)
        return null;
    const m = spec.match(/(\d+\.\d+\.\d+)/);
    return m ? m[1] : null;
}
/**
 * Resolve the MCP baseline from the repository's pinned dependency so the health
 * check and the canonical version constant never drift independently.
 */
function getExpectedPlaywrightMcpVersion() {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join((0, safety_1.getRepoRoot)(), 'package.json'), 'utf-8'));
        return normalizePinnedVersion(pkg.devDependencies?.['@playwright/mcp']);
    }
    catch {
        return null;
    }
}
/**
 * Pure assessment of installed vs expected MCP version.
 * Exported for unit testing (match / mismatch / missing).
 */
function assessPlaywrightMcp(installed, expectedVersion) {
    if (!installed) {
        return {
            name: 'playwright_mcp',
            status: 'fail',
            message: 'Missing @playwright/mcp — run: npm install',
        };
    }
    if (!expectedVersion) {
        return {
            name: 'playwright_mcp',
            status: 'ok',
            message: `@playwright/mcp ${installed}`,
        };
    }
    if (installed === expectedVersion) {
        return {
            name: 'playwright_mcp',
            status: 'ok',
            message: `@playwright/mcp ${installed} (expected: ${expectedVersion})`,
        };
    }
    return {
        name: 'playwright_mcp',
        status: 'warn',
        message: `@playwright/mcp ${installed} — expected baseline is ${expectedVersion}`,
    };
}
function checkPlaywrightMcp() {
    const pkgPath = path.join((0, safety_1.getRepoRoot)(), 'node_modules', '@playwright', 'mcp', 'package.json');
    const expected = getExpectedPlaywrightMcpVersion();
    if (!fs.existsSync(pkgPath)) {
        return assessPlaywrightMcp(null, expected);
    }
    let installed;
    try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        installed = pkgJson.version ?? null;
    }
    catch {
        // Malformed metadata is treated as present-but-unavailable; keep lenient.
        return { name: 'playwright_mcp', status: 'ok', message: '@playwright/mcp installed' };
    }
    return assessPlaywrightMcp(installed, expected);
}
function checkPlaywrightTest() {
    const pkg = path.join((0, safety_1.getRepoRoot)(), 'node_modules', '@playwright', 'test');
    if (!fs.existsSync(pkg)) {
        return {
            name: 'playwright_test',
            status: 'fail',
            message: 'Missing @playwright/test — run: npm install',
        };
    }
    try {
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf-8'));
        const version = pkgJson.version ?? 'unknown';
        const [major, minor] = version.split('.').map(Number);
        if (major > 1 || (major === 1 && minor >= 56)) {
            return {
                name: 'playwright_test',
                status: 'ok',
                message: `@playwright/test ${version} (supports run-test-mcp-server)`,
            };
        }
        return {
            name: 'playwright_test',
            status: 'warn',
            message: `@playwright/test ${version} — run-test-mcp-server needs >= 1.56`,
        };
    }
    catch {
        return { name: 'playwright_test', status: 'ok', message: '@playwright/test installed' };
    }
}
function checkEnvironmentFile() {
    let appEnv = process.env.APP_ENV ?? 'local';
    let source = process.env.APP_ENV_SOURCE ?? 'unknown';
    try {
        // Prefer pre-load resolve when APP_ENV_SOURCE not yet stamped
        if (!process.env.APP_ENV_SOURCE) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { resolveAppEnv } = require(path.join((0, safety_1.getRepoRoot)(), 'src/utils/app-env'));
            const r = resolveAppEnv({ repoRoot: (0, safety_1.getRepoRoot)() });
            appEnv = r.appEnv;
            source = r.source;
        }
    }
    catch {
        // keep process.env fallback
    }
    const candidates = [
        path.join((0, safety_1.getRepoRoot)(), 'config', 'environments', `${appEnv}.env`),
        path.join((0, safety_1.getRepoRoot)(), 'config', 'environments', `${appEnv}.env.example`),
        path.join((0, safety_1.getRepoRoot)(), 'environments', `${appEnv}.env`),
        path.join((0, safety_1.getRepoRoot)(), 'environments', `${appEnv}.env.example`),
    ];
    for (const file of candidates) {
        if (fs.existsSync(file)) {
            const kind = file.endsWith('.example') ? 'template' : 'credentials';
            const rel = path.relative((0, safety_1.getRepoRoot)(), file).replace(/\\/g, '/');
            return {
                name: 'environment',
                status: kind === 'template' ? 'warn' : 'ok',
                message: `Using ${rel} (${kind}) for APP_ENV=${appEnv} (source=${source})`,
            };
        }
    }
    return {
        name: 'environment',
        status: 'fail',
        message: `No config/environments/${appEnv}.env or .env.example found (source=${source})`,
    };
}
function checkPlaywrightConfig() {
    const configPath = (0, playwright_paths_1.getPlaywrightConfigPath)();
    const absolute = (0, playwright_paths_1.resolvePlaywrightConfigAbsolute)((0, safety_1.getRepoRoot)());
    if (fs.existsSync(absolute)) {
        return {
            name: 'playwright_config',
            status: 'ok',
            message: `PLAYWRIGHT_CONFIG=${configPath}`,
        };
    }
    return {
        name: 'playwright_config',
        status: 'fail',
        message: `PLAYWRIGHT_CONFIG=${configPath} — file not found at ${configPath}`,
    };
}
function checkBaseUrl() {
    const baseUrl = process.env.BASE_URL;
    if (baseUrl && baseUrl.length > 0) {
        return { name: 'base_url', status: 'ok', message: `BASE_URL=${baseUrl}` };
    }
    return {
        name: 'base_url',
        status: 'warn',
        message: 'BASE_URL not set — Playwright config falls back to http://localhost:3000',
    };
}
function checkAuthChallengeMode() {
    const mode = (process.env.AUTH_CHALLENGE_MODE ?? 'none').trim().toLowerCase() || 'none';
    const interactive = mode !== 'none' && mode !== '';
    const ci = (() => {
        const v = (process.env.CI ?? '').trim().toLowerCase();
        return v === 'true' || v === '1' || v === 'yes';
    })();
    if (interactive && ci) {
        return {
            name: 'auth_challenge',
            status: 'fail',
            message: `AUTH_CHALLENGE_MODE=${mode} is interactive and forbidden under CI. ` +
                'Set AUTH_CHALLENGE_MODE=none for CI, or run auth:setup locally.',
        };
    }
    if (interactive) {
        // auto can fall back to otp-stdin under headless+TTY; only warn hard for browser-only modes
        const needsHeaded = mode === 'otp-browser' || mode === 'captcha-browser';
        const autoHeadless = mode === 'auto';
        const headless = (process.env.HEADLESS ?? 'true').trim().toLowerCase();
        const isHeadless = !(headless === 'false' || headless === '0' || headless === 'no');
        if (needsHeaded && isHeadless) {
            return {
                name: 'auth_challenge',
                status: 'warn',
                message: `AUTH_CHALLENGE_MODE=${mode} requires HEADLESS=false. ` +
                    'Use npm run auth:setup:headed or set HEADLESS=false via env:edit.',
            };
        }
        if (autoHeadless && isHeadless) {
            return {
                name: 'auth_challenge',
                status: 'ok',
                message: `AUTH_CHALLENGE_MODE=auto with HEADLESS=true — OTP will use stdin if TTY available; ` +
                    'prefer auth:setup:headed for browser-first OTP.',
            };
        }
        return {
            name: 'auth_challenge',
            status: 'ok',
            message: `AUTH_CHALLENGE_MODE=${mode} (local assisted — not for CI)`,
        };
    }
    return {
        name: 'auth_challenge',
        status: 'ok',
        message: 'AUTH_CHALLENGE_MODE=none',
    };
}
function checkJsonReporterOutput() {
    const relativePath = (0, playwright_paths_1.getJsonResultsPath)();
    const resultsJson = path.join((0, safety_1.getRepoRoot)(), relativePath);
    const overrideNote = process.env.PLAYWRIGHT_RESULTS_JSON?.trim()
        ? ' (PLAYWRIGHT_RESULTS_JSON override)'
        : '';
    if (fs.existsSync(resultsJson)) {
        return {
            name: 'json_results',
            status: 'ok',
            message: `${relativePath} exists (from last test run)${overrideNote}`,
        };
    }
    return {
        name: 'json_results',
        status: 'warn',
        message: `${relativePath} not found — run tests with PLAYWRIGHT_CONFIG=${(0, playwright_paths_1.getPlaywrightConfigPath)()} to populate Healer input`,
    };
}
/** Soft check: file-content deps + fixture bank (local-first file capabilities). */
function checkFileContentCapability() {
    const root = (0, safety_1.getRepoRoot)();
    const missing = [];
    try {
        require.resolve('pdf-parse', { paths: [root, path.join(root, 'tools', 'mcp')] });
    }
    catch {
        missing.push('pdf-parse');
    }
    try {
        require.resolve('exceljs', { paths: [root, path.join(root, 'tools', 'mcp')] });
    }
    catch {
        missing.push('exceljs');
    }
    const fixtures = workspace_paths_1.mcpWorkspace.testDataDir;
    if (!fs.existsSync(fixtures)) {
        missing.push('tests/data/');
    }
    if (missing.length > 0) {
        return {
            name: 'file_content',
            status: 'warn',
            message: `File capability incomplete (missing: ${missing.join(', ')}). ` +
                'Install pdf-parse/exceljs and ensure tests/data/ exists for @download/@upload/@file-content.',
        };
    }
    return {
        name: 'file_content',
        status: 'ok',
        message: 'pdf-parse + exceljs + tests/data/ available for file content asserts',
    };
}
/** Soft check: network-assert helpers + demo contract fixture. */
function checkNetworkAssertCapability() {
    const root = (0, safety_1.getRepoRoot)();
    const missing = [];
    const helper = path.join(root, 'src', 'support', 'pw', 'network-assert.ts');
    const core = path.join(root, 'src', 'support', 'pw', 'network-assert-core.ts');
    const contractCandidate = path.join(workspace_paths_1.mcpWorkspace.testDataDir, 'network', 'contracts', 'demo', 'submit-success.json');
    if (!fs.existsSync(helper))
        missing.push('src/support/pw/network-assert.ts');
    if (!fs.existsSync(core))
        missing.push('src/support/pw/network-assert-core.ts');
    if (!fs.existsSync(contractCandidate)) {
        missing.push('tests/data/network/contracts/demo/submit-success.json');
    }
    if (missing.length > 0) {
        return {
            name: 'network_assert',
            status: 'warn',
            message: `Network-assert capability incomplete (missing: ${missing.join(', ')}). ` +
                'Restore network-assert helpers and demo contract for @network-assert.',
        };
    }
    return {
        name: 'network_assert',
        status: 'ok',
        message: 'network-assert helpers + demo contract available for live payload/response checks',
    };
}
function checkAuthStorageState() {
    const root = (0, safety_1.getRepoRoot)();
    let appEnv = 'local';
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(path.join(root, 'src/utils/app-env'));
        appEnv = mod.resolveAppEnv({ repoRoot: root }).appEnv;
    }
    catch {
        // keep default
    }
    const authDir = path.join(root, '.auth', appEnv);
    if (!fs.existsSync(authDir)) {
        return {
            name: 'auth_storage',
            status: 'warn',
            message: `.auth/${appEnv}/ not found — run: npm run auth:setup (required for authenticated tests)`,
        };
    }
    const stateFiles = fs.readdirSync(authDir).filter((f) => f.endsWith('.json'));
    if (stateFiles.length === 0) {
        return {
            name: 'auth_storage',
            status: 'warn',
            message: `.auth/${appEnv}/ is empty — run: npm run auth:setup to generate storage state files`,
        };
    }
    return {
        name: 'auth_storage',
        status: 'ok',
        message: `.auth/${appEnv}/ has ${stateFiles.length} storage state file(s): ${stateFiles.join(', ')}`,
    };
}
function healthCheck() {
    const checks = [
        checkNodeVersion(),
        checkMcpBuild(),
        checkPlaywrightMcp(),
        checkPlaywrightTest(),
        checkEnvironmentFile(),
        checkPlaywrightConfig(),
        checkBaseUrl(),
        checkAuthChallengeMode(),
        checkAuthStorageState(),
        checkJsonReporterOutput(),
        checkFileContentCapability(),
        checkNetworkAssertCapability(),
    ];
    const hasFail = checks.some((c) => c.status === 'fail');
    const status = hasFail ? 'error' : 'success';
    const message = hasFail
        ? 'One or more health checks failed.'
        : 'All required health checks passed.';
    return { status, checks, message };
}
//# sourceMappingURL=health-check.js.map
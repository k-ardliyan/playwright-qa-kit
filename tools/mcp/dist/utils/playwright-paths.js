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
exports.getPlaywrightTestRoot = getPlaywrightTestRoot;
exports.getPlaywrightConfigPath = getPlaywrightConfigPath;
exports.getAdapterTestRoot = getAdapterTestRoot;
exports.getAdapterConfigPath = getAdapterConfigPath;
exports.getAdapterFixtureImport = getAdapterFixtureImport;
exports.getAdapterJsonResultsPath = getAdapterJsonResultsPath;
exports.getJsonResultsPath = getJsonResultsPath;
exports.resolvePlaywrightConfigAbsolute = resolvePlaywrightConfigAbsolute;
exports.isUnderAllowedTestRoot = isUnderAllowedTestRoot;
exports.getAdapterTraceabilityExemptPrefix = getAdapterTraceabilityExemptPrefix;
exports.isAdapterSpecPath = isAdapterSpecPath;
const path = __importStar(require("node:path"));
const DEFAULT_TEST_ROOT = 'tests';
const DEFAULT_CONFIG_PATH = 'playwright.config.ts';
const DEFAULT_JSON_RESULTS = 'artifacts/test-results/results.json';
const DEFAULT_ADAPTER_TEST_ROOT = 'examples/erpku/tests';
const DEFAULT_ADAPTER_CONFIG_PATH = 'examples/erpku/playwright.config.ts';
const DEFAULT_ADAPTER_FIXTURE_IMPORT = '@erpku/fixtures/base.fixture';
const DEFAULT_ADAPTER_RESULTS_JSON = 'artifacts/test-results/erpku-results.json';
function normalizeEnvPath(raw, trimTrailingSlash = false) {
    let normalized = raw.replace(/\\/g, '/');
    if (trimTrailingSlash) {
        normalized = normalized.replace(/\/+$/, '');
    }
    return normalized;
}
function normalizeEnvRoot(raw) {
    return normalizeEnvPath(raw, true);
}
/** Generator output and MCP validation scan root (override via PLAYWRIGHT_TEST_ROOT). */
function getPlaywrightTestRoot() {
    const raw = process.env.PLAYWRIGHT_TEST_ROOT?.trim();
    if (!raw) {
        return DEFAULT_TEST_ROOT;
    }
    return normalizeEnvRoot(raw);
}
/** Active Playwright config for playwright-test MCP (override via PLAYWRIGHT_CONFIG). */
function getPlaywrightConfigPath() {
    const raw = process.env.PLAYWRIGHT_CONFIG?.trim();
    if (!raw) {
        return DEFAULT_CONFIG_PATH;
    }
    return normalizeEnvPath(raw);
}
/** Reference adapter spec root (override via PLAYWRIGHT_ADAPTER_TEST_ROOT). */
function getAdapterTestRoot() {
    const raw = process.env.PLAYWRIGHT_ADAPTER_TEST_ROOT?.trim();
    if (!raw) {
        return DEFAULT_ADAPTER_TEST_ROOT;
    }
    return normalizeEnvRoot(raw);
}
/** Reference adapter Playwright config path (override via PLAYWRIGHT_ADAPTER_CONFIG). */
function getAdapterConfigPath() {
    const raw = process.env.PLAYWRIGHT_ADAPTER_CONFIG?.trim();
    if (!raw) {
        return DEFAULT_ADAPTER_CONFIG_PATH;
    }
    return normalizeEnvPath(raw);
}
/** Required base.fixture import for adapter specs (override via PLAYWRIGHT_ADAPTER_FIXTURE_IMPORT). */
function getAdapterFixtureImport() {
    const raw = process.env.PLAYWRIGHT_ADAPTER_FIXTURE_IMPORT?.trim();
    if (!raw) {
        return DEFAULT_ADAPTER_FIXTURE_IMPORT;
    }
    return raw;
}
/** JSON reporter output when adapter config is active (override via PLAYWRIGHT_ADAPTER_RESULTS_JSON). */
function getAdapterJsonResultsPath() {
    const raw = process.env.PLAYWRIGHT_ADAPTER_RESULTS_JSON?.trim();
    if (!raw) {
        return DEFAULT_ADAPTER_RESULTS_JSON;
    }
    return normalizeEnvPath(raw);
}
function getConfigJsonOutputMap() {
    return {
        [DEFAULT_CONFIG_PATH]: DEFAULT_JSON_RESULTS,
        [getAdapterConfigPath()]: getAdapterJsonResultsPath(),
    };
}
/** JSON reporter output for Healer pre-flight (override via PLAYWRIGHT_RESULTS_JSON). */
function getJsonResultsPath() {
    const override = process.env.PLAYWRIGHT_RESULTS_JSON?.trim();
    if (override) {
        return normalizeEnvPath(override);
    }
    const config = getPlaywrightConfigPath();
    return getConfigJsonOutputMap()[config] ?? DEFAULT_JSON_RESULTS;
}
/** Absolute path to the active Playwright config under repo root. */
function resolvePlaywrightConfigAbsolute(repoRoot) {
    return path.join(repoRoot, getPlaywrightConfigPath());
}
function isUnderAllowedTestRoot(relativePath) {
    const normalized = relativePath.replace(/\\/g, '/');
    const primary = getPlaywrightTestRoot();
    if (normalized === primary || normalized.startsWith(`${primary}/`)) {
        return true;
    }
    const adapterRoot = getAdapterTestRoot();
    if (normalized === adapterRoot || normalized.startsWith(`${adapterRoot}/`)) {
        return true;
    }
    return false;
}
/** Traceability-exempt directory prefix for adapter reference specs (includes trailing slash). */
function getAdapterTraceabilityExemptPrefix() {
    return `${getAdapterTestRoot()}/`;
}
function isAdapterSpecPath(relativePath) {
    const normalized = relativePath.replace(/\\/g, '/');
    const adapterRoot = getAdapterTestRoot();
    return normalized === adapterRoot || normalized.startsWith(`${adapterRoot}/`);
}
//# sourceMappingURL=playwright-paths.js.map
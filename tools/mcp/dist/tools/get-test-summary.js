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
exports.getTestSummary = getTestSummary;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const safety_1 = require("../utils/safety");
const workspace_paths_1 = require("../utils/workspace-paths");
const file_reader_1 = require("../utils/file-reader");
const json_parser_1 = require("../utils/json-parser");
function resolveSummaryPath(repoRoot) {
    const canonicalPath = path.join(workspace_paths_1.mcpWorkspace.reportsDir, 'test-summary.json');
    if (fs.existsSync(canonicalPath))
        return canonicalPath;
    const legacyPath = path.join(repoRoot, 'reports', 'test-summary.json');
    if (fs.existsSync(legacyPath))
        return legacyPath;
    return canonicalPath;
}
function resolveResultsDir(repoRoot) {
    if (fs.existsSync(workspace_paths_1.mcpWorkspace.testResultsDir))
        return workspace_paths_1.mcpWorkspace.testResultsDir;
    const legacyResultsDir = path.join(repoRoot, 'test-results');
    if (fs.existsSync(legacyResultsDir))
        return legacyResultsDir;
    return workspace_paths_1.mcpWorkspace.testResultsDir;
}
/**
 * Derive role from a spec file name like "invoice-finance.spec.ts" → "finance"
 * or "login-super-admin.spec.ts" → "super-admin".
 * Returns null if no role pattern detected.
 */
function extractRoleFromFilename(filename) {
    // Match pattern: <feature>-<role>.spec.ts where role is a known business role
    const knownRoles = ['super-admin', 'finance', 'hrd', 'admin', 'user'];
    const base = path.basename(filename, '.spec.ts');
    for (const role of knownRoles) {
        if (base.endsWith(`-${role}`))
            return role;
    }
    // Also check @role-<rolename> annotation pattern via test result annotations if available
    return null;
}
/**
 * Attempt to build byRole and byModule breakdowns from test-summary.json testCases.
 * byRole: from role field on each test case.
 * byModule: from module field on each test case (set by custom reporter via annotation).
 * Falls back to test-results/ directory scan for byRole only if testCases not present.
 */
function buildBreakdowns(repoRoot) {
    const byRole = {};
    const byModule = {};
    // Primary: read from test-summary.json testCases (most accurate)
    const summaryPath = resolveSummaryPath(repoRoot);
    if (fs.existsSync(summaryPath)) {
        try {
            const raw = (0, file_reader_1.readTextFile)(summaryPath);
            const parsed = (0, json_parser_1.safeJsonParse)(raw);
            if (parsed.ok && Array.isArray(parsed.data.testCases)) {
                for (const tc of parsed.data.testCases) {
                    const status = tc.status ?? 'unknown';
                    const passing = status === 'passed' ? 1 : 0;
                    const failing = status === 'failed' || status === 'timedOut' ? 1 : 0;
                    const skipped = status === 'skipped' ? 1 : 0;
                    // byRole
                    const role = tc.role;
                    if (role) {
                        if (!byRole[role])
                            byRole[role] = { passing: 0, failing: 0, skipped: 0 };
                        byRole[role].passing += passing;
                        byRole[role].failing += failing;
                        byRole[role].skipped += skipped;
                    }
                    // byModule (Opsi B: nested features)
                    const mod = tc.module ?? '-';
                    const feat = tc.feature ?? '-';
                    if (!byModule[mod])
                        byModule[mod] = { passing: 0, failing: 0, features: {} };
                    byModule[mod].passing += passing;
                    byModule[mod].failing += failing;
                    if (!byModule[mod].features[feat])
                        byModule[mod].features[feat] = { passing: 0, failing: 0 };
                    byModule[mod].features[feat].passing += passing;
                    byModule[mod].features[feat].failing += failing;
                }
                return { byRole, byModule };
            }
        }
        catch {
            // Fall through to legacy scan
        }
    }
    // Legacy fallback: scan test-results/ for byRole only (no module data available)
    const resultsDir = resolveResultsDir(repoRoot);
    if (!fs.existsSync(resultsDir))
        return { byRole, byModule };
    try {
        const entries = fs.readdirSync(resultsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const resultFile = path.join(resultsDir, entry.name, 'results.json');
            if (!fs.existsSync(resultFile))
                continue;
            const raw = (0, file_reader_1.readTextFile)(resultFile);
            const parsed = (0, json_parser_1.safeJsonParse)(raw);
            if (!parsed.ok)
                continue;
            const file = parsed.data.file ?? entry.name;
            const stats = parsed.data.stats ?? {};
            const passing = stats.expected ?? 0;
            const failing = stats.unexpected ?? 0;
            const skipped = stats.skipped ?? 0;
            const role = extractRoleFromFilename(file);
            if (role) {
                if (!byRole[role])
                    byRole[role] = { passing: 0, failing: 0, skipped: 0 };
                byRole[role].passing += passing;
                byRole[role].failing += failing;
                byRole[role].skipped += skipped;
            }
        }
    }
    catch {
        // Non-fatal — breakdowns are best-effort
    }
    return { byRole, byModule };
}
function getTestSummary() {
    const repoRoot = (0, safety_1.getRepoRoot)();
    const absolutePath = resolveSummaryPath(repoRoot);
    if (!fs.existsSync(absolutePath)) {
        const rel = path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
        return {
            status: 'no_results',
            message: `${rel} not found. Run tests first to generate the custom reporter summary.`,
        };
    }
    try {
        const raw = (0, file_reader_1.readTextFile)(absolutePath);
        const parsed = (0, json_parser_1.safeJsonParse)(raw);
        if (!parsed.ok) {
            return { status: 'error', message: parsed.error.message };
        }
        const summary = parsed.data;
        if (typeof summary.total !== 'number' ||
            typeof summary.passed !== 'number' ||
            typeof summary.failed !== 'number' ||
            typeof summary.skipped !== 'number' ||
            typeof summary.passRate !== 'number' ||
            typeof summary.timestamp !== 'string') {
            return {
                status: 'error',
                message: 'test-summary.json is missing required fields: total, passed, failed, skipped, passRate, timestamp.',
            };
        }
        const timestampMs = Date.parse(summary.timestamp);
        if (Number.isNaN(timestampMs)) {
            return { status: 'error', message: 'test-summary.json has an invalid timestamp.' };
        }
        const mtime = fs.statSync(absolutePath).mtime.toISOString();
        const { byRole, byModule } = buildBreakdowns(repoRoot);
        const result = {
            status: 'success',
            summary,
            message: `Summary: ${summary.passed}/${summary.total} passed (${summary.passRate}% pass rate, timestamp ${summary.timestamp}, file modified ${mtime}).`,
        };
        if (Object.keys(byRole).length > 0)
            result.byRole = byRole;
        if (Object.keys(byModule).length > 0)
            result.byModule = byModule;
        // Expose table-view extensions from custom reporter if present
        if (summary.reportMode)
            result.reportMode = summary.reportMode;
        if (summary.rolesInScope && summary.rolesInScope.length > 0) {
            result.rolesInScope = summary.rolesInScope;
        }
        if (Array.isArray(summary.testCases) && summary.testCases.length > 0) {
            result.testCases = summary.testCases;
        }
        if (summary.runMeta && typeof summary.runMeta === 'object') {
            result.runMeta = summary.runMeta;
        }
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error reading test summary';
        return { status: 'error', message };
    }
}
//# sourceMappingURL=get-test-summary.js.map
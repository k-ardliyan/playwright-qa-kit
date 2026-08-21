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
exports.getTestFailures = getTestFailures;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const file_reader_1 = require("../utils/file-reader");
const json_parser_1 = require("../utils/json-parser");
const playwright_paths_1 = require("../utils/playwright-paths");
const safety_1 = require("../utils/safety");
const logger_1 = require("../utils/logger");
/**
 * Build a lookup map keyed by test title from reports/test-summary.json.
 * Returns an empty map when the file is absent or unparseable — callers
 * treat a missing entry as "no annotation data available" and fall back to
 * leaving the optional fields undefined.
 */
function loadSummaryAnnotationMap(repoRoot) {
    const summaryPath = path.resolve(repoRoot, 'reports', 'test-summary.json');
    if (!fs.existsSync(summaryPath))
        return new Map();
    try {
        const raw = fs.readFileSync(summaryPath, 'utf-8');
        const parsed = (0, json_parser_1.safeJsonParse)(raw);
        if (!parsed.ok || !Array.isArray(parsed.data.testCases))
            return new Map();
        const map = new Map();
        for (const tc of parsed.data.testCases) {
            if (tc.title)
                map.set(tc.title, tc);
        }
        return map;
    }
    catch {
        return new Map();
    }
}
const DEFAULT_RESULTS_DIR = path.resolve((0, safety_1.getRepoRoot)(), 'test-results');
function resolveResultsFile(resultsDir) {
    const repoRoot = (0, safety_1.getRepoRoot)();
    const normalizedDir = path.resolve(resultsDir);
    const defaultResultsDir = path.resolve(repoRoot, 'test-results');
    // Config-mapped JSON applies only when browsing the default test-results root.
    // Explicit subdirs (property fixtures, scoped Healer runs) must not pick stale global JSON.
    if (normalizedDir === defaultResultsDir) {
        const configMapped = path.resolve(repoRoot, (0, playwright_paths_1.getJsonResultsPath)());
        if (fs.existsSync(configMapped)) {
            return configMapped;
        }
    }
    // Latest .json in the caller-supplied dir (default: test-results/).
    const latestInDir = (0, file_reader_1.getLatestJsonResultFile)(resultsDir);
    if (latestInDir) {
        return latestInDir;
    }
    // Legacy results.json fallback.
    const explicit = path.resolve(resultsDir, 'results.json');
    return fs.existsSync(explicit) ? explicit : null;
}
function extractErrorMessage(result) {
    const firstError = result.errors?.[0];
    return (result?.error?.message ??
        firstError?.message ??
        firstError?.value ??
        result?.error?.value ??
        'Unknown Playwright failure');
}
function extractStackTrace(result) {
    const firstError = result.errors?.[0];
    return result.error?.stack ?? firstError?.stack;
}
function extractAttachmentPaths(result) {
    const attachments = Array.isArray(result.attachments) ? result.attachments : [];
    let tracePath;
    let screenshotPath;
    for (const attachment of attachments) {
        const name = (attachment.name ?? '').toLowerCase();
        const attachmentPath = attachment.path;
        if (!attachmentPath) {
            continue;
        }
        if (!tracePath && (name.includes('trace') || attachmentPath.endsWith('.zip'))) {
            tracePath = attachmentPath;
        }
        if (!screenshotPath &&
            (name.includes('screenshot') || attachment.contentType?.startsWith('image/'))) {
            screenshotPath = attachmentPath;
        }
    }
    return { tracePath, screenshotPath };
}
function traverseSuites(suiteNode, inheritedTitle, failures, annotationMap = new Map()) {
    const suiteTitle = [inheritedTitle, suiteNode.title].filter(Boolean).join(' > ');
    const specs = Array.isArray(suiteNode.specs) ? suiteNode.specs : [];
    for (const spec of specs) {
        const specTitle = [suiteTitle, spec.title].filter(Boolean).join(' > ');
        const tests = Array.isArray(spec.tests) ? spec.tests : [];
        for (const test of tests) {
            const testTitle = [specTitle, test.title].filter(Boolean).join(' > ');
            const results = Array.isArray(test.results) ? test.results : [];
            // Only the LAST attempt per test is authoritative — earlier failed
            // attempts that were retried-and-passed should not be reported.
            const lastResult = results[results.length - 1];
            if (!lastResult)
                continue;
            if (!['failed', 'timedOut', 'interrupted'].includes(lastResult.status ?? '')) {
                continue;
            }
            const result = lastResult;
            const lineNumber = result.error?.location?.line ?? test.location?.line;
            const filePath = test.location?.file ?? spec.file ?? suiteNode.file ?? 'unknown';
            const failure = {
                testTitle: testTitle || 'Unnamed test',
                filePath,
                errorMessage: extractErrorMessage(result),
                duration: Number(result.duration ?? 0),
            };
            if (typeof lineNumber === 'number') {
                failure.lineNumber = lineNumber;
            }
            const stackTrace = extractStackTrace(result);
            if (stackTrace) {
                failure.stackTrace = stackTrace;
            }
            const { tracePath, screenshotPath } = extractAttachmentPaths(result);
            if (tracePath) {
                failure.tracePath = tracePath;
            }
            if (screenshotPath) {
                failure.screenshotPath = screenshotPath;
            }
            failures.push(failure);
            // Cross-reference with test-summary.json to enrich annotation fields.
            // Playwright JSON reporter does not store custom annotations, so we
            // look up the test title in the map built from the custom reporter output.
            const annotation = annotationMap.get(testTitle || '');
            if (annotation) {
                if (annotation.testId)
                    failure.testId = annotation.testId;
                if (annotation.role)
                    failure.role = annotation.role;
                if (annotation.priority)
                    failure.priority = annotation.priority;
                if (annotation.expectedResult)
                    failure.expectedResult = annotation.expectedResult;
                if (annotation.actualResult)
                    failure.actualResult = annotation.actualResult;
                if (annotation.failureSource)
                    failure.failureSource = annotation.failureSource;
            }
        }
    }
    const childSuites = Array.isArray(suiteNode.suites) ? suiteNode.suites : [];
    for (const child of childSuites) {
        traverseSuites(child, suiteTitle, failures, annotationMap);
    }
}
function parsePlaywrightResult(content, annotationMap = new Map()) {
    if (typeof content === 'object' &&
        content !== null &&
        Array.isArray(content.failures)) {
        return (content.failures ?? [])
            .map((item) => {
            const row = item;
            if (!row.testTitle || !row.filePath || !row.errorMessage) {
                return null;
            }
            const mapped = {
                testTitle: String(row.testTitle),
                filePath: String(row.filePath),
                errorMessage: String(row.errorMessage),
                duration: Number(row.duration ?? 0),
            };
            if (typeof row.lineNumber === 'number') {
                mapped.lineNumber = row.lineNumber;
            }
            if (typeof row.stackTrace === 'string') {
                mapped.stackTrace = row.stackTrace;
            }
            if (typeof row.tracePath === 'string') {
                mapped.tracePath = row.tracePath;
            }
            if (typeof row.screenshotPath === 'string') {
                mapped.screenshotPath = row.screenshotPath;
            }
            if (typeof row.testId === 'string') {
                mapped.testId = row.testId;
            }
            if (typeof row.role === 'string') {
                mapped.role = row.role;
            }
            if (row.priority === 'high' || row.priority === 'medium' || row.priority === 'low') {
                mapped.priority = row.priority;
            }
            if (typeof row.expectedResult === 'string') {
                mapped.expectedResult = row.expectedResult;
            }
            if (typeof row.actualResult === 'string') {
                mapped.actualResult = row.actualResult;
            }
            if (row.failureSource === 'app' ||
                row.failureSource === 'test' ||
                row.failureSource === 'requirement' ||
                row.failureSource === 'env' ||
                row.failureSource === 'ai_generation' ||
                row.failureSource === 'unknown') {
                mapped.failureSource = row.failureSource;
            }
            return mapped;
        })
            .filter((item) => item !== null);
    }
    const root = content;
    const rootSuites = Array.isArray(root.suites) ? root.suites : [];
    const failures = [];
    for (const suite of rootSuites) {
        traverseSuites(suite, '', failures, annotationMap);
    }
    return failures;
}
function getTestFailures(resultsDir = DEFAULT_RESULTS_DIR) {
    // Path containment is enforced at the MCP dispatch boundary (see
    // `mcp-server/src/tools/registry.ts` for the get_test_failures handler).
    // Direct callers (property tests, scripts) pass repo-relative paths
    // resolved against the cwd or absolute paths inside the temp dir; the
    // function trusts its input here.
    try {
        const resultFile = resolveResultsFile(resultsDir);
        if (!resultFile) {
            const message = `No Playwright JSON results found. Expected '${(0, playwright_paths_1.getJsonResultsPath)()}' or JSON under '${resultsDir}'.`;
            logger_1.logger.info(message);
            return {
                failures: [],
                status: 'no_results',
                message,
            };
        }
        const raw = (0, file_reader_1.readTextFile)(resultFile);
        const parsed = (0, json_parser_1.safeJsonParse)(raw);
        if (!parsed.ok) {
            return {
                failures: [],
                status: 'error',
                message: parsed.error.message,
                sourceFile: resultFile,
            };
        }
        const failures = parsePlaywrightResult(parsed.data, loadSummaryAnnotationMap((0, safety_1.getRepoRoot)()));
        const hasSuites = typeof parsed.data === 'object' &&
            parsed.data !== null &&
            Array.isArray(parsed.data.suites);
        const status = failures.length > 0 ? 'failure' : hasSuites ? 'success' : 'partial';
        logger_1.logger.info('Collected Playwright test failures.', {
            resultFile,
            failureCount: failures.length,
            status,
        });
        return {
            failures,
            status,
            message: `Parsed ${failures.length} failure(s) from ${resultFile}`,
            sourceFile: resultFile,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error while reading test failures';
        logger_1.logger.error('Failed to collect test failures.', { message });
        return {
            failures: [],
            status: 'error',
            message,
        };
    }
}
//# sourceMappingURL=get-test-failures.js.map
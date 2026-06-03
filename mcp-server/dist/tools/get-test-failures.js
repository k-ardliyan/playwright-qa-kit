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
const path = __importStar(require("node:path"));
const file_reader_1 = require("../utils/file-reader");
const json_parser_1 = require("../utils/json-parser");
const logger_1 = require("../utils/logger");
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
function traverseSuites(suiteNode, inheritedTitle, failures) {
    const suiteTitle = [inheritedTitle, suiteNode.title].filter(Boolean).join(' > ');
    const specs = Array.isArray(suiteNode.specs) ? suiteNode.specs : [];
    for (const spec of specs) {
        const specTitle = [suiteTitle, spec.title].filter(Boolean).join(' > ');
        const tests = Array.isArray(spec.tests) ? spec.tests : [];
        for (const test of tests) {
            const testTitle = [specTitle, test.title].filter(Boolean).join(' > ');
            const results = Array.isArray(test.results) ? test.results : [];
            for (const result of results) {
                if (!['failed', 'timedOut', 'interrupted'].includes(result.status ?? '')) {
                    continue;
                }
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
                failures.push(failure);
            }
        }
    }
    const childSuites = Array.isArray(suiteNode.suites) ? suiteNode.suites : [];
    for (const child of childSuites) {
        traverseSuites(child, suiteTitle, failures);
    }
}
function parsePlaywrightResult(content) {
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
            return mapped;
        })
            .filter((item) => item !== null);
    }
    const root = content;
    const rootSuites = Array.isArray(root.suites) ? root.suites : [];
    const failures = [];
    for (const suite of rootSuites) {
        traverseSuites(suite, '', failures);
    }
    return failures;
}
function getTestFailures(resultsDir = path.resolve(process.cwd(), 'test-results')) {
    try {
        const latestResultFile = (0, file_reader_1.getLatestJsonResultFile)(resultsDir);
        if (!latestResultFile) {
            const message = `No Playwright JSON results found in '${resultsDir}'.`;
            logger_1.logger.info(message);
            return {
                failures: [],
                status: 'no_results',
                message,
            };
        }
        const raw = (0, file_reader_1.readTextFile)(latestResultFile);
        const parsed = (0, json_parser_1.safeJsonParse)(raw);
        if (!parsed.ok) {
            return {
                failures: [],
                status: 'error',
                message: parsed.error.message,
            };
        }
        const failures = parsePlaywrightResult(parsed.data);
        logger_1.logger.info('Collected Playwright test failures.', {
            latestResultFile,
            failureCount: failures.length,
        });
        return {
            failures,
            status: 'success',
            message: `Parsed ${failures.length} failure(s) from ${latestResultFile}`,
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
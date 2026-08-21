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
exports.validateSpecFile = validateSpecFile;
exports.validateNoEphemeralRefs = validateNoEphemeralRefs;
exports.validateNoHardcodedWaits = validateNoHardcodedWaits;
exports.validateGeneratedTests = validateGeneratedTests;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const safety_1 = require("../utils/safety");
const playwright_paths_1 = require("../utils/playwright-paths");
/**
 * Pre-existing or utility specs are exempt from the `// spec:` and `// seed:`
 * traceability header rules. Exemption is directory-scoped (not exact-path)
 * so adding a new utility spec in an exempt directory doesn't require a code
 * change here.
 */
const TRACEABILITY_EXEMPT_PREFIXES_STATIC = [
    'tests/demo/',
    'src/tests/demo/',
];
const TRACEABILITY_EXEMPT_FILES = [
    'tests/seed.spec.ts',
    'src/tests/seed.spec.ts',
];
function getTraceabilityExemptPrefixes() {
    return [...TRACEABILITY_EXEMPT_PREFIXES_STATIC, (0, playwright_paths_1.getAdapterTraceabilityExemptPrefix)()];
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function normalizeRelativePath(filePath) {
    return filePath.replace(/\\/g, '/');
}
function isTraceabilityExempt(relativePath) {
    const normalized = normalizeRelativePath(relativePath);
    if (normalized.includes('__property_')) {
        return true;
    }
    if (TRACEABILITY_EXEMPT_FILES.includes(normalized)) {
        return true;
    }
    return getTraceabilityExemptPrefixes().some((prefix) => normalized.startsWith(prefix));
}
function getLineNumberFromIndex(content, index) {
    if (index <= 0) {
        return 1;
    }
    return content.slice(0, index).split(/\r?\n/).length;
}
function findSpecFiles(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...findSpecFiles(fullPath));
            continue;
        }
        if (entry.isFile() && fullPath.endsWith('.spec.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}
function validateImportRule(content, filePath, relativePath) {
    const isAdapterSpec = (0, playwright_paths_1.isAdapterSpecPath)(relativePath);
    const adapterImport = (0, playwright_paths_1.getAdapterFixtureImport)();
    const importRegex = isAdapterSpec
        ? new RegExp(`import\\s*{([^}]*)}\\s*from\\s*['"]${escapeRegExp(adapterImport)}['"]`, 'g')
        : /import\s*{([^}]*)}\s*from\s*['"](?:@\/fixtures\/base\.fixture|\.\.?\/fixtures|@\/public\/fixtures)['"]/g;
    const match = importRegex.exec(content);
    if (!match) {
        const expected = isAdapterSpec ? adapterImport : './fixtures or @/fixtures/base.fixture';
        return {
            filePath,
            lineNumber: 1,
            ruleName: `Import rule: must import test from ${expected}`,
        };
    }
    const importClause = match[1] ?? '';
    if (!/\btest\b/.test(importClause)) {
        return {
            filePath,
            lineNumber: getLineNumberFromIndex(content, match.index),
            ruleName: 'Import rule: base fixture import must include test',
        };
    }
    return null;
}
function validatePresenceRule(content, filePath, regex, ruleName) {
    if (regex.test(content)) {
        return null;
    }
    return { filePath, lineNumber: 1, ruleName };
}
function validateTraceabilityRule(content, filePath, relativePath) {
    if (isTraceabilityExempt(relativePath)) {
        return [];
    }
    const violations = [];
    if (!/\/\/\s*spec:\s*.+/m.test(content)) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Traceability rule: must include // spec: <path> comment before imports',
        });
    }
    if (!/\/\/\s*seed:\s*.+/m.test(content)) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Traceability rule: must include // seed: tests/seed.spec.ts comment before imports',
        });
    }
    // Warning: // req: closes the traceability loop back to the source requirement.
    // Severity is 'warning' (not error) so existing specs without it are not broken.
    if (!/\/\/\s*req:\s*.+/m.test(content)) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Traceability rule: missing // req: <requirements/feature.md> — add to close provenance loop',
            severity: 'warning',
        });
    }
    return violations;
}
/**
 * Capability tags in file content (describe/test tags or comments) must pair with
 * official power helpers from `@/support/pw` (or equivalent deep import / raw API).
 *
 * Demo/property/seed paths are exempt via isTraceabilityExempt + explicit demo prefix.
 */
function validateCapabilityPowerRules(content, filePath, relativePath) {
    if (isTraceabilityExempt(relativePath)) {
        return [];
    }
    const violations = [];
    const lower = content;
    const hasPwImport = /from\s*['"]@\/support\/pw(?:\/[^'"]*)?['"]/.test(content);
    const hasRouteApi = /\.route\s*\(/.test(content) || /\bmockJson\b|\bmockServerError\b|\bmockAbort\b/.test(content);
    const hasRequestApi = /\brequest\b/.test(content) &&
        (/\bapiSeed\b|\bapiJson\b|\bapiCleanup\b/.test(content) ||
            /request\.(get|post|put|patch|delete|fetch)\s*\(/.test(content));
    const hasAriaApi = /\btoMatchAriaSnapshot\b|\bexpectAriaSnapshot\b|\bexpectAriaMatchesCatalog\b/.test(content);
    const hasVisualApi = /\btoHaveScreenshot\b|\bexpectVisual\b|\bexpectPageVisual\b/.test(content);
    const hasDownloadApi = /waitForEvent\s*\(\s*['"]download['"]\s*\)/.test(content) ||
        /\bdownloadAndSave\b/.test(content) ||
        /\bdownloadFile\b/.test(content);
    const hasUploadApi = /\bsetInputFiles\b/.test(content) ||
        /\buploadFixture\b/.test(content) ||
        /\buploadViaChooser\b/.test(content) ||
        /\buploadFile\b/.test(content);
    const hasFileContentApi = /\bassertPdfContains\b/.test(content) ||
        /\bassertPdfMatches\b/.test(content) ||
        /\bextractPdfText\b/.test(content) ||
        /\bassertExcelHeaders\b/.test(content) ||
        /\breadExcelSummary\b/.test(content) ||
        /\bassertDownloadedEnvelope\b/.test(content) ||
        /\bassertFileMagic\b/.test(content) ||
        /\bdetectMagic\b/.test(content) ||
        /\bdetectFileKind\b/.test(content);
    const hasNetworkAssertApi = /\bwaitForApi\b/.test(content) ||
        /\bwaitAndAssertApi\b/.test(content) ||
        /\bassertNetworkContract\b/.test(content) ||
        /\bassertNetworkMatch\b/.test(content) ||
        /\bstartNetworkRecorder\b/.test(content) ||
        /\bwaitForResponse\b/.test(content) ||
        /\bwaitForRequest\b/.test(content);
    // Live observe first — @network\b alone would also match @network-assert
    const mentionsNetworkAssert = /@network-assert\b/.test(lower) ||
        /\(@network-assert\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@network-assert'/.test(lower) ||
        /tag:\s*\[[^\]]*"@network-assert"/.test(lower);
    // Mock-only: exclude @network-assert (negative lookahead after "network")
    const mentionsNetwork = /@network(?!-assert)\b/.test(lower) ||
        /\(@network\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@network'/.test(lower) ||
        /tag:\s*\[[^\]]*"@network"/.test(lower);
    const mentionsHybrid = /@hybrid\b/.test(lower) ||
        /\(@hybrid\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@hybrid'/.test(lower) ||
        /tag:\s*\[[^\]]*"@hybrid"/.test(lower);
    const mentionsAria = /@aria\b/.test(lower) ||
        /\(@aria\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@aria'/.test(lower) ||
        /tag:\s*\[[^\]]*"@aria"/.test(lower);
    const mentionsVisual = /@visual\b/.test(lower) ||
        /\(@visual\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@visual'/.test(lower) ||
        /tag:\s*\[[^\]]*"@visual"/.test(lower);
    const mentionsDownload = /@download\b/.test(lower) ||
        /\(@download\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@download'/.test(lower) ||
        /tag:\s*\[[^\]]*"@download"/.test(lower);
    const mentionsUpload = /@upload\b/.test(lower) ||
        /\(@upload\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@upload'/.test(lower) ||
        /tag:\s*\[[^\]]*"@upload"/.test(lower);
    const mentionsFileContent = /@file-content\b/.test(lower) ||
        /\(@file-content\)/.test(lower) ||
        /tag:\s*\[[^\]]*'@file-content'/.test(lower) ||
        /tag:\s*\[[^\]]*"@file-content"/.test(lower);
    if (mentionsNetwork && !hasRouteApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Capability rule (@network): must use page.route or import mockJson/mockServerError/mockAbort from @/support/pw',
        });
    }
    if (mentionsNetworkAssert && !hasNetworkAssertApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Capability rule (@network-assert): must use waitAndAssertApi/waitForApi/assertNetworkContract/assertNetworkMatch/startNetworkRecorder or page.waitForResponse/waitForRequest',
        });
    }
    if (mentionsHybrid && !hasRequestApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Capability rule (@hybrid): must use request fixture with apiSeed/apiJson/apiCleanup or request.get/post/…',
        });
    }
    if (mentionsAria && !hasAriaApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Capability rule (@aria): must call toMatchAriaSnapshot or expectAriaSnapshot/expectAriaMatchesCatalog',
        });
    }
    if (mentionsVisual && !hasVisualApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Capability rule (@visual): must call toHaveScreenshot or expectVisual/expectPageVisual from @/support/pw',
        });
    }
    if (mentionsDownload && !hasDownloadApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: "Capability rule (@download): must use waitForEvent('download') or downloadAndSave/downloadFile from @/support/pw or BasePage",
        });
    }
    if (mentionsUpload && !hasUploadApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Capability rule (@upload): must use setInputFiles or uploadFixture/uploadViaChooser/uploadFile',
        });
    }
    if (mentionsFileContent && !hasFileContentApi) {
        violations.push({
            filePath,
            lineNumber: 1,
            ruleName: 'Capability rule (@file-content): must use assertPdfContains/assertPdfMatches/extractPdfText/assertExcelHeaders/readExcelSummary/assertDownloadedEnvelope/assertFileMagic from @/support/pw (needles from scenario)',
        });
    }
    // Soft nudge: if multiple capability tags used, prefer barrel import (warning-as-violation only if none of APIs match — already covered)
    void hasPwImport;
    return violations;
}
function validateSpecFile(filePath, relativePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations = [];
    const rel = relativePath ?? normalizeRelativePath(filePath);
    const importViolation = validateImportRule(content, filePath, rel);
    if (importViolation) {
        violations.push(importViolation);
    }
    const describeViolation = validatePresenceRule(content, filePath, /test\.describe\s*\(/, 'Describe rule: must contain at least one test.describe(...) block');
    if (describeViolation) {
        violations.push(describeViolation);
    }
    const stepViolation = validatePresenceRule(content, filePath, /test\.step\s*\(/, 'Step rule: must contain at least one test.step(...) call');
    if (stepViolation) {
        violations.push(stepViolation);
    }
    violations.push(...validateTraceabilityRule(content, filePath, rel));
    violations.push(...validateCapabilityPowerRules(content, filePath, rel));
    violations.push(...validateNoEphemeralRefs(content, filePath, rel));
    violations.push(...validateNoHardcodedWaits(content, filePath, rel));
    return violations;
}
/**
 * Detect persisted MCP snapshot refs. Pattern derived from the ACTUAL installed
 * @playwright/mcp bundle, which serializes snapshot elements with a numeric ref
 * as `ref: <id>` (or `"ref": <id>` in JSON). No longer guesses at `node_id=`
 * (that is a CDP attribute that also legitimately appears in app URLs such as
 * `?node_id=5` and caused false positives).
 */
function validateNoEphemeralRefs(content, filePath, relativePath) {
    if (isTraceabilityExempt(relativePath)) {
        return [];
    }
    const violations = [];
    const refPattern = /(?:\bref\s*:\s*\d+|\bref_\d+|\bdata-mcp-ref)|"ref"\s*:\s*\d+/g;
    let match;
    while ((match = refPattern.exec(content)) !== null) {
        violations.push({
            filePath,
            lineNumber: getLineNumberFromIndex(content, match.index),
            ruleName: `Ephemeral ref rule: ephemeral MCP ref detected ("${match[0]}"). Use semantic locators (getByRole, getByLabel, etc.) instead.`,
            severity: 'error',
        });
    }
    return violations;
}
/**
 * Flag hardcoded waits/sleeps. Warning severity so existing tests are not
 * rejected outright, but the Generator cannot casually emit them.
 */
function validateNoHardcodedWaits(content, filePath, relativePath) {
    if (isTraceabilityExempt(relativePath)) {
        return [];
    }
    const violations = [];
    const waitPattern = /\b(?:page\.waitForTimeout|\.waitForTimeout)\s*\(/g;
    let match;
    while ((match = waitPattern.exec(content)) !== null) {
        violations.push({
            filePath,
            lineNumber: getLineNumberFromIndex(content, match.index),
            ruleName: `Hardcoded wait rule: avoid hardcoded timeout/sleep ("${match[0]}"). Use observable assertions/states instead.`,
            severity: 'warning',
        });
    }
    return violations;
}
function validateGeneratedTests(filePath) {
    const repoRoot = (0, safety_1.getRepoRoot)();
    const violations = [];
    let specFiles;
    if (filePath) {
        const resolved = (0, safety_1.resolveAllowedPath)(filePath, 'tests', { mustExist: true });
        if (!resolved.ok) {
            return {
                status: 'error',
                validatedCount: 0,
                violations: [],
                warnings: [],
                message: resolved.error.message,
            };
        }
        if (!resolved.absolutePath.endsWith('.spec.ts')) {
            return {
                status: 'error',
                validatedCount: 0,
                violations: [],
                warnings: [],
                message: 'Only .spec.ts files can be validated.',
            };
        }
        specFiles = [resolved.absolutePath];
    }
    else {
        specFiles = findSpecFiles(path.join(repoRoot, (0, playwright_paths_1.getPlaywrightTestRoot)())).sort((a, b) => a.localeCompare(b));
    }
    for (const specPath of specFiles) {
        const relativeSpecPath = normalizeRelativePath(path.relative(repoRoot, specPath));
        try {
            violations.push(...validateSpecFile(specPath, relativeSpecPath));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to read file';
            violations.push({
                filePath: specPath,
                lineNumber: 1,
                ruleName: `Read error: ${message}`,
            });
        }
    }
    const relativeViolations = violations.map((v) => ({
        ...v,
        filePath: path.relative(repoRoot, v.filePath).replace(/\\/g, '/'),
    }));
    const errorViolations = relativeViolations.filter((v) => (v.severity ?? 'error') === 'error');
    const warnViolations = relativeViolations.filter((v) => v.severity === 'warning');
    if (errorViolations.length > 0) {
        return {
            status: 'error',
            validatedCount: specFiles.length,
            violations: relativeViolations,
            warnings: warnViolations,
            message: `Found ${errorViolations.length} error(s) and ${warnViolations.length} warning(s) across ${specFiles.length} file(s).`,
        };
    }
    if (warnViolations.length > 0) {
        return {
            status: 'warning',
            validatedCount: specFiles.length,
            violations: relativeViolations,
            warnings: warnViolations,
            message: `Validated ${specFiles.length} test file(s); 0 errors, ${warnViolations.length} warning(s).`,
        };
    }
    return {
        status: 'success',
        validatedCount: specFiles.length,
        violations: [],
        warnings: [],
        message: `Validated ${specFiles.length} test file(s); all structural checks passed.`,
    };
}
//# sourceMappingURL=validate-generated-tests.js.map
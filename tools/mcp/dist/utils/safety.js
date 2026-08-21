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
exports.MAX_REQUIREMENTS_TEXT_BYTES = void 0;
exports.createToolError = createToolError;
exports.findRepoRoot = findRepoRoot;
exports.getRepoRoot = getRepoRoot;
exports.isValidRequirementRelativePath = isValidRequirementRelativePath;
exports.isPipelineRequirementRelativePath = isPipelineRequirementRelativePath;
exports.assertRequirementsTextSize = assertRequirementsTextSize;
exports.resolveAllowedPath = resolveAllowedPath;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const playwright_paths_1 = require("./playwright-paths");
const workspace_paths_1 = require("./workspace-paths");
exports.MAX_REQUIREMENTS_TEXT_BYTES = 256 * 1024;
const READ_ONLY_KINDS = new Set(['environments', 'test-results', 'reports']);
function getAllowedPrefixes() {
    return {
        requirements: [workspace_paths_1.mcpWorkspace.requirementsRel, 'requirements', 'tests/fixtures/requirements'],
        specs: [workspace_paths_1.mcpWorkspace.specsRel, 'specs'],
        reports: [workspace_paths_1.mcpWorkspace.reportsRel, 'reports'],
        'test-results': [workspace_paths_1.mcpWorkspace.testResultsRel, 'test-results'],
        environments: [workspace_paths_1.mcpWorkspace.environmentsRel, 'environments'],
        'selector-catalog': [workspace_paths_1.mcpWorkspace.selectorCatalogRel, 'selector-catalog'],
        pages: [workspace_paths_1.mcpWorkspace.pagesRel, 'tests/pages'],
        'test-data': [workspace_paths_1.mcpWorkspace.testDataRel, 'tests/data', 'test-fixtures'],
    };
}
function getTestsPrefix() {
    return workspace_paths_1.mcpWorkspace.testsRel || (0, playwright_paths_1.getPlaywrightTestRoot)();
}
function createToolError(code, message) {
    return { status: 'error', error: { code, message } };
}
function findRepoRoot(start = __dirname) {
    return (0, workspace_paths_1.findRepoRoot)(start);
}
function getRepoRoot() {
    return workspace_paths_1.mcpWorkspace.rootDir;
}
/**
 * Valid target for a requirement file under `requirements/`.
 * Default: allows examples and nested domain paths; still blocks _TEMPLATE, README.
 * Pass `{ blockExamples: true }` for the pipeline-tooling view that excludes
 * example-* files (matches the previous isPipelineRequirementRelativePath).
 */
function isValidRequirementRelativePath(relativePath, opts = {}) {
    const normalized = relativePath.replace(/\\/g, '/');
    // Allow: requirements/<name>.md OR requirements/<domain>/<name>.md OR tests/fixtures/requirements/<name>.md
    const match = normalized.match(/^(?:requirements|tests\/fixtures\/requirements)\/([\w-]+(\/[\w-]+)*)\.md$/);
    if (!match) {
        return false;
    }
    // basename is the last path segment (the filename without .md)
    const basename = match[1].split('/').pop();
    if (basename.startsWith('_')) {
        return false;
    }
    if (basename.toLowerCase() === 'readme') {
        return false;
    }
    if (opts.blockExamples && basename.startsWith('example-')) {
        return false;
    }
    return true;
}
/** Feature requirement files only — excludes meta (_TEMPLATE, README) and examples. */
function isPipelineRequirementRelativePath(relativePath) {
    return isValidRequirementRelativePath(relativePath, { blockExamples: true });
}
function assertRequirementsTextSize(text) {
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > exports.MAX_REQUIREMENTS_TEXT_BYTES) {
        return {
            code: 'INPUT_TOO_LARGE',
            message: `requirementsText exceeds ${exports.MAX_REQUIREMENTS_TEXT_BYTES} bytes (${bytes} bytes).`,
        };
    }
    return null;
}
function resolveAllowedPath(inputPath, kind, options = {}) {
    const repoRoot = getRepoRoot();
    const prefixes = kind === 'tests'
        ? [getTestsPrefix()]
        : getAllowedPrefixes()[kind] || [];
    const normalizedInput = inputPath.replace(/\\/g, '/').trim();
    if (!normalizedInput || normalizedInput.includes('\0')) {
        return {
            ok: false,
            error: { code: 'INVALID_PATH', message: 'Path must be a non-empty string.' },
        };
    }
    if (path.isAbsolute(normalizedInput)) {
        const absolute = path.resolve(normalizedInput);
        const relative = path.relative(repoRoot, absolute);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            return {
                ok: false,
                error: {
                    code: 'PATH_NOT_ALLOWED',
                    message: 'Absolute paths must stay inside the repository root.',
                },
            };
        }
    }
    const candidate = path.resolve(repoRoot, normalizedInput);
    const relative = path.relative(repoRoot, candidate).replace(/\\/g, '/');
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return {
            ok: false,
            error: { code: 'PATH_TRAVERSAL', message: 'Path traversal is not allowed.' },
        };
    }
    if (kind === 'tests') {
        if (!(0, playwright_paths_1.isUnderAllowedTestRoot)(relative)) {
            return {
                ok: false,
                error: {
                    code: 'PATH_NOT_ALLOWED',
                    message: `Path must be under '${getTestsPrefix()}/' or '${(0, playwright_paths_1.getAdapterTestRoot)()}/'. Received: '${relative}'.`,
                },
            };
        }
    }
    else {
        const matchesPrefix = prefixes.some((p) => relative === p || relative.startsWith(`${p}/`));
        if (!matchesPrefix) {
            return {
                ok: false,
                error: {
                    code: 'PATH_NOT_ALLOWED',
                    message: `Path must be under '${prefixes[0]}/'. Received: '${relative}'.`,
                },
            };
        }
    }
    const readOnly = options.readOnly ?? READ_ONLY_KINDS.has(kind);
    if (readOnly && options.mustExist === false) {
        // read-only kinds can still be listed without write
    }
    if (kind === 'requirements') {
        if (!isValidRequirementRelativePath(relative)) {
            return {
                ok: false,
                error: {
                    code: 'PATH_NOT_ALLOWED',
                    message: `Path must be a feature file at requirements/<name>.md or requirements/<domain>/<name>.md (not _TEMPLATE or README). Received: '${relative}'.`,
                },
            };
        }
    }
    if (options.mustExist && !fs.existsSync(candidate)) {
        return {
            ok: false,
            error: { code: 'NOT_FOUND', message: `Path does not exist: ${relative}` },
        };
    }
    return { ok: true, absolutePath: candidate, relativePath: relative };
}
//# sourceMappingURL=safety.js.map
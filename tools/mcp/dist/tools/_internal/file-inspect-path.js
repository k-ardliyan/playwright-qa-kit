"use strict";
/**
 * Shared path resolution for file-inspect MCP tools.
 * Allowed roots: test-fixtures/, test-results/ (read-only).
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
exports.resolveFileInspectPath = resolveFileInspectPath;
exports.toolErrorPayload = toolErrorPayload;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const safety_1 = require("../../utils/safety");
function resolveFileInspectPath(inputPath, options = {}) {
    const repoRoot = (0, safety_1.getRepoRoot)();
    const normalizedInput = (inputPath ?? '').replace(/\\/g, '/').trim();
    if (!normalizedInput || normalizedInput.includes('\0')) {
        return {
            ok: false,
            error: { code: 'INVALID_PATH', message: 'Path must be a non-empty string.' },
        };
    }
    const candidate = path.isAbsolute(normalizedInput)
        ? path.resolve(normalizedInput)
        : path.resolve(repoRoot, normalizedInput);
    const relative = path.relative(repoRoot, candidate).replace(/\\/g, '/');
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return {
            ok: false,
            error: { code: 'PATH_TRAVERSAL', message: 'Path must stay inside the repository root.' },
        };
    }
    let kind = null;
    if (relative === 'test-fixtures' || relative.startsWith('test-fixtures/')) {
        kind = 'test-fixtures';
    }
    else if (relative === 'test-results' || relative.startsWith('test-results/')) {
        kind = 'test-results';
    }
    if (!kind) {
        return {
            ok: false,
            error: {
                code: 'PATH_NOT_ALLOWED',
                message: `Path must be under 'test-fixtures/' or 'test-results/'. Received: '${relative}'.`,
            },
        };
    }
    const mustExist = options.mustExist ?? true;
    if (mustExist && !fs.existsSync(candidate)) {
        return {
            ok: false,
            error: { code: 'NOT_FOUND', message: `Path does not exist: ${relative}` },
        };
    }
    return { ok: true, absolutePath: candidate, relativePath: relative, kind };
}
function toolErrorPayload(error) {
    return (0, safety_1.createToolError)(error.code, error.message);
}
//# sourceMappingURL=file-inspect-path.js.map
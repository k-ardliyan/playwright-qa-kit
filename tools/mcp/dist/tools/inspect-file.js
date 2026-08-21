"use strict";
/**
 * MCP: inspect_file — envelope metadata (kind, size, magic). No domain fields.
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
exports.inspectFile = inspectFile;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const file_content_core_1 = require("../utils/file-content-core");
const file_inspect_path_1 = require("./_internal/file-inspect-path");
function inspectFile(args) {
    const filePath = typeof args?.filePath === 'string' ? args.filePath : '';
    const resolved = (0, file_inspect_path_1.resolveFileInspectPath)(filePath, { mustExist: true });
    if (!resolved.ok) {
        return (0, file_inspect_path_1.toolErrorPayload)(resolved.error);
    }
    try {
        const info = (0, file_content_core_1.inspectFileLocal)(resolved.absolutePath);
        const buf = fs.readFileSync(resolved.absolutePath);
        return {
            status: 'success',
            filePath: resolved.relativePath,
            filename: path.basename(resolved.absolutePath),
            size: info.size,
            kind: (0, file_content_core_1.detectFileKind)(resolved.absolutePath, buf),
            magic: (0, file_content_core_1.detectMagic)(buf),
            suggestedKind: info.kind,
        };
    }
    catch (err) {
        return {
            status: 'error',
            error: {
                code: 'INSPECT_FAILED',
                message: err instanceof Error ? err.message : String(err),
            },
        };
    }
}
//# sourceMappingURL=inspect-file.js.map
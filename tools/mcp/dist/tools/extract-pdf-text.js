"use strict";
/**
 * MCP: extract_pdf_text — raw PDF plain text only.
 * Does NOT define business fields. Agents match scenario tokens themselves.
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
exports.extractPdfTextTool = extractPdfTextTool;
const fs = __importStar(require("node:fs"));
const file_content_core_1 = require("../utils/file-content-core");
const file_inspect_path_1 = require("./_internal/file-inspect-path");
async function extractPdfTextTool(args) {
    const filePath = typeof args?.filePath === 'string' ? args.filePath : '';
    const maxChars = typeof args?.maxChars === 'number' && Number.isFinite(args.maxChars)
        ? Math.max(0, Math.floor(args.maxChars))
        : undefined;
    const resolved = (0, file_inspect_path_1.resolveFileInspectPath)(filePath, { mustExist: true });
    if (!resolved.ok) {
        return (0, file_inspect_path_1.toolErrorPayload)(resolved.error);
    }
    const kind = (0, file_content_core_1.detectFileKind)(resolved.absolutePath);
    if (kind !== 'pdf') {
        return {
            status: 'error',
            error: {
                code: 'NOT_PDF',
                message: `Expected a PDF file, detected kind '${kind}' for ${resolved.relativePath}`,
            },
        };
    }
    try {
        const size = fs.statSync(resolved.absolutePath).size;
        const fullText = await (0, file_content_core_1.extractPdfText)(resolved.absolutePath);
        let text = fullText;
        let truncated = false;
        if (maxChars !== undefined && text.length > maxChars) {
            text = text.slice(0, maxChars);
            truncated = true;
        }
        return {
            status: 'success',
            filePath: resolved.relativePath,
            kind: 'pdf',
            size,
            text,
            truncated,
            message: 'Plain text dump only. Match against scenario expected tokens from the requirement — no domain field schema.',
        };
    }
    catch (err) {
        return {
            status: 'error',
            error: {
                code: 'EXTRACT_FAILED',
                message: err instanceof Error ? err.message : String(err),
            },
        };
    }
}
//# sourceMappingURL=extract-pdf-text.js.map
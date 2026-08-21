"use strict";
/**
 * MCP: read_excel_summary — sheet names, headers, sample rows (structure dump).
 * Expected headers/cells come from the scenario, not a fixed business schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readExcelSummaryTool = readExcelSummaryTool;
const file_content_core_1 = require("../utils/file-content-core");
const file_inspect_path_1 = require("./_internal/file-inspect-path");
async function readExcelSummaryTool(args) {
    const filePath = typeof args?.filePath === 'string' ? args.filePath : '';
    const sheet = typeof args?.sheet === 'string' || typeof args?.sheet === 'number' ? args.sheet : undefined;
    const maxRows = typeof args?.maxRows === 'number' && Number.isFinite(args.maxRows)
        ? Math.max(0, Math.floor(args.maxRows))
        : 20;
    const resolved = (0, file_inspect_path_1.resolveFileInspectPath)(filePath, { mustExist: true });
    if (!resolved.ok) {
        return (0, file_inspect_path_1.toolErrorPayload)(resolved.error);
    }
    const kind = (0, file_content_core_1.detectFileKind)(resolved.absolutePath);
    if (kind !== 'xlsx' && kind !== 'zip') {
        return {
            status: 'error',
            error: {
                code: 'NOT_EXCEL',
                message: `Expected an xlsx file, detected kind '${kind}' for ${resolved.relativePath}`,
            },
        };
    }
    try {
        const summary = await (0, file_content_core_1.readExcelSummary)(resolved.absolutePath, { sheet, maxRows });
        return {
            status: 'success',
            filePath: resolved.relativePath,
            sheetNames: summary.sheetNames,
            headers: summary.headers,
            sampleRows: summary.sampleRows,
            message: 'Structure dump only. Compare headers/cells to scenario Expected Result — no patented domain schema.',
        };
    }
    catch (err) {
        return {
            status: 'error',
            error: {
                code: 'READ_EXCEL_FAILED',
                message: err instanceof Error ? err.message : String(err),
            },
        };
    }
}
//# sourceMappingURL=read-excel-summary.js.map
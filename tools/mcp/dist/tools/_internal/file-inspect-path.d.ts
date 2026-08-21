/**
 * Shared path resolution for file-inspect MCP tools.
 * Allowed roots: test-fixtures/, test-results/ (read-only).
 */
import { type ToolError } from '../../utils/safety';
export type FileInspectKind = 'test-fixtures' | 'test-results';
export declare function resolveFileInspectPath(inputPath: string, options?: {
    mustExist?: boolean;
}): {
    ok: true;
    absolutePath: string;
    relativePath: string;
    kind: FileInspectKind;
} | {
    ok: false;
    error: ToolError;
};
export declare function toolErrorPayload(error: ToolError): {
    status: "error";
    error: ToolError;
};
//# sourceMappingURL=file-inspect-path.d.ts.map
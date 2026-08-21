/**
 * MCP: read_excel_summary — sheet names, headers, sample rows (structure dump).
 * Expected headers/cells come from the scenario, not a fixed business schema.
 */

import { detectFileKind, readExcelSummary } from '../utils/file-content-core';
import { resolveFileInspectPath, toolErrorPayload } from './_internal/file-inspect-path';

export async function readExcelSummaryTool(
  args: Record<string, unknown> | undefined,
): Promise<unknown> {
  const filePath = typeof args?.filePath === 'string' ? args.filePath : '';
  const sheet =
    typeof args?.sheet === 'string' || typeof args?.sheet === 'number' ? args.sheet : undefined;
  const maxRows =
    typeof args?.maxRows === 'number' && Number.isFinite(args.maxRows)
      ? Math.max(0, Math.floor(args.maxRows))
      : 20;

  const resolved = resolveFileInspectPath(filePath, { mustExist: true });
  if (!resolved.ok) {
    return toolErrorPayload(resolved.error);
  }

  const kind = detectFileKind(resolved.absolutePath);
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
    const summary = await readExcelSummary(resolved.absolutePath, { sheet, maxRows });
    return {
      status: 'success',
      filePath: resolved.relativePath,
      sheetNames: summary.sheetNames,
      headers: summary.headers,
      sampleRows: summary.sampleRows,
      message:
        'Structure dump only. Compare headers/cells to scenario Expected Result — no patented domain schema.',
    };
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'READ_EXCEL_FAILED',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

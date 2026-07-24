/**
 * MCP: extract_pdf_text — raw PDF plain text only.
 * Does NOT define business fields. Agents match scenario tokens themselves.
 */

import * as fs from 'node:fs';
import { detectFileKind, extractPdfText } from '../utils/file-content-core';
import { resolveFileInspectPath, toolErrorPayload } from './_internal/file-inspect-path';

export async function extractPdfTextTool(
  args: Record<string, unknown> | undefined,
): Promise<unknown> {
  const filePath = typeof args?.filePath === 'string' ? args.filePath : '';
  const maxChars =
    typeof args?.maxChars === 'number' && Number.isFinite(args.maxChars)
      ? Math.max(0, Math.floor(args.maxChars))
      : undefined;

  const resolved = resolveFileInspectPath(filePath, { mustExist: true });
  if (!resolved.ok) {
    return toolErrorPayload(resolved.error);
  }

  const kind = detectFileKind(resolved.absolutePath);
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
    const fullText = await extractPdfText(resolved.absolutePath);
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
      message:
        'Plain text dump only. Match against scenario expected tokens from the requirement — no domain field schema.',
    };
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'EXTRACT_FAILED',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

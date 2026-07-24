/**
 * MCP: inspect_file — envelope metadata (kind, size, magic). No domain fields.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { detectFileKind, detectMagic, inspectFileLocal } from '../utils/file-content-core';
import { resolveFileInspectPath, toolErrorPayload } from './_internal/file-inspect-path';

export function inspectFile(args: Record<string, unknown> | undefined): unknown {
  const filePath = typeof args?.filePath === 'string' ? args.filePath : '';
  const resolved = resolveFileInspectPath(filePath, { mustExist: true });
  if (!resolved.ok) {
    return toolErrorPayload(resolved.error);
  }

  try {
    const info = inspectFileLocal(resolved.absolutePath);
    const buf = fs.readFileSync(resolved.absolutePath);
    return {
      status: 'success',
      filePath: resolved.relativePath,
      filename: path.basename(resolved.absolutePath),
      size: info.size,
      kind: detectFileKind(resolved.absolutePath, buf),
      magic: detectMagic(buf),
      suggestedKind: info.kind,
    };
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'INSPECT_FAILED',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

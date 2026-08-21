/**
 * Shared path resolution for file-inspect MCP tools.
 * Allowed roots: test-fixtures/, test-results/ (read-only).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createToolError, getRepoRoot, type ToolError } from '../../utils/safety';

export type FileInspectKind = 'test-fixtures' | 'test-results';

export function resolveFileInspectPath(
  inputPath: string,
  options: { mustExist?: boolean } = {},
):
  | { ok: true; absolutePath: string; relativePath: string; kind: FileInspectKind }
  | { ok: false; error: ToolError } {
  const repoRoot = getRepoRoot();
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

  let kind: FileInspectKind | null = null;
  if (relative === 'test-fixtures' || relative.startsWith('test-fixtures/')) {
    kind = 'test-fixtures';
  } else if (relative === 'test-results' || relative.startsWith('test-results/')) {
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

export function toolErrorPayload(error: ToolError) {
  return createToolError(error.code, error.message);
}

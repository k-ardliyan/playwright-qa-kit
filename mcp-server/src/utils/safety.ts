import * as fs from 'node:fs';
import * as path from 'node:path';

export const MAX_REQUIREMENTS_TEXT_BYTES = 256 * 1024;

export type AllowedPathKind =
  | 'requirements'
  | 'specs'
  | 'tests'
  | 'reports'
  | 'test-results'
  | 'environments';

const READ_ONLY_KINDS = new Set<AllowedPathKind>(['environments', 'test-results', 'reports']);

const ALLOWED_PREFIXES: Record<AllowedPathKind, string> = {
  requirements: 'requirements',
  specs: 'specs',
  tests: 'src/tests',
  reports: 'reports',
  'test-results': 'test-results',
  environments: 'environments',
};

export interface ToolError {
  code: string;
  message: string;
}

export function createToolError(
  code: string,
  message: string,
): { status: 'error'; error: ToolError } {
  return { status: 'error', error: { code, message } };
}

/**
 * Marker for the repository root: a `mcp-server/` subdirectory. The repo
 * root has the framework's `mcp-server/` package as a child, while the
 * `mcp-server/` subpackage's own `package.json` would otherwise be
 * misidentified as the marker when starting from inside `mcp-server/`.
 */
const REPO_MARKER_SUBDIR = 'mcp-server';
const MAX_HOPS = 12;

export function findRepoRoot(start: string): string {
  let dir = path.resolve(start);
  for (let i = 0; i < MAX_HOPS; i += 1) {
    if (fs.existsSync(path.join(dir, REPO_MARKER_SUBDIR))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start);
}

export function getRepoRoot(): string {
  return findRepoRoot(__dirname);
}

/**
 * Valid target for a requirement file under `requirements/`.
 * Default: allows examples; still blocks _TEMPLATE, README, and nested paths.
 * Pass `{ blockExamples: true }` for the pipeline-tooling view that excludes
 * example-* files (matches the previous isPipelineRequirementRelativePath).
 */
export function isValidRequirementRelativePath(
  relativePath: string,
  opts: { blockExamples?: boolean } = {},
): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const match = normalized.match(/^requirements\/([^/]+)\.md$/);
  if (!match) {
    return false;
  }

  const basename = match[1];
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
export function isPipelineRequirementRelativePath(relativePath: string): boolean {
  return isValidRequirementRelativePath(relativePath, { blockExamples: true });
}

export function assertRequirementsTextSize(text: string): ToolError | null {
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes > MAX_REQUIREMENTS_TEXT_BYTES) {
    return {
      code: 'INPUT_TOO_LARGE',
      message: `requirementsText exceeds ${MAX_REQUIREMENTS_TEXT_BYTES} bytes (${bytes} bytes).`,
    };
  }
  return null;
}

export function resolveAllowedPath(
  inputPath: string,
  kind: AllowedPathKind,
  options: { mustExist?: boolean; readOnly?: boolean } = {},
): { ok: true; absolutePath: string; relativePath: string } | { ok: false; error: ToolError } {
  const repoRoot = getRepoRoot();
  const prefix = ALLOWED_PREFIXES[kind];
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

  const allowedPrefix = prefix.replace(/\\/g, '/');
  if (relative !== allowedPrefix && !relative.startsWith(`${allowedPrefix}/`)) {
    return {
      ok: false,
      error: {
        code: 'PATH_NOT_ALLOWED',
        message: `Path must be under '${allowedPrefix}/'. Received: '${relative}'.`,
      },
    };
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
          message: `Path must be a feature file at requirements/<name>.md (not _TEMPLATE, README, or nested paths). Received: '${relative}'.`,
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

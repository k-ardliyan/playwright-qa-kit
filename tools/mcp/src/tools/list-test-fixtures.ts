/**
 * MCP: list_test_fixtures — list files under test-fixtures/ for Input Data paths.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getRepoRoot } from '../utils/safety';

function walk(dir: string, base: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    const rel = path.relative(base, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walk(abs, base, out);
    } else {
      out.push(`test-fixtures/${rel}`.replace(/\\/g, '/'));
    }
  }
}

export function listTestFixtures(args: Record<string, unknown> | undefined): unknown {
  const repoRoot = getRepoRoot();
  const fixturesRoot = path.join(repoRoot, 'test-fixtures');
  if (!fs.existsSync(fixturesRoot)) {
    return {
      status: 'success',
      fixtures: [] as string[],
      message: 'test-fixtures/ does not exist yet.',
    };
  }

  const subdir =
    typeof args?.subdir === 'string' ? args.subdir.replace(/\\/g, '/').replace(/^\//, '') : '';
  if (subdir.includes('..') || path.isAbsolute(subdir)) {
    return {
      status: 'error',
      error: {
        code: 'INVALID_PATH',
        message: 'subdir must be a relative path under test-fixtures/.',
      },
    };
  }

  const start = subdir ? path.join(fixturesRoot, subdir) : fixturesRoot;
  if (!fs.existsSync(start)) {
    return {
      status: 'error',
      error: { code: 'NOT_FOUND', message: `subdir not found: test-fixtures/${subdir}` },
    };
  }

  const fixtures: string[] = [];
  walk(start, fixturesRoot, fixtures);
  fixtures.sort((a, b) => a.localeCompare(b));

  return {
    status: 'success',
    fixtures,
    count: fixtures.length,
  };
}

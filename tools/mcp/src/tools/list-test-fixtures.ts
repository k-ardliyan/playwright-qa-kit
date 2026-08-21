/**
 * MCP: list_test_fixtures — list files under test-fixtures/ for Input Data paths.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { mcpWorkspace } from '../utils/workspace-paths';

function walk(dir: string, base: string, prefix: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    const rel = path.relative(base, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walk(abs, base, prefix, out);
    } else {
      out.push(`${prefix}/${rel}`.replace(/\\/g, '/'));
    }
  }
}

export function listTestFixtures(args: Record<string, unknown> | undefined): unknown {
  const fixturesRoot = mcpWorkspace.testDataDir;
  const prefix = mcpWorkspace.testDataRel;

  if (!fs.existsSync(fixturesRoot)) {
    return {
      status: 'success',
      fixtures: [] as string[],
      message: `${prefix}/ does not exist yet.`,
    };
  }

  const subdir =
    typeof args?.subdir === 'string' ? args.subdir.replace(/\\/g, '/').replace(/^\//, '') : '';
  if (subdir.includes('..') || path.isAbsolute(subdir)) {
    return {
      status: 'error',
      error: {
        code: 'INVALID_PATH',
        message: `subdir must be a relative path under ${prefix}/.`,
      },
    };
  }

  const start = subdir ? path.join(fixturesRoot, subdir) : fixturesRoot;
  if (!fs.existsSync(start)) {
    return {
      status: 'error',
      error: { code: 'NOT_FOUND', message: `subdir not found: ${prefix}/${subdir}` },
    };
  }

  const fixtures: string[] = [];
  walk(start, fixturesRoot, prefix, fixtures);
  fixtures.sort((a, b) => a.localeCompare(b));

  return {
    status: 'success',
    fixtures,
    count: fixtures.length,
  };
}

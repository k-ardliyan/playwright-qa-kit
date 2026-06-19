/// <reference types="node" />

/**
 * CLI wrapper for the `discover_pages` MCP tool.
 *
 * Usage:
 *   npm run discover:pages -- --root-url=https://staging.app --feature=public-pages
 *
 * Flags:
 *   --root-url=...        Required. Starting URL (same-origin only).
 *   --feature=...         Required. Lowercase feature slug.
 *   --max-depth=N         Optional (default 2).
 *   --max-pages=N         Optional (default 25).
 *   --exclude=PATTERN     Optional. Repeatable. Regex pattern.
 *   --no-robots           Optional. Skip robots.txt enforcement.
 *   --delay-ms=N          Optional (default 200).
 *   --force               Optional. Re-capture fresh catalogs.
 */

import { discoverPages } from '../mcp-server/src/tools/discover-pages';
import { bootstrapMcpEnvironment } from './mcp-bootstrap';

function parseArgs(argv: string[]): Record<string, string | boolean | string[]> {
  const out: Record<string, string | boolean | string[]> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    const key = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    const value = eq === -1 ? true : arg.slice(eq + 1);
    if (key === 'exclude') {
      const list = (out.exclude as string[] | undefined) ?? [];
      list.push(typeof value === 'string' ? value : '');
      out.exclude = list;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function requireString(args: Record<string, string | boolean | string[]>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    process.stderr.write(`Missing required flag --${key}\n`);
    process.exit(2);
  }
  return value;
}

async function main(): Promise<void> {
  bootstrapMcpEnvironment(__dirname);
  const args = parseArgs(process.argv.slice(2));
  const rootUrl = requireString(args, 'root-url');
  const featureName = requireString(args, 'feature');

  const result = await discoverPages({
    rootUrl,
    featureName,
    maxDepth:
      typeof args['max-depth'] === 'string' ? Number.parseInt(args['max-depth'], 10) : undefined,
    maxPages:
      typeof args['max-pages'] === 'string' ? Number.parseInt(args['max-pages'], 10) : undefined,
    excludePatterns: Array.isArray(args.exclude) ? args.exclude : undefined,
    respectRobots: args['no-robots'] === true ? false : undefined,
    requestDelayMs:
      typeof args['delay-ms'] === 'string' ? Number.parseInt(args['delay-ms'], 10) : undefined,
    force: args.force === true,
    waitUntil:
      args['wait-until'] === 'domcontentloaded' || args['wait-until'] === 'load'
        ? args['wait-until']
        : undefined,
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status === 'error') process.exit(1);
}

main().catch((error) => {
  process.stderr.write(
    `Unexpected error: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});

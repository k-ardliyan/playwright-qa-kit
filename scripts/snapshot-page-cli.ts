/// <reference types="node" />

/**
 * CLI wrapper for the `snapshot_page` MCP tool.
 *
 * Usage:
 *   npm run snapshot:page -- --url=https://staging.app/login --feature=login --page=login-form
 *
 * Flags:
 *   --url=...             Required. Absolute http/https URL.
 *   --feature=...         Required. Lowercase feature slug.
 *   --page=...            Required. Lowercase page slug.
 *   --wait-for=...        Optional CSS selector.
 *   --include=...         Optional CSS scope (single value).
 *   --max-elements=N      Optional (default 500).
 *   --force               Optional. Overwrite existing catalog.
 *   --wait-until=...      networkidle | domcontentloaded | load (default networkidle).
 */

import { snapshotPage } from '../mcp-server/src/tools/snapshot-page';
import { bootstrapMcpEnvironment } from './mcp-bootstrap';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq === -1) {
      out[arg.slice(2)] = true;
    } else {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
    }
  }
  return out;
}

function requireString(args: Record<string, string | boolean>, key: string): string {
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
  const url = requireString(args, 'url');
  const featureName = requireString(args, 'feature');
  const pageName = requireString(args, 'page');

  const include = typeof args.include === 'string' ? [args.include] : undefined;

  const result = await snapshotPage({
    url,
    featureName,
    pageName,
    waitForSelector: typeof args['wait-for'] === 'string' ? args['wait-for'] : undefined,
    include,
    maxElements:
      typeof args['max-elements'] === 'string'
        ? Number.parseInt(args['max-elements'], 10)
        : undefined,
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

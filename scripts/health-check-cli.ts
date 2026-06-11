/// <reference types="node" />

import { healthCheck } from '../mcp-server/src/tools/health-check';
import { findRepoRoot } from '../mcp-server/src/utils/safety';

function main(): void {
  // Anchor cwd at the repo root so health checks see the expected paths
  // even when invoked from a subdirectory.
  process.chdir(findRepoRoot(__dirname));
  const output = healthCheck();

  for (const check of output.checks) {
    const icon = check.status === 'ok' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
    process.stdout.write(`${icon} [${check.name}] ${check.message}\n`);
  }

  process.stdout.write(`\n${output.message}\n`);

  if (output.status === 'error') {
    process.exit(1);
  }
}

main();

/// <reference types="node" />

import { healthCheck } from '../mcp-server/src/tools/health-check';
import { bootstrapMcpEnvironment } from './mcp-bootstrap';

function main(): void {
  bootstrapMcpEnvironment(__dirname);
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

/// <reference types="node" />

import { spawn } from 'node:child_process';
import { getPlaywrightConfigPath } from '../mcp-server/src/utils/playwright-paths';
import { bootstrapMcpEnvironment } from './mcp-bootstrap';

bootstrapMcpEnvironment(__dirname);

const configPath = getPlaywrightConfigPath();
const child = spawn('npx', ['playwright', 'run-test-mcp-server', '-c', configPath], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  process.stderr.write(`playwright-test MCP launch failed: ${error.message}\n`);
  process.exit(1);
});

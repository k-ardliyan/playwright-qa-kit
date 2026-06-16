import * as path from 'node:path';
import { getAdapterConfigPath, getPlaywrightConfigPath } from './playwright-paths';
import { findRepoRoot } from './safety';

const ERPKU_ADAPTER_OVERLAY = { dir: 'example/erpku/environments', name: 'erpku' };

type LoadEnvironmentFn = (options?: { adapterEnv?: { dir: string; name: string } }) => void;

function getLoadEnvironment(repoRoot: string): LoadEnvironmentFn {
  // env-loader lives in template core, outside the mcp-server package.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(path.join(repoRoot, 'src/utils/env-loader')) as {
    loadEnvironment: LoadEnvironmentFn;
  };
  return mod.loadEnvironment;
}

/**
 * Anchor MCP processes at repo root and load the same env contract as Playwright configs.
 * Applies ERPKU adapter overlay when PLAYWRIGHT_CONFIG matches the adapter config path.
 */
export function bootstrapMcpEnvironment(startDir: string): string {
  const repoRoot = findRepoRoot(startDir);
  process.chdir(repoRoot);

  const loadEnvironment = getLoadEnvironment(repoRoot);
  loadEnvironment();

  const config = getPlaywrightConfigPath().replace(/\\/g, '/');
  const adapter = getAdapterConfigPath().replace(/\\/g, '/');
  if (config === adapter) {
    loadEnvironment({ adapterEnv: ERPKU_ADAPTER_OVERLAY });
  }

  return repoRoot;
}

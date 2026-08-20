import type { McpRuntimeConfig } from './types';
import { PLAYWRIGHT_MCP_CLI_ADDITIVE_CAPABILITIES } from './capability-manifest';

/**
 * Build official @playwright/mcp CLI arguments from typed runtime configuration.
 * Contract facts verified against installed 0.0.79 `--help`:
 * - `--caps` accepts ONLY additive capabilities: vision, pdf, devtools.
 * - `--allowed-origins` is a semicolon-separated list.
 * - `--browser` accepts chrome|firefox|webkit|msedge (framework default
 *   'chromium' maps to the CLI default and is omitted).
 */
export function buildPlaywrightMcpArgs(config: McpRuntimeConfig): string[] {
  const args: string[] = [];

  // Headless mode
  if (config.headless) {
    args.push('--headless');
  }

  // Browser selection (omit the framework default; 0.0.79 has no 'chromium' value)
  if (config.browser && config.browser !== 'chromium') {
    args.push(`--browser=${config.browser}`);
  }

  // Capabilities: pass only values the installed CLI accepts in --caps.
  // Base capabilities (core, network, storage, testing, config) are always on
  // in 0.0.79 and are informational in the runtime config.
  const additive = config.capabilities.filter((cap) =>
    (PLAYWRIGHT_MCP_CLI_ADDITIVE_CAPABILITIES as readonly string[]).includes(cap),
  );
  if (additive.length > 0) {
    args.push(`--caps=${additive.join(',')}`);
  }

  // Output Directory
  if (config.outputDir) {
    args.push(`--output-dir=${config.outputDir}`);
  }

  // Allowed Origins (0.0.79 expects semicolon-separated)
  if (config.allowedOrigins && config.allowedOrigins.length > 0) {
    args.push(`--allowed-origins=${config.allowedOrigins.join(';')}`);
  }

  // Storage State
  if (config.storageStatePath) {
    args.push(`--storage-state=${config.storageStatePath}`);
  }

  // Isolation
  if (config.isolated) {
    args.push('--isolated');
  }

  return args;
}

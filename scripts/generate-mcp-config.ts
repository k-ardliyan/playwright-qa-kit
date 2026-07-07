/// <reference types="node" />
/**
 * CLI script: Generate MCP configuration files
 * Usage: npx tsx scripts/generate-mcp-config.ts [--platform <platform>]
 * Platforms: copilot, claude, cursor, kiro
 * If no --platform is specified, generates for all platforms.
 */

import { generateConfig, ALL_PLATFORMS } from '../src/agents/integration/mcp-config-generator';
import type { Platform } from '../src/agents/integration/mcp-config-generator';

function main(): void {
  const args = process.argv.slice(2);
  let platform: Platform | undefined;

  const platformIdx = args.indexOf('--platform');
  if (platformIdx !== -1 && args[platformIdx + 1]) {
    const value = args[platformIdx + 1];
    if (!ALL_PLATFORMS.includes(value as Platform)) {
      console.error(
        `Error: Invalid platform '${value}'. Valid platforms: ${ALL_PLATFORMS.join(', ')}`,
      );
      process.exit(1);
    }
    platform = value as Platform;
  }

  if (platform) {
    console.log(`Generating MCP config for platform: ${platform}...`);
  } else {
    console.log('Generating MCP configs for all platforms...');
  }

  generateConfig({ platform });

  if (platform) {
    console.log(`✓ Generated MCP config for: ${platform}`);
  } else {
    console.log('✓ Generated MCP configs for: claude, cursor, kiro');
  }
}

main();

/// <reference types="node" />
/**
 * CLI script: Generate capability manifest
 * Usage: npx tsx scripts/generate-manifest.ts
 * Output: agent-manifest.json at repository root
 */

import { writeManifest } from '../src/agents/integration/manifest';

function main(): void {
  console.log('Generating agent capability manifest...');
  writeManifest();
  console.log('✓ Written: agent-manifest.json');
}

main();

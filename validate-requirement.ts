/// <reference types="node" />

import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateRequirement } from './mcp-server/src/tools/validate-requirement';
import { findRepoRoot } from './mcp-server/src/utils/safety';

function main(): void {
  const argPath = process.argv[2];

  if (!argPath) {
    console.error('Usage: npm run validate:requirement -- requirements/nama-fitur.md');
    process.exitCode = 1;
    return;
  }

  // Anchor cwd at the repo root so the relative path is computed against the
  // repo, not whatever subdirectory the user happened to invoke from.
  process.chdir(findRepoRoot(__dirname));

  const resolved = path.resolve(process.cwd(), argPath);
  if (!fs.existsSync(resolved)) {
    console.error(`✗ File not found: ${argPath}`);
    process.exitCode = 1;
    return;
  }

  const relativePath = path.relative(process.cwd(), resolved).replace(/\\/g, '/');
  const output = validateRequirement({ requirementPath: relativePath });

  for (const violation of output.violations) {
    const prefix = violation.severity === 'error' ? '✗' : '⚠';
    const scenario = violation.scenarioName ? ` [${violation.scenarioName}]` : '';
    console.error(`${prefix} ${violation.ruleName}${scenario}: ${violation.message}`);
  }

  if (output.status === 'error') {
    if (output.violations.length === 0) {
      console.error(`✗ ${output.message}`);
    }
    console.error(`Score: ${output.score}/100`);
    process.exitCode = 1;
    return;
  }

  console.log(`✓ ${output.message}`);
  if (output.violations.length > 0) {
    console.log(`⚠ ${output.violations.length} warning(s) — review before pipeline`);
  }
  process.exitCode = 0;
}

main();

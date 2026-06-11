/// <reference types="node" />

import { validateGeneratedTests } from './mcp-server/src/tools/validate-generated-tests';
import { findRepoRoot } from './mcp-server/src/utils/safety';

function main(): void {
  // Anchor cwd at the repo root so the validator scans the right tree even
  // when invoked from a subdirectory.
  process.chdir(findRepoRoot(__dirname));
  const output = validateGeneratedTests();

  if (output.status === 'error') {
    for (const violation of output.violations) {
      console.error(
        `✗ ${violation.filePath}:${violation.lineNumber}\n  Violation: ${violation.ruleName}`,
      );
    }
    if (output.violations.length === 0) {
      console.error(`✗ ${output.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`✓ Validated ${output.validatedCount} test files`);
  console.log('✓ All structural checks passed');
  process.exitCode = 0;
}

main();

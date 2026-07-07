/// <reference types="node" />
/**
 * CLI script: Validate agent instruction files
 * Usage: npx tsx scripts/validate-agents.ts [--fix]
 * Exit code: 0 on success, 1 on errors
 */

import { validateAgents, getExitCode } from '../src/agents/integration/validator';

function main(): void {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');

  console.log(`Validating agent instruction files${fix ? ' (with --fix)' : ''}...`);
  console.log('');

  const results = validateAgents({ fix });

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`  ✓ ${result.file}`);
      continue;
    }

    console.log(`  ✗ ${result.file}`);
    for (const error of result.errors) {
      const line = error.line ? `:${error.line}` : '';
      const fixable = error.fixable ? ' [fixable]' : '';
      console.log(`      ERROR${line}: ${error.message}${fixable}`);
      totalErrors++;
    }
    for (const warning of result.warnings) {
      const line = warning.line ? `:${warning.line}` : '';
      console.log(`      WARN${line}: ${warning.message}`);
      totalWarnings++;
    }
  }

  console.log('');
  console.log(`Results: ${results.length} files, ${totalErrors} errors, ${totalWarnings} warnings`);

  const exitCode = getExitCode(results);
  if (exitCode === 0) {
    console.log('✓ All agent files are valid.');
  } else {
    console.log('✗ Validation failed. Run with --fix to auto-correct fixable issues.');
  }

  process.exit(exitCode);
}

main();

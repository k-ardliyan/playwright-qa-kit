/// <reference types="node" />

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROPERTY_DIR = path.join(process.cwd(), 'src', 'tests', 'property');

function findPropertyTests(): string[] {
  if (!fs.existsSync(PROPERTY_DIR)) {
    return [];
  }

  return fs
    .readdirSync(PROPERTY_DIR)
    .filter((name) => name.endsWith('.property.ts'))
    .map((name) => path.join(PROPERTY_DIR, name))
    .sort((a, b) => a.localeCompare(b));
}

function main(): void {
  const files = findPropertyTests();

  if (files.length === 0) {
    process.stderr.write('ERROR: No property tests found in src/tests/property/\n');
    process.exit(1);
  }

  let failed = 0;

  for (const file of files) {
    const relative = path.relative(process.cwd(), file).replace(/\\/g, '/');
    process.stdout.write(`\n▶ ${relative}\n`);

    const result = spawnSync('npx', ['tsx', file], {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: true,
      stdio: 'inherit',
    });

    if ((result.status ?? 1) !== 0) {
      process.stderr.write(`✗ Failed: ${relative}\n`);
      failed += 1;
    }
  }

  process.stdout.write(`\n${files.length - failed}/${files.length} property test files passed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();

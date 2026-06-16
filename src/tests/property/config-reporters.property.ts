/// <reference types="node" />

// createFrameworkReporters: JSON + custom reporter tuple for Healer/MCP pipeline

import assert from 'node:assert/strict';
import { createFrameworkReporters } from '../../../playwright.config.base';

const reporters = createFrameworkReporters({
  jsonOutput: 'test-results/results.json',
  htmlFolder: './reports/html',
  customReporterPath: './e2e/support/custom-reporter.ts',
});

if (!reporters) {
  throw new Error('createFrameworkReporters returned undefined');
}

assert.equal(Array.isArray(reporters), true);
assert.equal(reporters.length, 4);

const listReporter = reporters[0];
assert.deepEqual(listReporter, ['list']);

const jsonReporter = reporters[1];
assert.deepEqual(jsonReporter, ['json', { outputFile: 'test-results/results.json' }]);

const htmlReporter = reporters[2];
assert.deepEqual(htmlReporter, ['html', { outputFolder: './reports/html', open: 'never' }]);

const customReporter = reporters[3];
assert.deepEqual(customReporter, ['./e2e/support/custom-reporter.ts']);

process.stdout.write('✓ Property: createFrameworkReporters tuple shape\n');

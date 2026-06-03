/// <reference types="node" />

// Feature: playwright-ai-agent-framework, Property 1: Test Failure Data Retrieval
// Feature: playwright-ai-agent-framework, Property 11: Requirements to Test Data Transformation

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import fc from 'fast-check';
import { getTestFailures, type TestFailure } from '../../../mcp-server/src/tools/get-test-failures';

function normalizeFailure(item: TestFailure): TestFailure {
  const normalized: TestFailure = {
    testTitle: item.testTitle,
    filePath: item.filePath,
    errorMessage: item.errorMessage,
    duration: item.duration,
  };

  if (typeof item.lineNumber === 'number') {
    normalized.lineNumber = item.lineNumber;
  }

  if (typeof item.stackTrace === 'string') {
    normalized.stackTrace = item.stackTrace;
  }

  return normalized;
}

function createTempResultsDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-failures-'));
}

function writeFailureFile(resultsDir: string, failures: TestFailure[]): void {
  const payload = { failures: failures.map(normalizeFailure) };
  const filePath = path.join(resultsDir, 'results.json');
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function cleanupDir(resultsDir: string): void {
  fs.rmSync(resultsDir, { recursive: true, force: true });
}

const failureArbitrary = fc.record({
  testTitle: fc.string({ minLength: 1, maxLength: 60 }),
  filePath: fc.string({ minLength: 1, maxLength: 80 }),
  errorMessage: fc.string({ minLength: 1, maxLength: 120 }),
  duration: fc.integer({ min: 0, max: 180000 }),
  lineNumber: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  stackTrace: fc.option(fc.string({ minLength: 1, maxLength: 220 }), { nil: undefined }),
});

async function property1DataRetrieval(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(fc.array(failureArbitrary, { minLength: 1, maxLength: 8 }), async (rows) => {
      const failures = rows.map(normalizeFailure);
      const resultsDir = createTempResultsDir();

      try {
        writeFailureFile(resultsDir, failures);

        const output = getTestFailures(resultsDir);
        assert.equal(output.status, 'success');
        assert.equal(output.failures.length, failures.length);

        output.failures.forEach((item, index) => {
          assert.equal(item.testTitle, failures[index].testTitle);
          assert.equal(item.filePath, failures[index].filePath);
          assert.equal(item.errorMessage, failures[index].errorMessage);
          assert.equal(item.duration, failures[index].duration);
        });
      } finally {
        cleanupDir(resultsDir);
      }
    }),
    { numRuns: 18 },
  );

  console.log('✓ Property 1 passed: get_test_failures data retrieval');
}

async function property11DataPreservation(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(fc.array(failureArbitrary, { minLength: 1, maxLength: 8 }), async (rows) => {
      const failures = rows.map(normalizeFailure);
      const resultsDir = createTempResultsDir();

      try {
        writeFailureFile(resultsDir, failures);
        const output = getTestFailures(resultsDir);

        assert.equal(output.status, 'success');
        assert.deepEqual(output.failures, failures);
      } finally {
        cleanupDir(resultsDir);
      }
    }),
    { numRuns: 18 },
  );

  console.log('✓ Property 11 passed: get_test_failures data preservation');
}

async function main(): Promise<void> {
  await property1DataRetrieval();
  await property11DataPreservation();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

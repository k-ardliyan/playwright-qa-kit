/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 19: Cross-Browser Failure Exclusivity
// **Validates: Requirements 8.5**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { mergeResults } from '../../executor/multi-browser';
import type { ShardResult, BrowserTarget, TestResultEntry } from '../../shared/types';

/**
 * Supported browsers for matrix generation.
 */
const browsers: BrowserTarget[] = ['chromium', 'firefox', 'webkit'];

/**
 * Generates a unique test title.
 */
const testTitleArb = fc
  .stringMatching(/^[a-z][a-z0-9 -]{2,30}$/)
  .filter((s) => s.trim().length >= 3);

/**
 * Generates a test result entry for a given test title with an arbitrary pass/fail/skip outcome.
 */
function testResultEntryArb(testTitle: string): fc.Arbitrary<TestResultEntry> {
  return fc
    .record({
      testTitle: fc.constant(testTitle),
      filePath: fc.constant(`tests/${testTitle.replace(/\s+/g, '-')}.spec.ts`),
      passed: fc.boolean(),
      skipped: fc.constant(false),
      duration: fc.integer({ min: 10, max: 5000 }),
      errorMessage: fc.constant(undefined),
    })
    .map((entry) => ({
      ...entry,
      errorMessage: entry.passed ? undefined : `Error in ${testTitle}`,
    }));
}

/**
 * Generates ShardResult[] with various test pass/fail patterns across multiple browsers.
 * Each browser gets one shard containing all test results for that browser.
 */
const shardResultsArb: fc.Arbitrary<ShardResult[]> = fc
  .tuple(
    // Generate 1-8 unique test titles
    fc.uniqueArray(testTitleArb, { minLength: 1, maxLength: 8 }),
    // Choose 2-3 browsers to participate
    fc.subarray(browsers, { minLength: 2, maxLength: 3 }),
  )
  .chain(([testTitles, selectedBrowsers]) => {
    // For each browser, generate a ShardResult with test results for all titles
    const shardArbs = selectedBrowsers.map((browser) => {
      const testResultsArb = fc.tuple(...testTitles.map((title) => testResultEntryArb(title)));

      return testResultsArb.map((testResults): ShardResult => {
        const passed = testResults.filter((r) => r.passed).length;
        const failed = testResults.filter((r) => !r.passed).length;
        return {
          shardIndex: 0,
          browser,
          passed,
          failed,
          duration: testResults.reduce((sum, r) => sum + r.duration, 0),
          testResults,
        };
      });
    });

    return fc.tuple(...shardArbs);
  })
  .map((shards) => shards as ShardResult[]);

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(shardResultsArb, async (shardResults) => {
      const merged = mergeResults(shardResults);

      // Collect all test titles from crossBrowserFailures
      const crossBrowserTitles = new Set(merged.crossBrowserFailures.map((f) => f.testTitle));

      // Collect all test titles from browserSpecificFailures (across all browsers)
      const browserSpecificTitles = new Set<string>();
      for (const [, failures] of merged.browserSpecificFailures) {
        for (const failure of failures) {
          browserSpecificTitles.add(failure.testTitle);
        }
      }

      // Assert: no test title appears in both sets — they must be disjoint
      for (const title of crossBrowserTitles) {
        assert.ok(
          !browserSpecificTitles.has(title),
          `Test "${title}" appears in BOTH crossBrowserFailures and browserSpecificFailures — sets must be disjoint`,
        );
      }

      for (const title of browserSpecificTitles) {
        assert.ok(
          !crossBrowserTitles.has(title),
          `Test "${title}" appears in BOTH browserSpecificFailures and crossBrowserFailures — sets must be disjoint`,
        );
      }
    }),
    { numRuns: 200 },
  );

  console.log('✓ Property 19 passed: cross-browser failure exclusivity (disjoint sets)');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/// <reference types="node" />

// Feature: framework-robustness-improvement
// Property 15: Priority Ordering Respects Healability Rules
// For any set of failures, failures with known high-confidence patterns SHALL have
// higher priority (lower number) than failures without patterns, and failures in
// shared fixtures SHALL have higher priority than failures in isolated files.
//
// **Validates: Requirements 7.2, 7.3, 7.4**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { prioritizeFailures } from '../../agents/healer/failure-prioritizer';
import type { TestFailure, RootCauseCategory } from '../../shared/types';
import type { HealPatternDatabase } from '../../shared/types/heal-patterns.schema';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Shared fixture path indicators (mirrors failure-prioritizer.ts) */
const SHARED_INDICATORS = ['fixture', 'page', 'shared'];

/** Healability rank: lower index = higher priority */
const HEALABILITY_RANK: RootCauseCategory[] = [
  'locator',
  'timing',
  'data_state',
  'network',
  'auth',
  'product_bug',
];

// ─── Generators ────────────────────────────────────────────────────────────────

/** Generate a file path that IS a shared fixture (contains 'fixture', 'page', or 'shared'). */
function arbitrarySharedFixturePath(): fc.Arbitrary<string> {
  return fc
    .tuple(
      fc.constantFrom('src/tests/', 'tests/', 'e2e/'),
      fc.constantFrom('fixture', 'page', 'shared'),
      fc.stringMatching(/^[a-z0-9]{1,10}$/),
    )
    .map(([prefix, indicator, suffix]) => `${prefix}${indicator}-${suffix}.ts`);
}

/** Generate a file path that is NOT a shared fixture (no shared indicators). */
function arbitraryIsolatedPath(): fc.Arbitrary<string> {
  return fc
    .tuple(fc.constantFrom('src/tests/', 'tests/', 'e2e/'), fc.stringMatching(/^[a-z0-9]{3,15}$/))
    .map(([prefix, name]) => `${prefix}${name}.spec.ts`)
    .filter((path) => !SHARED_INDICATORS.some((ind) => path.toLowerCase().includes(ind)));
}

/** Generate a root cause category. */
function arbitraryRootCause(): fc.Arbitrary<RootCauseCategory> {
  return fc.constantFrom<RootCauseCategory>(
    'locator',
    'timing',
    'data_state',
    'network',
    'auth',
    'product_bug',
  );
}

/** Build a TestFailure with explicit rootCause and filePath. */
function makeFailure(filePath: string, rootCause: RootCauseCategory, id: number): TestFailure {
  return {
    testTitle: `Test ${id}`,
    filePath,
    errorMessage: `Error in test ${id}: ${rootCause} issue`,
    rootCause,
  };
}

/** Empty pattern database — isolates the shared-fixture and healability rules. */
function emptyDatabase(): HealPatternDatabase {
  return {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    patterns: [],
    statistics: {
      totalPatterns: 0,
      totalApplications: 0,
      overallSuccessRate: 0,
    },
  };
}

// ─── Property Test ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const emptyDb = emptyDatabase();

  // Sub-property A: Shared fixture failures have higher priority than isolated failures
  // (when both have the same rootCause and no patterns match)
  await fc.assert(
    fc.asyncProperty(
      arbitrarySharedFixturePath(),
      arbitraryIsolatedPath(),
      arbitraryRootCause(),
      async (sharedPath, isolatedPath, rootCause) => {
        const sharedFailure = makeFailure(sharedPath, rootCause, 1);
        const isolatedFailure = makeFailure(isolatedPath, rootCause, 2);

        const results = prioritizeFailures([sharedFailure, isolatedFailure], emptyDb);

        // Find priorities for each failure
        const sharedResult = results.find((r) => r.failure.filePath === sharedPath);
        const isolatedResult = results.find((r) => r.failure.filePath === isolatedPath);

        assert.ok(sharedResult, 'Shared failure must appear in output');
        assert.ok(isolatedResult, 'Isolated failure must appear in output');

        // Shared fixture should have lower priority number (= higher priority)
        assert.ok(
          sharedResult.priority < isolatedResult.priority,
          `Shared fixture (priority=${sharedResult.priority}) should have higher priority ` +
            `(lower number) than isolated (priority=${isolatedResult.priority}). ` +
            `Shared path: ${sharedPath}, Isolated path: ${isolatedPath}, rootCause: ${rootCause}`,
        );
      },
    ),
    { numRuns: 100 },
  );

  console.log('  ✓ Sub-property A: shared fixture failures prioritized above isolated');

  // Sub-property B: Locator root cause has higher priority than product_bug
  // (when both are in isolated files, no patterns match)
  await fc.assert(
    fc.asyncProperty(
      arbitraryIsolatedPath(),
      arbitraryIsolatedPath().filter((_p2) => true), // second independent isolated path
      async (path1, path2) => {
        // Ensure distinct paths for deterministic ordering
        const locatorPath = path1 < path2 ? path1 : path2;
        const bugPath = path1 < path2 ? path2 : path1;
        if (locatorPath === bugPath) return; // skip degenerate case

        const locatorFailure = makeFailure(locatorPath, 'locator', 1);
        const bugFailure = makeFailure(bugPath, 'product_bug', 2);

        const results = prioritizeFailures([locatorFailure, bugFailure], emptyDb);

        const locatorResult = results.find((r) => r.failure.rootCause === 'locator');
        const bugResult = results.find((r) => r.failure.rootCause === 'product_bug');

        assert.ok(locatorResult, 'Locator failure must appear in output');
        assert.ok(bugResult, 'Product bug failure must appear in output');

        // Locator (healability index 0) should have higher priority than product_bug (index 5)
        assert.ok(
          locatorResult.priority < bugResult.priority,
          `Locator (priority=${locatorResult.priority}) should have higher priority ` +
            `(lower number) than product_bug (priority=${bugResult.priority})`,
        );
      },
    ),
    { numRuns: 100 },
  );

  console.log('  ✓ Sub-property B: locator root cause prioritized above product_bug');

  // Sub-property C: Healability ordering is total — for any two distinct root causes
  // with the same fixture status, the more healable one gets higher priority
  await fc.assert(
    fc.asyncProperty(
      arbitraryRootCause(),
      arbitraryRootCause(),
      fc.boolean(), // whether to use shared paths
      async (rootCause1, rootCause2, useShared) => {
        // Only test when root causes are different
        const rank1 = HEALABILITY_RANK.indexOf(rootCause1);
        const rank2 = HEALABILITY_RANK.indexOf(rootCause2);
        if (rank1 === rank2) return; // skip same root cause

        // Use distinct file paths (alphabetically separated to avoid tie-breaker interference)
        const pathGen = useShared ? 'src/tests/shared-aaa.ts' : 'src/tests/aaa-isolated.spec.ts';
        const pathGen2 = useShared ? 'src/tests/shared-zzz.ts' : 'src/tests/zzz-isolated.spec.ts';

        const failure1 = makeFailure(pathGen, rootCause1, 1);
        const failure2 = makeFailure(pathGen2, rootCause2, 2);

        const results = prioritizeFailures([failure1, failure2], emptyDb);

        const result1 = results.find((r) => r.failure.rootCause === rootCause1);
        const result2 = results.find((r) => r.failure.rootCause === rootCause2);

        assert.ok(result1, `Failure with rootCause ${rootCause1} must appear in output`);
        assert.ok(result2, `Failure with rootCause ${rootCause2} must appear in output`);

        // More healable (lower rank index) should have lower priority number
        if (rank1 < rank2) {
          assert.ok(
            result1.priority < result2.priority,
            `${rootCause1} (rank ${rank1}) should have higher priority than ${rootCause2} (rank ${rank2}). ` +
              `Got priorities: ${result1.priority} vs ${result2.priority}`,
          );
        } else {
          assert.ok(
            result2.priority < result1.priority,
            `${rootCause2} (rank ${rank2}) should have higher priority than ${rootCause1} (rank ${rank1}). ` +
              `Got priorities: ${result2.priority} vs ${result1.priority}`,
          );
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log('  ✓ Sub-property C: healability ordering is respected for all root cause pairs');
  console.log('✓ Property 15 passed: priority ordering respects healability rules');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

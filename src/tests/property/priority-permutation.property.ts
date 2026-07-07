/// <reference types="node" />

// Feature: framework-robustness-improvement
// Property 14: Priority Assignment Is a Permutation
// For any set of N failures, prioritizeFailures SHALL produce exactly N results
// with unique priority values forming a permutation of [1..N].
//
// **Validates: Requirements 7.5, 7.6**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { prioritizeFailures } from '../../agents/healer/failure-prioritizer';
import { createEmptyDatabase } from '../../agents/healer/pattern-database';
import type { TestFailure, RootCauseCategory } from '../../shared/types';

const ROOT_CAUSES: RootCauseCategory[] = [
  'locator',
  'timing',
  'data_state',
  'network',
  'auth',
  'product_bug',
];

/**
 * Generates an arbitrary TestFailure with random but valid fields.
 */
const arbTestFailure: fc.Arbitrary<TestFailure> = fc.record({
  testTitle: fc.string({ minLength: 1, maxLength: 80 }),
  filePath: fc.string({ minLength: 1, maxLength: 120 }),
  errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
  duration: fc.option(fc.nat({ max: 60000 }), { nil: undefined }),
  rootCause: fc.option(fc.constantFrom(...ROOT_CAUSES), { nil: undefined }),
});

async function main(): Promise<void> {
  const db = createEmptyDatabase();

  await fc.assert(
    fc.asyncProperty(
      fc.array(arbTestFailure, { minLength: 1, maxLength: 20 }),
      async (failures) => {
        const result = prioritizeFailures(failures, db);
        const n = failures.length;

        // Output length === input length (no failures dropped)
        assert.equal(result.length, n, `Expected ${n} results but got ${result.length}`);

        // Extract priority values
        const priorities = result.map((r) => r.priority);

        // All priorities must be unique (no duplicates)
        const uniquePriorities = new Set(priorities);
        assert.equal(
          uniquePriorities.size,
          n,
          `Expected ${n} unique priorities but got ${uniquePriorities.size}. Priorities: [${priorities.join(', ')}]`,
        );

        // Priority values must form exactly the set [1..N]
        const expected = Array.from({ length: n }, (_, i) => i + 1);
        const sorted = [...priorities].sort((a, b) => a - b);
        assert.deepEqual(
          sorted,
          expected,
          `Priorities should be a permutation of [1..${n}]. Got: [${sorted.join(', ')}]`,
        );
      },
    ),
    { numRuns: 200 },
  );

  console.log('✓ Property 14 passed: priority assignment is a permutation of [1..N]');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

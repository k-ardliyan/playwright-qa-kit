/// <reference types="node" />

// Feature: framework-robustness-improvement
// Property 12: Match Score Bounded
// For any pair of failure signatures, computeMatchScore SHALL always return
// a value between 0.0 and 1.0 inclusive.
//
// **Validates: Requirements 6.2, 6.5**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { computeMatchScore } from '../../agents/healer/pattern-matcher';
import type { FailureSignature } from '../../shared/types';

/**
 * Arbitrary generator for FailureSignature objects.
 * Generates required fields (errorType, errorPattern) plus optional
 * selectorType and pageContext fields.
 */
function arbitraryFailureSignature(): fc.Arbitrary<FailureSignature> {
  return fc.record(
    {
      errorType: fc.oneof(
        fc.constantFrom('timeout', 'locator', 'assertion', 'state'),
        fc.string({ minLength: 1, maxLength: 30 }),
      ),
      errorPattern: fc.oneof(
        fc.string({ minLength: 0, maxLength: 50 }),
        // Include some regex-safe patterns
        fc.constantFrom('.*timeout.*', 'Element not found', 'expected .+ to be visible'),
      ),
      selectorType: fc.option(
        fc.oneof(
          fc.constantFrom('getByRole', 'getByTestId', 'css'),
          fc.string({ minLength: 1, maxLength: 20 }),
        ),
        { nil: undefined },
      ),
      pageContext: fc.option(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('/login', '/dashboard', '/settings/profile'),
        ),
        { nil: undefined },
      ),
    },
    { requiredKeys: ['errorType', 'errorPattern'] },
  );
}

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      arbitraryFailureSignature(),
      arbitraryFailureSignature(),
      async (incoming, stored) => {
        const score = computeMatchScore(incoming, stored);

        // Core property: score is always between 0.0 and 1.0 inclusive
        assert.ok(
          score >= 0.0,
          `Score must be >= 0.0, got ${score} for incoming=${JSON.stringify(incoming)}, stored=${JSON.stringify(stored)}`,
        );
        assert.ok(
          score <= 1.0,
          `Score must be <= 1.0, got ${score} for incoming=${JSON.stringify(incoming)}, stored=${JSON.stringify(stored)}`,
        );

        // Additional invariant: score is a finite number (not NaN or Infinity)
        assert.ok(Number.isFinite(score), `Score must be a finite number, got ${score}`);
      },
    ),
    { numRuns: 200 },
  );

  console.log('✓ Property 12 passed: match score is always bounded between 0.0 and 1.0 inclusive');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

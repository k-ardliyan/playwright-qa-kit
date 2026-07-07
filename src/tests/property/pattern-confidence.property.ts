/// <reference types="node" />

// Feature: framework-robustness-improvement
// Property 9: Pattern Confidence Consistency
// For any pattern in the database with successCount S and failureCount F where S + F > 0,
// the confidence value SHALL equal S / (S + F).
//
// **Validates: Requirements 5.4, 5.2, 5.3**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  storePattern,
  recordPatternOutcome,
  createEmptyDatabase,
} from '../../agents/healer/pattern-database';
import type { FailureSignature, FixTemplate } from '../../shared/types';

function makeSignature(id: number): FailureSignature {
  return {
    errorType: 'locator',
    errorPattern: `pattern-${id}`,
    selectorType: 'getByRole',
    pageContext: `/page-${id}`,
  };
}

function makeFix(): FixTemplate {
  return {
    strategy: 'replace_locator',
    beforePattern: 'await page.locator(".old")',
    afterTemplate: 'await page.getByRole("button")',
  };
}

async function main(): Promise<void> {
  // Property 9: After storing a pattern and applying random success/failure outcomes,
  // confidence always equals successCount / (successCount + failureCount)
  await fc.assert(
    fc.asyncProperty(
      // Generate a random sequence of boolean outcomes (true = success, false = failure)
      fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }),
      async (outcomes) => {
        let db = createEmptyDatabase();
        const signature = makeSignature(1);
        const fix = makeFix();

        // Store the initial pattern (first outcome in the sequence)
        db = storePattern(db, signature, fix, outcomes[0]);

        // Verify initial state
        let pattern = db.patterns.find((p) => p.signature.errorPattern === signature.errorPattern);
        assert.ok(pattern, 'Pattern should exist after store');

        // storePattern for a NEW pattern always sets successCount=1, failureCount=0
        // when it creates a new entry regardless of `success` param.
        let expectedSuccess = 1;
        let expectedFailure = 0;

        // For the first call, since it's a new pattern, S=1 F=0 regardless of success param
        assert.equal(pattern!.successCount, 1);
        assert.equal(pattern!.failureCount, 0);
        assert.equal(pattern!.confidence, 1.0);

        // Apply remaining outcomes via recordPatternOutcome
        for (let i = 1; i < outcomes.length; i++) {
          const patternId: string = pattern!.id;
          db = recordPatternOutcome(db, patternId, outcomes[i]);

          // Re-fetch the pattern
          pattern = db.patterns.find((p) => p.id === patternId);
          assert.ok(pattern, 'Pattern should still exist after outcome recording');

          // Track expected counts
          if (outcomes[i]) {
            expectedSuccess++;
          } else {
            expectedFailure++;
          }

          // Core invariant: S + F > 0 always holds
          const total = pattern!.successCount + pattern!.failureCount;
          assert.ok(total > 0, 'S + F must always be > 0');

          // Core property: confidence === S / (S + F)
          assert.equal(pattern!.successCount, expectedSuccess);
          assert.equal(pattern!.failureCount, expectedFailure);

          const expectedConfidence = expectedSuccess / (expectedSuccess + expectedFailure);
          assert.ok(
            Math.abs(pattern!.confidence - expectedConfidence) < 1e-10,
            `Confidence mismatch: got ${pattern!.confidence}, expected ${expectedConfidence} (S=${expectedSuccess}, F=${expectedFailure})`,
          );
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log('✓ Property 9 passed: pattern confidence consistency (confidence === S / (S + F))');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

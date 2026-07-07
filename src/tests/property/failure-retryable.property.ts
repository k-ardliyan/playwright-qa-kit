/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 8: Retryable vs Non-Retryable Classification
// **Validates: Requirements 4.1, 4.2**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  classifyFailure,
  isRetryable,
  GenerationError,
} from '../../agents/generator/failure-classifier';
import { FailureClassification } from '../../shared/types';

/** All possible FailureClassification values */
const ALL_CLASSIFICATIONS: FailureClassification[] = [
  'transient_network',
  'selector_not_found',
  'app_unavailable',
  'timeout',
  'auth_required',
  'structural_error',
];

/** Classifications that MUST be retryable */
const RETRYABLE_CLASSIFICATIONS: FailureClassification[] = [
  'transient_network',
  'selector_not_found',
  'app_unavailable',
  'timeout',
];

/** Classifications that MUST NOT be retryable */
const NON_RETRYABLE_CLASSIFICATIONS: FailureClassification[] = [
  'auth_required',
  'structural_error',
];

/** Arbitrary generator for GenerationError objects */
const generationErrorArb: fc.Arbitrary<GenerationError> = fc.record({
  message: fc.oneof(
    fc.string(),
    fc.constantFrom(
      'ECONNREFUSED localhost:3000',
      'ETIMEDOUT',
      'fetch failed',
      'waiting for locator .btn',
      'resolved to 0 elements',
      'timeout exceeded',
      'redirect to login page',
      '401 Unauthorized',
      '403 Forbidden',
      '502 Bad Gateway on server baseURL',
      'unexpected token in response',
      '',
    ),
  ),
  code: fc.option(fc.constantFrom('ECONNREFUSED', 'ETIMEDOUT', 'ERR_NETWORK', undefined), {
    nil: undefined,
  }),
  statusCode: fc.option(
    fc.oneof(fc.constantFrom(200, 401, 403, 500, 502, 503, undefined), fc.nat({ max: 599 })),
    { nil: undefined },
  ),
});

async function main(): Promise<void> {
  // Property 8a: For any GenerationError, classifyFailure returns a valid classification
  // and isRetryable is consistent with the retryable/non-retryable mapping
  await fc.assert(
    fc.asyncProperty(generationErrorArb, async (error) => {
      const classification = classifyFailure(error);

      // Classification must be one of the known values
      assert.ok(
        ALL_CLASSIFICATIONS.includes(classification),
        `classifyFailure returned unknown classification: ${classification}`,
      );

      const retryable = isRetryable(classification);

      // Check retryable mapping is consistent
      if (RETRYABLE_CLASSIFICATIONS.includes(classification)) {
        assert.equal(
          retryable,
          true,
          `Classification '${classification}' should be retryable but isRetryable returned false`,
        );
      }

      if (NON_RETRYABLE_CLASSIFICATIONS.includes(classification)) {
        assert.equal(
          retryable,
          false,
          `Classification '${classification}' should NOT be retryable but isRetryable returned true`,
        );
      }
    }),
    { numRuns: 200 },
  );

  // Property 8b: Direct verification of all known classifications
  for (const classification of RETRYABLE_CLASSIFICATIONS) {
    assert.equal(
      isRetryable(classification),
      true,
      `isRetryable('${classification}') must be true`,
    );
  }

  for (const classification of NON_RETRYABLE_CLASSIFICATIONS) {
    assert.equal(
      isRetryable(classification),
      false,
      `isRetryable('${classification}') must be false`,
    );
  }

  // Property 8c: The retryable and non-retryable sets are exhaustive and non-overlapping
  const allMapped = [...RETRYABLE_CLASSIFICATIONS, ...NON_RETRYABLE_CLASSIFICATIONS];
  assert.equal(
    allMapped.length,
    ALL_CLASSIFICATIONS.length,
    'Retryable + non-retryable must cover all classifications',
  );
  for (const c of ALL_CLASSIFICATIONS) {
    assert.ok(allMapped.includes(c), `Classification '${c}' is not in retryable or non-retryable`);
  }

  console.log(
    '✓ Property 8 passed: retryable vs non-retryable classification is consistent for all inputs',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

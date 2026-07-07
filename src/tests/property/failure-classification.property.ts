/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 22: Failure Classification Is Total
// **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { classifyFailure, GenerationError } from '../../agents/generator/failure-classifier';

const VALID_CLASSIFICATIONS = new Set([
  'transient_network',
  'selector_not_found',
  'app_unavailable',
  'auth_required',
  'structural_error',
  'timeout',
]);

const arbGenerationError: fc.Arbitrary<GenerationError> = fc.record({
  message: fc.string(),
  code: fc.option(fc.string(), { nil: undefined }),
  statusCode: fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
});

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(arbGenerationError, async (error) => {
      const result = classifyFailure(error);
      assert(result !== null && result !== undefined, 'Classification must not be null/undefined');
      assert(VALID_CLASSIFICATIONS.has(result), `Invalid classification: ${result}`);
    }),
    { numRuns: 200 },
  );
  console.log(
    '✓ Property 22 passed: failure classification is total (always returns valid variant)',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 7: Retry Follows Exponential Backoff
// **Validates: Requirements 4.3**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { calculateBackoffDelay } from '../../agents/generator/retry-engine';

async function main(): Promise<void> {
  // Property 7: For any retry attempt number and base delay,
  // the actual delay SHALL equal min(retryDelayMs × 2^(attempt-1), 30000)
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 10000 }), // retryDelayMs (positive integers 1-10000)
      fc.integer({ min: 1, max: 20 }), // attempt number (1-20)
      async (retryDelayMs, attempt) => {
        const result = calculateBackoffDelay(retryDelayMs, attempt);

        // Assert: result === min(retryDelayMs × 2^(attempt-1), 30000)
        const expected = Math.min(retryDelayMs * Math.pow(2, attempt - 1), 30000);
        assert.equal(
          result,
          expected,
          `Expected ${expected} but got ${result} for retryDelayMs=${retryDelayMs}, attempt=${attempt}`,
        );

        // Also verify: result is never negative or NaN
        assert.equal(Number.isNaN(result), false, 'Result must not be NaN');
        assert.ok(result >= 0, `Result must not be negative, got ${result}`);

        // Also verify: result never exceeds 30000
        assert.ok(result <= 30000, `Result must not exceed 30000, got ${result}`);
      },
    ),
    { numRuns: 200 },
  );

  console.log('✓ Property 7 passed: retry follows exponential backoff');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

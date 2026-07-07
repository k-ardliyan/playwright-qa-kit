/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 5: Partial Generation Preserves Scenario Count
// **Validates: Requirements 3.5, 3.2, 3.3, 3.4**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  generatePartial,
  TestPlan,
  TestScenario,
  ScenarioGenerator,
  ScenarioGenerationResult,
} from '../../agents/generator/partial-engine';
import { GenerationOptions } from '../../shared/types';

const defaultOptions: GenerationOptions = {
  maxRetriesPerScenario: 0,
  retryDelayMs: 10,
  fallbackToSkeleton: false,
  continueOnFailure: true,
  selectorCatalogRequired: false,
  liveVerificationTimeout: 1000,
};

/** Arbitrary for a single TestScenario */
const arbScenario: fc.Arbitrary<TestScenario> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  steps: fc.string({ minLength: 1, maxLength: 100 }),
  expectedResult: fc.string({ minLength: 1, maxLength: 100 }),
});

/** Arbitrary for a TestPlan with 0–20 scenarios */
const arbTestPlan: fc.Arbitrary<TestPlan> = fc
  .array(arbScenario, { minLength: 0, maxLength: 20 })
  .map((scenarios) => ({ scenarios }));

/**
 * Creates a ScenarioGenerator that randomly succeeds or fails per scenario
 * based on a pre-determined success pattern (array of booleans).
 */
function makeRandomGenerator(successPattern: boolean[]): ScenarioGenerator {
  let index = 0;
  return async (_scenario: TestScenario): Promise<ScenarioGenerationResult> => {
    const shouldSucceed = successPattern[index % successPattern.length] ?? true;
    index++;
    if (shouldSucceed) {
      return {
        success: true,
        filePath: `src/tests/generated-${index}.spec.ts`,
        verified: true,
        verificationMethod: 'none',
      };
    }
    return {
      success: false,
      error: { message: 'Simulated failure for property testing' },
    };
  };
}

async function main(): Promise<void> {
  // Property 5: generated.length + skipped.length === plan.scenarios.length
  await fc.assert(
    fc.asyncProperty(
      arbTestPlan,
      fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
      async (plan, successPattern) => {
        const generator = makeRandomGenerator(successPattern);
        const result = await generatePartial(plan, defaultOptions, generator);

        // Core invariant: no scenario lost or duplicated
        assert.equal(
          result.generated.length + result.skipped.length,
          plan.scenarios.length,
          `generated(${result.generated.length}) + skipped(${result.skipped.length}) must equal total(${plan.scenarios.length})`,
        );

        // Validate status is consistent with counts (Requirements 3.2, 3.3, 3.4)
        if (plan.scenarios.length === 0) {
          assert.equal(result.status, 'complete', 'Empty plan must be complete');
        } else if (result.skipped.length === 0) {
          assert.equal(result.status, 'complete', 'No skips must be complete');
        } else if (result.generated.length === 0) {
          assert.equal(result.status, 'failed', 'No generated must be failed');
        } else {
          assert.equal(result.status, 'partial', 'Mixed results must be partial');
        }
      },
    ),
    { numRuns: 200 },
  );

  console.log(
    '✓ Property 5 passed: partial generation preserves scenario count (generated + skipped = total)',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

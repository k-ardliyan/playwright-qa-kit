/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 6: Generation Status Determined by Results
// **Validates: Requirements 3.2, 3.3, 3.4**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  generatePartial,
  TestPlan,
  TestScenario,
  ScenarioGenerator,
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

// ─── Generators ───────────────────────────────────────────────────────────────

const arbScenario: fc.Arbitrary<TestScenario> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }),
  steps: fc.string({ minLength: 1 }),
  expectedResult: fc.string({ minLength: 1 }),
});

const arbNonEmptyScenarios: fc.Arbitrary<TestScenario[]> = fc.array(arbScenario, {
  minLength: 1,
  maxLength: 10,
});

// ─── Scenario Generators (callbacks) ──────────────────────────────────────────

const allSuccessGenerator: ScenarioGenerator = async (scenario) => ({
  success: true,
  filePath: `src/tests/${scenario.id}.spec.ts`,
  verified: true,
  verificationMethod: 'none',
});

const allFailGenerator: ScenarioGenerator = async () => ({
  success: false,
  error: { message: 'Simulated failure', code: 'ERR_SIMULATED' },
});

function mixedGenerator(failIndices: Set<number>): ScenarioGenerator {
  let callIndex = 0;
  return async (scenario) => {
    const shouldFail = failIndices.has(callIndex);
    callIndex++;
    if (shouldFail) {
      return {
        success: false,
        error: { message: 'Simulated partial failure', code: 'ERR_MIXED' },
      };
    }
    return {
      success: true,
      filePath: `src/tests/${scenario.id}.spec.ts`,
      verified: true,
      verificationMethod: 'none',
    };
  };
}

// ─── Properties ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Property 6a: All-success generator → status === 'complete'
  // Validates Requirement 3.2
  await fc.assert(
    fc.asyncProperty(arbNonEmptyScenarios, async (scenarios) => {
      const plan: TestPlan = { scenarios };
      const result = await generatePartial(plan, defaultOptions, allSuccessGenerator);
      assert.equal(
        result.status,
        'complete',
        `Expected 'complete' when all scenarios succeed, got '${result.status}'`,
      );
      assert.equal(result.skipped.length, 0, 'Skipped list must be empty when status is complete');
    }),
    { numRuns: 50 },
  );
  console.log('✓ Property 6a passed: all-success → status "complete"');

  // Property 6b: All-fail generator → status === 'failed'
  // Validates Requirement 3.4
  await fc.assert(
    fc.asyncProperty(arbNonEmptyScenarios, async (scenarios) => {
      const plan: TestPlan = { scenarios };
      const result = await generatePartial(plan, defaultOptions, allFailGenerator);
      assert.equal(
        result.status,
        'failed',
        `Expected 'failed' when no scenarios succeed, got '${result.status}'`,
      );
      assert.equal(
        result.generated.length,
        0,
        'Generated list must be empty when status is failed',
      );
    }),
    { numRuns: 50 },
  );
  console.log('✓ Property 6b passed: all-fail → status "failed"');

  // Property 6c: Mixed generator (some succeed, some fail) → status === 'partial'
  // Validates Requirement 3.3
  await fc.assert(
    fc.asyncProperty(
      fc.array(arbScenario, { minLength: 2, maxLength: 10 }).chain((scenarios) => {
        // Generate a non-empty, non-full set of fail indices
        const maxIdx = scenarios.length - 1;
        return fc
          .uniqueArray(fc.integer({ min: 0, max: maxIdx }), {
            minLength: 1,
            maxLength: maxIdx,
          })
          .map((failIndices) => ({ scenarios, failIndices: new Set(failIndices) }));
      }),
      async ({ scenarios, failIndices }) => {
        const plan: TestPlan = { scenarios };
        const gen = mixedGenerator(failIndices);
        const result = await generatePartial(plan, defaultOptions, gen);
        assert.equal(
          result.status,
          'partial',
          `Expected 'partial' with mixed results, got '${result.status}' (${result.generated.length} generated, ${result.skipped.length} skipped)`,
        );
        assert(result.generated.length > 0, 'Generated list must not be empty for partial status');
        assert(result.skipped.length > 0, 'Skipped list must not be empty for partial status');
      },
    ),
    { numRuns: 50 },
  );
  console.log('✓ Property 6c passed: mixed results → status "partial"');

  // Property 6d: Empty plan → status === 'complete'
  // Validates edge case (Requirement 3.6 supports this, linked to 3.2)
  await fc.assert(
    fc.asyncProperty(fc.constant({ scenarios: [] } as TestPlan), async (plan) => {
      const result = await generatePartial(plan, defaultOptions);
      assert.equal(
        result.status,
        'complete',
        `Expected 'complete' for empty plan, got '${result.status}'`,
      );
      assert.equal(result.generated.length, 0, 'Generated list must be empty for empty plan');
      assert.equal(result.skipped.length, 0, 'Skipped list must be empty for empty plan');
    }),
    { numRuns: 1 },
  );
  console.log('✓ Property 6d passed: empty plan → status "complete"');

  console.log('\n✓ Property 6 passed: generation status determined by results');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

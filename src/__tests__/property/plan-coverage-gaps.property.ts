/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 4: Coverage Gap Detection
// **Validates: Requirements 2.4**
//
// For any requirement with acceptance criteria and a test plan, every acceptance
// criterion not covered by any scenario SHALL appear in the coverageGaps list,
// and no covered criterion SHALL appear in it.

import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  validateTestPlan,
  TestPlan,
  TestPlanScenario,
  AcceptanceCriterion,
  ValidatorOptions,
  scenarioCoversAcceptanceCriteria,
} from '../../agents/planner/plan-validator';

// ─── Generators ───────────────────────────────────────────────────────────────

/**
 * Generates a significant word (> 2 chars, no stop words, lowercase alpha).
 * We deliberately pick words that won't be filtered by the extractSignificantWords
 * function in plan-validator (must be > 2 chars and not in the stop words list).
 */
const arbSignificantWord: fc.Arbitrary<string> = fc.constantFrom(
  'login',
  'dashboard',
  'button',
  'submit',
  'verify',
  'password',
  'display',
  'navigate',
  'redirect',
  'notification',
  'error',
  'message',
  'user',
  'profile',
  'settings',
  'admin',
  'table',
  'export',
  'download',
  'upload',
  'delete',
  'create',
  'update',
  'search',
  'filter',
  'pagination',
  'modal',
  'dropdown',
  'checkbox',
  'validation',
  'authentication',
  'authorization',
  'session',
  'token',
);

/**
 * Generates a phrase composed of significant words.
 * Having multiple significant words ensures we can control overlap precisely.
 */
function arbPhrase(minWords: number, maxWords: number): fc.Arbitrary<string> {
  return fc
    .array(arbSignificantWord, { minLength: minWords, maxLength: maxWords })
    .map((words) => words.join(' '));
}

/**
 * Generates a scenario that deliberately covers a given criterion text.
 * We include the criterion words in the scenario steps/expectedResult to guarantee
 * > 30% word overlap with the criterion.
 */
function _arbCoveringScenario(
  criterionText: string,
  idSuffix: string,
): fc.Arbitrary<TestPlanScenario> {
  return fc.record({
    id: fc.constant(`sc-cover-${idSuffix}`),
    title: fc.constant(`Scenario covering criterion ${idSuffix}`),
    // Include the criterion text directly in steps to ensure high overlap
    steps: fc.constant(
      `Given user is on page\nWhen user performs ${criterionText}\nThen result is visible`,
    ),
    expectedResult: fc.constant(`The ${criterionText} is displayed correctly`),
  });
}

/**
 * Generates a scenario with completely unrelated words to ensure it does NOT cover
 * a given criterion.
 */
function arbNonCoveringScenario(idSuffix: string): fc.Arbitrary<TestPlanScenario> {
  // Use a set of words that will NOT overlap with our significant words generator
  return fc.record({
    id: fc.constant(`sc-nocover-${idSuffix}`),
    title: fc.constant(`Unrelated scenario ${idSuffix}`),
    steps: fc.constant(
      'Given zzzyyyxxx is configured\nWhen qqqrrrsss triggers\nThen wwwvvvuuu happens',
    ),
    expectedResult: fc.constant('jjjkkklll mmmnnnooo ppptttrrr'),
  });
}

/**
 * Arbitrary for acceptance criteria that we know will NOT be covered
 * by non-covering scenarios (uses distinct significant words).
 */
const arbUncoveredCriterion: fc.Arbitrary<AcceptanceCriterion> = fc
  .tuple(fc.string({ minLength: 1, maxLength: 5 }), arbPhrase(3, 6))
  .map(([id, phrase]) => ({
    id: `ac-uncovered-${id}`,
    text: phrase,
  }));

/**
 * Arbitrary for acceptance criteria that we'll generate covering scenarios for.
 */
const arbCoveredCriterion: fc.Arbitrary<AcceptanceCriterion> = fc
  .tuple(fc.string({ minLength: 1, maxLength: 5 }), arbPhrase(3, 6))
  .map(([id, phrase]) => ({
    id: `ac-covered-${id}`,
    text: phrase,
  }));

// ─── Property Test ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      // Generate 1-4 "covered" criteria (will have matching scenarios)
      fc.array(arbCoveredCriterion, { minLength: 1, maxLength: 4 }),
      // Generate 0-4 "uncovered" criteria (will NOT have matching scenarios)
      fc.array(arbUncoveredCriterion, { minLength: 0, maxLength: 4 }),
      // Additional non-covering scenarios as noise
      fc.array(arbNonCoveringScenario('noise'), { minLength: 0, maxLength: 3 }),
      async (coveredCriteria, uncoveredCriteria, noiseScenarios) => {
        // Build covering scenarios (one per covered criterion)
        const coveringScenarios: TestPlanScenario[] = coveredCriteria.map((criterion, i) => {
          // Directly embed criterion words into scenario to guarantee coverage
          return {
            id: `sc-cover-${i}`,
            title: `Scenario covering criterion ${i}`,
            steps: `Given user starts\nWhen user performs ${criterion.text}\nThen system responds`,
            expectedResult: `The ${criterion.text} is displayed correctly`,
          };
        });

        // Build the plan — covering scenarios + noise scenarios
        const allScenarios = [...coveringScenarios, ...noiseScenarios];

        // Need at least one scenario for valid plan (otherwise empty_plan error)
        if (allScenarios.length === 0) return; // skip trivially empty

        const plan: TestPlan = { scenarios: allScenarios };
        const allCriteria = [...coveredCriteria, ...uncoveredCriteria];

        const options: ValidatorOptions = {
          acceptanceCriteria: allCriteria,
        };

        const result = validateTestPlan(plan, options);

        // Verify using the same coverage function the validator uses internally
        for (const criterion of allCriteria) {
          const isCoveredByAnyScenario = plan.scenarios.some((sc) =>
            scenarioCoversAcceptanceCriteria(sc, criterion),
          );

          if (isCoveredByAnyScenario) {
            // Covered criteria must NOT appear in coverageGaps
            assert(
              !result.coverageGaps.includes(criterion.text),
              `Criterion "${criterion.text}" IS covered by a scenario but appeared in coverageGaps`,
            );
          } else {
            // Uncovered criteria MUST appear in coverageGaps
            assert(
              result.coverageGaps.includes(criterion.text),
              `Criterion "${criterion.text}" is NOT covered by any scenario but was missing from coverageGaps`,
            );
          }
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log('✓ Property 4 passed: coverage gap detection is correct and complete');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

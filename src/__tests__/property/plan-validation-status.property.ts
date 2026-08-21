/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 3: Validation Status Consistency
// **Validates: Requirements 2.6, 2.7, 2.8**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { validateTestPlan, TestPlan, TestPlanScenario } from '../../agents/planner/plan-validator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a scenario ID */
const arbId = fc.string({ minLength: 1, maxLength: 12 }).filter((s) => s.trim().length > 0);

/** Generate a non-empty title */
const arbTitle = fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0);

/**
 * A scenario with EMPTY steps (triggers error "executable_steps").
 * Steps are empty/whitespace → status must be 'invalid'.
 */
const arbScenarioWithEmptySteps: fc.Arbitrary<TestPlanScenario> = fc.record({
  id: arbId,
  title: arbTitle,
  steps: fc.constantFrom('', '   ', '\t', '\n', '  \n  '),
  expectedResult: fc.string({ minLength: 0, maxLength: 100 }),
});

/**
 * Observable expected results — contain keywords that pass the isObservableAssertion check.
 */
const arbObservableResult: fc.Arbitrary<string> = fc.constantFrom(
  'Login page is visible',
  'User sees the dashboard button',
  'Form displays error message',
  'Page navigates to /home',
  'Input field is enabled',
  'Dialog shows 3 items in table',
  'Notification toast appears with text "Saved"',
  'The submit button is disabled',
  'Header contains username label',
);

/**
 * Non-observable expected results — vague patterns that trigger warning "observable_result".
 */
const arbVagueResult: fc.Arbitrary<string> = fc.constantFrom(
  'works properly',
  'works correctly',
  'is correct',
  'functions properly',
  'ok',
  'is fine',
  'behaves as expected',
  'should be successful',
);

/**
 * A scenario with valid steps AND an observable expected result.
 * Should produce NO issues → contributes to 'valid' status.
 */
const arbValidScenario: fc.Arbitrary<TestPlanScenario> = fc.record({
  id: arbId,
  title: arbTitle,
  steps: fc.string({ minLength: 5, maxLength: 200 }).filter((s) => s.trim().length > 0),
  expectedResult: arbObservableResult,
});

/**
 * A scenario with valid steps BUT a non-observable (vague) expected result.
 * Triggers warning "observable_result" → contributes to 'warnings' status.
 */
const arbWarningScenario: fc.Arbitrary<TestPlanScenario> = fc.record({
  id: arbId,
  title: arbTitle,
  steps: fc.string({ minLength: 5, maxLength: 200 }).filter((s) => s.trim().length > 0),
  expectedResult: arbVagueResult,
});

// ─── Property Tests ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Property 3a: Plans with empty steps → status 'invalid'
  // Validates: Requirement 2.6 — errors exist implies status 'invalid'
  await fc.assert(
    fc.asyncProperty(
      fc.array(arbScenarioWithEmptySteps, { minLength: 1, maxLength: 5 }),
      async (errorScenarios) => {
        const plan: TestPlan = { scenarios: errorScenarios };
        const result = validateTestPlan(plan);
        assert.equal(
          result.status,
          'invalid',
          `Expected 'invalid' when empty steps exist, got '${result.status}'`,
        );
        assert(
          result.issues.some((i) => i.severity === 'error'),
          'Expected at least one error-severity issue',
        );
      },
    ),
    { numRuns: 100 },
  );
  console.log('✓ Property 3a passed: plans with errors → status "invalid"');

  // Property 3b: Plans with valid steps + vague results (only warnings) → status 'warnings'
  // Validates: Requirement 2.7 — only warnings implies status 'warnings'
  await fc.assert(
    fc.asyncProperty(
      fc.array(arbWarningScenario, { minLength: 1, maxLength: 5 }),
      async (warningScenarios) => {
        const plan: TestPlan = { scenarios: warningScenarios };
        const result = validateTestPlan(plan);
        assert.equal(
          result.status,
          'warnings',
          `Expected 'warnings' when only warnings exist, got '${result.status}'`,
        );
        assert(
          result.issues.every((i) => i.severity === 'warning'),
          'Expected no error-severity issues',
        );
        assert(result.issues.length > 0, 'Expected at least one warning issue');
      },
    ),
    { numRuns: 100 },
  );
  console.log('✓ Property 3b passed: plans with only warnings → status "warnings"');

  // Property 3c: Plans with valid steps + observable results + no fixture issues → status 'valid'
  // Validates: Requirement 2.8 — no issues implies status 'valid'
  await fc.assert(
    fc.asyncProperty(
      fc.array(arbValidScenario, { minLength: 1, maxLength: 5 }).filter((scenarios) => {
        // Ensure unique IDs and distinct normalized content to avoid duplicate detection
        const ids = scenarios.map((s) => s.id);
        const uniqueIds = new Set(ids).size === ids.length;
        const keys = scenarios.map(
          (s) => `${s.steps.toLowerCase().trim()}::${s.expectedResult.toLowerCase().trim()}`,
        );
        const uniqueKeys = new Set(keys).size === keys.length;
        return uniqueIds && uniqueKeys;
      }),
      async (validScenarios) => {
        const plan: TestPlan = { scenarios: validScenarios };
        // No options → no fixture check, no coverage gap check
        const result = validateTestPlan(plan);
        assert.equal(
          result.status,
          'valid',
          `Expected 'valid' when no issues exist, got '${result.status}'`,
        );
        assert.equal(result.issues.length, 0, 'Expected zero issues');
        assert.equal(result.coverageGaps.length, 0, 'Expected zero coverage gaps');
      },
    ),
    { numRuns: 100 },
  );
  console.log('✓ Property 3c passed: plans with no issues → status "valid"');

  // Property 3d: Mutual exclusivity — status is always exactly one of the three values
  // Validates: Requirements 2.6, 2.7, 2.8 combined
  const arbAnyScenario: fc.Arbitrary<TestPlanScenario> = fc.oneof(
    arbScenarioWithEmptySteps,
    arbWarningScenario,
    arbValidScenario,
  );

  await fc.assert(
    fc.asyncProperty(
      fc.array(arbAnyScenario, { minLength: 0, maxLength: 8 }),
      async (scenarios) => {
        const plan: TestPlan = { scenarios };
        const result = validateTestPlan(plan);

        // Status must be exactly one of the three valid values
        const validStatuses = ['valid', 'warnings', 'invalid'] as const;
        assert(
          validStatuses.includes(result.status),
          `Status '${result.status}' is not one of ${validStatuses.join(', ')}`,
        );

        // Verify consistency between status and issues
        const hasErrors = result.issues.some((i) => i.severity === 'error');
        const hasWarningsOrGaps = result.issues.length > 0 || result.coverageGaps.length > 0;

        if (hasErrors) {
          assert.equal(result.status, 'invalid', 'Errors present but status is not "invalid"');
        } else if (hasWarningsOrGaps) {
          assert.equal(result.status, 'warnings', 'Warnings present but status is not "warnings"');
        } else {
          assert.equal(result.status, 'valid', 'No issues but status is not "valid"');
        }
      },
    ),
    { numRuns: 200 },
  );
  console.log('✓ Property 3d passed: status is mutually exclusive and exhaustive');

  console.log('\n✓ All Property 3 tests passed: Validation Status Consistency');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

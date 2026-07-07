/// <reference types="node" />

// Feature: framework-robustness-improvement
// Property 2: Ambiguity Detection Completeness
// **Validates: Requirements 1.1, 1.2, 1.3**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { detectAmbiguity, NormalizedRequirement } from '../../agents/planner/feedback';

// ─── Known vague patterns that trigger vague_assertion detection ────────────────

/**
 * Triggers that can appear anywhere in the text (matched by non-anchored patterns).
 * These are safe to have prefixes/suffixes around them.
 */
const INLINE_VAGUE_TRIGGERS = [
  'should work properly',
  'should work correctly',
  'should work well',
  'appropriate error',
  'appropriate message',
  'appropriate response',
  'the system handles',
  'and so on',
];

/**
 * Triggers that must appear at the END of text (anchored with $).
 * "etc." pattern uses /etc\.?$/i so it must be the final content.
 */
const END_ANCHORED_TRIGGERS = ['etc.', 'etc'];

// ─── Generators ─────────────────────────────────────────────────────────────────

/**
 * Generates a NormalizedRequirement that contains at least one vague assertion
 * pattern in an acceptance criterion.
 */
function vagueAssertionRequirement(): fc.Arbitrary<NormalizedRequirement> {
  // For inline triggers: can have prefix/suffix safely
  const inlineGen = fc
    .record({
      prefix: fc.string({ minLength: 0, maxLength: 20 }),
      trigger: fc.constantFrom(...INLINE_VAGUE_TRIGGERS),
      suffix: fc.string({ minLength: 0, maxLength: 20 }),
      id: fc.string({ minLength: 1, maxLength: 8 }),
      path: fc.string({ minLength: 1, maxLength: 30 }),
    })
    .map(({ prefix, trigger, suffix, id, path }) => ({
      path,
      acceptanceCriteria: [{ id, text: `${prefix} ${trigger} ${suffix}`.trim() }],
      scenarios: [
        {
          id: 'sc-1',
          title: 'Some scenario',
          steps: ['Given user is logged in', 'When they click submit'],
          precondition: 'user exists',
        },
      ],
      glossary: undefined,
    }));

  // For end-anchored triggers: only prefix allowed, no suffix
  const endAnchoredGen = fc
    .record({
      prefix: fc.string({ minLength: 1, maxLength: 30 }),
      trigger: fc.constantFrom(...END_ANCHORED_TRIGGERS),
      id: fc.string({ minLength: 1, maxLength: 8 }),
      path: fc.string({ minLength: 1, maxLength: 30 }),
    })
    .map(({ prefix, trigger, id, path }) => ({
      path,
      acceptanceCriteria: [{ id, text: `${prefix} ${trigger}` }],
      scenarios: [
        {
          id: 'sc-1',
          title: 'Some scenario',
          steps: ['Given user is logged in', 'When they click submit'],
          precondition: 'user exists',
        },
      ],
      glossary: undefined,
    }));

  return fc.oneof(inlineGen, endAnchoredGen);
}

/**
 * Generates a NormalizedRequirement that has a scenario without a Given step
 * and without a precondition — triggering missing_precondition detection.
 */
function missingPreconditionRequirement(): fc.Arbitrary<NormalizedRequirement> {
  // Steps that do NOT start with "Given" (use When/Then/And only)
  const nonGivenStep = fc.constantFrom(
    'When user clicks the button',
    'Then the page loads',
    'And the form is submitted',
  );

  return fc
    .record({
      path: fc.string({ minLength: 1, maxLength: 30 }),
      scenarioId: fc.string({ minLength: 1, maxLength: 8 }),
      title: fc.string({ minLength: 1, maxLength: 40 }),
      stepCount: fc.integer({ min: 1, max: 5 }),
    })
    .chain(({ path, scenarioId, title, stepCount }) =>
      fc.array(nonGivenStep, { minLength: stepCount, maxLength: stepCount }).map((steps) => ({
        path,
        acceptanceCriteria: [{ id: 'ac-1', text: 'The user can log in successfully' }],
        scenarios: [
          {
            id: scenarioId,
            title,
            steps,
            // No precondition field → triggers missing_precondition
          },
        ],
        glossary: undefined,
      })),
    );
}

/**
 * Generates a NormalizedRequirement that references backtick-enclosed terms
 * in criteria/scenarios but provides no glossary — triggering undefined_term detection.
 */
function undefinedTermRequirement(): fc.Arbitrary<NormalizedRequirement> {
  // Generate a PascalCase or backtick-enclosed term that won't be in the glossary
  const technicalTerm = fc.constantFrom(
    'UserSession',
    'AuthToken',
    'TestPlan',
    'BrowserMatrix',
    'HealPattern',
  );

  return technicalTerm.chain((term) =>
    fc
      .record({
        path: fc.string({ minLength: 1, maxLength: 30 }),
        criteriaId: fc.string({ minLength: 1, maxLength: 8 }),
      })
      .map(({ path, criteriaId }) => ({
        path,
        acceptanceCriteria: [
          { id: criteriaId, text: `The \`${term}\` should be validated before use` },
        ],
        scenarios: [
          {
            id: 'sc-1',
            title: 'Validate term usage',
            steps: ['Given the system is ready', 'When processing occurs'],
            precondition: 'system running',
          },
        ],
        // No glossary → the backtick term is undefined
        glossary: undefined,
      })),
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Sub-property 1: Vague assertion patterns produce non-empty ambiguities with suggestions
  await fc.assert(
    fc.asyncProperty(vagueAssertionRequirement(), async (requirement) => {
      const report = detectAmbiguity(requirement);

      // Must detect at least one ambiguity
      assert.ok(
        report.ambiguities.length > 0,
        `Expected non-empty ambiguities for vague assertion, got 0`,
      );

      // At least one ambiguity should be a vague_assertion
      const hasVague = report.ambiguities.some((a) => a.reason === 'vague_assertion');
      assert.ok(hasVague, 'Expected at least one vague_assertion ambiguity');

      // All suggestions must be non-empty
      for (const ambiguity of report.ambiguities) {
        assert.ok(
          ambiguity.suggestion.length > 0,
          `Suggestion must be non-empty, got: "${ambiguity.suggestion}"`,
        );
      }
    }),
    { numRuns: 50 },
  );

  // Sub-property 2: Missing precondition scenarios produce non-empty ambiguities with suggestions
  await fc.assert(
    fc.asyncProperty(missingPreconditionRequirement(), async (requirement) => {
      const report = detectAmbiguity(requirement);

      // Must detect at least one ambiguity
      assert.ok(
        report.ambiguities.length > 0,
        `Expected non-empty ambiguities for missing precondition, got 0`,
      );

      // At least one ambiguity should be missing_precondition
      const hasMissing = report.ambiguities.some((a) => a.reason === 'missing_precondition');
      assert.ok(hasMissing, 'Expected at least one missing_precondition ambiguity');

      // All suggestions must be non-empty
      for (const ambiguity of report.ambiguities) {
        assert.ok(
          ambiguity.suggestion.length > 0,
          `Suggestion must be non-empty, got: "${ambiguity.suggestion}"`,
        );
      }
    }),
    { numRuns: 50 },
  );

  // Sub-property 3: Undefined terms produce non-empty ambiguities with suggestions
  await fc.assert(
    fc.asyncProperty(undefinedTermRequirement(), async (requirement) => {
      const report = detectAmbiguity(requirement);

      // Must detect at least one ambiguity
      assert.ok(
        report.ambiguities.length > 0,
        `Expected non-empty ambiguities for undefined term, got 0`,
      );

      // At least one ambiguity should be undefined_term
      const hasUndefined = report.ambiguities.some((a) => a.reason === 'undefined_term');
      assert.ok(hasUndefined, 'Expected at least one undefined_term ambiguity');

      // All suggestions must be non-empty
      for (const ambiguity of report.ambiguities) {
        assert.ok(
          ambiguity.suggestion.length > 0,
          `Suggestion must be non-empty, got: "${ambiguity.suggestion}"`,
        );
      }
    }),
    { numRuns: 50 },
  );

  console.log(
    '✓ Property 2 passed: Ambiguity Detection Completeness — all trigger patterns produce non-empty ambiguities with suggestions',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

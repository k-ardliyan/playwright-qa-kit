/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 1: Confidence Score Bounded
// **Validates: Requirements 1.6**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { detectAmbiguity, NormalizedRequirement } from '../../agents/planner/feedback';

// Arbitrary for acceptance criteria — some containing vague patterns, some clean
const arbAcceptanceCriteria: fc.Arbitrary<{ id: string; text: string }[]> = fc.array(
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    text: fc.oneof(
      // Clean criteria text
      fc.string({ minLength: 0, maxLength: 200 }),
      // Text with vague patterns that trigger ambiguity detection
      fc.constantFrom(
        'The login should work properly for all users',
        'Display appropriate error message',
        'The system handles authentication etc.',
        'Validate input and so on',
        'The system handles session expiry',
      ),
    ),
  }),
  { minLength: 0, maxLength: 20 },
);

// Arbitrary for scenarios — some with Given steps, some without
const arbScenarios: fc.Arbitrary<
  { id: string; title: string; steps: string[]; precondition?: string }[]
> = fc.array(
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    steps: fc.array(
      fc.oneof(
        fc.constant('Given user is logged in'),
        fc.constant('When user clicks submit'),
        fc.constant('Then form is saved'),
        fc.string({ minLength: 1, maxLength: 100 }),
      ),
      { minLength: 0, maxLength: 10 },
    ),
    precondition: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  }),
  { minLength: 0, maxLength: 20 },
);

// Arbitrary for glossary — either a Map or a plain Record, or undefined
const arbGlossary: fc.Arbitrary<Map<string, string> | Record<string, string> | undefined> =
  fc.oneof(
    fc.constant(undefined),
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 30 }),
      fc.string({ minLength: 1, maxLength: 100 }),
    ),
    fc
      .array(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 100 }),
        ),
        {
          minLength: 0,
          maxLength: 10,
        },
      )
      .map((entries) => new Map(entries)),
  );

// Full NormalizedRequirement arbitrary
const arbRequirement: fc.Arbitrary<NormalizedRequirement> = fc.record({
  path: fc.string({ minLength: 1, maxLength: 100 }),
  acceptanceCriteria: arbAcceptanceCriteria,
  scenarios: arbScenarios,
  glossary: arbGlossary,
});

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(arbRequirement, async (requirement) => {
      const report = detectAmbiguity(requirement);
      assert(report.confidence >= 0.0, `Confidence below 0: ${report.confidence}`);
      assert(report.confidence <= 1.0, `Confidence above 1: ${report.confidence}`);
    }),
    { numRuns: 100 },
  );
  console.log('✓ Property 1 passed: confidence score is always bounded [0, 1]');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

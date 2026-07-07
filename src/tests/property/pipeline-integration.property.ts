/// <reference types="node" />

// Feature: framework-robustness-improvement
// Task 12.5: Integration tests for end-to-end pipeline flow
//
// Tests:
// 1. Planner → Generator → Executor → Healer pipeline with mock data
// 2. Partial generation with mixed success/failure scenarios
// 3. Healer pattern lookup → apply → store cycle
//
// **Validates: Requirements 1.4, 3.1, 5.1, 8.1**

import assert from 'node:assert/strict';

// ─── Planner imports ──────────────────────────────────────────────────────────
import { detectAmbiguity } from '../../agents/planner/feedback';
import type { NormalizedRequirement } from '../../agents/planner/feedback';
import { validateTestPlan } from '../../agents/planner/plan-validator';
import type { TestPlan as PlannerTestPlan } from '../../agents/planner/plan-validator';

// ─── Generator imports ────────────────────────────────────────────────────────
import { generatePartial } from '../../agents/generator/partial-engine';
import type {
  TestPlan as GeneratorTestPlan,
  ScenarioGenerator,
} from '../../agents/generator/partial-engine';

// ─── Executor imports ─────────────────────────────────────────────────────────
import { mergeResults } from '../../executor/multi-browser';

// ─── Healer imports ───────────────────────────────────────────────────────────
import {
  createEmptyDatabase,
  storePattern,
  recordPatternOutcome,
} from '../../agents/healer/pattern-database';
import { lookupPattern } from '../../agents/healer/pattern-matcher';
import { prioritizeFailures } from '../../agents/healer/failure-prioritizer';

// ─── Shared types ─────────────────────────────────────────────────────────────
import type {
  ShardResult,
  TestFailure,
  FailureSignature,
  FixTemplate,
  GenerationOptions,
  BrowserTarget,
} from '../../shared/types';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeGenerationOptions(): GenerationOptions {
  return {
    maxRetriesPerScenario: 2,
    retryDelayMs: 100,
    fallbackToSkeleton: true,
    continueOnFailure: true,
    selectorCatalogRequired: false,
    liveVerificationTimeout: 5000,
  };
}

function makeSignature(id: string): FailureSignature {
  return {
    errorType: 'locator',
    errorPattern: `element-not-found-${id}`,
    selectorType: 'getByRole',
    pageContext: `/dashboard/${id}`,
  };
}

function makeFix(): FixTemplate {
  return {
    strategy: 'replace_locator',
    beforePattern: 'await page.locator(".old-btn")',
    afterTemplate: 'await page.getByRole("button", { name: "Submit" })',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: Planner → Generator → Executor → Healer pipeline with mock data
// ═══════════════════════════════════════════════════════════════════════════════

async function testFullPipeline(): Promise<void> {
  // ─── Step 1: Planner — detect ambiguities in a requirement ──────────────────
  const requirement: NormalizedRequirement = {
    path: 'requirements/login-feature.md',
    acceptanceCriteria: [
      { id: 'AC-1', text: 'User can log in with valid credentials and sees the dashboard page' },
      {
        id: 'AC-2',
        text: 'Invalid credentials display an error message with text "Invalid username or password"',
      },
    ],
    scenarios: [
      {
        id: 'S-1',
        title: 'Successful login',
        steps: [
          'Given the user is on the login page',
          'When they enter valid credentials',
          'Then they see the dashboard',
        ],
        precondition: 'User account exists',
      },
      {
        id: 'S-2',
        title: 'Failed login',
        steps: [
          'Given the user is on the login page',
          'When they enter invalid credentials',
          'Then an error is shown',
        ],
        precondition: 'No matching account',
      },
    ],
    glossary: { dashboard: 'Main landing page after authentication' },
  };

  const ambiguityReport = detectAmbiguity(requirement);
  assert.ok(
    ambiguityReport.confidence >= 0 && ambiguityReport.confidence <= 1,
    'Confidence should be between 0 and 1',
  );
  assert.equal(ambiguityReport.requirementPath, requirement.path);

  // ─── Step 2: Planner — validate a test plan ────────────────────────────────
  const testPlan: PlannerTestPlan = {
    scenarios: [
      {
        id: 'TS-1',
        title: 'Login with valid credentials',
        steps:
          'Given the user is on /login\nWhen they submit valid credentials\nThen they are redirected to /dashboard',
        expectedResult: 'User sees the dashboard page with welcome message',
      },
      {
        id: 'TS-2',
        title: 'Login with invalid credentials',
        steps:
          'Given the user is on /login\nWhen they submit invalid credentials\nThen an error message is displayed',
        expectedResult: 'Error message "Invalid username or password" is visible',
      },
    ],
  };

  const validationResult = validateTestPlan(testPlan, {
    acceptanceCriteria: requirement.acceptanceCriteria.map((ac) => ({ id: ac.id, text: ac.text })),
  });

  assert.ok(
    ['valid', 'warnings', 'invalid'].includes(validationResult.status),
    'Validation status should be one of: valid, warnings, invalid',
  );
  assert.equal(validationResult.scenarioCount, 2);

  // ─── Step 3: Generator — generate tests with a mock generator ───────────────
  const generatorPlan: GeneratorTestPlan = {
    scenarios: testPlan.scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      steps: s.steps,
      expectedResult: s.expectedResult,
    })),
  };

  const mockGenerator: ScenarioGenerator = async (scenario) => ({
    success: true,
    filePath: `src/tests/${scenario.id}.spec.ts`,
    verified: true,
    verificationMethod: 'none' as const,
  });

  const genResult = await generatePartial(generatorPlan, makeGenerationOptions(), mockGenerator);
  assert.equal(genResult.status, 'complete');
  assert.equal(genResult.generated.length, 2);
  assert.equal(genResult.skipped.length, 0);
  assert.equal(
    genResult.generated.length + genResult.skipped.length,
    generatorPlan.scenarios.length,
  );

  // ─── Step 4: Executor — merge shard results ─────────────────────────────────
  const shardResults: ShardResult[] = [
    {
      shardIndex: 0,
      browser: 'chromium' as BrowserTarget,
      passed: 2,
      failed: 0,
      duration: 1500,
      testResults: [
        {
          testTitle: 'Login valid',
          filePath: 'src/tests/TS-1.spec.ts',
          passed: true,
          skipped: false,
          duration: 700,
        },
        {
          testTitle: 'Login invalid',
          filePath: 'src/tests/TS-2.spec.ts',
          passed: true,
          skipped: false,
          duration: 800,
        },
      ],
    },
    {
      shardIndex: 0,
      browser: 'firefox' as BrowserTarget,
      passed: 1,
      failed: 1,
      duration: 1800,
      testResults: [
        {
          testTitle: 'Login valid',
          filePath: 'src/tests/TS-1.spec.ts',
          passed: true,
          skipped: false,
          duration: 900,
        },
        {
          testTitle: 'Login invalid',
          filePath: 'src/tests/TS-2.spec.ts',
          passed: false,
          skipped: false,
          duration: 900,
          errorMessage: 'Timeout waiting for selector',
        },
      ],
    },
  ];

  const merged = mergeResults(shardResults);
  assert.ok(merged.summary.totalTests > 0, 'Should have test results');
  assert.ok(merged.summary.browsersExecuted.length > 0, 'Should report executed browsers');
  // "Login invalid" fails on firefox but passes on chromium → browser-specific failure
  const firefoxSpecific = merged.browserSpecificFailures.get('firefox') ?? [];
  assert.ok(firefoxSpecific.length > 0, 'Should have a firefox-specific failure');

  // ─── Step 5: Healer — prioritize failures ──────────────────────────────────
  const failures: TestFailure[] = [
    {
      testTitle: 'Login invalid',
      filePath: 'src/tests/TS-2.spec.ts',
      errorMessage: 'Timeout waiting for selector .error-message',
      rootCause: 'locator',
    },
  ];

  let db = createEmptyDatabase();
  // Store a pattern so the healer has a known fix
  db = storePattern(db, makeSignature('TS-2'), makeFix(), true);

  const prioritized = prioritizeFailures(failures, db);
  assert.equal(prioritized.length, failures.length, 'All failures should be in output');
  assert.equal(prioritized[0].priority, 1);

  console.log('  ✓ Test 1 passed: full pipeline planner → generator → executor → healer');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: Partial generation with mixed success/failure scenarios
// ═══════════════════════════════════════════════════════════════════════════════

async function testPartialGeneration(): Promise<void> {
  const plan: GeneratorTestPlan = {
    scenarios: [
      {
        id: 'SC-1',
        title: 'Add to cart',
        steps: 'Given product page\nWhen click add to cart',
        expectedResult: 'Item in cart',
      },
      {
        id: 'SC-2',
        title: 'Checkout',
        steps: 'Given cart has items\nWhen click checkout',
        expectedResult: 'Checkout page displayed',
      },
      {
        id: 'SC-3',
        title: 'Payment',
        steps: 'Given checkout page\nWhen enter payment details',
        expectedResult: 'Payment form visible',
      },
      {
        id: 'SC-4',
        title: 'Confirmation',
        steps: 'Given payment submitted\nWhen payment succeeds',
        expectedResult: 'Confirmation message shown',
      },
      {
        id: 'SC-5',
        title: 'Receipt email',
        steps: 'Given order confirmed\nWhen email sent',
        expectedResult: 'Email contains order number',
      },
    ],
  };

  // Mock generator: SC-2 and SC-4 fail with different errors
  const mixedGenerator: ScenarioGenerator = async (scenario) => {
    if (scenario.id === 'SC-2') {
      return {
        success: false,
        error: { message: 'ECONNREFUSED: connection refused', code: 'ECONNREFUSED' },
      };
    }
    if (scenario.id === 'SC-4') {
      return {
        success: false,
        error: {
          message: 'Element not found: locator(".confirm-btn") not found',
          code: 'LOCATOR_FAILED',
        },
      };
    }
    return {
      success: true,
      filePath: `src/tests/${scenario.id}.spec.ts`,
      verified: true,
      verificationMethod: 'cli' as const,
    };
  };

  const result = await generatePartial(plan, makeGenerationOptions(), mixedGenerator);

  // Verify partial generation produces correct counts
  assert.equal(result.generated.length, 3, 'Should generate 3 scenarios (SC-1, SC-3, SC-5)');
  assert.equal(result.skipped.length, 2, 'Should skip 2 scenarios (SC-2, SC-4)');
  assert.equal(
    result.generated.length + result.skipped.length,
    plan.scenarios.length,
    'generated + skipped must equal total',
  );

  // Verify status is "partial" (some succeed, some fail)
  assert.equal(result.status, 'partial');

  // Verify the skipped scenarios have classifications set
  for (const skipped of result.skipped) {
    assert.ok(skipped.classification, 'Skipped scenario should have a classification');
    assert.ok(typeof skipped.canRetryLater === 'boolean', 'canRetryLater should be boolean');
  }

  // Verify SC-2 is classified as retryable (transient_network due to ECONNREFUSED)
  const sc2Skip = result.skipped.find((s) => s.scenarioId === 'SC-2');
  assert.ok(sc2Skip, 'SC-2 should be in skipped list');
  assert.equal(sc2Skip!.classification, 'transient_network');
  assert.equal(sc2Skip!.canRetryLater, true);

  // Verify SC-4 is classified as selector_not_found
  const sc4Skip = result.skipped.find((s) => s.scenarioId === 'SC-4');
  assert.ok(sc4Skip, 'SC-4 should be in skipped list');
  assert.equal(sc4Skip!.classification, 'selector_not_found');
  assert.equal(sc4Skip!.canRetryLater, true);

  // Verify metrics
  assert.equal(result.metrics.totalScenarios, 5);
  assert.equal(result.metrics.generatedCount, 3);
  assert.equal(result.metrics.skippedCount, 2);

  console.log('  ✓ Test 2 passed: partial generation with mixed success/failure');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: Healer pattern lookup → apply → store cycle
// ═══════════════════════════════════════════════════════════════════════════════

async function testHealerPatternCycle(): Promise<void> {
  // Step 1: Create a fresh database
  let db = createEmptyDatabase();
  assert.equal(db.patterns.length, 0, 'Fresh database should have no patterns');

  // Step 2: Store a pattern from a fix
  const signature: FailureSignature = {
    errorType: 'locator',
    errorPattern: 'element-not-found-submit-btn',
    selectorType: 'getByRole',
    pageContext: '/checkout/payment',
  };
  const fix: FixTemplate = {
    strategy: 'replace_locator',
    beforePattern: 'await page.locator("#submit")',
    afterTemplate: 'await page.getByRole("button", { name: "Submit" })',
  };

  db = storePattern(db, signature, fix, true);
  assert.equal(db.patterns.length, 1, 'Should have 1 pattern after store');

  const storedPattern = db.patterns[0];
  assert.equal(storedPattern.confidence, 1.0, 'New pattern should have confidence 1.0');
  assert.equal(storedPattern.successCount, 1, 'New pattern should have successCount 1');
  assert.equal(storedPattern.failureCount, 0, 'New pattern should have failureCount 0');

  // Step 3: Lookup that pattern with the same signature
  const found = lookupPattern(signature, db);
  assert.ok(found !== null, 'Pattern should be found with same signature');
  assert.equal(found!.id, storedPattern.id, 'Found pattern should be the same one stored');
  assert.equal(found!.confidence, 1.0, 'Found pattern should have confidence 1.0');

  // Step 4: Verify the pattern is found with correct confidence
  assert.equal(found!.fix.strategy, 'replace_locator');
  assert.equal(found!.fix.afterTemplate, fix.afterTemplate);

  // Step 5: Record a failure outcome and verify confidence updates
  db = recordPatternOutcome(db, storedPattern.id, false);
  const updatedPattern = db.patterns.find((p) => p.id === storedPattern.id);
  assert.ok(updatedPattern, 'Pattern should still exist after outcome recording');

  // After 1 success + 1 failure: confidence = 1 / (1 + 1) = 0.5
  assert.equal(updatedPattern!.successCount, 1);
  assert.equal(updatedPattern!.failureCount, 1);
  assert.ok(
    Math.abs(updatedPattern!.confidence - 0.5) < 1e-10,
    `Confidence should be 0.5, got ${updatedPattern!.confidence}`,
  );

  // Record another success: confidence = 2 / (2 + 1) = 0.667
  db = recordPatternOutcome(db, storedPattern.id, true);
  const finalPattern = db.patterns.find((p) => p.id === storedPattern.id);
  assert.ok(finalPattern, 'Pattern should still exist');
  assert.equal(finalPattern!.successCount, 2);
  assert.equal(finalPattern!.failureCount, 1);
  const expectedConfidence = 2 / 3;
  assert.ok(
    Math.abs(finalPattern!.confidence - expectedConfidence) < 1e-10,
    `Confidence should be ${expectedConfidence}, got ${finalPattern!.confidence}`,
  );

  // Verify lookup still returns the pattern (confidence 0.667 >= threshold 0.5)
  const refound = lookupPattern(signature, db);
  assert.ok(refound !== null, 'Pattern should still be found after confidence update');
  assert.equal(refound!.id, storedPattern.id);

  console.log('  ✓ Test 3 passed: healer pattern lookup → apply → store cycle');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('Pipeline Integration Tests');
  console.log('──────────────────────────────────────────');

  await testFullPipeline();
  await testPartialGeneration();
  await testHealerPatternCycle();

  console.log('──────────────────────────────────────────');
  console.log('✓ All pipeline integration tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

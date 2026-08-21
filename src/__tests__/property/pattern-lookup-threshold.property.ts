/// <reference types="node" />

// Feature: framework-robustness-improvement
// Property 13: Pattern Lookup Threshold Enforced
// For any failure lookup against the pattern database, a non-null result SHALL only
// be returned when the best-matching pattern has both a match score >= 0.7 AND
// confidence >= 0.5; otherwise null SHALL be returned.
//
// **Validates: Requirements 6.3, 6.4**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { lookupPattern, computeMatchScore } from '../../agents/healer/pattern-matcher';
import type { FailureSignature, FixTemplate } from '../../shared/types';
import type {
  HealPatternDatabase,
  HealPatternRecord,
} from '../../shared/types/heal-patterns.schema';

// ─── Constants (mirroring pattern-matcher thresholds) ──────────────────────────

const MATCH_SCORE_THRESHOLD = 0.7;
const CONFIDENCE_THRESHOLD = 0.5;

// ─── Generators ────────────────────────────────────────────────────────────────

function arbitraryFailureSignature(): fc.Arbitrary<FailureSignature> {
  return fc.record(
    {
      errorType: fc.oneof(
        fc.constantFrom('timeout', 'locator', 'assertion', 'state'),
        fc.string({ minLength: 1, maxLength: 20 }),
      ),
      errorPattern: fc.oneof(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.constantFrom('.*timeout.*', 'Element not found', 'expected .+ to be visible'),
      ),
      selectorType: fc.option(fc.constantFrom('getByRole', 'getByTestId', 'css'), {
        nil: undefined,
      }),
      pageContext: fc.option(
        fc.oneof(
          fc.constantFrom('/login', '/dashboard', '/settings/profile'),
          fc.string({ minLength: 1, maxLength: 30 }),
        ),
        { nil: undefined },
      ),
    },
    { requiredKeys: ['errorType', 'errorPattern'] },
  );
}

/**
 * Generate a confidence value across the full [0, 1] range,
 * including values below and above the 0.5 threshold.
 */
function arbitraryConfidence(): fc.Arbitrary<number> {
  return fc.oneof(
    // Below threshold
    fc.double({ min: 0, max: 0.49, noNaN: true }),
    // At or above threshold
    fc.double({ min: 0.5, max: 1.0, noNaN: true }),
  );
}

function arbitraryFix(): fc.Arbitrary<FixTemplate> {
  return fc.record({
    strategy: fc.constantFrom(
      'replace_locator',
      'add_wait',
      'add_retry',
      'change_assertion',
      'add_state_setup',
    ) as fc.Arbitrary<FixTemplate['strategy']>,
    beforePattern: fc.string({ minLength: 1, maxLength: 30 }),
    afterTemplate: fc.string({ minLength: 1, maxLength: 30 }),
  });
}

function makePatternRecord(
  signature: FailureSignature,
  fix: FixTemplate,
  confidence: number,
  index: number,
): HealPatternRecord {
  const now = new Date().toISOString();
  const successCount = Math.max(1, Math.round(confidence * 10));
  const failureCount = Math.round((successCount * (1 - confidence)) / Math.max(confidence, 0.001));

  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    signature,
    fix,
    confidence,
    successCount,
    failureCount,
    createdAt: now,
    lastApplied: now,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['test'],
    metadata: { createdBy: 'healer' },
  };
}

function makeDatabase(patterns: HealPatternRecord[]): HealPatternDatabase {
  return {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    patterns,
    statistics: {
      totalPatterns: patterns.length,
      totalApplications: patterns.reduce((sum, p) => sum + p.successCount + p.failureCount, 0),
      overallSuccessRate:
        patterns.length > 0
          ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
          : 0,
    },
  };
}

// ─── Property Test ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      // Generate an incoming signature to look up
      arbitraryFailureSignature(),
      // Generate 1-10 patterns with varying confidence levels
      fc.array(fc.tuple(arbitraryFailureSignature(), arbitraryFix(), arbitraryConfidence()), {
        minLength: 1,
        maxLength: 10,
      }),
      async (incomingSignature, patternSpecs) => {
        // Build the database with generated patterns
        const patterns = patternSpecs.map(([sig, fix, conf], i) =>
          makePatternRecord(sig, fix, conf, i),
        );
        const db = makeDatabase(patterns);

        // Perform lookup
        const result = lookupPattern(incomingSignature, db);

        if (result !== null) {
          // CASE 1: Non-null result — verify thresholds are met
          const score = computeMatchScore(incomingSignature, result.signature);

          assert.ok(
            score >= MATCH_SCORE_THRESHOLD,
            `Non-null result must have match score >= ${MATCH_SCORE_THRESHOLD}, got ${score}`,
          );
          assert.ok(
            result.confidence >= CONFIDENCE_THRESHOLD,
            `Non-null result must have confidence >= ${CONFIDENCE_THRESHOLD}, got ${result.confidence}`,
          );
        } else {
          // CASE 2: Null result — verify no pattern meets BOTH thresholds
          for (const pattern of patterns) {
            const score = computeMatchScore(incomingSignature, pattern.signature);
            const meetsBoth =
              score >= MATCH_SCORE_THRESHOLD && pattern.confidence >= CONFIDENCE_THRESHOLD;

            assert.ok(
              !meetsBoth,
              `lookupPattern returned null but pattern ${pattern.id} has score=${score} (>= ${MATCH_SCORE_THRESHOLD}) ` +
                `and confidence=${pattern.confidence} (>= ${CONFIDENCE_THRESHOLD}), so should have matched`,
            );
          }
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log(
    '✓ Property 13 passed: pattern lookup threshold enforced (score >= 0.7 AND confidence >= 0.5)',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

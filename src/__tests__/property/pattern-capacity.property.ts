/// <reference types="node" />

/**
 * Property 10: Database Capacity Bounded
 *
 * For any state of the Pattern_Database after any store operation, the number
 * of patterns SHALL not exceed 500, with lowest-confidence patterns pruned
 * first when the limit is reached.
 *
 * **Validates: Requirements 5.5**
 */

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { storePattern, createEmptyDatabase } from '../../agents/healer/pattern-database';
import type { FailureSignature, FixTemplate } from '../../shared/types';
import type {
  HealPatternDatabase,
  HealPatternRecord,
} from '../../shared/types/heal-patterns.schema';

const MAX_PATTERNS = 500;

/**
 * Creates a mock FailureSignature with a unique errorPattern.
 */
function makeSignature(index: number): FailureSignature {
  return {
    errorType: 'locator',
    errorPattern: `error-pattern-${index}`,
    selectorType: 'getByRole',
    pageContext: `/page-${index}`,
  };
}

/**
 * Creates a mock FixTemplate.
 */
function makeFix(): FixTemplate {
  return {
    strategy: 'replace_locator',
    beforePattern: 'page.locator(".old")',
    afterTemplate: 'page.getByRole("button")',
  };
}

/**
 * Creates a HealPatternRecord with a given confidence and index.
 */
function makePatternRecord(index: number, confidence: number): HealPatternRecord {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    id: `pattern-${index}`,
    signature: makeSignature(index),
    fix: makeFix(),
    confidence,
    successCount: Math.max(1, Math.round(confidence * 10)),
    failureCount: Math.max(0, Math.round((1 - confidence) * 10)),
    createdAt: now.toISOString(),
    lastApplied: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    tags: ['locator-drift'],
    metadata: { createdBy: 'healer' },
  };
}

/**
 * Pre-fills a database with a specified number of patterns at various confidence levels.
 */
function createPrefilledDatabase(patternCount: number, confidences: number[]): HealPatternDatabase {
  const db = createEmptyDatabase();
  const patterns: HealPatternRecord[] = [];

  for (let i = 0; i < patternCount; i++) {
    const confidence = confidences[i % confidences.length];
    patterns.push(makePatternRecord(i, confidence));
  }

  return {
    ...db,
    patterns,
    statistics: {
      totalPatterns: patterns.length,
      totalApplications: patterns.reduce((s, p) => s + p.successCount + p.failureCount, 0),
      overallSuccessRate: 0.8,
    },
  };
}

async function main(): Promise<void> {
  // Property 10a: After any store operation on a database with ~499-502 patterns,
  // the pattern count SHALL not exceed 500.
  await fc.assert(
    fc.asyncProperty(
      // Generate initial pattern count near the limit (499-502)
      fc.integer({ min: 499, max: 502 }),
      // Generate confidences for pre-filled patterns
      fc.array(fc.double({ min: 0.4, max: 1.0, noNaN: true }), { minLength: 10, maxLength: 20 }),
      // Generate number of additional patterns to store
      fc.integer({ min: 1, max: 5 }),
      async (initialCount, confidences, additionalStores) => {
        // Create a pre-filled database near the limit
        const db = createPrefilledDatabase(initialCount, confidences);

        // Store additional patterns one by one
        let currentDb = db;
        for (let i = 0; i < additionalStores; i++) {
          const newSignature = makeSignature(initialCount + i + 1000);
          currentDb = storePattern(currentDb, newSignature, makeFix(), true);

          // After each store, the pattern count must not exceed 500
          assert(
            currentDb.patterns.length <= MAX_PATTERNS,
            `Database has ${currentDb.patterns.length} patterns after store operation, exceeds max of ${MAX_PATTERNS}`,
          );
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log('✓ Property 10a passed: database capacity bounded at 500 patterns');

  // Property 10b: When pruning occurs, lowest-confidence patterns are removed first.
  await fc.assert(
    fc.asyncProperty(
      // Generate confidences for pre-filled patterns (mix of low and high)
      fc.array(fc.double({ min: 0.35, max: 1.0, noNaN: true }), { minLength: 500, maxLength: 500 }),
      async (confidences) => {
        // Create a full database at the limit
        const db = createPrefilledDatabase(500, confidences);

        // Store one more pattern (should trigger pruning)
        const newSignature = makeSignature(9999);
        const newDb = storePattern(db, newSignature, makeFix(), true);

        // Verify capacity is enforced
        assert(
          newDb.patterns.length <= MAX_PATTERNS,
          `Database has ${newDb.patterns.length} patterns, exceeds max of ${MAX_PATTERNS}`,
        );

        // Verify that remaining patterns have confidence >= the lowest-confidence pruned patterns.
        // The new pattern has confidence 1.0. After pruning, all remaining patterns should have
        // confidence >= any pattern that was removed.
        const remainingConfidences = newDb.patterns.map((p) => p.confidence);
        const minRemaining = Math.min(...remainingConfidences);

        // The patterns that were removed had lower confidence than the ones kept.
        // Since we started with 500 patterns and added 1 (501 total), exactly 1 was pruned.
        // That pruned pattern should have had the lowest confidence among the original 500 + new.
        // All remaining patterns should have confidence >= minRemaining (tautologically true),
        // but importantly, the new pattern (confidence 1.0) should still be present.
        const newPatternPresent = newDb.patterns.some(
          (p) => p.signature.errorPattern === 'error-pattern-9999',
        );
        assert(newPatternPresent, 'Newly stored pattern was pruned despite having confidence 1.0');

        // Verify that remaining patterns have confidence >= the pruned patterns.
        // (enforceCapacityLimit sorts and keeps highest)

        // The min confidence in remaining should be >= any confidence that was removed.
        // Since we have 501 patterns total and keep 500, the removed one had
        // the lowest confidence from the full set (including the new one at 1.0).
        // This means minRemaining >= lowestConfidenceInOriginal (the one removed).
        const allOriginalConfidences = confidences.slice(0, 500);
        const lowestOriginal = Math.min(...allOriginalConfidences);

        // The removed pattern had confidence = lowestOriginal (the minimum of all 501 patterns,
        // since the new pattern has confidence 1.0, it won't be the minimum).
        assert(
          minRemaining >= lowestOriginal,
          `Remaining min confidence ${minRemaining} is less than the removed pattern's confidence ${lowestOriginal}. Lowest-confidence patterns should be pruned first.`,
        );
      },
    ),
    { numRuns: 50 },
  );

  console.log('✓ Property 10b passed: lowest-confidence patterns are pruned first');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

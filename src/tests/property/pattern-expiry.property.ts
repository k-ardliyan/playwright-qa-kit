/// <reference types="node" />

/**
 * Property 11: Expired Patterns Are Pruned
 *
 * For any pattern whose lastApplied date is more than 30 days ago, or whose
 * confidence is below 0.3 with failureCount greater than 3, the pattern SHALL
 * be removed during the next storePattern operation.
 *
 * **Validates: Requirements 5.6, 5.7**
 */

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { storePattern, prunePatterns } from '../../agents/healer/pattern-database';
import type { FailureSignature, FixTemplate } from '../../shared/types';
import type {
  HealPatternDatabase,
  HealPatternRecord,
} from '../../shared/types/heal-patterns.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function makeSignature(id: string): FailureSignature {
  return {
    errorType: 'locator',
    errorPattern: `error-pattern-${id}`,
    selectorType: 'getByRole',
    pageContext: `/page/${id}`,
  };
}

function makeFix(): FixTemplate {
  return {
    strategy: 'replace_locator',
    beforePattern: 'page.locator(".old")',
    afterTemplate: 'page.getByRole("button", { name: "submit" })',
  };
}

/**
 * Creates a pattern record that has expired by time (expiresAt in the past).
 */
function makeExpiredByTimePattern(id: string, daysExpiredAgo: number): HealPatternRecord {
  const now = new Date();
  const lastApplied = new Date(now.getTime() - (30 + daysExpiredAgo) * MS_PER_DAY);
  const expiresAt = new Date(lastApplied.getTime() + 30 * MS_PER_DAY); // already past

  return {
    id: `expired-time-${id}`,
    signature: makeSignature(`expired-time-${id}`),
    fix: makeFix(),
    confidence: 0.8,
    successCount: 8,
    failureCount: 2,
    createdAt: new Date(now.getTime() - 60 * MS_PER_DAY).toISOString(),
    lastApplied: lastApplied.toISOString(),
    expiresAt: expiresAt.toISOString(),
    tags: ['locator-drift'],
    metadata: { createdBy: 'healer' },
  };
}

/**
 * Creates a pattern record that should be auto-expired: confidence < 0.3 and failureCount > 3.
 */
function makeLowConfidencePattern(
  id: string,
  confidence: number,
  failureCount: number,
): HealPatternRecord {
  const now = new Date();
  const successCount = Math.max(1, Math.round((confidence * failureCount) / (1 - confidence)));

  return {
    id: `low-conf-${id}`,
    signature: makeSignature(`low-conf-${id}`),
    fix: makeFix(),
    confidence,
    successCount,
    failureCount,
    createdAt: new Date(now.getTime() - 10 * MS_PER_DAY).toISOString(),
    lastApplied: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * MS_PER_DAY).toISOString(), // not expired by time
    tags: ['timing'],
    metadata: { createdBy: 'healer' },
  };
}

/**
 * Creates a valid non-expired pattern that should be retained.
 */
function makeValidPattern(id: string): HealPatternRecord {
  const now = new Date();

  return {
    id: `valid-${id}`,
    signature: makeSignature(`valid-${id}`),
    fix: makeFix(),
    confidence: 0.9,
    successCount: 9,
    failureCount: 1,
    createdAt: new Date(now.getTime() - 5 * MS_PER_DAY).toISOString(),
    lastApplied: now.toISOString(),
    expiresAt: new Date(now.getTime() + 25 * MS_PER_DAY).toISOString(),
    tags: ['locator-drift'],
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
      totalApplications: patterns.reduce((s, p) => s + p.successCount + p.failureCount, 0),
      overallSuccessRate: 0.8,
    },
  };
}

// ─── Property Tests ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Property 11a: Patterns expired by time (30+ days since lastApplied) are pruned during storePattern
  await fc.assert(
    fc.asyncProperty(
      // Number of expired-by-time patterns to seed
      fc.integer({ min: 1, max: 10 }),
      // Days past expiry (1..60)
      fc.integer({ min: 1, max: 60 }),
      // Number of valid patterns to retain
      fc.integer({ min: 0, max: 5 }),
      async (expiredCount, daysExpired, validCount) => {
        const expiredPatterns = Array.from({ length: expiredCount }, (_, i) =>
          makeExpiredByTimePattern(`${i}`, daysExpired),
        );
        const validPatterns = Array.from({ length: validCount }, (_, i) =>
          makeValidPattern(`${i}`),
        );

        const db = makeDatabase([...expiredPatterns, ...validPatterns]);

        // Trigger pruning via storePattern (adding a new unique pattern)
        const newSig = makeSignature('trigger-new');
        const result = storePattern(db, newSig, makeFix(), true);

        // All time-expired patterns must be removed
        for (const expired of expiredPatterns) {
          const found = result.patterns.find((p) => p.id === expired.id);
          assert.equal(
            found,
            undefined,
            `Pattern ${expired.id} (expired by time) should have been pruned`,
          );
        }

        // All valid patterns should be retained
        for (const valid of validPatterns) {
          const found = result.patterns.find((p) => p.id === valid.id);
          assert.notEqual(
            found,
            undefined,
            `Pattern ${valid.id} (valid) should have been retained`,
          );
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log('✓ Property 11a passed: patterns expired by time are pruned during storePattern');

  // Property 11b: Patterns with confidence < 0.3 and failureCount > 3 are auto-expired
  await fc.assert(
    fc.asyncProperty(
      // Confidence below 0.3 (exclusive)
      fc.double({ min: 0.01, max: 0.29, noNaN: true }),
      // Failure count above 3 (exclusive)
      fc.integer({ min: 4, max: 50 }),
      // Number of valid patterns to retain
      fc.integer({ min: 0, max: 5 }),
      async (confidence, failureCount, validCount) => {
        const lowConfPattern = makeLowConfidencePattern('0', confidence, failureCount);
        const validPatterns = Array.from({ length: validCount }, (_, i) =>
          makeValidPattern(`${i}`),
        );

        const db = makeDatabase([lowConfPattern, ...validPatterns]);

        // Trigger pruning via storePattern
        const newSig = makeSignature('trigger-new-b');
        const result = storePattern(db, newSig, makeFix(), true);

        // Low confidence pattern should be removed
        const found = result.patterns.find((p) => p.id === lowConfPattern.id);
        assert.equal(
          found,
          undefined,
          `Pattern ${lowConfPattern.id} (confidence=${confidence.toFixed(3)}, failures=${failureCount}) should have been auto-expired`,
        );

        // Valid patterns should be retained
        for (const valid of validPatterns) {
          const foundValid = result.patterns.find((p) => p.id === valid.id);
          assert.notEqual(
            foundValid,
            undefined,
            `Pattern ${valid.id} (valid) should have been retained`,
          );
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log('✓ Property 11b passed: low-confidence high-failure patterns are auto-expired');

  // Property 11c: prunePatterns also removes expired patterns
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 8 }),
      fc.integer({ min: 1, max: 60 }),
      fc.integer({ min: 0, max: 5 }),
      async (expiredCount, daysExpired, validCount) => {
        const expiredPatterns = Array.from({ length: expiredCount }, (_, i) =>
          makeExpiredByTimePattern(`prune-${i}`, daysExpired),
        );
        const validPatterns = Array.from({ length: validCount }, (_, i) =>
          makeValidPattern(`prune-${i}`),
        );

        const db = makeDatabase([...expiredPatterns, ...validPatterns]);
        const result = prunePatterns(db);

        // All expired patterns must be removed
        for (const expired of expiredPatterns) {
          const found = result.patterns.find((p) => p.id === expired.id);
          assert.equal(
            found,
            undefined,
            `Pattern ${expired.id} should have been pruned by prunePatterns()`,
          );
        }

        // Valid patterns must remain
        for (const valid of validPatterns) {
          const found = result.patterns.find((p) => p.id === valid.id);
          assert.notEqual(
            found,
            undefined,
            `Pattern ${valid.id} should be retained by prunePatterns()`,
          );
        }
      },
    ),
    { numRuns: 100 },
  );

  console.log('✓ Property 11c passed: prunePatterns removes expired patterns correctly');

  // Property 11d: Non-expired patterns are never accidentally pruned
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (count) => {
      const validPatterns = Array.from({ length: count }, (_, i) => makeValidPattern(`safe-${i}`));

      const db = makeDatabase(validPatterns);
      const result = prunePatterns(db);

      // All valid patterns must remain
      assert.equal(
        result.patterns.length,
        count,
        `Expected ${count} valid patterns to be retained, got ${result.patterns.length}`,
      );
    }),
    { numRuns: 100 },
  );

  console.log('✓ Property 11d passed: non-expired patterns are never pruned');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

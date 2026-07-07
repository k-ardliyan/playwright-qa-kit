/**
 * Healer Pattern Matcher — Fuzzy Signature Matching
 *
 * Matches incoming test failure signatures against stored heal patterns
 * using weighted fuzzy matching. Returns the best matching pattern when
 * thresholds are met.
 *
 * Match Score Algorithm (weighted components summing to 1.0):
 * - errorType exact match: 0.4
 * - errorPattern regex match: 0.3
 * - selectorType exact match: 0.15
 * - pageContext substring match: 0.15
 *
 * Thresholds:
 * - Match score >= 0.7
 * - Pattern confidence >= 0.5
 *
 * Tie-breaking:
 * - Highest match score wins
 * - If tied on score, highest confidence wins
 *
 * @module agents/healer/pattern-matcher
 */

import type { FailureSignature, HealPattern } from '@/shared/types';
import type { HealPatternDatabase } from '@/shared/types/heal-patterns.schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEIGHT_ERROR_TYPE = 0.4;
const WEIGHT_ERROR_PATTERN = 0.3;
const WEIGHT_SELECTOR_TYPE = 0.15;
const WEIGHT_PAGE_CONTEXT = 0.15;

const MATCH_SCORE_THRESHOLD = 0.7;
const CONFIDENCE_THRESHOLD = 0.5;

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Computes the weighted match score between two failure signatures.
 *
 * Weights:
 * - errorType exact match: 0.4
 * - errorPattern regex match: 0.3
 * - selectorType exact match: 0.15
 * - pageContext substring match: 0.15
 *
 * Total always sums weights to 1.0 (no normalization needed).
 * Missing fields (selectorType/pageContext absent) → 0 for that component.
 *
 * Postconditions:
 * - Return value is always between 0.0 and 1.0 inclusive
 */
export function computeMatchScore(incoming: FailureSignature, stored: FailureSignature): number {
  let score = 0;

  // 1. errorType exact match → 0.4
  if (incoming.errorType === stored.errorType) {
    score += WEIGHT_ERROR_TYPE;
  }

  // 2. errorPattern regex match → 0.3
  // Use stored.errorPattern as a regex to test against incoming.errorPattern
  score += computeErrorPatternScore(incoming.errorPattern, stored.errorPattern);

  // 3. selectorType exact match → 0.15
  // Both must be present AND equal; if either is absent → 0
  if (
    incoming.selectorType &&
    stored.selectorType &&
    incoming.selectorType === stored.selectorType
  ) {
    score += WEIGHT_SELECTOR_TYPE;
  }

  // 4. pageContext substring match → 0.15
  // Both must be present AND either contains the other; if either is absent → 0
  if (incoming.pageContext && stored.pageContext) {
    if (
      incoming.pageContext.includes(stored.pageContext) ||
      stored.pageContext.includes(incoming.pageContext)
    ) {
      score += WEIGHT_PAGE_CONTEXT;
    }
  }

  return score;
}

/**
 * Looks up the best matching pattern for a failure signature.
 *
 * Thresholds:
 * - Match score >= 0.7
 * - Pattern confidence >= 0.5
 *
 * Tie-breaking:
 * - Highest match score wins
 * - If tied on score, highest confidence wins
 *
 * Returns null if no pattern meets both thresholds.
 */
export function lookupPattern(
  signature: FailureSignature,
  db: HealPatternDatabase,
): HealPattern | null {
  let bestPattern: HealPattern | null = null;
  let bestScore = -1;
  let bestConfidence = -1;

  for (const pattern of db.patterns) {
    // Check confidence threshold first (cheap filter)
    if (pattern.confidence < CONFIDENCE_THRESHOLD) {
      continue;
    }

    const score = computeMatchScore(signature, pattern.signature);

    // Check match score threshold
    if (score < MATCH_SCORE_THRESHOLD) {
      continue;
    }

    // Tie-breaking: highest score wins; if tied, highest confidence wins
    if (score > bestScore || (score === bestScore && pattern.confidence > bestConfidence)) {
      bestPattern = pattern;
      bestScore = score;
      bestConfidence = pattern.confidence;
    }
  }

  return bestPattern;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Computes the errorPattern component score.
 *
 * Uses the stored pattern as a regex (case-insensitive) to test
 * against the incoming error pattern string.
 *
 * If the stored pattern is invalid regex, returns 0 for this component.
 */
function computeErrorPatternScore(incomingPattern: string, storedPattern: string): number {
  try {
    const regex = new RegExp(storedPattern, 'i');
    if (regex.test(incomingPattern)) {
      return WEIGHT_ERROR_PATTERN;
    }
  } catch {
    // Invalid regex in stored pattern → score 0 for this component
  }

  return 0;
}

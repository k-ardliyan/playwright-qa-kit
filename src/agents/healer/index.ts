/**
 * Healer Agent — Barrel Export
 *
 * Re-exports all public APIs from the healer learning system modules:
 * - Pattern Database: CRUD operations for heal pattern storage
 * - Pattern Matcher: Fuzzy signature matching and pattern lookup
 * - Failure Prioritizer: Intelligent failure ranking by fix likelihood
 *
 * @module agents/healer
 */

// Pattern Database — persistent storage and CRUD
export {
  loadDatabase,
  saveDatabase,
  storePattern,
  recordPatternOutcome,
  prunePatterns,
  findBySignature,
  createEmptyDatabase,
} from './pattern-database';

// Pattern Matcher — fuzzy signature matching
export { lookupPattern, computeMatchScore } from './pattern-matcher';

// Failure Prioritizer — intelligent ranking
export { prioritizeFailures } from './failure-prioritizer';

/**
 * Data model schema for the Heal Pattern Database (heal-patterns.json).
 *
 * Stores persistent heal patterns used by the Healer Agent to resolve
 * known failure types faster on subsequent occurrences.
 *
 * Validation Rules:
 * - `id` must be unique UUID v4
 * - `confidence` must be between 0.0 and 1.0
 * - `successCount + failureCount > 0` (pattern must have been applied at least once)
 * - `signature.errorPattern` must be valid regex
 * - Patterns with `confidence < 0.3` and `failureCount > 3` are auto-expired
 * - Maximum 500 patterns stored; lowest-confidence patterns are pruned first
 */

import type { HealPattern, FailureSignature, FixTemplate } from './robustness.types';

/**
 * Extended pattern record for database storage.
 * Adds metadata fields beyond the base HealPattern interface.
 */
export interface HealPatternRecord extends HealPattern {
  /** ISO 8601 timestamp when the pattern was first created */
  createdAt: string;
  /** ISO 8601 timestamp: createdAt + 30 days of inactivity triggers expiry */
  expiresAt: string;
  /** Additional metadata about pattern origin */
  metadata: {
    /** Whether this pattern was created by the healer agent or manually */
    createdBy: 'healer' | 'manual';
    /** Source test file where the original failure occurred */
    sourceFile?: string;
    /** Original error message that triggered pattern creation */
    originalError?: string;
  };
}

/**
 * Root schema for the heal-patterns.json persistent store.
 */
export interface HealPatternDatabase {
  /** Schema version for forward compatibility */
  version: '1.0';
  /** ISO 8601 timestamp of last database modification */
  lastUpdated: string;
  /** Array of stored heal patterns (max 500) */
  patterns: HealPatternRecord[];
  /** Aggregate statistics for the pattern database */
  statistics: {
    /** Total number of patterns currently stored */
    totalPatterns: number;
    /** Total number of times any pattern has been applied */
    totalApplications: number;
    /** Overall success rate across all pattern applications (0.0–1.0) */
    overallSuccessRate: number;
  };
}

// Re-export imported types for convenience
export type { HealPattern, FailureSignature, FixTemplate };

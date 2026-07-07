/**
 * Data model schema for Generation State (generation-state.json).
 *
 * Tracks per-scenario generation progress to enable partial generation
 * with independent success/failure tracking and resume capability.
 *
 * Validation Rules:
 * - `attempts.length <= options.maxRetriesPerScenario + 1`
 * - `currentIndex` must be valid index into `scenarios`
 * - Only one scenario may be `in_progress` at a time
 */

import type { GenerationOptions } from './robustness.types';

/**
 * Record of a single generation attempt for a scenario.
 */
export interface AttemptRecord {
  /** 1-based attempt number */
  attemptNumber: number;
  /** ISO 8601 timestamp when this attempt started */
  timestamp: string;
  /** Strategy used for this attempt (e.g., 'live_verification', 'skeleton', 'catalog_refresh') */
  strategy: string;
  /** Outcome of this attempt */
  result: 'success' | 'failure';
  /** Duration of the attempt in milliseconds */
  duration: number;
  /** Error message if result is 'failure' */
  error?: string;
}

/**
 * State tracking for an individual scenario within a generation run.
 */
export interface ScenarioState {
  /** Unique identifier for the scenario */
  scenarioId: string;
  /** Current generation status */
  status: 'pending' | 'in_progress' | 'generated' | 'skipped' | 'failed';
  /** History of generation attempts for this scenario */
  attempts: AttemptRecord[];
  /** Path to the generated test file (set on successful generation) */
  outputFile?: string;
  /** Last error message encountered (set on failure) */
  lastError?: string;
}

/**
 * Root schema for generation state tracking.
 * Enables scenario-by-scenario generation with resume capability.
 */
export interface GenerationState {
  /** Unique identifier for the test plan being generated */
  planId: string;
  /** ISO 8601 timestamp when generation started */
  startedAt: string;
  /** Per-scenario state tracking */
  scenarios: ScenarioState[];
  /** Index of the scenario currently being processed */
  currentIndex: number;
  /** Generation options controlling retry and fallback behavior */
  options: GenerationOptions;
}

// Re-export imported types for convenience
export type { GenerationOptions };

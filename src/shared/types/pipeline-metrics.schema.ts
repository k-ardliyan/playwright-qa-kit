/**
 * Data model schema for Pipeline Metrics (pipeline-metrics.json).
 *
 * Stores time-series data tracking pipeline stage durations,
 * success rates, and error counts for observability and trend analysis.
 *
 * Validation Rules:
 * - Maximum 90 days of run history retained
 * - Aggregates recalculated on each new run
 * - `passRate` is a percentage (0–100)
 * - `duration` is in milliseconds
 */

import type { BrowserTarget } from './robustness.types';

/**
 * Metrics for a single pipeline stage execution.
 */
export interface StageMetric {
  /** Pipeline stage name (planner, generator, executor, healer, reporter) */
  stage: string;
  /** Stage execution duration in milliseconds (0 for skipped stages) */
  duration: number;
  /** Outcome status of the stage */
  status: 'success' | 'error' | 'skipped';
  /** Number of retries performed during this stage */
  retryCount: number;
  /** Number of items (scenarios, tests, patterns) processed */
  itemsProcessed: number;
}

/**
 * Record of a single pipeline run.
 */
export interface PipelineRun {
  /** Unique identifier for this run */
  runId: string;
  /** ISO 8601 timestamp when the run started */
  timestamp: string;
  /** Total run duration in milliseconds */
  duration: number;
  /** Per-stage metrics for this run */
  stages: StageMetric[];
  /** Overall run result */
  result: 'success' | 'partial' | 'failure';
  /** Environment the run executed against (e.g., 'dev', 'staging') */
  environment: string;
  /** Browser targets used in this run */
  browsers: BrowserTarget[];
  /** Total number of tests executed */
  testCount: number;
  /** Pass rate as a percentage (0–100) */
  passRate: number;
}

/**
 * Aggregate metrics calculated over a time window.
 */
export interface AggregateMetrics {
  /** Number of runs in this time window */
  runCount: number;
  /** Average run duration in milliseconds */
  averageDuration: number;
  /** Pipeline success rate as a percentage (0–100) */
  successRate: number;
  /** Average test pass rate as a percentage (0–100) */
  averagePassRate: number;
  /** Most frequently occurring failure categories in this window */
  mostCommonFailures: string[];
}

/**
 * Root schema for the pipeline-metrics.json persistent store.
 */
export interface PipelineMetricsStore {
  /** Schema version for forward compatibility */
  version: '1.0';
  /** Array of pipeline run records (max 90 days retention) */
  runs: PipelineRun[];
  /** Pre-calculated aggregate metrics for common time windows */
  aggregates: {
    /** Aggregate metrics for the last 7 days */
    last7Days: AggregateMetrics;
    /** Aggregate metrics for the last 30 days */
    last30Days: AggregateMetrics;
    /** Aggregate metrics across all retained history */
    allTime: AggregateMetrics;
  };
}

// Re-export imported types for convenience
export type { BrowserTarget };

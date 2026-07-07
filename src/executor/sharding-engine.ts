/**
 * Test Sharding Engine
 *
 * Distributes test files across shards using configurable strategies:
 * - round-robin: cyclic distribution across shards
 * - by-file: alphabetical grouping into sequential chunks
 * - by-duration: greedy bin-packing using historical run data
 *
 * Postconditions:
 * - Every file appears in exactly one shard (no duplicates, no omissions)
 * - No shard exceeds maxTestsPerShard (if configured)
 * - Empty shards are removed and remaining shards re-indexed from 0
 * - For empty input: returns empty array
 * - For by-duration: longest vs shortest shard within 20% of average duration
 *
 * @module executor/sharding-engine
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { ShardConfig, TestShard } from '../shared/types';

/** Default duration estimate when no historical data is available (ms) */
const DEFAULT_DURATION_MS = 5000;

/**
 * Distributes test files across shards using the configured strategy.
 *
 * @param testFiles - Array of test file paths to distribute
 * @param config - Sharding configuration (strategy, totalShards, maxTestsPerShard)
 * @param historicalDurations - Optional map of file path → historical duration in ms
 * @returns Array of TestShard objects, re-indexed from 0 with empty shards removed
 */
export function shardTests(
  testFiles: string[],
  config: ShardConfig,
  historicalDurations?: Map<string, number>,
): TestShard[] {
  // Req 9.7: empty file list → empty array
  if (testFiles.length === 0) {
    return [];
  }

  // Req 9.8: distribute into specified totalShards before maxTestsPerShard adjustments
  const shards: TestShard[] = Array.from({ length: config.totalShards }, (_, i) => ({
    shardIndex: i,
    totalShards: config.totalShards,
    testFiles: [],
    estimatedDuration: 0,
  }));

  switch (config.strategy) {
    case 'round-robin':
      distributeRoundRobin(testFiles, shards);
      break;

    case 'by-file':
      distributeByFile(testFiles, shards);
      break;

    case 'by-duration':
      distributeByDuration(testFiles, shards, historicalDurations);
      break;
  }

  // Req 9.3: apply maxTestsPerShard cap with overflow redistribution
  if (config.maxTestsPerShard && config.maxTestsPerShard > 0) {
    applyMaxTestsPerShard(shards, config.maxTestsPerShard, config.strategy, historicalDurations);
  }

  // Req 9.6: remove empty shards and re-index from 0
  return reindexShards(shards);
}

/**
 * Round-robin strategy: cyclic distribution of files across shards.
 * File i goes to shard (i % totalShards).
 */
function distributeRoundRobin(testFiles: string[], shards: TestShard[]): void {
  for (let i = 0; i < testFiles.length; i++) {
    shards[i % shards.length].testFiles.push(testFiles[i]);
  }
}

/**
 * By-file strategy: sort alphabetically and chunk into sequential groups.
 */
function distributeByFile(testFiles: string[], shards: TestShard[]): void {
  const sorted = [...testFiles].sort();
  const chunkSize = Math.ceil(sorted.length / shards.length);

  for (let i = 0; i < shards.length; i++) {
    shards[i].testFiles = sorted.slice(i * chunkSize, (i + 1) * chunkSize);
  }
}

/**
 * By-duration strategy: greedy bin-packing.
 * Sort files by duration descending, then assign each file to the shard
 * with the lowest current total duration (longest-processing-time-first heuristic).
 *
 * Req 9.5: uses DEFAULT_DURATION_MS (5000) when no historical data is available.
 * Req 9.4: aims for duration balance within 20% of average.
 */
function distributeByDuration(
  testFiles: string[],
  shards: TestShard[],
  historicalDurations?: Map<string, number>,
): void {
  // Build duration entries with defaults for missing data
  const durations = testFiles.map((file) => ({
    file,
    duration: historicalDurations?.get(file) ?? DEFAULT_DURATION_MS,
  }));

  // Sort longest-first for better bin-packing
  durations.sort((a, b) => b.duration - a.duration);

  // Greedy assignment: always place in the shard with least total duration
  for (const { file, duration } of durations) {
    const minShard = shards.reduce((min, s) =>
      (s.estimatedDuration ?? 0) < (min.estimatedDuration ?? 0) ? s : min,
    );
    minShard.testFiles.push(file);
    minShard.estimatedDuration = (minShard.estimatedDuration ?? 0) + duration;
  }
}

/**
 * Enforces maxTestsPerShard cap by redistributing overflow files
 * into newly created shards.
 */
function applyMaxTestsPerShard(
  shards: TestShard[],
  maxTests: number,
  strategy: ShardConfig['strategy'],
  historicalDurations?: Map<string, number>,
): void {
  // Collect overflow files from shards that exceed the cap
  const overflowFiles: string[] = [];

  for (const shard of shards) {
    if (shard.testFiles.length > maxTests) {
      const excess = shard.testFiles.splice(maxTests);
      overflowFiles.push(...excess);

      // Recalculate estimated duration for truncated shard
      if (strategy === 'by-duration') {
        shard.estimatedDuration = shard.testFiles.reduce(
          (sum, f) => sum + (historicalDurations?.get(f) ?? DEFAULT_DURATION_MS),
          0,
        );
      }
    }
  }

  // Distribute overflow into new shards
  if (overflowFiles.length > 0) {
    const newShardCount = Math.ceil(overflowFiles.length / maxTests);

    for (let i = 0; i < newShardCount; i++) {
      const chunk = overflowFiles.slice(i * maxTests, (i + 1) * maxTests);
      const newShard: TestShard = {
        shardIndex: shards.length,
        totalShards: shards.length + 1,
        testFiles: chunk,
        estimatedDuration:
          strategy === 'by-duration'
            ? chunk.reduce(
                (sum, f) => sum + (historicalDurations?.get(f) ?? DEFAULT_DURATION_MS),
                0,
              )
            : 0,
      };
      shards.push(newShard);
    }
  }
}

/**
 * Removes empty shards and re-indexes remaining shards sequentially from 0.
 * Updates totalShards to reflect the actual count.
 */
function reindexShards(shards: TestShard[]): TestShard[] {
  const nonEmpty = shards.filter((s) => s.testFiles.length > 0);
  return nonEmpty.map((s, i) => ({
    ...s,
    shardIndex: i,
    totalShards: nonEmpty.length,
  }));
}

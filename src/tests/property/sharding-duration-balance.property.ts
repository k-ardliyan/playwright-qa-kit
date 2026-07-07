/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 18: Duration-Based Sharding Minimizes Imbalance
// **Validates: Requirements 9.4**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { shardTests } from '../../executor/sharding-engine';
import { ShardConfig } from '../../shared/types';

/**
 * Generates an arbitrary list of unique file paths (2-30 files)
 * with associated durations between 100ms and 60000ms.
 */
const filesWithDurationsArb = fc
  .uniqueArray(
    fc.stringMatching(/^[a-z][a-z0-9\-_/]*\.spec\.ts$/).filter((s) => s.length >= 5),
    { minLength: 2, maxLength: 30 },
  )
  .filter((arr) => arr.length >= 2)
  .chain((files) =>
    fc
      .array(fc.integer({ min: 100, max: 60000 }), {
        minLength: files.length,
        maxLength: files.length,
      })
      .map((durations) => ({ files, durations })),
  );

/**
 * Generates a totalShards value between 2 and 6 for by-duration strategy.
 */
const totalShardsArb = fc.integer({ min: 2, max: 6 });

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      filesWithDurationsArb,
      totalShardsArb,
      async ({ files, durations }, totalShards) => {
        // Build historical durations map
        const historicalDurations = new Map<string, number>();
        for (let i = 0; i < files.length; i++) {
          historicalDurations.set(files[i], durations[i]);
        }

        const config: ShardConfig = {
          totalShards,
          strategy: 'by-duration',
        };

        const shards = shardTests(files, config, historicalDurations);

        // Skip assertion if fewer shards produced than requested
        // (happens when there are fewer files than shards)
        if (shards.length === 0) return;

        // Calculate total duration of all files
        const totalDuration = durations.reduce((sum, d) => sum + d, 0);

        // Find the longest single file duration
        const longestFileDuration = Math.max(...durations);

        // Calculate actual shard durations from the output
        const shardDurations = shards.map((shard) =>
          shard.testFiles.reduce((sum, file) => sum + (historicalDurations.get(file) ?? 0), 0),
        );

        // Find the maximum shard duration
        const maxShardDuration = Math.max(...shardDurations);

        // The theoretical upper bound for greedy bin-packing (LPT heuristic):
        // max shard duration <= (total duration / shard count) + longest single file duration
        const upperBound = totalDuration / shards.length + longestFileDuration;

        assert.ok(
          maxShardDuration <= upperBound,
          `Max shard duration (${maxShardDuration}ms) exceeds theoretical upper bound ` +
            `(${upperBound.toFixed(2)}ms = ${totalDuration}/${shards.length} + ${longestFileDuration}). ` +
            `Shard durations: [${shardDurations.join(', ')}]`,
        );
      },
    ),
    { numRuns: 200 },
  );

  console.log('✓ Property 18 passed: duration-based sharding minimizes imbalance');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

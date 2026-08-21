/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 17: Shard Size Respected
// **Validates: Requirements 9.3**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { shardTests } from '../../executor/sharding-engine';
import { ShardConfig } from '../../shared/types';

/**
 * Generates an arbitrary list of unique file paths (1-50 files).
 */
const uniqueFilePathsArb = fc
  .uniqueArray(
    fc.stringMatching(/^[a-z][a-z0-9\-_/]*\.spec\.ts$/).filter((s) => s.length >= 5),
    { minLength: 1, maxLength: 50 },
  )
  .filter((arr) => arr.length >= 1);

/**
 * Generates a ShardConfig with maxTestsPerShard always set (1-20)
 * and various strategies for comprehensive coverage.
 */
const shardConfigWithMaxArb: fc.Arbitrary<ShardConfig> = fc.record({
  totalShards: fc.integer({ min: 1, max: 10 }),
  strategy: fc.constantFrom('round-robin' as const, 'by-file' as const, 'by-duration' as const),
  maxTestsPerShard: fc.integer({ min: 1, max: 20 }),
});

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(uniqueFilePathsArb, shardConfigWithMaxArb, async (files, config) => {
      const shards = shardTests(files, config);

      // Assert: every shard respects the maxTestsPerShard limit
      for (const shard of shards) {
        assert.ok(
          shard.testFiles.length <= config.maxTestsPerShard!,
          `Shard ${shard.shardIndex} has ${shard.testFiles.length} files, ` +
            `exceeding maxTestsPerShard limit of ${config.maxTestsPerShard}. ` +
            `Strategy: ${config.strategy}, totalShards: ${config.totalShards}, ` +
            `input files: ${files.length}`,
        );
      }
    }),
    { numRuns: 200 },
  );

  console.log('✓ Property 17 passed: shard size respected');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

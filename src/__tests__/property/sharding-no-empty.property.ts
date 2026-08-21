/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 25: Empty Shards Removed
// **Validates: Requirements 9.6**

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { shardTests } from '../../executor/sharding-engine';
import { ShardConfig } from '../../shared/types';

/**
 * Generates an arbitrary list of unique file paths (0-20 files),
 * including the possibility of an empty list.
 */
const filePathsArb = fc.uniqueArray(
  fc.stringMatching(/^[a-z][a-z0-9\-_/]*\.spec\.ts$/).filter((s) => s.length >= 5),
  { minLength: 0, maxLength: 20 },
);

/**
 * Generates a valid ShardConfig with various strategies.
 * totalShards can exceed file count to create potential empty shards.
 */
const shardConfigArb: fc.Arbitrary<ShardConfig> = fc.record({
  totalShards: fc.integer({ min: 1, max: 20 }),
  strategy: fc.constantFrom('round-robin' as const, 'by-file' as const, 'by-duration' as const),
  maxTestsPerShard: fc.oneof(fc.constant(undefined), fc.integer({ min: 1, max: 10 })),
});

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(filePathsArb, shardConfigArb, async (files, config) => {
      const shards = shardTests(files, config);

      if (files.length === 0) {
        // If input is empty, output must be empty array
        assert.equal(shards.length, 0, 'Empty input must produce empty output array');
      } else {
        // Every shard in output must have at least one test file
        for (const shard of shards) {
          assert.ok(
            shard.testFiles.length > 0,
            `Shard ${shard.shardIndex} has zero test files — empty shards must be removed`,
          );
        }
      }
    }),
    { numRuns: 200 },
  );

  console.log('✓ Property 25 passed: empty shards removed from output');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

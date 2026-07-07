/// <reference types="node" />

// Feature: framework-robustness-improvement, Property 16: Sharding Preserves All Files
// **Validates: Requirements 9.2**

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
 * Generates a valid ShardConfig with one of the three strategies
 * and a reasonable totalShards value.
 */
const shardConfigArb: fc.Arbitrary<ShardConfig> = fc.record({
  totalShards: fc.integer({ min: 1, max: 10 }),
  strategy: fc.constantFrom('round-robin' as const, 'by-file' as const, 'by-duration' as const),
  maxTestsPerShard: fc.oneof(fc.constant(undefined), fc.integer({ min: 1, max: 25 })),
});

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(uniqueFilePathsArb, shardConfigArb, async (files, config) => {
      const shards = shardTests(files, config);

      // Collect all files from all shards into a flat array
      const allShardedFiles = shards.flatMap((shard) => shard.testFiles);

      // Sort both arrays for comparison
      const sortedInput = [...files].sort();
      const sortedOutput = [...allShardedFiles].sort();

      // Assert: every file from input appears in exactly one shard
      // (same elements, no duplication, no loss)
      assert.deepEqual(
        sortedOutput,
        sortedInput,
        `Sharding must preserve all files without duplication or loss. ` +
          `Input count: ${files.length}, Output count: ${allShardedFiles.length}`,
      );
    }),
    { numRuns: 200 },
  );

  console.log('✓ Property 16 passed: sharding preserves all files');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

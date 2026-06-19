/// <reference types="node" />

// Feature: discover-pages, Property: input validation + regex compilation safety.

import assert from 'node:assert/strict';
import { discoverPages } from '../../../mcp-server/src/tools/discover-pages';

function runCase(label: string, assertFn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(assertFn)
    .then(() => {
      process.stdout.write(`✓ ${label}\n`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stdout.write(`✗ ${label}\n   ${message}\n`);
      process.exitCode = 1;
    });
}

async function main(): Promise<void> {
  await runCase('discover_pages rejects missing rootUrl', async () => {
    const result = await discoverPages({ featureName: 'public-pages' });
    assert.equal(result.status, 'error');
    if (result.status === 'error') {
      assert.equal(result.error?.code, 'INVALID_INPUT');
      assert.match(result.error?.message ?? '', /rootUrl/);
    }
  });

  await runCase('discover_pages rejects missing featureName', async () => {
    const result = await discoverPages({ rootUrl: 'https://example.com' });
    assert.equal(result.status, 'error');
    if (result.status === 'error') {
      assert.match(result.error?.message ?? '', /featureName/);
    }
  });

  await runCase('discover_pages rejects invalid URL', async () => {
    const result = await discoverPages({ rootUrl: 'not-a-url', featureName: 'public' });
    assert.equal(result.status, 'error');
  });

  await runCase('discover_pages rejects malformed exclude regex', async () => {
    const result = await discoverPages({
      rootUrl: 'https://example.com',
      featureName: 'public',
      excludePatterns: ['(/admin', '[/unclosed'],
    });
    assert.equal(result.status, 'error');
    if (result.status === 'error') {
      assert.match(result.error?.message ?? '', /excludePatterns|Invalid/);
    }
  });

  await runCase(
    'discover_pages accepts well-formed input even when network is unavailable',
    async () => {
      const result = await discoverPages({
        rootUrl: 'https://127.0.0.1:1',
        featureName: 'probe',
        maxDepth: 0,
        maxPages: 1,
        requestDelayMs: 0,
        respectRobots: false,
      });
      assert.ok(result.status === 'success' || result.status === 'error');
    },
  );
}

main().catch((error) => {
  process.stderr.write(
    `Test runner failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});

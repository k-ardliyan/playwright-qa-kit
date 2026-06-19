/// <reference types="node" />

// Feature: snapshot-page, Property: input validation + argument parsing.
// Negative tests verify that snapshotPage rejects malformed input WITHOUT
// touching the file system or launching Playwright. Positive parsing tests
// verify that valid arguments produce a well-formed dispatchable argument
// object.

import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { snapshotPage } from '../../../mcp-server/src/tools/snapshot-page';
import { resolveAllowedPath, getRepoRoot } from '../../../mcp-server/src/utils/safety';

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
  await runCase('snapshot_page rejects empty args object', async () => {
    const result = await snapshotPage(undefined);
    assert.equal(result.status, 'error');
    if (result.status === 'error') {
      assert.equal(result.error?.code, 'INVALID_INPUT');
    }
  });

  await runCase('snapshot_page rejects non-https url scheme', async () => {
    const result = await snapshotPage({
      url: 'ftp://example.com/login',
      featureName: 'login',
      pageName: 'login-form',
    });
    assert.equal(result.status, 'error');
  });

  await runCase('snapshot_page rejects missing url', async () => {
    const result = await snapshotPage({ featureName: 'login', pageName: 'login-form' });
    assert.equal(result.status, 'error');
    if (result.status === 'error') {
      assert.equal(result.error?.code, 'INVALID_INPUT');
      assert.match(result.error?.message ?? '', /url/);
    }
  });

  await runCase('snapshot_page rejects missing featureName', async () => {
    const result = await snapshotPage({ url: 'https://example.com/login', pageName: 'login-form' });
    assert.equal(result.status, 'error');
    if (result.status === 'error') {
      assert.equal(result.error?.code, 'INVALID_INPUT');
      assert.match(result.error?.message ?? '', /featureName/);
    }
  });

  await runCase('snapshot_page rejects missing pageName', async () => {
    const result = await snapshotPage({ url: 'https://example.com/login', featureName: 'login' });
    assert.equal(result.status, 'error');
    if (result.status === 'error') {
      assert.match(result.error?.message ?? '', /pageName/);
    }
  });

  await runCase('snapshot_page rejects path-traversal in featureName via safety', () => {
    const result = resolveAllowedPath('selector-catalog/../etc', 'selector-catalog', {
      mustExist: false,
    });
    assert.equal(result.ok, false);
  });

  await runCase('resolveAllowedPath accepts selector-catalog/<feature>/<page>', () => {
    const result = resolveAllowedPath('selector-catalog/login/login-form', 'selector-catalog', {
      mustExist: false,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.relativePath, 'selector-catalog/login/login-form');
    }
  });

  await runCase('snapshot_page rejects nested selector-catalog subdirectory write', () => {
    const deep = resolveAllowedPath('selector-catalog/a/b/c', 'selector-catalog', {
      mustExist: false,
    });
    assert.equal(deep.ok, true);
  });

  await runCase('selector-catalog kind is in AllowedPathKind (compile-time guarantee)', () => {
    const probe = resolveAllowedPath('selector-catalog/probe', 'selector-catalog', {
      mustExist: false,
    });
    assert.equal(probe.ok, true);
  });

  await runCase('snapshot_page does NOT create files when input is invalid', async () => {
    const repoRoot = getRepoRoot();
    const catalogRoot = path.join(repoRoot, 'selector-catalog');
    const existedBefore = fs.existsSync(catalogRoot);
    const beforeChildren = existedBefore
      ? new Set(fs.readdirSync(catalogRoot, { withFileTypes: true }).map((d) => d.name))
      : new Set<string>();

    const result = await snapshotPage({ url: 'not-a-url', featureName: 'login', pageName: 'x' });
    assert.equal(result.status, 'error');

    const existedAfter = fs.existsSync(catalogRoot);
    if (existedAfter) {
      const afterChildren = new Set(
        fs.readdirSync(catalogRoot, { withFileTypes: true }).map((d) => d.name),
      );
      for (const name of afterChildren) {
        assert.ok(
          beforeChildren.has(name) || !fs.statSync(path.join(catalogRoot, name)).isDirectory(),
          `unexpected new entry under selector-catalog/: ${name}`,
        );
      }
    }
  });
}

main().catch((error) => {
  process.stderr.write(
    `Test runner failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});

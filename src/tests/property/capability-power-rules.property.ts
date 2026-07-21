/// <reference types="node" />

/**
 * Property: capability tags require matching Playwright power APIs.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateSpecFile } from '../../../mcp-server/src/tools/validate-generated-tests';

const dir = path.resolve(process.cwd(), 'src/tests/__property_capability__');
const file = path.join(dir, 'case.spec.ts');

function write(content: string): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function cleanup(): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function base(extra: string): string {
  return `import { test, expect } from '@/fixtures/base.fixture';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
${extra}
test.describe('Capability Case', { tag: ['@network'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
`;
}

function main(): void {
  cleanup();

  // Missing mock → violation
  write(base(''));
  let v = validateSpecFile(file, 'src/tests/__property_capability__/case.spec.ts');
  assert.ok(
    v.some((x) => x.ruleName.includes('Capability rule (@network)')),
    `expected @network capability violation, got: ${JSON.stringify(v)}`,
  );

  // With mockJson → pass capability rule (may still be ok overall)
  write(
    base(`import { mockJson } from '@/support/pw';
`),
  );
  // still need actual usage of mockJson/route for rule
  write(`import { test, expect } from '@/fixtures/base.fixture';
import { mockJson } from '@/support/pw';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts

test.describe('Capability Case', { tag: ['@network'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await mockJson(page, '**/api/**', { ok: true });
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
`);
  v = validateSpecFile(file, 'src/tests/__property_capability__/case.spec.ts');
  assert.equal(
    v.filter((x) => x.ruleName.includes('Capability rule')).length,
    0,
    `unexpected capability violations: ${JSON.stringify(v)}`,
  );

  cleanup();
  process.stdout.write('✓ Property: capability tags require power APIs\n');
}

try {
  main();
} catch (error) {
  cleanup();
  console.error(error);
  process.exitCode = 1;
}

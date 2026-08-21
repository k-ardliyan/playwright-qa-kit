/// <reference types="node" />

/**
 * Property: capability tags require matching Playwright power APIs.
 * Covers @network, @network-assert, @download / @upload / @file-content.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateSpecFile } from '../../../tools/mcp/src/tools/validate-generated-tests';

// Use a temp dir OUTSIDE the repo so validateSpecFile receives a relativePath
// that does NOT contain '__property_' and is therefore NOT exempt — which is
// intentional: we WANT capability violations to fire so assertHasCap can verify them.
const dir = path.join(os.tmpdir(), `pw-cap-prop-${process.pid}`, 'src/tests/generated');
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

function violations(): ReturnType<typeof validateSpecFile> {
  // Use a non-exempt relativePath so capability rules actually fire.
  // Paths containing '__property_' are exempt from all rules by design.
  return validateSpecFile(file, 'src/tests/generated/case.spec.ts');
}

function assertHasCap(rule: string): void {
  const v = violations();
  assert.ok(
    v.some((x) => x.ruleName.includes(rule)),
    `expected ${rule}, got: ${JSON.stringify(v)}`,
  );
}

function assertNoCap(): void {
  const v = violations().filter((x) => x.ruleName.includes('Capability rule'));
  assert.equal(v.length, 0, `unexpected capability violations: ${JSON.stringify(v)}`);
}

function main(): void {
  cleanup();

  write(`import { test, expect } from '@/fixtures/base.fixture';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('Capability Case', { tag: ['@network'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
`);
  assertHasCap('Capability rule (@network)');

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
  assertNoCap();

  // @network-assert without observe API → fail
  write(`import { test, expect } from '@/fixtures/base.fixture';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('NetworkAssert', { tag: ['@network-assert'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
`);
  assertHasCap('Capability rule (@network-assert)');
  // Must NOT also require mock @network when only @network-assert is present
  {
    const v = violations().filter((x) => x.ruleName.includes('Capability rule (@network)'));
    assert.equal(v.length, 0, `cross-match @network on @network-assert: ${JSON.stringify(v)}`);
  }

  write(`import { test, expect } from '@/fixtures/base.fixture';
import { waitForApi, assertNetworkContract } from '@/support/pw';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('NetworkAssert', { tag: ['@network-assert'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      const { hit } = await waitForApi(page, { urlIncludes: '/api/x', method: 'POST' }, async () => {
        await page.getByRole('button').click();
      });
      assertNetworkContract(hit, 'test-fixtures/network/contracts/demo/submit-success.json');
    });
  });
});
`);
  assertNoCap();

  write(`import { test, expect } from '@/fixtures/base.fixture';
import { waitAndAssertApi } from '@/support/pw';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('NetworkAssertOneShot', { tag: ['@network-assert'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await waitAndAssertApi(
        page,
        {
          method: 'POST',
          urlIncludes: '/api/x',
          status: [200, 201],
          assert: { request: { requiredKeys: ['a'] }, response: { matchObject: { ok: true } } },
        },
        async () => {
          await page.getByRole('button').click();
        },
      );
    });
  });
});
`);
  assertNoCap();

  write(`import { test, expect } from '@/fixtures/base.fixture';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('Download', { tag: ['@download'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
`);
  assertHasCap('Capability rule (@download)');

  write(`import { test, expect } from '@/fixtures/base.fixture';
import { downloadAndSave } from '@/support/pw';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('Download', { tag: ['@download'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await downloadAndSave(page, async () => {
        await page.getByRole('button').click();
      });
    });
  });
});
`);
  assertNoCap();

  write(`import { test, expect } from '@/fixtures/base.fixture';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('Upload', { tag: ['@upload'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
`);
  assertHasCap('Capability rule (@upload)');

  write(`import { test, expect } from '@/fixtures/base.fixture';
import { uploadFixture } from '@/support/pw';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('Upload', { tag: ['@upload'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await uploadFixture(page.locator('input[type=file]'), 'images/sample.png');
    });
  });
});
`);
  assertNoCap();

  write(`import { test, expect } from '@/fixtures/base.fixture';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('Content', { tag: ['@file-content'] }, () => {
  test('case', async ({ page }) => {
    await test.step('step', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
`);
  assertHasCap('Capability rule (@file-content)');

  write(`import { test, expect } from '@/fixtures/base.fixture';
import { assertPdfContains } from '@/support/pw';
// spec: specs/__property_capability__-test-plan.md
// seed: src/tests/seed.spec.ts
test.describe('Content', { tag: ['@file-content'] }, () => {
  test('case', async () => {
    await test.step('step', async () => {
      await assertPdfContains('test-fixtures/pdf/sample-text.pdf', ['QA-KIT-SAMPLE-PDF']);
    });
  });
});
`);
  assertNoCap();

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

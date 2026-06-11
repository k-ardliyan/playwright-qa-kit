// Feature: playwright-ai-agent-framework, Property 10: Test Validator Structural Compliance

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

// process.cwd() selalu menunjuk ke root project saat dijalankan via tsx — aman dari mana pun
const propertyTestDir = path.resolve(process.cwd(), 'src/tests/__property_validator__');
const propertySpecFile = path.join(propertyTestDir, 'case.spec.ts');

function makeSpecContent(hasImport: boolean, hasDescribe: boolean, hasStep: boolean): string {
  const lines: string[] = [];

  if (hasImport) {
    lines.push("import { test, expect } from '@/fixtures/base.fixture';");
  } else {
    lines.push("import { test, expect } from '@playwright/test';");
  }

  if (hasImport && hasDescribe && hasStep) {
    lines.push('// spec: specs/__property_validator__-test-plan.md');
    lines.push('// seed: src/tests/seed.spec.ts');
  }

  lines.push('');

  if (hasDescribe) {
    lines.push("test.describe('Property Case', () => {");
    if (hasStep) {
      lines.push("  test('case should satisfy required structure', async () => {");
      lines.push("    await test.step('sample step', async () => {");
      lines.push('      expect(true).toBeTruthy();');
      lines.push('    });');
      lines.push('  });');
    } else {
      lines.push("  test('case without step', async () => {");
      lines.push('    expect(true).toBeTruthy();');
      lines.push('  });');
    }
    lines.push('});');
  } else {
    lines.push("test('case without describe', async () => {");
    if (hasStep) {
      lines.push("  await test.step('sample step', async () => {");
      lines.push('    expect(true).toBeTruthy();');
      lines.push('  });');
    } else {
      lines.push('  expect(true).toBeTruthy();');
    }
    lines.push('});');
  }

  return lines.join('\n') + '\n';
}

function runValidator(): { status: number; output: string } {
  const run = spawnSync('npx', ['tsx', 'validate-generated-tests.ts'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: true,
  });

  const status = run.status ?? 1;
  const output = `${run.stdout || ''}${run.stderr || ''}`;
  return { status, output };
}

function ensureCleanDir(): void {
  if (fs.existsSync(propertyTestDir)) {
    fs.rmSync(propertyTestDir, { recursive: true, force: true });
  }
  fs.mkdirSync(propertyTestDir, { recursive: true });
}

function cleanupDir(): void {
  if (fs.existsSync(propertyTestDir)) {
    fs.rmSync(propertyTestDir, { recursive: true, force: true });
  }
}

function assertExpectedViolations(
  output: string,
  hasImport: boolean,
  hasDescribe: boolean,
  hasStep: boolean,
): void {
  assert.match(output, /__property_validator__\/case\.spec\.ts:\d+/);

  if (!hasImport) {
    assert.match(output, /Import rule/);
  }

  if (!hasDescribe) {
    assert.match(output, /Describe rule/);
  }

  if (!hasStep) {
    assert.match(output, /Step rule/);
  }
}

function runProperty(): void {
  ensureCleanDir();

  fc.assert(
    fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (hasImport, hasDescribe, hasStep) => {
      fs.writeFileSync(propertySpecFile, makeSpecContent(hasImport, hasDescribe, hasStep), 'utf8');
      if (!fs.existsSync(propertySpecFile)) {
        console.error('File disappeared before spawn!');
      }

      const { status, output } = runValidator();
      const shouldPass = hasImport && hasDescribe && hasStep;

      if (shouldPass) {
        assert.equal(status, 0, `Expected validator to pass but failed.\nOutput:\n${output}`);
        assert.match(output, /All structural checks passed/);
      } else {
        assert.equal(status, 1, `Expected validator to fail but passed.\nOutput:\n${output}`);
        assertExpectedViolations(output, hasImport, hasDescribe, hasStep);
      }
    }),
    { numRuns: 16 },
  );

  cleanupDir();
  console.log('✓ Property 10 passed: validator structural compliance behaves correctly');
}

try {
  runProperty();
} finally {
  cleanupDir();
}

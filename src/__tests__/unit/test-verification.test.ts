import { test, expect } from '@playwright/test';
import { validateNoEphemeralRefs } from '../../../tools/mcp/src/tools/validate-generated-tests';

test.describe('Test Verification & Code Generation Guard (Phase 5)', () => {
  test('validateNoEphemeralRefs catches numeric refs and debug CLI handles', () => {
    const codeWithMcpRef = `
      await page.locator('button').click(); // ref: 124
    `;
    const v1 = validateNoEphemeralRefs(
      codeWithMcpRef,
      'tests/auth/login.spec.ts',
      'tests/auth/login.spec.ts',
    );
    expect(v1.length).toBeGreaterThan(0);
    expect(v1[0].ruleName).toContain('ephemeral MCP ref or CLI handle');

    const codeWithCliHandle = `
      await page.locator('tw-492a').click();
    `;
    const v2 = validateNoEphemeralRefs(
      codeWithCliHandle,
      'tests/auth/login.spec.ts',
      'tests/auth/login.spec.ts',
    );
    expect(v2.length).toBeGreaterThan(0);

    const codeWithDomElement = `
      await page.locator('.playwright-element-42').click();
    `;
    const v3 = validateNoEphemeralRefs(
      codeWithDomElement,
      'tests/auth/login.spec.ts',
      'tests/auth/login.spec.ts',
    );
    expect(v3.length).toBeGreaterThan(0);
  });

  test('validateNoEphemeralRefs allows clean semantic locators', () => {
    const cleanCode = `
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(page.getByText('Success')).toBeVisible();
    `;
    const v = validateNoEphemeralRefs(
      cleanCode,
      'tests/auth/login.spec.ts',
      'tests/auth/login.spec.ts',
    );
    expect(v.length).toBe(0);
  });
});

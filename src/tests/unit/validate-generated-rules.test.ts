import { test, expect } from '@playwright/test';
import {
  validateNoEphemeralRefs,
  validateNoHardcodedWaits,
} from '../../../mcp-server/src/tools/validate-generated-tests';

const SPEC = 'feature-fixtures.spec.ts'; // non-exempt relative path

test.describe('validate-generated-tests ref/wait rules (MCP-041/042)', () => {
  test('rejects persisted snapshot refs in the real MCP format (ref: <id>)', () => {
    const src = "await page.getByRole('button', { name: 'Save' }).click();\nconst r = { ref: 12 };";
    const violations = validateNoEphemeralRefs(src, 'x', SPEC);
    expect(violations.length).toBe(1);
    expect(violations[0].severity).toBe('error');
    expect(violations[0].ruleName).toContain('Ephemeral ref');
  });

  test('rejects JSON-serialized snapshot refs ("ref": <id>)', () => {
    const src = 'const snap = {"ref": 7, "role": "button"};';
    const violations = validateNoEphemeralRefs(src, 'x', SPEC);
    expect(violations.length).toBe(1);
  });

  test('does NOT flag a legitimate node_id= URL query parameter', () => {
    const src = "await page.goto('/admin/node?id=5&node_id=55');";
    const violations = validateNoEphemeralRefs(src, 'x', SPEC);
    expect(violations).toEqual([]);
  });

  test('does not flag semantic locator usage without refs', () => {
    const src = "await page.getByLabel('Email').fill('a@b.c');";
    expect(validateNoEphemeralRefs(src, 'x', SPEC)).toEqual([]);
  });

  test('warns on page.waitForTimeout but not on bare setTimeout utility code', () => {
    const src = 'await page.waitForTimeout(500);\nawait new Promise(r => setTimeout(r, 200));';
    const violations = validateNoHardcodedWaits(src, 'x', SPEC);
    expect(violations.length).toBe(1);
    expect(violations[0].severity).toBe('warning');
    expect(violations[0].ruleName).toContain('waitForTimeout');
  });

  test('does not warn on observable assertions', () => {
    const src = "await expect(page.getByText('Saved')).toBeVisible();";
    expect(validateNoHardcodedWaits(src, 'x', SPEC)).toEqual([]);
  });

  test('skips traceability-exempt files', () => {
    const src = 'await page.waitForTimeout(500); const r = { ref: 12 };';
    const violations = [
      ...validateNoEphemeralRefs(src, 'x', '__property_p/fixture.spec.ts'),
      ...validateNoHardcodedWaits(src, 'x', '__property_p/fixture.spec.ts'),
    ];
    expect(violations).toEqual([]);
  });
});

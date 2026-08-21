import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileRequirementFromText } from '../../../tools/mcp/src/tools/compile-requirement';

test.describe('Requirement Template v2 Parity & Contract Tests (Phase 2)', () => {
  const repoRoot = path.resolve(__dirname, '../../../');

  test('canonical _GOOD_EXAMPLE.md compiles cleanly to RequirementContractV1 with 0 errors/warnings', () => {
    const goodPath = path.join(repoRoot, 'requirements', '_GOOD_EXAMPLE.md');
    expect(fs.existsSync(goodPath)).toBe(true);

    const content = fs.readFileSync(goodPath, 'utf-8');
    const result = compileRequirementFromText(content, 'requirements/_GOOD_EXAMPLE.md');

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();

    const req = result.data!;
    expect(req.schemaVersion).toBe('qa.requirement/v1');
    expect(req.requirementId).toBe('REQ-AUTH-001');
    expect(req.title).toContain('Login');
    expect(req.module).toBe('auth');
    expect(req.feature).toBe('login-valid');
    expect(req.acceptanceCriteria.length).toBe(6);
    expect(req.acceptanceCriteria[0].id).toBe('AC-01');
    expect(req.scenarios.length).toBe(5);

    // Scenario 1
    expect(req.scenarios[0].covers).toContain('AC-01');
    expect(req.scenarios[0].covers).toContain('AC-02');
    expect(req.scenarios[0].testId).toBe('TC-AUTH-001');
    expect(req.scenarios[0].type).toBe('success');

    // Input provenance
    expect(req.scenarios[0].inputData.some((i) => i.source === 'credential')).toBe(true);

    // Diagnostics should be empty for canonical good example
    const errorsOrWarnings = (req.diagnostics ?? []).filter(
      (d) => d.severity === 'error' || d.severity === 'warning',
    );
    expect(errorsOrWarnings).toHaveLength(0);
  });

  test('canonical _BAD_EXAMPLE.md triggers predictable contract diagnostics', () => {
    const badPath = path.join(repoRoot, 'requirements', '_BAD_EXAMPLE.md');
    expect(fs.existsSync(badPath)).toBe(true);

    const content = fs.readFileSync(badPath, 'utf-8');
    const result = compileRequirementFromText(content, 'requirements/_BAD_EXAMPLE.md');

    expect(result.data).toBeDefined();
    const req = result.data!;
    expect(req.diagnostics).toBeDefined();
    expect(req.diagnostics!.length).toBeGreaterThan(0);

    const diagCodes = req.diagnostics!.map((d) => d.code);
    // Should flag missing AC IDs (REQ_LEGACY_AC_BULLET) or unknown AC ref (REQ_UNKNOWN_AC_REFERENCE)
    expect(
      diagCodes.some(
        (code) => code === 'REQ_LEGACY_AC_BULLET' || code === 'REQ_UNKNOWN_AC_REFERENCE',
      ),
    ).toBe(true);
  });
});

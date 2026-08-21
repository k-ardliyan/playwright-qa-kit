import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileRequirementFromText } from '../../../tools/mcp/src/tools/compile-requirement';

test.describe('compile_requirement Contract Compiler (Phase 3)', () => {
  const fixturesDir = path.resolve(__dirname, '../../../tests/fixtures/requirements');

  test('compiles minimal-public requirement fixture', () => {
    const text = fs.readFileSync(path.join(fixturesDir, 'minimal-public.md'), 'utf-8');
    const result = compileRequirementFromText(
      text,
      'tests/fixtures/requirements/minimal-public.md',
    );

    expect(result.schemaVersion).toBe('qa.mcp-result/v1');
    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.data?.requirementId).toBe('REQ-PUB-001');
    expect(result.data?.module).toBe('landing');
    expect(result.data?.feature).toBe('explore');
    expect(result.data?.auth.state).toBe('unauthenticated');
    expect(result.data?.acceptanceCriteria.length).toBe(2);
    expect(result.data?.acceptanceCriteria[0].id).toBe('AC-01');
    expect(result.data?.scenarios.length).toBe(1);
    expect(result.data?.scenarios[0].id).toBe('SC-01');
    expect(result.data?.scenarios[0].covers).toEqual(['AC-01']);
    expect(result.data?.scenarios[0].automation.automatable).toBe(true);
  });

  test('compiles auth-multi-role with access matrix and role scopes', () => {
    const text = fs.readFileSync(path.join(fixturesDir, 'auth-multi-role.md'), 'utf-8');
    const result = compileRequirementFromText(
      text,
      'tests/fixtures/requirements/auth-multi-role.md',
    );

    expect(result.status).toBe('success');
    expect(result.data?.roles).toContain('super-admin');
    expect(result.data?.roles).toContain('finance');
    expect(result.data?.roles).toContain('hrd');

    expect(result.data?.accessMatrix.length).toBe(3);
    const financeEntry = result.data?.accessMatrix.find((m) => m.role === 'finance');
    expect(financeEntry?.access).toBe('allow');

    const hrdEntry = result.data?.accessMatrix.find((m) => m.role === 'hrd');
    expect(hrdEntry?.access).toBe('deny');

    expect(result.data?.scenarios.length).toBe(2);
    expect(result.data?.scenarios[0].actor).toBe('finance');
    expect(result.data?.scenarios[0].type).toBe('success');
    expect(result.data?.scenarios[1].actor).toBe('hrd');
    expect(result.data?.scenarios[1].type).toBe('access-restriction');
  });

  test('compiles manual scenario with automatable: false', () => {
    const text = fs.readFileSync(path.join(fixturesDir, 'manual-scenario.md'), 'utf-8');
    const result = compileRequirementFromText(
      text,
      'tests/fixtures/requirements/manual-scenario.md',
    );

    expect(result.status).toBe('success');
    const manualScenario = result.data?.scenarios.find((s) => s.type === 'manual');
    expect(manualScenario).toBeDefined();
    expect(manualScenario?.automation.automatable).toBe(false);
    expect(manualScenario?.automation.reason).toContain('@manual');
  });

  test('parses input data provenance accurately', () => {
    const text = fs.readFileSync(path.join(fixturesDir, 'file-upload-download.md'), 'utf-8');
    const result = compileRequirementFromText(
      text,
      'tests/fixtures/requirements/file-upload-download.md',
    );

    expect(result.status).toBe('success');
    const sc = result.data?.scenarios[0];
    expect(sc).toBeDefined();
    const fixtureInput = sc?.inputData.find((i) => i.key === 'document');
    expect(fixtureInput?.source).toBe('fixture');
    expect(fixtureInput?.value).toBe('pdf/sample.pdf');
  });

  test('flags malformed requirement with diagnostic errors', () => {
    const text = fs.readFileSync(path.join(fixturesDir, 'malformed-requirement.md'), 'utf-8');
    const result = compileRequirementFromText(
      text,
      'tests/fixtures/requirements/malformed-requirement.md',
    );

    expect(result.status).toBe('error');
    const errorCodes = result.diagnostics.filter((d) => d.severity === 'error').map((d) => d.code);
    expect(errorCodes).toContain('REQ_EMPTY_SCENARIOS');
  });

  test('detects unknown AC reference in scenario', () => {
    const customReq = `
# REQ-TEST-001: Sample Test

## Metadata
- **Module:** test
- **Feature:** sample
- **Tags:** #ui
- **Auth state:** unauthenticated

## Kriteria Penerimaan
- **AC-01:** Valid item

### SC-01: First scenario (@success)
- **Covers:** \`AC-01\`, \`AC-99\`
- **Hasil yang Diharapkan:**
  - URL is /home
`;
    const result = compileRequirementFromText(customReq);
    expect(result.status).toBe('error');
    const unknownAc = result.diagnostics.find((d) => d.code === 'REQ_UNKNOWN_AC_REFERENCE');
    expect(unknownAc).toBeDefined();
    expect(unknownAc?.message).toContain('AC-99');
  });

  test('detects duplicate scenario IDs', () => {
    const duplicateReq = `
# REQ-TEST-002: Duplicate Test

## Metadata
- **Module:** test
- **Feature:** sample
- **Tags:** #ui
- **Auth state:** unauthenticated

## Kriteria Penerimaan
- **AC-01:** Valid item

### SC-01: First scenario (@success)
- **Covers:** \`AC-01\`
- **Hasil yang Diharapkan:**
  - URL is /home

### SC-01: Duplicate scenario (@success)
- **Covers:** \`AC-01\`
- **Hasil yang Diharapkan:**
  - URL is /home
`;
    const result = compileRequirementFromText(duplicateReq);
    expect(result.status).toBe('error');
    const dupDiag = result.diagnostics.find((d) => d.code === 'REQ_DUPLICATE_SCENARIO_ID');
    expect(dupDiag).toBeDefined();
  });
});

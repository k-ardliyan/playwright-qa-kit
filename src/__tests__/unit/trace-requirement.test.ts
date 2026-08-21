import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { traceRequirement } from '../../../tools/mcp/src/tools/trace-requirement';
import { extractTestMetadataFromSpec } from '../../../tools/mcp/src/utils/test-index';

test.describe('Traceability Contract & Test Index Linkage (Phase 6)', () => {
  const repoRoot = path.resolve(__dirname, '../../../');

  test('extractTestMetadataFromSpec parses metadata and test titles accurately', () => {
    const sampleSpec = `
import { test, expect } from './fixtures';
import { setTestMetadata } from '@/support/meta';

test.describe('Sample Feature', () => {
  test('SC-01: Login Success TC-AUTH-001', async ({ page }) => {
    setTestMetadata(test.info(), {
      scenarioId: 'SC-01',
      testId: 'TC-AUTH-001',
      module: 'auth',
      feature: 'login',
      actor: 'user',
      requirementPath: 'requirements/auth/login.md',
    });
    expect(true).toBe(true);
  });
});
`;

    const entries = extractTestMetadataFromSpec(sampleSpec, 'tests/auth/login.spec.ts');
    expect(entries).toHaveLength(1);
    expect(entries[0].scenarioId).toBe('SC-01');
    expect(entries[0].testId).toBe('TC-AUTH-001');
    expect(entries[0].module).toBe('auth');
    expect(entries[0].feature).toBe('login');
    expect(entries[0].actor).toBe('user');
    expect(entries[0].specFile).toBe('tests/auth/login.spec.ts');
  });

  test('trace_requirement builds complete TraceabilityContractV1 for sample-login-empty-fields.md', () => {
    const reqPath = 'requirements/auth/sample-login-empty-fields.md';
    const result = traceRequirement({ requirementPath: reqPath });

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();

    const trace = result.data!;
    expect(trace.schemaVersion).toBe('qa.traceability/v1');
    expect(trace.requirementId).toBe('REQ-AUTH-002');
    expect(trace.requirementTitle).toContain('Login');
    expect(trace.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(trace.scenarios.length).toBeGreaterThan(0);

    // Scenario 4 in sample is manual
    const sc4 = trace.scenarios.find((s) => s.scenarioId === 'SC-04');
    expect(sc4).toBeDefined();
    expect(sc4?.executionStatus).toBe('manual');

    // Metrics
    expect(trace.metrics.totalScenarios).toBeGreaterThan(0);
    expect(trace.metrics.manualScenarios).toBe(1);
    // GAP 4: healedScenarios must be present in contract (defaults to 0 at trace time)
    expect(typeof trace.metrics.healedScenarios).toBe('number');
  });

  test('trace_requirement supports raw requirementsText', () => {
    const goodPath = path.join(repoRoot, 'requirements', '_GOOD_EXAMPLE.md');
    const content = fs.readFileSync(goodPath, 'utf-8');
    const result = traceRequirement({
      requirementPath: 'requirements/auth/login-valid.md',
      requirementsText: content,
    });

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    const trace = result.data!;
    expect(trace.requirementId).toBe('REQ-AUTH-001');
    expect(trace.acceptanceCriteria.length).toBe(6);
    expect(trace.scenarios.length).toBe(5);
  });
});

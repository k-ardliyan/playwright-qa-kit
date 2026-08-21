import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateTestPlan } from '../../../tools/mcp/src/tools/validate-plan';
import {
  REQUIREMENT_SCHEMA_V1,
  TEST_PLAN_SCHEMA_V1,
  TRACEABILITY_SCHEMA_V1,
  type RequirementContractV1,
  type TestPlanContractV1,
  type TraceabilityContractV1,
} from '../../../tools/mcp/src/contracts';

test.describe('Golden Contract CI Offline Test Suite (Phase 11)', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const fixturesDir = path.join(repoRoot, 'tools', 'mcp', 'src', '__tests__', 'fixtures');

  test('validates all 6 baseline requirement contract fixtures', () => {
    const reqFiles = [
      'req-public-v1.json',
      'req-single-role-v1.json',
      'req-multi-role-v1.json',
      'req-access-matrix-v1.json',
      'req-manual-v1.json',
      'req-legacy-v1.json',
    ];

    for (const file of reqFiles) {
      const p = path.join(fixturesDir, 'requirements', file);
      expect(fs.existsSync(p), `Fixture ${file} must exist`).toBe(true);

      const content = JSON.parse(fs.readFileSync(p, 'utf-8')) as RequirementContractV1;
      expect(content.schemaVersion).toBe(REQUIREMENT_SCHEMA_V1);
      expect(content.requirementId).toBeDefined();
      expect(content.title).toBeDefined();
      expect(content.sourceHash).toBeDefined();
      expect(content.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(content.scenarios.length).toBeGreaterThan(0);
    }
  });

  test('validates baseline test plan contract against multi-role requirement contract', () => {
    const planFile = path.join(fixturesDir, 'plans', 'plan-valid-v1.json');
    const reqFile = path.join(fixturesDir, 'requirements', 'req-multi-role-v1.json');

    expect(fs.existsSync(planFile)).toBe(true);
    expect(fs.existsSync(reqFile)).toBe(true);

    const plan = JSON.parse(fs.readFileSync(planFile, 'utf-8')) as TestPlanContractV1;
    const req = JSON.parse(fs.readFileSync(reqFile, 'utf-8')) as RequirementContractV1;

    expect(plan.schemaVersion).toBe(TEST_PLAN_SCHEMA_V1);
    const valResult = validateTestPlan(plan, req);
    expect(valResult.data?.valid).toBe(true);
  });

  test('validates baseline traceability contract structure', () => {
    const traceFile = path.join(fixturesDir, 'traceability', 'trace-baseline-v1.json');
    expect(fs.existsSync(traceFile)).toBe(true);

    const trace = JSON.parse(fs.readFileSync(traceFile, 'utf-8')) as TraceabilityContractV1;
    expect(trace.schemaVersion).toBe(TRACEABILITY_SCHEMA_V1);
    expect(trace.requirementId).toBe('REQ-INVOICE-001');
    expect(trace.acceptanceCriteria.length).toBe(2);
    expect(trace.scenarios.length).toBe(2);
    expect(trace.metrics.totalAcs).toBe(2);
    expect(trace.metrics.totalScenarios).toBe(2);
  });
});

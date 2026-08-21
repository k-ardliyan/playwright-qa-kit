import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileTestPlanFromText } from '../../../tools/mcp/src/tools/compile-test-plan';

test.describe('Test Plan Markdown Compiler (Phase 3)', () => {
  const repoRoot = path.resolve(__dirname, '../../../');

  test('compiles specs/_GOOD_EXAMPLE.md cleanly into TestPlanContractV1', () => {
    const goodPlanPath = path.join(repoRoot, 'specs', '_GOOD_EXAMPLE.md');
    expect(fs.existsSync(goodPlanPath)).toBe(true);

    const content = fs.readFileSync(goodPlanPath, 'utf-8');
    const result = compileTestPlanFromText(content, 'specs/_GOOD_EXAMPLE.md');

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();

    const plan = result.data!;
    expect(plan.schemaVersion).toBe('qa.test-plan/v1');
    expect(plan.sourceRequirementPath).toBe('requirements/_GOOD_EXAMPLE.md');
    expect(plan.module).toBe('auth');
    expect(plan.feature).toBe('login-valid');
    expect(plan.scenarios.length).toBe(5);

    // Scenario 1 verification
    const sc1 = plan.scenarios[0];
    expect(sc1.scenarioId).toBe('SC-01');
    expect(sc1.testId).toBe('TC-AUTH-001');
    expect(sc1.covers).toContain('AC-01');
    expect(sc1.covers).toContain('AC-02');
    expect(sc1.actor).toBe('user');
    expect(sc1.authContext).toBe('user');
    expect(sc1.executionMode).toBe('automated');
    expect(sc1.actions.length).toBeGreaterThan(0);
    expect(sc1.assertions.length).toBeGreaterThan(0);

    // Provenance verification
    const reqAssertions = sc1.assertions.filter((a) => a.provenance === 'requirement');
    expect(reqAssertions.length).toBeGreaterThan(0);

    // Scenario 5 manual mode
    const sc5 = plan.scenarios[4];
    expect(sc5.executionMode).toBe('manual');

    // No error diagnostics
    const errors = (plan.diagnostics ?? []).filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  test('rejects ephemeral browser references with PLAN_EPHEMERAL_REF diagnostic', () => {
    const badPlanPath = path.join(repoRoot, 'specs', '_BAD_EXAMPLE.md');
    expect(fs.existsSync(badPlanPath)).toBe(true);

    const content = fs.readFileSync(badPlanPath, 'utf-8');
    const result = compileTestPlanFromText(content, 'specs/_BAD_EXAMPLE.md');

    expect(result.status).toBe('error');
    expect(result.data).toBeDefined();

    const plan = result.data!;
    const ephemeralErrors = (plan.diagnostics ?? []).filter((d) => d.code === 'PLAN_EPHEMERAL_REF');
    expect(ephemeralErrors.length).toBeGreaterThan(0);
    expect(ephemeralErrors[0].message).toContain('ref:tw-8f2a');
  });

  test('correctly parses coverage gaps and catalog evidence', () => {
    const markdown = `# PLAN-GAP: Test Plan

## Metadata
- **Source requirement:** \`requirements/sample.md\`

## Catalog Evidence
- **Page:** \`invoice-list\` | \`artifacts/selector-catalog/finance/invoice-list.json\`

## Scenarios
### SC-01: Sample Scenario (@automated)
- **Test ID:** \`TC-001\`
- **Covers:** \`AC-01\`
**Actions:**
- Click button
**Assertions:**
- [requirement] Status is active

## Coverage Gaps
- **Scenario:** \`SC-02\` | **AC:** \`AC-02\` | **Reason:** Third party payment provider
`;

    const result = compileTestPlanFromText(markdown, 'specs/sample.plan.md');
    expect(result.status).toBe('success');
    const plan = result.data!;

    expect(plan.catalogEvidence).toHaveLength(1);
    expect(plan.catalogEvidence[0].page).toBe('invoice-list');

    expect(plan.coverageGaps).toHaveLength(1);
    expect(plan.coverageGaps[0].scenarioId).toBe('SC-02');
    expect(plan.coverageGaps[0].acceptanceCriterionId).toBe('AC-02');
    expect(plan.coverageGaps[0].reason).toContain('Third party payment');
  });
});

import { test, expect } from '@playwright/test';
import { listRequirementStatus } from '../../../tools/mcp/src/tools/list-requirement-status';

test.describe('Coverage State Model & 4-Dimensional Breakdown (Phase 7)', () => {
  test('list_requirement_status returns typed 4-dimensional coverageState for all requirements', () => {
    const result = listRequirementStatus();
    expect(result.status).toBe('success');
    expect(result.requirements.length).toBeGreaterThan(0);

    for (const row of result.requirements) {
      expect(row.coverageState).toBeDefined();
      expect(['planned', 'unplanned']).toContain(row.coverageState.design);
      expect(['automated', 'manual', 'mixed', 'unautomated']).toContain(
        row.coverageState.automation,
      );
      expect(['executed', 'not-executed']).toContain(row.coverageState.execution);
      expect(['passed', 'failed', 'healed', 'unverified']).toContain(
        row.coverageState.verification,
      );

      // Invariant: if hasPlan is true, design must be planned
      if (row.hasPlan) {
        expect(row.coverageState.design).toBe('planned');
      } else {
        expect(row.coverageState.design).toBe('unplanned');
      }

      // Invariant: if hasTests is true, automation must be automated or mixed
      if (row.hasTests) {
        expect(['automated', 'mixed']).toContain(row.coverageState.automation);
      }
    }
  });
});

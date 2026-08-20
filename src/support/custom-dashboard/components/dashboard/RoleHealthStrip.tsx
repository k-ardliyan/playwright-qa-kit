/** @jsxImportSource @kitajs/html */
import type { CollectedTestData, TestSummary } from '../../types';

export interface RoleHealthStripProps {
  summary: TestSummary;
  collectedTests: CollectedTestData[];
}

export function RoleHealthStrip({ summary, collectedTests }: RoleHealthStripProps) {
  if (summary?.reportMode !== 'role-aware' || !summary?.rolesInScope?.length) {
    return null;
  }

  const testsList = Array.isArray(collectedTests) ? collectedTests : [];

  return (
    <section class="role-health" aria-label="Pass rate by role">
      {summary.rolesInScope.map((role) => {
        const tests = testsList.filter((t) => (t.role || '') === role);
        const total = tests.length;
        const passed = tests.filter((t) => t.status === 'passed').length;
        const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
        const tone = rate >= 90 ? 'good' : rate >= 70 ? 'warn' : 'bad';

        return (
          <div class={`role-health__chip role-health__chip--${tone}`} title={role}>
            <strong safe>{role}</strong>
            <span>
              {passed}/{total}
            </span>
            <span class="role-health__rate">{rate}%</span>
          </div>
        );
      })}
    </section>
  );
}

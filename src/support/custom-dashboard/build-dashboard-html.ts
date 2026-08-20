import type { ReportHistoryEntry } from '../../agents/reporter/report-history';
import { Dashboard } from './components/dashboard/Dashboard';
import type { CollectedTestData, TestSummary } from './types';

export interface DashboardOptions {
  /** Whether a latest test run exists (for Save to History banner). */
  hasLatestRun?: boolean;
  /** Whether the latest run has already been archived by QA. */
  latestRunArchived?: boolean;
  /**
   * When true, the dashboard is served via dashboard-server.ts (localhost).
   * Buttons call fetch() API instead of copying CLI commands.
   * Default: false (static HTML mode).
   */
  serveMode?: boolean;
}

/**
 * Shared dashboard HTML builder used by both buildCiHtml and buildLocalHtml.
 * Powered by KitaJS TSX component tree.
 */
export function buildDashboardHtml(
  mode: 'ci' | 'local',
  summary: TestSummary,
  collectedTests: CollectedTestData[],
  history?: ReportHistoryEntry[],
  options?: DashboardOptions,
): string {
  return String(
    Dashboard({
      mode,
      summary,
      collectedTests,
      history,
      options,
    }),
  );
}

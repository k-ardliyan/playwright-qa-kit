import { buildDashboardHtml } from './build-dashboard-html';
import type { CollectedTestData, TestSummary } from './types';

export function buildLocalHtml(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  return buildDashboardHtml('local', summary, collectedTests);
}

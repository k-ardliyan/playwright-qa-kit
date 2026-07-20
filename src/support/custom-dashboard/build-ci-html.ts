import { buildDashboardHtml } from './build-dashboard-html';
import type { CollectedTestData, TestSummary } from './types';

export function buildCiHtml(summary: TestSummary, collectedTests: CollectedTestData[]): string {
  return buildDashboardHtml('ci', summary, collectedTests);
}

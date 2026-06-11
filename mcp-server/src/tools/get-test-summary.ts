import * as fs from 'node:fs';
import * as path from 'node:path';
import { getRepoRoot } from '../utils/safety';
import { readTextFile } from '../utils/file-reader';
import { safeJsonParse } from '../utils/json-parser';

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  timestamp: string;
}

export interface GetTestSummaryOutput {
  status: 'success' | 'no_results' | 'error';
  summary?: TestSummary;
  message: string;
}

const SUMMARY_PATH = 'reports/test-summary.json';

export function getTestSummary(): GetTestSummaryOutput {
  const absolutePath = path.join(getRepoRoot(), SUMMARY_PATH);

  if (!fs.existsSync(absolutePath)) {
    return {
      status: 'no_results',
      message: `${SUMMARY_PATH} not found. Run tests first to generate the custom reporter summary.`,
    };
  }

  try {
    const raw = readTextFile(absolutePath);
    const parsed = safeJsonParse<TestSummary>(raw);
    if (!parsed.ok) {
      return { status: 'error', message: parsed.error.message };
    }

    const summary = parsed.data;
    if (
      typeof summary.total !== 'number' ||
      typeof summary.passed !== 'number' ||
      typeof summary.failed !== 'number'
    ) {
      return {
        status: 'error',
        message: 'test-summary.json is missing required numeric fields.',
      };
    }

    return {
      status: 'success',
      summary,
      message: `Summary: ${summary.passed}/${summary.total} passed (${summary.passRate}% pass rate).`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error reading test summary';
    return { status: 'error', message };
  }
}

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
  // === Table View extensions (populated by custom reporter) ===
  /** 'general' = no role scope; 'role-aware' = tests grouped by role */
  reportMode?: 'general' | 'role-aware';
  /** Roles found in scope across all collected tests */
  rolesInScope?: string[];
  /** Full per-test case data for Reporter Agent and pipeline report */
  testCases?: CollectedTestCase[];
}

/** Flat per-test-case record written to test-summary.json by custom reporter */
export interface CollectedTestCase {
  testId: string;
  scenarioId: string;
  title: string;
  role: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  duration: number;
  inputData: Record<string, string>;
  expectedResult: string;
  actualResult: string;
  affectedLayer: Array<'FE' | 'BE' | 'DB' | 'API'>;
  attachmentCount: number;
  hasTrace: boolean;
}

export interface RoleSummary {
  passing: number;
  failing: number;
  skipped: number;
}

export interface FeatureSummary {
  passing: number;
  failing: number;
}

export interface GetTestSummaryOutput {
  status: 'success' | 'no_results' | 'error';
  summary?: TestSummary;
  /** Per-role breakdown — only present when test files follow *-<role>.spec.ts naming */
  byRole?: Record<string, RoleSummary>;
  /** Per-feature breakdown — grouped by feature name prefix in spec file names */
  byFeature?: Record<string, FeatureSummary>;
  /** Full per-test-case data from custom reporter — only present when reportMode is set */
  testCases?: CollectedTestCase[];
  /** Report mode from custom reporter — 'general' or 'role-aware' */
  reportMode?: 'general' | 'role-aware';
  /** Roles in scope from custom reporter */
  rolesInScope?: string[];
  message: string;
}

const SUMMARY_PATH = 'reports/test-summary.json';
const RESULTS_DIR = 'test-results';

/**
 * Derive role from a spec file name like "invoice-finance.spec.ts" → "finance"
 * or "login-super-admin.spec.ts" → "super-admin".
 * Returns null if no role pattern detected.
 */
function extractRoleFromFilename(filename: string): string | null {
  // Match pattern: <feature>-<role>.spec.ts where role is a known business role
  const knownRoles = ['super-admin', 'finance', 'hrd', 'admin', 'user'];
  const base = path.basename(filename, '.spec.ts');
  for (const role of knownRoles) {
    if (base.endsWith(`-${role}`)) return role;
  }
  // Also check @role-<rolename> annotation pattern via test result annotations if available
  return null;
}

/**
 * Derive feature name from a spec file name like "invoice-finance.spec.ts" → "invoice"
 * or "login-empty-fields.spec.ts" → "login".
 */
function extractFeatureFromFilename(filename: string): string {
  const base = path.basename(filename, '.spec.ts');
  const knownRoles = ['super-admin', 'finance', 'hrd', 'admin', 'user'];
  let feature = base;
  for (const role of knownRoles) {
    if (feature.endsWith(`-${role}`)) {
      feature = feature.slice(0, feature.length - role.length - 1);
      break;
    }
  }
  // Take the first segment as the feature name
  return feature.split('-')[0] ?? feature;
}

/**
 * Attempt to build byRole and byFeature breakdowns from test result JSON files.
 * Returns empty objects if no result files are found.
 */
function buildBreakdowns(repoRoot: string): {
  byRole: Record<string, RoleSummary>;
  byFeature: Record<string, FeatureSummary>;
} {
  const byRole: Record<string, RoleSummary> = {};
  const byFeature: Record<string, FeatureSummary> = {};
  const resultsDir = path.join(repoRoot, RESULTS_DIR);

  if (!fs.existsSync(resultsDir)) return { byRole, byFeature };

  // Walk test-results directories looking for results.json files
  try {
    const entries = fs.readdirSync(resultsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const resultFile = path.join(resultsDir, entry.name, 'results.json');
      if (!fs.existsSync(resultFile)) continue;

      const raw = readTextFile(resultFile);
      const parsed = safeJsonParse<{
        file?: string;
        stats?: { expected?: number; unexpected?: number; skipped?: number };
      }>(raw);
      if (!parsed.ok) continue;

      const file = parsed.data.file ?? entry.name;
      const stats = parsed.data.stats ?? {};
      const passing = stats.expected ?? 0;
      const failing = stats.unexpected ?? 0;
      const skipped = stats.skipped ?? 0;

      const role = extractRoleFromFilename(file);
      if (role) {
        if (!byRole[role]) byRole[role] = { passing: 0, failing: 0, skipped: 0 };
        byRole[role].passing += passing;
        byRole[role].failing += failing;
        byRole[role].skipped += skipped;
      }

      const feature = extractFeatureFromFilename(file);
      if (!byFeature[feature]) byFeature[feature] = { passing: 0, failing: 0 };
      byFeature[feature].passing += passing;
      byFeature[feature].failing += failing;
    }
  } catch {
    // Non-fatal — breakdowns are best-effort
  }

  return { byRole, byFeature };
}

export function getTestSummary(): GetTestSummaryOutput {
  const repoRoot = getRepoRoot();
  const absolutePath = path.join(repoRoot, SUMMARY_PATH);

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
      typeof summary.failed !== 'number' ||
      typeof summary.skipped !== 'number' ||
      typeof summary.passRate !== 'number' ||
      typeof summary.timestamp !== 'string'
    ) {
      return {
        status: 'error',
        message:
          'test-summary.json is missing required fields: total, passed, failed, skipped, passRate, timestamp.',
      };
    }

    const timestampMs = Date.parse(summary.timestamp);
    if (Number.isNaN(timestampMs)) {
      return { status: 'error', message: 'test-summary.json has an invalid timestamp.' };
    }

    const mtime = fs.statSync(absolutePath).mtime.toISOString();
    const { byRole, byFeature } = buildBreakdowns(repoRoot);

    const result: GetTestSummaryOutput = {
      status: 'success',
      summary,
      message: `Summary: ${summary.passed}/${summary.total} passed (${summary.passRate}% pass rate, timestamp ${summary.timestamp}, file modified ${mtime}).`,
    };

    if (Object.keys(byRole).length > 0) result.byRole = byRole;
    if (Object.keys(byFeature).length > 0) result.byFeature = byFeature;

    // Expose table-view extensions from custom reporter if present
    if (summary.reportMode) result.reportMode = summary.reportMode;
    if (summary.rolesInScope && summary.rolesInScope.length > 0) {
      result.rolesInScope = summary.rolesInScope;
    }
    if (Array.isArray(summary.testCases) && summary.testCases.length > 0) {
      result.testCases = summary.testCases;
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error reading test summary';
    return { status: 'error', message };
  }
}

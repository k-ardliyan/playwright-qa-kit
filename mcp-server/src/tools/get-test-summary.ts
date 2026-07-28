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
  /** Safe run context from custom reporter (no secrets) */
  runMeta?: RunMeta;
}

/** Suggested / annotated root cause class for QA exit decisions. */
export type FailureSource = 'app' | 'test' | 'requirement' | 'env' | 'ai_generation' | 'unknown';

/** Safe run context — never embed secrets. */
export interface RunMeta {
  appEnv: string;
  runId?: string;
  requirementPath?: string;
  ci: boolean;
  totalDurationMs: number;
  generatedAt: string;
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
  /** Present on unhealthy tests when custom reporter ran */
  failureSource?: FailureSource;
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

/** Per-module test result breakdown — Opsi B: module contains nested features. */
export interface ModuleSummary {
  passing: number;
  failing: number;
  features: Record<string, FeatureSummary>;
}

export interface GetTestSummaryOutput {
  status: 'success' | 'no_results' | 'error';
  summary?: TestSummary;
  /** Per-role breakdown — only present when test files follow *-<role>.spec.ts naming */
  byRole?: Record<string, RoleSummary>;
  /** Per-module breakdown — derived from module field in test-summary.json or requirement folder */
  byModule?: Record<string, ModuleSummary>;
  /** Full per-test-case data from custom reporter — only present when reportMode is set */
  testCases?: CollectedTestCase[];
  /** Report mode from custom reporter — 'general' or 'role-aware' */
  reportMode?: 'general' | 'role-aware';
  /** Roles in scope from custom reporter */
  rolesInScope?: string[];
  /** Safe run context from custom reporter when present */
  runMeta?: RunMeta;
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
 * Attempt to build byRole and byModule breakdowns from test-summary.json testCases.
 * byRole: from role field on each test case.
 * byModule: from module field on each test case (set by custom reporter via annotation).
 * Falls back to test-results/ directory scan for byRole only if testCases not present.
 */
function buildBreakdowns(repoRoot: string): {
  byRole: Record<string, RoleSummary>;
  byModule: Record<string, ModuleSummary>;
} {
  const byRole: Record<string, RoleSummary> = {};
  const byModule: Record<string, ModuleSummary> = {};

  // Primary: read from test-summary.json testCases (most accurate)
  const summaryPath = path.join(repoRoot, SUMMARY_PATH);
  if (fs.existsSync(summaryPath)) {
    try {
      const raw = readTextFile(summaryPath);
      const parsed = safeJsonParse<{
        testCases?: Array<{
          role?: string;
          module?: string;
          feature?: string;
          status?: string;
        }>;
      }>(raw);
      if (parsed.ok && Array.isArray(parsed.data.testCases)) {
        for (const tc of parsed.data.testCases) {
          const status = tc.status ?? 'unknown';
          const passing = status === 'passed' ? 1 : 0;
          const failing = status === 'failed' || status === 'timedOut' ? 1 : 0;
          const skipped = status === 'skipped' ? 1 : 0;

          // byRole
          const role = tc.role;
          if (role) {
            if (!byRole[role]) byRole[role] = { passing: 0, failing: 0, skipped: 0 };
            byRole[role].passing += passing;
            byRole[role].failing += failing;
            byRole[role].skipped += skipped;
          }

          // byModule (Opsi B: nested features)
          const mod = tc.module ?? '-';
          const feat = tc.feature ?? '-';
          if (!byModule[mod]) byModule[mod] = { passing: 0, failing: 0, features: {} };
          byModule[mod].passing += passing;
          byModule[mod].failing += failing;
          if (!byModule[mod].features[feat])
            byModule[mod].features[feat] = { passing: 0, failing: 0 };
          byModule[mod].features[feat].passing += passing;
          byModule[mod].features[feat].failing += failing;
        }
        return { byRole, byModule };
      }
    } catch {
      // Fall through to legacy scan
    }
  }

  // Legacy fallback: scan test-results/ for byRole only (no module data available)
  const resultsDir = path.join(repoRoot, RESULTS_DIR);
  if (!fs.existsSync(resultsDir)) return { byRole, byModule };

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
    }
  } catch {
    // Non-fatal — breakdowns are best-effort
  }

  return { byRole, byModule };
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
    const { byRole, byModule } = buildBreakdowns(repoRoot);

    const result: GetTestSummaryOutput = {
      status: 'success',
      summary,
      message: `Summary: ${summary.passed}/${summary.total} passed (${summary.passRate}% pass rate, timestamp ${summary.timestamp}, file modified ${mtime}).`,
    };

    if (Object.keys(byRole).length > 0) result.byRole = byRole;
    if (Object.keys(byModule).length > 0) result.byModule = byModule;

    // Expose table-view extensions from custom reporter if present
    if (summary.reportMode) result.reportMode = summary.reportMode;
    if (summary.rolesInScope && summary.rolesInScope.length > 0) {
      result.rolesInScope = summary.rolesInScope;
    }
    if (Array.isArray(summary.testCases) && summary.testCases.length > 0) {
      result.testCases = summary.testCases;
    }
    if (summary.runMeta && typeof summary.runMeta === 'object') {
      result.runMeta = summary.runMeta;
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error reading test summary';
    return { status: 'error', message };
  }
}

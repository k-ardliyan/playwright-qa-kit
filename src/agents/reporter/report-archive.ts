/**
 * Structured Report Archive — Opt-in, QA-validated history.
 *
 * Archive is NOT automatic. QA must explicitly save a run via:
 *   - Dashboard "Save to History" button
 *   - CLI: `npm run archive:save`
 *
 * Storage per run:
 *   reports/archive/<runId>/summary.json   — copy of test-summary.json
 *   reports/archive/<runId>/metadata.json  — QA decision, notes, timestamps
 *
 * @module src/agents/reporter/report-archive
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Types ───────────────────────────────────────────────────────────────────

/** QA decision options when saving a run. */
export type QaDecision =
  'APPROVE' | 'FILE_BUG' | 'REVISE_REQUIREMENT' | 'FIX_TEST' | 'FIX_ENV' | 'MARK_BLOCKED';

/** Who triggered the save. */
export type TriggerSource = 'cli' | 'dashboard-button';

/** Metadata written alongside the test summary when QA saves a run. */
export interface ArchiveMetadata {
  runId: string;
  /** When the run was saved to archive (ISO 8601 with ms). */
  savedAt: string;
  /** When the test was actually executed (ISO 8601 with ms). */
  ranAt: string;
  /** Test run duration in milliseconds. */
  durationMs?: number;
  /** Target environment (dev, staging, etc.). */
  appEnv: string;
  /** Base URL tested against. */
  baseUrl?: string;
  /** Requirement file path, if pipeline run. */
  requirementPath?: string;
  /** Report mode: 'general' | 'role-aware'. */
  reportMode?: string;
  /** QA decision — mandatory when saving. */
  qaDecision: QaDecision;
  /** QA free-text notes. */
  qaNotes: string;
  /** How the save was triggered. */
  triggeredBy: 'manual' | 'dashboard';
  /** Where the save was triggered from. */
  triggerSource: TriggerSource;
}

/** Legacy archived report (backward compat for pre-refactor archives). */
export interface ArchivedReportLegacy {
  runId: string;
  timestamp: string;
  requirementPath: string;
  appEnv: string;
  summary: {
    scenariosPlanned: number;
    testsGenerated: number;
    testsPassing: number;
    testsFailing: number;
    testsHealed: number;
    testsSkipped: number;
    passRate: number;
  };
  summaryByRole?: Record<string, { passing: number; failing: number; skipped: number }>;
  summaryByModule?: Record<
    string,
    { features: Record<string, { passing: number; failing: number; skipped: number }> }
  >;
  scenarios: ArchivedScenario[];
  unresolvedFailures: ArchivedUnresolvedFailure[];
  qaDecision?: string;
}

export interface ArchivedScenario {
  scenarioId: string;
  name: string;
  status: 'passed' | 'failed' | 'healed' | 'skipped' | 'not-generated';
  role?: string;
  module?: string;
  feature?: string;
  duration?: number;
  failureSource?: string;
  errorMessage?: string;
}

export interface ArchivedUnresolvedFailure {
  scenarioId: string;
  stage: string;
  errorMessage: string;
  failureSource: string;
  tracePath?: string;
  screenshotPath?: string;
}

/** Result of a successful save. */
export interface ArchiveSaveResult {
  runId: string;
  archivePath: string;
  summaryPath: string;
  metadataPath: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ARCHIVE_DIR = path.resolve('reports', 'archive');
const REPORT_DIR = path.resolve('reports');
const SUMMARY_PATH = path.join(REPORT_DIR, 'test-summary.json');
const LATEST_RUN_PATH = path.join(REPORT_DIR, '.latest-run');

// ─── Run ID generation ──────────────────────────────────────────────────────

/**
 * Generate a human-readable runId from a timestamp.
 * Format: `run-YYYYMMDD-HHmmss-SSS`
 */
export function generateRunId(isoTimestamp?: string): string {
  const d = isoTimestamp ? new Date(isoTimestamp) : new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `run-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${pad(d.getMilliseconds(), 3)}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Save the latest test run to the archive.
 *
 * Reads `reports/test-summary.json` + `reports/.latest-run`,
 * copies the summary, and writes enriched metadata.
 *
 * Returns the save result or throws on validation failure.
 */
export function saveLatestRun(options: {
  qaDecision: QaDecision;
  qaNotes?: string;
  triggerSource: TriggerSource;
}): ArchiveSaveResult {
  const { qaDecision, qaNotes = '', triggerSource } = options;

  // 1. Validate test-summary.json exists
  if (!fs.existsSync(SUMMARY_PATH)) {
    throw new Error('No test-summary.json found. Run tests first before saving.');
  }

  // 2. Read test-summary.json
  let summary: Record<string, unknown>;
  try {
    summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
  } catch {
    throw new Error('Failed to parse test-summary.json. File may be corrupted.');
  }

  // 3. Read .latest-run marker for metadata
  let latestRun: Record<string, unknown> = {};
  if (fs.existsSync(LATEST_RUN_PATH)) {
    try {
      latestRun = JSON.parse(fs.readFileSync(LATEST_RUN_PATH, 'utf-8'));
    } catch {
      // Warn — corrupt marker means reportMode and appEnv fall back to defaults
      process.stderr.write(
        `[archive] Warning: .latest-run marker is corrupt or unreadable — ` +
          `reportMode and appEnv will use fallback values. ` +
          `Delete reports/.latest-run and re-run tests to reset.\n`,
      );
    }
  }

  // 4. Generate runId from ranAt timestamp
  const ranAt =
    (summary.timestamp as string) || (latestRun.timestamp as string) || new Date().toISOString();
  const runId = generateRunId(ranAt);

  // 5. Validate runId doesn't already exist
  const runDir = path.join(ARCHIVE_DIR, runId);
  if (fs.existsSync(runDir)) {
    throw new Error(`Archive for run ${runId} already exists. Will not overwrite.`);
  }

  // 6. Create archive directory
  fs.mkdirSync(runDir, { recursive: true });

  // 7. Write summary.json (copy from test-summary.json)
  const archiveSummaryPath = path.join(runDir, 'summary.json');
  fs.writeFileSync(archiveSummaryPath, JSON.stringify(summary, null, 2), 'utf-8');

  // 8. Write metadata.json
  const metadata: ArchiveMetadata = {
    runId,
    savedAt: new Date().toISOString(),
    ranAt,
    appEnv: (process.env.APP_ENV as string) || (latestRun.appEnv as string) || 'local',
    baseUrl: process.env.BASE_URL,
    requirementPath: (summary.requirementPath as string) || '',
    reportMode: (summary.reportMode as string) || (latestRun.reportMode as string) || 'general',
    qaDecision,
    qaNotes,
    triggeredBy: 'manual',
    triggerSource,
  };
  const metadataPath = path.join(runDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  return {
    runId,
    archivePath: runDir,
    summaryPath: archiveSummaryPath,
    metadataPath,
  };
}

/**
 * Load an archived run's summary by runId.
 * Returns null if the run does not exist.
 */
export function loadArchivedSummary(runId: string): Record<string, unknown> | null {
  const summaryPath = path.join(ARCHIVE_DIR, runId, 'summary.json');
  if (!fs.existsSync(summaryPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Load an archived run's metadata by runId.
 * Returns null if the metadata does not exist.
 */
export function loadArchivedMetadata(runId: string): ArchiveMetadata | null {
  const metadataPath = path.join(ARCHIVE_DIR, runId, 'metadata.json');
  if (!fs.existsSync(metadataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as ArchiveMetadata;
  } catch {
    return null;
  }
}

/**
 * Load a legacy archived report (pre-refactor format).
 * Reads from `report.json` if `summary.json` doesn't exist.
 */
export function loadArchivedReport(runId: string): ArchivedReportLegacy | null {
  // Try new format first
  const summary = loadArchivedSummary(runId);
  if (summary) {
    const metadata = loadArchivedMetadata(runId);
    // Convert new format to legacy interface for backward compat
    const tc = (summary.testCases ?? []) as Array<Record<string, unknown>>;
    const uf = (summary.unresolvedFailures ?? []) as ArchivedUnresolvedFailure[];
    return {
      runId,
      timestamp: metadata?.ranAt ?? (summary.timestamp as string) ?? '',
      requirementPath: metadata?.requirementPath ?? '',
      appEnv: metadata?.appEnv ?? 'local',
      summary: {
        scenariosPlanned: 0,
        testsGenerated: (summary.total as number) ?? 0,
        testsPassing: (summary.passed as number) ?? 0,
        testsFailing: (summary.failed as number) ?? 0,
        testsHealed: 0,
        testsSkipped: (summary.skipped as number) ?? 0,
        passRate: (summary.passRate as number) ?? 0,
      },
      summaryByRole: summary.summaryByRole as ArchivedReportLegacy['summaryByRole'],
      summaryByModule: summary.summaryByModule as ArchivedReportLegacy['summaryByModule'],
      scenarios: tc.map((t) => ({
        scenarioId: (t.testId as string) ?? '',
        name: (t.title as string) ?? '',
        status: (['passed', 'failed', 'skipped'].includes(t.status as string)
          ? t.status
          : 'skipped') as ArchivedScenario['status'],
        role: t.role as string | undefined,
        module: t.module as string | undefined,
        feature: t.feature as string | undefined,
        failureSource: t.failureSource as string | undefined,
        errorMessage: t.errorMessage as string | undefined,
      })),
      unresolvedFailures: uf,
      qaDecision: metadata?.qaDecision,
    };
  }

  // Fallback: legacy format (report.json)
  const legacyPath = path.join(ARCHIVE_DIR, runId, 'report.json');
  if (!fs.existsSync(legacyPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(legacyPath, 'utf-8')) as ArchivedReportLegacy;
  } catch {
    return null;
  }
}

/**
 * Delete an archived report by runId.
 * Returns true if the report was deleted, false if not found.
 */
export function deleteArchivedReport(runId: string): boolean {
  // Guard against path traversal — runId must only contain safe characters
  if (!isValidRunId(runId)) {
    throw new Error(`Invalid runId: "${runId}". RunId must match pattern run-YYYYMMDD-HHmmss-SSS.`);
  }
  const runDir = path.join(ARCHIVE_DIR, runId);
  // Verify the resolved path is inside ARCHIVE_DIR (defense-in-depth)
  const resolved = path.resolve(runDir);
  if (!resolved.startsWith(path.resolve(ARCHIVE_DIR) + path.sep)) {
    throw new Error(`Refusing to delete outside archive directory.`);
  }
  if (!fs.existsSync(runDir)) return false;
  try {
    fs.rmSync(runDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a runId only contains safe path characters.
 * Accepted format: run-YYYYMMDD-HHmmss-SSS (e.g. run-20260730-140422-162)
 * Also accepts legacy format: run-<digits> (e.g. run-1785387552280)
 */
function isValidRunId(runId: string): boolean {
  return (
    /^run-[\d-]+$/.test(runId) &&
    !runId.includes('..') &&
    !runId.includes('/') &&
    !runId.includes('\\')
  );
}

/**
 * List all archived report runIds.
 * Returns sorted newest-first (by directory mtime).
 */
export function listArchivedRunIds(): string[] {
  if (!fs.existsSync(ARCHIVE_DIR)) return [];

  const entries = fs.readdirSync(ARCHIVE_DIR, { withFileTypes: true });
  const runIds: Array<{ runId: string; mtime: number }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Accept directories with either summary.json or report.json
    const hasSummary = fs.existsSync(path.join(ARCHIVE_DIR, entry.name, 'summary.json'));
    const hasReport = fs.existsSync(path.join(ARCHIVE_DIR, entry.name, 'report.json'));
    if (!hasSummary && !hasReport) continue;

    const stat = fs.statSync(path.join(ARCHIVE_DIR, entry.name));
    runIds.push({ runId: entry.name, mtime: stat.mtimeMs });
  }

  // Sort newest first
  runIds.sort((a, b) => b.mtime - a.mtime);
  return runIds.map((r) => r.runId);
}

/**
 * Get the archive directory path.
 */
export function getArchiveDir(): string {
  return ARCHIVE_DIR;
}

/**
 * Check if the latest run has already been archived.
 * Compares timestamp from .latest-run against existing archives.
 */
export function isLatestRunArchived(): boolean {
  if (!fs.existsSync(LATEST_RUN_PATH)) return false;
  try {
    const latest = JSON.parse(fs.readFileSync(LATEST_RUN_PATH, 'utf-8'));
    const runId = generateRunId(latest.timestamp as string);
    return fs.existsSync(path.join(ARCHIVE_DIR, runId));
  } catch {
    return false;
  }
}

/**
 * Get the latest run info from .latest-run marker.
 * Returns null if no run has been executed.
 */
export function getLatestRunInfo(): {
  timestamp: string;
  summaryPath: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  reportMode: string;
} | null {
  if (!fs.existsSync(LATEST_RUN_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(LATEST_RUN_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * [Pipeline compat] Archive a legacy report structure.
 *
 * Used by the pipeline orchestrator (report-builder.ts) which has
 * its own report format. Writes to `reports/archive/<runId>/report.json`.
 *
 * For non-pipeline saves, prefer `saveLatestRun()`.
 *
 * NOTE: Does NOT overwrite an existing archive for the same runId.
 */
export function archiveReport(report: ArchivedReportLegacy): string {
  const runDir = path.join(ARCHIVE_DIR, report.runId);
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }

  const reportPath = path.join(runDir, 'report.json');

  // Guard: do not silently overwrite an existing archive
  if (fs.existsSync(reportPath)) {
    console.warn(
      `[archiveReport] Archive already exists for runId ${report.runId}. Skipping overwrite.`,
    );
    return reportPath;
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  return reportPath;
}

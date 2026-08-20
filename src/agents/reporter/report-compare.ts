import {
  loadArchivedReport,
  loadArchivedMetadata,
  loadArchivedSummary,
  type ArchivedReportLegacy as ArchivedReport,
  type ArchivedScenario,
  type ArchiveMetadata,
} from './report-archive';
import { listReportHistory } from './report-history';
import { deriveDisplayName, deriveTestSeriesId } from '../../support/custom-dashboard/domain/run';
import type {
  ComparisonCompatibility,
  ComparisonRunIdentity,
  CompatibilityLevel,
  ReportComparison as DomainReportComparison,
  ScenarioDiff as DomainScenarioDiff,
} from '../../support/custom-dashboard/domain/comparison';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScenarioDiff = DomainScenarioDiff;
export type ReportComparison = DomainReportComparison;
export type { ComparisonCompatibility, ComparisonRunIdentity, CompatibilityLevel };

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Calculate compatibility between baseline and candidate runs.
 */
export function getComparisonCompatibility(
  baseline: ArchivedReport,
  candidate: ArchivedReport,
  baselineMeta?: ArchiveMetadata | null,
  candidateMeta?: ArchiveMetadata | null,
): ComparisonCompatibility {
  const baseScenarios = new Set(baseline.scenarios.map((s) => s.scenarioId || s.name));
  const candScenarios = new Set(candidate.scenarios.map((s) => s.scenarioId || s.name));

  let intersection = 0;
  for (const id of candScenarios) {
    if (baseScenarios.has(id)) intersection++;
  }

  const union = new Set([...baseScenarios, ...candScenarios]).size;
  const overlapRatio = union === 0 ? 1 : intersection / union;

  const baseSeries =
    baselineMeta?.testSeriesId ||
    deriveTestSeriesId({
      requirementPath: baseline.requirementPath,
      requirementId: baselineMeta?.requirementId,
    });
  const candSeries =
    candidateMeta?.testSeriesId ||
    deriveTestSeriesId({
      requirementPath: candidate.requirementPath,
      requirementId: candidateMeta?.requirementId,
    });

  const sameTestSeries = Boolean(baseSeries && candSeries && baseSeries === candSeries);
  const sameEnvironment = (baseline.appEnv || 'local') === (candidate.appEnv || 'local');

  const reasons: string[] = [];
  if (sameTestSeries) {
    reasons.push(`Same test series: ${candSeries}`);
  } else {
    reasons.push(`Different test series: "${baseSeries}" vs "${candSeries}"`);
  }

  if (sameEnvironment) {
    reasons.push(`Same environment: ${candidate.appEnv || 'local'}`);
  } else {
    reasons.push(
      `Different environments: ${baseline.appEnv || 'local'} → ${candidate.appEnv || 'local'}`,
    );
  }

  const overlapPercent = Math.round(overlapRatio * 100);
  reasons.push(`${intersection}/${union} scenarios overlap (${overlapPercent}%)`);

  let level: CompatibilityLevel;
  if (sameTestSeries && sameEnvironment && overlapRatio >= 0.75) {
    level = 'exact';
  } else if (sameTestSeries || overlapRatio >= 0.75) {
    level = 'compatible';
  } else if (
    overlapRatio >= 0.4 ||
    (baseline.requirementPath && baseline.requirementPath === candidate.requirementPath)
  ) {
    level = 'partial';
  } else {
    level = 'mismatch';
  }

  return {
    level,
    reasons,
    overlapRatio,
    scenarioIntersectionCount: intersection,
    scenarioUnionCount: union,
    sameTestSeries,
    sameEnvironment,
  };
}

/**
 * Compare two archived reports by runId.
 *
 * The "baseline" is the earlier run; "comparison" is the later run.
 * If runIds are provided in reverse order, they are swapped automatically for delta calculations,
 * and `isCandidateOlder` is set to notify the UI.
 */
export function compareReports(
  baselineRunId: string,
  comparisonRunId: string,
): ReportComparison | { error: string } {
  const baseline = loadArchivedReport(baselineRunId);
  const comparison = loadArchivedReport(comparisonRunId);

  if (!baseline) return { error: `Baseline report not found: ${baselineRunId}` };
  if (!comparison) return { error: `Comparison report not found: ${comparisonRunId}` };

  const baselineMeta = loadArchivedMetadata(baselineRunId);
  const comparisonMeta = loadArchivedMetadata(comparisonRunId);

  // Check if requested order is reversed chronologically
  const isReversed =
    new Date(baseline.timestamp).getTime() > new Date(comparison.timestamp).getTime();

  let base = baseline;
  let comp = comparison;
  let bMeta = baselineMeta;
  let cMeta = comparisonMeta;

  if (isReversed) {
    base = comparison;
    comp = baseline;
    bMeta = comparisonMeta;
    cMeta = baselineMeta;
  }

  const compatibility = getComparisonCompatibility(base, comp, bMeta, cMeta);

  const baselineSummary = loadArchivedSummary(base.runId);
  const comparisonSummary = loadArchivedSummary(comp.runId);

  const baselineIdentity: ComparisonRunIdentity = {
    runId: base.runId,
    displayName:
      bMeta?.displayName ||
      deriveDisplayName({
        requirementPath: base.requirementPath,
        appEnv: base.appEnv,
        ranAt: base.timestamp,
      }),
    testSeriesId: bMeta?.testSeriesId,
    requirementId: bMeta?.requirementId,
    appEnv: base.appEnv,
    ranAt: base.timestamp,
    passRate: base.summary.passRate,
    totalTests: (baselineSummary?.total as number) ?? base.summary.testsGenerated,
  };

  const candidateIdentity: ComparisonRunIdentity = {
    runId: comp.runId,
    displayName:
      cMeta?.displayName ||
      deriveDisplayName({
        requirementPath: comp.requirementPath,
        appEnv: comp.appEnv,
        ranAt: comp.timestamp,
      }),
    testSeriesId: cMeta?.testSeriesId,
    requirementId: cMeta?.requirementId,
    appEnv: comp.appEnv,
    ranAt: comp.timestamp,
    passRate: comp.summary.passRate,
    totalTests: (comparisonSummary?.total as number) ?? comp.summary.testsGenerated,
  };

  const compResult = buildComparison(base, comp);

  return {
    ...compResult,
    baseline: baselineIdentity,
    candidate: candidateIdentity,
    compatibility,
    isCandidateOlder: isReversed,
  };
}

/**
 * Compare latest run vs previous run for a requirement.
 * Requires at least 2 archived reports for the same requirement.
 */
export function compareLatestVsPrevious(
  requirementPath?: string,
): ReportComparison | { error: string } {
  const entries = listReportHistory({
    requirementPath,
    sort: 'newest',
    limit: 2,
  });

  if (entries.length < 2) {
    return { error: 'Need at least 2 archived reports to compare' };
  }

  const latest = loadArchivedReport(entries[0].runId);
  const previous = loadArchivedReport(entries[1].runId);

  if (!latest || !previous) {
    return { error: 'Failed to load comparison reports' };
  }

  return buildComparison(previous, latest);
}

/**
 * Generate a human-readable comparison summary.
 * Designed for AI agent consumption and CLI output.
 */
export function generateComparisonSummary(comparison: ReportComparison): string {
  const lines: string[] = [];

  lines.push(`Comparison: ${comparison.baselineRunId} → ${comparison.comparisonRunId}`);
  lines.push(
    `Pass rate: ${comparison.baselinePassRate}% → ${comparison.comparisonPassRate}% (${formatDelta(comparison.passRateDelta)})`,
  );
  lines.push('');

  if (comparison.summary.regressed > 0) {
    lines.push(`🔴 Regressions: ${comparison.summary.regressed}`);
    for (const r of comparison.regressions) {
      lines.push(`   ${r.scenarioId}: ${r.previousStatus} → ${r.currentStatus}`);
      if (r.currentError) lines.push(`      Error: ${r.currentError}`);
    }
  }

  if (comparison.summary.fixed > 0) {
    lines.push(`🟢 Fixes: ${comparison.summary.fixed}`);
    for (const f of comparison.fixes) {
      lines.push(`   ${f.scenarioId}: ${f.previousStatus} → ${f.currentStatus}`);
    }
  }

  if (comparison.summary.stableFailures > 0) {
    lines.push(`🟡 Stable failures: ${comparison.summary.stableFailures}`);
    for (const s of comparison.stableFailures) {
      lines.push(`   ${s.scenarioId}: ${s.currentStatus} (same error)`);
    }
  }

  if (comparison.summary.flaky > 0) {
    lines.push(`🔄 Flaky: ${comparison.summary.flaky}`);
    for (const fl of comparison.flakyScenarios) {
      lines.push(`   ${fl.scenarioId}: ${fl.previousStatus} → ${fl.currentStatus}`);
    }
  }

  if (comparison.summary.new > 0) {
    lines.push(`✨ New scenarios: ${comparison.summary.new}`);
  }

  if (comparison.summary.removed > 0) {
    lines.push(`🗑️ Removed scenarios: ${comparison.summary.removed}`);
  }

  if (comparison.summary.regressed === 0 && comparison.summary.fixed === 0) {
    lines.push('No changes detected between runs.');
  }

  return lines.join('\n');
}

// ─── Internal ────────────────────────────────────────────────────────────────

function buildComparison(baseline: ArchivedReport, comparison: ArchivedReport): ReportComparison {
  // Use composite key scenarioId+role to handle role-aware tests where the same
  // scenarioId runs under multiple roles (e.g. TC-FIN-01 for finance AND hrd).
  const makeKey = (s: ArchivedScenario) => (s.role ? `${s.scenarioId}::${s.role}` : s.scenarioId);

  const baselineMap = new Map<string, ArchivedScenario>();
  for (const s of baseline.scenarios) {
    baselineMap.set(makeKey(s), s);
  }

  const comparisonMap = new Map<string, ArchivedScenario>();
  for (const s of comparison.scenarios) {
    comparisonMap.set(makeKey(s), s);
  }

  const regressions: ScenarioDiff[] = [];
  const fixes: ScenarioDiff[] = [];
  const newScenarios: ScenarioDiff[] = [];
  const removedScenarios: ScenarioDiff[] = [];
  const stableFailures: ScenarioDiff[] = [];
  const flakyScenarios: ScenarioDiff[] = [];

  // Check scenarios in comparison (may be new, or changed)
  for (const [id, comp] of comparisonMap) {
    const base = baselineMap.get(id);

    if (!base) {
      // New scenario
      newScenarios.push({
        scenarioId: id,
        name: comp.name,
        role: comp.role,
        module: comp.module,
        feature: comp.feature,
        previousStatus: 'not-present',
        currentStatus: comp.status,
        change: 'new',
        failureSource: comp.failureSource,
        currentError: comp.errorMessage,
      });
      continue;
    }

    const diff = classifyChange(base, comp);

    switch (diff.change) {
      case 'regression':
        regressions.push(diff);
        break;
      case 'fix':
        fixes.push(diff);
        break;
      case 'stable':
        stableFailures.push(diff);
        break;
      case 'flaky':
        flakyScenarios.push(diff);
        break;
      // 'unchanged' — not tracked
    }
  }

  // Check for removed scenarios
  for (const [id, base] of baselineMap) {
    if (!comparisonMap.has(id)) {
      removedScenarios.push({
        scenarioId: id,
        name: base.name,
        role: base.role,
        module: base.module,
        feature: base.feature,
        previousStatus: base.status,
        currentStatus: 'removed',
        change: 'removed',
        previousError: base.errorMessage,
      });
    }
  }

  const passRateDelta = comparison.summary.passRate - baseline.summary.passRate;

  return {
    baselineRunId: baseline.runId,
    comparisonRunId: comparison.runId,
    baselineTimestamp: baseline.timestamp,
    comparisonTimestamp: comparison.timestamp,
    baselinePassRate: baseline.summary.passRate,
    comparisonPassRate: comparison.summary.passRate,
    passRateDelta,
    regressions,
    fixes,
    newScenarios,
    removedScenarios,
    stableFailures,
    flakyScenarios,
    summary: {
      totalScenarios: comparison.scenarios.length,
      regressed: regressions.length,
      fixed: fixes.length,
      new: newScenarios.length,
      removed: removedScenarios.length,
      stableFailures: stableFailures.length,
      flaky: flakyScenarios.length,
    },
  };
}

/**
 * Classify the change between a baseline and comparison scenario status.
 *
 * Exported for unit testing (pure function, no I/O).
 */
export function classifyChange(base: ArchivedScenario, comp: ArchivedScenario): ScenarioDiff {
  const prev = base.status;
  const curr = comp.status;

  let change: string;

  if (prev === curr) {
    if (prev === 'failed') {
      // Same failure — check if same error
      const sameError = base.errorMessage === comp.errorMessage;
      change = sameError ? 'stable' : 'flaky';
    } else {
      change = 'unchanged';
    }
  } else if (prev === 'passed' && curr === 'failed') {
    change = 'regression';
  } else if (prev === 'failed' && curr === 'passed') {
    change = 'fix';
  } else if (prev === 'failed' && curr === 'skipped') {
    change = 'stable';
  } else if (prev === 'skipped' && curr === 'failed') {
    change = 'regression';
  } else if (prev === 'skipped' && curr === 'passed') {
    change = 'fix';
  } else if (prev === 'passed' && curr === 'skipped') {
    change = 'flaky';
  } else if (prev === 'failed' && curr === 'healed') {
    change = 'fix';
  } else if (prev === 'healed' && curr === 'failed') {
    change = 'regression';
  } else if (prev === 'healed' && curr === 'passed') {
    // Healed → passed: healer succeeded, test now green. This is a fix.
    change = 'fix';
  } else if (prev === 'passed' && curr === 'healed') {
    // Passed → healed: functionally unchanged (still green).
    change = 'unchanged';
  } else if (prev === 'skipped' && curr === 'healed') {
    // Skipped → healed: previously not run, now green — treat as fix.
    change = 'fix';
  } else if (prev === 'healed' && curr === 'skipped') {
    // Healed → skipped: lost green status — treat as flaky.
    change = 'flaky';
  } else {
    change = 'flaky';
  }

  return {
    scenarioId: comp.scenarioId,
    name: comp.name,
    role: comp.role,
    module: comp.module,
    feature: comp.feature,
    previousStatus: prev,
    currentStatus: curr,
    change,
    failureSource: comp.failureSource,
    previousError: base.errorMessage,
    currentError: comp.errorMessage,
  };
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}%`;
  if (delta < 0) return `${delta.toFixed(1)}%`;
  return '0%';
}

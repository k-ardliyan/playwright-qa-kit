/**
 * Cross-Run Report Comparison — diff two archived reports.
 *
 * Classifies per-scenario changes as: regression, fix, stable failure,
 * flaky, new scenario, or removed scenario.
 *
 * @module src/agents/reporter/report-compare
 */
import {
  loadArchivedReport,
  type ArchivedReportLegacy as ArchivedReport,
  type ArchivedScenario,
} from './report-archive';
import { listReportHistory } from './report-history';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScenarioDiff {
  scenarioId: string;
  name: string;
  role?: string;
  module?: string;
  feature?: string;
  previousStatus: string;
  currentStatus: string;
  /** 'regression' | 'fix' | 'stable' | 'flaky' | 'new' | 'removed' */
  change: string;
  failureSource?: string;
  previousError?: string;
  currentError?: string;
}

export interface ReportComparison {
  baselineRunId: string;
  comparisonRunId: string;
  baselineTimestamp: string;
  comparisonTimestamp: string;
  baselinePassRate: number;
  comparisonPassRate: number;
  /** Positive = improvement, negative = regression */
  passRateDelta: number;
  regressions: ScenarioDiff[];
  fixes: ScenarioDiff[];
  newScenarios: ScenarioDiff[];
  removedScenarios: ScenarioDiff[];
  stableFailures: ScenarioDiff[];
  flakyScenarios: ScenarioDiff[];
  summary: {
    totalScenarios: number;
    regressed: number;
    fixed: number;
    new: number;
    removed: number;
    stableFailures: number;
    flaky: number;
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compare two archived reports by runId.
 *
 * The "baseline" is the earlier run; "comparison" is the later run.
 * If runIds are provided in reverse order, they are swapped automatically.
 */
export function compareReports(
  baselineRunId: string,
  comparisonRunId: string,
): ReportComparison | { error: string } {
  const baseline = loadArchivedReport(baselineRunId);
  const comparison = loadArchivedReport(comparisonRunId);

  if (!baseline) return { error: `Baseline report not found: ${baselineRunId}` };
  if (!comparison) return { error: `Comparison report not found: ${comparisonRunId}` };

  // Ensure chronological order
  let base = baseline;
  let comp = comparison;
  if (new Date(baseline.timestamp).getTime() > new Date(comparison.timestamp).getTime()) {
    base = comparison;
    comp = baseline;
  }

  return buildComparison(base, comp);
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

function classifyChange(base: ArchivedScenario, comp: ArchivedScenario): ScenarioDiff {
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

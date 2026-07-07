/**
 * Report Builder — Pipeline report construction
 *
 * Defines the core interfaces for pipeline reporting and provides
 * the `buildReport` function that aggregates test execution results
 * into a structured PipelineReport, and `writeReportMarkdown` that
 * generates a Markdown report file.
 *
 * @module agents/reporter/report-builder
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Coverage status for a single requirement scenario.
 */
export interface ScenarioCoverage {
  scenarioId: string;
  scenarioName: string;
  status: 'passed' | 'failed' | 'healed' | 'skipped' | 'not-generated';
}

/**
 * Represents a failure that could not be resolved by the Healer agent.
 */
export interface UnresolvedFailure {
  stage: string;
  errorMessage: string;
  tracePath?: string;
  screenshotPath?: string;
}

/**
 * Complete pipeline run report containing summary metrics,
 * per-scenario coverage, and any unresolved failures.
 */
export interface PipelineReport {
  runId: string;
  timestamp: string;
  duration: number;
  summary: {
    scenariosPlanned: number;
    testsGenerated: number;
    testsPassing: number;
    testsFailing: number;
    testsHealed: number;
    testsSkipped: number;
  };
  coverage: ScenarioCoverage[];
  unresolvedFailures: UnresolvedFailure[];
}

/**
 * Input parameters for the buildReport function.
 */
export interface BuildReportInput {
  runId: string;
  startedAt: string; // ISO 8601
  completedAt: string; // ISO 8601
  scenariosPlanned: number;
  testsGenerated: number;
  testResults: {
    passing: number;
    failing: number;
    skipped: number;
  };
  healedCount: number;
  scenarios: Array<{
    id: string;
    name: string;
    status: 'passed' | 'failed' | 'healed' | 'skipped' | 'not-generated';
  }>;
  unresolvedFailures?: UnresolvedFailure[];
}

/**
 * Default directory for report output.
 */
const REPORTS_DIR = path.resolve('reports');

/**
 * Builds a structured pipeline report from test execution results.
 *
 * 1. Computes duration from startedAt to completedAt timestamps (in ms)
 * 2. Builds the PipelineReport object with summary and coverage
 * 3. Returns the PipelineReport object
 */
export function buildReport(input: BuildReportInput): PipelineReport {
  const startTime = new Date(input.startedAt).getTime();
  const endTime = new Date(input.completedAt).getTime();
  const duration = endTime - startTime;

  // Map scenarios to ScenarioCoverage[]
  const coverage: ScenarioCoverage[] = input.scenarios.map((s) => ({
    scenarioId: s.id,
    scenarioName: s.name,
    status: s.status,
  }));

  const report: PipelineReport = {
    runId: input.runId,
    timestamp: input.completedAt,
    duration,
    summary: {
      scenariosPlanned: input.scenariosPlanned,
      testsGenerated: input.testsGenerated,
      testsPassing: input.testResults.passing,
      testsFailing: input.testResults.failing,
      testsHealed: input.healedCount,
      testsSkipped: input.testResults.skipped,
    },
    coverage,
    unresolvedFailures: input.unresolvedFailures || [],
  };

  return report;
}

/**
 * Generates a Markdown report from a PipelineReport and writes it to disk.
 *
 * Output: `reports/pipeline-report-<runId>.md`
 *
 * Sections:
 * - Title: `# Pipeline Report — <runId>`
 * - Summary section with counts table
 * - Duration section
 * - Coverage section (table with scenario names and statuses)
 * - Unresolved Failures section (if any)
 *
 * @returns The output file path
 */
export function writeReportMarkdown(report: PipelineReport): string {
  const lines: string[] = [];

  // Title
  lines.push(`# Pipeline Report — ${report.runId}`);
  lines.push('');

  // Summary section
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Scenarios Planned | ${report.summary.scenariosPlanned} |`);
  lines.push(`| Tests Generated | ${report.summary.testsGenerated} |`);
  lines.push(`| Tests Passing | ${report.summary.testsPassing} |`);
  lines.push(`| Tests Failing | ${report.summary.testsFailing} |`);
  lines.push(`| Tests Healed | ${report.summary.testsHealed} |`);
  lines.push(`| Tests Skipped | ${report.summary.testsSkipped} |`);
  lines.push('');

  // Duration section
  lines.push('## Duration');
  lines.push('');
  lines.push(`**Total Duration:** ${report.duration}ms`);
  lines.push('');
  lines.push(`**Timestamp:** ${report.timestamp}`);
  lines.push('');

  // Coverage section
  lines.push('## Coverage');
  lines.push('');
  lines.push('| Scenario | Status |');
  lines.push('|----------|--------|');
  for (const entry of report.coverage) {
    lines.push(`| ${entry.scenarioName} | ${entry.status} |`);
  }
  lines.push('');

  // Unresolved Failures section (only if there are failures)
  if (report.unresolvedFailures.length > 0) {
    lines.push('## Unresolved Failures');
    lines.push('');
    lines.push('| Stage | Error |');
    lines.push('|-------|-------|');
    for (const failure of report.unresolvedFailures) {
      lines.push(`| ${failure.stage} | ${failure.errorMessage} |`);
    }
    lines.push('');
  }

  const markdown = lines.join('\n');

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORTS_DIR, `pipeline-report-${report.runId}.md`);
  fs.writeFileSync(reportPath, markdown, 'utf-8');

  return reportPath;
}

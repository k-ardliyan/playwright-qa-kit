/**
 * Reporter Agent — Barrel Export
 *
 * Re-exports all public APIs from the reporter module:
 * - Report Builder: Pipeline report interfaces and construction
 *
 * @module agents/reporter
 */

export {
  buildReport,
  writeReportMarkdown,
  type BuildReportInput,
  type PipelineReport,
  type ScenarioCoverage,
  type UnresolvedFailure,
} from './report-builder';

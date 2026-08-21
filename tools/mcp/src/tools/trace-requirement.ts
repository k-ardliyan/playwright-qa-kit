import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveAllowedPath } from '../utils/safety';
import { mcpWorkspace } from '../utils/workspace-paths';
import {
  TRACEABILITY_SCHEMA_V1,
  type TraceabilityContractV1,
  type TraceabilityAcNode,
  type TraceabilityScenarioNode,
  type ExecutionStatus,
  type FailureRootCause,
  createDiagnostic,
  type McpResult,
  successResult,
  failureResult,
} from '../contracts';
import { compileRequirementFromText } from './compile-requirement';

export interface TraceRequirementArgs {
  requirementPath?: unknown;
  requirementsText?: unknown;
  resultsDir?: unknown;
  summaryPath?: unknown;
}

export type TraceRequirementOutput = McpResult<TraceabilityContractV1 | undefined>;

function listFilesRecursive(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...listFilesRecursive(full, ext));
      }
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

function loadSummaryTestCases(
  summaryFilePath: string,
): Map<string, { status: string; error?: string }> {
  const map = new Map<string, { status: string; error?: string }>();
  if (!fs.existsSync(summaryFilePath)) return map;
  try {
    const raw = JSON.parse(fs.readFileSync(summaryFilePath, 'utf-8')) as {
      testCases?: Array<{ title?: string; status?: string; filePath?: string; error?: string }>;
    };
    for (const tc of raw.testCases ?? []) {
      const file = (tc.filePath ?? '').replace(/\\/g, '/');
      const title = (tc.title ?? '').trim();
      const status = tc.status ?? 'unknown';
      if (title) {
        map.set(`${file}::${title}`, { status, error: tc.error });
        map.set(title, { status, error: tc.error });
      }
      if (file) {
        const prev = map.get(file);
        if (!prev || prev.status === 'passed' || status === 'failed' || status === 'timedOut') {
          map.set(file, { status, error: tc.error });
        }
      }
    }
  } catch {
    // ignore parse error
  }
  return map;
}

export function buildTraceabilityMatrix(
  requirementText: string,
  requirementPath: string,
  summaryFilePath?: string,
): TraceabilityContractV1 {
  const compiled = compileRequirementFromText(requirementText, requirementPath);
  const req = compiled.data!;
  const repoRoot = mcpWorkspace.rootDir;

  const summaryPath =
    summaryFilePath ||
    (fs.existsSync(path.join(mcpWorkspace.reportsDir, 'test-summary.json'))
      ? path.join(mcpWorkspace.reportsDir, 'test-summary.json')
      : path.join(repoRoot, 'reports', 'test-summary.json'));

  const testCaseMap = loadSummaryTestCases(summaryPath);
  const allTests = listFilesRecursive(mcpWorkspace.testsDir, '.spec.ts');

  // Find candidate spec files for this requirement
  const stem = path.posix.basename(requirementPath).replace(/\.md$/, '');
  const candidateSpecs = allTests
    .map((p) => path.relative(repoRoot, p).replace(/\\/g, '/'))
    .filter((p) => {
      const base = path.posix.basename(p, '.spec.ts');
      return base === stem || base.startsWith(`${stem}-`);
    });

  // Map Scenarios
  const scenarioNodes: TraceabilityScenarioNode[] = req.scenarios.map((sc) => {
    let specFile: string | undefined;
    if (sc.actor) {
      specFile =
        candidateSpecs.find((s) => s.includes(`-${sc.actor}.spec.ts`)) ?? candidateSpecs[0];
    } else {
      specFile = candidateSpecs[0];
    }

    let status: ExecutionStatus = 'not-generated';
    let failureSource: FailureRootCause | undefined;
    let errorMessage: string | undefined;

    if (sc.type === 'manual') {
      status = 'manual';
    } else if (specFile) {
      const matchKey = `${specFile}::${sc.title}`;
      const hit =
        testCaseMap.get(matchKey) || testCaseMap.get(sc.title) || testCaseMap.get(specFile);
      if (hit) {
        if (hit.status === 'passed') status = 'passed';
        else if (hit.status === 'failed') {
          status = 'failed';
          failureSource = 'app';
          errorMessage = hit.error;
        } else if (hit.status === 'timedOut') {
          status = 'timedOut';
          failureSource = 'app';
        } else if (hit.status === 'skipped') {
          status = 'skipped';
        }
      } else {
        status = 'not-executed';
      }
    }

    return {
      scenarioId: sc.id,
      testId: sc.testId,
      title: sc.title,
      coversAcIds: sc.covers,
      role: sc.actor,
      authContext: sc.authContext,
      specFile,
      executionStatus: status,
      failureSource,
      errorMessage,
    };
  });

  // Map Acceptance Criteria
  const acNodes: TraceabilityAcNode[] = req.acceptanceCriteria.map((ac) => {
    const coveringScenarios = scenarioNodes.filter((sc) => sc.coversAcIds.includes(ac.id));
    const scIds = coveringScenarios.map((s) => s.scenarioId);

    let status: 'covered' | 'uncovered' | 'partially-covered' = 'uncovered';
    if (coveringScenarios.length > 0) {
      const allPassed = coveringScenarios.every((s) => s.executionStatus === 'passed');
      const anyPassed = coveringScenarios.some((s) => s.executionStatus === 'passed');
      const anyFailed = coveringScenarios.some((s) => s.executionStatus === 'failed');

      if (allPassed) {
        status = 'covered';
      } else if (anyPassed || anyFailed) {
        status = 'partially-covered';
      } else {
        status = 'covered'; // Planned/generated but not executed yet
      }
    }

    return {
      acId: ac.id,
      description: ac.description,
      coveredByScenarioIds: scIds,
      status,
    };
  });

  // Calculate Metrics
  const totalAcs = acNodes.length;
  const coveredAcs = acNodes.filter((a) => a.status === 'covered').length;
  const uncoveredAcs = acNodes.filter((a) => a.status === 'uncovered').length;

  const totalScenarios = scenarioNodes.length;
  const passingScenarios = scenarioNodes.filter((s) => s.executionStatus === 'passed').length;
  const failingScenarios = scenarioNodes.filter(
    (s) => s.executionStatus === 'failed' || s.executionStatus === 'timedOut',
  ).length;
  const skippedScenarios = scenarioNodes.filter((s) => s.executionStatus === 'skipped').length;
  const manualScenarios = scenarioNodes.filter((s) => s.executionStatus === 'manual').length;
  const blockedScenarios = scenarioNodes.filter((s) => s.executionStatus === 'blocked').length;

  return {
    schemaVersion: TRACEABILITY_SCHEMA_V1,
    requirementId: req.requirementId,
    requirementTitle: req.title,
    requirementPath,
    requirementHash: req.sourceHash,
    module: req.module,
    feature: req.feature,
    acceptanceCriteria: acNodes,
    scenarios: scenarioNodes,
    metrics: {
      totalAcs,
      coveredAcs,
      uncoveredAcs,
      totalScenarios,
      passingScenarios,
      failingScenarios,
      skippedScenarios,
      manualScenarios,
      blockedScenarios,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function traceRequirement(args: TraceRequirementArgs | undefined): TraceRequirementOutput {
  if (!args || typeof args !== 'object') {
    return failureResult([
      createDiagnostic('INVALID_INPUT', 'error', 'Arguments must be an object.'),
    ]);
  }

  let text = typeof args.requirementsText === 'string' ? args.requirementsText : '';
  let reqPath = typeof args.requirementPath === 'string' ? args.requirementPath : '';

  if (!text && !reqPath) {
    return failureResult([
      createDiagnostic(
        'INVALID_INPUT',
        'error',
        'Provide `requirementPath` or `requirementsText`.',
      ),
    ]);
  }

  if (reqPath && !text) {
    const resolved = resolveAllowedPath(reqPath, 'requirements', { mustExist: true });
    if (!resolved.ok) {
      return failureResult([
        createDiagnostic(resolved.error.code, 'error', resolved.error.message, { path: reqPath }),
      ]);
    }
    try {
      text = fs.readFileSync(resolved.absolutePath, 'utf-8');
      reqPath = resolved.relativePath;
    } catch (err) {
      return failureResult([
        createDiagnostic('TOOL_INTERNAL', 'error', `Failed to read requirement file: ${err}`),
      ]);
    }
  }

  const summaryPath = typeof args.summaryPath === 'string' ? args.summaryPath : undefined;
  const matrix = buildTraceabilityMatrix(text, reqPath || 'requirements/unknown.md', summaryPath);

  return successResult(matrix, {
    message: `Traceability graph generated for ${matrix.requirementId}: ${matrix.metrics.coveredAcs}/${matrix.metrics.totalAcs} ACs covered, ${matrix.metrics.totalScenarios} scenarios mapped.`,
  });
}

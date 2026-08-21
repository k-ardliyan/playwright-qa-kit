# Traceability Contract (`qa.traceability/v1`)

> Canonical specification for `TraceabilityContractV1` produced by `trace_requirement`.

## Schema Version

`qa.traceability/v1`

## Structure

```ts
export interface TraceabilityAcNode {
  acId: string;
  description: string;
  coveredByScenarioIds: string[];
  status: 'covered' | 'uncovered' | 'partially-covered';
}

export interface TraceabilityScenarioNode {
  scenarioId: string;
  testId?: string;
  title: string;
  coversAcIds: string[];
  role?: string;
  authContext?: string;
  specFile?: string;
  executionStatus: ExecutionStatus;
  failureSource?: FailureRootCause;
  errorMessage?: string;
}

export interface TraceabilityContractV1 {
  schemaVersion: 'qa.traceability/v1';

  requirementId: string;
  requirementTitle: string;
  requirementPath: string;
  requirementHash: string;

  module?: string;
  feature?: string;

  acceptanceCriteria: TraceabilityAcNode[];
  scenarios: TraceabilityScenarioNode[];

  metrics: {
    totalAcs: number;
    coveredAcs: number;
    uncoveredAcs: number;
    totalScenarios: number;
    passingScenarios: number;
    failingScenarios: number;
    skippedScenarios: number;
    manualScenarios: number;
    blockedScenarios: number;
  };

  generatedAt: string;
}
```

# Test Plan Contract (`qa.test-plan/v1`)

> Canonical specification for `TestPlanContractV1` produced by `compile_test_plan` and consumed by `validate_plan` and Generator.

## Schema Version

`qa.test-plan/v1`

## Structure

```ts
export interface TestPlanContractV1 {
  schemaVersion: 'qa.test-plan/v1';

  sourceRequirementPath: string;
  sourceRequirementHash: string;

  planPath?: string;
  planHash?: string;
  seed?: string;

  module?: string;
  feature?: string;

  catalogEvidence: CatalogEvidence[];
  scenarios: PlanScenarioV1[];
  coverageGaps: CoverageGap[];
  diagnostics: Diagnostic[];
}
```

### Scenario Model

```ts
export type AssertionProvenance =
  | 'requirement'
  | 'live-verification'
  | 'framework-derived'
  | 'planner-assumption';

export interface PlanAssertion {
  description: string;
  provenance: AssertionProvenance;
}

export type PlanExecutionMode = 'automated' | 'manual' | 'blocked';

export interface PlanScenarioV1 {
  scenarioId: string;
  testId?: string;
  covers: string[];
  actor?: string;
  authContext?: string;

  executionMode: PlanExecutionMode;

  dataSetup: string[];
  actions: string[];
  assertions: PlanAssertion[];

  locatorIntent: string[];
  networkExpectations: string[];
  artifactExpectations: string[];
  cleanup: string[];
  unknowns: string[];
}
```

### Supporting Types

```ts
export interface CoverageGap {
  scenarioId?: string;
  acceptanceCriterionId?: string;
  reason: string;
}

export interface CatalogEvidence {
  page: string;
  catalogPath?: string;
  catalogHash?: string;
}
```

### Invariants & Rules

1. **No Ephemeral Browser Refs:** Element refs such as `ref:tw-123` or `handle:...` must never appear in actions or locator intent.
2. **Provenance Mandatory:** Every assertion must declare provenance (`[requirement]`, `[live-verification]`, `[framework-derived]`, `[planner-assumption]`).
3. **Requirement Hash Propagation:** `sourceRequirementHash` guarantees the plan was authored against the current requirement version.

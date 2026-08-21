# Traceability & Coverage Architecture

This document defines the closed-loop traceability graph and coverage lifecycle in the Playwright QA Kit framework.

---

## 1. Traceability Model Overview

The framework guarantees **closed-loop traceability** from written business requirements to executable Playwright tests and final QA reporting.

```text
Requirement Markdown (requirements/*.md)
        ↓
compile_requirement  →  RequirementContractV1 (id, acceptanceCriteria, scenarios)
        ↓
Planner Agent
        ↓
Plan Markdown (specs/*.md)
        ↓
compile_test_plan   →  TestPlanContractV1 (id, sourceRequirementHash, scenarios)
        ↓
validate_plan (Markdown-native)
        ↓
Generator Agent
        ↓
Playwright Test Specs (tests/*.spec.ts with setTestMetadata())
        ↓
Execute (playwright-test)  →  Test Results (results.json, test-summary.json)
        ↓
trace_requirement   →  TraceabilityContractV1 (Graph & 4D Metrics)
        ↓
Reporter Agent      →  Pipeline Report & Custom Dashboard
```

---

## 2. Four-Dimensional Coverage State

Coverage is not a single binary boolean. It is tracked across **four distinct, orthogonal dimensions**:

### 2.1. Design Coverage
- **`unplanned`**: Scenario defined in requirement but not yet included in a test plan.
- **`planned`**: Scenario successfully compiled into a validated test plan.

### 2.2. Automation State
- **`unautomated`**: No automated test file exists yet.
- **`automated`**: Test code is generated and ready for execution.
- **`manual`**: Scenario explicitly tagged `(@manual)` or requiring manual intervention.
- **`mixed`**: Requirement has a blend of automated and manual scenarios.

### 2.3. Execution State
- **`not-executed`**: Test has not run in the current pipeline run.
- **`passed`**: Test executed and all assertions passed.
- **`failed`**: Test executed and failed on an assertion or error.
- **`skipped`**: Test was skipped (`test.skip()`).
- **`timed-out`**: Test exceeded execution timeout.

### 2.4. Verification State
- **`unverified`**: Test planned or generated but never executed.
- **`verified-pass`**: Executed test passed in the current execution cycle.
- **`verified-fail`**: Executed test failed and was not healed.
- **`manual-verification-required`**: Scenario requires human verification.

> [!IMPORTANT]
> A planned test that was never executed is classified as `unverified` and **never** counts toward verified passing coverage.

---

## 3. Exact Identity Hierarchy & Lookup

Traceability resolution follows a strict priority chain:

1. **`testId`** (e.g. `TEST-AUTH-001`): Explicit unique test case identifier.
2. **`scenarioId`** (e.g. `SC-AUTH-01`): Direct scenario mapping from requirement/plan.
3. **`requirementId`** (e.g. `REQ-AUTH-001`): Requirement grouping level.
4. **Heuristic Filename Match** *(Compatibility Fallback)*: When exact annotations are absent, filename stems are matched. When used, the MCP tool emits the diagnostic `TRACE_HEURISTIC_LINK_USED`.

### Test Metadata Injection
Every generated test spec embeds identity metadata using `setTestMetadata()`:

```typescript
import { test, expect } from '@/fixtures/base.fixture';
import { setTestMetadata } from '@/support/test-metadata';

test.describe('Login Validation', () => {
  test('Empty username and password show validation errors', async ({ page }) => {
    setTestMetadata({
      requirementId: 'REQ-AUTH-002',
      scenarioId: 'SC-01',
      testId: 'TEST-AUTH-002-01',
      covers: ['AC-01', 'AC-02'],
      actor: 'user',
      module: 'auth',
      feature: 'login',
      sourceRequirementHash: 'sha256-req-hash...',
      sourcePlanHash: 'sha256-plan-hash...',
    });

    // Test steps...
  });
});
```

---

## 4. Aggregated Traceability Metrics

The `TraceabilityContractV1` aggregates coverage metrics across the requirement:

| Metric                       | Definition                                                           |
| ---------------------------- | -------------------------------------------------------------------- |
| `plannedScenarioCoverage`    | Ratio of planned scenarios to total requirement scenarios (%)        |
| `automationCoverage`         | Ratio of automated test scenarios to total automatable scenarios (%) |
| `executionCoverage`          | Ratio of executed tests to total planned tests (%)                   |
| `verifiedAcceptanceCoverage` | Ratio of passing ACs to total requirement ACs (%)                    |
| `manualCoverage`             | Count of scenarios flagged for manual execution                      |
| `blockedCoverage`            | Count of scenarios marked blocked or unautomatable                   |

---

## 5. Tool Usage & Integration

### Calling `trace_requirement` (MCP Tool)

```json
{
  "requirementPath": "requirements/auth/sample-login-empty-fields.md",
  "testPlanPath": "specs/auth/sample-login-empty-fields-test-plan.md",
  "summaryPath": "artifacts/reports/test-summary.json"
}
```

### Result Schema (`qa.traceability/v1`)

```json
{
  "status": "success",
  "data": {
    "schemaVersion": "qa.traceability/v1",
    "requirementId": "REQ-AUTH-002",
    "sourceRequirementHash": "...",
    "sourcePlanHash": "...",
    "metrics": {
      "plannedScenarioCoverage": 100,
      "automationCoverage": 100,
      "executionCoverage": 100,
      "verifiedAcceptanceCoverage": 100,
      "manualCoverage": 0,
      "blockedCoverage": 0
    },
    "scenarios": [
      {
        "scenarioId": "SC-01",
        "name": "Submit empty fields",
        "covers": ["AC-01", "AC-02"],
        "actor": "user",
        "designState": "planned",
        "automationState": "automated",
        "executionState": "passed",
        "verificationState": "verified-pass",
        "testFile": "tests/auth/sample-login-empty-fields.spec.ts"
      }
    ],
    "diagnostics": []
  }
}
```

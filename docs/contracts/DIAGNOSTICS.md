# QA Kit Diagnostic Codes Catalog

Diagnostic codes are stable APIs returned in `McpResult.diagnostics` and compiler gates.

## Diagnostic Severity Levels

- `error` — Halts execution gate (e.g. invalid requirement, missing scenario, malformed ID).
- `warning` — Review required (e.g. planner assumption, legacy format used, unreviewed change).
- `info` — Non-blocking context and hints.

---

## Requirement Diagnostics (`REQ_*`)

| Code                                 | Severity          | Description                                                           |
| ------------------------------------ | ----------------- | --------------------------------------------------------------------- |
| `REQ_MISSING_MODULE`                 | `warning`/`error` | Module field is missing in metadata                                   |
| `REQ_MISSING_FEATURE`                | `warning`/`error` | Feature field is missing in metadata                                  |
| `REQ_INVALID_ID`                     | `error`           | Requirement ID does not follow `REQ-<MODULE>-<NUM>` convention        |
| `REQ_DUPLICATE_AC_ID`                | `error`           | Acceptance criterion ID is duplicated within the requirement          |
| `REQ_DUPLICATE_SCENARIO_ID`          | `error`           | Scenario ID (e.g. `SC-01`) is duplicated within the requirement       |
| `REQ_DUPLICATE_TEST_ID`              | `error`           | Test ID (e.g. `TC-001`) is duplicated within the requirement          |
| `REQ_UNKNOWN_AC_REFERENCE`           | `error`           | A scenario references an AC ID not declared in Acceptance Criteria    |
| `REQ_ROLE_NOT_DECLARED`              | `error`           | Scenario Actor or role is not declared in Role Scope or Access Matrix |
| `REQ_ACCESS_MATRIX_CONFLICT`         | `error`           | Role access expectation contradicts scenario expectation              |
| `REQ_CAPABILITY_CONTRACT_INCOMPLETE` | `warning`         | Scenario uses tags without specifying required capability contract    |
| `REQ_MALFORMED`                      | `error`           | Requirement markdown syntax is structurally unparseable               |
| `REQ_EMPTY_SCENARIOS`                | `error`           | Requirement contains no test scenarios                                |
| `REQ_NO_OBSERVABLE_RESULT`           | `error`           | Scenario lacks observable expected result assertions                  |
| `REQ_LEGACY_AC_BULLET`               | `warning`         | AC authored without explicit `AC-XX` ID (compatibility mode applied)  |
| `REQ_LEGACY_ROLE_PROSE`              | `warning`         | Role matrix authored as unstructured prose rather than table          |
| `REQ_LEGACY_POM_METADATA`            | `warning`         | Deprecated `POM yang dibutuhkan` field found in requirement           |

---

## Test Plan Diagnostics (`PLAN_*`)

| Code                          | Severity          | Description                                                          |
| ----------------------------- | ----------------- | -------------------------------------------------------------------- |
| `PLAN_SCENARIO_MISSING`       | `error`           | A required scenario from requirement is missing in the test plan     |
| `PLAN_AC_UNCOVERED`           | `error`           | An acceptance criterion has no automated or manual test coverage     |
| `PLAN_ROLE_DRIFT`             | `error`           | Planned role/actor does not match requirement definition             |
| `PLAN_AUTH_DRIFT`             | `error`           | Planned auth state does not match requirement definition             |
| `PLAN_EXPECTATION_DRIFT`      | `warning`/`error` | Planned assertion contradicts or drops requirement expectation       |
| `PLAN_UNREVIEWED_ASSUMPTION`  | `warning`         | Plan contains assertion with `planner-assumption` provenance         |
| `PLAN_STALE_REQUIREMENT`      | `error`           | Plan `sourceRequirementHash` does not match current requirement hash |
| `PLAN_EPHEMERAL_REF_DETECTED` | `error`           | Plan persisted ephemeral browser/MCP runtime element references      |
| `PLAN_INVALID_EXECUTION_MODE` | `error`           | Invalid execution mode or unsupported conversion                     |

---

## Staleness & System Diagnostics

| Code                           | Severity  | Description                                                     |
| ------------------------------ | --------- | --------------------------------------------------------------- |
| `SPEC_STALE`                   | `warning` | Spec hash is outdated relative to compiled requirement          |
| `TEST_STALE`                   | `warning` | Generated test file is outdated relative to test plan           |
| `TRACEABILITY_STALE`           | `warning` | Traceability index needs re-indexing                            |
| `WORKSPACE_PATH_DRIFT`         | `error`   | Hardcoded forbidden path literal detected in source code        |
| `CONTRACT_VERSION_UNSUPPORTED` | `error`   | Contract schema version is incompatible with current harness    |
| `TOOL_DEPRECATED`              | `warning` | Legacy tool invoked; migration to preferred v2 tool recommended |

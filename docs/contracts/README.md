# QA Kit Versioned Machine Contracts

This directory documents the versioned, canonical contracts used by the Playwright QA Kit harness and AI agent orchestration.

## Active Contract Versions

| Contract              | Schema Version           | Purpose                                                                          |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Requirement Contract  | `qa.requirement/v1`      | Compiled, structured requirement state derived from Markdown authoring           |
| Test Plan Contract    | `qa.test-plan/v1`        | Verified plan produced by Planner with assertion provenance and coverage mapping |
| Traceability Contract | `qa.traceability/v1`     | End-to-end trace graph from Requirement/AC down to test runs and evidence        |
| MCP Result Envelope   | `qa.mcp-result/v1`       | Deterministic MCP tool return format with typed diagnostics and provenance       |
| Selector Catalog      | `qa.selector-catalog/v1` | Persistent accessibility snapshots and semantic locator indexes                  |

## Related Documentation

- [`DIAGNOSTICS.md`](DIAGNOSTICS.md) — Comprehensive catalog of diagnostic error, warning, and info codes.
- [`REQUIREMENT-CONTRACT.md`](REQUIREMENT-CONTRACT.md) — Detailed fields of `RequirementContractV1`.
- [`TEST-PLAN-CONTRACT.md`](TEST-PLAN-CONTRACT.md) — Detailed fields of `TestPlanContractV1`.
- [`TRACEABILITY-CONTRACT.md`](TRACEABILITY-CONTRACT.md) — Detailed structure of `TraceabilityContractV1`.

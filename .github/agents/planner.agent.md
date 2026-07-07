# Planner Agent

## Role

You analyze requirement documents and convert them into structured, testable scenarios.

## Input Format

```json
{
  "requirementPath": "requirements/<feature-name>.md"
}
```

## Format Reference

Read [`requirements/_TEMPLATE.md`](../../requirements/_TEMPLATE.md) as the canonical format.
Example: [`requirements/example-login-extension.md`](../../requirements/example-login-extension.md).
Golden test plan: [`specs/example-login-extension-test-plan.md`](../../specs/example-login-extension-test-plan.md).

## MCP Dependencies

| MCP Server        | Tool Name                                                                               |
| ----------------- | --------------------------------------------------------------------------------------- |
| `playwright-qa`   | `validate_requirement`                                                                  |
| `playwright-qa`   | `normalize_requirements`                                                                |
| `playwright-qa`   | `parse_requirement_scenarios`                                                           |
| `playwright-qa`   | `list_artifacts`                                                                        |
| `playwright-qa`   | `discover_pages` (optional pre-crawl for public sites)                                  |
| `playwright-qa`   | `snapshot_page` (optional — capture selector catalog for a known URL)                   |
| `playwright-test` | `run_tests`                                                                             |
| `playwright`      | `browser_navigate`, `browser_snapshot`, `browser_take_screenshot` (optional UI explore) |

When planning scenarios for **new pages**, optionally inspect the live UI with `browser_navigate` + `browser_snapshot` before writing steps.

### Optional Pre-Crawl (Token-Efficient Discovery)

For public sites without authentication, prefer **`discover_pages`** over manual `browser_snapshot` exploration:

1. Call `discover_pages` with `rootUrl`, `featureName`, `maxDepth`, `excludePatterns`, and `respectRobots`.
2. Read the resulting `selector-catalog/<featureName>/page-map.json` to enumerate every URL, title, element count, and content hash.
3. For pages that need detailed steps, call `snapshot_page` for that specific URL to get the structured selector catalog.
4. **Skip** pages listed in `skipped[]` (login wall, robots disallow, exclude pattern). Document them in the spec as `@manual` if the requirement covers them.
5. Fall back to `browser_navigate` + `browser_snapshot` only when the catalog is stale (hash mismatch) or the page is authenticated.

## Seed and auth context

| Context                    | Seed                                                                      | Auth                                                                           | POM fixtures                                                                                   |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Template core (`npm test`) | `src/tests/seed.spec.ts` — generic `page.goto(BASE_URL)`, unauthenticated | Root [`playwright.config.ts`](../../playwright.config.ts) has no setup project | Empty [`project.fixture.ts`](../../src/fixtures/project.fixture.ts) until fork fills it        |
| ERPKU reference adapter    | Same seed for Generator traceability                                      | `npm run test:erpku-example` — setup project + `.auth/user.json`               | [`example/erpku/fixtures/project.fixture.ts`](../../example/erpku/fixtures/project.fixture.ts) |

- **Generated tests** always land in `src/tests/<name>.spec.ts` with `@/fixtures/base.fixture`.
- **ERPKU login flows** in `example/erpku/tests/` are reference specs — not Generator output targets.

Prefer seed-test context over raw navigation when exploring UI for planning.

### MCP environment overrides

Set in `environments/local.env` when targeting the ERPKU adapter or a custom test root:

- `PLAYWRIGHT_TEST_ROOT` — default `src/tests` (Generator output)
- `PLAYWRIGHT_CONFIG` — default `playwright.config.ts`; use `example/erpku/playwright.config.ts` for adapter runs
- Healer pre-flight (`health_check`) resolves JSON results from `PLAYWRIGHT_CONFIG` (or `PLAYWRIGHT_RESULTS_JSON` override)

See [CUSTOM-MCP.md](../../CUSTOM-MCP.md) for MCP pipeline env details.

## Planner Workflow

### Pre-Planning: Feedback Loop (Ambiguity Detection)

Before generating a test plan, apply the feedback loop to ensure requirement clarity:

1. Call `normalize_requirements` with `requirementPath` to get a `NormalizedRequirement`.
2. Call `detectAmbiguity(normalizedRequirement)` from `src/agents/planner/feedback.ts`.
3. Evaluate the returned `AmbiguityReport.confidence` score:
   - **If confidence >= 0.7**: Proceed to planning (Step 4 onward). No clarification needed.
   - **If confidence < 0.7**: Route a `ClarificationRequest` to the QA engineer via structured output:
     - Call `requestClarification(report)` from `src/agents/planner/clarification.ts`.
     - Output the `ClarificationRequest` as structured JSON in the response so the orchestrator can route it to the QA engineer.
     - **Halt planning** and wait for clarification response or timeout.
4. **Timeout fallback (300 seconds)**: If no clarification is received within 300 seconds, call `handleClarificationTimeout(report)` from `src/agents/planner/clarification.ts`. This proceeds with the original requirement and attaches unresolved ambiguities as warnings in the plan output.

### Planning Steps

5. Call `validate_requirement` with `requirementPath`. Fix all `error` severity violations before continuing.
6. Call `parse_requirement_scenarios` with `requirementPath` for structured scenarios.
7. Run `run_tests` (playwright-test) scoped to `src/tests/seed.spec.ts` (template bootstrap — unauthenticated, no auth setup in root config).
8. Optionally inspect target pages with `browser_navigate` + `browser_snapshot` when UI context is needed.
9. Map each scenario to a table row:
   - Prefix `Steps` with `Given: <precondition>` when `precondition` is present.
   - Prefix `Steps` with auth context from `metadata.authState` when no per-scenario precondition exists.
   - Mark `automatable: false` scenarios with `@manual` in plan notes.

### Post-Planning: Test Plan Validation

10. After generating the test plan, call `validateTestPlan(plan)` from `src/agents/planner/plan-validator.ts` as a post-planning validation step.
11. Evaluate the `PlanValidationResult.status`:
    - **"valid"**: Plan is ready. Proceed to save and output.
    - **"warnings"**: Plan has non-blocking issues. Log warnings, include them in output metadata, and proceed.
    - **"invalid"**: Plan has errors. Attempt to fix auto-fixable issues (where `autoFixable: true`). For non-auto-fixable errors, report them back to the orchestrator for QA review.
12. If `coverageGaps` is non-empty, add a "Coverage Gaps" section to the plan output listing uncovered acceptance criteria.
13. Save output to:
    - `specs/<feature-name>-test-plan.md`

## Output Format (Mandatory)

Output must use this **hybrid** structure (Playwright Test Agents + scenario table):

```markdown
# <Feature Title> Test Plan

**Seed:** `src/tests/seed.spec.ts`
**Requirement:** `requirements/<feature-name>.md`

## Application Overview

(Brief context from requirement metadata, acceptance criteria, and optional browser_snapshot.)

## Test Scenarios

### SC-01: <scenario title>

**Seed:** `src/tests/seed.spec.ts`

| Scenario Name | Steps | Expected Result |
| ------------- | ----- | --------------- |
| SC-01: ...    | ...   | ...             |

### SC-02: <scenario title>

**Seed:** `src/tests/seed.spec.ts`

| Scenario Name | Steps | Expected Result |
| ------------- | ----- | --------------- |
| SC-02: ...    | ...   | ...             |
```

Rules:

- Keep one scenario per table row (one row per `### SC-XX` section).
- `Steps` can be numbered or semicolon-separated but must be explicit and executable.
- `Expected Result` must be observable/assertable.
- Mark CAPTCHA or non-automatable flows as `@manual` in the plan notes or scenario title.
- Repeat the **Seed** line under each scenario group for Generator traceability.

## Example Prompt

- "Plan test scenarios from `requirements/example-login-extension.md` and save to `specs/example-login-extension-test-plan.md`."

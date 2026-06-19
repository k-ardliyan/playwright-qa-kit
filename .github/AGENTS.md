# AGENTS Governance

This document defines governance for framework agents:

- `orchestrator`
- `planner`
- `generator`
- `healer`

## Requirement Template

All requirement files must follow [`requirements/_TEMPLATE.md`](../requirements/_TEMPLATE.md).
QA documentation: [`docs/GUIDE.md`](../docs/GUIDE.md), [`docs/writing-requirements.md`](../docs/writing-requirements.md).

## MCP Servers (three-server hybrid)

| Server            | Command                                                        | Role                                            |
| ----------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `playwright`      | `npx -y @playwright/mcp@0.0.76 --headless`                     | Browser exploration (`browser_*` tools)         |
| `playwright-test` | `npx tsx scripts/playwright-test-mcp-launch.ts`                | Execute tests (`run_tests`, etc.)               |
| `playwright-qa`   | `node mcp-server/dist/index-mcp.js` (env bootstrap at startup) | Requirements, validation, failure/summary reads |

Configure all three in [`.vscode/mcp.json`](../.vscode/mcp.json). Build custom QA server: `npm run mcp:build`.

**Branch protection:** require CI workflow `Quality Gate` on PRs. E2E workflow runs on push to main / manual dispatch (needs GitHub Secrets).

**Generated tests:** must include `@ui`, `@regression`, and traceability headers (`// spec:`, `// seed:`). Demo/healer specs use `@demo` and are excluded from default `npm test`.

## 1) Orchestrator Agent

### Role Description

Coordinates the full pipeline:
**Pre-flight → Validate → Plan → Generate → Execute → Heal → Report**.

### Input Format

```json
{
  "requirementPath": "requirements/<feature-name>.md"
}
```

### Output Format

```json
{
  "summary": {
    "scenariosPlanned": 0,
    "testsGenerated": 0,
    "testsPassing": 0,
    "testsFailing": 0,
    "testsHealed": 0
  },
  "unresolvedFailures": [
    {
      "stage": "planner | generator | healer",
      "errorMessage": "..."
    }
  ]
}
```

### MCP Tools Consumed

- `playwright-qa`: `health_check`, `validate_requirement`, `normalize_requirements`, `parse_requirement_scenarios`, `validate_generated_tests`, `get_test_failures`, `get_test_summary`, `list_artifacts`, `snapshot_page`, `discover_pages`
- `playwright-test`: `run_tests`
- `playwright`: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_wait_for`, `browser_take_screenshot`; see root [`AGENTS.md`](../AGENTS.md)

### Example Prompt

- "Run pipeline for `requirements/example-login-extension.md` and include unresolved failures."

---

## 2) Planner Agent

### Role Description

Transforms requirement files into structured scenario plans.

### Input Format

```json
{
  "requirementPath": "requirements/<feature-name>.md"
}
```

### Output Format

Hybrid Markdown test plan written to:
`specs/<feature-name>-test-plan.md`

Includes Application Overview, per-scenario `### SC-XX` sections, **Seed:** `src/tests/seed.spec.ts`, and a table per scenario with columns:

- `Scenario Name`
- `Steps`
- `Expected Result`

Golden sample: [`specs/example-login-extension-test-plan.md`](../specs/example-login-extension-test-plan.md).

### MCP Tools Consumed

- `playwright-qa`: `validate_requirement`, `normalize_requirements`, `parse_requirement_scenarios`, `list_artifacts`, `discover_pages`, `snapshot_page`
- `playwright-test`: `run_tests` (seed bootstrap: `src/tests/seed.spec.ts`)
- `playwright`: `browser_navigate`, `browser_snapshot`

### Example Prompt

- "Plan tests from `requirements/example-login-extension.md` and write `specs/example-login-extension-test-plan.md`."

---

## 3) Generator Agent

### Role Description

Converts planner scenario tables into Playwright TypeScript test files.

### Input Format

Planner table with columns:

- `Scenario Name`
- `Steps`
- `Expected Result`

### Output Format

- Generated files under `src/tests/`
- Mapping of scenario → file
- Skipped scenarios with reason

### MCP Tools Consumed

- `playwright-qa`: `validate_generated_tests`, `snapshot_page` (catalog reuse)
- `playwright-test`: `run_tests` (live verification loop, iterate until pass)
- `playwright`: `browser_navigate`, `browser_snapshot`

Generated files must include `// spec:` and `// seed:` traceability headers (see generator agent).

### Metadata Mapping

See [`.github/agents/generator.agent.md`](agents/generator.agent.md) for `metadata` → `test.describe` / `test.use` / `test.skip` mapping rules.

### Example Prompt

- "Generate tests from `specs/example-login-extension-test-plan.md` into `src/tests/login-empty-fields.spec.ts`."

---

## 4) Healer Agent

### Role Description

Diagnoses and repairs failing tests using structured failure payloads.

### Input Format

```json
{
  "failures": [
    {
      "file": "src/tests/example.spec.ts",
      "lineNumber": 42,
      "errorMessage": "Timeout 30000ms exceeded...",
      "tracePath": "optional",
      "screenshotPath": "optional"
    }
  ]
}
```

### Output Format

```json
{
  "fixes": [
    {
      "file": "src/tests/example.spec.ts",
      "updatedContent": "..."
    }
  ],
  "cannotFix": [
    {
      "file": "src/tests/other.spec.ts",
      "reason": "Missing reproducible selector context"
    }
  ]
}
```

### MCP Tools Consumed

- `playwright-qa`: `get_test_failures`, `validate_generated_tests`
- `playwright-test`: `run_tests`
- `playwright`: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_wait_for`, `browser_take_screenshot`; see root [`AGENTS.md`](../AGENTS.md)

### Example Prompt

- "Heal failures from `get_test_failures`, validate, and re-run affected specs."

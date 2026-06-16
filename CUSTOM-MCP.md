# CUSTOM-MCP

Authoritative documentation for MCP servers and custom QA tools in this repository.

**Tim QA:** mulai dari [docs/GUIDE.md](docs/GUIDE.md). Dokumen ini untuk maintainer framework dan referensi kontrak tool — jangan duplikasi schema di dokumen QA.

**Agent pipeline:** entry point Codex di root [`AGENTS.md`](AGENTS.md); governance ringkas di [`.github/AGENTS.md`](.github/AGENTS.md); sub-agent per fase di [`.github/agents/`](.github/agents/).

## MCP Server Installation

Register and use these **three** servers (configured in [`.vscode/mcp.json`](.vscode/mcp.json)):

1. **Playwright MCP** (`playwright`) — browser automation for Planner/Generator
   - Command: `npx -y @playwright/mcp@0.0.76 --headless`

2. **Playwright Test MCP** (`playwright-test`) — run and debug tests
   - Launcher: `npx tsx scripts/playwright-test-mcp-launch.ts` (loads `environments/local.env`, honors `PLAYWRIGHT_CONFIG`)
   - Requires `@playwright/test` >= 1.56

3. **Custom QA MCP** (`playwright-qa`) — project-specific QA tools
   - Build: `npm run mcp:build`
   - Run: `node mcp-server/dist/index-mcp.js` (bootstraps env at startup via `mcp-env-bootstrap.ts`)

### Playwright profile seam

Both `playwright-test` and `playwright-qa` read **`PLAYWRIGHT_CONFIG`** from `environments/{APP_ENV}.env` after bootstrap. Default: `playwright.config.ts`. For Reference Adapter runs:

```bash
PLAYWRIGHT_CONFIG=example/erpku/playwright.config.ts
```

Set in `environments/local.env`, then **restart MCP servers** in the IDE.

Bootstrap module: [`mcp-server/src/utils/mcp-env-bootstrap.ts`](mcp-server/src/utils/mcp-env-bootstrap.ts) — also used by [`scripts/health-check-cli.ts`](scripts/health-check-cli.ts) and [`scripts/playwright-test-mcp-launch.ts`](scripts/playwright-test-mcp-launch.ts).

### Optional: Playwright MCP capability flags

Default install uses core browser tools only. Power users can enable extra capabilities via args in [`.vscode/mcp.json`](.vscode/mcp.json):

```json
"args": ["-y", "@playwright/mcp@0.0.76", "--headless", "--caps=network"]
```

| Flag              | Enables                                     |
| ----------------- | ------------------------------------------- |
| `--caps=network`  | `browser_network_requests`, request routing |
| `--caps=devtools` | DevTools-oriented tooling                   |
| `--caps=vision`   | Coordinate-based mouse interactions         |

See [Playwright MCP configuration](https://github.com/microsoft/playwright-mcp) for full capability list.

## Running the Custom QA MCP Server

- **Stdio (IDE)**: `node mcp-server/dist/index-mcp.js`
- **HTTP (legacy/testing)**: `npm run mcp:dev` in `mcp-server/` or `node mcp-server/dist/index.js` on port `3100`

---

## Tool: `health_check`

Verifies Node, Playwright packages, MCP build, environment files, and optional `test-results/results.json`.

### Input

```json
{}
```

### Output

```json
{
  "status": "success",
  "checks": [{ "name": "node", "status": "ok", "message": "..." }],
  "message": "All required health checks passed."
}
```

---

## Tool: `normalize_requirements`

Parses requirement markdown into a structured contract (acceptance criteria, metadata, optional scenarios, tags).

Template reference: [`requirements/_TEMPLATE.md`](requirements/_TEMPLATE.md).

### Input

```json
{
  "requirementsText": "# Feature\n## Metadata\n- **Tags:** #auth\n## Kriteria Penerimaan\n- ..."
}
```

### Output

```json
{
  "status": "success",
  "contract": {
    "id": "REQ-01",
    "title": "...",
    "acceptanceCriteria": [{ "id": "AC-1", "description": "..." }],
    "scenarios": [
      {
        "id": "SC-1",
        "name": "...",
        "steps": ["..."],
        "expectedResult": "...",
        "precondition": "optional",
        "automatable": true
      }
    ],
    "tags": ["auth"],
    "metadata": {
      "tags": ["auth", "ui"],
      "priority": "medium",
      "authState": "unauthenticated",
      "startPage": "/login",
      "pomFixtures": ["loginPage"]
    }
  }
}
```

---

## Tool: `parse_requirement_scenarios`

Extracts `###` scenarios with step/result sections from markdown.

**Indonesian labels:** `**Langkah:**`, `**Hasil:**`, `**Prekondisi:**`

**English aliases:** `**Steps:**`, `**Expected Result:**`, `**Precondition:**`, `**Given:**`

Scenarios with `(@manual)` in the heading return `automatable: false`.

### Input

```json
{
  "requirementPath": "requirements/example-login-extension.md"
}
```

Or:

```json
{
  "requirementsText": "### 1. Happy path\n**Langkah:**\n1. ..."
}
```

### Output

```json
{
  "status": "success",
  "scenarios": [
    {
      "id": "SC-1",
      "name": "Sukses Reset Password",
      "steps": ["..."],
      "expectedResult": "...",
      "precondition": "optional",
      "automatable": true
    }
  ],
  "message": "Parsed N scenario(s)."
}
```

---

## Tool: `validate_requirement`

Validates requirement markdown structure before the Planner runs. Returns a score and violation list.

### Input

```json
{
  "requirementPath": "requirements/example-login-extension.md"
}
```

Or:

```json
{
  "requirementsText": "# REQ-01: Feature\n..."
}
```

### Output

```json
{
  "status": "success",
  "score": 95,
  "violations": [
    {
      "ruleName": "observable_result",
      "severity": "warn",
      "message": "...",
      "scenarioName": "optional"
    }
  ],
  "message": "Passed with 1 warning(s). Score: 95/100."
}
```

---

## MCP pipeline environment overrides

Optional variables in `environments/{APP_ENV}.env` (read by the playwright-qa MCP server process):

| Variable                            | Default                              | Purpose                                                                                            |
| ----------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `PLAYWRIGHT_TEST_ROOT`              | `src/tests`                          | Root for `list_artifacts` tests and bulk `validate_generated_tests` scan                           |
| `PLAYWRIGHT_CONFIG`                 | `playwright.config.ts`               | Active Playwright config; validated by `health_check`; set in `.vscode/mcp.json` args or local env |
| `PLAYWRIGHT_RESULTS_JSON`           | _(derived from config)_              | Override JSON reporter path for Healer / `get_test_failures` fallback                              |
| `PLAYWRIGHT_ADAPTER_TEST_ROOT`      | `example/erpku/tests`                | Adapter spec allowlist + traceability exempt prefix for `validate_generated_tests`                 |
| `PLAYWRIGHT_ADAPTER_CONFIG`         | `example/erpku/playwright.config.ts` | Adapter config key for JSON results mapping when `PLAYWRIGHT_CONFIG` points at adapter             |
| `PLAYWRIGHT_ADAPTER_FIXTURE_IMPORT` | `@erpku/fixtures/base.fixture`       | Required import path for specs under adapter test root                                             |
| `PLAYWRIGHT_ADAPTER_RESULTS_JSON`   | `test-results/erpku-results.json`    | JSON reporter output when adapter config is active (unless `PLAYWRIGHT_RESULTS_JSON` set)          |

**Config → JSON mapping** (when `PLAYWRIGHT_RESULTS_JSON` is unset): uses `PLAYWRIGHT_ADAPTER_CONFIG` and `PLAYWRIGHT_ADAPTER_RESULTS_JSON` defaults (ERPKU reference values above).

`health_check` validates that `PLAYWRIGHT_CONFIG` points to an existing file and warns when the matching JSON results file is missing.

**ERPKU adapter profile example:**

```bash
PLAYWRIGHT_CONFIG=example/erpku/playwright.config.ts
PLAYWRIGHT_TEST_ROOT=example/erpku/tests
```

Single-file `validate_generated_tests` accepts paths under `PLAYWRIGHT_TEST_ROOT` or `PLAYWRIGHT_ADAPTER_TEST_ROOT`.

**Forks that delete `example/erpku/`:** unset or replace all `PLAYWRIGHT_ADAPTER_*` vars if you add a different reference adapter, or leave defaults unused if you have no adapter specs.

---

## Tool: `list_artifacts`

Lists files under allowed paths: `requirements/*.md`, `specs/*.md`, and generated tests under `PLAYWRIGHT_TEST_ROOT` (default `src/tests/`).

### Input

```json
{}
```

---

## Tool: `validate_generated_tests`

Validates `.spec.ts` files for fixture import (`@/fixtures/base.fixture` for generator output; `@erpku/fixtures/base.fixture` for adapter specs), `test.describe`, `test.step`, and traceability headers (exempt: seed, demo, example adapter).

Bulk scan root: `PLAYWRIGHT_TEST_ROOT` env (default `src/tests`).

### Input

```json
{}
```

Or single file:

```json
{
  "filePath": "example/erpku/tests/ui/auth/login.spec.ts"
}
```

---

## Tool: `get_test_failures`

Resolves Playwright JSON results in this order:

1. **`getJsonResultsPath()`** — config-aware path from `PLAYWRIGHT_CONFIG` / `PLAYWRIGHT_RESULTS_JSON`
2. Latest `.json` by mtime under `resultsDir` (default `test-results/`)
3. Legacy `test-results/results.json` fallback

### Input

```json
{
  "resultsDir": "test-results"
}
```

### Output

```json
{
  "status": "success",
  "failures": [
    {
      "testTitle": "...",
      "filePath": "src/tests/...",
      "errorMessage": "...",
      "duration": 0,
      "lineNumber": 42,
      "tracePath": "optional",
      "screenshotPath": "optional"
    }
  ],
  "sourceFile": "test-results/results.json",
  "message": "..."
}
```

---

## Tool: `get_test_summary`

Reads `reports/test-summary.json` from the custom reporter.

### Input

```json
{}
```

---

## Agent pipeline checklist

1. `health_check` (playwright-qa)
2. `validate_requirement` — fix errors before planning
3. `parse_requirement_scenarios` + `normalize_requirements` (Planner)
4. Generate specs under `src/tests/` + `validate_generated_tests`
5. `run_tests` (playwright-test) — writes `test-results/results.json` via JSON reporter
6. `get_test_failures` → Healer → `validate_generated_tests` → `run_tests` (scoped)
7. `get_test_summary` (Report)

## CI tool matrix

| Tool / script                                   | `quality.yml` (PR)   | `e2e.yml` (main/manual) | Agent pre-flight |
| ----------------------------------------------- | -------------------- | ----------------------- | ---------------- |
| `npm run health:check` / `health_check`         | yes                  | optional                | yes              |
| `validate_requirement`                          | example file via CLI | no                      | yes              |
| `validate_generated_tests` / `npm run validate` | yes                  | no                      | yes              |
| `npm run test:property`                         | yes                  | no                      | no               |
| `get_test_failures`                             | no                   | post-fail               | yes              |
| `parse_requirement_scenarios`                   | via property tests   | no                      | planner          |
| `run_tests`                                     | no                   | yes                     | yes              |

CLI wrappers: `npm run validate`, `npm run validate:requirement`, `npm run health:check`.

## Governance Rule

When any MCP tool is added or changed:

1. Update `mcp-server/src/` implementation.
2. Update this `CUSTOM-MCP.md`.
3. Update `.github/agents/*.agent.md` and `.github/AGENTS.md` if agents consume the tool.

`CUSTOM-MCP.md` is the authoritative reference for **playwright-qa** tool contracts.

# CUSTOM-MCP

Authoritative documentation for MCP servers and custom QA tools in this repository.

**Tim QA:** mulai dari [docs/GUIDE.md](docs/GUIDE.md). Dokumen ini untuk maintainer framework dan referensi kontrak tool — jangan duplikasi schema di dokumen QA.

## MCP Server Installation

Register and use these **three** servers (configured in [`.vscode/mcp.json`](.vscode/mcp.json)):

1. **Playwright MCP** (`playwright`) — browser automation for Planner/Generator
   - Command: `npx -y @playwright/mcp@latest --headless`

2. **Playwright Test MCP** (`playwright-test`) — run and debug tests
   - Command: `npx playwright run-test-mcp-server -c playwright.config.ts`
   - Requires `@playwright/test` >= 1.56

3. **Custom QA MCP** (`playwright-qa`) — project-specific QA tools
   - Build: `npm run mcp:build`
   - Run: `node mcp-server/dist/index-mcp.js`

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

## Tool: `list_artifacts`

Lists files under allowed paths: `requirements/*.md`, `specs/*.md`, `src/tests/**/*.spec.ts`.

### Input

```json
{}
```

---

## Tool: `validate_generated_tests`

Validates `.spec.ts` files for `@/fixtures/base.fixture`, `test.describe`, `test.step`, and `// spec:` / `// seed:` traceability headers (exempt: seed, smoke, legacy manual specs).

### Input

```json
{}
```

Or single file:

```json
{
  "filePath": "src/tests/ui/auth/login.spec.ts"
}
```

---

## Tool: `get_test_failures`

Reads failures from `test-results/results.json` (priority) or latest JSON under `test-results/`.

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

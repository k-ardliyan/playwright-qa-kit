# AGENTS Governance

This document defines governance for framework agents:

- `orchestrator`
- `planner`
- `generator`
- `healer`

## 1) Orchestrator Agent

### Role Description

Coordinates the full pipeline:
**Plan → Generate → Execute → Heal → Report**.

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

- `playwright-qa`
  - `normalize_requirements`
  - `get_test_failures`
- `playwright-test`
  - `run_tests`
- `playwright`
  - `navigate_to_url`
  - `get_page_content`
  - `take_screenshot`

### Example Prompt

- "Run pipeline for `requirements/customer-onboarding-v2.md` and include unresolved failures."

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

Markdown table written to:
`specs/<feature-name>-test-plan.md`

Required columns:

- `Scenario Name`
- `Steps`
- `Expected Result`

### MCP Tools Consumed

- `playwright-qa`
  - `normalize_requirements`
- `playwright`
  - `navigate_to_url`
  - `get_page_content`

### Example Prompt

- "Plan tests from `requirements/auth-session-timeout.md` and write `specs/auth-session-timeout-test-plan.md`."

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

- `playwright`
  - `navigate_to_url`
  - `get_page_content`

### Example Prompt

- "Generate tests from `specs/customer-export-test-plan.md` into `src/tests/ui/customer-export.spec.ts`."

---

## 4) Healer Agent

### Role Description

Diagnoses and repairs failing tests using structured failure payloads.

### Input Format

```json
{
  "failures": [
    {
      "file": "src/tests/ui/example.spec.ts",
      "lineNumber": 42,
      "errorMessage": "Timeout 30000ms exceeded..."
    }
  ]
}
```

### Output Format

```json
{
  "fixes": [
    {
      "file": "src/tests/ui/example.spec.ts",
      "updatedContent": "..."
    }
  ],
  "cannotFix": [
    {
      "file": "src/tests/ui/other.spec.ts",
      "reason": "Missing reproducible selector context"
    }
  ]
}
```

### MCP Tools Consumed

- `playwright`
  - `navigate_to_url`
  - `get_page_content`
  - `take_screenshot`

### Example Prompt

- "Heal failures returned by `get_test_failures` and provide `fixes` and `cannotFix`."

# Playwright QA Kit

Open-source-ready Playwright + TypeScript framework for AI-assisted test planning, generation, execution, healing, and reporting.

## Prerequisites

- Node.js `>=20`
- npm `>=9`
- Playwright `^1.60.0` (managed via `package.json`)
- Local MCP tooling:
  - `@playwright/mcp`
  - `run-test-mcp-server`
  - custom server in `mcp-server/`

See `CUSTOM-MCP.md` for full MCP setup and tool schemas.

---

## Architecture Overview

The framework is organized in layers:

1. **Agents** (`.github/agents/`)
   - `orchestrator`, `planner`, `generator`, `healer`
2. **MCP Servers**
   - `playwright`, `playwright-test`, `playwright-qa`
3. **Framework Core**
   - configuration, environment loader, logger
4. **Test Infrastructure**
   - fixtures, pages, reporter
5. **Tests**
   - UI/API/E2E test directories under `src/tests/`

MCP registration is defined in `.vscode/mcp.json`.

---

## `src/` Directory Layout

```text
src/
├── fixtures/
├── pages/
│   ├── ui/
│   └── api/
├── shared/
│   ├── mock-data/
│   ├── types/
│   └── utils/
├── support/
├── tests/
│   ├── ui/
│   ├── api/
│   └── e2e/
└── utils/
```

Additional top-level folders:

- `requirements/` → versioned requirement inputs for planner
- `specs/` → generated test-plan outputs
- `example/erpku/` → ERPku-specific sample implementation

---

## Installation

```bash
npm install
npx playwright install --with-deps chromium
```

### Branding & Customization Quickstart

After cloning this framework for your own project:

1. Update `package.json` metadata (`name`, `description`, `keywords`) to match your organization.
2. Update environment values in `environments/*.env` and set `APP_ENV` per target.
3. Replace sample app references under `example/erpku/` with your own app-specific implementation.
4. Override sample data helpers when needed (for example `uniqueEmail()` default domain in `src/shared/utils/factories.ts`).

---

## Multi-Environment Setup

Environment files are loaded from `environments/` through `src/utils/env-loader.ts`.

Set active environment with `APP_ENV` (defaults to `local` if not specified):

**POSIX (macOS/Linux):**

```bash
APP_ENV=local npm test
APP_ENV=staging npm test
```

**Windows PowerShell:**

```powershell
$env:APP_ENV="local"; npm test
$env:APP_ENV="staging"; npm test
```

**Windows Command Prompt (CMD):**

```cmd
set APP_ENV=local&& npm test
set APP_ENV=staging&& npm test
```

If `APP_ENV` is missing or unknown, loader falls back to `local` with warning.

---

## Running Tests

```bash
# Full suite
npm test

# Smoke only
npm run test:smoke

# Headed
npm run test:headed

# UI mode
npm run test:ui

# Debug mode
npm run test:debug
```

Reports:

- Native Playwright: `reports/html`
- Custom dashboard: `reports/custom-dashboard.html`
- Summary JSON: `reports/test-summary.json`

---

## Orchestrator Pipeline Usage

The orchestrator agent runs:

**Plan → Generate → Execute → Heal → Report**

Typical flow:

1. Create requirement file in `requirements/` (for example `requirements/customer-export.md`).
2. Invoke orchestrator agent with:

```json
{
  "requirementPath": "requirements/customer-export.md"
}
```

3. Planner writes `specs/<feature>-test-plan.md`.
4. Generator produces tests in `src/tests/`.
5. Execution + healing + report summary are returned by orchestrator.

Agent governance is documented in `.github/AGENTS.md`.

---

## Getting Started for New Projects

To adapt this framework to another application:

1. **Update environment files** in `environments/` with your app URLs and credentials.
2. **Set JIRA constants** in `src/utils/configuration.ts`:
   - `JIRA_CONSTANTS.domain`
   - `JIRA_CONSTANTS.projectKey`
   - `JIRA_CONSTANTS.bugIssueTypeId`
3. **Add requirement files** under `requirements/`.
4. Run planner/generator pipeline to create test plans and tests.
5. Move app-specific examples from `example/` into your own target domain structure.

---

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run validate
```

Pre-commit hooks (Husky + lint-staged) run formatting/linting and validator checks before commit.

---

## Useful Documents

- `.github/AGENTS.md` → agent governance
- `CUSTOM-MCP.md` → MCP server/tool contracts
- `MAINTENANCE.md` → maintenance playbook
- `.kiro/specs/playwright-ai-agent-framework/` → requirement/design/tasks trace

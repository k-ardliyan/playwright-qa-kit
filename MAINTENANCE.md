# MAINTENANCE

Operational guide for maintaining the Playwright AI Agent Framework.

## 1) Add a New Environment File

1. Create a new file in `environments/` (for example `staging.env` or `uat.env`).
2. Keep the same key set used by existing environment templates.
3. Set `APP_ENV=<name>` when running tests.
4. Ensure `src/utils/env-loader.ts` recognizes the environment name (or gracefully falls back to `local`).
5. Document usage in `README.md` if this environment is intended for contributors.

Checklist:

- [ ] File exists under `environments/`
- [ ] Required keys are present
- [ ] `APP_ENV` run tested locally

---

## 2) Add a New `TAGS` Enum Value

1. Open `src/utils/configuration.ts`.
2. Add enum entry to `TAGS`.
3. Use the new tag in generated/manual tests where relevant.
4. Update docs that mention supported tags (README or agent guidance).

Example:

```ts
export enum TAGS {
  SMOKE = '@smoke',
  REGRESSION = '@regression',
  API = '@api',
  UI = '@ui',
  E2E = '@e2e',
  SECURITY = '@security',
}
```

---

## 3) Register a New MCP Tool

1. Implement the tool in `mcp-server/src/tools/`.
2. Register in **`mcp-server/src/tools/dispatch.ts`** (`dispatchTool` + `MCP_TOOL_DEFINITIONS`).
3. HTTP route is wired automatically via `mcp-server/src/index.ts`; stdio via `index-mcp.ts`.
4. Add/adjust helper utilities in `mcp-server/src/utils/` if needed.
5. Rebuild and verify:
   - `npx tsc -p mcp-server/tsconfig.json --noEmit`
6. Update documentation **before** marking complete:
   - `CUSTOM-MCP.md` (tool name, input schema, output schema, example invocation)
   - `.github/agents/*.agent.md` if an agent uses the new tool

Checklist:

- [ ] Tool endpoint implemented
- [ ] Tool appears in relevant agent dependencies
- [ ] `CUSTOM-MCP.md` updated

---

## 4) Update Reporter for a New Field

When a new reporting field is needed (for HTML or `reports/test-summary.json`):

1. Update data model in `src/support/custom-reporter.ts`.
2. Populate field in collection phase (`onTestEnd` / `onEnd`).
3. Render field in local and/or CI HTML mode.
4. Include field in `reports/test-summary.json` if required.
5. Update reporter property tests in `custom-reporter.property.ts`.

Recommended verification:

````bash
npx tsc --noEmit
npm run validate
```bash
npx tsx src/tests/property/custom-reporter.property.ts
````

````

---

## 5) Add a Field to the Requirement Template

When extending the QA requirement template (`requirements/_TEMPLATE.md`):

1. Add the field to the template with a short comment explaining its purpose.
2. Update parser in `mcp-server/src/tools/normalize-requirements.ts` (for `## Metadata` fields) or `parse-requirement-scenarios.ts` (for per-scenario fields).
3. Update `mcp-server/src/tools/validate-requirement.ts` if the field should be enforced.
4. Update `CUSTOM-MCP.md` output schema.
5. Update `.github/agents/planner.agent.md` and `generator.agent.md` mapping rules if agents consume the field.
6. Add a property test case in `src/tests/property/normalize-requirements.property.ts`.

QA-facing docs: update [docs/GUIDE.md](docs/GUIDE.md) if workflow changes for tim QA.

Checklist:

- [ ] Template updated
- [ ] Parser reads new field
- [ ] Validation rule added (if required)
- [ ] Agent docs updated
- [ ] Property test passes

---

## 6) Sync Agent Definitions with Playwright `init-agents`

Custom agents live in `.github/agents/` and extend the official [Playwright Test Agents](https://playwright.dev/docs/test-agents) with orchestrator + `playwright-qa` requirement pipeline. Do **not** replace them wholesale with `init-agents` output.

When upgrading `@playwright/test`:

1. Note the current version: `npx playwright --version`.
2. Generate upstream reference into a temp folder (do not overwrite repo agents):

   **Codex (primary):**

   ```bash
   # Bash
   ./scripts/sync-init-agents.sh

   # Windows PowerShell
   ./scripts/sync-init-agents.ps1
   ```

   Or manually:

   ```bash
   mkdir -p .tmp/init-agents-codex
   cd .tmp/init-agents-codex
   npx playwright init-agents --loop=codex
   ```

   **Optional cross-check (VS Code loop):**

   ```bash
   mkdir -p .tmp/init-agents-vscode
   cd .tmp/init-agents-vscode
   npx playwright init-agents --loop=vscode
   ```

3. Diff upstream planner/generator/healer against:
   - `.github/agents/planner.agent.md`
   - `.github/agents/generator.agent.md`
   - `.github/agents/healer.agent.md`
   - `.github/agents/orchestrator.agent.md` (stub → root `AGENTS.md`)
   - root `AGENTS.md` (Orchestrator canonical — merge selectively, do not replace)
4. Merge useful upstream changes only:
   - new MCP tool names or browser interaction patterns,
   - seed-run / live-verify / run-until-pass workflow hints,
   - spec output structure improvements.
5. Preserve framework-specific content:
   - root [`AGENTS.md`](AGENTS.md) (Orchestrator canonical) and [`.github/agents/orchestrator.agent.md`](.github/agents/orchestrator.agent.md) (stub pointer), [`.github/AGENTS.md`](.github/AGENTS.md) governance,
   - `playwright-qa` tools (`validate_requirement`, `parse_requirement_scenarios`, etc.),
   - `requirements/` → `specs/` → `src/tests/` paths and Indonesian QA template,
   - hybrid `playwright-cli` + MCP live verification in Generator.
6. Update golden sample if planner format changes: `specs/example-login-extension-test-plan.md`.
7. Rebuild MCP if validator rules changed: `npm run mcp:build`.
8. Verify:

   ```bash
   npm run test:quality
   ```

Checklist:

- [ ] Upstream `init-agents --loop=codex` diff reviewed
- [ ] Custom orchestrator + playwright-qa sections unchanged
- [ ] Golden test plan still valid
- [ ] Property tests pass

---

## Suggested Release Gate

Before merging maintenance changes:

```bash
npm run test:quality
```

Optional E2E (requires live app + secrets):

```bash
npm run test:ci
```

---

## Traceability Exempt Policy

Generated tests (Generator output) **must** include:

```ts
// spec: specs/<feature>-test-plan.md
// seed: src/tests/seed.spec.ts
```

Legacy manual specs are exempt via `TRACEABILITY_EXEMPT` in `mcp-server/src/tools/validate-generated-tests.ts`:

- `src/tests/seed.spec.ts`
- `src/tests/demo/healer-test.spec.ts`
- `example/erpku/tests/` (reference adapter — not Generator output)

Do not add new paths without maintainer review. Prefer `@legacy` tag automation in future.
````

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
2. Wire tool routing in `mcp-server/src/index.ts`.
3. Add/adjust helper utilities in `mcp-server/src/utils/` if needed.
4. Rebuild and verify server:
   - `npx tsc -p mcp-server/tsconfig.json --noEmit`
5. Update documentation **before** marking complete:
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

```bash
npx tsc --noEmit
npm run validate
npx tsx custom-reporter.property.ts
```

---

## Suggested Release Gate

Before merging maintenance changes:

```bash
npx tsc --noEmit
npx tsc -p mcp-server/tsconfig.json --noEmit
npm run validate
npm run lint
```

# Directory Map — Canonical Path Registry

> Satu tempat lookup untuk semua path di `src/`.
> **Aturan:** Setiap kali ada file baru di `src/`, update file ini di commit yang sama.
> Last updated: 2026-07-27

## src/ — Core Framework

| Path                                                  | Peran                                           | Entry Point                                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/agents/generator/`                               | Test code generator logic                       | `index.ts`                                                                                                           |
| `src/agents/healer/`                                  | Auto-heal failing tests                         | `index.ts`, `pattern-database.ts`                                                                                    |
| `src/agents/integration/`                             | Universal agent integration layer               | `orchestrator.ts`, `state.ts`, `protocol.ts`                                                                         |
| `src/agents/planner/`                                 | Scenario clarification + feedback               | `index.ts`                                                                                                           |
| `src/agents/reporter/`                                | Pipeline report builder + history + comparison  | `index.ts`, `report-builder.ts`, `report-archive.ts`, `report-history.ts`, `report-compare.ts`, `report-ai-query.ts` |
| `src/executor/`                                       | Test runner wrapper (multi-browser, sharding)   | `index.ts`                                                                                                           |
| `src/fixtures/`                                       | Playwright fixture chain                        | `base.fixture.ts` (re-export all)                                                                                    |
| `src/support/pw/`                                     | Low-level PW helpers + file/image/network       | `index.ts` ← always import from here                                                                                 |
| `src/support/custom-dashboard/`                       | KitaJS TSX report builder + styles + components | `build-dashboard-html.ts`, `domain/`, `pages/`, `components/`, `layouts/`, `styles/`, `renderer/`                    |
| `src/support/custom-dashboard/domain/`                | Reporting domain models & aggregates            | `run.ts`, `comparison.ts`, `dashboard.ts`, `dashboard-overview.ts`                                                   |
| `src/support/custom-dashboard/pages/`                 | Server & static TSX pages                       | `dashboard/`, `history/`, `compare/`, `report-detail/`                                                               |
| `src/support/custom-dashboard/components/data-table/` | Shared DataTable primitives                     | `DataTable.tsx`, `DataTableContainer.tsx`, `DataTableRow.tsx`, `index.ts`                                            |
| `src/support/custom-dashboard/components/navigation/` | Shared navigation components                    | `AppNav.tsx`, `Breadcrumb.tsx`, `index.ts`                                                                           |
| `src/support/custom-dashboard/components/shared/`     | Shared UI icon primitives and badges            | `icons.tsx`, `index.ts`                                                                                              |
| `src/support/auth.setup.ts`                           | Auth session materialization                    | —                                                                                                                    |
| `src/setup/`                                          | Setup wizard (interactive CLI)                  | `index.ts`, `wizard.ts`                                                                                              |
| `src/shared/types/`                                   | Shared TypeScript schemas                       | `index.ts` ← always import from here                                                                                 |
| `src/shared/mcp/`                                     | Playwright MCP browser intelligence subsystem   | `profile.ts`, `intent-router.ts`, `version.ts`, `origin-resolver.ts`                                                 |
| `src/shared/evidence/`                                | Evidence manifest & diagnostics layer           | `types.ts`, `manifest.ts`, `failure-classifier.ts`, `console-normalizer.ts`                                          |
| `src/shared/utils/`                                   | Shared utilities (credentials, redaction)       | `role-credentials.ts`, `factories.ts`, `redaction.ts`                                                                |
| `src/utils/`                                          | Framework-level utilities                       | `env-loader.ts`, `logger.ts`, `app-env.ts`, `configuration.ts`                                                       |
| `src/tests/`                                          | E2E spec files                                  | `*.spec.ts`                                                                                                          |
| `src/tests/demo/`                                     | Demo specs (no auth dependency)                 | Playwright project: `demo`                                                                                           |
| `src/tests/property/`                                 | Property-based unit tests                       | `*.property.ts`                                                                                                      |
| `src/tests/unit/`                                     | Unit tests                                      | `*.test.ts`                                                                                                          |
| `src/tests/seed.spec.ts`                              | Seeding test                                    | —                                                                                                                    |

## Project Root — Key Files

| Path                        | Peran                                         |
| --------------------------- | --------------------------------------------- |
| `playwright.config.ts`      | Main PW config                                |
| `playwright.config.base.ts` | Shared defaults + reporter factory            |
| `tsconfig.json`             | TS config — path alias `@/` → `src/`          |
| `AGENTS.md`                 | Orchestrator instructions (always-on context) |
| `CLAUDE.md`                 | Claude/Hermes instructions + RTK              |
| `CONTEXT.md`                | Domain glossary                               |
| `ARCHITECTURE.md`           | Architecture index (this project)             |

## Runtime Output (gitignored)

| Path                | Isi                                                          |
| ------------------- | ------------------------------------------------------------ |
| `.auth/{APP_ENV}/`  | Auth session files per role (`finance.json`, `user.json`, …) |
| `reports/`          | `pipeline-state.json`, HTML reports, `archive/<runId>/`      |
| `selector-catalog/` | ARIA snapshots: `<feature>/<page>.aria.yml` + `.json`        |
| `specs/`            | Planner output: `<feature>-test-plan.md`                     |
| `test-results/`     | PW raw output: traces, screenshots                           |

## Schemas

| Path                                                          | Schema untuk      |
| ------------------------------------------------------------- | ----------------- |
| `src/agents/integration/schemas/pipeline-request.schema.json` | Pipeline input    |
| `src/agents/integration/schemas/pipeline-state.schema.json`   | State persistence |

## Fixtures di `src/tests/` yang sering dicari

| Path                               | Isi                                                |
| ---------------------------------- | -------------------------------------------------- |
| `test-fixtures/`                   | Static files untuk upload (pdf, network contracts) |
| `test-fixtures/network/contracts/` | JSON response mocks per feature                    |
| `test-fixtures/pdf/`               | Sample PDF untuk assert content                    |

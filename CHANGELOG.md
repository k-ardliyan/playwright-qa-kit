# Changelog

All notable changes to Playwright QA Kit are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **Custom dashboard v2 → v3 triage board (Monitor/Operate)**
  - Full-width layout (no 1360px); sticky global command bar; **view toolbars sibling of `.report-layout`**
  - Table: multi-line Test Step / Input Data; full wrap (no ellipsis clamp); **SOURCE** Cause/Do/blurb + tooltip; Notes stack (time/ss/video/trace/badges)
  - Filter columns + pin sticky header / pin Test ID; export CTAs in incident alert; export follows **visible rows and columns**
  - Accordion: all cards **collapsed by default** (including failed); Filter steps; **Copy failure packet** only
  - **Evidence & reports** single collapsible card (default closed): per-kind file inventory + Related deep links
  - Fixed **dense** density (no Comfortable/Dense picker)
  - Preview: `scripts/preview-dashboard.ts` writes `reports/test-summary.json`; preview deep-links prefix `../`
  - Modules: `failure-source.ts` (blurb + tooltip), `filter-attrs.ts`, `export-helpers` dynamic columns; docs `REPORT-GUIDE.md` v0.3
  - MCP: `get_test_summary` exposes `runMeta` + `testCases[].failureSource`; `get_test_failures` enriches `failureSource`
  - Quality: `npm run test:unit` wired into `quality:check-rules`

### Removed

- **Jira integration** — `JIRA_CONSTANTS`, Create JIRA button, placeholder domain warn, `configuration.property` Jira checks
- **Dashboard poster panels** — Chart.js donut / Status distribution, Scan guide legend, Ops summary Mode/Unhealthy (duplikat hero)

### Changed

- **Safe dependency bumps (non-major, compatibility-preserving)**
  - Root: `@dotenvx/dotenvx` 2.14 → **2.17.2**, `prettier` 3.9.5 → **3.9.6**, `typescript-eslint` 8.64 → **8.65.0**
  - mcp-server: `@dotenvx/dotenvx` **2.17.2**; override `hono` 4.12.25 → **4.12.31** (security headers/jsx fixes via MCP SDK transitive)
  - Verified: typecheck, mcp:build, validate, validate:agents, network-assert unit/demo
  - **Not bumped (major / risk):** TypeScript 7, lint-staged 17, `@types/node` 26; Playwright 1.61 remains current latest; exceljs uuid advisory (fix would force exceljs 3.x break); `@hono/node-server` moderate (force would downgrade MCP SDK)

### Added

- **Network live assert capability** (`@network-assert`)
  - `src/support/pw/network-assert-core.ts` + `network-assert.ts` — pure redact/partial match/contract load; Playwright `waitForApi`, `assertNetworkContract`, `assertNetworkMatch`, `startNetworkRecorder`, `attachNetworkCapture`, optional `useHar`
  - Tag split: `@network` = mock only; `@network-assert` = live observe only (validator uses `@network(?!-assert)` so tags do not cross-match)
  - Fixtures: `test-fixtures/network/contracts/demo/submit-success.json` (demo token `QA-KIT-NETWORK-OK`)
  - Unit tests `npm run test:network-assert`; demo `src/tests/demo/demo-network-assert.spec.ts`
  - Validator capability rule + planner/generator/**healer** docs + recipe `docs/recipes/network-assert.md`
  - Sample requirement `requirements/auth/sample-network-assert.md`
  - Scenario-owned keys only — no domain schema patent; secrets redacted on capture
  - Prefer `waitAndAssertApi` one-shot with inline `assert` keys from Input Data; use `contract` file only when path is listed
  - Health check `network_assert`; validator accepts `waitAndAssertApi`
  - Recipe documents discover-then-freeze when QA does not know API path yet

- **File / PDF / Excel capability helpers** (scenario-driven content, fixture-first upload)
  - `src/support/pw/file-content-core.ts` + `files.ts` — magic bytes, `fixturePath`, `extractPdfText`, `readExcelSummary`, `downloadAndSave`, `uploadFixture`, `uploadViaChooser`, envelope/content asserts (`assertPdfContains`, `assertPdfMatches`)
  - `test-fixtures/` bank (demo tokens only: `QA-KIT-SAMPLE-PDF`, `ColA/B/C`)
  - Capability tags `@download` `@upload` `@file-content` + validator rules
  - MCP tools: `inspect_file`, `extract_pdf_text` (raw text only), `read_excel_summary`, `list_test_fixtures`
  - Demo `src/tests/demo/demo-file-capabilities.spec.ts`
  - `npm run sync:file-core` / auto-sync inside `mcp:build` (single source of truth for pure core)
  - Recipe `docs/recipes/multi-session-sync.md` for dual-context admin↔user
  - Content needles/headers always from the scenario — no patented business field schema
  - Docs/recipes: MANUAL-SCENARIOS, GUIDE, CHEATSHEET, `_TEMPLATE`, file-upload-download, pdf-excel-content-assert, multi-session-sync
  - Health check `file_content`; setup-check fixture bank; healer seeds for download/upload

- **Assisted human challenge (OTP / CAPTCHA) for auth session bootstrap**
  - `src/support/human-challenge.ts` — modes: `none` | `otp-browser` (primary) | `otp-stdin` | `captcha-browser` | `auto`
  - Wired into `src/support/auth.setup.ts` + generated `wizard-auth-template`
  - Setup wizard Phase 5 + `env:edit` for challenge mode (not raw-env-only)
  - Scripts: `npm run auth:setup`, `npm run auth:setup:headed`
  - Health check warns/fails on interactive mode under CI
  - CAPTCHA is browser-only (terminal rejected); CI forbids interactive modes
  - Scenario OTP/CAPTCHA remain `(@manual)` in pipeline (v1 = session assist only)
- **Playwright power helpers** (`src/support/pw/`):
  - `network-mock.ts` — `mockJson`, `mockServerError`, `mockAbort`, `unmockAll` (official `page.route`)
  - `api-seed.ts` — `apiJson`, `apiSeed`, `apiCleanup` (official `request` / `APIRequestContext`)
  - `aria-snapshot.ts` — `expectAriaMatchesCatalog`, `expectAriaSnapshot` (`toMatchAriaSnapshot`)
  - `soft-forms.ts` — `expectAllVisible`, `expectSoftFieldErrors` (`expect.soft`)
  - `visual.ts` — `expectVisual` / `expectPageVisual` (`toHaveScreenshot`)
  - `clock.ts` — `freezeTime` / `advanceTime` (`page.clock`)
  - `role-projects.ts` — `buildRoleProject` / `buildRoleProjects` for multi-role project matrix
- **`src/support/auth.setup.ts`** — template-core auth setup (safe empty state without credentials)
- **`playwright.cross-browser.config.ts`** — chromium + firefox + webkit via `buildMultiBrowserProjects`
- **`playwright.mobile.config.ts`** — Pixel 5 + iPhone 13 device projects
- **Demo** `demo-pw-power.spec.ts` + `demo-pw-power-extended.spec.ts` (`@demo @pw-power`)
- **Requirement** `requirements/sample-network-hybrid.md` (`@network` `@hybrid` `@aria`)
- **Capability tags** in requirements/planner/generator + **validator capability rules**
- **Healer** `ensurePowerSeedPatterns()` for network / hybrid / auth failures
- **Optional blob reporter** — `createFrameworkReporters({ includeBlob })` when `CI=true` and `PW_BLOB=1`
- **Nightly** `merge-blob-reports` + `cross-browser` job; **PR e2e** optional `shardCount` 1–4 + blob merge
- **Recipe** `docs/recipes/playwright.role-projects.recipe.ts`

### Changed

- Root `playwright.config.ts` — `chromium` now `dependencies: ['setup']`; default storage remains empty
- PR `e2e.yml` artifact path `reports/html/`; optional matrix shards
- Nightly shards upload `blob-report/` + merge via `playwright merge-reports`
- Generator/Planner/Healer agent instructions document official Playwright power patterns
- `requirements/_TEMPLATE.md` — capability scenario tags including `@download` `@upload` `@file-content` (scenario-owned content tokens)
- `docs/MANUAL-SCENARIOS.md` — upload not manual; PDF text automatable; PDF layout visual remains `@manual`; fixture-first not headed pause
- `docs/GUIDE.md` / `docs/CHEATSHEET.md` — file power features + `test-fixtures/` paths + restart `playwright-qa` after `mcp:build`
- `validate_generated_tests` — capability tag ↔ API usage enforcement (demo/seed exempt)

### Added (prior)

- **Table View dashboard** — custom dashboard now has a toggle between Accordion and Table view
  - General mode: flat 9-column table (Test ID, Description, Test Step, Input Data, Expected Result, Actual Result, Status, Priority, Notes)
  - Role-aware mode: table grouped per `ROLE: <role>` section header with row numbering reset per role
  - Layer badges in Notes column: `FE`, `BE`, `DB`, `API`
- **Export functions** — three export buttons on Table View toolbar:
  - Copy for Confluence (wiki markup table)
  - Copy Data (TSV — paste directly to Google Sheets)
  - Download CSV (RFC 4180 file download)
- **`test-metadata.ts`** — new helper module (`src/support/test-metadata.ts`)
  - `setTestMetadata()` — push table-view annotations at start of test
  - `captureActualResult()` — record actual result after assertions pass
- **Requirement format v2** — updated `requirements/_TEMPLATE.md` and examples with new per-scenario fields:
  - `- **Test ID:** \`TC-XXX-NNN\`` (required)
  - `**Hasil yang Diharapkan:**` replaces `**Hasil:**` (backward-compat preserved)
  - `- **Prioritas skenario:**` (optional, per-scenario override)
  - `- **Layer terdampak:**` (optional, FE/BE/DB/API)
  - `**Input Data:**` bullet list (optional, structured key: value)
- **`parse_requirement_scenarios` v2** — parser extracts `testId`, `priority`, `inputData`, `expectedResultFormatted`, `affectedLayer` per scenario
- **`types.ts` extensions** — `CollectedTestData` gains `testId`, `scenarioId`, `role`, `priority`, `inputData`, `expectedResult`, `actualResult`, `affectedLayer`; `TestSummary` gains `reportMode`, `rolesInScope`, `testCases[]`
- **Agent instruction updates**:
  - `planner.agent.md` — test plan table now includes Test ID, Priority, Input Data, Layer columns; role-aware mode groups under `## Role: <role>` headers
  - `generator.agent.md` — mandatory annotation block pattern with `setTestMetadata()` and `captureActualResult()` in every generated test
  - `reporter.agent.md` — `PipelineReport` JSON schema adds `testCases[]` array; markdown report adds Test Cases table section (flat for general, grouped for role-aware)

### Changed (prior)

- `custom-reporter.ts` — `onTestEnd()` now extracts 6 new annotation fields; `onEnd()` writes extended `TestSummary` including `testCases[]` to `test-summary.json`
- `build-local-html.ts` / `build-ci-html.ts` — dual panel (Accordion + Table) with ARIA-compliant toggle tabs
- `shared.ts` — inline JS toggle handler + export button event delegation added to document shell
- `styles.ts` — new CSS: view toggle, table layout, role section header (teal), priority badges, layer badges, actual result coloring, toolbar
- `get_test_summary` MCP tool — response now includes `testCases[]`, `reportMode`, `rolesInScope`
- `get_test_failures` MCP tool — `TestFailure` interface extended with `testId`, `role`, `priority`, `expectedResult`, `actualResult`

### Setup & Onboarding

- **Interactive setup wizard** (`scripts/setup-wizard.ts`, 7 phases): Welcome → Project Info → Credentials → Install → MCP+Hermes → Auth Setup → Verify+Encrypt → Next Steps
  - State resume via `.wizard-state.json` (Ctrl+C safe)
  - Generic auth setup template generated per role (`src/support/auth.setup.ts`)
- **Wizard CLI flags**:
  - `--dry-run` — preview without writing files or running commands
  - `--from-phase=N` — resume from specific phase (0-7)
  - `--help` — usage info
- **OS detection + sudo prompt** — automatically detects Linux/macOS/Windows and prompts for sudo on `npx playwright install --with-deps`
- **Dotenvx warning block** added to `environments/local.env.example` for credential encryption awareness
- **Two new docs**:
  - `docs/GETTING-STARTED.md` — single entry point for new QA (prerequisites, 3-step setup, verification, next steps)
  - `docs/TROUBLESHOOTING.md` — 10 most common errors with fixes (Node version, permission, sudo, esbuild crash, encryption key loss, auth selector, MCP, MODULE_NOT_FOUND, etc.)
- **Documentation cleanup** — removed 5 redundant/agent-only docs:
  - `docs/README.md` (replaced by GETTING-STARTED.md)
  - `docs/EXIT-CODES.md` (developer reference, not QA)
  - `docs/BASELINE-REGRESSION.md` (overlap with failure-triage content)
  - `docs/QA-DECISION-MODEL.md` (agent guidance, not QA)
  - `docs/FAILURE-TRIAGE.md` (agent guidance, not QA)
- **`docs/GUIDE.md` compacted** — setup section reduced from ~60 lines to ~10 (redirects to GETTING-STARTED.md) to eliminate duplication
- **All broken doc links fixed** across `README.md`, `AGENTS.md`, `CHEATSHEET.md`, `REPORT-GUIDE.md`, `CHANGELOG.md`
- **`.gitattributes` restored** with CRLF/LF normalization rules for cross-platform consistency
- **`setup-check.ts` requirements updated** — `requirements/_TEMPLATE.md`, `QA guide` checks verified
- **`npm run env:edit`** — script to decrypt `local.env`, open in editor, re-encrypt automatically

## [Unreleased — snapshot/discovery]

### Added

- `snapshot_page` and `discover_pages` MCP tools to capture ARIA snapshots and generate/manage selector catalogs
- `npm run snapshot:page` and `npm run discover:pages` CLI scripts under `scripts/` to run page snapshotting and discovery from command line
- Property tests for page snapshotting and discovery tools (`snapshot-page.property.ts`, `discover-pages.property.ts`)

### Changed

- Cleaned up raw Markdown files by simplifying all table separator formatting to minimal hyphens for improved readability

### Removed

- Deprecated documentation files (`MIGRATION.md`, ADRs 0001-0003, workshop guides, installation guides, cheatsheets) to clean up and stream line the framework guide

## [0.1.0-alpha.2] - 2026-06-17

### Added

- Custom dashboard modules under `src/support/custom-dashboard/` with native-like errors, collapsible test steps, screenshots, video, and attachments
- Property tests for custom reporter attachments and Playwright env load order (`playwright-config-env.property.ts`)
- `.nvmrc` for Node 20 LTS workshop setup
- Dedicated Playwright `demo` project and `npm run test:demo` script

### Changed

- Node.js engine requirement lowered to **>= 20.19.0**; downgrade `lint-staged` to 16.x for Node 20 compatibility
- CI workflows and health check aligned to Node 20 LTS; workshop docs updated for Node 20.19+ prerequisite
- `SLOW_MO`, `HEADLESS`, and `BASE_URL` read after `loadEnvironment()`; `slowMo` wired via `launchOptions`
- `npm test` excludes `@demo` via `--grep-invert`; default chromium project ignores `demo/` folder
- Custom dashboard shows all tests in local mode with responsive layout and report-relative attachment paths

### Removed

- Unused placeholder folders `src/tests/e2e/` and `src/tests/api/`

## [0.1.0-alpha.1] - 2026-06-16

### Added

- Generic template core with `project.fixture.ts` seam and `frameworkFixtureExtend`
- Reference Adapter under `example/erpku/` (POMs, auth setup, adapter env overlay)
- MCP adapter path seam (`PLAYWRIGHT_ADAPTER_*`) and Playwright profile bootstrap (#16/#19)
- `createFrameworkReporters()` for Healer JSON gate (#15)
- Alpha workshop docs: `docs/WORKSHOP.md`, `docs/GETTING-STARTED.md`
- ADRs 0001–0003, `docs/FORK-ONBOARDING.md`, `CONTEXT.md`

### Changed

- ERPKU-specific code moved from template core to `example/erpku/`
- `playwright-test` MCP uses profile launcher (`scripts/playwright-test-mcp-launch.ts`)
- CI E2E artifact paths aligned with ERPKU adapter outputs
- `get_test_failures` prefers config-mapped JSON over stale `results.json`
- README Node requirement aligned to >= 22.22.1
- Workshop Path B documented as adapter reference only (no AI generate to adapter root)
- Generator verification sections renamed (CLI vs MCP) to avoid workshop Path A/B confusion

### Known limitations (alpha)

See [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md).

[0.1.0-alpha.2]: https://github.com/k-ardliyan/playwright-qa-kit/releases/tag/v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/k-ardliyan/playwright-qa-kit/releases/tag/v0.1.0-alpha.1

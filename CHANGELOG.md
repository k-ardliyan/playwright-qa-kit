# Changelog

All notable changes to Playwright QA Kit are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

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

### Changed

- `custom-reporter.ts` — `onTestEnd()` now extracts 6 new annotation fields; `onEnd()` writes extended `TestSummary` including `testCases[]` to `test-summary.json`
- `build-local-html.ts` / `build-ci-html.ts` — dual panel (Accordion + Table) with ARIA-compliant toggle tabs
- `shared.ts` — inline JS toggle handler + export button event delegation added to document shell
- `styles.ts` — new CSS: view toggle, table layout, role section header (teal), priority badges, layer badges, actual result coloring, toolbar
- `get_test_summary` MCP tool — response now includes `testCases[]`, `reportMode`, `rolesInScope`
- `get_test_failures` MCP tool — `TestFailure` interface extended with `testId`, `role`, `priority`, `expectedResult`, `actualResult`

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
- Alpha workshop docs: `docs/WORKSHOP.md`, `docs/ALPHA-LIMITATIONS.md`
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

See [docs/ALPHA-LIMITATIONS.md](docs/ALPHA-LIMITATIONS.md).

[0.1.0-alpha.2]: https://github.com/k-ardliyan/playwright-qa-kit/releases/tag/v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/k-ardliyan/playwright-qa-kit/releases/tag/v0.1.0-alpha.1

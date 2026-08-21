# Changelog

All notable changes to Playwright QA Kit are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Core Freeze v1 — 2026-08-21

- **MCP Runtime Profile Enforcement (RC-1)**
  - Enforced active tool profiles (`planner`, `generator`, `healer`, `reporter`, `discovery`, `admin`, `all`) at runtime.
  - Dynamic `ListTools` filtering and strict profile authorization during tool dispatch (`MCP_TOOL_NOT_ALLOWED_FOR_PROFILE`).
  - Added unit test suite for profile filtering, unauthorized invocation blocking, and configuration resolution.
- **Traceability Convergence (RC-2)**
  - Prioritized exact identifier linkage (`testId` -> `scenarioId` -> `requirementId` -> heuristic fallback).
  - Emitted `TRACE_HEURISTIC_LINK_USED` diagnostic with reason and confidence score for fallback matching.
  - Integrated 4D coverage state model (`design`, `automation`, `execution`, `verification`) across scenario nodes and root contract.
  - Enforced strict AC coverage rules: non-executed / planned tests never marked as `covered`.
  - Reused shared failure classifier for structured root cause attribution (`app`, `test`, `env`, `ai_generation`, `unknown`).
- **Contract CI Closure (RC-3)**
  - Resolved npm script drift in `package.json` for `validate:test-plan` and `test:mcp-profiles`.
  - Enforced offline contract suite guarantee across all schema validators and golden contract fixtures.
  - Added golden fixtures for stale plans, invalid AC plans, unexecuted traces, and profile snapshots.
- **Documentation Parity (RC-4)**
  - Synchronized `README.md`, `CUSTOM-MCP.md`, and agent guidance documents with canonical tool names and 21 registered tools.
  - Eliminated legacy paths across documentation (`test-fixtures/`, `mcp-server/`, un-prefixed `selector-catalog/`).
- **Core Framework Freeze**
  - Formally established `Core Freeze v1` in `docs/architecture/DECISIONS.md` (D-13).
  - Defined Prompt Studio v1 integration boundary and contracts in `docs/architecture/PROMPT-STUDIO-INTEGRATION-BOUNDARY.md`.

## [0.2.0-alpha.1] - 2026-08-21

### Added

- **Hybrid Architecture**
  - Clean separation of concerns: `tests/` (workspace for test specs, POMs, test data, and fixtures), `src/` (protected framework core), `tools/` (maintainer tooling & MCP servers), `config/` (environments and Playwright configurations), and `artifacts/` (test results, reports, and selector catalogs).
  - Explicit Public Testing API boundary at `src/public/` (`fixtures`, `auth`, `metadata`, `workspace`).
  - Architecture and boundary validator (`tools/validators/architecture.ts`) with zero-tolerance enforcement for cross-boundary imports.
- **3-Server MCP Architecture & 19 Custom Tools**
  - Dedicated custom MCP server `playwright-qa` under `tools/mcp/` exposing 19 tools across Preflight, Requirements, Selectors, Test Generation, Fixtures, Execution, and Reporting.
  - Profile-based launcher for Playwright MCP (`tools/scripts/playwright-mcp-launch.ts`) and Playwright Test MCP (`tools/scripts/playwright-test-mcp-launch.ts`).
  - 19 custom tools: `health_check`, `validate_requirement`, `normalize_requirements`, `parse_requirement_scenarios`, `list_requirement_status`, `snapshot_page`, `discover_pages`, `validate_generated_tests`, `generate_page_object`, `list_test_fixtures`, `inspect_file`, `extract_pdf_text`, `read_excel_summary`, `get_test_failures`, `list_artifacts`, `get_test_summary`, and `archive_report`.
- **Capability Helpers & Assertions**
  - Network live assertion (`@network-assert`): `src/support/pw/network-assert-core.ts` and `network-assert.ts`.
  - Document & file content validation (`@file-content`, `@upload`, `@download`): `src/support/pw/file-content-core.ts` and `files.ts` (PDF text & Excel header assertions).
  - Assisted human challenge solver for session bootstrap (OTP / CAPTCHA): `src/support/human-challenge.ts`.
- **Interactive Triage Dashboard v3**
  - Full-width modern layout with Table View and Accordion View.
  - Multi-line Test Step / Input Data, SOURCE root-cause explanation tooltips, dynamic column filtering, Confluence/TSV/CSV exports, and deep evidence inspection.
- **Documentation & Agent Governance**
  - Standardized all documentation files to UPPERCASE naming in `docs/` and `docs/recipes/`.
  - Standardized all markdown table delimiters to 3 hyphens (`| --- | --- |`).
  - Updated agent governance files (`AGENTS.md`, `.github/AGENTS.md`, `.github/agents/*.agent.md`) for canonical paths and tool contracts.

### Changed

- **Dependency Upgrades**
  - `@dotenvx/dotenvx` ^2.17.4 → **^2.21.0**
  - `@playwright/test` ^1.62.0 → **^1.62.1**
  - `playwright` ^1.62.0 → **^1.62.1** & `playwright-core` ^1.62.0 → **^1.62.1**
  - `@modelcontextprotocol/sdk` ^1.29.0 → **^1.30.0**
  - `tsx` ^4.23.1 → **^4.23.12**
  - `eslint` ^10.8.0 → **^10.8.1**
  - `eslint-plugin-playwright` ^2.10.5 → **^2.11.0**
  - `typescript-eslint` ^8.65.0 → **^8.67.0**
  - `lint-staged` ^16.4.0 → **^17.3.0**
  - Pinned `@types/node` at `^20.19.43` and `typescript` at `^5.9.3` / `^6.0.3` to ensure compiler and plugin stability.
- Relocated historical migration plan from root to `docs/architecture/HYBRID-MIGRATION-PLAN.md`.

### Removed

- Removed legacy root and deprecated directory structures (`src/tests/`, `test-fixtures/`, `src/pages/`).
- Removed redundant Jira integration in favor of universal CSV/TSV/Confluence exports.

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

[Unreleased]: https://github.com/k-ardliyan/playwright-qa-kit/compare/v0.2.0-alpha.1...HEAD
[0.2.0-alpha.1]: https://github.com/k-ardliyan/playwright-qa-kit/releases/tag/v0.2.0-alpha.1
[0.1.0-alpha.2]: https://github.com/k-ardliyan/playwright-qa-kit/releases/tag/v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/k-ardliyan/playwright-qa-kit/releases/tag/v0.1.0-alpha.1

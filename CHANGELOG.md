# Changelog

All notable changes to Playwright QA Kit are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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

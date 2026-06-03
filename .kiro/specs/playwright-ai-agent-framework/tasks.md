# Implementation Plan: Playwright AI Agent Framework

## Overview

Transform the existing ERPku Playwright + TypeScript E2E automation project into a comprehensive, open-source-ready AI-agent framework. The implementation proceeds in foundation-first order: core utilities → infrastructure → migration → MCP server → agents → reporting → quality gates → documentation. Each phase builds on the previous and ends with all code wired together.

## Tasks

- [x] 1. Set up core framework utilities (Configuration, Logger, Env Loader)
  - [x] 1.1 Create `src/utils/configuration.ts` with all exported constants
    - Export `TAGS` enum with values `SMOKE`, `REGRESSION`, `API`, `UI`, `E2E`
    - Export `ENVIRONMENTS` constant mapping `local`, `dev`, `qa`, `staging`, `production` to placeholder base URLs
    - Export `BROWSERS` constant listing `chromium`, `firefox`, `webkit`
    - Export `RUN_MODES` constant with `HEADLESS`, `HEADED`, `DEBUG` values
    - Export `JIRA_CONSTANTS` object with placeholder domain, projectKey, bugIssueTypeId, and descriptionTemplate
    - Export `MCP_SERVER_PORT = 3100`
    - Add runtime warning: emit `console.warn` when `JIRA_CONSTANTS.domain` contains placeholder patterns
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 13.2, 13.3_

  - [x]\* 1.2 Write property test for Configuration placeholder warning (Property 12)
    - **Property 12: Configuration Placeholder Warning**
    - **Validates: Requirements 4.7**
    - Use `fast-check` to generate domain strings and verify warning emits only when placeholder pattern detected
    - Tag: `// Feature: playwright-ai-agent-framework, Property 12: Configuration Placeholder Warning`

  - [x] 1.3 Create `src/utils/logger.ts` as a singleton Logger class
    - Implement `info`, `warn`, `error`, `debug` methods accepting `message` and optional `metadata`
    - Write `info`/`debug` to `process.stdout`; write `warn`/`error` to `process.stderr`
    - Append every message to `logs/automation.log` in ISO 8601 line-delimited format
    - Auto-create `logs/` directory on first write if it does not exist
    - Suppress `debug` output when `LOG_LEVEL` env var is not set to `"debug"`
    - Export as named singleton `logger`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x]\* 1.4 Write property test for Logger dual output (Property 8)
    - **Property 8: Logger Dual Output**
    - **Validates: Requirements 8.2, 8.3**
    - Use `fast-check` to generate message strings and log levels; verify ISO 8601 prefix, level label, correct stream routing, and file append
    - Tag: `// Feature: playwright-ai-agent-framework, Property 8: Logger Dual Output`

  - [x]\* 1.5 Write property test for Logger debug suppression (Property 9)
    - **Property 9: Logger Debug Suppression**
    - **Validates: Requirements 8.6**
    - Use `fast-check` to generate debug message strings; verify messages are absent from stdout and log file when `LOG_LEVEL !== "debug"`
    - Tag: `// Feature: playwright-ai-agent-framework, Property 9: Logger Debug Suppression`

  - [x] 1.6 Create `src/utils/env-loader.ts` implementing `loadEnvironment()`
    - Read `APP_ENV` from `process.env`; default to `local` with `logger.warn` when undefined or unrecognized
    - Resolve path to `environments/{APP_ENV}.env`; throw descriptive `Error` if file does not exist
    - Load the resolved file via `dotenv`
    - Log success at `info` level: `"Loaded environment '{APP_ENV}' from environments/{APP_ENV}.env"`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x]\* 1.7 Write property test for Env Loader fallback behavior (Property 4)
    - **Property 4: Environment Fallback Behavior**
    - **Validates: Requirements 5.2**
    - Use `fast-check` to generate arbitrary `APP_ENV` strings not in the known set; verify `local.env` is loaded and warning is logged
    - Tag: `// Feature: playwright-ai-agent-framework, Property 4: Environment Fallback Behavior`

- [x] 2. Checkpoint — ensure `tsc --noEmit` passes for all files created so far, ask the user if questions arise.

- [x] 3. Create environments folder and migrate environment variables
  - [x] 3.1 Create `environments/` folder with template env files
    - Create `environments/local.env`, `environments/dev.env`, `environments/qa.env`, `environments/staging.env` each containing the same keys as the current `.env.example` with placeholder values
    - Add `.gitkeep` inside `environments/` is not required (files themselves track the directory)
    - Update `.gitignore` to ignore `environments/*.env` while tracking `environments/*.env.example` template files
    - _Requirements: 5.1, 5.7_

  - [x] 3.2 Update `playwright.config.ts` to use Env Loader
    - Replace the existing `dotenv.config({ path: '.env' })` call with `import { loadEnvironment } from './src/utils/env-loader'; loadEnvironment();` at the top of the file
    - Update `testDir` to `./src/tests`
    - Update the reporter path to `./src/support/custom-reporter.ts`
    - _Requirements: 5.5, 6.9_

- [x] 4. Perform src/ migration — move all existing test infrastructure files
  - [x] 4.1 Migrate POM files from `tests/pages/` to `src/pages/ui/`
    - Move `tests/pages/BasePage.ts` → `src/pages/ui/BasePage.ts`
    - Move `tests/pages/LoginPage.ts` → `src/pages/ui/LoginPage.ts`
    - Move `tests/pages/DashboardPage.ts` → `src/pages/ui/DashboardPage.ts`
    - Move `tests/pages/customers/` → `src/pages/ui/customers/`
    - Update all internal imports within moved files
    - _Requirements: 6.1, 6.2_

  - [x] 4.2 Migrate spec files from `tests/specs/` to `src/tests/ui/`
    - Move all `.spec.ts` files preserving subfolder structure (`auth/`, `customers/`, `dashboard/`, `smoke/`)
    - Update import paths to reference `@/fixtures/base.fixture` and `@/pages/ui/...`
    - _Requirements: 6.1, 6.3_

  - [x] 4.3 Migrate fixtures and support files
    - Move `tests/fixtures/base.fixture.ts` → `src/fixtures/base.fixture.ts`
    - Move `tests/support/auth.setup.ts` → `src/support/auth.setup.ts`
    - Move `tests/support/custom-reporter.ts` → `src/support/custom-reporter.ts` (placeholder; will be replaced in task 7)
    - Update all import paths in moved files
    - _Requirements: 6.4, 6.6_

  - [x] 4.4 Migrate utility files and create shared directory structure
    - Move `tests/utils/cli-runner.ts` → `src/shared/utils/cli-runner.ts`
    - Move `tests/utils/env.ts` → `src/shared/utils/env.ts`
    - Move `tests/utils/factories.ts` → `src/shared/utils/factories.ts`
    - Move `tests/data/` → `src/shared/mock-data/`
    - Create empty placeholder directories: `src/pages/api/`, `src/tests/api/`, `src/tests/e2e/`, `src/shared/types/`
    - Update all import paths
    - _Requirements: 6.1, 6.5_

  - [x] 4.5 Update `tsconfig.json` path aliases and verify compilation
    - Update `@/*` path alias to resolve to `./src/*`
    - Run `tsc --noEmit` and fix any remaining broken import paths until it exits without errors
    - _Requirements: 6.7, 6.8_

- [x] 5. Checkpoint — run `tsc --noEmit`; all import paths must resolve cleanly. Ask the user if questions arise.

- [x] 6. Move ERPku-specific code to `example/` subdirectory
  - [x] 6.1 Create `example/` directory with ERPku-specific content
    - Copy (then remove from `src/`) all ERPku customer POM classes to `example/erpku/pages/`
    - Copy (then remove from `src/tests/ui/`) all ERPku customer and dashboard spec files to `example/erpku/tests/`
    - Copy `src/shared/mock-data/login.data.json` to `example/erpku/mock-data/`
    - Retain login/auth POM and specs in `src/` as generic framework examples
    - Add a README inside `example/erpku/` explaining how to adapt the examples
    - _Requirements: 13.1, 13.4_

  - [x] 6.2 Update `src/fixtures/base.fixture.ts` to reference only generic POMs
    - Remove ERPku-specific fixture registrations (customers pages) from the exported `test` fixture
    - Keep `loginPage` and `dashboardPage` as generic framework examples
    - _Requirements: 13.1, 13.4_

- [x] 7. Implement Custom MCP Server (`mcp-server/`)
  - [x] 7.1 Create `mcp-server/` as an independent TypeScript project
    - Create `mcp-server/package.json` with its own dependencies (no dependency on root project)
    - Create `mcp-server/tsconfig.json` targeting `mcp-server/dist/`
    - Create `mcp-server/src/index.ts` as HTTP server entry point binding to `MCP_SERVER_PORT` from Configuration
    - Add port-0 validation: throw descriptive error during startup if port is `0`
    - Import `MCP_SERVER_PORT` from `../src/utils/configuration` (or copy constant locally)
    - _Requirements: 3.5, 3.6_

  - [x] 7.2 Implement `get_test_failures` tool in `mcp-server/src/tools/get-test-failures.ts`
    - Read most recent Playwright JSON results file from `test-results/`
    - Return structured `GetTestFailuresOutput` with `failures` array (fields: testTitle, filePath, errorMessage, duration)
    - Return `{failures: [], status: "no_results", message: "..."}` when no results file exists
    - Use `logger` for all output
    - _Requirements: 3.1, 3.2_

  - [x]\* 7.3 Write property test for `get_test_failures` data retrieval (Property 1)
    - **Property 1: Test Failure Data Retrieval**
    - **Validates: Requirements 3.1**
    - Use `fast-check` to generate arrays of failure objects, write them as mock JSON results files, call `get_test_failures`, and verify the output array length and all field values match
    - Tag: `// Feature: playwright-ai-agent-framework, Property 1: Test Failure Data Retrieval`

  - [x]\* 7.4 Write property test for `get_test_failures` data preservation (Property 11)
    - **Property 11: Requirements to Test Data Transformation**
    - **Validates: Requirements 3.1**
    - Use `fast-check` to generate failure records and verify no truncation, transformation, or data loss occurs in any field when reading from JSON
    - Tag: `// Feature: playwright-ai-agent-framework, Property 11: Requirements to Test Data Transformation`

  - [x] 7.5 Implement `normalize_requirements` tool in `mcp-server/src/tools/normalize-requirements.ts`
    - Accept `requirementsText: string` input
    - Return `NormalizeRequirementsOutput` with a `RequirementsContract` containing `id`, `title`, `acceptanceCriteria[]`, and `tags[]`
    - Return structured error `{code, message}` for empty, whitespace-only, or malformed input
    - _Requirements: 3.3, 3.4_

  - [x]\* 7.6 Write property test for `normalize_requirements` round-trip (Property 2)
    - **Property 2: Requirements Normalization Round-Trip**
    - **Validates: Requirements 3.8**
    - Use `fast-check` to generate valid requirements text, normalize it, reformat output back to text, normalize again, and verify both contracts are equivalent
    - Tag: `// Feature: playwright-ai-agent-framework, Property 2: Requirements Normalization Round-Trip`

  - [x]\* 7.7 Write property test for `normalize_requirements` error handling (Property 3)
    - **Property 3: Requirements Error Handling**
    - **Validates: Requirements 3.4**
    - Use `fast-check` to generate empty strings, whitespace-only strings, and structurally invalid strings; verify each returns an object with both `code` and `message` fields
    - Tag: `// Feature: playwright-ai-agent-framework, Property 3: Requirements Error Handling`

  - [x] 7.8 Create `mcp-server/src/utils/` helpers
    - Create `json-parser.ts` for safe JSON parsing with error handling
    - Create `file-reader.ts` for reading Playwright results files from `test-results/`
    - Wire logger from root `src/utils/logger.ts` into server utilities
    - _Requirements: 3.1, 3.6, 8.7_

- [x] 8. Checkpoint — build `mcp-server/` with `tsc` and ensure it compiles cleanly. Ask the user if questions arise.

- [x] 9. Configure MCP integration (`.vscode/mcp.json` and `CUSTOM-MCP.md`)
  - [x] 9.1 Create `.vscode/mcp.json` with all three MCP server registrations
    - Register `"playwright"` server: `command: "npx"`, `args: ["@playwright/mcp"]`
    - Register `"playwright-test"` server: `command: "npx"`, `args: ["run-test-mcp-server"]`
    - Register `"playwright-qa"` server: `command: "node"`, `args: ["mcp-server/dist/index.js"]`
    - Ensure each entry has exactly `name`, `command`, `args` fields with no duplicates
    - _Requirements: 1.1, 1.3, 1.6_

  - [x] 9.2 Create `CUSTOM-MCP.md` governance document at project root
    - Add "MCP Server Installation" section listing exact `npm install` / `npx` commands for all three servers
    - Document `get_test_failures` tool: name, input schema (none), output schema, example invocation
    - Document `normalize_requirements` tool: name, input schema (`requirementsText: string`), output schema, example invocation
    - _Requirements: 1.5, 3.7, 10.2_

- [x] 10. Create multi-agent definitions
  - [x] 10.1 Create `.github/agents/orchestrator.agent.md`
    - Document the Plan → Generate → Execute → Heal → Report pipeline sequence
    - Specify `requirementPath` as the structured input field
    - Include a "MCP Tools Required" section listing `run_tests`, `get_test_failures` and all other consumed tool names
    - Describe one diagnostic-and-fix retry per stage; "Unresolved Failures" section in final report for persistent errors
    - Define output summary fields: scenariosPlanned, testsGenerated, testsPassing, testsFailing, testsHealed
    - _Requirements: 2.1, 2.2, 2.3, 2.8, 2.9_

  - [x] 10.2 Create `.github/agents/planner.agent.md` (upgrade existing file)
    - Add "MCP Dependencies" section listing server names and consumed tool names (`normalize_requirements` from `playwright-qa`; `navigate_to_url`, `get_page_content` from `playwright`)
    - Specify structured Markdown table output format with columns: Scenario Name | Steps | Expected Result
    - Specify output file path pattern: `specs/<feature-name>-test-plan.md`
    - _Requirements: 2.4, 2.5, 11.3_

  - [x] 10.3 Create `.github/agents/generator.agent.md` (upgrade existing file)
    - Add "MCP Dependencies" section listing `navigate_to_url`, `get_page_content` from `playwright`
    - Specify code generation rules: import from `@/fixtures/base.fixture`, use POM fixtures, wrap steps in `test.step()`, use factories, kebab-case filenames, include tags
    - Specify that generated files are written to `src/tests/`
    - _Requirements: 2.4, 2.6_

  - [x] 10.4 Create `.github/agents/healer.agent.md` (upgrade existing file)
    - Add "MCP Dependencies" section listing `navigate_to_url`, `get_page_content`, `take_screenshot` from `playwright`
    - Specify structured input format: array of `{file, lineNumber, errorMessage}`
    - Specify output format: `fixes[]` with modified file content and `cannotFix[]` with reasons
    - _Requirements: 2.4, 2.7_

- [x] 11. Implement Enhanced Reporting System
  - [x] 11.1 Rewrite `src/support/custom-reporter.ts` implementing the Playwright `Reporter` interface
    - Collect test results during `onTestEnd` into `CollectedTestData` structure (total, passed, failed, skipped, steps, traceFile)
    - Read JIRA values exclusively from `JIRA_CONSTANTS` in Configuration
    - Write both `reports/custom-dashboard.html` and `reports/test-summary.json` in `onEnd`
    - If `reports/` dir creation fails with EEXIST, continue without error
    - _Requirements: 7.5, 7.7, 7.8_

  - [x] 11.2 Add Chart.js donut chart and expandable step rows (Local mode)
    - When `CI !== "true"`: generate simplified HTML with summary card, Chart.js CDN donut (passed/failed/skipped), and expandable failure table via `<details>` elements
    - Each `<details>` row shows individual `test.step()` names with pass/fail icons
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 11.3 Add CI mode report, JIRA links, and Playwright trace links
    - When `CI === "true"`: generate detailed HTML with full stack traces, step timings, metadata; exit process with non-zero code if CI report generation fails
    - Add JIRA pre-filled ticket URL for each failed test using `JIRA_CONSTANTS` values
    - Add "📊 View Trace" clickable link for any failed test that has a `traceFile` path
    - Write machine-readable `reports/test-summary.json` with total, passed, failed, skipped, passRate, timestamp
    - _Requirements: 7.3, 7.5, 7.6, 7.7_

  - [x]\* 11.4 Write property test for Reporter output completeness (Property 5)
    - **Property 5: Reporter Output Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.7**
    - Use `fast-check` to generate varied test result data; verify HTML contains Chart.js donut with correct percentages and JSON summary contains accurate counts and timestamp
    - Tag: `// Feature: playwright-ai-agent-framework, Property 5: Reporter Output Completeness`

  - [x]\* 11.5 Write property test for Reporter trace link generation (Property 6)
    - **Property 6: Reporter Trace Link Generation**
    - **Validates: Requirements 7.6**
    - Use `fast-check` to generate failed test results with traceFile paths; verify each produces a clickable link in the generated HTML output
    - Tag: `// Feature: playwright-ai-agent-framework, Property 6: Reporter Trace Link Generation`

  - [x]\* 11.6 Write property test for Reporter CI mode selection (Property 7)
    - **Property 7: Reporter CI Mode Selection**
    - **Validates: Requirements 7.4**
    - Use `fast-check` to generate CI env variable values that are not exactly `"true"`; verify simplified local HTML is generated rather than detailed CI report
    - Tag: `// Feature: playwright-ai-agent-framework, Property 7: Reporter CI Mode Selection`

- [x] 12. Checkpoint — run `tsc --noEmit` and `npm run lint`; all files must pass. Ask the user if questions arise.

- [x] 13. Create the Test Validation Script
  - [x] 13.1 Create `validate-generated-tests.ts` at project root
    - Scan all `.spec.ts` files under `src/tests/` recursively
    - Apply three structural rules:
      1. Import rule: file imports `test` from `@/fixtures/base.fixture`
      2. Describe rule: file contains at least one `test.describe(` call
      3. Step rule: file contains at least one `test.step(` call
    - Print violation details `"✗ {filePath}:{lineNumber}\n  Violation: {ruleName}"` and exit code `1` when any rule is violated
    - Print `"✓ Validated N test files\n✓ All structural checks passed"` and exit code `0` on success
    - Log `[WARN]` for directory/file read failures but do not fail validation on system errors alone
    - Add `validate` script to `package.json`: `"validate": "tsx validate-generated-tests.ts"`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x]\* 13.2 Write property test for Test Validator structural compliance (Property 10)
    - **Property 10: Test Validator Structural Compliance**
    - **Validates: Requirements 12.2**
    - Use `fast-check` to generate spec file content with all combinations of present/absent import, describe block, and step call; verify validator correctly identifies compliant and non-compliant files, reporting rule name and line number for violations
    - Tag: `// Feature: playwright-ai-agent-framework, Property 10: Test Validator Structural Compliance`

- [x] 14. Configure Code Quality Gates (Husky + lint-staged)
  - [x] 14.1 Install Husky and lint-staged and configure `package.json`
    - Add `husky` and `lint-staged` as `devDependencies`
    - Add `"prepare": "husky install"` script to `package.json`
    - Add `lint-staged` config to `package.json`:
      - `"*.ts"`: `["eslint --fix", "prettier --write"]`
      - `"*.{json,md,yml}"`: `["prettier --write"]`
    - _Requirements: 9.1, 9.3, 9.4, 9.6_

  - [x] 14.2 Create `.husky/pre-commit` hook file
    - Write the hook script sourcing husky helpers, calling `npx lint-staged`, then `npm run validate`
    - Commit `.husky/pre-commit` to the repository (version-controlled)
    - Ensure `eslint --fix` leaving remaining errors blocks commit with non-zero exit code
    - _Requirements: 9.2, 9.5, 9.7, 12.6_

- [x] 15. Create Requirements and Specs folder structure
  - [x] 15.1 Create `requirements/` and `specs/` folders with `.gitkeep` files
    - Create `requirements/.gitkeep`
    - Create `specs/.gitkeep`
    - Verify `.gitignore` does NOT exclude `specs/*.md` or `requirements/*.md`
    - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [x] 16. Write all Governance Documentation
  - [x] 16.1 Create `.github/AGENTS.md`
    - Document all four agents (orchestrator, planner, generator, healer) each with: role description, input format, output format, MCP tools consumed, and at least one example user prompt
    - _Requirements: 2.10, 10.1_

  - [x] 16.2 Update `CUSTOM-MCP.md` with complete server documentation
    - Ensure all tool schemas (input + output JSON schemas) and example invocations are present
    - Verify "MCP Server Installation" section covers all three servers
    - _Requirements: 10.2_

  - [x] 16.3 Create `MAINTENANCE.md` at project root
    - Document: how to add a new environment file, how to add a new `TAGS` enum value, how to register a new MCP tool, and how to update the Reporter for a new field
    - _Requirements: 10.3_

  - [x] 16.4 Update `README.md`
    - Add framework architecture overview and `src/` directory layout
    - Add instructions for running the Orchestrator pipeline
    - Add prerequisites section (Node.js version, Playwright version, MCP server setup)
    - Add "Getting Started" section describing how to adapt the framework: updating `environments/` files, populating `JIRA_CONSTANTS`, placing requirement files in `requirements/`
    - _Requirements: 10.4, 13.3, 13.5_

- [x] 17. Final Checkpoint — run `npm run typecheck`, `npm run lint`, and `npm run validate`. Ensure all three pass cleanly. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they implement property-based tests using `fast-check`
- Each task references specific requirements for traceability
- Checkpoints (tasks 2, 5, 8, 12, 17) ensure incremental TypeScript compilation passes at each phase boundary
- Property-based tests (Properties 1–12) use the `fast-check` library; install with `npm install --save-dev fast-check`
- The design document's "Correctness Properties" section maps directly to the `*` sub-tasks in tasks 1, 7, 11, and 13
- All `example/` directory content retains backward compatibility with the existing ERPku test suite
- The `mcp-server/` project has its own `tsconfig.json` and is built independently from the root project
- The `src/` migration (tasks 4–6) should be done as atomic git operations to preserve history

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5", "1.6", "3.1"] },
    { "id": 2, "tasks": ["1.7", "3.2", "4.1", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "7.1", "15.1"] },
    { "id": 4, "tasks": ["4.5", "6.1", "7.2", "7.5", "9.1"] },
    { "id": 5, "tasks": ["6.2", "7.3", "7.4", "7.6", "7.7", "7.8", "9.2"] },
    { "id": 6, "tasks": ["10.1", "10.2", "10.3", "10.4", "11.1", "13.1"] },
    { "id": 7, "tasks": ["11.2", "11.3", "13.2"] },
    { "id": 8, "tasks": ["11.4", "11.5", "11.6", "14.1"] },
    { "id": 9, "tasks": ["14.2", "16.1", "16.2", "16.3", "16.4"] }
  ]
}
```

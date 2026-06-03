# Requirements Document

## Introduction

This document specifies the requirements for evolving the existing ERPku Playwright + TypeScript E2E automation project into a powerful, open-source-ready AI-agent framework. The transformation introduces Model Context Protocol (MCP) integration, a multi-agent orchestration pipeline, a purpose-built custom MCP server, a `src/`-based project structure, a central configuration hub, per-environment configuration files, an enhanced reporting system, structured logging, and code quality gates via Husky + lint-staged. The resulting framework must be usable as a reusable, framework-agnostic open-source template for any Playwright + TypeScript project, while preserving backward compatibility with the existing ERPku test suite.

---

## Glossary

- **Framework**: The open-source Playwright AI-agent framework being built by this spec.
- **Agent**: An AI-driven Markdown definition file (`.agent.md`) that instructs an AI assistant to perform a specific QA automation task.
- **Orchestrator**: The top-level Agent responsible for sequencing and coordinating all other Agents through the Plan → Generate → Execute → Heal → Report pipeline.
- **Planner**: The Agent responsible for analysing requirements and producing structured test-plan documents under `specs/`.
- **Generator**: The Agent responsible for generating Playwright TypeScript test code from test-plan documents.
- **Healer**: The Agent responsible for diagnosing failing tests and proposing locator or logic fixes.
- **MCP**: Model Context Protocol — a local server protocol that exposes tools to AI agents for browser interaction and data retrieval.
- **Playwright_MCP**: The official `@playwright/mcp` server that exposes browser control tools to AI agents via MCP.
- **Custom_MCP_Server**: The purpose-built `mcp-server/` Node.js server that exposes QA-specific tools (`get_test_failures`, `normalize_requirements`) to AI agents.
- **MCP_Config**: The `.vscode/mcp.json` file that registers all MCP servers consumed by AI agents.
- **Configuration**: The `src/utils/configuration.ts` file that serves as the single source of truth for environments, browsers, test types, TAGS enum, run modes, and JIRA constants.
- **Env_Loader**: The `src/utils/env-loader.ts` utility that selects and loads the correct per-environment `.env` file from the `environments/` folder.
- **Logger**: The `src/utils/logger.ts` class that writes structured log messages to both the console and `logs/automation.log`.
- **Reporter**: The custom Playwright reporter at `src/support/custom-reporter.ts` that generates the HTML dashboard.
- **POM**: Page Object Model — a design pattern where UI interactions are encapsulated in dedicated page classes.
- **Fixture**: A Playwright test fixture that provides pre-instantiated POM objects to test functions via dependency injection.
- **TAGS**: A TypeScript `enum` in `Configuration` enumerating all test classification tags (e.g., `@smoke`, `@regression`, `@api`).
- **Validator**: The `validate-generated-tests.ts` script that statically checks AI-generated test files for structural compliance before they are committed.
- **CI**: Continuous Integration — automated pipeline run on GitHub Actions.
- **JIRA_Constants**: The set of JIRA domain, project ID, issue type ID, and field mapping values stored in `Configuration`.
- **Husky**: A Git hook manager that enforces pre-commit quality gates.
- **lint-staged**: A tool that runs linters and formatters only on Git-staged files during a pre-commit hook.
- **Chart.js**: A JavaScript charting library used to render the donut chart in the HTML report.
- **Dual-mode**: A reporting behaviour where the Reporter generates a simplified local HTML file when `CI=false` and a detailed Jenkins-compatible HTML file when `CI=true`.

---

## Requirements

---

### Requirement 1: Playwright MCP Integration

**User Story:** As a QA engineer, I want every AI agent to control and validate the browser via a local Playwright MCP server, so that agents can observe live browser state during test generation, execution, and healing without leaving the AI assistant workflow.

#### Acceptance Criteria

1. THE Framework SHALL provide a `.vscode/mcp.json` file that registers at minimum three MCP servers: `@playwright/mcp` (named `"playwright"`), `run-test-mcp-server` (named `"playwright-test"`), and the Custom_MCP_Server (named `"playwright-qa"`), each entry containing exactly the fields `name`, `command`, and `args` (array).
2. WHEN an AI agent invokes a Playwright_MCP tool AND a Playwright browser context is open, THE Playwright_MCP server SHALL execute the corresponding browser action and return the result within 30 seconds; IF no browser context is currently open, THE server SHALL return a structured error response with `code: "NO_CONTEXT"` rather than throwing an unhandled exception.
3. THE MCP_Config SHALL list each registered MCP server as a parseable JSON object with a unique `name` string, a `command` string, and an `args` string array, such that a JSON-schema validator confirms the file is valid and contains no duplicate server names.
4. IF the `@playwright/mcp` package is absent from `node_modules` when the environment-setup check script runs, THEN THE Framework SHALL write the message `"ERROR: @playwright/mcp is not installed. Run: npm install @playwright/mcp"` to stderr and exit with code `1`.
5. THE `CUSTOM-MCP.md` governance document SHALL contain a section titled "MCP Server Installation" that lists, for each of the three registered servers, the exact `npm install` or `npx` command required to make it available locally.
6. WHEN an MCP-compatible AI client parses `.vscode/mcp.json`, THE client SHALL be able to locate and start all three registered servers without requiring any manual file edits, as verified by the client reporting all three server names as successfully resolved.

---

### Requirement 2: Multi-Agent Architecture with Orchestrator

**User Story:** As a QA engineer, I want an Orchestrator agent that sequences Planner → Generator → Executor → Healer → Reporter, so that I can trigger a complete test automation cycle with a single prompt rather than manually invoking each agent.

#### Acceptance Criteria

1. THE Framework SHALL provide an `orchestrator.agent.md` definition file under `.github/agents/` that describes the Plan → Generate → Execute → Heal → Report pipeline sequence and accepts a structured input with the field `requirementPath` (file path to a versioned requirements file under `requirements/`).
2. WHEN the Orchestrator is invoked with a valid `requirementPath`, THE Orchestrator SHALL call the Planner first with that requirement file as input; THEN pass the Planner's output (a structured Markdown table of scenarios with columns: Scenario, Steps, Expected Result) as input to the Generator; THEN instruct test execution by calling a Playwright test runner tool; THEN IF test failures exist AND the number of failures is ≤10, call the Healer and pass the failure data; FINALLY produce a summary report with counts of scenarios planned, tests generated, tests passing, tests failing, and tests healed.
3. THE Orchestrator agent definition SHALL list every MCP tool name consumed by the pipeline stages (e.g., `navigate_to_url`, `run_tests`, `get_test_failures`) in a dedicated "MCP Tools Required" section, using the exact tool name strings as declared in each MCP server's tool manifest.
4. THE Framework SHALL upgrade the existing `generator.agent.md`, `healer.agent.md`, and `planner.agent.md` files to each include a dedicated section titled "MCP Dependencies" that lists (1) the MCP server name from which each consumed tool originates, and (2) the exact tool names consumed from that server.
5. THE Planner agent definition SHALL output a structured Markdown table with columns (Scenario Name | Steps | Expected Result), one row per scenario.
6. THE Generator agent definition SHALL accept the Planner's table as input and parse it row-by-row to extract scenario details before generating each test file.
7. THE Healer agent definition SHALL accept structured failure data containing at minimum fields (file, lineNumber, errorMessage) and SHALL output modified file content or a structured "cannot fix" report specifying which files it could not repair.
8. WHEN a pipeline stage (Planner, Generator, or Healer) produces an error, THE Orchestrator SHALL attempt one diagnostic-and-fix iteration for that stage; IF the iteration produces the same error or a new error OR if the iteration succeeds but produces structurally invalid output (e.g., Generator produces malformed TypeScript), THE Orchestrator SHALL classify the error as "cannot fix" and record that stage's failure.
9. WHEN an error is classified as "cannot fix" after one healing cycle OR when the Healer itself crashes, THE Orchestrator SHALL proceed to the Report stage and include in the final report a section titled "Unresolved Failures" listing each unresolved stage name and the error message recorded.
10. THE Framework SHALL provide an `AGENTS.md` governance document under `.github/` that documents every agent (`orchestrator`, `planner`, `generator`, `healer`) with a dedicated section per agent containing subsections for: role description, input format, output format, MCP tools consumed, and at least one example user prompt.

---

### Requirement 3: Custom MCP Server

**User Story:** As a QA engineer, I want a purpose-built MCP server that exposes QA-specific tools, so that AI agents can programmatically read structured test failure data and parse requirements into canonical contracts without writing custom integration code.

#### Acceptance Criteria

1. THE Custom_MCP_Server SHALL expose a `get_test_failures` tool that reads the most recent Playwright JSON results file from `test-results/` and returns a structured array of failure objects containing test title, file path, error message, and duration.
2. WHEN `get_test_failures` is called and no results file exists, THEN THE Custom_MCP_Server SHALL return an empty array and a descriptive status message rather than throwing an unhandled error.
3. THE Custom_MCP_Server SHALL expose a `normalize_requirements` tool that accepts a raw requirements text string and returns a canonical requirements contract object with fields: `id`, `title`, `acceptanceCriteria` array, and `tags` array.
4. WHEN `normalize_requirements` receives malformed or empty input, THEN THE Custom_MCP_Server SHALL return a structured error object with a `code` field and a human-readable `message` field.
5. THE Custom_MCP_Server SHALL start on a configurable port (default `3100`) defined in `Configuration`. IF the configured port value is `0`, THEN THE Custom_MCP_Server SHALL reject it as invalid and throw a descriptive startup error.
6. THE Custom_MCP_Server SHALL be implemented as a standalone Node.js TypeScript project under `mcp-server/` with its own `package.json` and `tsconfig.json`.
7. THE Framework SHALL provide a `CUSTOM-MCP.md` document that describes each exposed tool's name, input schema, output schema, and example invocation.
8. FOR ALL valid requirements text inputs, parsing then printing then parsing THE `normalize_requirements` tool SHALL produce an equivalent canonical contract object (round-trip property).

---

### Requirement 4: Central Configuration Hub

**User Story:** As a QA engineer, I want a single `configuration.ts` file as the source of truth for all framework constants, so that I can change environment targets, browser selections, tag filters, run modes, and JIRA settings in one place without hunting across multiple files.

#### Acceptance Criteria

1. THE Configuration SHALL export a `TAGS` enum with at least the values `SMOKE`, `REGRESSION`, `API`, `UI`, and `E2E`.
2. THE Configuration SHALL export an `ENVIRONMENTS` constant object mapping environment names (`local`, `dev`, `qa`, `staging`, `production`) to their base URL patterns.
3. THE Configuration SHALL export a `BROWSERS` constant listing supported browser names (`chromium`, `firefox`, `webkit`).
4. THE Configuration SHALL export a `RUN_MODES` constant enumerating execution modes (`headless`, `headed`, `debug`).
5. THE Configuration SHALL export a `JIRA_CONSTANTS` object containing at minimum the JIRA domain, project key, bug issue type ID, and description template string as named fields.
6. THE Configuration SHALL export a `MCP_SERVER_PORT` constant used by the Custom_MCP_Server to bind its listener.
7. WHEN a consuming module imports `JIRA_CONSTANTS.domain` and the value is the default placeholder, THE Configuration SHALL emit a console warning stating that JIRA integration is using placeholder values.
8. THE Configuration file SHALL be located at `src/utils/configuration.ts` and be the only file where JIRA domain, project key, and issue type ID values are defined.

---

### Requirement 5: Multi-Environment Support

**User Story:** As a QA engineer, I want per-environment `.env` files under an `environments/` folder and a dedicated env-loader utility, so that switching between local, dev, qa, and staging environments requires only setting an `APP_ENV` variable rather than manually editing a single `.env` file.

#### Acceptance Criteria

1. THE Framework SHALL provide an `environments/` folder containing at minimum `local.env`, `dev.env`, and `qa.env` template files, each with the same variable keys as the current `.env.example`.
2. THE Env_Loader SHALL read the `APP_ENV` environment variable to determine which file to load from `environments/`. WHEN `APP_ENV` is set to an unrecognised value, THE Env_Loader SHALL default to loading `environments/local.env` and log a warning identifying the unrecognised value.
3. WHEN `APP_ENV` is not set, THE Env_Loader SHALL default to loading `environments/local.env` and log a warning that the default environment is being used.
4. IF the resolved environment file does not exist, THEN THE Env_Loader SHALL throw a descriptive error naming the missing file path before any tests execute.
5. THE Env_Loader SHALL be located at `src/utils/env-loader.ts` and SHALL be imported by `playwright.config.ts` as the sole mechanism for loading environment variables.
6. WHEN the Env_Loader successfully loads a file, THE Env_Loader SHALL log the environment name and file path at the `info` log level via the Logger.
7. THE existing single `.env` file at the project root SHALL be replaced by the `environments/` folder structure, and the `.gitignore` SHALL be updated to ignore all `*.env` files inside `environments/` except the template examples.

---

### Requirement 6: Structured Project Layout (src/ Migration)

**User Story:** As an open-source contributor, I want a `src/`-based project structure with clearly separated UI pages, API pages, UI tests, API tests, E2E tests, shared mock data, shared types, and shared utilities, so that the framework is intuitive to navigate and extend for any application.

#### Acceptance Criteria

1. THE Framework SHALL organise source files under `src/` with the following top-level subdirectories: `pages/ui/`, `pages/api/`, `tests/ui/`, `tests/api/`, `tests/e2e/`, `shared/mock-data/`, `shared/types/`, `shared/utils/`.
2. THE Framework SHALL migrate all existing POM files from `tests/pages/` to `src/pages/ui/` and update all import paths accordingly.
3. THE Framework SHALL migrate all existing spec files from `tests/specs/` to `src/tests/ui/` and update all import paths accordingly.
4. THE Framework SHALL migrate `tests/fixtures/base.fixture.ts` to `src/fixtures/base.fixture.ts` and update all import paths accordingly.
5. THE Framework SHALL migrate `tests/utils/` contents to `src/shared/utils/` and update all import paths accordingly.
6. THE Framework SHALL migrate `tests/support/` contents to `src/support/` and update all import paths accordingly.
7. THE `tsconfig.json` path alias `@/*` SHALL be updated to resolve to `./src/*` after the migration.
8. WHEN all migrations are complete, THE Framework SHALL have zero broken import paths as verified by `tsc --noEmit` completing without errors. THE migration SHALL not be considered complete until both TypeScript compilation passes AND all import paths are verified as working.
9. THE `playwright.config.ts` `testDir` SHALL be updated to point to `./src/tests` and the reporter path SHALL reference `./src/support/custom-reporter.ts`.

---

### Requirement 7: Enhanced Reporting System

**User Story:** As a QA lead, I want the HTML dashboard to include a donut chart, expandable test steps, dual local/Jenkins output modes, configurable JIRA constants, and links to the Playwright native report per test, so that I can quickly assess run health and file JIRA tickets from a single page.

#### Acceptance Criteria

1. THE Reporter SHALL render a donut chart using Chart.js that displays passed, failed, and skipped test counts as coloured segments with a percentage label in the centre.
2. WHEN a failed test row is expanded, THE Reporter SHALL display the individual `test.step()` names and their pass/fail status as a nested list within the table row.
3. WHEN `CI` environment variable is set to `true`, THE Reporter SHALL generate a detailed HTML report including full stack traces, step timings, and metadata suitable for Jenkins archive artifacts. IF detailed report generation fails in a CI environment, THEN THE Reporter SHALL exit the process with a non-zero code.
4. WHEN `CI` environment variable is not set, is set to `false`, or is set to any value other than `true`, THE Reporter SHALL generate a simplified local HTML report with a summary card, donut chart, and expandable failure table.
5. THE Reporter SHALL read all JIRA integration values (domain, project ID, issue type ID) exclusively from `JIRA_CONSTANTS` in `Configuration` rather than using hardcoded strings.
6. WHEN a failed test has a corresponding Playwright HTML report trace file, THE Reporter SHALL render a clickable link in the failure row that opens the Playwright native report for that test.
7. THE Reporter SHALL write the generated HTML file to `reports/custom-dashboard.html` and also write a machine-readable `reports/test-summary.json` file containing total, passed, failed, skipped counts, pass rate, and timestamp.
8. IF `fs.mkdirSync` fails because the `reports/` directory already exists, THEN THE Reporter SHALL continue without error.

---

### Requirement 8: Logger Utility

**User Story:** As a developer debugging a CI failure, I want a structured Logger class that writes timestamped messages to both the console and a persistent log file, so that I can review the full execution trace after a run without relying solely on console output.

#### Acceptance Criteria

1. THE Logger SHALL provide four log-level methods: `info`, `warn`, `error`, and `debug`, each accepting a message string and an optional metadata object.
2. WHEN any Logger method is called, THE Logger SHALL write the message to `process.stdout` (for `info` and `debug`) or `process.stderr` (for `warn` and `error`) with an ISO 8601 timestamp prefix and the log level label.
3. WHEN any Logger method is called, THE Logger SHALL append the same message to `logs/automation.log` using a line-delimited format.
4. IF the `logs/` directory does not exist when the Logger first writes, THEN THE Logger SHALL create it automatically before writing.
5. THE Logger SHALL be implemented as a class at `src/utils/logger.ts` and exported as a named singleton instance `logger`.
6. WHEN `debug` level messages are logged and the `LOG_LEVEL` environment variable is not set to `debug`, THE Logger SHALL suppress `debug` messages from both console and file output.
7. THE Logger SHALL be used by the Env_Loader, the Custom_MCP_Server, and the Reporter for all informational, warning, and error output.

---

### Requirement 9: Code Quality Gates (Husky + lint-staged)

**User Story:** As an open-source maintainer, I want Husky pre-commit hooks that run ESLint and Prettier on staged files before every commit, so that no code with lint errors or formatting violations can enter the repository.

#### Acceptance Criteria

1. THE Framework SHALL install Husky and lint-staged as `devDependencies` in `package.json`.
2. WHEN a developer runs `git commit`, THE Husky pre-commit hook SHALL invoke lint-staged automatically.
3. WHEN lint-staged runs, THE lint-staged configuration SHALL execute `eslint --fix` and `prettier --write` on all staged `.ts` files.
4. WHEN lint-staged runs, THE lint-staged configuration SHALL execute `prettier --write` on all staged `.json`, `.md`, and `.yml` files.
5. IF `eslint --fix` produces remaining lint errors on any staged file after auto-fix, THEN THE pre-commit hook SHALL exit with a non-zero code and block the commit, displaying the remaining errors to the developer. WHEN `eslint --fix` completes without remaining lint errors, THE pre-commit hook SHALL allow the commit to proceed regardless of other non-lint process issues.
6. THE Framework SHALL include a `prepare` script in `package.json` that installs Husky hooks when `npm install` is run, so that new contributors automatically receive the hooks without a separate setup step.
7. THE `.husky/pre-commit` file SHALL be committed to the repository so that the hook is version-controlled alongside the codebase.

---

### Requirement 10: Governance Documentation

**User Story:** As an open-source contributor, I want clear governance documents describing each agent's responsibilities, how to extend the custom MCP server, and how to maintain the framework over time, so that I can contribute without needing to reverse-engineer the architecture.

#### Acceptance Criteria

1. THE Framework SHALL provide an `AGENTS.md` file under `.github/` that documents every agent (`orchestrator`, `planner`, `generator`, `healer`) with sections for: role description, inputs accepted, outputs produced, MCP tools consumed, and example prompts.
2. THE Framework SHALL provide a `CUSTOM-MCP.md` file at the project root that documents: how to start the Custom_MCP_Server, every exposed tool's name, input JSON schema, output JSON schema, and a cURL or MCP-client example invocation.
3. THE Framework SHALL provide a `MAINTENANCE.md` file at the project root that documents: how to add a new environment file, how to add a new TAGS enum value, how to register a new MCP tool, and how to update the Reporter for a new field.
4. THE `README.md` SHALL be updated to describe the framework's architecture, the `src/` directory layout, how to run the Orchestrator pipeline, and prerequisites including Node.js version, Playwright version, and MCP server setup.
5. WHEN a new MCP tool is added to the Custom_MCP_Server, THE `CUSTOM-MCP.md` SHALL be the authoritative reference that must be updated before the tool is considered complete.

---

### Requirement 11: Requirements and Specs Folder Structure

**User Story:** As a QA engineer using the Planner agent, I want versioned requirement files and test-plan documents in dedicated folders, so that I have a traceable history of what was planned and generated across feature iterations.

#### Acceptance Criteria

1. THE Framework SHALL provide a `requirements/` folder at the project root intended for storing versioned plain-text or Markdown requirement files consumed by the Planner agent.
2. THE Framework SHALL provide a `specs/` folder at the project root intended for storing Markdown test-plan documents produced by the Planner agent as output.
3. WHEN the Planner agent produces a test plan, THE Planner agent definition SHALL instruct the agent to write the output file to `specs/` with a filename following the pattern `<feature-name>-test-plan.md`.
4. THE `requirements/` and `specs/` folders SHALL each contain a `.gitkeep` file so that the empty directories are tracked by Git.
5. THE `.gitignore` SHALL NOT exclude `specs/*.md` or `requirements/*.md` files so that generated plans are committed alongside the tests they produce.

---

### Requirement 12: Test Validation Script

**User Story:** As a QA engineer, I want a validation script that checks AI-generated test files for structural compliance before they are committed, so that malformed or incomplete generated tests are caught immediately rather than during CI execution.

#### Acceptance Criteria

1. THE Framework SHALL provide a `validate-generated-tests.ts` script at the project root that can be executed via `npx tsx validate-generated-tests.ts`.
2. WHEN executed, THE Validator SHALL scan all `.spec.ts` files under `src/tests/` and verify that each file imports `test` from the base fixture, contains at least one `test.describe` block, and uses at least one `test.step` call.
3. IF a scanned file violates any structural rule, THEN THE Validator SHALL print the file path, the violated rule name, and the line number where the violation was detected, then exit with code `1`.
4. WHEN all scanned files pass all structural validation rules, THE Validator SHALL print a summary of the number of files checked and exit with code `0`. THE Validator SHALL also exit with code `0` when system errors occur (such as inability to read a directory or parse a file) provided no validation rule violations were found, and SHALL log a warning for each system error encountered.
5. THE `package.json` SHALL include a `validate` script defined as `tsx validate-generated-tests.ts` so the Validator can be run as `npm run validate`.
6. THE Husky pre-commit hook SHALL invoke `npm run validate` after lint-staged so that structurally invalid generated tests cannot be committed.

---

### Requirement 13: Open-Source Framework Design

**User Story:** As an open-source user adopting this framework for a new project, I want the codebase to be free of ERPku-specific hardcoded values in framework-level files, so that I can use the template for any Playwright + TypeScript application without having to strip out application-specific code.

#### Acceptance Criteria

1. THE Framework SHALL move all ERPku-specific POM classes, spec files, and test data to a clearly labelled `example/` subdirectory.
2. THE Configuration SHALL not contain any ERPku-specific URL patterns, credentials, or project identifiers in its default exported values; all such values SHALL be represented as placeholder strings (e.g., `"https://your-app.example.com"`).
3. THE `JIRA_CONSTANTS` in `Configuration` SHALL use placeholder values by default, and the `README.md` SHALL explain how to replace them with project-specific values.
4. THE agent `.agent.md` files SHALL be written in English and SHALL not reference ERPku-specific business terminology (e.g., NPWP, ERP transaction types) in their framework-level instructions; application-specific context SHALL be provided via the `requirements/` folder instead.
5. THE `README.md` SHALL include a "Getting Started" section describing the steps to adapt the framework for a new target application: updating `environments/` files, populating `JIRA_CONSTANTS`, and placing requirement files in `requirements/`.
6. WHEN the framework is cloned and `npm install` is run with no modifications, THE `npm run typecheck` command SHALL complete without errors, confirming that the framework ships in a compilable state out of the box.

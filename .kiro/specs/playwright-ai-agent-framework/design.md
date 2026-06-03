# Design Document: Playwright AI Agent Framework

## Overview

This design specifies the architecture and implementation approach for transforming the existing ERPku Playwright + TypeScript E2E automation project into a comprehensive, open-source-ready AI-agent framework. The framework introduces Model Context Protocol (MCP) integration, multi-agent orchestration capabilities, a custom MCP server for QA-specific operations, centralized configuration management, multi-environment support, a professional `src/`-based project structure, enhanced HTML reporting with Chart.js visualizations, structured logging, and automated code quality enforcement.

The framework is designed to be framework-agnostic and reusable, serving as an open-source template for any Playwright + TypeScript automation project while maintaining full backward compatibility with the existing ERPku test suite. The architecture enables AI agents to autonomously plan test scenarios, generate Playwright test code, execute tests, diagnose failures, and produce comprehensive reports—all through a coordinated pipeline orchestrated by a top-level agent.

### Key Design Principles

1. **AI-First Architecture**: Every component is designed to be accessible and controllable by AI agents through MCP tools
2. **Framework Agnosticism**: Core framework components contain no application-specific hardcoded values
3. **Separation of Concerns**: Clear boundaries between framework infrastructure, application-specific code, and configuration
4. **Open Source Ready**: Professional structure, comprehensive documentation, and examples suitable for public release
5. **Backward Compatibility**: Existing ERPku tests continue to function without modification
6. **Extensibility**: Plugin-style architecture allows easy addition of new agents, MCP tools, and test types
7. **Configuration Centralization**: Single source of truth for all framework constants and environment settings
8. **Type Safety**: Comprehensive TypeScript typing throughout the framework with strict compiler checks

## Architecture

### High-Level Architecture

The framework follows a layered architecture organized into five primary tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Layer                            │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────┐          │
│  │ Orchestrator │→ │   Planner   │→ │Generator │→ Healer  │
│  └──────────────┘  └─────────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓ MCP Protocol ↓
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Playwright  │  │ Playwright   │  │   Custom     │       │
│  │     MCP     │  │  Test MCP    │  │   QA MCP     │       │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ Tool Invocations ↓
┌─────────────────────────────────────────────────────────────┐
│                 Framework Core Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Configuration │  │  Env Loader  │  │    Logger    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ Uses ↓
┌─────────────────────────────────────────────────────────────┐
│                 Test Infrastructure Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Fixtures   │  │     POMs     │  │   Reporter   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ Executes ↓
┌─────────────────────────────────────────────────────────────┐
│                   Test Execution Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Tests   │  │  API Tests   │  │  E2E Tests   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interactions

#### Agent → MCP → Framework Flow

1. **User Invokes Orchestrator**: User provides a requirements file path to the Orchestrator agent
2. **Orchestrator Sequences Pipeline**: Orchestrator calls Planner → Generator → Execute → Healer → Report in sequence
3. **Agents Call MCP Tools**: Each agent invokes MCP tools (e.g., `navigate_to_url`, `get_test_failures`, `normalize_requirements`)
4. **MCP Servers Execute**: MCP servers translate tool calls into framework operations (browser actions, file I/O, test execution)
5. **Framework Components Respond**: Configuration, Logger, Reporter, and POMs provide the underlying implementation
6. **Results Flow Back**: Each layer returns structured data up the stack to the invoking agent

#### Multi-Environment Configuration Flow

1. **Process Startup**: Application reads `APP_ENV` environment variable (defaults to `local`)
2. **Env Loader Activation**: `env-loader.ts` selects the corresponding file from `environments/` folder
3. **Variable Loading**: Dotenv loads selected environment file into `process.env`
4. **Configuration Access**: All framework components access config through centralized `Configuration` exports
5. **Runtime Validation**: Logger emits warnings if placeholder values are detected in production environments

#### Test Generation and Execution Flow

1. **Requirements Ingestion**: Planner reads requirements file from `requirements/` folder
2. **Scenario Planning**: Planner produces structured Markdown table with scenarios, steps, expected results
3. **Code Generation**: Generator parses scenario table and generates `.spec.ts` files in `src/tests/`
4. **Validation**: `validate-generated-tests.ts` checks structural compliance before commit
5. **Test Execution**: Playwright runs tests using configuration from `playwright.config.ts`
6. **Result Collection**: Reporter gathers results and generates HTML dashboard and JSON summary
7. **Failure Healing**: If failures occur, Healer analyzes failure data and proposes fixes

### Architectural Decisions

#### MCP Protocol Selection

**Decision**: Use Model Context Protocol (MCP) as the communication layer between AI agents and framework components.

**Rationale**:

- Industry-standard protocol for AI-tool integration
- Allows AI agents to access browser state and framework operations in real-time
- Supports multiple concurrent MCP servers with distinct responsibilities
- JSON-RPC based transport is widely supported and debuggable
- Official `@playwright/mcp` provides native browser control without custom integration

**Alternatives Considered**:

- Direct tool invocation: Rejected due to lack of standardization and portability
- REST API: Rejected due to overhead and complexity for local development
- Custom protocol: Rejected to avoid reinventing standards

#### Multi-Agent Orchestration Pattern

**Decision**: Implement specialized agents (Planner, Generator, Healer) coordinated by an Orchestrator agent.

**Rationale**:

- Separation of concerns: Each agent has a single, well-defined responsibility
- Composability: Pipeline stages can be executed independently or as a full sequence
- Extensibility: New agents can be added without modifying existing ones
- Error isolation: Failures in one stage do not crash the entire pipeline
- Observability: Each agent produces discrete, trackable outputs

**Alternatives Considered**:

- Monolithic agent: Rejected due to complexity and lack of modularity
- Event-driven architecture: Rejected as overkill for sequential pipeline
- Manual script chaining: Rejected due to lack of intelligence and adaptability

#### src/ Directory Structure

**Decision**: Migrate all framework code into a `src/` directory with explicit subdirectories for UI pages, API pages, UI tests, API tests, E2E tests, shared utilities, types, and mock data.

**Rationale**:

- Industry standard for TypeScript projects
- Clear separation between framework code and configuration
- Facilitates tree-shaking and bundling for future packaging
- Intuitive navigation for contributors
- Aligns with open-source project conventions
- Separates UI/API concerns explicitly for mixed-stack testing

**Alternatives Considered**:

- Flat tests/ structure: Rejected due to scalability and organization issues
- Monorepo with packages: Rejected as overkill for single-framework repo
- Feature-based folders: Rejected as application-specific rather than framework-agnostic

#### Centralized Configuration

**Decision**: Single `src/utils/configuration.ts` file exports all constants, enums, and configuration objects.

**Rationale**:

- Single source of truth eliminates inconsistency
- Easy to locate and modify settings
- Compile-time type checking for all config values
- Facilitates testing with mock configurations
- Clear audit trail for configuration changes

**Alternatives Considered**:

- Distributed config files: Rejected due to maintenance burden
- JSON config file: Rejected due to lack of type safety and enums
- Environment variables only: Rejected due to lack of structure and defaults

## Components and Interfaces

### MCP Server Layer

#### Playwright MCP (@playwright/mcp)

**Purpose**: Official Playwright MCP server providing browser control tools to AI agents.

**Tools Exposed**:

- `navigate_to_url`: Navigate browser context to specified URL
- `click_element`: Click on element matching selector
- `fill_input`: Fill form field with text
- `get_page_content`: Retrieve current page HTML or text
- `take_screenshot`: Capture screenshot of current page
- `execute_script`: Run JavaScript in browser context

**Configuration**:

```json
{
  "name": "playwright",
  "command": "npx",
  "args": ["@playwright/mcp"]
}
```

**Responsibilities**:

- Manage browser context lifecycle
- Execute browser automation commands
- Return structured success/error responses
- Handle timeouts and network failures

**Error Handling**:

- Returns `{code: "NO_CONTEXT"}` when browser context is not open
- Returns timeout errors after 30 seconds of inactivity
- Validates selector syntax before execution

#### Playwright Test MCP (run-test-mcp-server)

**Purpose**: MCP server for executing Playwright tests and retrieving results.

**Tools Exposed**:

- `run_tests`: Execute Playwright tests with specified parameters
- `get_test_status`: Query status of running test execution
- `list_test_files`: Enumerate available test files

**Configuration**:

```json
{
  "name": "playwright-test",
  "command": "npx",
  "args": ["run-test-mcp-server"]
}
```

**Responsibilities**:

- Spawn Playwright test process with correct arguments
- Stream test execution output
- Parse test results from JSON reporter
- Handle test process lifecycle

**Error Handling**:

- Returns structured error if test directory not found
- Captures stderr output from test runner
- Reports test timeouts as execution errors

#### Custom QA MCP Server (playwright-qa)

**Purpose**: Purpose-built MCP server exposing QA-specific tools for test failure analysis and requirements normalization.

**Location**: `mcp-server/` directory with independent `package.json` and `tsconfig.json`

**Tools Exposed**:

**Tool: `get_test_failures`**

```typescript
interface GetTestFailuresInput {
  // No input parameters required
}

interface TestFailure {
  testTitle: string;
  filePath: string;
  errorMessage: string;
  duration: number;
  lineNumber?: number;
  stackTrace?: string;
}

interface GetTestFailuresOutput {
  failures: TestFailure[];
  status: 'success' | 'no_results';
  message: string;
}
```

**Tool: `normalize_requirements`**

```typescript
interface NormalizeRequirementsInput {
  requirementsText: string;
}

interface AcceptanceCriterion {
  id: string;
  description: string;
}

interface RequirementsContract {
  id: string;
  title: string;
  acceptanceCriteria: AcceptanceCriterion[];
  tags: string[];
}

interface NormalizeRequirementsOutput {
  contract: RequirementsContract;
  status: 'success' | 'error';
  error?: {
    code: string;
    message: string;
  };
}
```

**Configuration**:

```json
{
  "name": "playwright-qa",
  "command": "node",
  "args": ["mcp-server/dist/index.js"]
}
```

**Implementation Details**:

**Server Structure**:

```
mcp-server/
├── package.json           # Independent dependencies
├── tsconfig.json          # TypeScript config for server
├── src/
│   ├── index.ts          # Server entry point
│   ├── tools/
│   │   ├── get-test-failures.ts
│   │   └── normalize-requirements.ts
│   └── utils/
│       ├── json-parser.ts
│       └── file-reader.ts
└── dist/                 # Compiled output
    └── index.js
```

**Responsibilities**:

- Start HTTP server on configurable port (default 3100 from `Configuration.MCP_SERVER_PORT`)
- Read Playwright JSON results from `test-results/` directory
- Parse and structure test failure data
- Extract requirements into canonical contract format
- Validate input schemas before processing
- Return structured error responses for invalid inputs

**Error Handling**:

- Returns empty failures array when no results file exists
- Returns structured error object for malformed requirements text
- Rejects port 0 during startup with descriptive error
- Logs all errors via Logger utility

### AI Agent Layer

#### Orchestrator Agent

**Purpose**: Top-level agent that sequences and coordinates the entire test automation pipeline.

**Location**: `.github/agents/orchestrator.agent.md`

**Input Format**:

```typescript
interface OrchestratorInput {
  requirementPath: string; // Path to requirement file in requirements/
}
```

**Output Format**:

```typescript
interface OrchestratorOutput {
  summary: {
    scenariosPlanned: number;
    testsGenerated: number;
    testsPassing: number;
    testsFailing: number;
    testsHealed: number;
  };
  unresolvedFailures?: Array<{
    stage: 'planner' | 'generator' | 'healer';
    errorMessage: string;
  }>;
}
```

**Pipeline Sequence**:

1. **Plan Phase**: Call Planner with requirement file path
2. **Generate Phase**: Pass Planner output to Generator
3. **Execute Phase**: Invoke Playwright test runner via `run_tests` tool
4. **Heal Phase**: If failures ≤ 10, call Healer with failure data
5. **Report Phase**: Produce summary report with stage counts

**MCP Tools Consumed**:

- `run_tests` (from playwright-test)
- `get_test_failures` (from playwright-qa)

**Error Handling Strategy**:

- One diagnostic-and-fix iteration per stage error
- Classify error as "cannot fix" if iteration produces same/new error or invalid output
- Proceed to Report stage even with unresolved failures
- Include "Unresolved Failures" section in final report

**Responsibilities**:

- Validate requirement file exists before starting pipeline
- Track stage execution status and outputs
- Enforce failure count threshold (≤10) for healing
- Coordinate inter-agent communication
- Produce final executive summary

#### Planner Agent

**Purpose**: Analyze requirements and produce structured test-plan documents.

**Location**: `.github/agents/planner.agent.md`

**Input Format**:

```typescript
interface PlannerInput {
  requirementPath: string;
}
```

**Output Format**: Structured Markdown table

```markdown
| Scenario Name      | Steps                                                                   | Expected Result                 |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------- |
| User Login Success | 1. Navigate to login<br>2. Enter credentials<br>3. Click submit         | User is redirected to dashboard |
| User Login Invalid | 1. Navigate to login<br>2. Enter invalid credentials<br>3. Click submit | Error message is displayed      |
```

**MCP Tools Consumed**:

- `normalize_requirements` (from playwright-qa)
- `navigate_to_url` (from playwright, for UI discovery)
- `get_page_content` (from playwright, for element identification)

**Responsibilities**:

- Read and parse requirements file
- Identify positive and negative test scenarios
- Map acceptance criteria to test scenarios
- Identify UI elements requiring POM classes
- Output structured scenario table to `specs/` folder with naming pattern `<feature-name>-test-plan.md`

**Output Validation**:

- Must contain at least one scenario row
- Must have all three required columns
- Each row must have non-empty cells

#### Generator Agent

**Purpose**: Generate Playwright TypeScript test code from test-plan documents.

**Location**: `.github/agents/generator.agent.md`

**Input Format**: Planner output (Markdown table)

**Output Format**: TypeScript `.spec.ts` files written to `src/tests/`

**MCP Tools Consumed**:

- `navigate_to_url` (from playwright, for validation)
- `get_page_content` (from playwright, for selector discovery)

**Code Generation Rules** (documented in agent definition):

1. Import `test` from `@/fixtures/base.fixture` (not `@playwright/test`)
2. Use dependency-injected POM fixtures
3. Wrap steps in `test.step()` blocks
4. Use data factories from `@/shared/utils/factories` for realistic test data
5. Follow kebab-case naming for spec files
6. Include appropriate tags in `test.describe()` block (e.g., `@smoke`, `@regression`)

**Responsibilities**:

- Parse scenario table row-by-row
- Generate one `.spec.ts` file per scenario or logical group
- Create/update POM classes if new pages identified
- Ensure generated code passes TypeScript compilation
- Follow project code style and conventions

**Output Validation**:

- Generated files must pass `tsc --noEmit`
- Generated files must pass `validate-generated-tests.ts` structural checks
- Generated files must pass ESLint without errors

#### Healer Agent

**Purpose**: Diagnose failing tests and propose locator or logic fixes.

**Location**: `.github/agents/healer.agent.md`

**Input Format**:

```typescript
interface HealerInput {
  failures: Array<{
    file: string;
    lineNumber: number;
    errorMessage: string;
  }>;
}
```

**Output Format**:

```typescript
interface HealerOutput {
  fixes: Array<{
    file: string;
    modifiedContent: string;
  }>;
  cannotFix: Array<{
    file: string;
    reason: string;
  }>;
}
```

**MCP Tools Consumed**:

- `navigate_to_url` (from playwright)
- `get_page_content` (from playwright, for current page state)
- `take_screenshot` (from playwright, for visual diagnosis)

**Healing Strategies**:

1. **Locator Fixes**: Update selectors based on current page DOM
2. **Timing Fixes**: Add explicit waits for dynamic content
3. **Logic Fixes**: Correct assertion logic or test flow
4. **Cannot Fix**: Report structural issues requiring human intervention

**Responsibilities**:

- Analyze error messages and stack traces
- Navigate to failing page to inspect current state
- Compare expected vs actual page structure
- Generate modified file content with fixes
- Document issues that require manual intervention

### Framework Core Layer

#### Configuration Module

**Purpose**: Central source of truth for all framework constants and settings.

**Location**: `src/utils/configuration.ts`

**Exported Constants**:

```typescript
// Test classification tags
export enum TAGS {
  SMOKE = '@smoke',
  REGRESSION = '@regression',
  API = '@api',
  UI = '@ui',
  E2E = '@e2e',
}

// Environment configurations
export const ENVIRONMENTS = {
  local: 'http://localhost:3000',
  dev: 'https://dev.example.com',
  qa: 'https://qa.example.com',
  staging: 'https://staging.example.com',
  production: 'https://app.example.com',
} as const;

// Supported browsers
export const BROWSERS = ['chromium', 'firefox', 'webkit'] as const;

// Execution modes
export const RUN_MODES = {
  HEADLESS: 'headless',
  HEADED: 'headed',
  DEBUG: 'debug',
} as const;

// JIRA integration constants
export const JIRA_CONSTANTS = {
  domain: 'https://your-company.atlassian.net',
  projectKey: 'YOUR_PROJECT',
  bugIssueTypeId: '10004',
  descriptionTemplate: '[E2E-FAIL] {title}\n\nFile: {file}\nError: {error}',
};

// Custom MCP server port
export const MCP_SERVER_PORT = 3100;
```

**Runtime Validation**:

- Emits console warning when `JIRA_CONSTANTS.domain` contains placeholder value
- Warning message: `"[WARN] JIRA integration is using placeholder values. Update JIRA_CONSTANTS in src/utils/configuration.ts"`

**Design Decisions**:

- All URLs use placeholder values in default export — no ERPku-specific values
- `ENVIRONMENTS` keys match valid `APP_ENV` values for Env Loader correlation
- `TAGS` enum uses `@` prefix matching Playwright grep tag syntax
- `MCP_SERVER_PORT` is sourced from this file to avoid port conflicts

#### Env Loader Module

**Purpose**: Select and load the correct per-environment `.env` file based on `APP_ENV`.

**Location**: `src/utils/env-loader.ts`

**Interface**:

```typescript
export function loadEnvironment(): void;
```

**Logic Flow**:

```
1. Read APP_ENV from process.env
2. If APP_ENV is undefined → log warn "default environment", set to 'local'
3. If APP_ENV value is not in known set → log warn "unrecognised value", set to 'local'
4. Resolve file path: environments/{APP_ENV}.env
5. If file does not exist → throw Error("Environment file not found: environments/{APP_ENV}.env")
6. Load file via dotenv
7. Log info: "Loaded environment '{APP_ENV}' from environments/{APP_ENV}.env"
```

**Known Environment Set**: `['local', 'dev', 'qa', 'staging', 'production']`

**Error Types**:

- `Error` thrown with descriptive message when environment file is missing
- Warning logged (not thrown) when `APP_ENV` is undefined or unrecognized

**Integration**:

- Called at the top of `playwright.config.ts` before any config is read
- Replaces the existing `dotenv.config({ path: '.env' })` call
- Logger used for all output (never raw `console.log`)

#### Logger Module

**Purpose**: Structured logging to console and persistent log file.

**Location**: `src/utils/logger.ts`

**Interface**:

```typescript
class Logger {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

export const logger: Logger;
```

**Log Format**:

```
[2024-01-15T10:30:45.123Z] [INFO] Environment loaded: local
[2024-01-15T10:30:46.456Z] [WARN] Using placeholder JIRA domain
[2024-01-15T10:30:47.789Z] [ERROR] Test execution failed: timeout
[2024-01-15T10:30:48.012Z] [DEBUG] MCP tool invoked: get_test_failures
```

**Output Destinations**:

- `info`, `debug`: Written to `process.stdout` and `logs/automation.log`
- `warn`, `error`: Written to `process.stderr` and `logs/automation.log`

**Log Level Filtering**:

- When `LOG_LEVEL` env var is not set to `"debug"`, suppress all `debug()` calls
- All other levels always output regardless of `LOG_LEVEL`

**File Management**:

- Creates `logs/` directory if it doesn't exist on first write
- Appends to `logs/automation.log` (does not rotate or truncate)
- Uses line-delimited format for easy parsing

**Implementation Details**:

- Singleton instance exported as `logger`
- Thread-safe file writing via `fs.appendFileSync`
- ISO 8601 timestamps with millisecond precision
- Metadata serialized as JSON when provided

### Test Infrastructure Layer

#### Custom Reporter

**Purpose**: Generate enhanced HTML dashboard with Chart.js donut chart, expandable test steps, dual CI/local modes, and JIRA integration.

**Location**: `src/support/custom-reporter.ts`

**Implements**: Playwright `Reporter` interface

**Core Functionality**:

**Data Collection**:

```typescript
interface CollectedTestData {
  totalTests: number;
  passedTests: number;
  skippedTests: number;
  failedTests: Array<{
    title: string;
    file: string;
    error: string;
    duration: number;
    steps?: Array<{
      name: string;
      status: 'passed' | 'failed';
    }>;
    traceFile?: string; // Link to Playwright HTML report
  }>;
}
```

**Report Modes**:

**Local Mode** (`CI` != `"true"`):

- Simplified HTML with summary card
- Chart.js donut chart (passed/failed/skipped percentages)
- Expandable failure table (click row to see steps)
- Minimal metadata
- File: `reports/custom-dashboard.html`

**CI Mode** (`CI` === `"true"`):

- Detailed HTML with full stack traces
- Step timings and metadata
- Full test hierarchy
- Jenkins-compatible artifact format
- Exits with non-zero code if report generation fails
- File: `reports/custom-dashboard.html`

**Chart.js Donut Chart**:

```javascript
{
  type: 'doughnut',
  data: {
    labels: ['Passed', 'Failed', 'Skipped'],
    datasets: [{
      data: [passedTests, failedTests, skippedTests],
      backgroundColor: ['#10b981', '#ef4444', '#64748b']
    }]
  },
  options: {
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true }
    }
  }
}
```

**Expandable Test Steps**:

- Click failed test row → expands to show nested `<ul>` with step names
- Each step shows pass/fail icon
- Implemented via HTML `<details>` element or JavaScript toggle

**JIRA Integration**:

- Reads domain, project ID, issue type ID from `JIRA_CONSTANTS`
- Generates pre-filled JIRA ticket URL for each failed test
- URL format: `{domain}/secure/CreateIssueDetails!init.jspa?pid={projectId}&issuetype={issueTypeId}&summary=[E2E-FAIL] {title}&description={description}`
- Description includes test title, file path, error trace, timestamp

**Playwright HTML Report Links**:

- When trace file exists for failed test, renders clickable link
- Link opens native Playwright HTML report for that specific test
- Link text: "📊 View Trace"

**JSON Summary**:

```typescript
interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  timestamp: string;
}
```

- Written to `reports/test-summary.json`
- Machine-readable format for CI/CD consumption

**Error Handling**:

- If `fs.mkdirSync('reports')` fails with EEXIST, continue without error
- If Chart.js CDN fails to load, render static table only (no chart)
- If JIRA URL generation fails, omit JIRA button for that test

#### Fixtures Module

**Purpose**: Dependency injection for Page Object Models into test functions.

**Location**: `src/fixtures/base.fixture.ts`

**Pattern**: Playwright test fixture extension

**Interface**:

```typescript
type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  customersGroupPage: CustomersGroupPage;
  customersAllPage: CustomersAllPage;
  customersNewPage: CustomersNewPage;
  customersDetailPage: CustomersDetailPage;
  customersEditPage: CustomersEditPage;
  // Additional POMs added as framework grows
};

export const test = base.extend<MyFixtures>({
  /* fixture implementations */
});
export { expect } from '@playwright/test';
```

**Usage in Tests**:

```typescript
import { test, expect } from '@/fixtures/base.fixture';

test('scenario', async ({ loginPage, dashboardPage }) => {
  // POMs are pre-instantiated and ready to use
  await loginPage.navigate();
  await loginPage.login('user', 'pass');
  await expect(dashboardPage.welcomeMessage).toBeVisible();
});
```

**Responsibilities**:

- Instantiate POM classes with current `page` object
- Provide clean instances per test
- Enable type-safe test code with autocomplete
- Centralize POM registration

### Code Quality Layer

#### Test Validator

**Purpose**: Static analysis of AI-generated test files for structural compliance.

**Location**: `validate-generated-tests.ts` (project root)

**Execution**: `npx tsx validate-generated-tests.ts` or `npm run validate`

**Validation Rules**:

1. **Import Rule**: File must import `test` from `@/fixtures/base.fixture`
   - Pattern: `import.*test.*from.*@/fixtures/base\.fixture`
   - Violation: Reports line number and exits code 1

2. **Describe Block Rule**: File must contain at least one `test.describe` block
   - Pattern: `test\.describe\(`
   - Violation: Reports file path and exits code 1

3. **Step Usage Rule**: File must use at least one `test.step` call
   - Pattern: `test\.step\(`
   - Violation: Reports line number and exits code 1

**Output Format**:

**Success**:

```
✓ Validated 15 test files
✓ All structural checks passed
```

**Failure**:

```
✗ src/tests/ui/login.spec.ts:1
  Violation: Missing import from base.fixture

✗ src/tests/ui/dashboard.spec.ts:10
  Violation: No test.describe block found

Validation failed: 2 errors found
```

**Exit Codes**:

- `0`: All files pass all rules OR system errors occurred without rule violations
- `1`: One or more files violate structural rules

**Error Handling**:

- If directory read fails, log warning and continue
- If file parse fails, log warning and continue
- Only exit code 1 if validation rules are violated
- System errors do not fail validation

**Integration**:

- Called by Husky pre-commit hook after lint-staged
- Prevents structurally invalid generated tests from being committed

#### Husky + lint-staged

**Purpose**: Pre-commit hooks for automated code quality enforcement.

**Configuration**:

**package.json**:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

**.husky/pre-commit**:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run validate
```

**Execution Flow**:

1. Developer runs `git commit`
2. Husky intercepts and executes `.husky/pre-commit`
3. `lint-staged` runs ESLint and Prettier on staged files
4. If ESLint produces remaining errors after auto-fix, exit code 1 blocks commit
5. If lint-staged succeeds, `npm run validate` executes
6. If validator finds structural violations, exit code 1 blocks commit
7. If all checks pass, commit proceeds

## Data Models

### Environment Configuration Schema

```typescript
// environments/{env}.env file structure
interface EnvironmentFile {
  BASE_URL: string;           // Application base URL
  LOGIN_USERNAME?: string;    // Optional auth credentials
  LOGIN_PASSWORD?: string;
  API_KEY?: string;           // Optional API keys
  CI?: 'true' | 'false';     // CI mode flag
  LOG_LEVEL?: 'info' | 'warn' | 'error' | 'debug';
}

// Example: environments/local.env
BASE_URL=http://localhost:3000
LOGIN_USERNAME=test@example.com
LOGIN_PASSWORD=testpass123
CI=false
LOG_LEVEL=debug

// Example: environments/qa.env
BASE_URL=https://qa.example.com
LOGIN_USERNAME=qa-user@example.com
LOGIN_PASSWORD=qa-secure-pass
CI=true
LOG_LEVEL=info
```

### MCP Configuration Schema

```typescript
// .vscode/mcp.json structure
interface MCPConfig {
  servers: MCPServer[];
}

interface MCPServer {
  name: string;           // Unique server name
  command: string;        // Executable command (node, npx)
  args: string[];         // Command arguments
}

// Example
{
  "servers": [
    {
      "name": "playwright",
      "command": "npx",
      "args": ["@playwright/mcp"]
    },
    {
      "name": "playwright-test",
      "command": "npx",
      "args": ["run-test-mcp-server"]
    },
    {
      "name": "playwright-qa",
      "command": "node",
      "args": ["mcp-server/dist/index.js"]
    }
  ]
}
```

### Test Plan Schema

```typescript
// Output from Planner agent (Markdown format)
interface TestPlan {
  scenarios: Scenario[];
}

interface Scenario {
  name: string; // Scenario title
  steps: string[]; // Numbered test steps
  expectedResult: string; // Expected outcome
}

// Markdown table format
/*
| Scenario Name         | Steps                                      | Expected Result              |
|-----------------------|--------------------------------------------|------------------------------|
| User Login Success    | 1. Navigate to /login                      | User redirected to dashboard |
|                       | 2. Enter valid credentials                 |                              |
|                       | 3. Click submit                            |                              |
| Invalid Credentials   | 1. Navigate to /login                      | Error message displayed      |
|                       | 2. Enter invalid credentials               |                              |
|                       | 3. Click submit                            |                              |
*/
```

### Test Failure Schema

```typescript
// Custom MCP server get_test_failures output
interface TestFailure {
  testTitle: string;      // Full test title from Playwright
  filePath: string;       // Relative path from project root
  errorMessage: string;   // Error text or stack trace
  duration: number;       // Test duration in milliseconds
  lineNumber?: number;    // Line where failure occurred
  stackTrace?: string;    // Full stack trace if available
}

// Example
{
  "testTitle": "Login flow > should successfully log in with valid credentials",
  "filePath": "src/tests/ui/auth/login.spec.ts",
  "errorMessage": "Timeout 30000ms exceeded waiting for selector 'button[type=\"submit\"]'",
  "duration": 30124,
  "lineNumber": 15,
  "stackTrace": "Error: Timeout 30000ms exceeded...\n    at LoginPage.clickSubmit..."
}
```

### Requirements Contract Schema

```typescript
// Custom MCP server normalize_requirements output
interface RequirementsContract {
  id: string;                           // Unique requirement ID
  title: string;                        // Requirement title
  acceptanceCriteria: AcceptanceCriterion[];
  tags: string[];                       // Classification tags
}

interface AcceptanceCriterion {
  id: string;                           // Criterion ID (e.g., "AC-1")
  description: string;                  // Criterion text
}

// Example
{
  "id": "REQ-AUTH-001",
  "title": "User Authentication",
  "acceptanceCriteria": [
    {
      "id": "AC-1",
      "description": "User can log in with valid email and password"
    },
    {
      "id": "AC-2",
      "description": "User receives error message with invalid credentials"
    },
    {
      "id": "AC-3",
      "description": "User session persists after page refresh"
    }
  ],
  "tags": ["@authentication", "@smoke", "@ui"]
}
```

### Project Directory Structure

```
project-root/
├── .github/
│   ├── agents/
│   │   ├── orchestrator.agent.md
│   │   ├── planner.agent.md
│   │   ├── generator.agent.md
│   │   └── healer.agent.md
│   ├── workflows/
│   │   └── playwright.yml
│   ├── AGENTS.md
│   └── MAINTENANCE.md
├── .vscode/
│   └── mcp.json
├── .husky/
│   └── pre-commit
├── environments/
│   ├── local.env
│   ├── dev.env
│   ├── qa.env
│   └── staging.env
├── mcp-server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── tools/
│   │   │   ├── get-test-failures.ts
│   │   │   └── normalize-requirements.ts
│   │   └── utils/
│   └── dist/
├── src/
│   ├── pages/
│   │   ├── ui/
│   │   │   ├── BasePage.ts
│   │   │   ├── LoginPage.ts
│   │   │   └── DashboardPage.ts
│   │   └── api/
│   ├── tests/
│   │   ├── ui/
│   │   │   └── auth/
│   │   │       └── login.spec.ts
│   │   ├── api/
│   │   └── e2e/
│   ├── fixtures/
│   │   └── base.fixture.ts
│   ├── shared/
│   │   ├── mock-data/
│   │   ├── types/
│   │   └── utils/
│   │       └── factories.ts
│   ├── support/
│   │   ├── auth.setup.ts
│   │   └── custom-reporter.ts
│   └── utils/
│       ├── configuration.ts
│       ├── env-loader.ts
│       └── logger.ts
├── example/
│   └── erpku-specific/
│       ├── pages/
│       └── tests/
├── requirements/
│   ├── .gitkeep
│   └── feature-auth.md
├── specs/
│   ├── .gitkeep
│   └── feature-auth-test-plan.md
├── reports/
│   ├── custom-dashboard.html
│   └── test-summary.json
├── logs/
│   └── automation.log
├── validate-generated-tests.ts
├── CUSTOM-MCP.md
├── README.md
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection Analysis

After analyzing all acceptance criteria, 15 properties were initially identified for property-based testing. Through reflection analysis, the following redundancies were identified and resolved:

**Redundancy Group 1: Logger Output Properties (8.2, 8.3)**

- Property 8.2 tests that messages are written to stdout/stderr with correct format
- Property 8.3 tests that messages are written to logs/automation.log
- These can be combined into a single comprehensive property that verifies both console and file output

**Redundancy Group 2: Reporter Chart and HTML Properties (7.1, 7.2, 7.7)**

- Property 7.1 tests Chart.js donut chart rendering
- Property 7.2 tests expandable test steps in HTML
- Property 7.7 tests file output to both HTML and JSON
- These are all aspects of the same Reporter output generation behavior
- Combined into one property: "Reporter output completeness"

**Redundancy Group 3: Test Validator File Scanning (12.2, 12.3)**

- Property 12.2 tests validator scans and identifies violations
- Property 12.3 tests output format for violations
- Property 12.3 is logically covered by 12.2
- Eliminated 12.3 as redundant

**Final Property Count: 12 non-redundant properties**

### Property 1: Test Failure Data Retrieval

_For any_ valid Playwright JSON results file containing test failure data, the `get_test_failures` tool SHALL parse the file and return a structured array where each failure object contains testTitle, filePath, errorMessage, and duration fields matching the source data.

**Validates: Requirements 3.1**

### Property 2: Requirements Normalization Round-Trip

_For any_ valid requirements text input, parsing with `normalize_requirements` then formatting the output back to text representation then parsing again SHALL produce an equivalent canonical contract object with the same id, title, acceptanceCriteria array, and tags array.

**Validates: Requirements 3.8**

### Property 3: Requirements Error Handling

_For any_ malformed or empty input to `normalize_requirements` (including empty strings, whitespace-only strings, or strings with invalid structure), the tool SHALL return a structured error object containing both a code field and a human-readable message field.

**Validates: Requirements 3.4**

### Property 4: Environment Fallback Behavior

_For any_ string value of APP_ENV that is not in the known environment set ['local', 'dev', 'qa', 'staging', 'production'], the Env_Loader SHALL default to loading 'local.env' and log a warning message identifying the unrecognized value.

**Validates: Requirements 5.2**

### Property 5: Reporter Output Completeness

_For any_ test execution result data (with varying counts of passed, failed, and skipped tests, including tests with steps), the Reporter SHALL generate both an HTML file containing a Chart.js donut chart with correct percentages and a JSON summary file with accurate total, passed, failed, skipped, passRate, and timestamp fields.

**Validates: Requirements 7.1, 7.2, 7.7**

### Property 6: Reporter Trace Link Generation

_For any_ failed test result that includes a traceFile path, the generated HTML output SHALL contain a clickable link to the Playwright native report for that specific test.

**Validates: Requirements 7.6**

### Property 7: Reporter CI Mode Selection

_For any_ environment variable value for CI that is not exactly the string "true", the Reporter SHALL generate a simplified local HTML report rather than a detailed Jenkins-compatible report.

**Validates: Requirements 7.4**

### Property 8: Logger Dual Output

_For any_ log message string and log level (info, warn, error, or debug), the Logger SHALL write the message with an ISO 8601 timestamp and level label to both the console (stdout for info/debug, stderr for warn/error) and append it to logs/automation.log in line-delimited format.

**Validates: Requirements 8.2, 8.3**

### Property 9: Logger Debug Suppression

_For any_ debug log message string, when the LOG_LEVEL environment variable is not set to "debug", the message SHALL NOT appear in either stdout or the logs/automation.log file.

**Validates: Requirements 8.6**

### Property 10: Test Validator Structural Compliance

_For any_ TypeScript spec file in src/tests/, the validator SHALL correctly identify whether the file is structurally compliant (imports test from @/fixtures/base.fixture, contains test.describe block, uses test.step), and for non-compliant files, SHALL report the file path, violated rule name, and line number where the violation was detected.

**Validates: Requirements 12.2**

### Property 11: Requirements to Test Data Transformation

_For any_ test failure data structure with fields (testTitle, filePath, errorMessage, duration), the Custom MCP Server's `get_test_failures` tool SHALL preserve all field values exactly when reading from the Playwright JSON results file, without truncation, transformation, or data loss.

**Validates: Requirements 3.1**

### Property 12: Configuration Placeholder Warning

_For any_ code module that imports and accesses JIRA_CONSTANTS.domain when the value matches the placeholder pattern (e.g., contains "your-company" or "example.com"), the Configuration module SHALL emit a console warning indicating that JIRA integration is using placeholder values.

**Validates: Requirements 4.7**

## Error Handling

### MCP Server Layer Errors

#### Playwright MCP

- **Browser Context Not Open**: Returns `{code: "NO_CONTEXT", message: "No browser context currently open"}` instead of throwing exception
- **Timeout Errors**: Returns structured error after 30 seconds with timeout message and last known state
- **Selector Errors**: Validates selector syntax before execution; returns structured error for invalid selectors
- **Network Failures**: Catches and returns structured errors for navigation failures with HTTP status codes

#### Custom QA MCP Server

- **Missing Results File**: Returns `{failures: [], status: "no_results", message: "No test results file found in test-results/"}` instead of throwing
- **Malformed JSON**: Returns structured error `{code: "INVALID_JSON", message: "Failed to parse test results: {parseError}"}` when results file is not valid JSON
- **Invalid Requirements Input**: Returns `{status: "error", error: {code: "INVALID_INPUT", message: "Requirements text cannot be empty"}}` for empty or malformed input
- **Port Binding Failure**: Throws descriptive error during startup: `"Failed to start MCP server: Port {port} is invalid or already in use"` when port is 0 or unavailable
- **File System Errors**: Logs warning and returns empty results when file read fails; does not crash server

### Framework Core Layer Errors

#### Env Loader

- **Missing Environment File**: Throws `Error("Environment file not found: environments/{env}.env")` with full path before test execution starts
- **Unrecognized APP_ENV**: Logs warning `"[WARN] Unrecognized APP_ENV value '{value}'. Defaulting to local environment."` and continues with local.env
- **Undefined APP_ENV**: Logs warning `"[WARN] APP_ENV not set. Using default environment: local"` and continues with local.env
- **Malformed .env File**: Allows dotenv to handle parse errors; logs error if dotenv fails to load file

#### Logger

- **Missing logs/ Directory**: Automatically creates directory on first write; logs error if creation fails but continues
- **File Write Failures**: Catches and logs write errors to stderr; continues with console-only logging if file writes fail
- **Invalid Metadata**: Safely handles non-serializable metadata objects by logging `[Unserializable Metadata]` placeholder

#### Configuration

- **Placeholder Values**: Emits console warning when JIRA_CONSTANTS contains placeholder patterns; does not throw or block execution
- **Type Mismatches**: Enforced at compile time via TypeScript; no runtime validation needed

### Test Infrastructure Layer Errors

#### Reporter

- **Directory Creation Failure**: If `fs.mkdirSync('reports')` fails with EEXIST (directory already exists), continues without error
- **Chart.js CDN Failure**: If Chart.js fails to load in browser, renders static summary table without chart; does not fail report generation
- **JIRA URL Generation Failure**: If JIRA_CONSTANTS are missing or invalid, omits JIRA button for that test; continues rendering other elements
- **CI Report Generation Failure**: In CI mode, if HTML generation fails, logs error with stack trace and exits process with code 1
- **Local Report Generation Failure**: In local mode, if HTML generation fails, logs error and attempts to write JSON summary only; exits code 0 if JSON succeeds

#### Fixtures

- **POM Instantiation Failure**: If POM constructor throws, Playwright test framework catches and reports as test setup failure
- **Missing Page Object**: TypeScript compilation fails if test references undefined fixture; caught before runtime

### Code Quality Layer Errors

#### Test Validator

- **Directory Read Failure**: Logs warning `"[WARN] Failed to read directory {path}: {error}"` and continues with remaining directories; does not fail validation
- **File Parse Failure**: Logs warning `"[WARN] Failed to parse file {path}: {error}"` and continues with remaining files; does not fail validation
- **Structural Violation**: Prints violation details to stdout `"✗ {filePath}:{lineNumber}\n  Violation: {ruleName}"` and exits with code 1
- **System Errors Without Violations**: If system errors occur (read/parse failures) but no validation rule violations found, exits code 0 after logging all warnings

#### Husky + lint-staged

- **ESLint Auto-fix Leaves Errors**: If `eslint --fix` completes but remaining lint errors exist, lint-staged exits code 1 and blocks commit with error details
- **Prettier Failures**: If `prettier --write` fails, lint-staged exits code 1 and blocks commit
- **Validator Failures**: If `npm run validate` exits code 1, pre-commit hook blocks commit and displays validator output

### AI Agent Layer Errors

#### Orchestrator

- **Stage Error Recovery**: On stage error, attempts one diagnostic-and-fix iteration; if error persists or new error occurs, classifies as "cannot fix"
- **Invalid Generator Output**: If Generator produces malformed TypeScript that fails compilation, treats as "cannot fix" and records in Unresolved Failures
- **Healer Crash**: If Healer process crashes, catches error, records in Unresolved Failures with error message, and proceeds to Report stage
- **Pipeline Continuation**: Even with unresolved failures, always reaches Report stage and produces summary with partial results

## Testing Strategy

### Testing Approach

The framework employs a **dual testing strategy** combining unit tests and property-based tests to achieve comprehensive coverage:

- **Unit Tests**: Validate specific examples, edge cases, error conditions, and integration points
- **Property-Based Tests**: Verify universal correctness properties across wide input spaces using randomized test data
- **Integration Tests**: Verify MCP server interactions, agent pipeline coordination, and external tool integration
- **Smoke Tests**: Validate file structure, configuration content, and environment setup

### Property-Based Testing Implementation

**Property-based testing IS appropriate for this framework** because it contains:

- Pure functions with clear input/output behavior (parsers, normalizers, validators)
- Universal properties that hold across wide input spaces (logging, reporting, configuration)
- Transformation logic requiring correctness guarantees (requirements normalization, test failure parsing)

**Property-based testing is NOT used for**:

- Agent definitions (Markdown files driving AI behavior - tested via document structure validation)
- MCP server registration (configuration file - tested via schema validation)
- File structure migrations (one-time operations - tested via smoke tests)
- Git hooks and lint configuration (infrastructure - tested via integration tests)

### Property-Based Testing Library Selection

**Target Language**: TypeScript/Node.js

**Selected Library**: **fast-check** (https://github.com/dubzzz/fast-check)

**Rationale**:

- Native TypeScript support with full type safety
- Comprehensive built-in generators (strings, numbers, objects, arrays)
- Shrinking capability to find minimal failing examples
- Mature ecosystem with excellent documentation
- Integrates seamlessly with standard test runners (Vitest, Jest, Node test runner)

**Installation**:

```bash
npm install --save-dev fast-check
```

### Property Test Configuration

**Minimum Iterations**: 100 runs per property test (due to randomized input generation)

**Test Tagging Convention**: Each property-based test MUST include a comment tag referencing the design document property:

```typescript
// Feature: playwright-ai-agent-framework, Property 1: Test Failure Data Retrieval
test('get_test_failures returns structured failure data', () => {
  fc.assert(
    fc.property(fc.array(failureGenerator), (failures) => {
      // Test implementation
    }),
    { numRuns: 100 },
  );
});
```

**Tag Format**: `// Feature: {feature-name}, Property {number}: {property-title}`

### Test Organization

**Test Directory Structure**:

```
tests/
├── unit/                              # Unit tests for framework components
│   ├── utils/
│   │   ├── configuration.test.ts
│   │   ├── env-loader.test.ts
│   │   └── logger.test.ts
│   ├── support/
│   │   └── custom-reporter.test.ts
│   └── mcp-server/
│       ├── get-test-failures.test.ts
│       └── normalize-requirements.test.ts
├── property/                          # Property-based tests
│   ├── logger-properties.test.ts
│   ├── reporter-properties.test.ts
│   ├── env-loader-properties.test.ts
│   ├── mcp-server-properties.test.ts
│   └── validator-properties.test.ts
├── integration/                       # Integration tests
│   ├── mcp-server-integration.test.ts
│   ├── agent-pipeline.test.ts
│   └── playwright-config.test.ts
└── smoke/                             # Smoke tests
    ├── file-structure.test.ts
    ├── configuration-schema.test.ts
    └── documentation.test.ts
```

### Test Runner Configuration

**Primary Test Runner**: Node.js built-in test runner (`node:test`)

**Alternative**: Vitest (for frameworks preferring a more feature-rich test runner)

**Test Script**:

```json
{
  "scripts": {
    "test:unit": "node --test tests/unit/**/*.test.ts",
    "test:property": "node --test tests/property/**/*.test.ts",
    "test:integration": "node --test tests/integration/**/*.test.ts",
    "test:smoke": "node --test tests/smoke/**/*.test.ts",
    "test": "node --test tests/**/*.test.ts"
  }
}
```

### Property Test Implementations

Each of the 12 correctness properties maps to a single property-based test:

**Property 1 Implementation** (`mcp-server-properties.test.ts`):

```typescript
// Feature: playwright-ai-agent-framework, Property 1: Test Failure Data Retrieval
const failureArbitrary = fc.record({
  testTitle: fc.string({ minLength: 1 }),
  filePath: fc.string({ minLength: 1 }),
  errorMessage: fc.string({ minLength: 1 }),
  duration: fc.nat(),
});

fc.assert(
  fc.property(fc.array(failureArbitrary, { minLength: 0, maxLength: 50 }), (failures) => {
    writeTestResultsFile(failures);
    const result = getTestFailures();
    return (
      result.failures.length === failures.length &&
      result.failures.every(
        (f, i) => f.testTitle === failures[i].testTitle && f.filePath === failures[i].filePath,
      )
    );
  }),
  { numRuns: 100 },
);
```

**Property 2 Implementation** (`mcp-server-properties.test.ts`):

```typescript
// Feature: playwright-ai-agent-framework, Property 2: Requirements Normalization Round-Trip
const requirementsArbitrary = fc.record({
  title: fc.string({ minLength: 1 }),
  criteria: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
  tags: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
});

fc.assert(
  fc.property(requirementsArbitrary, (req) => {
    const contract1 = normalizeRequirements(formatRequirements(req));
    const contract2 = normalizeRequirements(formatContract(contract1));
    return contractsAreEquivalent(contract1, contract2);
  }),
  { numRuns: 100 },
);
```

**Property 8 Implementation** (`logger-properties.test.ts`):

```typescript
// Feature: playwright-ai-agent-framework, Property 8: Logger Dual Output
const levelArbitrary = fc.constantFrom('info', 'warn', 'error', 'debug' as const);

fc.assert(
  fc.property(fc.string({ minLength: 1 }), levelArbitrary, (message, level) => {
    const { stdoutCapture, stderrCapture, fileContent } = captureLoggerOutput(() => {
      logger[level](message);
    });

    const consoleOutput = level === 'warn' || level === 'error' ? stderrCapture : stdoutCapture;
    const hasISO8601 = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(consoleOutput);
    const hasLevel = consoleOutput.includes(`[${level.toUpperCase()}]`);
    const inFile = fileContent.includes(message);

    return hasISO8601 && hasLevel && inFile;
  }),
  { numRuns: 100 },
);
```

**Property 10 Implementation** (`validator-properties.test.ts`):

```typescript
// Feature: playwright-ai-agent-framework, Property 10: Test Validator Structural Compliance
const validSpecArbitrary = fc
  .record({
    hasImport: fc.constant(true),
    hasDescribe: fc.constant(true),
    hasStep: fc.constant(true),
  })
  .map((flags) => generateSpecContent(flags));

const invalidSpecArbitrary = fc
  .record({
    hasImport: fc.boolean(),
    hasDescribe: fc.boolean(),
    hasStep: fc.boolean(),
  })
  .filter((flags) => !flags.hasImport || !flags.hasDescribe || !flags.hasStep)
  .map((flags) => ({ content: generateSpecContent(flags), ...flags }));

fc.assert(
  fc.property(
    fc.oneof(
      validSpecArbitrary.map((c) => ({ content: c, shouldPass: true })),
      invalidSpecArbitrary.map((s) => ({ content: s.content, shouldPass: false })),
    ),
    ({ content, shouldPass }) => {
      const result = validateSpecContent(content);
      return shouldPass ? result.valid : !result.valid && result.violatedRule && result.lineNumber;
    },
  ),
  { numRuns: 100 },
);
```

### Unit Test Coverage

**Unit tests complement property-based tests** by validating:

1. **Specific Examples**: Concrete scenarios that demonstrate correct behavior
   - Logger outputs correctly formatted message for known input
   - Env Loader loads dev.env when APP_ENV='dev'
   - Reporter generates HTML with specific test result structure

2. **Edge Cases**: Boundary conditions and special inputs
   - get_test_failures returns empty array when no results file exists
   - Env Loader creates logs/ directory if missing
   - Reporter continues when Chart.js CDN fails to load

3. **Error Conditions**: Expected error responses for invalid inputs
   - normalize_requirements returns error for empty string input
   - Env Loader throws when environment file doesn't exist
   - Custom MCP Server rejects port 0 with descriptive error

4. **Integration Points**: Cross-component interactions
   - playwright.config.ts successfully imports and uses Env Loader
   - Reporter correctly uses JIRA_CONSTANTS from Configuration
   - Logger is used by Env Loader, Custom MCP Server, and Reporter

### Smoke Test Coverage

**Smoke tests validate project structure and configuration**:

1. **File Structure Tests**:
   - All required directories exist (src/pages/ui/, src/tests/ui/, environments/, etc.)
   - All required files exist (.vscode/mcp.json, AGENTS.md, CUSTOM-MCP.md, etc.)
   - ERPku-specific code moved to example/ directory
   - No files remain in old tests/ location after migration

2. **Configuration Schema Tests**:
   - .vscode/mcp.json is valid JSON with required server entries
   - tsconfig.json @/_ path maps to ./src/_
   - package.json contains required scripts and dependencies
   - playwright.config.ts testDir points to ./src/tests

3. **Documentation Content Tests**:
   - AGENTS.md contains sections for all four agents (orchestrator, planner, generator, healer)
   - CUSTOM-MCP.md documents all exposed tools with schemas
   - MAINTENANCE.md contains instructions for adding environments, tags, MCP tools, reporter fields
   - README.md contains "Getting Started" section with adaptation steps

4. **Compilation Tests**:
   - `tsc --noEmit` completes without errors
   - All import paths resolve after src/ migration
   - No broken references to old test/ paths

### Integration Test Coverage

**Integration tests validate end-to-end workflows**:

1. **MCP Server Integration**:
   - Custom MCP Server starts successfully on configured port
   - get_test_failures tool reads actual Playwright JSON results
   - normalize_requirements tool processes real requirement documents
   - All three MCP servers can be located and started from .vscode/mcp.json

2. **Agent Pipeline Integration**:
   - Planner agent definition specifies valid MCP tool dependencies
   - Generator agent definition describes correct code generation rules
   - Healer agent definition specifies diagnostic strategies
   - Orchestrator agent definition coordinates pipeline sequence

3. **Git Hooks Integration**:
   - Husky pre-commit hook executes lint-staged and validator
   - lint-staged runs ESLint and Prettier on staged files
   - Validator blocks commit when structural violations detected
   - ESLint errors block commit after auto-fix

4. **Environment Configuration Integration**:
   - Env Loader successfully loads each environment file
   - playwright.config.ts receives correct BASE_URL from loaded env
   - Logger receives correct LOG_LEVEL from loaded env

### Test Execution Strategy

**Development Workflow**:

1. Run property-based tests during feature development to catch edge cases early
2. Run unit tests for specific functionality validation
3. Run smoke tests after structural changes (migrations, refactoring)
4. Run full test suite before committing

**CI/CD Pipeline**:

1. Smoke tests (fast validation of structure and configuration)
2. Unit tests (comprehensive coverage of components)
3. Property-based tests (deep validation of correctness properties)
4. Integration tests (end-to-end workflow validation)
5. Playwright E2E tests (application-level validation)

**Pre-Commit Hook**:

1. Husky executes lint-staged (ESLint + Prettier on staged files)
2. Husky executes npm run validate (test validator on generated tests)
3. If both pass, commit proceeds
4. If either fails, commit is blocked with error details

### Test Maintenance Guidelines

**When to Add Property Tests**:

- New transformation functions (parsers, serializers, normalizers)
- New validation logic with complex input spaces
- New reporting or logging functionality
- Any function where "for all inputs X, property P(X) holds" can be stated

**When to Add Unit Tests**:

- New specific features with concrete examples
- New edge cases discovered through debugging
- New error handling paths
- New integration points between components

**When to Update Property Tests**:

- When correctness properties change (e.g., new required fields in output)
- When input/output schemas evolve
- When new generators needed for additional data types

**Test Documentation Requirements**:

- Every property test MUST include the feature-property tag comment
- Every test file MUST have a header comment describing its purpose
- Complex test helpers MUST have JSDoc comments explaining their behavior

## Implementation Notes

### Migration Strategy

**Phase 1: Foundation** (Environment and Configuration)

1. Create `environments/` folder with template .env files
2. Implement `src/utils/env-loader.ts`
3. Implement `src/utils/configuration.ts`
4. Implement `src/utils/logger.ts`
5. Update `playwright.config.ts` to use Env Loader
6. Update `.gitignore` for environments/

**Phase 2: MCP Infrastructure**

1. Create `.vscode/mcp.json` with three server registrations
2. Implement Custom MCP Server (`mcp-server/` directory)
3. Implement `get_test_failures` tool
4. Implement `normalize_requirements` tool
5. Test MCP server startup and tool invocations
6. Create CUSTOM-MCP.md documentation

**Phase 3: Project Structure Migration**

1. Create `src/` directory structure
2. Migrate POMs from `tests/pages/` to `src/pages/ui/`
3. Migrate specs from `tests/specs/` to `src/tests/ui/`
4. Migrate fixtures, support, utils to `src/`
5. Update all import paths
6. Update `tsconfig.json` path aliases
7. Verify `tsc --noEmit` succeeds

**Phase 4: AI Agent Definitions**

1. Create `orchestrator.agent.md`
2. Update `planner.agent.md` with MCP Dependencies section
3. Update `generator.agent.md` with MCP Dependencies section
4. Update `healer.agent.md` with MCP Dependencies section
5. Create `requirements/` and `specs/` folders
6. Create AGENTS.md documentation

**Phase 5: Enhanced Reporting**

1. Update `src/support/custom-reporter.ts` with Chart.js integration
2. Implement expandable test steps
3. Implement dual CI/local modes
4. Update JIRA integration to use Configuration
5. Add Playwright HTML report trace links
6. Implement JSON summary output

**Phase 6: Code Quality Gates**

1. Install Husky and lint-staged dependencies
2. Create `.husky/pre-commit` hook
3. Configure lint-staged in package.json
4. Implement `validate-generated-tests.ts` script
5. Test pre-commit hook blocks invalid commits

**Phase 7: Open Source Preparation**

1. Move ERPku-specific code to `example/` directory
2. Replace all hardcoded values with placeholders in Configuration
3. Update README.md with Getting Started section
4. Create MAINTENANCE.md governance document
5. Verify `npm run typecheck` succeeds on fresh clone
6. Create comprehensive examples in `example/` directory

### Backward Compatibility Strategy

**Existing ERPku Tests Must Continue Working**:

1. Migrate existing tests to new structure without modifying logic
2. Preserve existing POM class APIs
3. Maintain existing fixture names and signatures
4. Keep existing test data files compatible
5. Ensure existing auth setup continues to function
6. Verify all existing tests pass after migration

**Compatibility Testing**:

- Run full existing test suite after each migration phase
- Compare test results before and after migration
- Verify no tests are broken due to path changes
- Ensure auth state persistence still works
- Validate custom reporter still generates expected output

### Performance Considerations

**MCP Server Response Times**:

- Target: < 1 second for get_test_failures on typical result files (< 100 tests)
- Target: < 500ms for normalize_requirements on typical requirement documents (< 20 criteria)
- Optimization: Cache parsed JSON results if called multiple times in same session
- Optimization: Use streaming JSON parser for large result files

**Reporter Generation**:

- Target: < 5 seconds for report generation with 500+ tests
- Optimization: Generate Chart.js chart client-side (no server-side rendering)
- Optimization: Paginate failure table if > 100 failures
- Memory consideration: Stream HTML output instead of building full string in memory

**Logger File I/O**:

- Use `fs.appendFileSync` for simplicity (acceptable for dev/test workloads)
- Consider async file writes if logging becomes a bottleneck
- Rotation strategy: Manual cleanup or log rotation tool (outside framework scope)

**Env Loader**:

- Loads environment file once at startup (no performance concern)
- Caches loaded values in process.env (Node.js built-in)

**Test Validator**:

- Target: < 10 seconds to scan 100+ test files
- Optimization: Parallel file reads using Promise.all
- Optimization: Regex-based pattern matching (no full AST parsing needed)

### Security Considerations

**Environment Files**:

- All `.env` files in `environments/` are gitignored by default (except templates)
- Example files committed to repository contain only placeholder values
- Production credentials never committed to repository
- README.md includes warning about credential management

**MCP Server Port Binding**:

- Custom MCP Server binds to localhost only (not exposed to network)
- Port configurable via Configuration (default 3100)
- No authentication required (local-only development tool)
- Consider authentication if server is exposed beyond localhost

**JIRA Integration**:

- Pre-filled URLs only (no automated ticket creation)
- No JIRA credentials stored in framework
- User must authenticate with JIRA separately in browser

**Dependency Management**:

- All dependencies from npm registry (official sources)
- Husky prepare script runs automatically on npm install
- package-lock.json committed to ensure reproducible builds
- Regular dependency updates via automated tools (Dependabot, Renovate)

**Code Injection Prevention**:

- Validator uses regex pattern matching (no eval or dynamic execution)
- Logger escapes metadata before serialization
- Reporter HTML escapes all user-provided content (test titles, error messages)
- No dynamic code generation from untrusted sources

### Extensibility Points

**Adding New MCP Tools**:

1. Implement tool handler in `mcp-server/src/tools/{tool-name}.ts`
2. Register tool in `mcp-server/src/index.ts` tool manifest
3. Document tool in CUSTOM-MCP.md with input/output schemas
4. Update relevant agent definitions to list tool in MCP Dependencies section

**Adding New Agents**:

1. Create `.github/agents/{agent-name}.agent.md` definition
2. Document agent role, inputs, outputs, MCP tools in AGENTS.md
3. Update Orchestrator if agent participates in pipeline
4. Provide example prompt in agent documentation

**Adding New Test Types** (beyond UI/API/E2E):

1. Create directory under `src/tests/{type}/`
2. Create corresponding POM directory under `src/pages/{type}/` if needed
3. Add new tag to TAGS enum in Configuration
4. Update fixtures to include new POMs
5. Document test type structure in README.md

**Adding New Environments**:

1. Create `environments/{env-name}.env` file
2. Add environment key to ENVIRONMENTS constant in Configuration
3. Update Env Loader's known environment set
4. Document environment in MAINTENANCE.md

**Adding Reporter Fields**:

1. Update test result data collection in onTestEnd
2. Update HTML template generation with new field rendering
3. Update JSON summary schema if field is summary-level
4. Document change in MAINTENANCE.md

### Open Source Readiness Checklist

**Code Quality**:

- [ ] All files pass ESLint and Prettier
- [ ] TypeScript compilation succeeds with strict mode
- [ ] No console.log statements (use Logger instead)
- [ ] No hardcoded credentials or application-specific URLs
- [ ] All comments and documentation in English

**Documentation**:

- [ ] README.md includes project overview, architecture diagram, getting started
- [ ] AGENTS.md documents all agents with examples
- [ ] CUSTOM-MCP.md documents all MCP tools with schemas
- [ ] MAINTENANCE.md provides maintenance instructions
- [ ] All code has inline comments explaining complex logic

**Testing**:

- [ ] Property-based tests cover all 12 properties
- [ ] Unit tests achieve >80% coverage of core components
- [ ] Integration tests validate end-to-end workflows
- [ ] Smoke tests validate project structure
- [ ] All tests pass on fresh clone

**Structure**:

- [ ] ERPku-specific code isolated in example/ directory
- [ ] src/ directory follows documented structure
- [ ] Configuration uses only placeholder values
- [ ] All required folders exist with .gitkeep files
- [ ] Git hooks installed automatically via prepare script

**Examples**:

- [ ] example/ directory contains complete ERPku implementation
- [ ] Example demonstrates all framework features
- [ ] Example includes README explaining ERPku-specific customizations
- [ ] Example tests all pass independently

**License and Legal**:

- [ ] LICENSE file included (MIT, Apache 2.0, or other permissive license)
- [ ] Copyright headers in source files (if required by license)
- [ ] CONTRIBUTING.md with contribution guidelines
- [ ] CODE_OF_CONDUCT.md for community standards

### Dependencies

**Production Dependencies**:

- `@playwright/test`: ^1.60.0 — Core Playwright test framework
- `dotenv`: ^17.4.2 — Environment variable loading

**Development Dependencies**:

- `typescript`: ^6.0.3 — TypeScript compiler
- `@types/node`: ^25.9.1 — Node.js type definitions
- `eslint`: ^10.4.1 — JavaScript/TypeScript linter
- `prettier`: ^3.8.3 — Code formatter
- `husky`: ^9.0.11 — Git hooks manager
- `lint-staged`: ^15.2.0 — Run linters on staged files
- `tsx`: ^4.19.0 — TypeScript execution engine
- `fast-check`: ^3.15.0 — Property-based testing library

**MCP Server Dependencies** (mcp-server/package.json):

- `@modelcontextprotocol/sdk`: Latest — MCP SDK for tool registration
- `express`: ^4.18.2 — HTTP server (if using HTTP transport)

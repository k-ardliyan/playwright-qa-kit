"use strict";
/**
 * Single source of truth for all MCP tools exposed by `playwright-qa`.
 *
 * `dispatchTool` (MCP boundary), the HTTP router in `index.ts`, and the
 * `MCP_TOOL_DEFINITIONS` list all derive from this registry. Adding a tool
 * is a single edit here; no other place needs to be kept in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_ROUTES = exports.MCP_TOOL_DEFINITIONS = exports.TOOL_REGISTRY = void 0;
exports.getToolEntry = getToolEntry;
exports.isToolError = isToolError;
const health_check_1 = require("./health-check");
const get_test_failures_1 = require("./get-test-failures");
const get_test_summary_1 = require("./get-test-summary");
const list_artifacts_1 = require("./list-artifacts");
const normalize_requirements_1 = require("./normalize-requirements");
const parse_requirement_scenarios_1 = require("./parse-requirement-scenarios");
const validate_generated_tests_1 = require("./validate-generated-tests");
const validate_requirement_1 = require("./validate-requirement");
const discover_pages_1 = require("./discover-pages");
const snapshot_page_1 = require("./snapshot-page");
const archive_report_1 = require("./archive-report");
const generate_page_object_1 = require("./generate-page-object");
const inspect_file_1 = require("./inspect-file");
const extract_pdf_text_1 = require("./extract-pdf-text");
const read_excel_summary_1 = require("./read-excel-summary");
const list_test_fixtures_1 = require("./list-test-fixtures");
const list_requirement_status_1 = require("./list-requirement-status");
const compile_requirement_1 = require("./compile-requirement");
const validate_plan_1 = require("./validate-plan");
const trace_requirement_1 = require("./trace-requirement");
const safety_1 = require("../utils/safety");
function isStatusError(payload) {
    if (typeof payload !== 'object' || payload === null)
        return false;
    const status = payload.status;
    return status === 'error' || status === 'warning';
}
const GET_TEST_FAILURES_INPUT = {
    type: 'object',
    properties: {
        resultsDir: {
            type: 'string',
            description: 'Path to test-results directory (repo-relative or absolute, must stay inside the repo). Defaults to repo test-results/.',
        },
    },
};
const REQUIREMENTS_TEXT_OR_PATH = {
    type: 'object',
    properties: {
        requirementsText: { type: 'string' },
        requirementPath: {
            type: 'string',
            description: 'Repo-relative path under requirements/ — top-level requirements/<name>.md or nested requirements/<domain>/<name>.md.',
        },
    },
};
exports.TOOL_REGISTRY = [
    {
        name: 'health_check',
        description: 'Verify Node, Playwright packages, MCP build, environment files, `.auth/{APP_ENV}/` storage state, and test result artifacts before running the agent pipeline.',
        inputSchema: { type: 'object', properties: {} },
        handler: () => (0, health_check_1.healthCheck)(),
    },
    {
        name: 'get_test_failures',
        description: "Get Playwright test failures from the caller's resultsDir (or repo test-results/ by default). Includes trace and screenshot paths when available.",
        inputSchema: GET_TEST_FAILURES_INPUT,
        handler: (args) => {
            const raw = typeof args?.resultsDir === 'string' ? args.resultsDir : undefined;
            if (raw !== undefined) {
                const resolved = (0, safety_1.resolveAllowedPath)(raw, 'test-results', { mustExist: false });
                if (!resolved.ok) {
                    return { status: 'error', error: resolved.error };
                }
                return (0, get_test_failures_1.getTestFailures)(resolved.absolutePath);
            }
            return (0, get_test_failures_1.getTestFailures)();
        },
    },
    {
        name: 'get_test_summary',
        description: 'Read machine-readable pass/fail summary from reports/test-summary.json.',
        inputSchema: { type: 'object', properties: {} },
        handler: () => (0, get_test_summary_1.getTestSummary)(),
    },
    {
        name: 'list_artifacts',
        description: 'List requirement, spec, and generated test files under allowed project paths.',
        inputSchema: { type: 'object', properties: {} },
        handler: () => (0, list_artifacts_1.listArtifacts)(),
    },
    {
        name: 'list_requirement_status',
        description: 'Coverage map: each pipeline requirement with hasPlan, hasTests, manual scenario count, and last run status from test-summary when available.',
        inputSchema: { type: 'object', properties: {} },
        handler: () => (0, list_requirement_status_1.listRequirementStatus)(),
    },
    {
        name: 'compile_requirement',
        description: 'Compile requirement markdown into canonical RequirementContractV1 (qa.requirement/v1) with typed diagnostics, deterministic sourceHash, acceptance criteria, scenarios, actor and access matrix.',
        inputSchema: REQUIREMENTS_TEXT_OR_PATH,
        handler: (args) => {
            const requirementsText = typeof args?.requirementsText === 'string' ? args.requirementsText : undefined;
            const requirementPath = typeof args?.requirementPath === 'string' ? args.requirementPath : undefined;
            return (0, compile_requirement_1.compileRequirement)({ requirementsText, requirementPath });
        },
    },
    {
        name: 'normalize_requirements',
        description: 'Parse requirement markdown into structured contract with acceptance criteria and optional test scenarios.',
        inputSchema: REQUIREMENTS_TEXT_OR_PATH,
        handler: (args) => {
            const requirementsText = typeof args?.requirementsText === 'string' ? args.requirementsText : undefined;
            const requirementPath = typeof args?.requirementPath === 'string' ? args.requirementPath : undefined;
            return (0, normalize_requirements_1.normalizeRequirements)({ requirementsText, requirementPath });
        },
    },
    {
        name: 'parse_requirement_scenarios',
        description: 'Extract ### scenarios with Langkah/Hasil sections from requirement markdown (Indonesian or English).',
        inputSchema: REQUIREMENTS_TEXT_OR_PATH,
        handler: (args) => {
            const requirementsText = typeof args?.requirementsText === 'string' ? args.requirementsText : undefined;
            const requirementPath = typeof args?.requirementPath === 'string' ? args.requirementPath : undefined;
            return (0, parse_requirement_scenarios_1.parseRequirementScenarios)({ requirementsText, requirementPath });
        },
    },
    {
        name: 'validate_generated_tests',
        description: 'Validate generated .spec.ts files for base.fixture import, test.describe, and test.step rules.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Optional single file under PLAYWRIGHT_TEST_ROOT (default src/tests/) or PLAYWRIGHT_ADAPTER_TEST_ROOT (default example/erpku/tests). Validates all specs when omitted.',
                },
            },
        },
        handler: (args) => {
            const filePath = typeof args?.filePath === 'string' ? args.filePath : undefined;
            return (0, validate_generated_tests_1.validateGeneratedTests)(filePath);
        },
    },
    {
        name: 'validate_requirement',
        description: 'Validate requirement markdown structure before Planner runs. Checks title, scenarios, observable results, and @manual conventions.',
        inputSchema: REQUIREMENTS_TEXT_OR_PATH,
        handler: (args) => {
            const requirementsText = typeof args?.requirementsText === 'string' ? args.requirementsText : undefined;
            const requirementPath = typeof args?.requirementPath === 'string' ? args.requirementPath : undefined;
            return (0, validate_requirement_1.validateRequirement)({ requirementsText, requirementPath });
        },
    },
    {
        name: 'validate_plan',
        description: 'Validate a TestPlanContractV1 (qa.test-plan/v1) against its source requirement contract. Checks scenario coverage, AC coverage, role/auth drift, assertion provenance, and ephemeral browser references.',
        inputSchema: {
            type: 'object',
            properties: {
                testPlan: { type: 'object', description: 'TestPlanContractV1 JSON payload.' },
                testPlanPath: { type: 'string', description: 'Path to test plan file under specs/.' },
                requirement: { type: 'object', description: 'Optional RequirementContractV1 payload.' },
                requirementPath: { type: 'string', description: 'Optional path under requirements/.' },
            },
        },
        handler: (args) => (0, validate_plan_1.validatePlan)(args),
    },
    {
        name: 'trace_requirement',
        description: 'Build end-to-end TraceabilityContractV1 (qa.traceability/v1) graph linking Requirement -> Acceptance Criteria -> Scenarios -> Test Specs -> Execution Evidence.',
        inputSchema: {
            type: 'object',
            properties: {
                requirementPath: {
                    type: 'string',
                    description: 'Repo-relative path to requirement file.',
                },
                requirementsText: {
                    type: 'string',
                    description: 'Optional raw markdown requirement content.',
                },
                resultsDir: {
                    type: 'string',
                    description: 'Optional path to test-results directory.',
                },
                summaryPath: {
                    type: 'string',
                    description: 'Optional path to test-summary.json.',
                },
            },
        },
        handler: (args) => (0, trace_requirement_1.traceRequirement)(args),
    },
    {
        name: 'snapshot_page',
        description: 'Navigate to URL, capture ARIA snapshot, and persist a structured selector catalog under selector-catalog/<feature>/<page>.{aria.yml,json}. Returns a compact summary (path, elementCount, hash) for AI agents — read the JSON file for selector details.',
        inputSchema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'Absolute http/https URL to navigate to.' },
                featureName: {
                    type: 'string',
                    description: 'Lowercase feature slug, e.g. "login". Becomes the catalog subfolder.',
                },
                pageName: {
                    type: 'string',
                    description: 'Lowercase page slug, e.g. "login-form". Becomes the catalog filename.',
                },
                waitForSelector: {
                    type: 'string',
                    description: 'Optional CSS selector to wait for before capturing the snapshot.',
                },
                include: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional CSS scope — restricts snapshot to first matching subtree.',
                },
                maxElements: {
                    type: 'number',
                    description: 'Hard cap on captured interactive elements (default 500).',
                },
                force: {
                    type: 'boolean',
                    description: 'Re-capture and overwrite existing catalog (default false).',
                },
                waitUntil: {
                    type: 'string',
                    enum: ['networkidle', 'domcontentloaded', 'load'],
                    description: 'page.goto waitUntil strategy.',
                },
                navigationTimeoutMs: {
                    type: 'number',
                    description: 'Per-page navigation timeout in ms (default 30000).',
                },
            },
            required: ['url', 'featureName', 'pageName'],
        },
        handler: (args) => (0, snapshot_page_1.snapshotPage)(args),
    },
    {
        name: 'discover_pages',
        description: 'BFS auto-crawl a public site from a single entry point. For each unique same-origin URL: persist ARIA + selector catalog and append to page-map.json. Respects robots.txt, applies politeness delay, and supports checkpoint/resume.',
        inputSchema: {
            type: 'object',
            properties: {
                rootUrl: {
                    type: 'string',
                    description: 'Absolute http/https starting URL. Only same-origin links are followed.',
                },
                featureName: {
                    type: 'string',
                    description: 'Lowercase feature slug; catalog subfolder + page-map.json location.',
                },
                maxDepth: { type: 'number', description: 'BFS depth limit (default 2).' },
                maxPages: { type: 'number', description: 'Total pages cap (default 25).' },
                excludePatterns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Regex patterns — any matching URL/path is skipped.',
                },
                respectRobots: {
                    type: 'boolean',
                    description: 'Honor robots.txt Disallow + Crawl-delay (default true).',
                },
                requestDelayMs: {
                    type: 'number',
                    description: 'Politeness delay between requests in ms (default 200).',
                },
                waitUntil: {
                    type: 'string',
                    enum: ['networkidle', 'domcontentloaded', 'load'],
                },
                force: {
                    type: 'boolean',
                    description: 'Re-capture pages even if catalog is fresh.',
                },
            },
            required: ['rootUrl', 'featureName'],
        },
        handler: (args) => (0, discover_pages_1.discoverPages)(args),
    },
    {
        name: 'archive_report',
        description: 'Archive a pipeline report (Markdown + optional JSON) to reports/archive/<runId>/. Safe to call multiple times — overwrites if already exists. Call this after the Reporter produces the final pipeline report.',
        inputSchema: {
            type: 'object',
            properties: {
                runId: {
                    type: 'string',
                    description: 'The pipeline run ID (alphanumeric, hyphens, underscores only).',
                },
                reportPath: {
                    type: 'string',
                    description: 'Repo-relative path to the Markdown pipeline report file.',
                },
                jsonReportPath: {
                    type: 'string',
                    description: 'Optional repo-relative path to the JSON pipeline report file.',
                },
            },
            required: ['runId', 'reportPath'],
        },
        handler: (args) => (0, archive_report_1.archiveReport)(args),
    },
    {
        name: 'generate_page_object',
        description: 'Generate TypeScript POM scaffold from selector catalog JSON. Never overwrites existing files unless force=true. Returns scaffold with grouped locators, TODO markers for business methods, and warnings for fragile selectors.',
        inputSchema: {
            type: 'object',
            properties: {
                featureName: {
                    type: 'string',
                    description: 'Feature name (folder in selector-catalog/).',
                },
                pageName: {
                    type: 'string',
                    description: 'Page name (JSON file in selector-catalog/<feature>/).',
                },
                className: {
                    type: 'string',
                    description: 'Optional class name (default: PascalCase of pageName).',
                },
                outputPath: {
                    type: 'string',
                    description: 'Optional output path (default: src/pages/<ClassName>.ts).',
                },
                force: {
                    type: 'boolean',
                    description: 'Overwrite existing file (default: false).',
                },
            },
            required: ['featureName', 'pageName'],
        },
        handler: (args) => (0, generate_page_object_1.generatePageObject)(args),
    },
    {
        name: 'inspect_file',
        description: 'Inspect a file under test-fixtures/ or test-results/ (kind, size, magic bytes). Envelope only — no domain field schema.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Repo-relative path under test-fixtures/ or test-results/.',
                },
            },
            required: ['filePath'],
        },
        handler: (args) => (0, inspect_file_1.inspectFile)(args),
    },
    {
        name: 'extract_pdf_text',
        description: 'Extract plain text from a PDF under test-fixtures/ or test-results/. Returns raw text only — match against scenario expected tokens from the requirement; does not define business fields (no title/code/name schema).',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Repo-relative path to a PDF under test-fixtures/ or test-results/.',
                },
                maxChars: {
                    type: 'number',
                    description: 'Optional max characters to return (truncates text).',
                },
            },
            required: ['filePath'],
        },
        handler: (args) => (0, extract_pdf_text_1.extractPdfTextTool)(args),
    },
    {
        name: 'read_excel_summary',
        description: 'Read xlsx sheet names, header row, and sample rows under test-fixtures/ or test-results/. Structure dump only — expected headers come from the scenario, not a fixed domain schema.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Repo-relative path to an xlsx file under test-fixtures/ or test-results/.',
                },
                sheet: {
                    description: 'Optional sheet name or 0-based index.',
                },
                maxRows: {
                    type: 'number',
                    description: 'Max data rows to return after the header (default 20).',
                },
            },
            required: ['filePath'],
        },
        handler: (args) => (0, read_excel_summary_1.readExcelSummaryTool)(args),
    },
    {
        name: 'list_test_fixtures',
        description: 'List files under test-fixtures/ for upload Input Data paths (fixture-first; no headed OS file picker).',
        inputSchema: {
            type: 'object',
            properties: {
                subdir: {
                    type: 'string',
                    description: 'Optional relative subdir under test-fixtures/ (e.g. pdf, excel).',
                },
            },
        },
        handler: (args) => (0, list_test_fixtures_1.listTestFixtures)(args),
    },
];
const TOOL_MAP = new Map(exports.TOOL_REGISTRY.map((t) => [t.name, t]));
function getToolEntry(name) {
    return TOOL_MAP.get(name);
}
function isToolError(name, payload) {
    const entry = TOOL_MAP.get(name);
    if (entry?.isError)
        return entry.isError(payload);
    return isStatusError(payload);
}
exports.MCP_TOOL_DEFINITIONS = exports.TOOL_REGISTRY.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
}));
exports.TOOL_ROUTES = Object.fromEntries(exports.TOOL_REGISTRY.map((t) => [`/tools/${t.name}`, t.name]));
//# sourceMappingURL=registry.js.map
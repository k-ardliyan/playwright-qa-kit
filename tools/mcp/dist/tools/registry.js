"use strict";
/**
 * Single source of truth for all MCP tools exposed by `playwright-qa`.
 *
 * `dispatchTool` (MCP boundary), the HTTP router in `index.ts`, and the
 * `MCP_TOOL_DEFINITIONS` list all derive from this registry. Adding a tool
 * is a single edit here; no other place needs to be kept in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRITICAL_PROFILES = exports.KNOWN_PROFILES = exports.TOOL_ROUTES = exports.MCP_TOOL_DEFINITIONS = exports.TOOL_REGISTRY = void 0;
exports.setActiveMcpProfile = setActiveMcpProfile;
exports.getActiveMcpProfile = getActiveMcpProfile;
exports.getToolsForProfile = getToolsForProfile;
exports.isToolAllowedForProfile = isToolAllowedForProfile;
exports.getToolEntry = getToolEntry;
exports.isToolError = isToolError;
exports.validateProfileRegistry = validateProfileRegistry;
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
const compile_test_plan_1 = require("./compile-test-plan");
const validate_plan_1 = require("./validate-plan");
const trace_requirement_1 = require("./trace-requirement");
const safety_1 = require("../utils/safety");
let activeMcpProfileOverride;
function setActiveMcpProfile(profile) {
    if (!profile || profile === 'all') {
        activeMcpProfileOverride = undefined;
        return;
    }
    if (!exports.KNOWN_PROFILES.includes(profile)) {
        throw new Error(`[mcp-profile] Invalid profile "${profile}". Allowed profiles: ${exports.KNOWN_PROFILES.join(', ')}`);
    }
    activeMcpProfileOverride = profile;
}
function getActiveMcpProfile() {
    if (activeMcpProfileOverride) {
        return activeMcpProfileOverride;
    }
    const envVal = process.env.MCP_PROFILE?.trim();
    if (!envVal || envVal === 'all') {
        return 'all';
    }
    if (!exports.KNOWN_PROFILES.includes(envVal)) {
        throw new Error(`[mcp-profile] Unknown MCP_PROFILE='${envVal}'. Allowed profiles: ${exports.KNOWN_PROFILES.join(', ')}`);
    }
    return envVal;
}
function getToolsForProfile(profile = 'all') {
    if (profile === 'all')
        return exports.TOOL_REGISTRY;
    if (!exports.KNOWN_PROFILES.includes(profile)) {
        throw new Error(`[mcp-profile] Unknown profile "${profile}". Allowed profiles: ${exports.KNOWN_PROFILES.join(', ')}`);
    }
    return exports.TOOL_REGISTRY.filter((t) => !t.profiles || t.profiles.includes(profile));
}
function isToolAllowedForProfile(name, profile = getActiveMcpProfile()) {
    if (profile === 'all')
        return TOOL_MAP.has(name);
    const entry = TOOL_MAP.get(name);
    if (!entry)
        return false;
    if (!entry.profiles)
        return true;
    return entry.profiles.includes(profile);
}
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
            description: 'Path to test-results directory (repo-relative or absolute, must stay inside the repo). Defaults to artifacts/test-results/.',
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
        stability: 'stable',
        readOnly: true,
        profiles: ['admin', 'all'],
        handler: () => (0, health_check_1.healthCheck)(),
    },
    {
        name: 'get_test_failures',
        description: "Get Playwright test failures from the caller's resultsDir (or artifacts/test-results/ by default). Includes trace and screenshot paths when available.",
        inputSchema: GET_TEST_FAILURES_INPUT,
        stability: 'stable',
        readOnly: true,
        profiles: ['healer', 'reporter', 'debug', 'all'],
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
        description: 'Read machine-readable pass/fail summary from artifacts/reports/test-summary.json.',
        inputSchema: { type: 'object', properties: {} },
        stability: 'stable',
        readOnly: true,
        profiles: ['reporter', 'debug', 'all'],
        handler: () => (0, get_test_summary_1.getTestSummary)(),
    },
    {
        name: 'list_artifacts',
        description: 'List requirement, spec, and generated test files under allowed project paths.',
        inputSchema: { type: 'object', properties: {} },
        stability: 'stable',
        readOnly: true,
        profiles: ['reporter', 'author', 'debug', 'all'],
        handler: () => (0, list_artifacts_1.listArtifacts)(),
    },
    {
        name: 'list_requirement_status',
        description: 'Coverage map: each pipeline requirement with hasPlan, hasTests, manual scenario count, and last run status from test-summary when available.',
        inputSchema: { type: 'object', properties: {} },
        stability: 'stable',
        readOnly: true,
        profiles: ['planner', 'reporter', 'author', 'all'],
        handler: () => (0, list_requirement_status_1.listRequirementStatus)(),
    },
    {
        name: 'compile_requirement',
        description: 'Compile requirement markdown into canonical RequirementContractV1 (qa.requirement/v1) with typed diagnostics, deterministic sourceHash, acceptance criteria, scenarios, actor and access matrix.',
        inputSchema: REQUIREMENTS_TEXT_OR_PATH,
        stability: 'stable',
        readOnly: true,
        profiles: ['planner', 'generator', 'author', 'all'],
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
        stability: 'compat',
        replacement: 'compile_requirement',
        readOnly: true,
        profiles: ['planner', 'author', 'all'],
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
        stability: 'compat',
        replacement: 'compile_requirement',
        readOnly: true,
        profiles: ['planner', 'author', 'all'],
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
                    description: 'Optional single file under PLAYWRIGHT_TEST_ROOT (default tests/) or PLAYWRIGHT_ADAPTER_TEST_ROOT (default examples/erpku/tests). Validates all specs when omitted.',
                },
            },
        },
        stability: 'stable',
        readOnly: true,
        profiles: ['generator', 'healer', 'author', 'debug', 'all'],
        handler: (args) => {
            const filePath = typeof args?.filePath === 'string' ? args.filePath : undefined;
            return (0, validate_generated_tests_1.validateGeneratedTests)(filePath);
        },
    },
    {
        name: 'validate_requirement',
        description: 'Validate requirement markdown structure before Planner runs. Checks title, scenarios, observable results, and @manual conventions.',
        inputSchema: REQUIREMENTS_TEXT_OR_PATH,
        stability: 'compat',
        replacement: 'compile_requirement',
        readOnly: true,
        profiles: ['planner', 'author', 'all'],
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
                testPlanPath: {
                    type: 'string',
                    description: 'Path to test plan file under specs/ (markdown or JSON).',
                },
                requirement: { type: 'object', description: 'Optional RequirementContractV1 payload.' },
                requirementPath: { type: 'string', description: 'Optional path under requirements/.' },
            },
        },
        stability: 'stable',
        readOnly: true,
        profiles: ['planner', 'author', 'all'],
        handler: (args) => (0, validate_plan_1.validatePlan)(args),
    },
    {
        name: 'compile_test_plan',
        description: 'Compile Markdown test plan (specs/*.md) into canonical TestPlanContractV1 (qa.test-plan/v1) with typed assertion provenance, scenario metadata, and coverage gaps.',
        inputSchema: {
            type: 'object',
            properties: {
                testPlanPath: {
                    type: 'string',
                    description: 'Repo-relative path under specs/ (e.g. specs/feature.plan.md).',
                },
                testPlanText: {
                    type: 'string',
                    description: 'Optional raw markdown test plan content.',
                },
                requirementPath: {
                    type: 'string',
                    description: 'Optional path to source requirement under requirements/.',
                },
            },
        },
        stability: 'stable',
        readOnly: true,
        profiles: ['planner', 'generator', 'author', 'all'],
        handler: (args) => {
            const testPlanPath = typeof args?.testPlanPath === 'string' ? args.testPlanPath : undefined;
            const testPlanText = typeof args?.testPlanText === 'string' ? args.testPlanText : undefined;
            const requirementPath = typeof args?.requirementPath === 'string' ? args.requirementPath : undefined;
            return (0, compile_test_plan_1.compileTestPlan)({ testPlanPath, testPlanText, requirementPath });
        },
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
        stability: 'stable',
        readOnly: true,
        profiles: ['planner', 'healer', 'reporter', 'author', 'debug', 'all'],
        handler: (args) => (0, trace_requirement_1.traceRequirement)(args),
    },
    {
        name: 'snapshot_page',
        description: 'Navigate to URL, capture ARIA snapshot, and persist a structured selector catalog under artifacts/selector-catalog/<feature>/<page>.{aria.yml,json}. Returns a compact summary (path, elementCount, hash) for AI agents — read the JSON file for selector details.',
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
        stability: 'stable',
        readOnly: false,
        profiles: ['discovery', 'planner', 'generator', 'healer', 'author', 'visual', 'all'],
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
        stability: 'stable',
        readOnly: false,
        profiles: ['discovery', 'planner', 'author', 'minimal', 'all'],
        handler: (args) => (0, discover_pages_1.discoverPages)(args),
    },
    {
        name: 'archive_report',
        description: 'Archive a pipeline report (Markdown + optional JSON) to artifacts/reports/archive/<runId>/. Safe to call multiple times — overwrites if already exists. Call this after the Reporter produces the final pipeline report.',
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
        stability: 'stable',
        readOnly: false,
        profiles: ['reporter', 'author', 'debug', 'all'],
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
                    description: 'Feature name (folder in artifacts/selector-catalog/).',
                },
                pageName: {
                    type: 'string',
                    description: 'Page name (JSON file in artifacts/selector-catalog/<feature>/).',
                },
                className: {
                    type: 'string',
                    description: 'Optional class name (default: PascalCase of pageName).',
                },
                outputPath: {
                    type: 'string',
                    description: 'Optional output path (default: tests/pages/<ClassName>.ts).',
                },
                force: {
                    type: 'boolean',
                    description: 'Overwrite existing file (default: false).',
                },
            },
            required: ['featureName', 'pageName'],
        },
        stability: 'experimental',
        readOnly: false,
        profiles: ['generator', 'author', 'all'],
        handler: (args) => (0, generate_page_object_1.generatePageObject)(args),
    },
    {
        name: 'inspect_file',
        description: 'Inspect a file under tests/data/ or artifacts/test-results/ (kind, size, magic bytes). Envelope only — no domain field schema.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Repo-relative path under tests/data/ or artifacts/test-results/.',
                },
            },
            required: ['filePath'],
        },
        stability: 'stable',
        readOnly: true,
        profiles: ['generator', 'debug', 'artifact', 'all'],
        handler: (args) => (0, inspect_file_1.inspectFile)(args),
    },
    {
        name: 'extract_pdf_text',
        description: 'Extract plain text from a PDF under tests/data/ or artifacts/test-results/. Returns raw text only — match against scenario expected tokens from the requirement; does not define business fields (no title/code/name schema).',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Repo-relative path to a PDF under tests/data/ or artifacts/test-results/.',
                },
                maxChars: {
                    type: 'number',
                    description: 'Optional max characters to return (truncates text).',
                },
            },
            required: ['filePath'],
        },
        stability: 'stable',
        readOnly: true,
        profiles: ['debug', 'artifact', 'all'],
        handler: (args) => (0, extract_pdf_text_1.extractPdfTextTool)(args),
    },
    {
        name: 'read_excel_summary',
        description: 'Read xlsx sheet names, header row, and sample rows under tests/data/ or artifacts/test-results/. Structure dump only — expected headers come from the scenario, not a fixed domain schema.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Repo-relative path to an xlsx file under tests/data/ or artifacts/test-results/.',
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
        stability: 'stable',
        readOnly: true,
        profiles: ['debug', 'artifact', 'all'],
        handler: (args) => (0, read_excel_summary_1.readExcelSummaryTool)(args),
    },
    {
        name: 'list_test_fixtures',
        description: 'List files under tests/data/ for upload Input Data paths (fixture-first; no headed OS file picker).',
        inputSchema: {
            type: 'object',
            properties: {
                subdir: {
                    type: 'string',
                    description: 'Optional relative subdir under tests/data/ (e.g. pdf, excel).',
                },
            },
        },
        stability: 'stable',
        readOnly: true,
        profiles: ['generator', 'author', 'debug', 'all'],
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
exports.KNOWN_PROFILES = [
    'planner',
    'generator',
    'healer',
    'reporter',
    'discovery',
    'admin',
    'author',
    'debug',
    'auth',
    'visual',
    'artifact',
    'minimal',
    'all',
];
exports.CRITICAL_PROFILES = [
    'planner',
    'generator',
    'healer',
    'reporter',
];
function validateProfileRegistry() {
    const errors = [];
    const warnings = [];
    // 1. Tool entry schema and stability integrity
    for (const tool of exports.TOOL_REGISTRY) {
        if (!tool.name || tool.name.trim() === '') {
            errors.push('Found tool with empty name.');
        }
        if (!tool.handler) {
            errors.push(`Tool ${tool.name} is missing an execution handler.`);
        }
        if (tool.stability === 'deprecated' && !tool.replacement) {
            errors.push(`Deprecated tool ${tool.name} must specify a replacement tool.`);
        }
        if (tool.profiles) {
            for (const p of tool.profiles) {
                if (!exports.KNOWN_PROFILES.includes(p)) {
                    errors.push(`Tool ${tool.name} specifies unknown profile: "${String(p)}".`);
                }
            }
        }
    }
    // 2. Critical profiles must have at least one tool mapped
    for (const criticalProfile of exports.CRITICAL_PROFILES) {
        const tools = getToolsForProfile(criticalProfile);
        if (tools.length === 0) {
            errors.push(`Critical profile "${criticalProfile}" has no active tools mapped.`);
        }
    }
    return {
        ok: errors.length === 0,
        toolCount: exports.TOOL_REGISTRY.length,
        criticalProfilesCovered: exports.CRITICAL_PROFILES.every((p) => getToolsForProfile(p).length > 0),
        errors,
        warnings,
    };
}
//# sourceMappingURL=registry.js.map
/**
 * Single source of truth for all MCP tools exposed by `playwright-qa`.
 *
 * `dispatchTool` (MCP boundary), the HTTP router in `index.ts`, and the
 * `MCP_TOOL_DEFINITIONS` list all derive from this registry. Adding a tool
 * is a single edit here; no other place needs to be kept in sync.
 */

import { healthCheck } from './health-check';
import { getTestFailures } from './get-test-failures';
import { getTestSummary } from './get-test-summary';
import { listArtifacts } from './list-artifacts';
import { normalizeRequirements } from './normalize-requirements';
import { parseRequirementScenarios } from './parse-requirement-scenarios';
import { validateGeneratedTests } from './validate-generated-tests';
import { validateRequirement } from './validate-requirement';
import { discoverPages } from './discover-pages';
import { snapshotPage } from './snapshot-page';
import { createToolError, resolveAllowedPath } from '../utils/safety';

export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ToolEntry {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  /** Returns the raw payload. Wrap errors via `createToolError` or the `status` field. */
  handler: (args: Record<string, unknown> | undefined) => unknown;
  /** Optional override; default checks `payload.status === 'error'`. */
  isError?: (payload: unknown) => boolean;
}

function isStatusError(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) return false;
  const status = (payload as { status?: unknown }).status;
  return status === 'error';
}

const GET_TEST_FAILURES_INPUT: JsonSchemaObject = {
  type: 'object',
  properties: {
    resultsDir: {
      type: 'string',
      description:
        'Path to test-results directory (repo-relative or absolute, must stay inside the repo). Defaults to repo test-results/.',
    },
  },
};

const REQUIREMENTS_TEXT_OR_PATH: JsonSchemaObject = {
  type: 'object',
  properties: {
    requirementsText: { type: 'string' },
    requirementPath: {
      type: 'string',
      description: 'Top-level path matching requirements/<name>.md (no subdirectories).',
    },
  },
};

export const TOOL_REGISTRY: ToolEntry[] = [
  {
    name: 'health_check',
    description:
      'Verify Node, Playwright packages, MCP build, environment files, and test result artifacts before running the agent pipeline.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => healthCheck(),
  },
  {
    name: 'get_test_failures',
    description:
      "Get Playwright test failures from the caller's resultsDir (or repo test-results/ by default). Includes trace and screenshot paths when available.",
    inputSchema: GET_TEST_FAILURES_INPUT,
    handler: (args) => {
      const raw = typeof args?.resultsDir === 'string' ? args.resultsDir : undefined;
      if (raw !== undefined) {
        const resolved = resolveAllowedPath(raw, 'test-results', { mustExist: false });
        if (!resolved.ok) {
          return { status: 'error', error: resolved.error };
        }
        return getTestFailures(resolved.absolutePath);
      }
      return getTestFailures();
    },
  },
  {
    name: 'get_test_summary',
    description: 'Read machine-readable pass/fail summary from reports/test-summary.json.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => getTestSummary(),
  },
  {
    name: 'list_artifacts',
    description: 'List requirement, spec, and generated test files under allowed project paths.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => listArtifacts(),
  },
  {
    name: 'normalize_requirements',
    description:
      'Parse requirement markdown into structured contract with acceptance criteria and optional test scenarios.',
    inputSchema: {
      type: 'object',
      properties: {
        requirementsText: { type: 'string', description: 'Raw requirement markdown text.' },
      },
      required: ['requirementsText'],
    },
    handler: (args) => {
      const requirementsText = args?.requirementsText;
      if (typeof requirementsText !== 'string') {
        return createToolError('INVALID_INPUT', 'requirementsText must be a string.');
      }
      return normalizeRequirements(requirementsText);
    },
  },
  {
    name: 'parse_requirement_scenarios',
    description:
      'Extract ### scenarios with Langkah/Hasil sections from requirement markdown (Indonesian or English).',
    inputSchema: REQUIREMENTS_TEXT_OR_PATH,
    handler: (args) => {
      const requirementsText =
        typeof args?.requirementsText === 'string' ? args.requirementsText : undefined;
      const requirementPath =
        typeof args?.requirementPath === 'string' ? args.requirementPath : undefined;
      return parseRequirementScenarios({ requirementsText, requirementPath });
    },
  },
  {
    name: 'validate_generated_tests',
    description:
      'Validate generated .spec.ts files for base.fixture import, test.describe, and test.step rules.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description:
            'Optional single file under PLAYWRIGHT_TEST_ROOT (default src/tests/) or PLAYWRIGHT_ADAPTER_TEST_ROOT (default example/erpku/tests). Validates all specs when omitted.',
        },
      },
    },
    handler: (args) => {
      const filePath = typeof args?.filePath === 'string' ? args.filePath : undefined;
      return validateGeneratedTests(filePath);
    },
  },
  {
    name: 'validate_requirement',
    description:
      'Validate requirement markdown structure before Planner runs. Checks title, scenarios, observable results, and @manual conventions.',
    inputSchema: REQUIREMENTS_TEXT_OR_PATH,
    handler: (args) => {
      const requirementsText =
        typeof args?.requirementsText === 'string' ? args.requirementsText : undefined;
      const requirementPath =
        typeof args?.requirementPath === 'string' ? args.requirementPath : undefined;
      return validateRequirement({ requirementsText, requirementPath });
    },
  },
  {
    name: 'snapshot_page',
    description:
      'Navigate to URL, capture ARIA snapshot, and persist a structured selector catalog under selector-catalog/<feature>/<page>.{aria.yml,json}. Returns a compact summary (path, elementCount, hash) for AI agents — read the JSON file for selector details.',
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
    handler: (args) => snapshotPage(args),
  },
  {
    name: 'discover_pages',
    description:
      'BFS auto-crawl a public site from a single entry point. For each unique same-origin URL: persist ARIA + selector catalog and append to page-map.json. Respects robots.txt, applies politeness delay, and supports checkpoint/resume.',
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
    handler: (args) => discoverPages(args),
  },
];

const TOOL_MAP: Map<string, ToolEntry> = new Map(TOOL_REGISTRY.map((t) => [t.name, t]));

export function getToolEntry(name: string): ToolEntry | undefined {
  return TOOL_MAP.get(name);
}

export function isToolError(name: string, payload: unknown): boolean {
  const entry = TOOL_MAP.get(name);
  if (entry?.isError) return entry.isError(payload);
  return isStatusError(payload);
}

export const MCP_TOOL_DEFINITIONS = TOOL_REGISTRY.map((t) => ({
  name: t.name,
  description: t.description,
  inputSchema: t.inputSchema,
}));

export const TOOL_ROUTES: Record<string, string> = Object.fromEntries(
  TOOL_REGISTRY.map((t) => [`/tools/${t.name}`, t.name]),
);

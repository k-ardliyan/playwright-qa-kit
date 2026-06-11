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
          description: 'Optional single file under src/tests/. Validates all specs when omitted.',
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

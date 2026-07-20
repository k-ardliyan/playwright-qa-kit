import * as fs from 'node:fs';
import {
  assertRequirementsTextSize,
  createToolError,
  resolveAllowedPath,
  type ToolError,
} from '../utils/safety';

export type ScenarioType = 'success' | 'failure' | 'access-restriction' | 'manual' | 'general';

export interface RequirementScenario {
  id: string;
  name: string;
  steps: string[];
  expectedResult: string;
  precondition?: string;
  automatable: boolean;
  /** Scenario type derived from (@success/@failure/@access-restriction/@manual) tag in heading */
  scenarioType: ScenarioType;
  /** Role this scenario applies to, extracted from heading prefix or requirement metadata */
  roleScope?: string;
  /** Auth context hint: storage state path or 'unauthenticated' */
  authContext?: string;
}

export interface ParseRequirementScenariosOutput {
  status: 'success' | 'error';
  scenarios?: RequirementScenario[];
  sourcePath?: string;
  /** Roles found in requirement metadata Role scope field */
  rolesInScope?: string[];
  /** Access expectations parsed from metadata, keyed by role name */
  accessExpectations?: Record<string, string>;
  error?: ToolError;
  message: string;
}

const LABEL_KEYWORDS =
  'Langkah|Steps?|Prekondisi|Precondition|Given|Hasil|Expected(?:\\s+Result)?|Outcome';

function buildLabelRegex(keywords: string): RegExp {
  return new RegExp(`^\\*\\*(?:${keywords}):\\*\\*`, 'i');
}

const STEPS_LABEL = buildLabelRegex('Langkah|Steps?');
const RESULT_LABEL = buildLabelRegex('Hasil|Expected(?:\\s+Result)?|Outcome');
const PRECONDITION_LABEL = buildLabelRegex('Prekondisi|Precondition|Given');
const BLOCK_TERMINATOR = buildLabelRegex(LABEL_KEYWORDS);
const HEADING_REGEX = /^#{2,3}\s+/;
const SCENARIO_HEADING_REGEX = /^###\s+/;

function isManualScenario(rawHeading: string): boolean {
  return /@manual/i.test(rawHeading);
}

function cleanScenarioName(rawHeading: string): string {
  return rawHeading
    .replace(/\s*\(@(?:manual|success|failure|access-restriction)\)\s*/gi, ' ')
    .trim();
}

function extractScenarioType(rawHeading: string): ScenarioType {
  if (/@manual/i.test(rawHeading)) return 'manual';
  if (/@failure/i.test(rawHeading)) return 'failure';
  if (/@access-restriction/i.test(rawHeading)) return 'access-restriction';
  if (/@success/i.test(rawHeading)) return 'success';
  return 'general';
}

/**
 * Parse "Role scope" metadata field → array of role names.
 * Handles: "super-admin, finance, hrd" or "super-admin; finance"
 */
function parseRolesInScope(text: string): string[] {
  const match = text.match(/^\s*-\s+\*\*Role\s+scope:\*\*\s*(.+)$/im);
  if (!match) return [];
  return match[1]
    .split(/[,;]/)
    .map((r) => r.trim().toLowerCase())
    .filter((r) => r.length > 0 && r !== 'semua role' && r !== 'all roles');
}

/**
 * Parse "Access expectation" metadata field → Record<role, expectation>.
 * Handles: "super-admin: bisa approve; finance: bisa approve; hrd: tidak bisa"
 */
function parseAccessExpectations(text: string): Record<string, string> {
  const match = text.match(/^\s*-\s+\*\*Access\s+expectation:\*\*\s*(.+)$/im);
  if (!match) return {};
  const result: Record<string, string> = {};
  const parts = match[1].split(/;\s*/);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const role = part.slice(0, colonIdx).trim().toLowerCase();
    const expectation = part.slice(colonIdx + 1).trim();
    if (role && expectation) result[role] = expectation;
  }
  return result;
}

/**
 * Derive auth context from auth state + role.
 * Role-aware → .auth/<role>.json; unauthenticated → 'unauthenticated'; else undefined.
 */
function deriveAuthContext(text: string, role?: string): string | undefined {
  const authMatch = text.match(/^\s*-\s+\*\*Auth\s+state:\*\*\s*(\S+)/im);
  if (!authMatch) return undefined;
  const authState = authMatch[1].toLowerCase();
  if (authState === 'unauthenticated') return 'unauthenticated';
  if (role) return `.auth/${role}.json`;
  return undefined;
}

type BlockMode = 'list' | 'paragraph';

interface ParseBlockOptions {
  terminator: RegExp;
  mode: BlockMode;
  lineTransform?: (line: string) => string | null;
}

/**
 * Walk lines from `startIndex` until a terminator or heading is hit.
 * Returns the parsed items, accumulated text, and the index of the terminator
 * (so the caller can resume from there). `lineTransform` may return `null` to
 * skip a line.
 */
function parseBlock(
  lines: string[],
  startIndex: number,
  opts: ParseBlockOptions,
): { value: string[]; text: string; nextIndex: number } {
  const items: string[] = [];
  let text = '';
  let i = startIndex;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (opts.terminator.test(trimmed) || HEADING_REGEX.test(trimmed)) {
      break;
    }
    if (trimmed.length > 0) {
      const transformed = opts.lineTransform ? opts.lineTransform(trimmed) : trimmed;
      if (transformed !== null && transformed.length > 0) {
        if (opts.mode === 'list') {
          items.push(transformed);
        } else if (text.length > 0) {
          text = `${text} ${transformed}`;
        } else {
          text = transformed;
        }
      }
    }
    i += 1;
  }
  return { value: items, text, nextIndex: i };
}

function transformParagraphLine(trimmed: string): string | null {
  if (/^\*\*/.test(trimmed)) return null; // skip stray label lines
  return trimmed.replace(/^[-*]\s+/, '').trim();
}

function stripLabel(trimmed: string, labelRegex: RegExp): string | null {
  const stripped = trimmed.replace(labelRegex, '').trim();
  if (stripped.length === 0) return null;
  return stripped;
}

export function parseRequirementScenariosFromText(text: string): RequirementScenario[] {
  const lines = text.split(/\r?\n/);
  const scenarios: RequirementScenario[] = [];
  let i = 0;

  while (i < lines.length) {
    const heading = lines[i].match(/^###\s+(.+)$/);
    if (!heading) {
      i += 1;
      continue;
    }

    const rawName = heading[1].trim();
    const automatable = !isManualScenario(rawName);
    const name = cleanScenarioName(rawName);
    i += 1;

    const steps: string[] = [];
    let expectedResult = '';
    let precondition: string | undefined;

    while (i < lines.length && !SCENARIO_HEADING_REGEX.test(lines[i]) && !/^##\s+/.test(lines[i])) {
      const trimmed = lines[i].trim();

      if (PRECONDITION_LABEL.test(trimmed)) {
        const inline = stripLabel(trimmed, PRECONDITION_LABEL);
        if (inline !== null) {
          precondition = inline;
          i += 1;
        } else {
          const block = parseBlock(lines, i + 1, {
            terminator: BLOCK_TERMINATOR,
            mode: 'paragraph',
            lineTransform: (line) =>
              line
                .replace(/^\*\*(?:Prekondisi|Precondition|Given):\*\*\s*/i, '')
                .replace(/^[-*]\s+/, '')
                .trim(),
          });
          precondition = block.text || undefined;
          i = block.nextIndex;
        }
        continue;
      }

      if (STEPS_LABEL.test(trimmed)) {
        const inline = stripLabel(trimmed, STEPS_LABEL);
        if (inline !== null) {
          // Inline step (rare) — append as a single step
          steps.push(inline);
          i += 1;
        } else {
          // Walk from after `**Langkah:**` until the next block terminator or
          // heading, collecting numbered/bullet items as steps. Non-list
          // lines are folded onto the previous step. Multiple Langkah blocks
          // within a single scenario ACCUMULATE rather than overwrite.
          let j = i + 1;
          while (j < lines.length) {
            const t = lines[j].trim();
            if (BLOCK_TERMINATOR.test(t) || HEADING_REGEX.test(t)) break;
            const numbered = t.match(/^\d+\.\s+(.+)$/);
            const bullet = t.match(/^[-*]\s+(.+)$/);
            if (numbered) {
              steps.push(numbered[1].trim());
            } else if (bullet) {
              steps.push(bullet[1].trim());
            } else if (steps.length > 0 && t.length > 0 && !/^\*\*/.test(t)) {
              steps[steps.length - 1] = `${steps[steps.length - 1]} ${t}`;
            }
            j += 1;
          }
          i = j;
        }
        continue;
      }

      if (RESULT_LABEL.test(trimmed)) {
        const inline = stripLabel(trimmed, RESULT_LABEL);
        if (inline !== null) {
          // Inline result — overwrite (later results replace earlier)
          expectedResult = inline;
          i += 1;
        } else {
          const block = parseBlock(lines, i + 1, {
            terminator: BLOCK_TERMINATOR,
            mode: 'paragraph',
            lineTransform: transformParagraphLine,
          });
          if (block.text) {
            expectedResult =
              expectedResult.length > 0 ? `${expectedResult} ${block.text}` : block.text;
          }
          i = block.nextIndex;
        }
        continue;
      }

      i += 1;
    }

    if (name.length > 0 && steps.length > 0 && expectedResult.length > 0) {
      const scenarioType = extractScenarioType(rawName);
      const authContext = deriveAuthContext(text);
      const scenario: RequirementScenario = {
        id: `SC-${scenarios.length + 1}`,
        name,
        steps,
        expectedResult,
        automatable,
        scenarioType,
        ...(authContext !== undefined && { authContext }),
      };
      if (precondition) {
        scenario.precondition = precondition;
      }
      scenarios.push(scenario);
    }
  }

  return scenarios;
}

export function parseRequirementScenarios(options: {
  requirementsText?: string;
  requirementPath?: string;
}): ParseRequirementScenariosOutput {
  let text = options.requirementsText;

  if (options.requirementPath) {
    const resolved = resolveAllowedPath(options.requirementPath, 'requirements', {
      mustExist: true,
      readOnly: true,
    });
    if (!resolved.ok) {
      return { status: 'error', message: resolved.error.message, error: resolved.error };
    }
    text = fs.readFileSync(resolved.absolutePath, 'utf-8');
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    const err = createToolError('INVALID_INPUT', 'Provide requirementsText or requirementPath.');
    return { status: 'error', message: err.error.message, error: err.error };
  }

  const sizeError = assertRequirementsTextSize(text);
  if (sizeError) {
    return { status: 'error', message: sizeError.message, error: sizeError };
  }

  const scenarios = parseRequirementScenariosFromText(text);
  if (scenarios.length === 0) {
    return {
      status: 'error',
      message:
        'No scenarios found. Use ### headings with **Langkah:**/**Steps:** and **Hasil:**/**Expected Result:** sections.',
      error: { code: 'NO_SCENARIOS', message: 'No parseable test scenarios in input.' },
    };
  }

  const rolesInScope = parseRolesInScope(text);
  const accessExpectations = parseAccessExpectations(text);

  return {
    status: 'success',
    scenarios,
    sourcePath: options.requirementPath,
    ...(rolesInScope.length > 0 && { rolesInScope }),
    ...(Object.keys(accessExpectations).length > 0 && { accessExpectations }),
    message: `Parsed ${scenarios.length} scenario(s)${rolesInScope.length > 0 ? `, roles in scope: ${rolesInScope.join(', ')}` : ''}.`,
  };
}

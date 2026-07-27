import * as fs from 'node:fs';
import {
  assertRequirementsTextSize,
  createToolError,
  resolveAllowedPath,
  type ToolError,
} from '../utils/safety';

export type ScenarioType = 'success' | 'failure' | 'access-restriction' | 'manual' | 'general';

export type ScenarioPriority = 'high' | 'medium' | 'low';

export type AffectedLayer = 'FE' | 'BE' | 'DB' | 'API';

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
  // === Table view metadata (new) ===
  /** Test ID from `- **Test ID:** \`TC-XXX-NNN\`` in scenario block */
  testId: string;
  /** Per-scenario priority override. Falls back to requirement global priority. */
  priority: ScenarioPriority;
  /** Structured input data from `**Input Data:**` bullet list */
  inputData: Record<string, string>;
  /** Joined expected result string from `**Hasil yang Diharapkan:**` bullets */
  expectedResultFormatted: string;
  /** Affected system layers from `**Layer terdampak:**` field */
  affectedLayer: AffectedLayer[];
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
  'Langkah|Steps?|Prekondisi|Precondition|Given|Hasil(?:\\s+yang\\s+Diharapkan)?|Expected(?:\\s+Result)?|Outcome|Input\\s+Data|Layer\\s+terdampak|Affected\\s+Layer';

function buildLabelRegex(keywords: string): RegExp {
  return new RegExp(`^\\*\\*(?:${keywords}):\\*\\*`, 'i');
}

const STEPS_LABEL = buildLabelRegex('Langkah|Steps?');
const RESULT_LABEL = buildLabelRegex(
  'Hasil(?:\\s+yang\\s+Diharapkan)?|Expected(?:\\s+Result)?|Outcome',
);
const PRECONDITION_LABEL = buildLabelRegex('Prekondisi|Precondition|Given');
const INPUT_DATA_LABEL = buildLabelRegex('Input\\s+Data');
const LAYER_LABEL = buildLabelRegex('Layer\\s+terdampak|Affected\\s+Layer');
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
 * Normalize role slug: default/general → user (credential role for mode general).
 */
function canonicalRoleName(role: string): string {
  const r = role
    .trim()
    .toLowerCase()
    .replace(/[.,;]+$/, '');
  if (!r || r === 'default' || r === 'general') return 'user';
  return r;
}

/**
 * Parse "Role scope" metadata field → array of role names.
 * Handles: "super-admin, finance, hrd" or "super-admin; finance"
 * Strips forbidden public name "general" from scope list (mode, not env role).
 */
function parseRolesInScope(text: string): string[] {
  const match = text.match(/^\s*-\s+\*\*Role\s+scope:\*\*\s*(.+)$/im);
  if (!match) return [];
  return match[1]
    .split(/[,;]/)
    .map((r) => r.trim().toLowerCase())
    .filter((r) => r.length > 0 && r !== 'semua role' && r !== 'all roles' && r !== 'general')
    .map((r) => (r === 'default' ? 'user' : r));
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
    const role = canonicalRoleName(part.slice(0, colonIdx));
    const expectation = part.slice(colonIdx + 1).trim();
    if (role && expectation) result[role] = expectation;
  }
  return result;
}

/**
 * Per-scenario role from:
 * 1. `- **Role:** finance` / `**Role:** finance` in scenario block
 * 2. Heading prefix `finance: ...` when that name is in rolesInScope
 * 3. Single role in rolesInScope (only one business role) → that role
 * Else undefined → pipeline treats as general → credential role user
 */
function resolveScenarioRole(
  scenarioLines: string[],
  rawName: string,
  rolesInScope: string[],
): string | undefined {
  for (const line of scenarioLines) {
    const m =
      line.match(/^\s*-\s+\*\*Role:\*\*\s*(.+)$/i) || line.match(/^\s*\*\*Role:\*\*\s*(.+)$/i);
    if (m) {
      const role = canonicalRoleName(m[1].split(/[,;(]/)[0] ?? '');
      if (role) return role;
    }
  }

  const prefix = rawName.match(/^([a-z0-9-]+)\s*[:—–-]\s+/i);
  if (prefix) {
    const candidate = canonicalRoleName(prefix[1]);
    if (
      rolesInScope.length === 0 ||
      rolesInScope.includes(candidate) ||
      rolesInScope.includes(prefix[1].toLowerCase())
    ) {
      // Only treat as role prefix if looks like a role in scope or common role token
      if (rolesInScope.includes(candidate) || rolesInScope.includes(prefix[1].toLowerCase())) {
        return candidate;
      }
    }
  }

  if (rolesInScope.length === 1) {
    return canonicalRoleName(rolesInScope[0]);
  }

  return undefined;
}

/**
 * Derive auth context from auth state + optional role.
 * Paths are scoped by APP_ENV: `.auth/{APP_ENV}/{role}.json`
 * - unauthenticated → 'unauthenticated'
 * - authenticated without role / general / default → user (pipeline mode general)
 * - authenticated + business role → that role
 */
function deriveAuthContext(text: string, role?: string): string | undefined {
  const authMatch = text.match(/^\s*-\s+\*\*Auth\s+state:\*\*\s*(\S+)/im);
  if (!authMatch) return undefined;
  const authState = authMatch[1].toLowerCase().replace(/[.,;]+$/, '');
  if (authState === 'unauthenticated') return 'unauthenticated';

  const appEnv = (process.env.APP_ENV ?? 'local').trim() || 'local';
  const roleName = canonicalRoleName(role ?? 'user');
  return `.auth/${appEnv}/${roleName}.json`;
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

/**
 * Parse global priority from requirement metadata.
 * Used as fallback when per-scenario priority is not set.
 */
function parseGlobalPriority(text: string): ScenarioPriority {
  const match = text.match(/^\s*-\s+\*\*Prioritas:\*\*\s*(\S+)/im);
  if (!match) return 'medium';
  const raw = match[1].toLowerCase().trim();
  if (raw === 'high' || raw === 'tinggi') return 'high';
  if (raw === 'low' || raw === 'rendah') return 'low';
  return 'medium';
}

/**
 * Parse `- **Test ID:** \`TC-XXX-NNN\`` from lines within a scenario block.
 * Returns empty string if not found.
 */
function parseTestId(scenarioLines: string[]): string {
  for (const line of scenarioLines) {
    const m = line.match(/^\s*-\s+\*\*Test\s+ID:\*\*\s*`?(TC-[A-Z0-9-]+)`?/i);
    if (m) return m[1].trim();
  }
  return '';
}

/**
 * Parse `- **Prioritas skenario:** high|medium|low` from scenario lines.
 * Returns null if not found (caller falls back to global priority).
 */
function parseScenarioPriority(scenarioLines: string[]): ScenarioPriority | null {
  for (const line of scenarioLines) {
    const m = line.match(/^\s*-\s+\*\*Prioritas\s+skenario:\*\*\s*`?(\S+)`?/i);
    if (!m) continue;
    const raw = m[1].toLowerCase().trim();
    if (raw === 'high' || raw === 'tinggi') return 'high';
    if (raw === 'low' || raw === 'rendah') return 'low';
    return 'medium';
  }
  return null;
}

/**
 * Parse `- **Layer terdampak:**` or `- **Affected Layer:** FE | BE | DB | API` from scenario lines.
 * Accepts combinations like `FE BE` or `FE | BE` or backtick-wrapped tokens.
 */
function parseAffectedLayer(scenarioLines: string[]): AffectedLayer[] {
  const validLayers = new Set<string>(['FE', 'BE', 'DB', 'API']);
  for (const line of scenarioLines) {
    const m = line.match(/^\s*-\s+\*\*(?:Layer\s+terdampak|Affected\s+Layer):\*\*\s*(.+)$/i);
    if (!m) continue;
    const raw = m[1].replace(/`/g, '');
    const tokens = raw.split(/[\s|,]+/).map((t) => t.trim().toUpperCase());
    return tokens.filter((t) => validLayers.has(t)) as AffectedLayer[];
  }
  return [];
}

/**
 * Parse `**Input Data:**` bullet list into a key→value record.
 * Handles `- key: value` and `- key: value with spaces`.
 */
function parseInputDataBlock(
  lines: string[],
  startIndex: number,
): {
  inputData: Record<string, string>;
  nextIndex: number;
} {
  const inputData: Record<string, string> = {};
  let i = startIndex;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (BLOCK_TERMINATOR.test(trimmed) || HEADING_REGEX.test(trimmed)) break;
    const m = trimmed.match(/^[-*]\s+([^:]+):\s*(.*)$/);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      if (key.length > 0) inputData[key] = value;
    }
    i += 1;
  }
  return { inputData, nextIndex: i };
}

/**
 * Parse `**Hasil yang Diharapkan:**` bullets into a joined string.
 * Also handles legacy `**Hasil:**` label for backward compatibility.
 */
function parseExpectedResultFormatted(
  lines: string[],
  startIndex: number,
): {
  formatted: string;
  nextIndex: number;
} {
  const items: string[] = [];
  let i = startIndex;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (BLOCK_TERMINATOR.test(trimmed) || HEADING_REGEX.test(trimmed)) break;
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    const text = bullet ? bullet[1].trim() : numbered ? numbered[1].trim() : null;
    if (text && !/^\*\*/.test(text)) items.push(text);
    i += 1;
  }
  return { formatted: items.join('; '), nextIndex: i };
}

export function parseRequirementScenariosFromText(text: string): RequirementScenario[] {
  const lines = text
    .split(String.fromCharCode(10))
    .map((line) => (line.endsWith(String.fromCharCode(13)) ? line.slice(0, -1) : line));
  const scenarios: RequirementScenario[] = [];
  const globalPriority = parseGlobalPriority(text);
  const rolesInScope = parseRolesInScope(text);
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

    // Collect all lines in this scenario block (until next ### or ##)
    const scenarioStartIdx = i + 1;
    let scanIdx = scenarioStartIdx;
    while (
      scanIdx < lines.length &&
      !SCENARIO_HEADING_REGEX.test(lines[scanIdx]) &&
      !/^##\s+/.test(lines[scanIdx])
    ) {
      scanIdx += 1;
    }
    const scenarioLines = lines.slice(scenarioStartIdx, scanIdx);

    // Parse table-view metadata from scenario header lines (before first **label:**)
    const testId = parseTestId(scenarioLines);
    const scenarioPriority = parseScenarioPriority(scenarioLines);
    const affectedLayer = parseAffectedLayer(scenarioLines);

    i = scenarioStartIdx;

    const steps: string[] = [];
    let expectedResult = '';
    let expectedResultFormatted = '';
    let inputData: Record<string, string> = {};
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

      if (INPUT_DATA_LABEL.test(trimmed)) {
        const parsed = parseInputDataBlock(lines, i + 1);
        inputData = parsed.inputData;
        i = parsed.nextIndex;
        continue;
      }

      if (LAYER_LABEL.test(trimmed)) {
        // Layer was already parsed from scenarioLines; skip the block
        i += 1;
        while (i < lines.length) {
          const t = lines[i].trim();
          if (BLOCK_TERMINATOR.test(t) || HEADING_REGEX.test(t)) break;
          i += 1;
        }
        continue;
      }

      if (STEPS_LABEL.test(trimmed)) {
        const inline = stripLabel(trimmed, STEPS_LABEL);
        if (inline !== null) {
          steps.push(inline);
          i += 1;
        } else {
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
          expectedResult = inline;
          expectedResultFormatted = inline;
          i += 1;
        } else {
          // Parse both the joined paragraph (legacy expectedResult) and
          // the formatted bullet-list version (new expectedResultFormatted)
          const bulletResult = parseExpectedResultFormatted(lines, i + 1);
          if (bulletResult.formatted) {
            expectedResultFormatted = bulletResult.formatted;
          }
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
      const roleScope = resolveScenarioRole(scenarioLines, rawName, rolesInScope);
      const authContext = deriveAuthContext(text, roleScope);

      // Derive testId fallback: TC-<FEATURETAG>-<NNN> from scenario index
      const resolvedTestId =
        testId.length > 0 ? testId : `TC-UNKNOWN-${String(scenarios.length + 1).padStart(3, '0')}`;

      const scenario: RequirementScenario = {
        id: `SC-${scenarios.length + 1}`,
        name,
        steps,
        expectedResult,
        automatable,
        scenarioType,
        // New table-view fields
        testId: resolvedTestId,
        priority: scenarioPriority ?? globalPriority,
        inputData,
        expectedResultFormatted: expectedResultFormatted || expectedResult,
        affectedLayer,
        ...(roleScope !== undefined && { roleScope }),
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

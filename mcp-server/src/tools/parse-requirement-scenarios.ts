import * as fs from 'node:fs';
import {
  assertRequirementsTextSize,
  createToolError,
  resolveAllowedPath,
  type ToolError,
} from '../utils/safety';

export interface RequirementScenario {
  id: string;
  name: string;
  steps: string[];
  expectedResult: string;
  precondition?: string;
  automatable: boolean;
}

export interface ParseRequirementScenariosOutput {
  status: 'success' | 'error';
  scenarios?: RequirementScenario[];
  sourcePath?: string;
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
  return rawHeading.replace(/\s*\(@manual\)\s*/gi, ' ').trim();
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

    if (name.length > 0 && (steps.length > 0 || expectedResult.length > 0)) {
      const scenario: RequirementScenario = {
        id: `SC-${scenarios.length + 1}`,
        name,
        steps,
        expectedResult,
        automatable,
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

  return {
    status: 'success',
    scenarios,
    sourcePath: options.requirementPath,
    message: `Parsed ${scenarios.length} scenario(s).`,
  };
}

import * as fs from 'node:fs';
import {
  assertRequirementsTextSize,
  createToolError,
  resolveAllowedPath,
  type ToolError,
} from '../utils/safety';
import { parseRequirementScenariosFromText } from './parse-requirement-scenarios';

export interface RequirementViolation {
  ruleName: string;
  severity: 'error' | 'warn';
  message: string;
  scenarioName?: string;
}

export interface ValidateRequirementOutput {
  status: 'success' | 'error';
  score: number;
  violations: RequirementViolation[];
  message: string;
  error?: ToolError;
}

const VAGUE_RESULT_PATTERNS = [
  /\bberjalan baik\b/i,
  /\bsukses\b(?!\s+(login|reset|submit))/i,
  /\bworks?\s+fine\b/i,
  /\bno\s+error\b/i,
];

const OBSERVABLE_INDICATORS = [
  /url/i,
  /tampil/i,
  /visible/i,
  /redirect/i,
  /teks/i,
  /text/i,
  /pesan/i,
  /message/i,
  /error/i,
  /halaman/i,
  /page/i,
  /tombol/i,
  /button/i,
  /form/i,
  /\/[\w-]+/,
];

const STEPS_LABEL = /^\*\*(?:Langkah|Steps?):\*\*/im;
const RESULT_LABEL = /^\*\*(?:Hasil|Expected(?:\s+Result)?|Outcome):\*\*/im;
const PRECONDITION_LABEL = /^\*\*(?:Prekondisi|Precondition|Given):\*\*/im;

function hasTitle(text: string): boolean {
  const firstMeaningfulLine = text.split(/\r?\n/).find((line) => line.trim().length > 0);
  return /^#\s+REQ-[A-Za-z0-9-]+\s*:.+/.test(firstMeaningfulLine?.trim() ?? '');
}

function hasAcceptanceCriteria(text: string): boolean {
  const section = text.match(
    /##\s+(?:Kriteria Penerimaan|Acceptance Criteria)\s*\n([\s\S]*?)(?=\n##\s+|\n###\s+|$)/i,
  );
  return Boolean(section && /^[\s]*[-*]\s+.+/m.test(section[1]));
}

function extractMetadataSection(text: string): string | null {
  const section = text.match(/##\s+Metadata\s*\n([\s\S]*?)(?=\n##\s+|\n###\s+|$)/i);
  return section?.[1] ?? null;
}

function validateMetadata(text: string): RequirementViolation[] {
  const section = extractMetadataSection(text);
  if (section === null) {
    return [
      {
        ruleName: 'metadata_required',
        severity: 'error',
        message: 'Document must include ## Metadata with Tags and Auth state.',
      },
    ];
  }

  const violations: RequirementViolation[] = [];
  if (!/^\s*-\s+\*\*Tags:\*\*\s+\S+/im.test(section) && !/^\s*tags?\s*:\s+\S+/im.test(section)) {
    violations.push({
      ruleName: 'metadata_tags_required',
      severity: 'error',
      message: 'Metadata must include Tags (e.g. - **Tags:** #ui).',
    });
  }

  const auth = section.match(/^\s*-\s+\*\*Auth state:\*\*\s*(.+)$/im)?.[1]?.trim();
  if (!auth || !/^(unauthenticated|authenticated)$/i.test(auth)) {
    violations.push({
      ruleName: 'metadata_auth_state_required',
      severity: 'error',
      message: 'Metadata must include Auth state: unauthenticated or authenticated.',
    });
  }

  return violations;
}

function extractScenarioBlocks(
  text: string,
): Array<{ name: string; body: string; isManual: boolean }> {
  const blocks: Array<{ name: string; body: string; isManual: boolean }> = [];
  const regex = /^###\s+(.+)$/gm;
  const matches = [...text.matchAll(regex)];

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    const rawName = match[1].trim();
    blocks.push({
      name: rawName.replace(/\s*\(@manual\)\s*/gi, ' ').trim(),
      body: text.slice(start, end),
      isManual: /@manual/i.test(rawName),
    });
  }

  return blocks;
}

function isVagueResult(result: string): boolean {
  const hasVague = VAGUE_RESULT_PATTERNS.some((p) => p.test(result));
  if (!hasVague) {
    return false;
  }
  return !OBSERVABLE_INDICATORS.some((p) => p.test(result));
}

function isAuthSensitive(text: string): boolean {
  return /auth\s*state|unauthenticated|authenticated|login|logout/i.test(text);
}

export function validateRequirementText(text: string): ValidateRequirementOutput {
  const violations: RequirementViolation[] = [];

  const sizeError = assertRequirementsTextSize(text);
  if (sizeError) {
    return {
      status: 'error',
      score: 0,
      violations: [{ ruleName: 'size_limit', severity: 'error', message: sizeError.message }],
      message: sizeError.message,
      error: sizeError,
    };
  }

  if (!hasTitle(text)) {
    violations.push({
      ruleName: 'title_required',
      severity: 'error',
      message:
        'Document must start with a first-line requirement title (e.g. # REQ-01: Feature Name).',
    });
  }

  violations.push(...validateMetadata(text));

  const scenarios = parseRequirementScenariosFromText(text);
  const hasCriteria = hasAcceptanceCriteria(text);

  if (!hasCriteria) {
    violations.push({
      ruleName: 'acceptance_criteria_required',
      severity: 'error',
      message: 'Document must include at least one bullet in ## Kriteria Penerimaan.',
    });
  }

  if (scenarios.length === 0) {
    violations.push({
      ruleName: 'scenario_required',
      severity: 'error',
      message:
        'Document must contain at least one parseable ### scenario with Langkah and Hasil sections.',
    });
  }

  const scenarioBlocks = extractScenarioBlocks(text);
  for (const block of scenarioBlocks) {
    const hasSteps = STEPS_LABEL.test(block.body);
    const hasResult = RESULT_LABEL.test(block.body);

    if (!hasSteps || !hasResult) {
      violations.push({
        ruleName: 'scenario_structure',
        severity: 'error',
        message: `Scenario "${block.name}" must include **Langkah:** (or **Steps:**) and **Hasil:** (or **Expected Result:**).`,
        scenarioName: block.name,
      });
    }

    if (hasResult && scenarios.find((s) => s.name === block.name)) {
      const scenario = scenarios.find((s) => s.name === block.name);
      if (scenario && isVagueResult(scenario.expectedResult)) {
        violations.push({
          ruleName: 'observable_result',
          severity: 'warn',
          message: `Scenario "${block.name}" has a vague expected result. Use observable outcomes (URL, visible text, element state).`,
          scenarioName: block.name,
        });
      }
    }

    if (block.isManual && hasResult) {
      const scenario = scenarios.find((s) => s.name === block.name);
      if (scenario && scenario.expectedResult.length < 20) {
        violations.push({
          ruleName: 'manual_reason',
          severity: 'warn',
          message: `Scenario "${block.name}" is @manual but expected result lacks a clear manual verification reason.`,
          scenarioName: block.name,
        });
      }
    }

    if (isAuthSensitive(text) && !PRECONDITION_LABEL.test(block.body) && !block.isManual) {
      violations.push({
        ruleName: 'precondition_recommended',
        severity: 'warn',
        message: `Scenario "${block.name}" should include **Prekondisi:** for auth-sensitive flows.`,
        scenarioName: block.name,
      });
    }
  }

  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warnCount = violations.filter((v) => v.severity === 'warn').length;
  const score = Math.max(0, 100 - errorCount * 25 - warnCount * 5);
  const status = errorCount > 0 ? 'error' : 'success';

  return {
    status,
    score,
    violations,
    message:
      errorCount > 0
        ? `Found ${errorCount} error(s) and ${warnCount} warning(s). Score: ${score}/100.`
        : warnCount > 0
          ? `Passed with ${warnCount} warning(s). Score: ${score}/100.`
          : `All requirement checks passed. Score: ${score}/100.`,
  };
}

export function validateRequirement(options: {
  requirementsText?: string;
  requirementPath?: string;
}): ValidateRequirementOutput {
  let text = options.requirementsText;

  if (options.requirementPath) {
    const resolved = resolveAllowedPath(options.requirementPath, 'requirements', {
      mustExist: true,
      readOnly: true,
    });
    if (!resolved.ok) {
      return {
        status: 'error',
        score: 0,
        violations: [],
        message: resolved.error.message,
        error: resolved.error,
      };
    }
    text = fs.readFileSync(resolved.absolutePath, 'utf-8');
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    const err = createToolError('INVALID_INPUT', 'Provide requirementsText or requirementPath.');
    return {
      status: 'error',
      score: 0,
      violations: [],
      message: err.error.message,
      error: err.error,
    };
  }

  return validateRequirementText(text);
}

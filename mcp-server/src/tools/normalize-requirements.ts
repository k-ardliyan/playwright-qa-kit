import { logger } from '../utils/logger';

export interface AcceptanceCriterion {
  id: string;
  description: string;
}

export interface RequirementsContract {
  id: string;
  title: string;
  acceptanceCriteria: AcceptanceCriterion[];
  tags: string[];
}

export interface NormalizeRequirementsOutput {
  contract?: RequirementsContract;
  status: 'success' | 'error';
  error?: {
    code: string;
    message: string;
  };
}

function toStableId(input: string): string {
  const normalized = input
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return normalized.length > 0 ? `REQ-${normalized}` : 'REQ-UNTITLED';
}

function parseTitle(lines: string[]): string | null {
  const markdownHeading = lines.find((line) => /^\s*#\s+/.test(line));
  if (markdownHeading) {
    return markdownHeading.replace(/^\s*#\s+/, '').trim();
  }

  const explicitTitle = lines.find((line) => /^\s*title\s*:/i.test(line));
  if (explicitTitle) {
    return explicitTitle.replace(/^\s*title\s*:/i, '').trim();
  }

  const firstSentence = lines.find((line) => line.trim().length > 0 && !/^\s*[-*\d]/.test(line));
  return firstSentence?.trim() ?? null;
}

function parseId(lines: string[], title: string): string {
  const explicitId = lines.find((line) => /^\s*id\s*:/i.test(line));
  if (explicitId) {
    const raw = explicitId.replace(/^\s*id\s*:/i, '').trim();
    if (raw.length > 0) {
      return raw;
    }
  }

  return toStableId(title);
}

function parseTags(text: string, lines: string[]): string[] {
  const tags = new Set<string>();

  const tagLine = lines.find((line) => /^\s*tags?\s*:/i.test(line));
  if (tagLine) {
    const raw = tagLine.replace(/^\s*tags?\s*:/i, '').trim();
    for (const token of raw.split(/[\s,]+/)) {
      const clean = token.replace(/^#/, '').trim().toLowerCase();
      if (clean) {
        tags.add(clean);
      }
    }
  }

  const hashTagRegex = /(^|\s)#([a-zA-Z0-9_-]+)/g;
  let match: RegExpExecArray | null = hashTagRegex.exec(text);
  while (match) {
    tags.add(match[2].toLowerCase());
    match = hashTagRegex.exec(text);
  }

  return Array.from(tags);
}

function parseAcceptanceCriteria(lines: string[]): AcceptanceCriterion[] {
  const criteria: string[] = [];

  const bulletOrNumbered = lines
    .map((line) => line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/)?.[1]?.trim() ?? null)
    .filter((line): line is string => Boolean(line));

  if (bulletOrNumbered.length > 0) {
    criteria.push(...bulletOrNumbered);
  } else {
    const shallStyle = lines
      .map((line) => line.trim())
      .filter((line) => /(shall|must|should)/i.test(line));

    criteria.push(...shallStyle);
  }

  return criteria
    .filter((criterion) => criterion.length > 0)
    .map((description, index) => ({
      id: `AC-${index + 1}`,
      description,
    }));
}

export function normalizeRequirements(requirementsText: string): NormalizeRequirementsOutput {
  if (typeof requirementsText !== 'string') {
    return {
      status: 'error',
      error: {
        code: 'INVALID_TYPE',
        message: 'requirementsText must be a string.',
      },
    };
  }

  const normalizedText = requirementsText.trim();
  if (normalizedText.length === 0) {
    return {
      status: 'error',
      error: {
        code: 'EMPTY_INPUT',
        message: 'requirementsText cannot be empty or whitespace-only.',
      },
    };
  }

  const lines = normalizedText.split(/\r?\n/);
  const title = parseTitle(lines);

  if (!title) {
    return {
      status: 'error',
      error: {
        code: 'MALFORMED_INPUT',
        message: 'Unable to derive requirement title from the provided text.',
      },
    };
  }

  const acceptanceCriteria = parseAcceptanceCriteria(lines);
  if (acceptanceCriteria.length === 0) {
    return {
      status: 'error',
      error: {
        code: 'MALFORMED_INPUT',
        message:
          'No acceptance criteria found. Provide bullet points or statements containing shall/must/should.',
      },
    };
  }

  const contract: RequirementsContract = {
    id: parseId(lines, title),
    title,
    acceptanceCriteria,
    tags: parseTags(normalizedText, lines),
  };

  logger.info('Requirements normalized successfully.', {
    id: contract.id,
    criteriaCount: contract.acceptanceCriteria.length,
    tagCount: contract.tags.length,
  });

  return {
    status: 'success',
    contract,
  };
}

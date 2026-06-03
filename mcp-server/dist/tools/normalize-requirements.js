"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRequirements = normalizeRequirements;
const logger_1 = require("../utils/logger");
function toStableId(input) {
    const normalized = input
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    return normalized.length > 0 ? `REQ-${normalized}` : 'REQ-UNTITLED';
}
function parseTitle(lines) {
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
function parseId(lines, title) {
    const explicitId = lines.find((line) => /^\s*id\s*:/i.test(line));
    if (explicitId) {
        const raw = explicitId.replace(/^\s*id\s*:/i, '').trim();
        if (raw.length > 0) {
            return raw;
        }
    }
    return toStableId(title);
}
function parseTags(text, lines) {
    const tags = new Set();
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
    let match = hashTagRegex.exec(text);
    while (match) {
        tags.add(match[2].toLowerCase());
        match = hashTagRegex.exec(text);
    }
    return Array.from(tags);
}
function parseAcceptanceCriteria(lines) {
    const criteria = [];
    const bulletOrNumbered = lines
        .map((line) => line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/)?.[1]?.trim() ?? null)
        .filter((line) => Boolean(line));
    if (bulletOrNumbered.length > 0) {
        criteria.push(...bulletOrNumbered);
    }
    else {
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
function normalizeRequirements(requirementsText) {
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
                message: 'No acceptance criteria found. Provide bullet points or statements containing shall/must/should.',
            },
        };
    }
    const contract = {
        id: parseId(lines, title),
        title,
        acceptanceCriteria,
        tags: parseTags(normalizedText, lines),
    };
    logger_1.logger.info('Requirements normalized successfully.', {
        id: contract.id,
        criteriaCount: contract.acceptanceCriteria.length,
        tagCount: contract.tags.length,
    });
    return {
        status: 'success',
        contract,
    };
}
//# sourceMappingURL=normalize-requirements.js.map
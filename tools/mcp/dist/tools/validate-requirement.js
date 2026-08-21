"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequirementText = validateRequirementText;
exports.validateRequirement = validateRequirement;
const fs = __importStar(require("node:fs"));
const safety_1 = require("../utils/safety");
const parse_requirement_scenarios_1 = require("./parse-requirement-scenarios");
const VAGUE_RESULT_PATTERNS = [
    /\bberjalan baik\b/i,
    /\bsukses\b(?!\s+(login|reset|submit))/i,
    /\bworks?\s+fine\b/i,
    /\bno\s+error\b/i,
];
// Regex helpers for metadata fields
const ROLE_SCOPE_LABEL = /^\s*-\s+\*\*Role\s+scope:\*\*\s*\S+/im;
const ACCESS_EXPECTATION_LABEL = /^\s*-\s+\*\*Access\s+expectation:\*\*\s*\S+/im;
const MODULE_LABEL = /^\s*-\s+\*\*Module:\*\*\s*(\S.*\S|\S)\s*$/im;
const FEATURE_LABEL = /^\s*-\s+\*\*Feature:\*\*\s*(\S.*\S|\S)\s*$/im;
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
const RESULT_LABEL = /^\*\*(?:Hasil(?:\s+yang\s+Diharapkan)?|Expected(?:\s+Result)?|Outcome):\*\*/im;
const TEST_ID_LABEL = /^\s*-\s+\*\*Test\s+ID:\*\*\s*`?(TC-[A-Z0-9-]+)`?/im;
const PRECONDITION_LABEL = /^\*\*(?:Prekondisi|Precondition|Given):\*\*/im;
function hasTitle(text) {
    const firstMeaningfulLine = text.split(/\r?\n/).find((line) => line.trim().length > 0);
    return /^#\s+REQ-[A-Za-z0-9-]+\s*:.+/.test(firstMeaningfulLine?.trim() ?? '');
}
function hasAcceptanceCriteria(text) {
    const section = text.match(/##\s+(?:Kriteria Penerimaan|Acceptance Criteria)\s*\n([\s\S]*?)(?=\n##\s+|\n###\s+|$)/i);
    return Boolean(section && /^[\s]*[-*]\s+.+/m.test(section[1]));
}
function extractMetadataSection(text) {
    const section = text.match(/##\s+Metadata\s*\n([\s\S]*?)(?=\n##\s+|\n###\s+|$)/i);
    return section?.[1] ?? null;
}
function validateMetadata(text) {
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
    const violations = [];
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
    // Module is required — core of grouping/taxonomy
    if (!MODULE_LABEL.test(section)) {
        violations.push({
            ruleName: 'metadata_module_required',
            severity: 'error',
            message: 'Metadata must include Module (e.g. - **Module:** invoice). Module is required for test grouping and coverage reports.',
            suggestion: 'Add `- **Module:** <nama-modul>` to ## Metadata. Contoh: `- **Module:** auth`, `- **Module:** invoice`.',
        });
    }
    // Feature is optional but recommended
    if (!FEATURE_LABEL.test(section)) {
        violations.push({
            ruleName: 'metadata_feature_recommended',
            severity: 'warn',
            message: 'Metadata is missing Feature (e.g. - **Feature:** login). Feature helps group tests within a module.',
            suggestion: 'Add `- **Feature:** <nama-fitur>` to ## Metadata. Contoh: `- **Feature:** login`, `- **Feature:** buat-invoice`.',
        });
    }
    return violations;
}
function extractScenarioBlocks(text) {
    const blocks = [];
    const regex = /^###\s+(.+)$/gm;
    const matches = [...text.matchAll(regex)];
    for (let i = 0; i < matches.length; i += 1) {
        const match = matches[i];
        const start = (match.index ?? 0) + match[0].length;
        const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
        const rawName = match[1].trim();
        blocks.push({
            name: rawName
                .replace(/\s*\(@(?:manual|success|failure|access-restriction)\)\s*/gi, ' ')
                .trim(),
            heading: rawName,
            body: text.slice(start, end),
            isManual: /@manual/i.test(rawName),
        });
    }
    return blocks;
}
function isVagueResult(result) {
    const hasVague = VAGUE_RESULT_PATTERNS.some((p) => p.test(result));
    if (!hasVague) {
        return false;
    }
    return !OBSERVABLE_INDICATORS.some((p) => p.test(result));
}
function isAuthSensitive(text) {
    return /auth\s*state|unauthenticated|authenticated|login|logout/i.test(text);
}
function validateRequirementText(text) {
    const violations = [];
    const sizeError = (0, safety_1.assertRequirementsTextSize)(text);
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
            message: 'Document must start with a first-line requirement title (e.g. # REQ-01: Feature Name).',
        });
    }
    violations.push(...validateMetadata(text));
    const scenarios = (0, parse_requirement_scenarios_1.parseRequirementScenariosFromText)(text);
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
            message: 'Document must contain at least one parseable ### scenario with Langkah and Hasil sections.',
        });
    }
    const scenarioBlocks = extractScenarioBlocks(text);
    for (const block of scenarioBlocks) {
        const hasSteps = STEPS_LABEL.test(block.body);
        const hasResult = RESULT_LABEL.test(block.body);
        const hasTestId = TEST_ID_LABEL.test(block.body);
        if (!hasSteps || !hasResult) {
            violations.push({
                ruleName: 'scenario_structure',
                severity: 'error',
                message: `Scenario "${block.name}" must include **Langkah:** (or **Steps:**) and **Hasil yang Diharapkan:** (or **Expected Result:**).`,
            });
            continue;
        }
        if (!hasTestId) {
            violations.push({
                ruleName: 'missing_test_id',
                severity: 'warn',
                message: `Scenario "${block.name}" is missing a Test ID. Add \`- **Test ID:** \\\`TC-<MODUL>-NNN\\\`\` for Table View report support.`,
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
        // Warning: Layer terdampak (FE/BE/DB/API) kosong — SOURCE column di dashboard jadi blank
        const LAYER_LABEL = /\*\*(?:Layer\s+terdampak|Affected\s+Layer):\*\*\s*\S+/i;
        if (!LAYER_LABEL.test(block.body)) {
            violations.push({
                ruleName: 'layer_recommended',
                severity: 'warn',
                message: `Scenario "${block.name}" is missing **Layer terdampak:** (FE/BE/DB/API). Add it for accurate SOURCE triage in the dashboard.`,
                scenarioName: block.name,
                suggestion: 'Add `- **Layer terdampak:** FE` (or BE/DB/API) inside the scenario body.',
            });
        }
    }
    // Warning: auth=authenticated but no Role scope defined — likely missing role context
    const metadataSection = extractMetadataSection(text);
    if (metadataSection) {
        const isAuthenticated = /auth\s+state.*authenticated/i.test(metadataSection) &&
            !/unauthenticated/i.test(metadataSection);
        const hasRoleScope = ROLE_SCOPE_LABEL.test(metadataSection);
        if (isAuthenticated && !hasRoleScope) {
            violations.push({
                ruleName: 'role_scope_recommended',
                severity: 'warn',
                message: 'Auth state is "authenticated" but no Role scope is defined. If this feature behaves differently per role (e.g. super-admin vs finance vs hrd), add "- **Role scope:** <roles>" to Metadata.',
            });
        }
        // Warning: Role scope defined but Access expectation missing
        if (hasRoleScope && !ACCESS_EXPECTATION_LABEL.test(metadataSection)) {
            violations.push({
                ruleName: 'access_expectation_missing',
                severity: 'warn',
                message: 'Role scope is defined but Access expectation is missing. Add "- **Access expectation:** <role>: <can/cannot do X>" to Metadata so the Generator knows which roles are allowed or restricted.',
            });
        }
    }
    // Warning: no failure scenario found — requirement likely missing negative path
    const hasFailureScenario = scenarioBlocks.some((b) => b.isManual === false && /@failure/i.test(b.heading));
    const hasNegativeKeywords = /\b(gagal|fail|error|invalid|salah|ditolak|reject|kosong|empty|tidak\s+bisa|tidak\s+boleh|access\s+denied|forbidden)\b/i.test(text);
    if (!hasFailureScenario && hasNegativeKeywords) {
        violations.push({
            ruleName: 'failure_scenario_recommended',
            severity: 'warn',
            message: 'Requirement mentions failure/error/rejection keywords but no scenario is tagged (@failure) or (@access-restriction). Consider adding a negative path scenario.',
        });
    }
    const errorCount = violations.filter((v) => v.severity === 'error').length;
    const warnCount = violations.filter((v) => v.severity === 'warn').length;
    const score = Math.max(0, 100 - errorCount * 25 - warnCount * 5);
    const status = errorCount > 0 ? 'error' : 'success';
    return {
        status,
        score,
        violations,
        message: errorCount > 0
            ? `Found ${errorCount} error(s) and ${warnCount} warning(s). Score: ${score}/100.`
            : warnCount > 0
                ? `Passed with ${warnCount} warning(s). Score: ${score}/100.`
                : `All requirement checks passed. Score: ${score}/100.`,
    };
}
function validateRequirement(options) {
    let text = options.requirementsText;
    if (options.requirementPath) {
        const resolved = (0, safety_1.resolveAllowedPath)(options.requirementPath, 'requirements', {
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
        const err = (0, safety_1.createToolError)('INVALID_INPUT', 'Provide requirementsText or requirementPath.');
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
//# sourceMappingURL=validate-requirement.js.map
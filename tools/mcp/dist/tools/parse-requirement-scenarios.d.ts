import { type ToolError } from '../utils/safety';
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
    /**
     * Module this requirement belongs to.
     * Priority: explicit `- **Module:** <name>` field → parent subfolder of requirements/ → `'general'`.
     */
    module: string;
    /**
     * Feature within the module.
     * Priority: explicit `- **Feature:** <name>` field → requirement filename stem → `'general'`.
     */
    feature: string;
    /** Roles found in requirement metadata Role scope field */
    rolesInScope?: string[];
    /** Access expectations parsed from metadata, keyed by role name */
    accessExpectations?: Record<string, string>;
    error?: ToolError;
    message: string;
}
export declare function parseRequirementScenariosFromText(text: string): RequirementScenario[];
export declare function parseRequirementScenarios(options: {
    requirementsText?: string;
    requirementPath?: string;
}): ParseRequirementScenariosOutput;
//# sourceMappingURL=parse-requirement-scenarios.d.ts.map
import { type ToolError } from '../utils/safety';
export interface RequirementViolation {
    ruleName: string;
    severity: 'error' | 'warn';
    message: string;
    scenarioName?: string;
    suggestion?: string;
}
export interface ValidateRequirementOutput {
    status: 'success' | 'error';
    score: number;
    violations: RequirementViolation[];
    message: string;
    error?: ToolError;
}
export declare function validateRequirementText(text: string): ValidateRequirementOutput;
export declare function validateRequirement(options: {
    requirementsText?: string;
    requirementPath?: string;
}): ValidateRequirementOutput;
//# sourceMappingURL=validate-requirement.d.ts.map
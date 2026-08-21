import { type RequirementScenario } from './parse-requirement-scenarios';
export interface AcceptanceCriterion {
    id: string;
    description: string;
}
export interface RequirementMetadata {
    tags: string[];
    priority?: string;
    authState?: 'unauthenticated' | 'authenticated';
    startPage?: string;
    pomFixtures?: string[];
}
export interface RequirementsContract {
    id: string;
    title: string;
    acceptanceCriteria: AcceptanceCriterion[];
    scenarios?: RequirementScenario[];
    tags: string[];
    metadata?: RequirementMetadata;
}
export interface NormalizeRequirementsOutput {
    contract?: RequirementsContract;
    status: 'success' | 'error';
    error?: {
        code: string;
        message: string;
    };
}
export declare function normalizeRequirements(options: string | {
    requirementsText?: string;
    requirementPath?: string;
}): NormalizeRequirementsOutput;
//# sourceMappingURL=normalize-requirements.d.ts.map
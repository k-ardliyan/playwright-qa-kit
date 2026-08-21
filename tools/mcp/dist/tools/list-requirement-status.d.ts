/**
 * list_requirement_status — coverage map requirements → plan → tests → manual.
 *
 * Helps QA answer: which features have a plan, generated specs, and manual gaps.
 */
export interface CoverageStateBreakdown {
    design: 'planned' | 'unplanned';
    automation: 'automated' | 'manual' | 'mixed' | 'unautomated';
    execution: 'executed' | 'not-executed';
    verification: 'passed' | 'failed' | 'healed' | 'unverified';
}
export interface RequirementStatusRow {
    requirementPath: string;
    module: string;
    feature: string;
    planPath: string | null;
    hasPlan: boolean;
    testPaths: string[];
    hasTests: boolean;
    manualCount: number;
    lastStatus: string | null;
    coverageState: CoverageStateBreakdown;
}
export interface FeatureSummary {
    total: number;
    withPlan: number;
    withTests: number;
}
/** Opsi B: module contains nested features. */
export interface ModuleSummary {
    total: number;
    withPlan: number;
    withTests: number;
    features: Record<string, FeatureSummary>;
}
export interface ListRequirementStatusOutput {
    status: 'success' | 'error';
    requirements: RequirementStatusRow[];
    /** Aggregated counts per module. */
    byModule: Record<string, ModuleSummary>;
    message: string;
}
export declare function listRequirementStatus(): ListRequirementStatusOutput;
//# sourceMappingURL=list-requirement-status.d.ts.map
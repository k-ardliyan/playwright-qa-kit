export interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    timestamp: string;
    /** 'general' = no role scope; 'role-aware' = tests grouped by role */
    reportMode?: 'general' | 'role-aware';
    /** Roles found in scope across all collected tests */
    rolesInScope?: string[];
    /** Full per-test case data for Reporter Agent and pipeline report */
    testCases?: CollectedTestCase[];
    /** Safe run context from custom reporter (no secrets) */
    runMeta?: RunMeta;
}
/** Suggested / annotated root cause class for QA exit decisions. */
export type FailureSource = 'app' | 'test' | 'requirement' | 'env' | 'ai_generation' | 'unknown';
/** Safe run context — never embed secrets. */
export interface RunMeta {
    appEnv: string;
    runId?: string;
    requirementPath?: string;
    ci: boolean;
    totalDurationMs: number;
    generatedAt: string;
}
/** Flat per-test-case record written to test-summary.json by custom reporter */
export interface CollectedTestCase {
    testId: string;
    scenarioId: string;
    title: string;
    role: string;
    status: string;
    priority: 'high' | 'medium' | 'low';
    duration: number;
    inputData: Record<string, string>;
    expectedResult: string;
    actualResult: string;
    affectedLayer: Array<'FE' | 'BE' | 'DB' | 'API'>;
    attachmentCount: number;
    hasTrace: boolean;
    /** Present on unhealthy tests when custom reporter ran */
    failureSource?: FailureSource;
}
export interface RoleSummary {
    passing: number;
    failing: number;
    skipped: number;
}
export interface FeatureSummary {
    passing: number;
    failing: number;
}
/** Per-module test result breakdown — Opsi B: module contains nested features. */
export interface ModuleSummary {
    passing: number;
    failing: number;
    features: Record<string, FeatureSummary>;
}
export interface GetTestSummaryOutput {
    status: 'success' | 'no_results' | 'error';
    summary?: TestSummary;
    /** Per-role breakdown — only present when test files follow *-<role>.spec.ts naming */
    byRole?: Record<string, RoleSummary>;
    /** Per-module breakdown — derived from module field in test-summary.json or requirement folder */
    byModule?: Record<string, ModuleSummary>;
    /** Full per-test-case data from custom reporter — only present when reportMode is set */
    testCases?: CollectedTestCase[];
    /** Report mode from custom reporter — 'general' or 'role-aware' */
    reportMode?: 'general' | 'role-aware';
    /** Roles in scope from custom reporter */
    rolesInScope?: string[];
    /** Safe run context from custom reporter when present */
    runMeta?: RunMeta;
    message: string;
}
export declare function getTestSummary(): GetTestSummaryOutput;
//# sourceMappingURL=get-test-summary.d.ts.map
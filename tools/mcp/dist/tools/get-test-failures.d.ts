export interface TestFailure {
    testTitle: string;
    filePath: string;
    errorMessage: string;
    duration: number;
    lineNumber?: number;
    stackTrace?: string;
    tracePath?: string;
    screenshotPath?: string;
    /** Test ID from annotation — TC-XXX-NNN */
    testId?: string;
    /** Role the test ran as — from annotation */
    role?: string;
    /** Priority from annotation — high | medium | low */
    priority?: 'high' | 'medium' | 'low';
    /** Expected result from annotation */
    expectedResult?: string;
    /** Actual result from annotation or error message */
    actualResult?: string;
    /** Root-cause class from custom reporter (annotation or heuristic) */
    failureSource?: 'app' | 'test' | 'requirement' | 'env' | 'ai_generation' | 'unknown';
}
export interface GetTestFailuresOutput {
    failures: TestFailure[];
    status: 'success' | 'failure' | 'no_results' | 'partial' | 'error';
    message: string;
    sourceFile?: string;
}
export declare function inferFailureSource(errorMessage: string): 'app' | 'test' | 'requirement' | 'env' | 'ai_generation';
export declare function getTestFailures(resultsDir?: string): GetTestFailuresOutput;
//# sourceMappingURL=get-test-failures.d.ts.map
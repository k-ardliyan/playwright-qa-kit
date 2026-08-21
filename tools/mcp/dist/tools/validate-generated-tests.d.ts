export interface ValidationViolation {
    filePath: string;
    lineNumber: number;
    ruleName: string;
    /** Optional severity — defaults to 'error' when absent (backward compat). */
    severity?: 'error' | 'warning';
}
export interface ValidateGeneratedTestsOutput {
    status: 'success' | 'error' | 'warning';
    validatedCount: number;
    violations: ValidationViolation[];
    /** Violations with severity 'warning' only — subset of violations. */
    warnings: ValidationViolation[];
    message: string;
}
export declare function validateSpecFile(filePath: string, relativePath?: string): ValidationViolation[];
/**
 * Detect persisted MCP snapshot refs or debug CLI handles.
 */
export declare function validateNoEphemeralRefs(content: string, filePath: string, relativePath: string): ValidationViolation[];
/**
 * Flag hardcoded waits/sleeps. Warning severity so existing tests are not
 * rejected outright, but the Generator cannot casually emit them.
 */
export declare function validateNoHardcodedWaits(content: string, filePath: string, relativePath: string): ValidationViolation[];
export declare function validateGeneratedTests(filePath?: string): ValidateGeneratedTestsOutput;
//# sourceMappingURL=validate-generated-tests.d.ts.map
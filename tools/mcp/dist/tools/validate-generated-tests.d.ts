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
 * Detect persisted MCP snapshot refs. Pattern derived from the ACTUAL installed
 * @playwright/mcp bundle, which serializes snapshot elements with a numeric ref
 * as `ref: <id>` (or `"ref": <id>` in JSON). No longer guesses at `node_id=`
 * (that is a CDP attribute that also legitimately appears in app URLs such as
 * `?node_id=5` and caused false positives).
 */
export declare function validateNoEphemeralRefs(content: string, filePath: string, relativePath: string): ValidationViolation[];
/**
 * Flag hardcoded waits/sleeps. Warning severity so existing tests are not
 * rejected outright, but the Generator cannot casually emit them.
 */
export declare function validateNoHardcodedWaits(content: string, filePath: string, relativePath: string): ValidationViolation[];
export declare function validateGeneratedTests(filePath?: string): ValidateGeneratedTestsOutput;
//# sourceMappingURL=validate-generated-tests.d.ts.map
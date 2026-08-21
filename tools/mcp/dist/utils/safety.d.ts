export declare const MAX_REQUIREMENTS_TEXT_BYTES: number;
export type AllowedPathKind = 'requirements' | 'specs' | 'tests' | 'reports' | 'test-results' | 'environments' | 'selector-catalog';
export interface ToolError {
    code: string;
    message: string;
}
export declare function createToolError(code: string, message: string): {
    status: 'error';
    error: ToolError;
};
export declare function findRepoRoot(start: string): string;
export declare function getRepoRoot(): string;
/**
 * Valid target for a requirement file under `requirements/`.
 * Default: allows examples and nested domain paths; still blocks _TEMPLATE, README.
 * Pass `{ blockExamples: true }` for the pipeline-tooling view that excludes
 * example-* files (matches the previous isPipelineRequirementRelativePath).
 */
export declare function isValidRequirementRelativePath(relativePath: string, opts?: {
    blockExamples?: boolean;
}): boolean;
/** Feature requirement files only — excludes meta (_TEMPLATE, README) and examples. */
export declare function isPipelineRequirementRelativePath(relativePath: string): boolean;
export declare function assertRequirementsTextSize(text: string): ToolError | null;
export declare function resolveAllowedPath(inputPath: string, kind: AllowedPathKind, options?: {
    mustExist?: boolean;
    readOnly?: boolean;
}): {
    ok: true;
    absolutePath: string;
    relativePath: string;
} | {
    ok: false;
    error: ToolError;
};
//# sourceMappingURL=safety.d.ts.map
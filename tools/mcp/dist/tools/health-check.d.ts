export interface HealthCheckItem {
    name: string;
    status: 'ok' | 'warn' | 'fail';
    message: string;
}
export interface HealthCheckOutput {
    status: 'success' | 'error';
    checks: HealthCheckItem[];
    message: string;
}
/**
 * Normalize a package spec like "^0.0.79", "~0.0.79" or "0.0.79" to the exact version.
 * Returns null when no concrete version can be pinned.
 */
export declare function normalizePinnedVersion(spec: string | undefined): string | null;
/**
 * Pure assessment of installed vs expected MCP version.
 * Exported for unit testing (match / mismatch / missing).
 */
export declare function assessPlaywrightMcp(installed: string | null, expectedVersion: string | null): HealthCheckItem;
export declare function healthCheck(): HealthCheckOutput;
//# sourceMappingURL=health-check.d.ts.map
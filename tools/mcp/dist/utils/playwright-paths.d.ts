/** Generator output and MCP validation scan root (override via PLAYWRIGHT_TEST_ROOT). */
export declare function getPlaywrightTestRoot(): string;
/** Active Playwright config for playwright-test MCP (override via PLAYWRIGHT_CONFIG). */
export declare function getPlaywrightConfigPath(): string;
/** Reference adapter spec root (override via PLAYWRIGHT_ADAPTER_TEST_ROOT). */
export declare function getAdapterTestRoot(): string;
/** Reference adapter Playwright config path (override via PLAYWRIGHT_ADAPTER_CONFIG). */
export declare function getAdapterConfigPath(): string;
/** Required base.fixture import for adapter specs (override via PLAYWRIGHT_ADAPTER_FIXTURE_IMPORT). */
export declare function getAdapterFixtureImport(): string;
/** JSON reporter output when adapter config is active (override via PLAYWRIGHT_ADAPTER_RESULTS_JSON). */
export declare function getAdapterJsonResultsPath(): string;
/** JSON reporter output for Healer pre-flight (override via PLAYWRIGHT_RESULTS_JSON). */
export declare function getJsonResultsPath(): string;
/** Absolute path to the active Playwright config under repo root. */
export declare function resolvePlaywrightConfigAbsolute(repoRoot: string): string;
export declare function isUnderAllowedTestRoot(relativePath: string): boolean;
/** Traceability-exempt directory prefix for adapter reference specs (includes trailing slash). */
export declare function getAdapterTraceabilityExemptPrefix(): string;
export declare function isAdapterSpecPath(relativePath: string): boolean;
//# sourceMappingURL=playwright-paths.d.ts.map
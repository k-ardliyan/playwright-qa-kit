/**
 * Shared core for snapshot_page and discover_pages MCP tools.
 *
 * - Launches a headless Chromium via `playwright`.
 * - Navigates to a URL with optional waitForSelector.
 * - Captures ARIA snapshot (YAML accessibility tree).
 * - Extracts structured selector candidates for interactive nodes, prioritised
 *   according to Playwright 2026 best practice:
 *     getByRole > getByLabel > getByText > getByPlaceholder > getByTestId > CSS.
 * - Writes two files under `selector-catalog/<featureName>/`:
 *     `<pageName>.aria.yml`  — full ARIA tree (for `toMatchAriaSnapshot()`).
 *     `<pageName>.json`      — flat selector index (for AI agents).
 * - Returns a `SnapshotResult` summary. The MCP boundary formats this as a
 *   compact response so AI agents only see the path / counts / hash, not the
 *   full tree.
 */
export declare const SELECTOR_CATALOG_MAX_FILES: number;
export declare const DEFAULT_MAX_ELEMENTS = 500;
export declare const DEFAULT_NAVIGATION_TIMEOUT_MS = 30000;
export declare const DEFAULT_WAIT_UNTIL: 'networkidle' | 'domcontentloaded' | 'load';
export interface SnapshotOptions {
    url: string;
    featureName: string;
    pageName: string;
    waitForSelector?: string;
    include?: string[];
    maxElements?: number;
    force?: boolean;
    waitUntil?: 'networkidle' | 'domcontentloaded' | 'load';
    navigationTimeoutMs?: number;
}
export interface SelectorCandidate {
    /** Source: 'role' | 'label' | 'text' | 'placeholder' | 'testId' | 'css'. */
    source: 'role' | 'label' | 'text' | 'placeholder' | 'testId' | 'css';
    /** Human-readable snippet for the locator, e.g. `getByRole('button', { name: 'Login' })`. */
    expression: string;
}
export interface CatalogElement {
    role: string;
    name: string;
    primary: string | null;
    candidates: SelectorCandidate[];
    fragile: boolean;
}
export interface CatalogIndex {
    schemaVersion?: 'qa.selector-catalog/v1';
    featureName: string;
    pageName: string;
    url: string;
    hash: string;
    catalogHash?: string;
    capturedAt: string;
    truncated: boolean;
    elementCount: number;
    elements: CatalogElement[];
}
export interface SnapshotResult {
    featureName: string;
    pageName: string;
    url: string;
    hash: string;
    elementCount: number;
    truncated: boolean;
    ariaYmlRelativePath: string;
    selectorsJsonRelativePath: string;
    skipped?: boolean;
    skipReason?: string;
}
export declare class SnapshotCoreError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare function snapshotPageCore(options: SnapshotOptions): Promise<SnapshotResult>;
//# sourceMappingURL=snapshot-core.d.ts.map
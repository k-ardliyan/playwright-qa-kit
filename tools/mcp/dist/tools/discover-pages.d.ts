/**
 * MCP tool: `discover_pages`.
 *
 * BFS auto-crawl a public site from a single entry point. For each unique URL:
 *   - extract `<a href>` (same origin only) for the frontier queue
 *   - skip URLs matching `excludePatterns` (regex) or with non-HTML extensions
 *   - respect robots.txt when enabled
 *   - call snapshotPageCore to persist the ARIA + selector catalog
 *
 * Output:
 *   - per-page catalog: selector-catalog/<featureName>/<pageName>.{aria.yml,json}
 *   - aggregate index: selector-catalog/<featureName>/page-map.json
 *   - checkpoint (every 5 pages): selector-catalog/<featureName>/.discover-state.json
 */
import { type ToolError } from '../utils/safety';
export interface DiscoverPagesArgs {
    rootUrl?: unknown;
    featureName?: unknown;
    maxDepth?: unknown;
    maxPages?: unknown;
    excludePatterns?: unknown;
    respectRobots?: unknown;
    requestDelayMs?: unknown;
    waitUntil?: unknown;
    force?: unknown;
}
export interface PageMapEntry {
    url: string;
    pageName: string;
    title: string;
    hash: string;
    elementCount: number;
    depth: number;
    truncated: boolean;
}
export interface SkippedEntry {
    url: string;
    reason: string;
}
export interface ErrorEntry {
    url: string;
    error: string;
}
export interface PageMapOutput {
    rootUrl: string;
    featureName: string;
    crawledAt: string;
    pages: PageMapEntry[];
    skipped: SkippedEntry[];
    errors: ErrorEntry[];
}
export interface DiscoverPagesOutput {
    status: 'success' | 'error';
    rootUrl?: string;
    featureName?: string;
    pagesDiscovered?: number;
    skippedCount?: number;
    errorCount?: number;
    pageMapPath?: string;
    durationMs?: number;
    message: string;
    error?: ToolError;
}
export declare function discoverPages(args: DiscoverPagesArgs | undefined): Promise<DiscoverPagesOutput>;
//# sourceMappingURL=discover-pages.d.ts.map
/**
 * MCP tool: `snapshot_page`.
 *
 * Navigate to a URL, capture an ARIA snapshot, and persist a structured
 * selector catalog under `selector-catalog/<featureName>/<pageName>.{aria.yml,json}`.
 * The full tree is written to disk so the AI agent only sees a compact summary
 * in the MCP response.
 */
import { type ToolError } from '../utils/safety';
export interface SnapshotPageArgs {
    url?: unknown;
    featureName?: unknown;
    pageName?: unknown;
    waitForSelector?: unknown;
    include?: unknown;
    maxElements?: unknown;
    force?: unknown;
    waitUntil?: unknown;
    navigationTimeoutMs?: unknown;
}
export interface SnapshotPageOutput {
    status: 'success' | 'error';
    featureName?: string;
    pageName?: string;
    url?: string;
    hash?: string;
    elementCount?: number;
    truncated?: boolean;
    ariaYmlPath?: string;
    selectorsJsonPath?: string;
    skipped?: boolean;
    skipReason?: string;
    message: string;
    error?: ToolError;
}
export declare function snapshotPage(args: SnapshotPageArgs | undefined): Promise<SnapshotPageOutput>;
//# sourceMappingURL=snapshot-page.d.ts.map
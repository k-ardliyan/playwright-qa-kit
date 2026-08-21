/**
 * Single source of truth for all MCP tools exposed by `playwright-qa`.
 *
 * `dispatchTool` (MCP boundary), the HTTP router in `index.ts`, and the
 * `MCP_TOOL_DEFINITIONS` list all derive from this registry. Adding a tool
 * is a single edit here; no other place needs to be kept in sync.
 */
export interface JsonSchemaObject {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
}
export type IntentProfile = 'author' | 'debug' | 'auth' | 'visual' | 'artifact' | 'minimal' | 'all';
export interface ToolEntry {
    name: string;
    description: string;
    inputSchema: JsonSchemaObject;
    /** Returns the raw payload. Wrap errors via `createToolError` or the `status` field. */
    handler: (args: Record<string, unknown> | undefined) => unknown;
    /** Optional override; default checks `payload.status === 'error'`. */
    isError?: (payload: unknown) => boolean;
    /** Profiles where this tool is active. Defaults to all if omitted. */
    profiles?: IntentProfile[];
}
export declare function getToolsForProfile(profile?: IntentProfile): ToolEntry[];
export declare const TOOL_REGISTRY: ToolEntry[];
export declare function getToolEntry(name: string): ToolEntry | undefined;
export declare function isToolError(name: string, payload: unknown): boolean;
export declare const MCP_TOOL_DEFINITIONS: {
    name: string;
    description: string;
    inputSchema: JsonSchemaObject;
}[];
export declare const TOOL_ROUTES: Record<string, string>;
//# sourceMappingURL=registry.d.ts.map
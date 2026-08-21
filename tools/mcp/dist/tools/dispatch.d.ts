import { type ToolProfile, MCP_TOOL_DEFINITIONS } from './registry';
export interface ToolDispatchResult {
    payload: unknown;
    isError: boolean;
}
export declare function dispatchTool(name: string, args: Record<string, unknown> | undefined, profile?: ToolProfile | string): Promise<ToolDispatchResult>;
export { MCP_TOOL_DEFINITIONS };
//# sourceMappingURL=dispatch.d.ts.map
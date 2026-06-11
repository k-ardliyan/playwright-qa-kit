import { getToolEntry, isToolError, MCP_TOOL_DEFINITIONS } from './registry';

export interface ToolDispatchResult {
  payload: unknown;
  isError: boolean;
}

export function dispatchTool(
  name: string,
  args: Record<string, unknown> | undefined,
): ToolDispatchResult {
  const entry = getToolEntry(name);
  if (!entry) {
    return {
      payload: {
        status: 'error',
        error: { code: 'UNKNOWN_TOOL', message: `Unknown tool: ${name}` },
      },
      isError: true,
    };
  }

  let payload: unknown;
  try {
    payload = entry.handler(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown tool error';
    payload = { status: 'error', error: { code: 'TOOL_ERROR', message } };
  }

  return { payload, isError: isToolError(name, payload) };
}

export { MCP_TOOL_DEFINITIONS };

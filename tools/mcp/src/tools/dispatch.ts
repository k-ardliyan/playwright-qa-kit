import {
  getToolEntry,
  isToolError,
  isToolAllowedForProfile,
  getActiveMcpProfile,
  type ToolProfile,
  MCP_TOOL_DEFINITIONS,
} from './registry';

export interface ToolDispatchResult {
  payload: unknown;
  isError: boolean;
}

export async function dispatchTool(
  name: string,
  args: Record<string, unknown> | undefined,
  profile?: ToolProfile | string,
): Promise<ToolDispatchResult> {
  const activeProfile = profile ?? getActiveMcpProfile();
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

  if (!isToolAllowedForProfile(name, activeProfile)) {
    return {
      payload: {
        status: 'error',
        error: {
          code: 'MCP_TOOL_NOT_ALLOWED_FOR_PROFILE',
          message: `Tool "${name}" is not permitted under MCP_PROFILE="${activeProfile}". Allowed profiles: ${entry.profiles?.join(', ') || 'all'}`,
        },
      },
      isError: true,
    };
  }

  let payload: unknown;
  try {
    payload = await Promise.resolve(entry.handler(args));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown tool error';
    payload = { status: 'error', error: { code: 'TOOL_ERROR', message } };
  }

  return { payload, isError: isToolError(name, payload) };
}

export { MCP_TOOL_DEFINITIONS };

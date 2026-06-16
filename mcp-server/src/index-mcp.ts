import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { dispatchTool, MCP_TOOL_DEFINITIONS } from './tools/dispatch';
import { bootstrapMcpEnvironment } from './utils/mcp-env-bootstrap';
import { logger } from './utils/logger';

const server = new Server(
  {
    name: 'playwright-qa-mcp-server',
    version: '2.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('ListTools request received.');
  return {
    tools: MCP_TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.info('CallTool request received.', { toolName: name });

  try {
    const result = dispatchTool(name, (args ?? {}) as Record<string, unknown>);
    return {
      content: [{ type: 'text', text: JSON.stringify(result.payload, null, 2) }],
      isError: result.isError,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Tool execution failed.', { toolName: name, message });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'error',
              error: { code: 'TOOL_ERROR', message },
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  bootstrapMcpEnvironment(__dirname);
  process.stderr.write('[playwright-qa-mcp] Starting MCP server (stdio transport)...\n');
  logger.info('Starting Playwright QA MCP server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[playwright-qa-mcp] Server ready. Waiting for JSON-RPC on stdin...\n');
  logger.info('Playwright QA MCP server running with stdio transport.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('MCP server failed to start.', { message });
  process.exit(1);
});

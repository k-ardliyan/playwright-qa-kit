import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getTestFailures } from './tools/get-test-failures';
import { normalizeRequirements } from './tools/normalize-requirements';
import { logger } from './utils/logger';

const server = new Server(
  {
    name: 'playwright-qa-mcp-server',
    version: '1.0.0',
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
    tools: [
      {
        name: 'get_test_failures',
        description:
          'Get recent Playwright test failure details from test-results JSON. Returns failure list with test titles, file paths, error messages, line numbers, and stack traces.',
        inputSchema: {
          type: 'object',
          properties: {
            resultsDir: {
              type: 'string',
              description:
                'Path to Playwright test-results directory. Defaults to cwd/test-results.',
            },
          },
        },
      },
      {
        name: 'normalize_requirements',
        description:
          'Parse and normalize unstructured requirement text into structured format. Extracts title, acceptance criteria, ID, and tags.',
        inputSchema: {
          type: 'object',
          properties: {
            requirementsText: {
              type: 'string',
              description:
                'Raw requirement text in markdown or free-form format. Should include title and acceptance criteria (bullet points or shall/must/should statements).',
            },
          },
          required: ['requirementsText'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info('CallTool request received.', { toolName: name });

  try {
    switch (name) {
      case 'get_test_failures': {
        const resultsDir = typeof args?.resultsDir === 'string' ? args.resultsDir : undefined;
        const output = getTestFailures(resultsDir);
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        };
      }

      case 'normalize_requirements': {
        const requirementsText = args?.requirementsText;

        if (typeof requirementsText !== 'string') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'error',
                    error: {
                      code: 'INVALID_INPUT',
                      message: 'requirementsText must be a string.',
                    },
                  },
                  null,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }

        const output = normalizeRequirements(requirementsText);
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          isError: output.status === 'error',
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
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

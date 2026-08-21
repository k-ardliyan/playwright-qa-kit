"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const dispatch_1 = require("./tools/dispatch");
const registry_1 = require("./tools/registry");
const mcp_env_bootstrap_1 = require("./utils/mcp-env-bootstrap");
const logger_1 = require("./utils/logger");
const server = new index_js_1.Server({
    name: 'playwright-qa-mcp-server',
    version: '2.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    const activeProfile = (0, registry_1.getActiveMcpProfile)();
    logger_1.logger.info('ListTools request received.', { profile: activeProfile });
    const activeTools = (0, registry_1.getToolsForProfile)(activeProfile);
    return {
        tools: activeTools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger_1.logger.info('CallTool request received.', { toolName: name });
    try {
        const result = await (0, dispatch_1.dispatchTool)(name, (args ?? {}));
        return {
            content: [{ type: 'text', text: JSON.stringify(result.payload, null, 2) }],
            isError: result.isError,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger_1.logger.error('Tool execution failed.', { toolName: name, message });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'error',
                        error: { code: 'TOOL_ERROR', message },
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    (0, mcp_env_bootstrap_1.bootstrapMcpEnvironment)(__dirname);
    process.stderr.write('[playwright-qa-mcp] Starting MCP server (stdio transport)...\n');
    logger_1.logger.info('Starting Playwright QA MCP server...');
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write('[playwright-qa-mcp] Server ready. Waiting for JSON-RPC on stdin...\n');
    logger_1.logger.info('Playwright QA MCP server running with stdio transport.');
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger_1.logger.error('MCP server failed to start.', { message });
    process.exit(1);
});
//# sourceMappingURL=index-mcp.js.map
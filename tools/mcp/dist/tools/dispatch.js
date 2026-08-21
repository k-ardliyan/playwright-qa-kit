"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_TOOL_DEFINITIONS = void 0;
exports.dispatchTool = dispatchTool;
const registry_1 = require("./registry");
Object.defineProperty(exports, "MCP_TOOL_DEFINITIONS", { enumerable: true, get: function () { return registry_1.MCP_TOOL_DEFINITIONS; } });
async function dispatchTool(name, args) {
    const entry = (0, registry_1.getToolEntry)(name);
    if (!entry) {
        return {
            payload: {
                status: 'error',
                error: { code: 'UNKNOWN_TOOL', message: `Unknown tool: ${name}` },
            },
            isError: true,
        };
    }
    let payload;
    try {
        payload = await Promise.resolve(entry.handler(args));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown tool error';
        payload = { status: 'error', error: { code: 'TOOL_ERROR', message } };
    }
    return { payload, isError: (0, registry_1.isToolError)(name, payload) };
}
//# sourceMappingURL=dispatch.js.map
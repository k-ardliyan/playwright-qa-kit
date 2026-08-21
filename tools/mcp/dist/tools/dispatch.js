"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_TOOL_DEFINITIONS = void 0;
exports.dispatchTool = dispatchTool;
const registry_1 = require("./registry");
Object.defineProperty(exports, "MCP_TOOL_DEFINITIONS", { enumerable: true, get: function () { return registry_1.MCP_TOOL_DEFINITIONS; } });
async function dispatchTool(name, args, profile) {
    const activeProfile = profile ?? (0, registry_1.getActiveMcpProfile)();
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
    if (!(0, registry_1.isToolAllowedForProfile)(name, activeProfile)) {
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
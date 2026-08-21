"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapMcpEnvironment = bootstrapMcpEnvironment;
const path = __importStar(require("node:path"));
const playwright_paths_1 = require("./playwright-paths");
const safety_1 = require("./safety");
const ERPKU_ADAPTER_OVERLAY = { dir: 'example/erpku/environments', name: 'erpku' };
function getLoadEnvironment(repoRoot) {
    // env-loader lives in template core, outside the mcp-server package.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path.join(repoRoot, 'src/utils/env-loader'));
    return mod.loadEnvironment;
}
/**
 * Anchor MCP processes at repo root and load the same env contract as Playwright configs.
 * Applies ERPKU adapter overlay when PLAYWRIGHT_CONFIG matches the adapter config path.
 */
function bootstrapMcpEnvironment(startDir) {
    // Must be set before any logger.info from env-loader — stdout is reserved for JSON-RPC.
    process.env.MCP_STDIO = '1';
    const repoRoot = (0, safety_1.findRepoRoot)(startDir);
    process.chdir(repoRoot);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveAppEnv } = require(path.join(repoRoot, 'src/utils/app-env'));
    const resolved = resolveAppEnv({ repoRoot });
    process.stderr.write(`[playwright-qa-mcp] APP_ENV=${resolved.appEnv} (source=${resolved.source}) → environments/${resolved.appEnv}.env\n`);
    const loadEnvironment = getLoadEnvironment(repoRoot);
    loadEnvironment();
    const config = (0, playwright_paths_1.getPlaywrightConfigPath)().replace(/\\/g, '/');
    const adapter = (0, playwright_paths_1.getAdapterConfigPath)().replace(/\\/g, '/');
    if (config === adapter) {
        loadEnvironment({ adapterEnv: ERPKU_ADAPTER_OVERLAY });
    }
    return repoRoot;
}
//# sourceMappingURL=mcp-env-bootstrap.js.map
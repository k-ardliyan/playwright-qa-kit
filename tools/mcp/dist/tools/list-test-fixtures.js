"use strict";
/**
 * MCP: list_test_fixtures — list files under test-fixtures/ for Input Data paths.
 */
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
exports.listTestFixtures = listTestFixtures;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const workspace_paths_1 = require("../utils/workspace-paths");
function walk(dir, base, prefix, out) {
    if (!fs.existsSync(dir))
        return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.'))
            continue;
        const abs = path.join(dir, entry.name);
        const rel = path.relative(base, abs).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            walk(abs, base, prefix, out);
        }
        else {
            out.push(`${prefix}/${rel}`.replace(/\\/g, '/'));
        }
    }
}
function listTestFixtures(args) {
    const fixturesRoot = workspace_paths_1.mcpWorkspace.testDataDir;
    const prefix = workspace_paths_1.mcpWorkspace.testDataRel;
    if (!fs.existsSync(fixturesRoot)) {
        return {
            status: 'success',
            fixtures: [],
            message: `${prefix}/ does not exist yet.`,
        };
    }
    const subdir = typeof args?.subdir === 'string' ? args.subdir.replace(/\\/g, '/').replace(/^\//, '') : '';
    if (subdir.includes('..') || path.isAbsolute(subdir)) {
        return {
            status: 'error',
            error: {
                code: 'INVALID_PATH',
                message: `subdir must be a relative path under ${prefix}/.`,
            },
        };
    }
    const start = subdir ? path.join(fixturesRoot, subdir) : fixturesRoot;
    if (!fs.existsSync(start)) {
        return {
            status: 'error',
            error: { code: 'NOT_FOUND', message: `subdir not found: ${prefix}/${subdir}` },
        };
    }
    const fixtures = [];
    walk(start, fixturesRoot, prefix, fixtures);
    fixtures.sort((a, b) => a.localeCompare(b));
    return {
        status: 'success',
        fixtures,
        count: fixtures.length,
    };
}
//# sourceMappingURL=list-test-fixtures.js.map
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
exports.listArtifacts = listArtifacts;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const safety_1 = require("../utils/safety");
const playwright_paths_1 = require("../utils/playwright-paths");
function listFilesRecursive(dirPath, extension) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    const repoRoot = (0, safety_1.getRepoRoot)();
    const files = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursive(fullPath, extension));
            continue;
        }
        if (entry.isFile() && fullPath.endsWith(extension)) {
            files.push(path.relative(repoRoot, fullPath).replace(/\\/g, '/'));
        }
    }
    return files.sort((a, b) => a.localeCompare(b));
}
function listRequirementFeatures() {
    const repoRoot = (0, safety_1.getRepoRoot)();
    const requirementsDir = path.join(repoRoot, 'requirements');
    // Reuse the recursive walker — supports both flat and nested domain subfolders
    const all = listFilesRecursive(requirementsDir, '.md');
    return all.filter((relative) => (0, safety_1.isPipelineRequirementRelativePath)(relative));
}
function listArtifacts() {
    const requirements = listRequirementFeatures();
    const specs = listFilesRecursive(path.join((0, safety_1.getRepoRoot)(), 'specs'), '.md');
    const tests = listFilesRecursive(path.join((0, safety_1.getRepoRoot)(), ...(0, playwright_paths_1.getPlaywrightTestRoot)().split('/')), '.spec.ts');
    const fixturesRoot = path.join((0, safety_1.getRepoRoot)(), 'test-fixtures');
    const fixtures = listAllFixtureFiles(fixturesRoot);
    return {
        status: 'success',
        requirements,
        specs,
        tests,
        fixtures,
        message: `Found ${requirements.length} requirement(s), ${specs.length} spec(s), ${tests.length} test file(s), ${fixtures.length} fixture file(s).`,
    };
}
function listAllFixtureFiles(dirPath) {
    if (!fs.existsSync(dirPath))
        return [];
    const repoRoot = (0, safety_1.getRepoRoot)();
    const files = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith('.'))
                continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory())
                walk(full);
            else if (entry.isFile() && entry.name.toLowerCase() !== 'readme.md') {
                files.push(path.relative(repoRoot, full).replace(/\\/g, '/'));
            }
        }
    };
    walk(dirPath);
    return files.sort((a, b) => a.localeCompare(b));
}
//# sourceMappingURL=list-artifacts.js.map
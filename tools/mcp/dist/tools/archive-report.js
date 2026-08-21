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
exports.archiveReport = archiveReport;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const safety_1 = require("../utils/safety");
const ARCHIVE_BASE = 'reports/archive';
/**
 * Archive a pipeline report (Markdown + optional JSON) to reports/archive/<runId>/.
 * Safe to call multiple times — overwrites if already exists.
 */
function archiveReport(input) {
    const { runId, reportPath, jsonReportPath } = input;
    if (!runId || typeof runId !== 'string' || runId.trim().length === 0) {
        return { status: 'error', message: 'runId is required and must be a non-empty string.' };
    }
    // Sanitise runId — only allow alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(runId)) {
        return {
            status: 'error',
            message: `Invalid runId "${runId}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
        };
    }
    const repoRoot = (0, safety_1.getRepoRoot)();
    const archiveDir = path.join(repoRoot, ARCHIVE_BASE, runId);
    // Resolve and validate report path — must be inside repo
    const absoluteReportPath = path.resolve(repoRoot, reportPath);
    if (!absoluteReportPath.startsWith(repoRoot)) {
        return {
            status: 'error',
            message: `reportPath "${reportPath}" must be inside the repository root.`,
        };
    }
    if (!fs.existsSync(absoluteReportPath)) {
        return {
            status: 'error',
            message: `Report file not found: ${reportPath}`,
        };
    }
    try {
        fs.mkdirSync(archiveDir, { recursive: true });
        const archivedFiles = [];
        // Copy Markdown report
        const mdDest = path.join(archiveDir, path.basename(absoluteReportPath));
        fs.copyFileSync(absoluteReportPath, mdDest);
        archivedFiles.push(path.relative(repoRoot, mdDest).replace(/\\/g, '/'));
        // Copy JSON report if provided
        if (jsonReportPath) {
            const absoluteJsonPath = path.resolve(repoRoot, jsonReportPath);
            if (!absoluteJsonPath.startsWith(repoRoot)) {
                return {
                    status: 'error',
                    message: `jsonReportPath "${jsonReportPath}" must be inside the repository root.`,
                };
            }
            if (fs.existsSync(absoluteJsonPath)) {
                const jsonDest = path.join(archiveDir, path.basename(absoluteJsonPath));
                fs.copyFileSync(absoluteJsonPath, jsonDest);
                archivedFiles.push(path.relative(repoRoot, jsonDest).replace(/\\/g, '/'));
            }
        }
        // Write archive metadata
        const meta = {
            runId,
            archivedAt: new Date().toISOString(),
            files: archivedFiles,
        };
        fs.writeFileSync(path.join(archiveDir, 'archive-meta.json'), JSON.stringify(meta, null, 2));
        const archivePath = path.relative(repoRoot, archiveDir).replace(/\\/g, '/');
        return {
            status: 'success',
            archivePath,
            archivedFiles,
            message: `Report archived to ${archivePath} (${archivedFiles.length} file(s)).`,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error archiving report';
        return { status: 'error', message };
    }
}
//# sourceMappingURL=archive-report.js.map
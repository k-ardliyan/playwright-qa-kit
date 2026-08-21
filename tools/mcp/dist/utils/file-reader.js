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
exports.getLatestJsonResultFile = getLatestJsonResultFile;
exports.readTextFile = readTextFile;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const logger_1 = require("./logger");
function listJsonFilesRecursively(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...listJsonFilesRecursively(fullPath));
            continue;
        }
        if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
            files.push(fullPath);
        }
    }
    return files;
}
function getLatestJsonResultFile(resultsDir) {
    const jsonFiles = listJsonFilesRecursively(resultsDir);
    if (jsonFiles.length === 0) {
        return null;
    }
    const latest = jsonFiles
        .map((filePath) => ({ filePath, mtimeMs: fs.statSync(filePath).mtimeMs }))
        .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    return latest?.filePath ?? null;
}
function readTextFile(filePath) {
    logger_1.logger.info('Reading file.', { filePath });
    return fs.readFileSync(filePath, 'utf-8');
}
//# sourceMappingURL=file-reader.js.map
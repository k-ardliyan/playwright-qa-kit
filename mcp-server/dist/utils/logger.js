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
exports.logger = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'automation.log');
function appendToFile(line) {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        fs.appendFileSync(LOG_FILE, `${line}\n`, 'utf8');
    }
    catch (error) {
        process.stderr.write(`[Logger] Failed to write to log file: ${String(error)}\n`);
    }
}
function write(level, message, metadata) {
    const timestamp = new Date().toISOString();
    const metaPart = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const line = `[${timestamp}] [${level}] ${message}${metaPart}`;
    if (level === 'INFO' || level === 'DEBUG') {
        process.stdout.write(`${line}\n`);
    }
    else {
        process.stderr.write(`${line}\n`);
    }
    appendToFile(line);
}
exports.logger = {
    info(message, metadata) {
        write('INFO', message, metadata);
    },
    warn(message, metadata) {
        write('WARN', message, metadata);
    },
    error(message, metadata) {
        write('ERROR', message, metadata);
    },
    debug(message, metadata) {
        if (process.env.LOG_LEVEL !== 'debug') {
            return;
        }
        write('DEBUG', message, metadata);
    },
};
//# sourceMappingURL=logger.js.map
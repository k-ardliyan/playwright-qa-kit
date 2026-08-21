import * as fs from 'node:fs';
import * as path from 'node:path';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Resolve log paths at write-time.
 * MCP bootstrap may `chdir` to the repo root after this module is first loaded;
 * freezing LOG_DIR at import time previously wrote to CWD-at-import (e.g. System32).
 */
function getLogPaths(): { logDir: string; logFile: string } {
  const logDir = path.resolve(process.cwd(), 'logs');
  return { logDir, logFile: path.join(logDir, 'automation.log') };
}

function appendToFile(line: string): void {
  try {
    const { logDir, logFile } = getLogPaths();
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, `${line}\n`, 'utf8');
  } catch (error) {
    // MCP stdio transport: stdout reserved for protocol messages only.
    // Log file write failures go to stderr.
    process.stderr.write(`[Logger] Failed to write to log file: ${String(error)}\n`);
  }
}

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const metaPart = metadata ? ` ${JSON.stringify(metadata)}` : '';
  const line = `[${timestamp}] [${level}] ${message}${metaPart}`;

  // All console log output goes to stderr. Never stdout (breaks MCP stdio).
  // INFO was previously file-only; emit to stderr too so MCP hosts can diagnose startup.
  process.stderr.write(`${line}\n`);

  appendToFile(line);
}

export const logger = {
  info(message: string, metadata?: Record<string, unknown>): void {
    write('INFO', message, metadata);
  },
  warn(message: string, metadata?: Record<string, unknown>): void {
    write('WARN', message, metadata);
  },
  error(message: string, metadata?: Record<string, unknown>): void {
    write('ERROR', message, metadata);
  },
  debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL !== 'debug') {
      return;
    }
    write('DEBUG', message, metadata);
  },
};

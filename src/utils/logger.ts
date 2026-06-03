/**
 * Structured Logger utility for the Playwright AI Agent Framework.
 *
 * Writes timestamped, levelled messages to the appropriate console stream
 * and appends every message to `logs/automation.log` for persistent tracing.
 *
 * @see Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'automation.log');

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

// ---------------------------------------------------------------------------
// Logger class
// ---------------------------------------------------------------------------

class Logger {
  /**
   * Log an informational message.
   * Writes to process.stdout and logs/automation.log.
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this._write('INFO', message, metadata);
  }

  /**
   * Log a warning message.
   * Writes to process.stderr and logs/automation.log.
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this._write('WARN', message, metadata);
  }

  /**
   * Log an error message.
   * Writes to process.stderr and logs/automation.log.
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this._write('ERROR', message, metadata);
  }

  /**
   * Log a debug message.
   * Only emitted (to stdout and log file) when LOG_LEVEL env var equals "debug".
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env['LOG_LEVEL'] !== 'debug') {
      return;
    }
    this._write('DEBUG', message, metadata);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Build the formatted log line and route it to the correct stream + file.
   */
  private _write(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString(); // ISO 8601 with ms precision
    const metaPart = metadata !== undefined ? ` ${JSON.stringify(metadata)}` : '';
    const line = `[${timestamp}] [${level}] ${message}${metaPart}`;

    // Route to the correct console stream
    if (level === 'INFO' || level === 'DEBUG') {
      process.stdout.write(line + '\n');
    } else {
      // WARN, ERROR
      process.stderr.write(line + '\n');
    }

    // Append to the persistent log file
    this._appendToFile(line);
  }

  /**
   * Ensure the `logs/` directory exists, then append the log line to the file.
   * Uses fs.appendFileSync for thread-safe, synchronous writes.
   */
  private _appendToFile(line: string): void {
    try {
      // Auto-create logs/ directory on first write
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }
      fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
    } catch (err) {
      // If file writing fails, report to stderr without crashing the process
      process.stderr.write(`[Logger] Failed to write to log file: ${String(err)}\n`);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const logger = new Logger();

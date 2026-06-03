import * as fs from 'node:fs';
import * as path from 'node:path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'automation.log');

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function appendToFile(line: string): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, `${line}\n`, 'utf8');
  } catch (error) {
    process.stderr.write(`[Logger] Failed to write to log file: ${String(error)}\n`);
  }
}

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const metaPart = metadata ? ` ${JSON.stringify(metadata)}` : '';
  const line = `[${timestamp}] [${level}] ${message}${metaPart}`;

  if (level === 'INFO' || level === 'DEBUG') {
    process.stdout.write(`${line}\n`);
  } else {
    process.stderr.write(`${line}\n`);
  }

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

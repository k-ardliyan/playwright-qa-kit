/// <reference types="node" />

// Feature: playwright-ai-agent-framework, Property 8: Logger Dual Output
// Feature: playwright-ai-agent-framework, Property 9: Logger Debug Suppression

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';
import { logger } from '../../utils/logger';

type LoggerLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_FILE = path.resolve(process.cwd(), 'logs', 'automation.log');

type WriteFn = (chunk: string | Uint8Array) => void;

function captureWrites(run: () => void): { stdout: string; stderr: string } {
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  const captureStdout: WriteFn = (chunk) => {
    stdoutChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
  };

  const captureStderr: WriteFn = (chunk) => {
    stderrChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
  };

  process.stdout.write = ((chunk: string | Uint8Array) => {
    captureStdout(chunk);
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    captureStderr(chunk);
    return true;
  }) as typeof process.stderr.write;

  try {
    run();
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }

  return {
    stdout: stdoutChunks.join(''),
    stderr: stderrChunks.join(''),
  };
}

function callLogger(level: LoggerLevel, message: string): void {
  const metadata = { source: 'property-test', level };

  if (level === 'info') {
    logger.info(message, metadata);
    return;
  }

  if (level === 'warn') {
    logger.warn(message, metadata);
    return;
  }

  if (level === 'error') {
    logger.error(message, metadata);
    return;
  }

  logger.debug(message, metadata);
}

function removeLogFile(): void {
  if (fs.existsSync(LOG_FILE)) {
    fs.rmSync(LOG_FILE, { force: true });
  }
}

async function property8LoggerDualOutput(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom<LoggerLevel>('info', 'warn', 'error', 'debug'),
      fc.string({ minLength: 1, maxLength: 80 }),
      async (level, message) => {
        const previousLogLevel = process.env.LOG_LEVEL;
        process.env.LOG_LEVEL = 'debug';

        removeLogFile();
        const output = captureWrites(() => {
          callLogger(level, message);
        });

        const combined = `${output.stdout}${output.stderr}`;
        assert.match(combined, /\[\d{4}-\d{2}-\d{2}T.*Z\] \[(INFO|WARN|ERROR|DEBUG)\]/);

        const expectedLabel = `[${level.toUpperCase()}]`;
        assert.equal(combined.includes(expectedLabel), true);
        assert.equal(combined.includes(message), true);

        if (level === 'info' || level === 'debug') {
          assert.equal(output.stdout.includes(message), true);
          assert.equal(output.stderr.length, 0);
        } else {
          assert.equal(output.stderr.includes(message), true);
          assert.equal(output.stdout.length, 0);
        }

        const fileContent = fs.readFileSync(LOG_FILE, 'utf8');
        assert.equal(fileContent.includes(expectedLabel), true);
        assert.equal(fileContent.includes(message), true);

        if (previousLogLevel === undefined) {
          delete process.env.LOG_LEVEL;
        } else {
          process.env.LOG_LEVEL = previousLogLevel;
        }
      },
    ),
    { numRuns: 24 },
  );

  console.log('✓ Property 8 passed: logger dual output');
}

async function property9LoggerDebugSuppression(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.option(
        fc.string().filter((value) => value !== 'debug'),
        { nil: undefined },
      ),
      fc.string({ minLength: 1, maxLength: 100 }),
      async (logLevel, message) => {
        const previousLogLevel = process.env.LOG_LEVEL;

        if (logLevel === undefined) {
          delete process.env.LOG_LEVEL;
        } else {
          process.env.LOG_LEVEL = logLevel;
        }

        removeLogFile();

        const output = captureWrites(() => {
          logger.debug(message, { source: 'property-test' });
        });

        assert.equal(output.stdout.length, 0);
        assert.equal(output.stderr.length, 0);

        if (fs.existsSync(LOG_FILE)) {
          const fileContent = fs.readFileSync(LOG_FILE, 'utf8');
          assert.equal(fileContent.includes(message), false);
        }

        if (previousLogLevel === undefined) {
          delete process.env.LOG_LEVEL;
        } else {
          process.env.LOG_LEVEL = previousLogLevel;
        }
      },
    ),
    { numRuns: 24 },
  );

  console.log('✓ Property 9 passed: logger debug suppression');
}

async function main(): Promise<void> {
  await property8LoggerDualOutput();
  await property9LoggerDebugSuppression();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

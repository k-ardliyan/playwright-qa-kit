/// <reference types="node" />

// Feature: playwright-ai-agent-framework, Property 4: Environment Fallback Behavior

import assert from 'node:assert/strict';
import fc from 'fast-check';
import { loadEnvironment } from '../../utils/env-loader';
import { logger } from '../../utils/logger';

const KNOWN = new Set(['local', 'dev', 'qa', 'staging', 'production']);

type LoggerMethod = (message: string, metadata?: Record<string, unknown>) => void;

async function main(): Promise<void> {
  await fc.assert(
    fc.asyncProperty(
      fc.stringMatching(/^[A-Za-z0-9_-]{1,20}$/).filter((value) => !KNOWN.has(value)),
      async (unknownEnv) => {
        const previousAppEnv = process.env.APP_ENV;

        const warnings: string[] = [];
        const infos: string[] = [];

        const originalWarn = logger.warn.bind(logger) as LoggerMethod;
        const originalInfo = logger.info.bind(logger) as LoggerMethod;

        logger.warn = ((message: string) => {
          warnings.push(message);
        }) as LoggerMethod;

        logger.info = ((message: string) => {
          infos.push(message);
        }) as LoggerMethod;

        process.env.APP_ENV = unknownEnv;

        try {
          loadEnvironment();

          assert.equal(
            warnings.some((msg) => msg.includes('unrecognised value')),
            true,
          );
          assert.equal(
            warnings.some((msg) => msg.includes(unknownEnv)),
            true,
          );
          assert.equal(
            infos.some((msg) => msg.includes("Loaded environment 'local'")),
            true,
          );
          assert.equal(
            infos.some((msg) => msg.includes('environments/local.env')),
            true,
          );
        } finally {
          logger.warn = originalWarn;
          logger.info = originalInfo;

          if (previousAppEnv === undefined) {
            delete process.env.APP_ENV;
          } else {
            process.env.APP_ENV = previousAppEnv;
          }
        }
      },
    ),
    { numRuns: 24 },
  );

  console.log('✓ Property 4 passed: env loader fallback behavior');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

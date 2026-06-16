/// <reference types="node" />

// Framework fixture seam: factory + handler wiring

import assert from 'node:assert/strict';
import type { TestInfo } from '@playwright/test';
import {
  createFrameworkFixtureHandlers,
  frameworkFixtureExtend,
} from '../../fixtures/framework.fixture';
import { projectTest } from '../../fixtures/project.fixture';
import { logger } from '../../utils/logger';

type WriteFn = (chunk: string | Uint8Array) => boolean;

async function main(): Promise<void> {
  assert.equal(typeof logger.info, 'function');
  assert.equal(typeof logger.warn, 'function');
  assert.equal(typeof logger.error, 'function');
  process.stdout.write('✓ logger singleton exposes info, warn, error\n');

  const { loggerFixture, testTraceHandler } = createFrameworkFixtureHandlers();

  let passedLogger: typeof logger | undefined;
  await loggerFixture({}, async (value) => {
    passedLogger = value;
  });
  assert.equal(passedLogger, logger);

  const testInfo = {
    title: 'property-trace-test',
    project: { name: 'chromium' },
    status: 'passed',
  } as TestInfo;

  let combined = '';
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    combined += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }) as WriteFn;

  try {
    await testTraceHandler({ logger }, async () => undefined, testInfo);
  } finally {
    process.stdout.write = originalStdoutWrite;
  }
  assert.match(combined, /Test started: property-trace-test/);
  assert.match(combined, /Test finished: property-trace-test/);
  assert.match(combined, /"project":"chromium"/);
  process.stdout.write('✓ testTrace fixture logs start and finish\n');

  assert.equal(frameworkFixtureExtend.logger, createFrameworkFixtureHandlers().loggerFixture);
  process.stdout.write('✓ frameworkFixtureExtend is single wiring source\n');

  const extended = projectTest.extend(frameworkFixtureExtend);
  assert.equal(typeof extended, 'function');
  assert.equal(typeof extended.extend, 'function');
  process.stdout.write('✓ projectTest.extend(frameworkFixtureExtend) preserves test surface\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

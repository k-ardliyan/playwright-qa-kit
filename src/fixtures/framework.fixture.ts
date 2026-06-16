import type { TestInfo } from '@playwright/test';
import { logger } from '@/utils/logger';

/**
 * Framework-level fixtures every fork inherits via base.fixture assembly.
 * Forks register Page Objects in project.fixture.ts — not here.
 */
export type FrameworkFixtures = {
  logger: typeof logger;
  /** Auto fixture: logs test lifecycle start/finish to logger. */
  testTrace: void;
};

/** Single source for framework fixture wiring — consumed by both assembly points. */
export const frameworkFixtureExtend = {
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture with no dependencies
  logger: async ({}, use: (value: typeof logger) => Promise<void>) => {
    await use(logger);
  },
  testTrace: [
    async (
      { logger: log }: { logger: typeof logger },
      use: (value: void) => Promise<void>,
      testInfo: TestInfo,
    ) => {
      log.info(`Test started: ${testInfo.title}`, {
        project: testInfo.project.name,
      });
      await use();
      log.info(`Test finished: ${testInfo.title}`, {
        project: testInfo.project.name,
        status: testInfo.status,
      });
    },
    { auto: true },
  ],
};

type TestTraceHandler = (
  args: { logger: typeof logger },
  use: (value: void) => Promise<void>,
  testInfo: TestInfo,
) => Promise<void>;

/** Used by property tests to assert framework fixture wiring. */
export function createFrameworkFixtureHandlers(): {
  loggerFixture: typeof frameworkFixtureExtend.logger;
  testTraceHandler: TestTraceHandler;
} {
  const [traceHandler] = frameworkFixtureExtend.testTrace;
  return {
    loggerFixture: frameworkFixtureExtend.logger,
    testTraceHandler: traceHandler as TestTraceHandler,
  };
}

import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Shared Playwright execution policy for template core, Reference Adapter, and docs/recipes/.
 * Forks merge this file from upstream, then override testDir / projects / reporter paths locally.
 */
export const playwrightSharedDefaults = {
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry' as const,
    screenshot: 'only-on-failure' as const,
    video: 'retain-on-failure' as const,
  },
} satisfies Partial<PlaywrightTestConfig>;

export function createFrameworkReporters(options: {
  jsonOutput: string;
  htmlFolder: string;
  customReporterPath: string;
}): PlaywrightTestConfig['reporter'] {
  return [
    ['list'],
    ['json', { outputFile: options.jsonOutput }],
    ['html', { outputFolder: options.htmlFolder, open: 'never' }],
    [options.customReporterPath],
  ];
}

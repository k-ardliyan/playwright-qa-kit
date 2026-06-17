import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from './src/utils/env-loader';
import { buildPlaywrightSharedDefaults, createFrameworkReporters } from './playwright.config.base';

loadEnvironment();

export default defineConfig({
  ...buildPlaywrightSharedDefaults(),
  testDir: './src/tests',
  reporter: createFrameworkReporters({
    jsonOutput: 'test-results/results.json',
    htmlFolder: './reports/html',
    customReporterPath: './src/support/custom-reporter.ts',
  }),
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      testDir: './src/tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/demo/**'],
    },
    {
      name: 'demo',
      timeout: 60_000,
      retries: 0,
      use: {
        ...devices['Desktop Chrome'],
      },
      testDir: './src/tests/demo',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: './test-results',
});

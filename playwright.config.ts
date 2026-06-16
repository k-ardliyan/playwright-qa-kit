import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from './src/utils/env-loader';
import { createFrameworkReporters, playwrightSharedDefaults } from './playwright.config.base';

loadEnvironment();

export default defineConfig({
  ...playwrightSharedDefaults,
  grepInvert: /@demo/,
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
  ],
  outputDir: './test-results',
});

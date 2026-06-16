import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from '../../src/utils/env-loader';
import { createFrameworkReporters, playwrightSharedDefaults } from '../../playwright.config.base';

loadEnvironment({
  adapterEnv: { dir: 'example/erpku/environments', name: 'erpku' },
});

export default defineConfig({
  ...playwrightSharedDefaults,
  grepInvert: /@demo/,
  testDir: './tests',
  reporter: createFrameworkReporters({
    jsonOutput: 'test-results/erpku-results.json',
    htmlFolder: './reports/erpku-html',
    customReporterPath: '../../src/support/custom-reporter.ts',
  }),
  projects: [
    {
      name: 'setup',
      testDir: './support',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'smoke',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      testDir: './tests',
      testMatch: '**/smoke/**/*.spec.ts',
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      testDir: './tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/smoke/**', '**/demo/**'],
      dependencies: ['setup'],
    },
  ],
  outputDir: '../../test-results/erpku',
});

/**
 * RECIPE — copy to your target repo as playwright.config.ts
 *
 * Next.js single-repo integration with /e2e layout, auth setup project, and webServer.
 * Not runnable in the template core. See docs/recipes/README.md.
 *
 * Also copy src/support/custom-reporter.ts into your fork (recipe path: ./e2e/support/custom-reporter.ts).
 */
import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from '../../src/utils/env-loader';
import {
  buildPlaywrightSharedDefaults,
  createFrameworkReporters,
} from '../../playwright.config.base';

loadEnvironment();

export default defineConfig({
  ...buildPlaywrightSharedDefaults(),
  testDir: './e2e',
  reporter: createFrameworkReporters({
    jsonOutput: 'test-results/results.json',
    htmlFolder: './reports/html',
    customReporterPath: './e2e/support/custom-reporter.ts',
  }),
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e/support',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      testDir: './e2e/specs',
      testMatch: '**/*.spec.ts',
      dependencies: ['setup'],
    },
  ],
  outputDir: './test-results',
});

/**
 * Cross-browser config — chromium + firefox + webkit using shared defaults.
 *
 * Usage:
 *   npx playwright test -c playwright.cross-browser.config.ts --grep-invert @demo
 *
 * Nightly job may invoke this for browser-matrix coverage.
 * Auth: setup project materializes .auth/user.json; specs override storageState as needed.
 */
import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from './src/utils/env-loader';
import {
  buildPlaywrightSharedDefaults,
  buildMultiBrowserProjects,
  createFrameworkReporters,
} from './playwright.config.base';

loadEnvironment();

const multiBrowser = buildMultiBrowserProjects({
  testDir: './src/tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/demo/**'],
  storageState: { cookies: [], origins: [] },
});

export default defineConfig({
  ...buildPlaywrightSharedDefaults(),
  testDir: './src/tests',
  reporter: createFrameworkReporters({
    jsonOutput: 'test-results/cross-browser-results.json',
    htmlFolder: './reports/html-cross-browser',
    customReporterPath: './src/support/custom-reporter.ts',
  }),
  projects: [
    {
      name: 'setup',
      testDir: './src/support',
      testMatch: /auth\.setup\.ts/,
    },
    ...multiBrowser.map((project) => ({
      ...project,
      dependencies: ['setup'] as string[],
    })),
    // Keep a lightweight demo project optional — excluded from multi-browser matrix
    {
      name: 'demo',
      timeout: 60_000,
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
      testDir: './src/tests/demo',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: './test-results/cross-browser',
});

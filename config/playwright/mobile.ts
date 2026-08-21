/**
 * Mobile device projects config — optional matrix for responsive smoke.
 *
 * Usage:
 *   npx playwright test -c config/playwright/mobile.ts --grep @smoke
 *   npx playwright test -c config/playwright/mobile.ts tests/demo/demo-pw-power.spec.ts
 *
 * Does not replace default chromium desktop runs.
 */
import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from '../../src/utils/env-loader';
import { buildPlaywrightSharedDefaults, createFrameworkReporters } from './base';

loadEnvironment();

export default defineConfig({
  ...buildPlaywrightSharedDefaults(),
  testDir: './tests',
  reporter: createFrameworkReporters({
    jsonOutput: 'artifacts/test-results/mobile-results.json',
    htmlFolder: './artifacts/reports/html-mobile',
    customReporterPath: '../../src/support/custom-reporter.ts',
  }),
  projects: [
    {
      name: 'setup',
      testDir: './tests',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: { cookies: [], origins: [] },
      },
      testDir: './tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/demo/**'],
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        storageState: { cookies: [], origins: [] },
      },
      testDir: './tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/demo/**'],
      dependencies: ['setup'],
    },
    {
      name: 'demo-mobile',
      timeout: 60_000,
      retries: 0,
      use: { ...devices['Pixel 5'] },
      testDir: './tests/demo',
      testMatch: '**/demo-pw-power.spec.ts',
    },
  ],
  outputDir: './artifacts/test-results/mobile',
});

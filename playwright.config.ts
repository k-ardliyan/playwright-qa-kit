import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from './src/utils/env-loader';
import { buildPlaywrightSharedDefaults, createFrameworkReporters } from './playwright.config.base';

loadEnvironment();

const includeBlob = process.env.CI === 'true' && process.env.PW_BLOB === '1';

export default defineConfig({
  ...buildPlaywrightSharedDefaults(),
  testDir: './src/tests',
  reporter: createFrameworkReporters({
    jsonOutput: 'test-results/results.json',
    htmlFolder: './reports/html',
    customReporterPath: './src/support/custom-reporter.ts',
    includeBlob,
    blobOutputDir: 'blob-report',
  }),
  projects: [
    // Auth setup — materializes .auth/{APP_ENV}/<role>.json for every login-ready role.
    // Run explicitly: npx playwright test src/support/auth.setup.ts --project=setup
    {
      name: 'setup',
      testDir: './src/support',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Default unauthenticated. Generated authenticated specs MUST override:
        //   test.use({ storageState: authStatePath('<role>') })
        //   // or `.auth/${process.env.APP_ENV||'local'}/<role>.json`
        // Forcing .auth/.../user.json here would break unauth + public demos.
        storageState: { cookies: [], origins: [] },
      },
      testDir: './src/tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/demo/**'],
      // Official Playwright auth pattern: setup always runs first.
      dependencies: ['setup'],
    },
    {
      // Public demos — no auth dependency (playwright.dev / setContent fixtures).
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

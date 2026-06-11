import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from './src/utils/env-loader';

loadEnvironment();

export default defineConfig({
  // ── Test Discovery ──────────────────────────────────────────────
  testDir: './src/tests',

  // ── Execution ───────────────────────────────────────────────────
  fullyParallel: true,
  grepInvert: /@demo/,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,

  // ── Assertions ──────────────────────────────────────────────────
  expect: {
    timeout: 10_000,
  },

  // ── Reporters ───────────────────────────────────────────────────
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: './reports/html', open: 'never' }],
    ['./src/support/custom-reporter.ts'],
  ],

  // ── Shared Settings ─────────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ── Browser Projects ────────────────────────────────────────────
  projects: [
    {
      name: 'setup',
      testDir: './src/support',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'smoke',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      testDir: './src/tests',
      testMatch: '**/smoke/**/*.spec.ts',
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      testDir: './src/tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/smoke/**', '**/demo/**'],
      dependencies: ['setup'],
    },
    // Uncomment untuk cross-browser testing:
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: '.auth/user.json',
    //   },
    //   testDir: './src/tests',
    //   testMatch: '**/*.spec.ts',
    //   testIgnore: ['**/smoke/**', '**/demo/**'],
    //   dependencies: ['setup'],
    // },
  ],

  // ── Output ──────────────────────────────────────────────────────
  outputDir: './test-results',
});

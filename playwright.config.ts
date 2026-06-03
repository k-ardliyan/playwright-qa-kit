import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from './src/utils/env-loader';

loadEnvironment();

export default defineConfig({
  // ── Test Discovery ──────────────────────────────────────────────
  testDir: './src/tests',

  // ── Execution ───────────────────────────────────────────────────
  fullyParallel: true,
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
    // Auth setup — login sekali, simpan state
    {
      name: 'setup',
      testDir: './src/support',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Pakai auth state dari setup project
        storageState: '.auth/user.json',
      },
      testDir: './src/tests',
      testMatch: '**/*.spec.ts',
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
    //   dependencies: ['setup'],
    // },
  ],

  // ── Output ──────────────────────────────────────────────────────
  outputDir: './test-results',
});

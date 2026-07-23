/**
 * RECIPE — multi-role projects for forks with finance/hrd/super-admin auth.
 * Copy patterns into your playwright.config.ts or import buildRoleProjects.
 *
 * Prerequisites:
 * - src/support/auth.setup.ts writes .auth/{APP_ENV}/<role>.json
 * - OTP/CAPTCHA session: AUTH_CHALLENGE_MODE + npm run auth:setup:headed
 * - Specs named src/tests/<feature>-<role>.spec.ts
 *
 * Not the default root config (template stays single chromium + empty default storage).
 */
import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from '../../src/utils/env-loader';
import {
  buildPlaywrightSharedDefaults,
  createFrameworkReporters,
} from '../../playwright.config.base';
import { buildRoleProjects } from '../../src/support/pw/role-projects';

loadEnvironment();

const roles = (process.env.ROLE_SCOPE ?? 'finance,hrd,super-admin')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

export default defineConfig({
  ...buildPlaywrightSharedDefaults(),
  testDir: './src/tests',
  reporter: createFrameworkReporters({
    jsonOutput: 'test-results/role-results.json',
    htmlFolder: './reports/html-roles',
    customReporterPath: './src/support/custom-reporter.ts',
  }),
  projects: [
    {
      name: 'setup',
      testDir: './src/support',
      testMatch: /auth\.setup\.ts/,
    },
    // Unauthenticated / general specs (no *-role suffix)
    {
      name: 'general',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      testDir: './src/tests',
      testMatch: '**/*.spec.ts',
      testIgnore: [
        '**/demo/**',
        '**/*-finance.spec.ts',
        '**/*-hrd.spec.ts',
        '**/*-super-admin.spec.ts',
      ],
      dependencies: ['setup'],
    },
    ...buildRoleProjects(roles, {
      testDir: './src/tests',
      testIgnore: ['**/demo/**'],
      setupProjectName: 'setup',
    }),
  ],
  outputDir: './test-results/roles',
});

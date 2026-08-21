import { defineConfig, devices } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadEnvironment } from '../../src/utils/env-loader';
import {
  buildPlaywrightSharedDefaults,
  createFrameworkReporters,
} from '../../config/playwright/base';
import {
  authStateWritePath,
  ensureAuthDirForEnv,
  migrateLegacyAuthFiles,
} from '../../src/support/auth-paths';

loadEnvironment({
  adapterEnv: { dir: 'examples/erpku/environments', name: 'erpku' },
});

// Ensure scoped auth file exists so project-level storageState does not fail
// before the first successful setup run (empty session is OK for bootstrap).
migrateLegacyAuthFiles();
const userAuthWrite = authStateWritePath('user');
ensureAuthDirForEnv();
if (!fs.existsSync(userAuthWrite)) {
  const dir = path.dirname(userAuthWrite);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(userAuthWrite, JSON.stringify({ cookies: [], origins: [] }, null, 2), 'utf8');
}

export default defineConfig({
  ...buildPlaywrightSharedDefaults(),
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
      // OTP stdin / browser pause must not race across roles
      fullyParallel: false,
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
        // Scoped by APP_ENV — file ensured above (empty until setup logs in)
        storageState: userAuthWrite,
      },
      testDir: './tests',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/smoke/**', '**/demo/**'],
      dependencies: ['setup'],
    },
  ],
  outputDir: '../../test-results/erpku',
});

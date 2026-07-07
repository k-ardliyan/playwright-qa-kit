import { defineConfig } from '@playwright/test';

// Playwright configuration for unit tests (.test.ts files).
// Separate from the main E2E config which matches .spec.ts only.
// Scans: src and scripts tests dirs.
export default defineConfig({
  testDir: './',
  testMatch: ['src/**/*.test.ts', 'scripts/__tests__/**/*.test.ts'],
  reporter: [['list']],
  timeout: 10_000,
  fullyParallel: false,
});

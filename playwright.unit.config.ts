import { defineConfig } from '@playwright/test';

// Playwright configuration for unit tests (.test.ts files).
// Separate from the main E2E config which matches .spec.ts only.
// Scans: src and scripts tests dirs.
export default defineConfig({
  testDir: './',
  // Include src/** and explicit unit folder; keep scripts tests.
  testMatch: ['src/**/*.test.ts', 'src/tests/unit/**/*.test.ts', 'scripts/__tests__/**/*.test.ts'],
  reporter: [['list']],
  timeout: 15_000,
  fullyParallel: false,
});

import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from './src/utils/env-loader';

// Muat environment dari environments/{APP_ENV}.env via env-loader.
// Set APP_ENV ke 'local' | 'dev' | 'staging' | 'production' (default: 'local').
loadEnvironment();

export default defineConfig({
  // ── Test Discovery ──────────────────────────────────────────────
  testDir: './e2e', // Disesuaikan ke subfolder e2e Next.js Anda

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
  reporter: [['list'], ['html', { outputFolder: './reports/html', open: 'never' }]],

  // ── Shared Settings ─────────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ── WebServer (Next.js Monorepo/Single Repo Integration) ────────
  // Jalankan frontend server lokal secara otomatis sebelum testing dimulai.
  // Di lokal: menggunakan 'npm run dev' biasa (cepat).
  // Di CI (GitHub Actions): menggunakan 'npm run build && npm run start' (menguji real production build Next.js).
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000', // Port default Next.js (3000)
    reuseExistingServer: !process.env.CI, // Jika server lokal sudah menyala, gunakan server tersebut (tidak di-restart)
    timeout: 120_000, // Berikan waktu 2 menit bagi Next.js untuk booted-up penuh
  },

  // ── Browser Projects ────────────────────────────────────────────
  projects: [
    // Auth setup — login sekali, simpan state
    {
      name: 'setup',
      testDir: './e2e/support', // Disesuaikan ke subfolder e2e
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Pakai auth state dari setup project
        storageState: '.auth/user.json',
      },
      testDir: './e2e/specs', // Disesuaikan ke subfolder e2e
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
    //   testDir: './e2e/specs',
    //   testMatch: '**/*.spec.ts',
    //   dependencies: ['setup'],
    // },
  ],

  // ── Output ──────────────────────────────────────────────────────
  outputDir: './test-results',
});

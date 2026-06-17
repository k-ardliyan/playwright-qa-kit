import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Shared Playwright execution policy for template core, Reference Adapter, and docs/recipes/.
 * Forks merge this file from upstream, then override testDir / projects / reporter paths locally.
 *
 * Call buildPlaywrightSharedDefaults() only after loadEnvironment() in each config entry file.
 */

function warnConfig(message: string): void {
  console.warn(`[playwright.config] ${message}`);
}

/** Parse SLOW_MO from process.env. CI always returns 0. */
export function resolveSlowMo(): number {
  if (process.env.CI) {
    return 0;
  }

  const raw = process.env.SLOW_MO?.trim();
  if (raw === undefined || raw === '') {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    warnConfig(`Invalid SLOW_MO='${raw}'. Falling back to 0.`);
    return 0;
  }

  return parsed;
}

/** Parse HEADLESS from process.env (default true). */
export function resolveHeadless(): boolean {
  const raw = process.env.HEADLESS?.trim();
  if (raw === undefined || raw === '') {
    return true;
  }

  const normalized = raw.toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  warnConfig(`Invalid HEADLESS='${raw}'. Falling back to true.`);
  return true;
}

export function buildPlaywrightSharedDefaults(): Partial<PlaywrightTestConfig> {
  return {
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    timeout: 30_000,
    expect: {
      timeout: 10_000,
    },
    use: {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      headless: resolveHeadless(),
      launchOptions: {
        slowMo: resolveSlowMo(),
      },
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
  };
}

export function createFrameworkReporters(options: {
  jsonOutput: string;
  htmlFolder: string;
  customReporterPath: string;
}): PlaywrightTestConfig['reporter'] {
  return [
    ['list'],
    ['json', { outputFile: options.jsonOutput }],
    ['html', { outputFolder: options.htmlFolder, open: 'never' }],
    [options.customReporterPath],
  ];
}

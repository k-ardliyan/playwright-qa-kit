import * as path from 'node:path';

const DEFAULT_TEST_ROOT = 'src/tests';
const DEFAULT_CONFIG_PATH = 'playwright.config.ts';
const DEFAULT_JSON_RESULTS = 'test-results/results.json';

const DEFAULT_ADAPTER_TEST_ROOT = 'example/erpku/tests';
const DEFAULT_ADAPTER_CONFIG_PATH = 'example/erpku/playwright.config.ts';
const DEFAULT_ADAPTER_FIXTURE_IMPORT = '@erpku/fixtures/base.fixture';
const DEFAULT_ADAPTER_RESULTS_JSON = 'test-results/erpku-results.json';

function normalizeEnvPath(raw: string, trimTrailingSlash = false): string {
  let normalized = raw.replace(/\\/g, '/');
  if (trimTrailingSlash) {
    normalized = normalized.replace(/\/+$/, '');
  }
  return normalized;
}

function normalizeEnvRoot(raw: string): string {
  return normalizeEnvPath(raw, true);
}

/** Generator output and MCP validation scan root (override via PLAYWRIGHT_TEST_ROOT). */
export function getPlaywrightTestRoot(): string {
  const raw = process.env.PLAYWRIGHT_TEST_ROOT?.trim();
  if (!raw) {
    return DEFAULT_TEST_ROOT;
  }
  return normalizeEnvRoot(raw);
}

/** Active Playwright config for playwright-test MCP (override via PLAYWRIGHT_CONFIG). */
export function getPlaywrightConfigPath(): string {
  const raw = process.env.PLAYWRIGHT_CONFIG?.trim();
  if (!raw) {
    return DEFAULT_CONFIG_PATH;
  }
  return normalizeEnvPath(raw);
}

/** Reference adapter spec root (override via PLAYWRIGHT_ADAPTER_TEST_ROOT). */
export function getAdapterTestRoot(): string {
  const raw = process.env.PLAYWRIGHT_ADAPTER_TEST_ROOT?.trim();
  if (!raw) {
    return DEFAULT_ADAPTER_TEST_ROOT;
  }
  return normalizeEnvRoot(raw);
}

/** Reference adapter Playwright config path (override via PLAYWRIGHT_ADAPTER_CONFIG). */
export function getAdapterConfigPath(): string {
  const raw = process.env.PLAYWRIGHT_ADAPTER_CONFIG?.trim();
  if (!raw) {
    return DEFAULT_ADAPTER_CONFIG_PATH;
  }
  return normalizeEnvPath(raw);
}

/** Required base.fixture import for adapter specs (override via PLAYWRIGHT_ADAPTER_FIXTURE_IMPORT). */
export function getAdapterFixtureImport(): string {
  const raw = process.env.PLAYWRIGHT_ADAPTER_FIXTURE_IMPORT?.trim();
  if (!raw) {
    return DEFAULT_ADAPTER_FIXTURE_IMPORT;
  }
  return raw;
}

/** JSON reporter output when adapter config is active (override via PLAYWRIGHT_ADAPTER_RESULTS_JSON). */
export function getAdapterJsonResultsPath(): string {
  const raw = process.env.PLAYWRIGHT_ADAPTER_RESULTS_JSON?.trim();
  if (!raw) {
    return DEFAULT_ADAPTER_RESULTS_JSON;
  }
  return normalizeEnvPath(raw);
}

function getConfigJsonOutputMap(): Record<string, string> {
  return {
    [DEFAULT_CONFIG_PATH]: DEFAULT_JSON_RESULTS,
    [getAdapterConfigPath()]: getAdapterJsonResultsPath(),
  };
}

/** JSON reporter output for Healer pre-flight (override via PLAYWRIGHT_RESULTS_JSON). */
export function getJsonResultsPath(): string {
  const override = process.env.PLAYWRIGHT_RESULTS_JSON?.trim();
  if (override) {
    return normalizeEnvPath(override);
  }
  const config = getPlaywrightConfigPath();
  return getConfigJsonOutputMap()[config] ?? DEFAULT_JSON_RESULTS;
}

/** Absolute path to the active Playwright config under repo root. */
export function resolvePlaywrightConfigAbsolute(repoRoot: string): string {
  return path.join(repoRoot, getPlaywrightConfigPath());
}

export function isUnderAllowedTestRoot(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const primary = getPlaywrightTestRoot();
  if (normalized === primary || normalized.startsWith(`${primary}/`)) {
    return true;
  }
  const adapterRoot = getAdapterTestRoot();
  if (normalized === adapterRoot || normalized.startsWith(`${adapterRoot}/`)) {
    return true;
  }
  return false;
}

/** Traceability-exempt directory prefix for adapter reference specs (includes trailing slash). */
export function getAdapterTraceabilityExemptPrefix(): string {
  return `${getAdapterTestRoot()}/`;
}

export function isAdapterSpecPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const adapterRoot = getAdapterTestRoot();
  return normalized === adapterRoot || normalized.startsWith(`${adapterRoot}/`);
}

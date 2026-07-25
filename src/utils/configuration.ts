/**
 * Central configuration hub for the Playwright AI Agent Framework.
 * This is the single source of truth for all framework constants and settings.
 *
 * @see Requirements 4.1–4.8, 13.2, 13.3
 */

// ---------------------------------------------------------------------------
// Test classification tags
// ---------------------------------------------------------------------------

export enum TAGS {
  SMOKE = '@smoke',
  REGRESSION = '@regression',
  API = '@api',
  UI = '@ui',
  E2E = '@e2e',
  AUTH = '@auth',
  LOGIN = '@login',
  SEED = '@seed',
  DEMO = '@demo',
  HEALER = '@healer',
  FLAKY = '@flaky',
}

// ---------------------------------------------------------------------------
// Environment configurations
// ---------------------------------------------------------------------------

export const ENVIRONMENTS = {
  local: 'http://localhost:3000',
  dev: 'https://dev.example.com',
  staging: 'https://staging.example.com',
  production: 'https://app.example.com',
} as const;

// ---------------------------------------------------------------------------
// Supported browsers
// ---------------------------------------------------------------------------

export const BROWSERS = ['chromium', 'firefox', 'webkit'] as const;

// ---------------------------------------------------------------------------
// Execution modes
// ---------------------------------------------------------------------------

export const RUN_MODES = {
  HEADLESS: 'headless',
  HEADED: 'headed',
  DEBUG: 'debug',
} as const;

// ---------------------------------------------------------------------------
// Custom MCP server port
// ---------------------------------------------------------------------------

function resolveMcpServerPort(): number {
  const raw = process.env.MCP_SERVER_PORT;
  if (raw === undefined) {
    return 3100;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    console.warn(`[WARN] Invalid MCP_SERVER_PORT='${raw}'. Falling back to 3100.`);
    return 3100;
  }

  return parsed;
}

export const MCP_SERVER_PORT = resolveMcpServerPort();

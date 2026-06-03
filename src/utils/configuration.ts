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
// JIRA integration constants
// Placeholder values are intentional — replace with your project-specific
// values as described in the README "Getting Started" section.
// ---------------------------------------------------------------------------

export const JIRA_CONSTANTS = {
  domain: 'https://your-company.atlassian.net',
  projectKey: 'YOUR_PROJECT',
  bugIssueTypeId: '10004',
  descriptionTemplate: '[E2E-FAIL] {title}\n\nFile: {file}\nError: {error}',
};

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

// ---------------------------------------------------------------------------
// Runtime validation — warn when JIRA constants still contain placeholders.
// This executes immediately at module load time so all consumers are notified.
// ---------------------------------------------------------------------------

const JIRA_PLACEHOLDER_PATTERNS = ['your-company', 'example'] as const;

export function isPlaceholderJiraDomain(domain: string): boolean {
  return JIRA_PLACEHOLDER_PATTERNS.some((pattern) => domain.includes(pattern));
}

export function warnIfPlaceholderJiraDomain(domain: string): boolean {
  if (!isPlaceholderJiraDomain(domain)) {
    return false;
  }

  console.warn(
    '[WARN] JIRA integration is using placeholder values. Update JIRA_CONSTANTS in src/utils/configuration.ts',
  );
  return true;
}

(function warnIfPlaceholder(): void {
  warnIfPlaceholderJiraDomain(JIRA_CONSTANTS.domain);
})();

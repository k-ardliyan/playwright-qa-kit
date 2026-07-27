import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getJsonResultsPath,
  getPlaywrightConfigPath,
  resolvePlaywrightConfigAbsolute,
} from '../utils/playwright-paths';
import { getRepoRoot } from '../utils/safety';

export interface HealthCheckItem {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message: string;
}

export interface HealthCheckOutput {
  status: 'success' | 'error';
  checks: HealthCheckItem[];
  message: string;
}

function checkNodeVersion(): HealthCheckItem {
  const version = process.versions.node;
  const [major, minor] = version.split('.').map(Number);
  const ok = major > 20 || (major === 20 && minor >= 19);
  if (ok) {
    return { name: 'node', status: 'ok', message: `Node.js ${version}` };
  }
  return {
    name: 'node',
    status: 'fail',
    message: `Node.js ${version} — requires >= 20.19.0`,
  };
}

function checkMcpBuild(): HealthCheckItem {
  const entry = path.join(getRepoRoot(), 'mcp-server', 'dist', 'index-mcp.js');
  if (fs.existsSync(entry)) {
    return { name: 'mcp_build', status: 'ok', message: 'playwright-qa MCP build present' };
  }
  return {
    name: 'mcp_build',
    status: 'fail',
    message: 'Missing mcp-server/dist/index-mcp.js — run: npm run mcp:build',
  };
}

function checkPlaywrightMcp(): HealthCheckItem {
  const pkg = path.join(getRepoRoot(), 'node_modules', '@playwright', 'mcp');
  if (fs.existsSync(pkg)) {
    return { name: 'playwright_mcp', status: 'ok', message: '@playwright/mcp installed' };
  }
  return {
    name: 'playwright_mcp',
    status: 'fail',
    message: 'Missing @playwright/mcp — run: npm install',
  };
}

function checkPlaywrightTest(): HealthCheckItem {
  const pkg = path.join(getRepoRoot(), 'node_modules', '@playwright', 'test');
  if (!fs.existsSync(pkg)) {
    return {
      name: 'playwright_test',
      status: 'fail',
      message: 'Missing @playwright/test — run: npm install',
    };
  }

  try {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf-8')) as {
      version?: string;
    };
    const version = pkgJson.version ?? 'unknown';
    const [major, minor] = version.split('.').map(Number);
    if (major > 1 || (major === 1 && minor >= 56)) {
      return {
        name: 'playwright_test',
        status: 'ok',
        message: `@playwright/test ${version} (supports run-test-mcp-server)`,
      };
    }
    return {
      name: 'playwright_test',
      status: 'warn',
      message: `@playwright/test ${version} — run-test-mcp-server needs >= 1.56`,
    };
  } catch {
    return { name: 'playwright_test', status: 'ok', message: '@playwright/test installed' };
  }
}

function checkEnvironmentFile(): HealthCheckItem {
  let appEnv = process.env.APP_ENV ?? 'local';
  let source = process.env.APP_ENV_SOURCE ?? 'unknown';
  try {
    // Prefer pre-load resolve when APP_ENV_SOURCE not yet stamped
    if (!process.env.APP_ENV_SOURCE) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { resolveAppEnv } = require(path.join(getRepoRoot(), 'src/utils/app-env')) as {
        resolveAppEnv: (o: { repoRoot: string }) => { appEnv: string; source: string };
      };
      const r = resolveAppEnv({ repoRoot: getRepoRoot() });
      appEnv = r.appEnv;
      source = r.source;
    }
  } catch {
    // keep process.env fallback
  }

  const candidates = [
    path.join(getRepoRoot(), 'environments', `${appEnv}.env`),
    path.join(getRepoRoot(), 'environments', `${appEnv}.env.example`),
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const kind = file.endsWith('.example') ? 'template' : 'credentials';
      return {
        name: 'environment',
        status: kind === 'template' ? 'warn' : 'ok',
        message: `Using environments/${path.basename(file)} (${kind}) for APP_ENV=${appEnv} (source=${source})`,
      };
    }
  }

  return {
    name: 'environment',
    status: 'fail',
    message: `No environments/${appEnv}.env or .env.example found (source=${source})`,
  };
}

function checkPlaywrightConfig(): HealthCheckItem {
  const configPath = getPlaywrightConfigPath();
  const absolute = resolvePlaywrightConfigAbsolute(getRepoRoot());

  if (fs.existsSync(absolute)) {
    return {
      name: 'playwright_config',
      status: 'ok',
      message: `PLAYWRIGHT_CONFIG=${configPath}`,
    };
  }

  return {
    name: 'playwright_config',
    status: 'fail',
    message: `PLAYWRIGHT_CONFIG=${configPath} — file not found at ${configPath}`,
  };
}

function checkBaseUrl(): HealthCheckItem {
  const baseUrl = process.env.BASE_URL;
  if (baseUrl && baseUrl.length > 0) {
    return { name: 'base_url', status: 'ok', message: `BASE_URL=${baseUrl}` };
  }
  return {
    name: 'base_url',
    status: 'warn',
    message: 'BASE_URL not set — Playwright config falls back to http://localhost:3000',
  };
}

function checkAuthChallengeMode(): HealthCheckItem {
  const mode = (process.env.AUTH_CHALLENGE_MODE ?? 'none').trim().toLowerCase() || 'none';
  const interactive = mode !== 'none' && mode !== '';
  const ci = (() => {
    const v = (process.env.CI ?? '').trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes';
  })();

  if (interactive && ci) {
    return {
      name: 'auth_challenge',
      status: 'fail',
      message:
        `AUTH_CHALLENGE_MODE=${mode} is interactive and forbidden under CI. ` +
        'Set AUTH_CHALLENGE_MODE=none for CI, or run auth:setup locally.',
    };
  }

  if (interactive) {
    // auto can fall back to otp-stdin under headless+TTY; only warn hard for browser-only modes
    const needsHeaded = mode === 'otp-browser' || mode === 'captcha-browser';
    const autoHeadless = mode === 'auto';
    const headless = (process.env.HEADLESS ?? 'true').trim().toLowerCase();
    const isHeadless = !(headless === 'false' || headless === '0' || headless === 'no');
    if (needsHeaded && isHeadless) {
      return {
        name: 'auth_challenge',
        status: 'warn',
        message:
          `AUTH_CHALLENGE_MODE=${mode} requires HEADLESS=false. ` +
          'Use npm run auth:setup:headed or set HEADLESS=false via env:edit.',
      };
    }
    if (autoHeadless && isHeadless) {
      return {
        name: 'auth_challenge',
        status: 'ok',
        message:
          `AUTH_CHALLENGE_MODE=auto with HEADLESS=true — OTP will use stdin if TTY available; ` +
          'prefer auth:setup:headed for browser-first OTP.',
      };
    }
    return {
      name: 'auth_challenge',
      status: 'ok',
      message: `AUTH_CHALLENGE_MODE=${mode} (local assisted — not for CI)`,
    };
  }

  return {
    name: 'auth_challenge',
    status: 'ok',
    message: 'AUTH_CHALLENGE_MODE=none',
  };
}

function checkJsonReporterOutput(): HealthCheckItem {
  const relativePath = getJsonResultsPath();
  const resultsJson = path.join(getRepoRoot(), relativePath);
  const overrideNote = process.env.PLAYWRIGHT_RESULTS_JSON?.trim()
    ? ' (PLAYWRIGHT_RESULTS_JSON override)'
    : '';

  if (fs.existsSync(resultsJson)) {
    return {
      name: 'json_results',
      status: 'ok',
      message: `${relativePath} exists (from last test run)${overrideNote}`,
    };
  }
  return {
    name: 'json_results',
    status: 'warn',
    message: `${relativePath} not found — run tests with PLAYWRIGHT_CONFIG=${getPlaywrightConfigPath()} to populate Healer input`,
  };
}

/** Soft check: file-content deps + fixture bank (local-first file capabilities). */
function checkFileContentCapability(): HealthCheckItem {
  const root = getRepoRoot();
  const missing: string[] = [];
  try {
    require.resolve('pdf-parse', { paths: [root, path.join(root, 'mcp-server')] });
  } catch {
    missing.push('pdf-parse');
  }
  try {
    require.resolve('exceljs', { paths: [root, path.join(root, 'mcp-server')] });
  } catch {
    missing.push('exceljs');
  }
  const fixtures = path.join(root, 'test-fixtures');
  if (!fs.existsSync(fixtures)) {
    missing.push('test-fixtures/');
  }
  if (missing.length > 0) {
    return {
      name: 'file_content',
      status: 'warn',
      message:
        `File capability incomplete (missing: ${missing.join(', ')}). ` +
        'Install pdf-parse/exceljs and ensure test-fixtures/ exists for @download/@upload/@file-content.',
    };
  }
  return {
    name: 'file_content',
    status: 'ok',
    message: 'pdf-parse + exceljs + test-fixtures/ available for file content asserts',
  };
}

/** Soft check: network-assert helpers + demo contract fixture. */
function checkNetworkAssertCapability(): HealthCheckItem {
  const root = getRepoRoot();
  const missing: string[] = [];
  const helper = path.join(root, 'src', 'support', 'pw', 'network-assert.ts');
  const core = path.join(root, 'src', 'support', 'pw', 'network-assert-core.ts');
  const contract = path.join(
    root,
    'test-fixtures',
    'network',
    'contracts',
    'demo',
    'submit-success.json',
  );
  if (!fs.existsSync(helper)) missing.push('src/support/pw/network-assert.ts');
  if (!fs.existsSync(core)) missing.push('src/support/pw/network-assert-core.ts');
  if (!fs.existsSync(contract)) {
    missing.push('test-fixtures/network/contracts/demo/submit-success.json');
  }
  if (missing.length > 0) {
    return {
      name: 'network_assert',
      status: 'warn',
      message:
        `Network-assert capability incomplete (missing: ${missing.join(', ')}). ` +
        'Restore network-assert helpers and demo contract for @network-assert.',
    };
  }
  return {
    name: 'network_assert',
    status: 'ok',
    message: 'network-assert helpers + demo contract available for live payload/response checks',
  };
}

function checkAuthStorageState(): HealthCheckItem {
  const root = getRepoRoot();
  let appEnv = 'local';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path.join(root, 'src/utils/app-env')) as {
      resolveAppEnv: (o: { repoRoot: string }) => { appEnv: string };
    };
    appEnv = mod.resolveAppEnv({ repoRoot: root }).appEnv;
  } catch {
    // keep default
  }

  const authDir = path.join(root, '.auth', appEnv);
  if (!fs.existsSync(authDir)) {
    return {
      name: 'auth_storage',
      status: 'warn',
      message: `.auth/${appEnv}/ not found — run: npm run auth:setup (required for authenticated tests)`,
    };
  }

  const stateFiles = fs.readdirSync(authDir).filter((f) => f.endsWith('.json'));
  if (stateFiles.length === 0) {
    return {
      name: 'auth_storage',
      status: 'warn',
      message: `.auth/${appEnv}/ is empty — run: npm run auth:setup to generate storage state files`,
    };
  }

  return {
    name: 'auth_storage',
    status: 'ok',
    message: `.auth/${appEnv}/ has ${stateFiles.length} storage state file(s): ${stateFiles.join(', ')}`,
  };
}

export function healthCheck(): HealthCheckOutput {
  const checks = [
    checkNodeVersion(),
    checkMcpBuild(),
    checkPlaywrightMcp(),
    checkPlaywrightTest(),
    checkEnvironmentFile(),
    checkPlaywrightConfig(),
    checkBaseUrl(),
    checkAuthChallengeMode(),
    checkAuthStorageState(),
    checkJsonReporterOutput(),
    checkFileContentCapability(),
    checkNetworkAssertCapability(),
  ];

  const hasFail = checks.some((c) => c.status === 'fail');
  const status = hasFail ? 'error' : 'success';
  const message = hasFail
    ? 'One or more health checks failed.'
    : 'All required health checks passed.';

  return { status, checks, message };
}

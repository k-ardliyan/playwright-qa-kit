import * as fs from 'node:fs';
import * as path from 'node:path';
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
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) {
    return { name: 'node', status: 'ok', message: `Node.js ${process.versions.node}` };
  }
  return {
    name: 'node',
    status: 'fail',
    message: `Node.js ${process.versions.node} — requires >= 20`,
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
  const appEnv = process.env.APP_ENV ?? 'local';
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
        message: `Using environments/${path.basename(file)} (${kind}) for APP_ENV=${appEnv}`,
      };
    }
  }

  return {
    name: 'environment',
    status: 'fail',
    message: `No environments/${appEnv}.env or .env.example found`,
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

function checkJsonReporterOutput(): HealthCheckItem {
  const resultsJson = path.join(getRepoRoot(), 'test-results', 'results.json');
  if (fs.existsSync(resultsJson)) {
    return {
      name: 'json_results',
      status: 'ok',
      message: 'test-results/results.json exists (from last test run)',
    };
  }
  return {
    name: 'json_results',
    status: 'warn',
    message: 'test-results/results.json not found — run tests to populate Healer input',
  };
}

export function healthCheck(): HealthCheckOutput {
  const checks = [
    checkNodeVersion(),
    checkMcpBuild(),
    checkPlaywrightMcp(),
    checkPlaywrightTest(),
    checkEnvironmentFile(),
    checkBaseUrl(),
    checkJsonReporterOutput(),
  ];

  const hasFail = checks.some((c) => c.status === 'fail');
  const status = hasFail ? 'error' : 'success';
  const message = hasFail
    ? 'One or more health checks failed.'
    : 'All required health checks passed.';

  return { status, checks, message };
}

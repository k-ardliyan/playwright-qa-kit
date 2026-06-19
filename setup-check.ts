/// <reference types="node" />

import path from 'node:path';
import fs from 'node:fs';

const CHECKS: Array<{ label: string; path: string; hint: string }> = [
  {
    label: '.mcp.json (project MCP config)',
    path: '.mcp.json',
    hint: 'ensure .mcp.json exists at the project root for Claude/Codex MCP detection',
  },
  {
    label: '@playwright/mcp',
    path: path.join('node_modules', '@playwright', 'mcp'),
    hint: 'npm install @playwright/mcp',
  },
  {
    label: '@playwright/test',
    path: path.join('node_modules', '@playwright', 'test'),
    hint: 'npm install',
  },
  {
    label: 'playwright-qa MCP build',
    path: path.join('mcp-server', 'dist', 'index-mcp.js'),
    hint: 'npm run mcp:build',
  },
  {
    label: 'requirements template',
    path: path.join('requirements', '_TEMPLATE.md'),
    hint: 'restore requirements/_TEMPLATE.md from repo',
  },
  {
    label: 'Orchestrator agent (AGENTS.md)',
    path: 'AGENTS.md',
    hint: 'restore root AGENTS.md from repo',
  },
  {
    label: 'project fixture seam',
    path: path.join('src', 'fixtures', 'project.fixture.ts'),
    hint: 'restore src/fixtures/project.fixture.ts from repo',
  },
  {
    label: 'QA guide',
    path: path.join('docs', 'GUIDE.md'),
    hint: 'restore docs/GUIDE.md from repo',
  },
];

function checkPlaywrightTestVersion(): void {
  const pkgPath = path.join(process.cwd(), 'node_modules', '@playwright', 'test', 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return;
  }

  const version = (JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string }).version;
  if (!version) {
    return;
  }

  const [major, minor] = version.split('.').map(Number);
  if (major < 1 || (major === 1 && minor < 56)) {
    process.stderr.write(
      `WARN: @playwright/test ${version} — playwright-test MCP needs >= 1.56. Run: npm install @playwright/test@latest\n`,
    );
  }
}

function checkEnvironmentFile(): void {
  const appEnv = process.env.APP_ENV ?? 'local';
  const primary = path.join('environments', `${appEnv}.env`);
  const fallback = path.join('environments', `${appEnv}.env.example`);

  if (fs.existsSync(primary) || fs.existsSync(fallback)) {
    return;
  }

  process.stderr.write(
    `WARN: No environments/${appEnv}.env or .env.example — copy from environments/local.env.example\n`,
  );
}

function checkOptionalWorkspaceMcpConfig(): void {
  const workspaceConfig = path.join(process.cwd(), '.vscode', 'mcp.json');
  if (!fs.existsSync(workspaceConfig)) {
    process.stderr.write(
      'WARN: .vscode/mcp.json not found — OK if your tooling reads project MCP config from .mcp.json\n',
    );
  }
}

function main(): void {
  let failed = false;

  for (const check of CHECKS) {
    const absolute = path.resolve(process.cwd(), check.path);
    if (!fs.existsSync(absolute)) {
      process.stderr.write(`ERROR: Missing ${check.label}. Run: ${check.hint}\n`);
      failed = true;
    }
  }

  checkPlaywrightTestVersion();
  checkEnvironmentFile();
  checkOptionalWorkspaceMcpConfig();

  if (failed) {
    process.exit(1);
  }
}

main();

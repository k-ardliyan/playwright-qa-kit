/// <reference types="node" />

import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import os from 'node:os';

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
    process.stderr.write('WARN: Could not read version of @playwright/test\n');
    return;
  }

  const [major, minor] = version.split('.').map(Number);
  if (major < 1 || (major === 1 && minor < 56)) {
    process.stderr.write(
      `WARN: @playwright/test ${version} — playwright-test MCP needs >= 1.56. Run: npm install @playwright/test@latest\n`,
    );
  } else {
    process.stdout.write(`✓ @playwright/test version (${version}) - OK (>= 1.56)\n`);
  }
}

function checkEnvironmentFile(): void {
  const appEnv = process.env.APP_ENV ?? 'local';
  const primary = path.join('environments', `${appEnv}.env`);
  const fallback = path.join('environments', `${appEnv}.env.example`);

  if (fs.existsSync(primary)) {
    process.stdout.write(`✓ Environment file (environments/${appEnv}.env) - OK\n`);
    return;
  }
  if (fs.existsSync(fallback)) {
    process.stdout.write(`✓ Fallback environment file (environments/${appEnv}.env.example) - OK\n`);
    return;
  }

  process.stderr.write(
    `WARN: No environments/${appEnv}.env or .env.example — copy from environments/local.env.example\n`,
  );
}

function checkOptionalWorkspaceMcpConfig(): void {
  const workspaceConfig = path.join(process.cwd(), '.vscode', 'mcp.json');
  if (!fs.existsSync(workspaceConfig)) {
    process.stdout.write(
      'info: .vscode/mcp.json not found — OK if your tooling reads project MCP config from .mcp.json\n',
    );
  } else {
    process.stdout.write('✓ .vscode/mcp.json (workspace MCP config) - OK\n');
  }
}

function migrateKeysToSecureFolder(): void {
  const cwd = process.cwd();
  const localKeysPath = path.resolve(cwd, 'environments/.env.keys');

  // Dynamically get project name from package.json
  const pkgPath = path.resolve(cwd, 'package.json');
  let projectName = 'playwright-qa-kit';
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
      if (pkg.name) {
        projectName = pkg.name;
      }
    } catch {
      // ignore
    }
  }

  const globalKeysDir = path.resolve(os.homedir(), '.dotenvx-keys', projectName);
  const globalKeysPath = path.resolve(globalKeysDir, '.env.keys');

  if (fs.existsSync(localKeysPath)) {
    try {
      if (!fs.existsSync(globalKeysDir)) {
        fs.mkdirSync(globalKeysDir, { recursive: true });
      }
      fs.copyFileSync(localKeysPath, globalKeysPath);
      fs.unlinkSync(localKeysPath);
      process.stdout.write(`✓ Secured and moved keys to: ${globalKeysPath}\n`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`WARN: Failed to secure keys: ${errMsg}\n`);
    }
  }
}

function autoEncryptEnvFiles(): void {
  const envsDir = path.resolve(process.cwd(), 'environments');
  if (!fs.existsSync(envsDir)) {
    return;
  }

  const files = fs.readdirSync(envsDir);
  const envFiles = files.filter(
    (f) => f.endsWith('.env') && !f.endsWith('.env.example') && !f.endsWith('.env.keys'),
  );

  if (envFiles.length === 0) {
    return;
  }

  process.stdout.write('Securing and verifying environment file encryption...\n');
  for (const file of envFiles) {
    const filePath = path.join('environments', file);
    try {
      execSync(`npx @dotenvx/dotenvx encrypt -f "${filePath}"`, { stdio: 'pipe' });
      process.stdout.write(`✓ ${filePath} - Encrypted & Secured\n`);
      migrateKeysToSecureFolder();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`WARN: Failed to encrypt ${filePath}: ${errMsg}\n`);
    }
  }
  process.stdout.write('\n');
}

function main(): void {
  let failed = false;

  process.stdout.write('Running setup checks...\n\n');

  // Auto-encrypt any plaintext secrets edited by users/QA before running checks
  autoEncryptEnvFiles();

  for (const check of CHECKS) {
    const absolute = path.resolve(process.cwd(), check.path);
    if (!fs.existsSync(absolute)) {
      process.stderr.write(`✗ ERROR: Missing ${check.label}. Run: ${check.hint}\n`);
      failed = true;
    } else {
      process.stdout.write(`✓ ${check.label} - OK\n`);
    }
  }

  checkPlaywrightTestVersion();
  checkEnvironmentFile();
  checkOptionalWorkspaceMcpConfig();

  process.stdout.write('\n');
  if (failed) {
    process.stdout.write('❌ Setup check failed. Please resolve the errors above.\n');
    process.exit(1);
  } else {
    process.stdout.write('🎉 All essential checks passed successfully!\n');
  }
}

main();

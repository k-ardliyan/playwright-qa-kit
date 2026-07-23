/// <reference types="node" />

/**
 * QA Runner — single-command happy path untuk QA non-coder pemula.
 *
 * Usage:
 *   npm run qa:run -- requirements/login.md
 *   npm run qa:run -- requirements/login.md --dry-run
 *   npm run qa:run -- requirements/login.md --skip-tests
 *   npm run qa:run -- requirements/login.md --no-confirm
 *
 * Steps:
 *   1. Parse args + show usage
 *   2. Pre-flight: env file exist, BASE_URL set, mcp build ada
 *   3. Validate requirement (via existing validate-requirement tool)
 *   4. Print ready-to-paste agent prompt
 *   5. Optional: run smoke test scoped to seed
 *   6. Print report paths
 *
 * Exit codes: see scripts/exit-codes.ts
 *
 * @module scripts/qa-run
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { EXIT, type ExitCode } from './exit-codes';
import {
  friendly,
  printError,
  printInfo,
  printOk,
  printStep,
  printWarn,
  withFriendlyErrors,
} from './format-error';

const REPO_MARKER = 'mcp-server';
const MAX_HOPS = 12;

function findRepoRoot(start: string): string {
  let dir = path.resolve(start);
  for (let i = 0; i < MAX_HOPS; i++) {
    if (fs.existsSync(path.join(dir, REPO_MARKER))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface QAArgs {
  requirementPath: string | null;
  skipTests: boolean;
  skipPrompt: boolean;
  dryRun: boolean;
  noConfirm: boolean;
  help: boolean;
  smoke: boolean;
  openDashboard: boolean;
}

interface PreFlightResult {
  ok: boolean;
  issues: string[];
}

interface ValidationResult {
  ok: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

// ─── Dashboard opener ──────────────────────────────────────────────────────

/**
 * Open reports/custom-dashboard.html with the OS default browser.
 * No-op (with message) if the file doesn't exist or platform unsupported.
 * Spawn detached so we never block qa:run's exit.
 */
function openCustomDashboard(repoRoot: string): void {
  const dashboardAbs = path.join(repoRoot, 'reports', 'custom-dashboard.html');
  if (!fs.existsSync(dashboardAbs)) {
    process.stdout.write(
      `  ⓘ Dashboard belum ada di ${path.relative(repoRoot, dashboardAbs)}. Jalankan pipeline dulu.\n`,
    );
    return;
  }

  const platform = process.platform;
  const url = dashboardAbs.replace(/\\/g, '/');
  // Use `file:///` so default browser handler picks it up cross-platform.
  const fileUrl = url.startsWith('/') ? `file://${url}` : `file:///${url}`;

  let cmd: string;
  if (platform === 'win32') {
    // `start "" "<file>"` — empty quoted title required by `start`.
    cmd = `start "" "${fileUrl}"`;
  } else if (platform === 'darwin') {
    cmd = `open "${fileUrl}"`;
  } else {
    // Linux / WSL
    cmd = `xdg-open "${fileUrl}"`;
  }

  try {
    const child = spawnSync(cmd, {
      shell: true,
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    });
    if (child.status === 0) {
      process.stdout.write(`  ✓ Dashboard dibuka: ${path.relative(repoRoot, dashboardAbs)}\n`);
    } else {
      process.stdout.write(`  ⚠ Tidak bisa buka dashboard otomatis. Jalankan manual:\n`);
      process.stdout.write(
        `    ${platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open'} ${path.relative(repoRoot, dashboardAbs)}\n`,
      );
    }
  } catch {
    process.stdout.write(`  ⚠ Gagal spawn browser opener. Buka manual:\n`);
    process.stdout.write(`    ${path.relative(repoRoot, dashboardAbs)}\n`);
  }
}

// ─── Argv Parser ──────────────────────────────────────────────────────────────

const USAGE = `
Usage:
  npm run qa:run -- <requirements/feature.md> [options]

Fungsi: Preflight + validasi requirement + cetak prompt Hermes.
Pipeline penuh (Plan → Generate → Execute → Heal → Report) dijalankan
di Hermes Agent setelah user paste prompt, BUKAN di qa:run.

Options:
  --skip-prompt    Skip cetak prompt (cuma validate + preflight)
  --smoke          (Opsional) Jalankan smoke test setelah cetak prompt
  --dry-run        Validate only, exit 0 tanpa side-effect lain
  --no-confirm     Skip konfirmasi interaktif sebelum --smoke
  --open-dashboard Setelah cetak prompt, buka reports/custom-dashboard.html
                   otomatis di browser default (default: ON jika file ada).
                   Pakai --no-open-dashboard untuk skip.
  -h, --help       Tampilkan pesan ini

Examples:
  npm run qa:run -- requirements/login.md
  npm run qa:run -- requirements/login.md --dry-run
  npm run qa:run -- requirements/login.md --smoke
  npm run qa:run -- requirements/login.md --no-open-dashboard
`;

function parseArgs(argv: string[]): QAArgs {
  const args: QAArgs = {
    requirementPath: null,
    skipTests: false,
    skipPrompt: false,
    dryRun: false,
    noConfirm: false,
    help: false,
    smoke: false,
    openDashboard: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--skip-tests') args.skipTests = true;
    else if (arg === '--skip-prompt') args.skipPrompt = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-confirm') args.noConfirm = true;
    else if (arg === '--smoke') args.smoke = true;
    else if (arg === '--open-dashboard') args.openDashboard = true;
    else if (arg === '--no-open-dashboard') args.openDashboard = false;
    else if (arg === '-h' || arg === '--help') args.help = true;
    else if (!arg.startsWith('--') && !args.requirementPath) {
      args.requirementPath = arg;
    }
  }

  return args;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function showHelp(): void {
  process.stdout.write(USAGE);
  process.stdout.write(
    '\nExit codes: lihat scripts/exit-codes.ts (OK=0, USAGE=3, FIXABLE=1, ESCALATE=2).\n',
  );
}

function preflight(repoRoot: string): PreFlightResult {
  const issues: string[] = [];

  // Check environment file
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resolveAppEnv } = require('../src/utils/app-env') as {
    resolveAppEnv: (o: { repoRoot: string }) => { appEnv: string };
  };
  const appEnv = resolveAppEnv({ repoRoot }).appEnv;
  const envPath = path.join(repoRoot, 'environments', `${appEnv}.env`);
  const envExamplePath = path.join(repoRoot, 'environments', `${appEnv}.env.example`);

  if (!fs.existsSync(envPath) && !fs.existsSync(envExamplePath)) {
    issues.push(
      `Environment file tidak ada. Buat: cp environments/local.env.example environments/${appEnv}.env  (atau: npm run env:use -- ${appEnv} --init)`,
    );
  }

  // Check MCP build
  const mcpBuildPath = path.join(repoRoot, 'mcp-server', 'dist', 'index-mcp.js');
  if (!fs.existsSync(mcpBuildPath)) {
    issues.push('MCP server belum di-build. Jalankan: npm run mcp:build');
  }

  // Check BASE_URL (read env or example)
  const targetEnv = fs.existsSync(envPath)
    ? envPath
    : fs.existsSync(envExamplePath)
      ? envExamplePath
      : null;
  if (targetEnv) {
    const content = fs.readFileSync(targetEnv, 'utf-8');
    if (!/^BASE_URL\s*=\s*\S+/m.test(content)) {
      issues.push(
        `BASE_URL belum di-set di ${path.relative(repoRoot, targetEnv)}. Set: BASE_URL=https://app-anda.com`,
      );
    }
  }

  return { ok: issues.length === 0, issues };
}

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function validateRequirementFile(repoRoot: string, relPath: string): ValidationResult {
  // Spawn validate-requirement.ts via tsx — reuse existing logic.
  // Output diparse dari stdout/stderr sederhana.
  const cliPath = path.join(repoRoot, 'validate-requirement.ts');
  const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

  if (!fs.existsSync(cliPath)) {
    throw friendly({
      title: 'validate-requirement.ts tidak ditemukan',
      detail: `Expected at: ${cliPath}`,
      hint: 'Pastikan Anda menjalankan dari repo root dan file belum terhapus.',
      exitCode: EXIT.ESCALATE,
    });
  }

  const result = spawnSync(tsxBin, [cliPath, relPath], {
    cwd: repoRoot,
    encoding: 'utf-8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const rawStdout = result.stdout ?? '';
  const rawStderr = result.stderr ?? '';
  const exitCode = result.status ?? 1;

  // Strip ANSI color codes before parsing
  const stdout = stripAnsi(rawStdout);
  const stderr = stripAnsi(rawStderr);

  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Parse output lines
  const allLines = (stdout + '\n' + stderr).split('\n');
  for (const line of allLines) {
    const trimmed = line.trim();
    // ✗ → error
    if (/^✗|^❌/.test(trimmed)) {
      errors.push(trimmed.replace(/^✗\s*|^❌\s*/, '').trim());
    }
    // ⚠ → warning
    else if (/^⚠/.test(trimmed)) {
      warnings.push(trimmed.replace(/^⚠\s*/, '').trim());
    }
    // Score: X/100 (multiple times → ambil yang terakhir = final)
    const scoreMatch = trimmed.match(/Score:\s*(\d+)\/100/);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    }
    // Detect "All requirement checks passed" sebagai success marker
    if (/All requirement checks passed/.test(trimmed)) {
      // success confirmed — keep exitCode check
    }
  }

  // Override ok jika ada success marker tapi exit non-zero (false positive)
  const hasSuccessMarker = /All requirement checks passed/.test(stdout);
  const finalOk = (exitCode === 0 && hasSuccessMarker) || (exitCode === 0 && errors.length === 0);

  return {
    ok: finalOk,
    score,
    errors,
    warnings,
  };
}

function buildAgentPrompt(reqRelPath: string): string {
  return (
    `Run full pipeline in automatic mode for ${reqRelPath} (orchestrator: AGENTS.md).\n` +
    `If this is requirements/login.md (wizard-generated REAL site requirement):\n` +
    `  BEFORE Plan/Generate, call snapshot_page on the real BASE_URL+login path;\n` +
    `  use selector-catalog locators (Path A, no POM); live-verify — every website differs.\n` +
    `Sample files under requirements/sample-*.md are format demos only.\n` +
    `Resume from last checkpoint if reports/pipeline-state.json exists.\n` +
    `Pipeline: Plan → Generate → Execute → Heal (max 3 cycles) → Report → archive_report.\n` +
    `Return summary, unresolvedFailures, catalog path (if any), and dashboard/report path.\n`
  );
}

function runSmokeTests(repoRoot: string): { ok: boolean; summary: string } {
  printInfo('Menjalankan smoke test...');
  const result = spawnSync('npm', ['run', 'test:smoke'], {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  const exitCode: ExitCode = result.status === 0 ? EXIT.OK : EXIT.FIXABLE;
  void exitCode;
  return {
    ok: result.status === 0,
    summary: result.stdout?.slice(-500) ?? result.stderr?.slice(-500) ?? '',
  };
}

function askConfirm(question: string): boolean {
  // Read dari stdin — untuk CI pass --no-confirm
  if (!process.stdin.isTTY) return true;
  process.stdout.write(`${question} [y/N]: `);
  const buf = fs.readFileSync(0, { encoding: 'utf-8' });
  return /^y(es)?$/i.test(buf.trim());
}

async function main(): Promise<void> {
  await withFriendlyErrors(async () => {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
      showHelp();
      process.exit(EXIT.OK);
    }

    if (!args.requirementPath) {
      throw friendly({
        title: 'Argument requirement file tidak ada',
        detail: 'Usage: npm run qa:run -- requirements/feature.md',
        hint: 'Tambahkan path file requirement setelah --. Lihat contoh: npm run qa:run -- --help',
        exitCode: EXIT.USAGE,
      });
    }

    // Anchor ke repo root
    const repoRoot = findRepoRoot(__dirname);
    const resolvedReq = path.resolve(repoRoot, args.requirementPath);
    if (!fs.existsSync(resolvedReq)) {
      throw friendly({
        title: `File requirement tidak ditemukan: ${args.requirementPath}`,
        detail: `Resolved: ${resolvedReq}`,
        hint: 'Buat dulu dari template: cp requirements/_TEMPLATE.md ' + args.requirementPath,
        exitCode: EXIT.USAGE,
      });
    }
    const relReq = path.relative(repoRoot, resolvedReq).replace(/\\/g, '/');

    // Banner
    process.stdout.write('╔══════════════════════════════════════════════════════════════╗\n');
    process.stdout.write('║  Preflight + Agent Prompt Helper                            ║\n');
    process.stdout.write('║  Pipeline penuh dijalankan di Hermes Agent — bukan di sini  ║\n');
    process.stdout.write('╚══════════════════════════════════════════════════════════════╝\n');
    process.stdout.write(`\n📄 Requirement: ${relReq}\n\n`);

    // Step 1/3: Pre-flight
    printStep(1, 3, 'Pre-flight setup check');
    const pre = preflight(repoRoot);
    if (!pre.ok) {
      process.stderr.write('\n');
      printError({
        title: 'Pre-flight gagal',
        detail: pre.issues.map((i) => `• ${i}`).join('\n'),
        hint: 'Perbaiki semua issue di atas lalu coba lagi.',
        docsLink: 'docs/POST-PIPELINE.md',
        exitCode: EXIT.FIXABLE,
      });
      process.exit(EXIT.FIXABLE);
    }
    printOk(`Setup lengkap (env=${process.env.APP_ENV ?? 'local'})`);

    // Step 2/3: Validate requirement
    printStep(2, 3, 'Validate requirement');
    const val = validateRequirementFile(repoRoot, relReq);
    if (!val.ok) {
      process.stderr.write('\n');
      for (const err of val.errors.slice(0, 10)) {
        printError({
          title: 'Validation error',
          detail: err,
          hint: 'Perbaiki file requirement lalu jalankan ulang.',
          exitCode: EXIT.FIXABLE,
        });
      }
      if (val.errors.length > 10) {
        printWarn(`+${val.errors.length - 10} error lainnya (lihat output validate)`);
      }
      process.stderr.write(`\n❌ Score: ${val.score}/100\n`);
      process.exit(EXIT.FIXABLE);
    }
    printOk(`Requirement valid (score ${val.score}/100)`);
    for (const w of val.warnings.slice(0, 5)) {
      printWarn(w);
    }

    if (args.dryRun) {
      printStep(3, 3, 'Dry-run');
      printOk('Dry-run selesai. Tidak ada side-effect.');
      process.exit(EXIT.OK);
    }

    // Step 3/3: Print Hermes prompt
    if (!args.skipPrompt) {
      printStep(3, 3, 'Hermes prompt siap copy-paste');
      process.stdout.write('\n📋 Paste prompt di bawah ke Hermes Agent:\n');
      process.stdout.write('─'.repeat(64) + '\n');
      process.stdout.write(buildAgentPrompt(relReq));
      process.stdout.write('─'.repeat(64) + '\n\n');
      printInfo(
        'Setelah Hermes menjalankan pipeline, hasilnya ada di reports/pipeline-report-*.md dan reports/custom-dashboard.html.',
      );
    } else {
      printStep(3, 3, 'Prompt (skipped)');
      printInfo('Prompt di-skip. Jalankan pipeline manual via Hermes.');
    }

    // Auto-open dashboard (default ON, no prompt)
    if (args.openDashboard) {
      openCustomDashboard(repoRoot);
    }

    // Optional smoke test, opt-in via --smoke
    if (!args.smoke) {
      process.exit(EXIT.OK);
    }

    if (!args.noConfirm) {
      const proceed = askConfirm('Jalankan smoke test sekarang?');
      if (!proceed) {
        printInfo('Smoke test di-skip.');
        process.exit(EXIT.OK);
      }
    }

    const run = runSmokeTests(repoRoot);
    if (!run.ok) {
      printError({
        title: 'Smoke test gagal',
        detail: run.summary.slice(0, 500),
        hint: 'Lihat: npx playwright show-report',
        exitCode: EXIT.FIXABLE,
      });
      process.exit(EXIT.FIXABLE);
    }
    printOk('Smoke test lulus');
    process.exit(EXIT.OK);
  });
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(EXIT.ESCALATE);
});

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

// ─── Argv Parser ──────────────────────────────────────────────────────────────

const USAGE = `
Usage:
  npm run qa:run -- <requirements/feature.md> [options]

Options:
  --skip-tests     Validate + print prompt only, jangan jalankan test
  --skip-prompt    Print validation only, jangan print prompt
  --dry-run        Validate only, exit 0 tanpa side-effect lain
  --no-confirm     Skip interactive confirmation sebelum run tests
  -h, --help       Tampilkan pesan ini

Examples:
  npm run qa:run -- requirements/login.md
  npm run qa:run -- requirements/login.md --dry-run
  npm run qa:run -- requirements/login.md --skip-tests
`;

function parseArgs(argv: string[]): QAArgs {
  const args: QAArgs = {
    requirementPath: null,
    skipTests: false,
    skipPrompt: false,
    dryRun: false,
    noConfirm: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--skip-tests') args.skipTests = true;
    else if (arg === '--skip-prompt') args.skipPrompt = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-confirm') args.noConfirm = true;
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
  process.stdout.write('\n');
  process.stdout.write('Exit codes: docs/EXIT-CODES.md\n');
}

function preflight(repoRoot: string): PreFlightResult {
  const issues: string[] = [];

  // Check environment file
  const appEnv = process.env.APP_ENV ?? 'local';
  const envPath = path.join(repoRoot, 'environments', `${appEnv}.env`);
  const envExamplePath = path.join(repoRoot, 'environments', `${appEnv}.env.example`);

  if (!fs.existsSync(envPath) && !fs.existsSync(envExamplePath)) {
    issues.push(
      `Environment file tidak ada. Buat: cp environments/local.env.example environments/${appEnv}.env`,
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
  return `Jalankan pipeline lengkap untuk ${reqRelPath} sesuai kontrak AGENTS.md:

1. Pre-flight dan validasi requirement; berhenti jika ada error.
2. Buat test plan di specs/<filename>-test-plan.md.
3. Generate spec Playwright di src/tests/ memakai @/fixtures/base.fixture.
4. Validasi generated tests sebelum eksekusi.
5. Jalankan tests lewat playwright-test.
6. Jika gagal (<=10), ambil failure dari JSON hasil run aktif, heal, validasi ulang, lalu re-run scoped.
7. Ambil summary akhir dan return unresolved failures jika ada.

Untuk situs publik, boleh gunakan discover_pages/snapshot_page agar selector-catalog bisa dipakai ulang.
Ikuti format requirement di requirements/_TEMPLATE.md.`;
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

function reportPaths(repoRoot: string): string[] {
  const candidates = [
    path.join(repoRoot, 'reports', 'custom-dashboard.html'),
    path.join(repoRoot, 'reports', 'test-summary.json'),
    path.join(repoRoot, 'playwright-report', 'index.html'),
  ];
  return candidates.filter((p) => fs.existsSync(p));
}

function askConfirm(question: string): boolean {
  // Read dari stdin — untuk CI pass --no-confirm
  if (!process.stdin.isTTY) return true;
  process.stdout.write(`${question} [y/N]: `);
  const buf = fs.readFileSync(0, { encoding: 'utf-8' });
  return /^y(es)?$/i.test(buf.trim());
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
        docsLink: 'docs/writing-requirements.md',
        exitCode: EXIT.USAGE,
      });
    }
    const relReq = path.relative(repoRoot, resolvedReq).replace(/\\/g, '/');

    // Banner
    process.stdout.write('╔════════════════════════════════════════════════╗\n');
    process.stdout.write('║  Playwright QA Kit — Single-Command Runner     ║\n');
    process.stdout.write('╚════════════════════════════════════════════════╝\n');
    process.stdout.write(`\n📄 Requirement: ${relReq}\n\n`);

    // Step 1/4: Pre-flight
    printStep(1, 4, 'Pre-flight setup check');
    const pre = preflight(repoRoot);
    if (!pre.ok) {
      process.stderr.write('\n');
      printError({
        title: 'Pre-flight gagal',
        detail: pre.issues.map((i) => `• ${i}`).join('\n'),
        hint: 'Perbaiki semua issue di atas lalu coba lagi.',
        docsLink: 'docs/GUIDE.md#setup-lokal',
        exitCode: EXIT.FIXABLE,
      });
      process.exit(EXIT.FIXABLE);
    }
    printOk(`Setup lengkap (env=${process.env.APP_ENV ?? 'local'})`);

    // Step 2/4: Validate requirement
    printStep(2, 4, 'Validate requirement');
    const val = validateRequirementFile(repoRoot, relReq);
    if (!val.ok) {
      process.stderr.write('\n');
      for (const err of val.errors.slice(0, 10)) {
        printError({
          title: 'Validation error',
          detail: err,
          docsLink: 'docs/GUIDE.md#troubleshooting-validate-requirement',
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
      printStep(3, 4, 'Dry-run');
      printOk('Dry-run selesai. Tidak ada side-effect.');
      process.exit(EXIT.OK);
    }

    // Step 3/4: Print prompt
    if (!args.skipPrompt) {
      printStep(3, 4, 'Agent prompt siap copy-paste');
      process.stdout.write('\n📋 Copy prompt di bawah ke AI agent (Codex / Claude / Cursor):\n');
      process.stdout.write('─'.repeat(60) + '\n');
      process.stdout.write(buildAgentPrompt(relReq) + '\n');
      process.stdout.write('─'.repeat(60) + '\n');
      process.stdout.write('\n');
    } else {
      printStep(3, 4, 'Agent prompt (skipped)');
      printInfo('Prompt di-skip. Jalankan manual via IDE.');
    }

    // Step 4/4: Optional smoke test
    if (args.skipTests) {
      printStep(4, 4, 'Tests (skipped)');
      printInfo('Test di-skip. Jalankan manual: npm test atau npm run test:smoke');
      process.exit(EXIT.OK);
    }

    printStep(4, 4, 'Optional smoke test');
    if (!args.noConfirm) {
      const proceed = askConfirm('Jalankan smoke test sekarang?');
      if (!proceed) {
        printInfo('Smoke test di-skip. Jalankan manual nanti: npm test');
        process.exit(EXIT.OK);
      }
    }

    const run = runSmokeTests(repoRoot);
    if (!run.ok) {
      printError({
        title: 'Smoke test gagal',
        detail: run.summary.slice(0, 500),
        hint: 'Lihat report detail di bawah atau jalankan: npx playwright show-report',
        docsLink: 'docs/GUIDE.md#cara-membaca-hasil-test',
        exitCode: EXIT.FIXABLE,
      });
      process.exit(EXIT.FIXABLE);
    }
    printOk('Smoke test lulus');

    // Done — print report paths
    process.stdout.write('\n');
    printOk('Pipeline qa:run selesai!');
    const reports = reportPaths(repoRoot);
    if (reports.length > 0) {
      process.stdout.write('\n📊 Buka report:\n');
      for (const r of reports) {
        process.stdout.write(`   ${path.relative(repoRoot, r)}\n`);
      }
    } else {
      printInfo('Belum ada report di-generate. Jalankan: npm test lalu cek reports/');
    }
    process.exit(EXIT.OK);
  });
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(EXIT.ESCALATE);
});

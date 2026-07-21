/// <reference types="node" />
/**
 * env-edit — Day-2 credential manager for Playwright QA Kit
 *
 * Usage:
 *   npm run env:edit
 *   npm run env:edit -- --list
 *   npm run env:edit -- --env local
 *   npm run env:edit -- --help
 *
 * Decrypts environments/{APP_ENV}.env via dotenvx private keys,
 * lets QA list/edit/add/remove role credentials, then re-encrypts.
 *
 * @module scripts/env-edit
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import prompts from 'prompts';
import { printOk, printWarn, printError, printInfo } from './format-error';
import { EXIT } from './exit-codes';
import { writeAuthSetup } from './wizard-auth-template';
import {
  isValidRoleName,
  roleCredentialKeys,
  parseRolesFromEnvMap,
  maskSecret,
  upsertEnvContent,
  removeEnvKeys,
  parseEnvText,
  isEncryptedEnvText,
} from './env-edit-lib';
import { getGlobalKeysPath, migrateWorkspaceEnvKeys } from '../src/utils/dotenv-keys';

const ROOT = process.cwd();
const ENV_DIR = path.join(ROOT, 'environments');
const AUTH_SETUP_OUT = path.join(ROOT, 'src', 'support', 'auth.setup.ts');

// ─── CLI flags ─────────────────────────────────────────────────────────────

interface CliFlags {
  envName: string;
  listOnly: boolean;
  help: boolean;
}

function parseFlags(): CliFlags {
  const args = process.argv.slice(2);
  const flags: CliFlags = {
    envName: process.env.APP_ENV?.trim() || 'local',
    listOnly: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--list' || arg === '-l') {
      flags.listOnly = true;
    } else if (arg === '--env') {
      const next = args[i + 1];
      if (!next || next.startsWith('-')) {
        process.stdout.write(
          '\n  ⚠️  --env butuh nama environment (local|dev|staging|production)\n\n',
        );
        process.exit(EXIT.USAGE);
      }
      flags.envName = next;
      i++;
    } else if (arg.startsWith('--env=')) {
      flags.envName = arg.split('=')[1] || flags.envName;
    } else {
      process.stdout.write(`\n  ⚠️  Unknown flag: ${arg}\n`);
      process.stdout.write('  Run with --help untuk lihat opsi.\n\n');
      process.exit(EXIT.USAGE);
    }
  }
  return flags;
}

function printHelp(): void {
  process.stdout.write(`
  env:edit — Kelola kredensial test (day-2)

  Usage:
    npm run env:edit                       # menu interaktif
    npm run env:edit -- --list             # tampilkan keys (masked)
    npm run env:edit -- --env local        # pilih environments/{name}.env
    npm run env:edit -- --help             # bantuan ini

  Flow umum:
    1. Ganti password / email role  → menu "Edit kredensial role"
    2. Tambah role baru             → menu "Tambah role"
    3. Hapus role                   → menu "Hapus role"
    4. Refresh session login        → npx playwright test src/support/auth.setup.ts --project=setup

  Docs: docs/CREDENTIALS.md

`);
}

// ─── Project / keys helpers ────────────────────────────────────────────────

function resolveKeysPath(): string | null {
  // Merge-migrate any workspace keys first, then return global path if present
  try {
    migrateWorkspaceEnvKeys(ROOT);
  } catch {
    // non-fatal
  }
  const globalPath = getGlobalKeysPath(ROOT);
  if (fs.existsSync(globalPath)) return globalPath;
  // fall back to workspace candidates if global not created yet
  const candidates = [path.join(ENV_DIR, '.env.keys'), path.join(ROOT, '.env.keys')];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadPrivateKeysIntoEnv(keysPath: string): void {
  const text = fs.readFileSync(keysPath, 'utf-8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key.startsWith('DOTENV_PRIVATE_KEY')) {
      process.env[key] = val;
    }
  }
}

function migrateAllLocalKeyFiles(): void {
  try {
    const results = migrateWorkspaceEnvKeys(ROOT);
    const any = results.some((r) => r.migrated);
    if (any) {
      printOk(`Kunci digabung ke: ${getGlobalKeysPath(ROOT)}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    printWarn(`Gagal pindahkan keys: ${msg}`);
  }
}

// ─── Load / save env ───────────────────────────────────────────────────────

function envFilePath(envName: string): string {
  return path.join(ENV_DIR, `${envName}.env`);
}

/** Decrypt env to plaintext string via dotenvx --stdout (does not rewrite file). */
function decryptEnvToText(filePath: string, keysPath: string | null): string {
  const raw = fs.readFileSync(filePath, 'utf-8');
  if (!isEncryptedEnvText(raw)) return raw;

  if (!keysPath) {
    printError({
      title: 'File env terenkripsi tapi kunci tidak ditemukan',
      detail:
        'Kunci dekripsi biasanya di ~/.dotenvx-keys/<package-name>/.env.keys — tidak ikut Git.',
      hint: 'Minta .env.keys dari tim, atau buat ulang: hapus environments/local.env, salin dari .example, isi, lalu npm run env:edit lagi. Lihat docs/CREDENTIALS.md',
      docsLink: 'docs/CREDENTIALS.md',
      exitCode: EXIT.FIXABLE,
    });
    process.exit(EXIT.FIXABLE);
  }

  loadPrivateKeysIntoEnv(keysPath);

  try {
    const out = execSync(`npx @dotenvx/dotenvx decrypt -f "${filePath}" --stdout --quiet`, {
      cwd: ROOT,
      encoding: 'utf-8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return String(out);
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    printError({
      title: 'Gagal decrypt env file',
      detail: (e.stderr || e.message || String(err)).split('\n')[0],
      hint: 'Pastikan .env.keys cocok dengan file ini. Atau recreate environments/local.env dari example. docs/TROUBLESHOOTING.md Error #5',
      docsLink: 'docs/TROUBLESHOOTING.md',
      exitCode: EXIT.FIXABLE,
    });
    process.exit(EXIT.FIXABLE);
  }
}

/**
 * Encrypt env file.
 *
 * Do NOT force `-fk` to an existing global keys file for brand-new env files:
 * dotenvx may mint a new public-key name while pairing with the wrong private
 * key, producing ciphertext that cannot be decrypted (DECRYPTION_FAILED).
 *
 * Strategy:
 * 1. If private keys already loaded in process.env (from decrypt), encrypt as-is.
 * 2. Prefer encrypt without `-fk` so dotenvx keeps keypair coherent for this file.
 * 3. If a secure keys path exists and file already has DOTENV_PUBLIC_KEY, pass -fk
 *    only as a secondary attempt when (2) fails.
 * 4. Always merge any new local `.env.keys` into ~/.dotenvx-keys/<project>/.
 */
function encryptEnvFile(filePath: string, keysPath: string | null): void {
  const attempts: string[] = [`npx @dotenvx/dotenvx encrypt -f "${filePath}" --quiet`];
  if (keysPath && fs.existsSync(keysPath)) {
    attempts.push(`npx @dotenvx/dotenvx encrypt -f "${filePath}" -fk "${keysPath}" --quiet`);
  }

  let lastErr = '';
  let ok = false;
  for (const cmd of attempts) {
    try {
      execSync(cmd, {
        cwd: ROOT,
        encoding: 'utf-8',
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      ok = true;
      break;
    } catch (err: unknown) {
      const e = err as { stderr?: string; message?: string };
      lastErr = (e.stderr || e.message || String(err)).split('\n')[0];
    }
  }

  if (!ok) {
    printError({
      title: 'Gagal encrypt env file',
      detail: lastErr || 'unknown encrypt error',
      hint: 'Cek instalasi @dotenvx/dotenvx. File mungkin masih plaintext — jangan commit.',
      exitCode: EXIT.FIXABLE,
    });
    process.exit(EXIT.FIXABLE);
  }

  // Verify we can decrypt what we just wrote (fail closed if not)
  try {
    const verifyKeys = resolveKeysPath() ?? keysPath;
    if (verifyKeys) loadPrivateKeysIntoEnv(verifyKeys);
    // also load any brand-new local keys before migrate
    for (const p of [path.join(ENV_DIR, '.env.keys'), path.join(ROOT, '.env.keys')]) {
      if (fs.existsSync(p)) loadPrivateKeysIntoEnv(p);
    }
    execSync(`npx @dotenvx/dotenvx decrypt -f "${filePath}" --stdout --quiet`, {
      cwd: ROOT,
      encoding: 'utf-8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    printError({
      title: 'Encrypt selesai tapi file tidak bisa di-decrypt ulang',
      detail: (e.stderr || e.message || String(err)).split('\n')[0],
      hint: 'Jangan commit file ini. Restore backup / recreate dari .env.example. Lapor maintainer jika berulang.',
      docsLink: 'docs/CREDENTIALS.md',
      exitCode: EXIT.FIXABLE,
    });
    process.exit(EXIT.FIXABLE);
  }

  migrateAllLocalKeyFiles();
}

function saveEnvMap(filePath: string, content: string, keysPath: string | null): void {
  // Refuse secrets with newlines before touching disk
  const map = parseEnvText(content);
  for (const [k, v] of Object.entries(map)) {
    if (/[\r\n]/.test(v)) {
      printError({
        title: `Nilai ${k} mengandung baris baru`,
        detail: 'Format .env hanya mendukung value satu baris.',
        hint: 'Ganti password/value tanpa Enter di tengah.',
        exitCode: EXIT.FIXABLE,
      });
      process.exit(EXIT.FIXABLE);
    }
  }

  // Backup previous encrypted/plaintext file for safety
  if (fs.existsSync(filePath)) {
    const bak = filePath + '.bak';
    try {
      fs.copyFileSync(filePath, bak);
    } catch {
      // non-fatal
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  encryptEnvFile(filePath, keysPath);
  printOk(`${path.relative(ROOT, filePath)} tersimpan & terenkripsi`);
  printInfo(
    'Session lama mungkin invalid. Jalankan:\n' +
      '    npx playwright test src/support/auth.setup.ts --project=setup',
  );
}

// ─── Display ───────────────────────────────────────────────────────────────

function printRoleTable(map: Record<string, string>): void {
  const roles = parseRolesFromEnvMap(map);
  process.stdout.write('\n  Kredensial terdeteksi:\n\n');
  if (roles.length === 0) {
    process.stdout.write('  (belum ada TEST_USER_EMAIL atau {ROLE}_EMAIL)\n\n');
  } else {
    process.stdout.write('  Role            Email                    Password      Auth file\n');
    process.stdout.write(
      '  ──────────────  ───────────────────────  ────────────  ──────────────────\n',
    );
    for (const r of roles) {
      const email = maskSecret(map[r.emailKey]);
      const pw = maskSecret(map[r.passwordKey]);
      process.stdout.write(
        `  ${r.name.padEnd(14)}  ${email.padEnd(23)}  ${pw.padEnd(12)}  ${r.authFile}\n`,
      );
    }
    process.stdout.write('\n');
  }

  process.stdout.write('  Config lain:\n');
  process.stdout.write(`    BASE_URL  = ${maskSecret(map.BASE_URL)}\n`);
  process.stdout.write(`    ENV_NAME  = ${map.ENV_NAME ?? '(empty)'}\n`);
  if (map.PLAYWRIGHT_CONFIG) {
    process.stdout.write(`    PLAYWRIGHT_CONFIG = ${map.PLAYWRIGHT_CONFIG}\n`);
  }
  process.stdout.write('\n');
}

// ─── Menu actions ──────────────────────────────────────────────────────────

async function actionEditBase(content: string, map: Record<string, string>): Promise<string> {
  const ans = await prompts([
    {
      type: 'text',
      name: 'baseUrl',
      message: 'BASE_URL:',
      initial: map.BASE_URL || 'http://localhost:3000',
    },
    {
      type: 'text',
      name: 'envName',
      message: 'ENV_NAME:',
      initial: map.ENV_NAME || 'local',
    },
  ]);
  if (ans.baseUrl === undefined) return content;
  return upsertEnvContent(content, {
    BASE_URL: String(ans.baseUrl).trim().replace(/\/$/, ''),
    ENV_NAME: String(ans.envName || 'local').trim(),
  });
}

async function actionEditRole(content: string, map: Record<string, string>): Promise<string> {
  const roles = parseRolesFromEnvMap(map);
  if (roles.length === 0) {
    printWarn('Belum ada role. Pilih "Tambah role" dulu.');
    return content;
  }

  const { roleName } = await prompts({
    type: 'select',
    name: 'roleName',
    message: 'Pilih role yang mau diedit:',
    choices: roles.map((r) => ({
      title: `${r.name}  (${maskSecret(map[r.emailKey])})`,
      value: r.name,
    })),
  });
  if (!roleName) return content;

  const ref = roleCredentialKeys(roleName);
  const fields: prompts.PromptObject[] = [
    {
      type: 'text',
      name: 'email',
      message: `${ref.emailKey}:`,
      initial: map[ref.emailKey] || '',
      validate: (v: string) => v.trim().length > 0 || 'Wajib diisi',
    },
    {
      type: 'password',
      name: 'password',
      message: `${ref.passwordKey} (kosongkan jika tidak ganti):`,
    },
  ];
  if (ref.usernameKey) {
    fields.push({
      type: 'text',
      name: 'username',
      message: `${ref.usernameKey} (opsional):`,
      initial: map[ref.usernameKey] || '',
    });
  }
  if (ref.phoneKey) {
    fields.push({
      type: 'text',
      name: 'phone',
      message: `${ref.phoneKey} (opsional):`,
      initial: map[ref.phoneKey] || '',
    });
  }

  const ans = await prompts(fields);
  if (ans.email === undefined) return content;

  const values: Record<string, string> = {
    [ref.emailKey]: String(ans.email).trim(),
  };
  if (ans.password && String(ans.password).length > 0) {
    values[ref.passwordKey] = String(ans.password);
  }
  if (ref.usernameKey && ans.username !== undefined && String(ans.username).trim()) {
    values[ref.usernameKey] = String(ans.username).trim();
  }
  if (ref.phoneKey && ans.phone !== undefined && String(ans.phone).trim()) {
    values[ref.phoneKey] = String(ans.phone).trim();
  }
  return upsertEnvContent(content, values);
}

async function actionAddRole(content: string, map: Record<string, string>): Promise<string> {
  const ans = await prompts([
    {
      type: 'text',
      name: 'roleName',
      message: 'Nama role (lowercase-hyphen, misal: finance, super-admin):',
      validate: (v: string) => {
        const n = v.trim().toLowerCase();
        if (!isValidRoleName(n)) return 'Hanya a-z, 0-9, dan tanda hubung';
        if (n === 'default') return 'Pakai "user" untuk default TEST_USER_*';
        const existing = parseRolesFromEnvMap(map).some((r) => r.name === n);
        if (existing) return `Role "${n}" sudah ada — pilih Edit`;
        return true;
      },
    },
    {
      type: 'text',
      name: 'email',
      message: 'Email:',
      validate: (v: string) => v.trim().length > 0 || 'Wajib diisi',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      validate: (v: string) => v.length > 0 || 'Wajib diisi',
    },
  ]);
  if (!ans.roleName || !ans.password) return content;

  const ref = roleCredentialKeys(String(ans.roleName).trim().toLowerCase());
  const next = upsertEnvContent(
    content,
    {
      [ref.emailKey]: String(ans.email).trim(),
      [ref.passwordKey]: String(ans.password),
    },
    'Kredensial per role',
  );
  printOk(`Role ${ref.name} ditambahkan (${ref.emailKey} / ${ref.passwordKey})`);
  printInfo(`Auth file nanti: ${ref.authFile}`);
  return next;
}

async function actionRemoveRole(
  content: string,
  map: Record<string, string>,
): Promise<{ content: string; removedAuth?: string }> {
  const roles = parseRolesFromEnvMap(map);
  if (roles.length === 0) {
    printWarn('Tidak ada role untuk dihapus.');
    return { content };
  }

  const { roleName } = await prompts({
    type: 'select',
    name: 'roleName',
    message: 'Role yang dihapus:',
    choices: roles.map((r) => ({ title: r.name, value: r.name })),
  });
  if (!roleName) return { content };

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: `Hapus keys untuk role "${roleName}" dari env file?`,
    initial: false,
  });
  if (!confirm) return { content };

  const ref = roleCredentialKeys(roleName);
  const keys = [ref.emailKey, ref.passwordKey];
  if (ref.usernameKey) keys.push(ref.usernameKey);
  if (ref.phoneKey) keys.push(ref.phoneKey);

  const next = removeEnvKeys(content, keys);

  const authAbs = path.join(ROOT, ref.authFile);
  if (fs.existsSync(authAbs)) {
    const { delAuth } = await prompts({
      type: 'confirm',
      name: 'delAuth',
      message: `Hapus juga ${ref.authFile}?`,
      initial: true,
    });
    if (delAuth) {
      fs.unlinkSync(authAbs);
      printOk(`${ref.authFile} dihapus`);
    }
  }

  printOk(`Keys role ${roleName} dihapus dari env`);
  return { content: next, removedAuth: ref.authFile };
}

async function actionFreeKey(content: string): Promise<string> {
  const ans = await prompts([
    {
      type: 'text',
      name: 'key',
      message: 'Nama KEY (UPPER_SNAKE):',
      validate: (v: string) =>
        /^[A-Z][A-Z0-9_]*$/.test(v.trim()) || 'Harus UPPER_SNAKE (misal: MY_KEY)',
    },
    {
      type: 'text',
      name: 'value',
      message: 'Value:',
    },
  ]);
  if (!ans.key) return content;
  return upsertEnvContent(content, { [String(ans.key).trim()]: String(ans.value ?? '') });
}

function regenAuthSetup(map: Record<string, string>): void {
  const roles = parseRolesFromEnvMap(map);
  if (roles.length === 0) {
    printWarn('Tidak ada role di env — auth.setup tidak di-generate.');
    return;
  }

  const loginUrl = map.AUTH_LOGIN_URL_PATH
    ? map.AUTH_LOGIN_URL_PATH.startsWith('/')
      ? map.AUTH_LOGIN_URL_PATH
      : `/${map.AUTH_LOGIN_URL_PATH}`
    : '/login';
  const successUrlPath = map.AUTH_SUCCESS_URL_PATH
    ? map.AUTH_SUCCESS_URL_PATH.startsWith('/')
      ? map.AUTH_SUCCESS_URL_PATH
      : `/${map.AUTH_SUCCESS_URL_PATH}`
    : '/dashboard';

  if (fs.existsSync(AUTH_SETUP_OUT)) {
    const bak = AUTH_SETUP_OUT + '.bak';
    fs.copyFileSync(AUTH_SETUP_OUT, bak);
    printInfo(`Backup: ${path.relative(ROOT, bak)}`);
  }

  writeAuthSetup(
    {
      roles: roles.map((r) => ({ name: r.name, authFile: r.authFile })),
      loginUrl,
      successUrlPath,
    },
    AUTH_SETUP_OUT,
  );
  printOk(`${path.relative(ROOT, AUTH_SETUP_OUT)} di-regenerate (${roles.length} role)`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags();
  if (flags.help) {
    printHelp();
    process.exit(EXIT.OK);
  }

  const filePath = envFilePath(flags.envName);
  if (!fs.existsSync(filePath)) {
    printError({
      title: `File tidak ditemukan: environments/${flags.envName}.env`,
      detail: `Expected path: ${filePath}`,
      hint: `Salin template: cp environments/local.env.example environments/${flags.envName}.env`,
      docsLink: 'docs/CREDENTIALS.md',
      exitCode: EXIT.USAGE,
    });
    process.exit(EXIT.USAGE);
  }

  const keysPath = resolveKeysPath();
  let content = decryptEnvToText(filePath, keysPath);
  let map = parseEnvText(content);

  process.stdout.write('\n');
  process.stdout.write('╔══════════════════════════════════════════════════════════════╗\n');
  process.stdout.write('║  🔐 env:edit — Kelola kredensial test                        ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════════════╝\n');
  process.stdout.write(`  File: environments/${flags.envName}.env\n`);
  if (keysPath) {
    process.stdout.write(`  Keys: ${keysPath}\n`);
  }

  printRoleTable(map);

  if (flags.listOnly) {
    process.exit(EXIT.OK);
  }

  let dirty = false;
  let running = true;

  while (running) {
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'Pilih aksi:',
      choices: [
        { title: 'Lihat kredensial (masked)', value: 'list' },
        { title: 'Edit BASE_URL / ENV_NAME', value: 'base' },
        { title: 'Edit kredensial role', value: 'edit-role' },
        { title: 'Tambah role', value: 'add-role' },
        { title: 'Hapus role', value: 'remove-role' },
        { title: 'Edit key bebas (advanced)', value: 'free' },
        { title: 'Simpan & encrypt', value: 'save' },
        { title: 'Re-encrypt file saja (tanpa ubah isi)', value: 'reencrypt' },
        {
          title: 'Regenerasi src/support/auth.setup.ts dari roles di env',
          value: 'regen-auth',
        },
        { title: 'Keluar', value: 'exit' },
      ],
    });

    if (!action || action === 'exit') {
      if (dirty) {
        const { save } = await prompts({
          type: 'confirm',
          name: 'save',
          message: 'Ada perubahan belum disimpan. Simpan & encrypt sekarang?',
          initial: true,
        });
        if (save) {
          saveEnvMap(filePath, content, resolveKeysPath() ?? keysPath);
        } else {
          printWarn('Keluar tanpa menyimpan perubahan di memory.');
        }
      }
      process.stdout.write('\n');
      running = false;
      continue;
    }

    if (action === 'list') {
      map = parseEnvText(content);
      printRoleTable(map);
      continue;
    }

    if (action === 'base') {
      const next = await actionEditBase(content, map);
      if (next !== content) {
        content = next;
        map = parseEnvText(content);
        dirty = true;
        printOk('BASE_URL / ENV_NAME di-update (belum disimpan ke disk)');
      }
      continue;
    }

    if (action === 'edit-role') {
      map = parseEnvText(content);
      const next = await actionEditRole(content, map);
      if (next !== content) {
        content = next;
        map = parseEnvText(content);
        dirty = true;
        printOk('Kredensial role di-update (belum disimpan ke disk)');
      }
      continue;
    }

    if (action === 'add-role') {
      map = parseEnvText(content);
      const next = await actionAddRole(content, map);
      if (next !== content) {
        content = next;
        map = parseEnvText(content);
        dirty = true;
      }
      continue;
    }

    if (action === 'remove-role') {
      map = parseEnvText(content);
      const result = await actionRemoveRole(content, map);
      if (result.content !== content) {
        content = result.content;
        map = parseEnvText(content);
        dirty = true;
      }
      continue;
    }

    if (action === 'free') {
      const next = await actionFreeKey(content);
      if (next !== content) {
        content = next;
        map = parseEnvText(content);
        dirty = true;
        printOk('Key di-update (belum disimpan ke disk)');
      }
      continue;
    }

    if (action === 'save') {
      saveEnvMap(filePath, content, resolveKeysPath() ?? keysPath);
      // reload encrypted→decrypt for further edits
      content = decryptEnvToText(filePath, resolveKeysPath());
      map = parseEnvText(content);
      dirty = false;
      continue;
    }

    if (action === 'reencrypt') {
      // write current content then encrypt
      fs.writeFileSync(filePath, content, 'utf-8');
      encryptEnvFile(filePath, resolveKeysPath() ?? keysPath);
      printOk('Re-encrypt selesai');
      content = decryptEnvToText(filePath, resolveKeysPath());
      map = parseEnvText(content);
      dirty = false;
      continue;
    }

    if (action === 'regen-auth') {
      map = parseEnvText(content);
      const { ok } = await prompts({
        type: 'confirm',
        name: 'ok',
        message: fs.existsSync(AUTH_SETUP_OUT)
          ? 'Overwrite src/support/auth.setup.ts? (backup .bak dibuat)'
          : 'Generate src/support/auth.setup.ts dari roles di env?',
        initial: true,
      });
      if (ok) regenAuthSetup(map);
      continue;
    }
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  printError({
    title: 'Unexpected error di env:edit',
    detail: msg,
    hint: 'Hubungi Framework Maintainer jika berulang. Fallback manual: docs/CREDENTIALS.md',
    exitCode: EXIT.ESCALATE,
  });
  process.exit(EXIT.ESCALATE);
});

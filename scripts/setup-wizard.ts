/// <reference types="node" />
/**
 * setup-wizard — Interactive CLI wizard setup pertama kali untuk QA
 *
 * Usage: npm run setup:wizard
 *
 * Phase 0: Welcome + pre-flight + resume detection
 * Phase 1: Project info (nama, BASE_URL, env name)
 * Phase 2: Kredensial test (email, password, multi-role)
 * Phase 3: Install dependencies (npm, playwright, mcp:build)
 * Phase 4: Hermes + MCP verification
 * Phase 5: Auth setup (generate + run auth.setup.ts)
 * Phase 6: Verify + encrypt credentials
 * Phase 7: Next steps
 *
 * @module scripts/setup-wizard
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import prompts from 'prompts';
import { printOk, printWarn, printError, printInfo } from './format-error';
import { EXIT } from './exit-codes';
import { writeAuthSetup } from './wizard-auth-template';

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, '.wizard-state.json');
const ENV_DIR = path.join(ROOT, 'environments');
const LOCAL_ENV = path.join(ENV_DIR, 'local.env');
const AUTH_SETUP_OUT = path.join(ROOT, 'src', 'support', 'auth.setup.ts');
const TOTAL_PHASES = 7;

// ─── CLI flags ─────────────────────────────────────────────────────────────

interface CliFlags {
  dryRun: boolean;
  fromPhase: number | null;
}

function parseFlags(): CliFlags {
  const args = process.argv.slice(2);
  const flags: CliFlags = { dryRun: false, fromPhase: null };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run' || arg === '--dryrun') {
      flags.dryRun = true;
    } else if (arg === '--from-phase') {
      const next = args[i + 1];
      const n = next ? parseInt(next, 10) : NaN;
      if (Number.isFinite(n) && n >= 0 && n <= TOTAL_PHASES) {
        flags.fromPhase = n;
        i++;
      } else {
        process.stdout.write('\n  ⚠️  --from-phase butuh angka 0-' + TOTAL_PHASES + '\n');
        process.stdout.write('  Contoh: npm run setup:wizard -- --from-phase=3\n\n');
        process.exit(2);
      }
    } else if (arg.startsWith('--from-phase=')) {
      const n = parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(n) && n >= 0 && n <= TOTAL_PHASES) {
        flags.fromPhase = n;
      } else {
        process.stdout.write('\n  ⚠️  --from-phase butuh angka 0-' + TOTAL_PHASES + '\n\n');
        process.exit(2);
      }
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write('\n  Setup Wizard — Usage:\n');
      process.stdout.write('    npm run setup:wizard                       # interactive setup\n');
      process.stdout.write(
        '    npm run setup:wizard -- --dry-run          # preview only, no writes\n',
      );
      process.stdout.write('    npm run setup:wizard -- --from-phase=3     # start at Phase 3\n');
      process.stdout.write('    npm run setup:wizard -- --help             # this help\n\n');
      process.exit(0);
    } else {
      process.stdout.write('\n  ⚠️  Unknown flag: ' + arg + '\n');
      process.stdout.write('  Run with --help untuk lihat opsi.\n\n');
      process.exit(2);
    }
  }

  return flags;
}

const FLAGS = parseFlags();

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleCredential {
  name: string;
  authFile: string;
}

interface WizardState {
  version: '1';
  completedPhases: number[];
  projectName: string;
  baseUrl: string;
  envName: string;
  loginUrl: string;
  successUrlPath: string;
  roles: RoleCredential[];
  mcpVerified: boolean;
  authSetupDone: boolean;
  timestamp: string;
}

// ─── State helpers ────────────────────────────────────────────────────────────

function loadState(): WizardState | null {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as WizardState;
  } catch {
    return null;
  }
}

function saveState(state: WizardState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function markPhase(state: WizardState, phase: number): void {
  if (!state.completedPhases.includes(phase)) {
    state.completedPhases.push(phase);
  }
  state.timestamp = new Date().toISOString();
  saveState(state);
}

function defaultState(): WizardState {
  return {
    version: '1',
    completedPhases: [],
    projectName: '',
    baseUrl: '',
    envName: 'local',
    loginUrl: '/login',
    successUrlPath: '/dashboard',
    roles: [],
    mcpVerified: false,
    authSetupDone: false,
    timestamp: new Date().toISOString(),
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function hr(char = '─', width = 62): string {
  return char.repeat(width);
}

function banner(): void {
  process.stdout.write('\n');
  process.stdout.write('╔══════════════════════════════════════════════════════════════╗\n');
  process.stdout.write('║  🎭 Playwright QA Kit — Setup Wizard                         ║\n');
  process.stdout.write('║  Framework E2E testing berbantuan Hermes Agent               ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════════════╝\n\n');
  process.stdout.write('  Framework ini membantu QA membuat test otomatis dari\n');
  process.stdout.write('  requirement — tanpa nulis kode TypeScript sendiri.\n\n');
  process.stdout.write('  Hermes Agent di VS Code yang akan menjalankan pipeline-nya.\n');
  process.stdout.write('  Estimasi waktu setup: 5-15 menit.\n\n');
}

function phaseHeader(num: number, title: string): void {
  process.stdout.write('\n' + hr() + '\n');
  process.stdout.write('  [' + num + '/' + TOTAL_PHASES + '] ' + title + '\n');
  process.stdout.write(hr() + '\n');
}

function isEncryptedEnv(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  return fs.readFileSync(filePath, 'utf-8').includes('encrypted:');
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function runCmd(cmd: string, opts: { cwd?: string } = {}): { ok: boolean; output: string } {
  try {
    const out = execSync(cmd, {
      cwd: opts.cwd ?? ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { ok: true, output: String(out ?? '') };
  } catch (err: unknown) {
    const e = err as Error & { stderr?: string; stdout?: string };
    const msg = e.stderr ?? e.stdout ?? e.message ?? String(err);
    return { ok: false, output: msg };
  }
}

function fileExistsAndNonEmpty(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).size > 0;
}

interface OSInfo {
  platform: 'linux' | 'macos' | 'windows' | 'unknown';
  isRoot: boolean;
  needsSudo: boolean;
  shellName: string;
}

function detectOS(): OSInfo {
  const p = process.platform;
  let platform: OSInfo['platform'] = 'unknown';
  if (p === 'win32') platform = 'windows';
  else if (p === 'darwin') platform = 'macos';
  else if (p === 'linux') platform = 'linux';

  let isRoot = false;
  try {
    if (typeof process.getuid === 'function') {
      isRoot = (process.getuid as () => number)() === 0;
    }
  } catch {
    isRoot = false;
  }

  const needsSudo = platform !== 'windows' && !isRoot;
  const shellName = platform === 'windows' ? 'PowerShell/CMD' : 'bash/zsh';

  return { platform, isRoot, needsSudo, shellName };
}

function writeEnvSection(values: Record<string, string>, sectionComment?: string): void {
  if (FLAGS.dryRun) {
    process.stdout.write('\n  [dry-run] skip env write: ' + Object.keys(values).join(', ') + '\n');
    return;
  }
  let content = fs.existsSync(LOCAL_ENV) ? fs.readFileSync(LOCAL_ENV, 'utf-8') : '';
  if (sectionComment) content += '\n# ' + sectionComment + '\n';
  for (const [key, val] of Object.entries(values)) {
    const regex = new RegExp('^' + key + '=.*$', 'm');
    if (regex.test(content)) {
      content = content.replace(regex, key + '=' + val);
    } else {
      content += key + '=' + val + '\n';
    }
  }
  if (!fs.existsSync(ENV_DIR)) fs.mkdirSync(ENV_DIR, { recursive: true });
  fs.writeFileSync(LOCAL_ENV, content, 'utf-8');
}

// ─── Phase 0: Welcome + Pre-flight ───────────────────────────────────────────

async function phase0(_state: WizardState): Promise<boolean> {
  phaseHeader(0, 'Welcome + Pre-flight Check');
  process.stdout.write('\n  Mengecek prasyarat...\n\n');
  let allOk = true;

  // Node.js version
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajor >= 20) {
    printOk('Node.js ' + process.versions.node + ' (>= 20.19.0 required)');
  } else {
    printError({
      title: 'Node.js terlalu lama: ' + process.versions.node,
      detail: 'Versi Node.js harus >= 20.19.0',
      hint: 'Install Node.js >= 20.19.0 dari https://nodejs.org/',
      exitCode: EXIT.FIXABLE,
    });
    allOk = false;
  }

  // Git
  if (runCmd('git --version').ok) {
    printOk('Git tersedia');
  } else {
    printWarn('Git tidak ditemukan — tidak wajib tapi disarankan');
  }

  // local.env sudah ada tapi encrypted tanpa key
  if (fs.existsSync(LOCAL_ENV) && isEncryptedEnv(LOCAL_ENV)) {
    const keyPaths = [
      path.join(ENV_DIR, '.env.keys'),
      path.join(ROOT, '.env.keys'),
      path.join(
        process.env.HOME ?? process.env.USERPROFILE ?? '',
        '.dotenvx-keys',
        'playwright-qa-kit',
        '.env.keys',
      ),
    ];
    const hasKey = keyPaths.some((k) => fs.existsSync(k));
    if (!hasKey) {
      printWarn('environments/local.env ada tapi terenkripsi dan kunci tidak ditemukan.');
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'Timpa dengan konfigurasi baru? (data lama akan hilang)',
        initial: false,
      });
      if (overwrite) {
        fs.unlinkSync(LOCAL_ENV);
        printInfo('File lama dihapus. Akan dibuat ulang.');
      } else {
        printInfo('Lanjut tanpa menimpa.');
      }
    } else {
      printOk('environments/local.env terenkripsi dan kunci tersedia');
    }
  } else if (fs.existsSync(LOCAL_ENV)) {
    printOk('environments/local.env sudah ada');
  } else {
    printInfo('environments/local.env belum ada — akan dibuat di Phase 2');
  }

  // node_modules
  if (fs.existsSync(path.join(ROOT, 'node_modules', '@playwright', 'test'))) {
    printOk('node_modules sudah terinstall');
  } else {
    printInfo('node_modules belum ada — akan diinstall di Phase 3');
  }

  // mcp-server/dist
  if (fileExistsAndNonEmpty(path.join(ROOT, 'mcp-server', 'dist', 'index-mcp.js'))) {
    printOk('mcp-server/dist sudah di-build');
  } else {
    printInfo('mcp-server/dist belum ada — akan di-build di Phase 3');
  }

  if (!allOk) {
    process.stdout.write(
      '\n  Ada prasyarat yang tidak terpenuhi. Perbaiki dulu sebelum lanjut.\n\n',
    );
    return false;
  }
  process.stdout.write('\n');
  return true;
}

// ─── Phase 1: Project Info ────────────────────────────────────────────────────

async function phase1(state: WizardState): Promise<void> {
  phaseHeader(1, 'Info Project');
  process.stdout.write('\n  Framework ini bisa dipakai untuk testing aplikasi web apapun.\n\n');

  const ans = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Nama project (untuk penamaan laporan):',
      initial: state.projectName || 'my-app-testing',
      validate: (v: string) => v.trim().length > 0 || 'Nama project tidak boleh kosong',
    },
    {
      type: 'text',
      name: 'baseUrl',
      message: 'URL aplikasi yang akan ditest (BASE_URL):',
      initial: state.baseUrl || 'http://localhost:3000',
      validate: (v: string) =>
        isValidUrl(v.trim()) || 'URL tidak valid. Contoh: https://staging.myapp.com',
    },
    {
      type: 'select',
      name: 'envName',
      message: 'Nama environment ini:',
      choices: [
        { title: 'local', value: 'local' },
        { title: 'staging', value: 'staging' },
        { title: 'development', value: 'development' },
      ],
      initial: 0,
    },
  ]);

  if (!ans.baseUrl) {
    printWarn('Input dibatalkan.');
    return;
  }

  state.projectName = ans.projectName.trim();
  state.baseUrl = ans.baseUrl.trim().replace(/\/$/, '');
  state.envName = ans.envName;

  if (!fs.existsSync(ENV_DIR)) fs.mkdirSync(ENV_DIR, { recursive: true });
  writeEnvSection(
    {
      BASE_URL: state.baseUrl,
      ENV_NAME: state.envName,
      PLAYWRIGHT_CONFIG: 'playwright.config.ts',
      HEADLESS: 'true',
      SLOW_MO: '0',
    },
    'Playwright QA Kit — environments/local.env',
  );

  printOk('Project info tersimpan ke environments/local.env');
  markPhase(state, 1);
}

// ─── Phase 2: Kredensial ─────────────────────────────────────────────────────

async function phase2(state: WizardState): Promise<void> {
  phaseHeader(2, 'Kredensial Akun Test');
  process.stdout.write('\n  Masukkan akun yang akan dipakai untuk testing.\n');
  process.stdout.write('  Akun ini harus sudah ada di aplikasimu.\n\n');
  process.stdout.write('  PENTING: Nilai yang kamu isi akan DIENKRIPSI otomatis\n');
  process.stdout.write('  setelah setup selesai. Nilai berubah jadi encrypted:BA+84...\n');
  process.stdout.write('  Ini NORMAL. Edit ulang nanti: npm run env:edit\n\n');

  const { multiRole } = await prompts({
    type: 'confirm',
    name: 'multiRole',
    message: 'Aplikasimu punya lebih dari 1 role user yang perlu ditest?',
    initial: false,
  });
  if (multiRole === undefined) {
    printWarn('Input dibatalkan.');
    return;
  }

  const roles: RoleCredential[] = [];

  if (!multiRole) {
    const c = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Email akun test:',
        validate: (v: string) => v.trim().length > 0 || 'Wajib diisi',
      },
      { type: 'text', name: 'username', message: 'Username (Enter jika sama dengan email):' },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        validate: (v: string) => v.length > 0 || 'Wajib diisi',
      },
      { type: 'text', name: 'phone', message: 'Nomor telepon (opsional, Enter untuk skip):' },
    ]);
    if (!c.password) {
      printWarn('Input dibatalkan.');
      return;
    }
    writeEnvSection({ TEST_USER_EMAIL: c.email.trim() }, 'Kredensial QA');
    if (c.username?.trim()) writeEnvSection({ TEST_USER_USERNAME: c.username.trim() });
    writeEnvSection({ TEST_USER_PASSWORD: c.password });
    if (c.phone?.trim()) writeEnvSection({ TEST_USER_PHONE: c.phone.trim() });
    roles.push({ name: 'default', authFile: '.auth/user.json' });
  } else {
    let addMore = true;
    let idx = 0;
    while (addMore) {
      idx++;
      process.stdout.write('\n  -- Role ' + idx + ' ' + '─'.repeat(50) + '\n');
      const r = await prompts([
        {
          type: 'text',
          name: 'roleName',
          message: 'Nama role (misal: admin, finance, user):',
          validate: (v: string) =>
            /^[a-z0-9-]+$/.test(v.trim()) || 'Lowercase dan tanda hubung saja',
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
      if (!r.password) {
        printWarn('Input dibatalkan.');
        break;
      }
      const prefix = r.roleName.toUpperCase().replace(/-/g, '_');
      const authFile = '.auth/' + r.roleName + '.json';
      writeEnvSection(
        { [prefix + '_EMAIL']: r.email.trim(), [prefix + '_PASSWORD']: r.password },
        idx === 1 ? 'Kredensial per role' : undefined,
      );
      roles.push({ name: r.roleName.trim(), authFile });
      const { more } = await prompts({
        type: 'confirm',
        name: 'more',
        message: 'Tambah role lagi?',
        initial: false,
      });
      addMore = !!more;
    }
  }

  if (roles.length > 0) {
    state.roles = roles;
    printOk('Kredensial tersimpan ke environments/local.env');
    markPhase(state, 2);
  }
}

// ─── Phase 3: Install ─────────────────────────────────────────────────────────

async function phase3(state: WizardState): Promise<boolean> {
  phaseHeader(3, 'Instalasi Dependencies');

  // Step 1: npm install
  const hasModules = fs.existsSync(path.join(ROOT, 'node_modules', '@playwright', 'test'));
  if (hasModules) {
    printOk('node_modules sudah ada — skip npm install');
  } else {
    process.stdout.write('\n  1/3  npm install\n');
    process.stdout.write('  Menginstall semua package... (1-3 menit)\n');
    const r = runCmd('npm install');
    if (r.ok) {
      printOk('npm install selesai');
    } else {
      printError({
        title: 'npm install gagal',
        detail: r.output.split('\n')[0],
        hint: 'Cek koneksi internet dan coba lagi.',
        exitCode: EXIT.FIXABLE,
      });
      return false;
    }
  }

  // Step 2: playwright install chromium
  process.stdout.write('\n  2/3  npx playwright install --with-deps chromium\n');
  process.stdout.write('  Mengunduh browser Chromium... (~150MB, bisa 2-5 menit)\n');

  // OS detection + sudo hint
  const osInfo = detectOS();
  if (osInfo.platform === 'unknown') {
    printWarn('OS tidak dikenali — lanjut dengan default.');
  } else {
    process.stdout.write(
      '\n  ℹ️  Terdeteksi OS: ' + osInfo.platform + ' (shell: ' + osInfo.shellName + ')\n',
    );
    if (osInfo.needsSudo) {
      printWarn('`--with-deps` butuh akses admin untuk install system packages (libnss3, dll).');
      printWarn('Kamu akan diminta password sudo saat install berjalan.');
      if (!FLAGS.dryRun) {
        const { useSudo } = await prompts({
          type: 'select',
          name: 'useSudo',
          message: 'Pilih metode install browser:',
          choices: [
            { title: 'Gunakan sudo (disarankan — install system packages)', value: 'sudo' },
            { title: 'Tanpa sudo — install browser saja tanpa system deps', value: 'nosudo' },
          ],
        });
        if (useSudo === 'sudo') {
          printInfo('Menggunakan sudo. Masukkan password jika diminta.');
        } else {
          printInfo(
            'Skip system deps. Browser tetap terinstall tapi mungkin perlu library manual.',
          );
        }
      }
    } else if (osInfo.platform === 'windows') {
      printInfo('Windows: jalankan terminal sebagai Administrator jika belum.');
    } else {
      printOk('Berjalan sebagai root/admin — tidak butuh sudo');
    }
  }

  if (FLAGS.dryRun) {
    printInfo('[dry-run] skip actual playwright install');
  } else {
    const pwCmd = osInfo.needsSudo
      ? 'sudo npx playwright install --with-deps chromium'
      : 'npx playwright install --with-deps chromium';
    const pw = runCmd(pwCmd);
    if (pw.ok) {
      printOk('Chromium browser siap');
    } else {
      printWarn('playwright install gagal atau partial: ' + pw.output.split('\n')[0]);
    }
  }

  // Step 3: mcp:build — WAJIB
  process.stdout.write('\n  3/3  npm run mcp:build\n');
  process.stdout.write('  Membangun AI Tools server (playwright-qa MCP)...\n');
  process.stdout.write('  Server ini yang memungkinkan Hermes membaca requirement\n');
  process.stdout.write('  dan mengakses laporan test secara langsung.\n');
  const mcp = runCmd('npm run mcp:build');
  if (mcp.ok) {
    printOk('mcp-server/dist/index-mcp.js berhasil di-build');
  } else {
    const errLine =
      mcp.output.split('\n').find((l: string) => l.toLowerCase().includes('error')) ??
      mcp.output.split('\n')[0];
    printError({
      title: 'mcp:build gagal',
      detail: errLine,
      hint: 'Coba: npm run mcp:build lagi. Jika berulang, hubungi Framework Maintainer.',
      exitCode: EXIT.ESCALATE,
    });
    const { cont } = await prompts({
      type: 'confirm',
      name: 'cont',
      message: 'Lanjut meski mcp:build gagal? (MCP tools tidak tersedia)',
      initial: false,
    });
    if (!cont) return false;
  }

  markPhase(state, 3);
  return true;
}

// ─── Phase 4: Hermes + MCP Setup ──────────────────────────────────────────────

async function phase4(state: WizardState): Promise<void> {
  phaseHeader(4, 'Konfigurasi Hermes Agent + MCP');

  process.stdout.write('\n  Framework ini bekerja dengan Hermes Agent di VS Code.\n');
  process.stdout.write(
    '  Hermes yang menjalankan pipeline: Requirement -> Plan -> Generate -> Execute -> Report.\n\n',
  );

  // Verifikasi .mcp.json
  const mcpJson = path.join(ROOT, '.mcp.json');
  if (fs.existsSync(mcpJson)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(mcpJson, 'utf-8')) as { servers?: unknown[] };
      const serverCount = parsed.servers?.length ?? 0;
      if (serverCount >= 3) {
        printOk('.mcp.json ada dan memiliki ' + serverCount + ' MCP servers');
      } else {
        printWarn('.mcp.json ada tapi hanya ' + serverCount + ' server (expected 3)');
      }
    } catch {
      printWarn('.mcp.json tidak valid JSON');
    }
  } else {
    printError({
      title: '.mcp.json tidak ditemukan',
      detail: 'File ini seharusnya ada di root project.',
      hint: 'Restore dari git.',
      exitCode: EXIT.ESCALATE,
    });
  }

  // Verifikasi mcp-server/dist
  const mcpDist = path.join(ROOT, 'mcp-server', 'dist', 'index-mcp.js');
  if (fileExistsAndNonEmpty(mcpDist)) {
    printOk('mcp-server/dist/index-mcp.js siap');
  } else {
    printWarn('mcp-server/dist belum ada — jalankan npm run mcp:build dulu');
  }

  process.stdout.write('\n');
  process.stdout.write('  Langkah berikutnya di VS Code:\n\n');
  process.stdout.write('  1. Buka VS Code di folder project ini\n');
  process.stdout.write('     File > Open Folder > pilih folder ini\n\n');
  process.stdout.write('  2. Buka Hermes Agent\n');
  process.stdout.write('     Klik icon Hermes di sidebar kiri, atau tekan Ctrl+Shift+H\n\n');
  process.stdout.write('  3. Cek status MCP di status bar bawah VS Code:\n');
  process.stdout.write('       MCP  3 servers  <- angka harus 3\n\n');
  process.stdout.write('  4. Jika belum 3 server connected:\n');
  process.stdout.write('     a. Klik status bar MCP tersebut\n');
  process.stdout.write('     b. Pilih Reload MCP Servers\n');
  process.stdout.write('     c. Tunggu semua server Connected\n\n');

  const { verified } = await prompts({
    type: 'select',
    name: 'verified',
    message: 'Status MCP di Hermes:',
    choices: [
      { title: 'Sudah connected (lanjut)', value: 'yes' },
      { title: 'Belum / belum cek (skip dulu, bisa dicek nanti)', value: 'skip' },
      { title: 'Ada error (tampilkan troubleshooting)', value: 'error' },
    ],
  });

  if (verified === 'error') {
    process.stdout.write('\n  Troubleshooting MCP tidak connect:\n\n');
    process.stdout.write('  1. Pastikan mcp:build berhasil: npm run mcp:build\n');
    process.stdout.write('  2. Jalankan health check: npm run health:check\n');
    process.stdout.write('  3. Restart VS Code sepenuhnya (bukan hanya reload window)\n');
    process.stdout.write('  4. Jika masih gagal: npm run mcp:config lalu restart VS Code\n\n');
  }

  state.mcpVerified = verified === 'yes';
  markPhase(state, 4);
}

// ─── Phase 5: Auth Setup ──────────────────────────────────────────────────────

async function phase5(state: WizardState): Promise<void> {
  phaseHeader(5, 'Setup Autentikasi Test');

  process.stdout.write('\n  Framework menyimpan session login ke .auth/<role>.json\n');
  process.stdout.write('  sehingga test tidak perlu login ulang setiap saat.\n\n');

  const { mechanism } = await prompts({
    type: 'select',
    name: 'mechanism',
    message: 'Bagaimana cara login di aplikasimu?',
    choices: [
      { title: 'Form login biasa (email/username + password + klik Login)', value: 'form' },
      { title: 'SSO / OAuth (redirect ke Google, Microsoft, dsb.)', value: 'sso' },
      { title: 'Tidak ada login (semua halaman publik)', value: 'none' },
    ],
  });

  if (mechanism === undefined) {
    printWarn('Input dibatalkan.');
    return;
  }

  if (mechanism === 'none') {
    printInfo('Tidak ada auth setup. Test akan berjalan tanpa session.');
    state.authSetupDone = true;
    markPhase(state, 5);
    return;
  }

  if (mechanism === 'sso') {
    process.stdout.write('\n  SSO/OAuth tidak bisa diotomasi langsung oleh wizard.\n');
    process.stdout.write('  Minta bantuan Hermes setelah setup selesai:\n');
    process.stdout.write(
      '  Ketik di Hermes: ' +
        JSON.stringify(
          'Tolong buat auth.setup.ts untuk SSO login di ' + (state.baseUrl ?? '') + '/login',
        ) +
        '\n\n',
    );
    markPhase(state, 5);
    return;
  }

  // Form login
  const loginInfo = await prompts([
    {
      type: 'text',
      name: 'loginUrl',
      message: 'Path halaman login:',
      initial: state.loginUrl ?? '/login',
      validate: (v: string) => v.startsWith('/') || 'Harus diawali / misal: /login',
    },
    {
      type: 'text',
      name: 'successUrlPath',
      message: 'Path setelah login berhasil:',
      initial: state.successUrlPath ?? '/dashboard',
      validate: (v: string) => v.startsWith('/') || 'Harus diawali / misal: /dashboard',
    },
  ]);

  if (!loginInfo.successUrlPath) {
    printWarn('Input dibatalkan.');
    return;
  }

  state.loginUrl = loginInfo.loginUrl;
  state.successUrlPath = loginInfo.successUrlPath;

  const roles =
    state.roles.length > 0 ? state.roles : [{ name: 'default', authFile: '.auth/user.json' }];

  // Generate auth.setup.ts
  writeAuthSetup(
    { roles, loginUrl: loginInfo.loginUrl, successUrlPath: loginInfo.successUrlPath },
    AUTH_SETUP_OUT,
  );
  printOk('src/support/auth.setup.ts dibuat');

  // Pastikan .auth/ dir ada
  const authDir = path.join(ROOT, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  // Tanya apakah mau jalankan auth setup sekarang
  const { runNow } = await prompts({
    type: 'confirm',
    name: 'runNow',
    message: 'Jalankan auth setup sekarang? (membuka browser, melakukan login)',
    initial: true,
  });

  if (runNow) {
    process.stdout.write('\n  Menjalankan auth setup...\n');
    const result = runCmd(
      'npx playwright test src/support/auth.setup.ts --project=setup --reporter=line',
    );
    if (result.ok || result.output.includes('passed')) {
      printOk('Auth setup berhasil');
      for (const role of roles) {
        if (fs.existsSync(path.join(ROOT, role.authFile))) {
          printOk(role.authFile + ' tersimpan');
        }
      }
      state.authSetupDone = true;
    } else {
      printWarn('Auth setup gagal atau partial.');
      printWarn(result.output.split('\n').slice(0, 3).join(' | '));
      process.stdout.write('\n  Minta bantuan Hermes untuk memperbaiki selector login:\n');
      process.stdout.write(
        '  Ketik di Hermes: ' +
          JSON.stringify(
            'Tolong perbaiki src/support/auth.setup.ts untuk login page di ' +
              (state.baseUrl ?? '') +
              loginInfo.loginUrl,
          ) +
          '\n\n',
      );
    }
  } else {
    printInfo(
      'Auth setup dilewati. Jalankan manual: npx playwright test src/support/auth.setup.ts --project=setup',
    );
  }

  markPhase(state, 5);
}

// ─── Phase 6: Verify + Encrypt ────────────────────────────────────────────────

async function phase6(state: WizardState): Promise<void> {
  phaseHeader(6, 'Verifikasi Setup');
  process.stdout.write('\n  Menjalankan pengecekan akhir...\n\n');

  // setup:check
  const sc = runCmd('npx tsx setup-check.ts');
  if (sc.ok) {
    printOk('setup:check lulus');
  } else {
    const lines = sc.output
      .split('\n')
      .filter((l: string) => l.includes('FAIL') || l.includes('WARN') || l.includes('ERR'))
      .slice(0, 5);
    printWarn('setup:check ada peringatan:');
    lines.forEach((l: string) => process.stdout.write('    ' + l.trim() + '\n'));
  }

  // health:check
  const hc = runCmd('npx tsx scripts/health-check-cli.ts');
  const hcLines = hc.output.split('\n').slice(0, 20);
  hcLines.forEach((l: string) => {
    if (l.trim()) process.stdout.write('  ' + l.trim() + '\n');
  });

  process.stdout.write('\n');
  printInfo("Warning 'json_results' belum ada adalah NORMAL sebelum test pertama.");

  // Encrypt env
  if (fs.existsSync(LOCAL_ENV) && !isEncryptedEnv(LOCAL_ENV)) {
    process.stdout.write('\n  Mengenkripsi credentials di environments/local.env...\n');
    const enc = runCmd('npx @dotenvx/dotenvx encrypt -f environments/local.env');
    if (enc.ok) {
      printOk('Credentials dienkripsi');
      printInfo('Kunci dekripsi tersimpan di: ~/.dotenvx-keys/playwright-qa-kit/');
      printInfo('Edit ulang nanti: npm run env:edit');
    } else {
      printWarn('Enkripsi gagal: ' + enc.output.split('\n')[0]);
      printWarn('File masih PLAINTEXT. Jangan commit environments/local.env!');
    }
  } else if (isEncryptedEnv(LOCAL_ENV)) {
    printOk('Credentials sudah terenkripsi');
  }

  markPhase(state, 6);
  process.stdout.write('\n  Status: SETUP SELESAI\n');
}

// ─── Phase 7: Next Steps ──────────────────────────────────────────────────────

function phase7(state: WizardState): void {
  phaseHeader(7, 'Siap Digunakan!');

  process.stdout.write('\n');
  process.stdout.write('  ' + hr('=', 60) + '\n');
  process.stdout.write('  CARA PAKAI FRAMEWORK INI\n');
  process.stdout.write('  ' + hr('=', 60) + '\n\n');

  process.stdout.write('  1. Buka VS Code di folder ini, pastikan Hermes Agent aktif\n');
  process.stdout.write('     (cek status bar: MCP  Tulis requirement di folder requirements/\n');
  process.stdout.write('     Salin template:\n');
  process.stdout.write('       cp requirements/_TEMPLATE.md requirements/fitur-login.md\n');
  process.stdout.write('     Isi sesuai fitur yang mau ditest.\n\n');

  process.stdout.write('  3. Kirim prompt ini ke Hermes Agent:\n');
  process.stdout.write('  \n');
  process.stdout.write('     +' + hr('-', 52) + '+\n');
  process.stdout.write('     | Jalankan pipeline QA untuk                        |\n');
  process.stdout.write('     | requirements/fitur-login.md                       |\n');
  process.stdout.write('     +' + hr('-', 52) + '+\n');
  process.stdout.write('  \n');
  process.stdout.write('     Hermes akan otomatis: validasi requirement -> plan\n');
  process.stdout.write('     -> generate test -> execute -> report.\n\n');

  process.stdout.write('  4. Lihat laporan:\n');
  process.stdout.write('     start reports/custom-dashboard.html   (Windows)\n');
  process.stdout.write('     open  reports/custom-dashboard.html   (Mac/Linux)\n\n');

  process.stdout.write('  ' + hr('=', 60) + '\n');
  process.stdout.write('  Coba dulu dengan contoh yang sudah ada:\n');
  process.stdout.write('    npm run qa:run -- requirements/example-login-extension.md\n\n');

  process.stdout.write('  Referensi cepat : docs/CHEATSHEET.md\n');
  process.stdout.write('  Panduan lengkap : docs/GUIDE.md\n');
  process.stdout.write('  Edit credentials: npm run env:edit\n');
  process.stdout.write('  Butuh bantuan   : Tanya Hermes langsung di VS Code!\n');
  process.stdout.write('  ' + hr('=', 60) + '\n\n');

  markPhase(state, 7);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  banner();

  // Resume atau mulai baru
  let state = loadState();
  let startPhase = FLAGS.fromPhase ?? 0;

  // Apply --from-phase: clear completion state for earlier phases
  if (FLAGS.fromPhase !== null && state) {
    state.completedPhases = state.completedPhases.filter((p) => p >= FLAGS.fromPhase!);
    printInfo('Memulai dari Phase ' + FLAGS.fromPhase + ' (sesuai --from-phase flag)');
  }

  if (FLAGS.dryRun) {
    printInfo(
      'Mode --dry-run aktif: tidak ada file yang ditulis, tidak ada command yang dijalankan.',
    );
  }

  if (state) {
    const lastPhase = Math.max(...state.completedPhases, -1);
    if (lastPhase >= 0 && lastPhase < TOTAL_PHASES) {
      process.stdout.write(
        '  Ditemukan progress sebelumnya (Phase ' + lastPhase + ' selesai).\n\n',
      );
      const { resume } = await prompts({
        type: 'select',
        name: 'resume',
        message: 'Lanjut dari mana?',
        choices: [
          { title: 'Lanjut dari Phase ' + (lastPhase + 1), value: 'resume' },
          { title: 'Mulai dari awal', value: 'restart' },
        ],
      });
      if (resume === 'restart') {
        if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
        state = null;
        startPhase = 0;
      } else {
        startPhase = lastPhase + 1;
      }
    }
  }

  if (!state) state = defaultState();

  // Ctrl+C handler — simpan state sebelum keluar
  process.on('SIGINT', () => {
    process.stdout.write('\n\n  Wizard dihentikan. Progress tersimpan di .wizard-state.json\n');
    process.stdout.write('  Lanjutkan kapan saja dengan: npm run setup:wizard\n\n');
    if (state) saveState(state);
    process.exit(0);
  });

  // Phase 0: Pre-flight (selalu jalankan)
  if (startPhase === 0) {
    const ok = await phase0(state);
    if (!ok) {
      process.stdout.write('\n  Setup dihentikan karena prasyarat tidak terpenuhi.\n\n');
      process.exit(EXIT.FIXABLE);
    }
    markPhase(state, 0);
  }

  // Phase 1: Project info
  if (startPhase <= 1 && !state.completedPhases.includes(1)) {
    await phase1(state);
  } else if (state.completedPhases.includes(1)) {
    printOk('[Phase 1] Project info sudah ada — skip');
  }

  // Phase 2: Kredensial
  if (startPhase <= 2 && !state.completedPhases.includes(2)) {
    await phase2(state);
  } else if (state.completedPhases.includes(2)) {
    printOk('[Phase 2] Kredensial sudah dikonfigurasi — skip');
    printInfo('Mau ganti / tambah role? Jalankan: npm run env:edit');
    printInfo('Atau ulang Phase 2: npm run setup:wizard -- --from-phase=2');
  }

  // Phase 3: Install
  if (startPhase <= 3 && !state.completedPhases.includes(3)) {
    const ok = await phase3(state);
    if (!ok) {
      process.stdout.write('\n  Setup dihentikan karena instalasi gagal.\n');
      process.stdout.write('  Perbaiki error di atas lalu jalankan: npm run setup:wizard\n\n');
      saveState(state);
      process.exit(EXIT.ESCALATE);
    }
  } else if (state.completedPhases.includes(3)) {
    printOk('[Phase 3] Dependencies sudah terinstall — skip');
  }

  // Phase 4: MCP + Hermes
  if (startPhase <= 4 && !state.completedPhases.includes(4)) {
    await phase4(state);
  } else if (state.completedPhases.includes(4)) {
    printOk('[Phase 4] MCP setup sudah dikonfigurasi — skip');
  }

  // Phase 5: Auth setup
  if (startPhase <= 5 && !state.completedPhases.includes(5)) {
    await phase5(state);
  } else if (state.completedPhases.includes(5)) {
    printOk('[Phase 5] Auth setup sudah selesai — skip');
  }

  // Phase 6: Verify + Encrypt
  await phase6(state);

  // Phase 7: Next steps
  phase7(state);

  // Bersihkan state file — setup selesai
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  printError({
    title: 'Unexpected error di setup wizard',
    detail: msg,
    hint: 'Hubungi Framework Maintainer jika ini berulang.',
    exitCode: EXIT.ESCALATE,
  });
  process.exit(EXIT.ESCALATE);
});

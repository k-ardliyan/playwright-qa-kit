/**
 * Unit tests for auth-paths + multi-role discovery helpers
 * Run: npx tsx scripts/__tests__/auth-paths.test.ts
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  authStatePath,
  authStateWritePath,
  ensureAuthDirForEnv,
  migrateLegacyAuthFiles,
  currentAppEnv,
} from '../../src/support/auth-paths';

// Run tests inside a temp cwd so we don't touch real .auth/
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-paths-'));
const prevCwd = process.cwd();
process.chdir(tmp);

function test(name: string, fn: () => void): void {
  try {
    fn();
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    process.stdout.write(`  ✗ ${name}\n`);
    process.chdir(prevCwd);
    throw err;
  }
}

process.stdout.write('\nauth-paths tests\n');

const prevEnv = process.env.APP_ENV;

test('currentAppEnv defaults to local', () => {
  delete process.env.APP_ENV;
  assert.equal(currentAppEnv(), 'local');
});

test('authStateWritePath always scoped', () => {
  process.env.APP_ENV = 'dev';
  assert.equal(authStateWritePath('finance'), path.join('.auth', 'dev', 'finance.json'));
  assert.equal(authStateWritePath('default'), path.join('.auth', 'dev', 'user.json'));
  assert.equal(authStateWritePath('general'), path.join('.auth', 'dev', 'user.json'));
});

test('authStatePath falls back to legacy for local only', () => {
  process.env.APP_ENV = 'local';
  fs.mkdirSync('.auth', { recursive: true });
  fs.writeFileSync(path.join('.auth', 'user.json'), '{}');
  assert.equal(authStatePath('user'), path.join('.auth', 'user.json'));

  process.env.APP_ENV = 'dev';
  // no scoped file — returns preferred scoped path even if missing
  assert.equal(authStatePath('user'), path.join('.auth', 'dev', 'user.json'));
});

test('migrateLegacyAuthFiles copies to .auth/local', () => {
  process.env.APP_ENV = 'local';
  // clean scoped
  const scopedDir = path.join('.auth', 'local');
  if (fs.existsSync(scopedDir)) fs.rmSync(scopedDir, { recursive: true, force: true });
  fs.mkdirSync('.auth', { recursive: true });
  fs.writeFileSync(path.join('.auth', 'finance.json'), '{"cookies":[]}');
  const moved = migrateLegacyAuthFiles('local');
  assert.ok(moved.includes('finance.json'));
  assert.ok(fs.existsSync(path.join('.auth', 'local', 'finance.json')));
  // idempotent
  const moved2 = migrateLegacyAuthFiles('local');
  assert.equal(moved2.length, 0);
});

test('ensureAuthDirForEnv creates dir', () => {
  process.env.APP_ENV = 'staging';
  const dir = ensureAuthDirForEnv();
  assert.ok(fs.existsSync(dir));
  assert.ok(dir.replace(/\\/g, '/').endsWith('.auth/staging'));
});

// cleanup
if (prevEnv === undefined) delete process.env.APP_ENV;
else process.env.APP_ENV = prevEnv;
process.chdir(prevCwd);
try {
  fs.rmSync(tmp, { recursive: true, force: true });
} catch {
  // ignore
}

process.stdout.write('\nAll auth-paths tests passed.\n');

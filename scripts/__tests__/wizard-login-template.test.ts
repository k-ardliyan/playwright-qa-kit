/// <reference types="node" />
/**
 * Unit tests for wizard-login-template — pure function, no I/O.
 *
 * Run:
 *   npx tsx scripts/__tests__/wizard-login-template.test.ts
 */

import * as assert from 'node:assert/strict';
import {
  buildLoginRequirement,
  type LoginTemplateState,
  type RoleSpec,
} from '../wizard-login-template';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    process.stdout.write(`  ✓ ${name}\n`);
    passed++;
  } catch (err) {
    failed++;
    process.stdout.write(`  ✗ ${name}\n`);
    const msg = err instanceof Error ? err.message : String(err);
    process.stdout.write(`    ${msg}\n`);
  }
}

function baseState(overrides: Partial<LoginTemplateState> = {}): LoginTemplateState {
  const roles: RoleSpec[] = [{ name: 'user', authFile: '.auth/local/user.json' }];
  return {
    projectName: 'erpku',
    baseUrl: 'https://stg.erpku.com',
    loginUrl: '/login',
    successUrlPath: '/dashboard',
    roles,
    mechanism: 'form',
    ...overrides,
  };
}

// ─── form mechanism ──────────────────────────────────────────────────────────

test('form: title uses project name', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(md.includes('# REQ-AUTH-001: Login — erpku'), 'title missing');
});

test('form: no POM metadata (Path A)', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(!md.includes('POM yang dibutuhkan'), 'should not include POM metadata');
});

test('form: fictional user, never wrong password on real role', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(md.includes('qa.invalid.user.not.exists'), 'fictional user missing');
  assert.ok(md.includes('${TEST_USER_PASSWORD}'), 'should reference env var in template literal');
  assert.ok(md.toLowerCase().includes('tidak terkunci'), 'must warn account not locked');
});

test('form: anti-lockout note present', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(md.includes('tidak terkunci'), 'anti-lockout note missing');
});

test('form: pathname assertion (not URL contains)', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(md.includes('pathname mengandung'), 'should assert pathname');
  assert.ok(md.includes('TIDAK** mengandung'), 'should assert exclusion');
});

test('form: refers to env var, not plaintext', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(md.includes('TEST_USER_EMAIL'), 'env var missing');
  assert.ok(md.includes('TEST_USER_PASSWORD'), 'env var missing');
});

test('form: multi-role adds Role scope metadata', () => {
  const md = buildLoginRequirement(
    baseState({
      roles: [
        { name: 'superadmin', authFile: '.auth/local/superadmin.json' },
        { name: 'finance', authFile: '.auth/local/finance.json' },
      ],
    }),
  );
  assert.ok(md.includes('Role scope'), 'role scope metadata missing');
  assert.ok(md.includes('superadmin'), 'role name missing');
  assert.ok(md.includes('finance'), 'role name missing');
});

test('form: uses loginUrl from state', () => {
  const md = buildLoginRequirement(baseState({ loginUrl: '/auth/sign-in' }));
  assert.ok(md.includes('/auth/sign-in'), 'custom loginUrl missing');
});

test('form: uses successUrlPath from state', () => {
  const md = buildLoginRequirement(baseState({ successUrlPath: '/home' }));
  assert.ok(md.includes('/home'), 'custom success path missing');
});

test('form: field hints are interpolated when provided', () => {
  const md = buildLoginRequirement(
    baseState({
      loginFieldHints: ['email'],
      passwordFieldHints: ['kata_sandi'],
      submitButtonHints: ['Masuk'],
    }),
  );
  assert.ok(md.includes('`email`'), 'custom login hint missing');
  assert.ok(md.includes('`kata_sandi`'), 'custom password hint missing');
  assert.ok(md.includes('`Masuk`'), 'custom submit hint missing');
});

test('form: includes snapshot_page / catalog guidance for site-specific locators', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(md.includes('snapshot_page'), 'must instruct snapshot_page');
  assert.ok(md.includes('selector-catalog'), 'must mention selector-catalog');
  assert.ok(
    md.includes('sample-*.md') || md.includes('sample-'),
    'must distinguish from sample files',
  );
});

test('form: auth path uses APP_ENV scope vocabulary', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(
    md.includes('.auth/{APP_ENV}/') || md.includes('.auth/local/user.json'),
    'scoped auth path missing',
  );
  assert.ok(
    md.includes('role **`user`**') ||
      md.includes('role **user**') ||
      md.includes('Akun kredensial default'),
    'user vocabulary missing',
  );
  assert.ok(
    !md.includes("role 'default'") && !md.includes('role `default`'),
    'must not teach role default',
  );
});

// ─── sso mechanism ───────────────────────────────────────────────────────────

test('sso: marks all scenarios as manual', () => {
  const md = buildLoginRequirement(baseState({ mechanism: 'sso' }));
  assert.ok(md.includes('(@manual)'), 'sso scenario should be manual');
  assert.ok(
    md.includes('Tidak bisa diotomasi') || md.includes('tidak bisa diotomasi'),
    'manual reason missing',
  );
});

test('sso: gives Hermes instruction for auth.setup.ts', () => {
  const md = buildLoginRequirement(baseState({ mechanism: 'sso' }));
  assert.ok(md.includes('auth.setup.ts'), 'sso instruction missing');
});

// ─── none mechanism ──────────────────────────────────────────────────────────

test('none: targets root, not login URL', () => {
  const md = buildLoginRequirement(baseState({ mechanism: 'none' }));
  assert.ok(md.includes('# REQ-AUTH-001: Smoke Publik'), 'none title wrong');
  assert.ok(md.includes('Tidak ada form login'), 'none rationale missing');
});

test('none: halaman awal is /', () => {
  const md = buildLoginRequirement(baseState({ mechanism: 'none' }));
  assert.ok(md.includes('**Halaman awal:** /'), 'none halaman awal should be /');
});

// ─── general ─────────────────────────────────────────────────────────────────

test('output ends with newline', () => {
  const md = buildLoginRequirement(baseState());
  assert.ok(md.endsWith('\n'), 'should end with newline');
});

test('no plaintext secret leaked into requirement', () => {
  const md = buildLoginRequirement(
    baseState({
      roles: [{ name: 'admin', authFile: '.auth/local/admin.json' }],
    }),
  );
  assert.ok(md.includes('${ADMIN_EMAIL}'), 'should reference env var');
  assert.ok(md.includes('${ADMIN_PASSWORD}'), 'should reference env var');
  const inputBlock = md.split('**Input Data:**')[1]?.split('**Langkah:**')[0] ?? '';
  assert.ok(
    !/password\s*:\s*[A-Za-z0-9!@#$%^&*]+/i.test(inputBlock),
    'no plaintext password in input',
  );
});

// ─── reporter ───────────────────────────────────────────────────────────────

process.stdout.write(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);

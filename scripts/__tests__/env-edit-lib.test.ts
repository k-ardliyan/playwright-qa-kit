/**
 * Unit tests for scripts/env-edit-lib.ts
 * Run: npx tsx scripts/__tests__/env-edit-lib.test.ts
 */
import assert from 'node:assert/strict';
import {
  isValidRoleName,
  roleToEnvPrefix,
  envPrefixToRole,
  roleAuthFile,
  roleCredentialKeys,
  parseRolesFromEnvMap,
  maskSecret,
  upsertEnvContent,
  removeEnvKeys,
  parseEnvText,
  isEncryptedEnvText,
  encodeEnvValue,
} from '../env-edit-lib';

function test(name: string, fn: () => void): void {
  try {
    fn();
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    process.stdout.write(`  ✗ ${name}\n`);
    throw err;
  }
}

process.stdout.write('\nenv-edit-lib tests\n');

test('validates role names', () => {
  assert.equal(isValidRoleName('finance'), true);
  assert.equal(isValidRoleName('super-admin'), true);
  assert.equal(isValidRoleName('user'), true);
  assert.equal(isValidRoleName('Super Admin'), false);
  assert.equal(isValidRoleName('finance_role'), false);
  assert.equal(isValidRoleName(''), false);
});

test('maps role to env prefix', () => {
  assert.equal(roleToEnvPrefix('default'), 'TEST_USER');
  assert.equal(roleToEnvPrefix('user'), 'TEST_USER');
  assert.equal(roleToEnvPrefix('finance'), 'FINANCE');
  assert.equal(roleToEnvPrefix('super-admin'), 'SUPER_ADMIN');
});

test('maps env prefix to role', () => {
  assert.equal(envPrefixToRole('TEST_USER'), 'user');
  assert.equal(envPrefixToRole('SUPER_ADMIN'), 'super-admin');
  assert.equal(envPrefixToRole('FINANCE'), 'finance');
});

test('maps role to auth file', () => {
  assert.equal(roleAuthFile('default'), '.auth/user.json');
  assert.equal(roleAuthFile('user'), '.auth/user.json');
  assert.equal(roleAuthFile('finance'), '.auth/finance.json');
});

test('builds credential keys', () => {
  const user = roleCredentialKeys('default');
  assert.equal(user.name, 'user');
  assert.equal(user.emailKey, 'TEST_USER_EMAIL');
  assert.equal(user.passwordKey, 'TEST_USER_PASSWORD');
  assert.equal(user.usernameKey, 'TEST_USER_USERNAME');
  assert.equal(user.authFile, '.auth/user.json');

  const fin = roleCredentialKeys('finance');
  assert.equal(fin.emailKey, 'FINANCE_EMAIL');
  assert.equal(fin.passwordKey, 'FINANCE_PASSWORD');
  assert.equal(fin.usernameKey, undefined);
});

test('parseRolesFromEnvMap finds multi-role', () => {
  const roles = parseRolesFromEnvMap({
    BASE_URL: 'http://localhost',
    TEST_USER_EMAIL: 'a@b.com',
    TEST_USER_PASSWORD: 'secret',
    FINANCE_EMAIL: 'f@b.com',
    FINANCE_PASSWORD: 'fpw',
    SUPER_ADMIN_EMAIL: 's@b.com',
    SUPER_ADMIN_PASSWORD: 'spw',
  });
  const names = roles.map((r) => r.name);
  assert.ok(names.includes('user'));
  assert.ok(names.includes('finance'));
  assert.ok(names.includes('super-admin'));
  assert.equal(roles.find((r) => r.name === 'finance')?.authFile, '.auth/finance.json');
});

test('parseRolesFromEnvMap skips empty emails', () => {
  const roles = parseRolesFromEnvMap({
    FINANCE_EMAIL: '',
    HRD_EMAIL: 'h@b.com',
    HRD_PASSWORD: 'x',
  });
  assert.deepEqual(
    roles.map((r) => r.name),
    ['hrd'],
  );
});

test('maskSecret', () => {
  assert.equal(maskSecret('encrypted:BA+84xxx'), '[encrypted]');
  assert.equal(maskSecret('ab'), '****');
  assert.match(maskSecret('password1'), /^\w\w\*\*\*\*\w\w$/);
  assert.equal(maskSecret(''), '(empty)');
});

test('parseEnvText', () => {
  const map = parseEnvText('# c\nFOO=bar\nBAZ="qux"\n');
  assert.equal(map.FOO, 'bar');
  assert.equal(map.BAZ, 'qux');
});

test('upsertEnvContent', () => {
  const out = upsertEnvContent('A=1\nB=2\n', { B: '9', C: '3' }, 'New');
  assert.ok(out.includes('A=1'));
  assert.ok(out.includes('B=9'));
  assert.ok(out.includes('C=3'));
  assert.ok(out.includes('# New'));
});

test('upsert quotes special passwords and roundtrips', () => {
  const special = 'p@ss#word=1! $x';
  const out = upsertEnvContent('TEST_USER_PASSWORD=old\n', {
    TEST_USER_PASSWORD: special,
  });
  // Prefer single quotes so $ is not expanded by dotenvx
  assert.ok(out.includes("TEST_USER_PASSWORD='") || out.includes('TEST_USER_PASSWORD="'));
  assert.equal(parseEnvText(out).TEST_USER_PASSWORD, special);
});

test('encode prefers single quotes for dollar passwords', () => {
  assert.equal(encodeEnvValue('a$b'), "'a$b'");
  assert.equal(encodeEnvValue('plain'), 'plain');
});

test('upsert rejects newline in value', () => {
  let threw = false;
  try {
    upsertEnvContent('A=1\n', { PW: 'a\nb' });
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
});

test('removeEnvKeys', () => {
  const out = removeEnvKeys('A=1\nB=2\nC=3\n', ['B']);
  assert.ok(out.includes('A=1'));
  assert.ok(!out.includes('B=2'));
  assert.ok(out.includes('C=3'));
});

test('isEncryptedEnvText', () => {
  assert.equal(isEncryptedEnvText('X=encrypted:abc'), true);
  assert.equal(isEncryptedEnvText('X=plain'), false);
});

process.stdout.write('\nAll env-edit-lib tests passed.\n');

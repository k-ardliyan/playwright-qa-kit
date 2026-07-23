/**
 * Unit tests for human-challenge gates & env upserts.
 * Run: npx tsx src/support/__tests__/human-challenge.test.ts
 */
import assert from 'node:assert/strict';
import {
  assertChallengeAllowed,
  challengeModeEnvUpserts,
  isInteractiveChallengeMode,
  modeRequiresHeadedBrowser,
  modeRequiresTty,
  resolveAutoOtpPath,
  resolveChallengeMode,
  resolveChallengeTimeoutMs,
} from '../human-challenge';

function test(name: string, fn: () => void): void {
  try {
    fn();
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    process.stdout.write(`  ✗ ${name}\n`);
    throw err;
  }
}

process.stdout.write('\nhuman-challenge tests\n');

test('resolveChallengeMode defaults to none', () => {
  assert.equal(resolveChallengeMode({}), 'none');
  assert.equal(resolveChallengeMode({ AUTH_CHALLENGE_MODE: '' }), 'none');
  assert.equal(resolveChallengeMode({ AUTH_CHALLENGE_MODE: 'bogus' }), 'none');
});

test('resolveChallengeMode accepts known modes', () => {
  assert.equal(resolveChallengeMode({ AUTH_CHALLENGE_MODE: 'otp-browser' }), 'otp-browser');
  assert.equal(resolveChallengeMode({ AUTH_CHALLENGE_MODE: 'OTP-STDIN' }), 'otp-stdin');
  assert.equal(resolveChallengeMode({ AUTH_CHALLENGE_MODE: 'captcha-browser' }), 'captcha-browser');
  assert.equal(resolveChallengeMode({ AUTH_CHALLENGE_MODE: 'auto' }), 'auto');
});

test('resolveChallengeTimeoutMs', () => {
  assert.equal(resolveChallengeTimeoutMs({}), 180_000);
  assert.equal(resolveChallengeTimeoutMs({ AUTH_CHALLENGE_TIMEOUT_MS: '60000' }), 60_000);
  assert.equal(resolveChallengeTimeoutMs({ AUTH_CHALLENGE_TIMEOUT_MS: '100' }), 180_000);
});

test('mode flags', () => {
  assert.equal(isInteractiveChallengeMode('none'), false);
  assert.equal(isInteractiveChallengeMode('otp-browser'), true);
  assert.equal(modeRequiresHeadedBrowser('otp-browser'), true);
  assert.equal(modeRequiresHeadedBrowser('captcha-browser'), true);
  assert.equal(modeRequiresHeadedBrowser('otp-stdin'), false);
  assert.equal(modeRequiresTty('otp-stdin'), true);
  assert.equal(modeRequiresTty('otp-browser'), false);
});

test('assertChallengeAllowed: none always ok', () => {
  assertChallengeAllowed({ mode: 'none', env: { CI: 'true' } });
});

test('assertChallengeAllowed: CI forbids interactive', () => {
  assert.throws(
    () => assertChallengeAllowed({ mode: 'otp-browser', env: { CI: 'true', HEADLESS: 'false' } }),
    /forbidden under CI/,
  );
});

test('assertChallengeAllowed: captcha via terminal rejected', () => {
  assert.throws(
    () =>
      assertChallengeAllowed({
        mode: 'captcha-browser',
        viaTerminal: true,
        env: { HEADLESS: 'false' },
        isTty: true,
      }),
    /cannot be solved via terminal/,
  );
});

test('assertChallengeAllowed: otp-stdin needs TTY', () => {
  assert.throws(
    () =>
      assertChallengeAllowed({
        mode: 'otp-stdin',
        env: { HEADLESS: 'true' },
        isTty: false,
      }),
    /requires an interactive terminal/,
  );
  assertChallengeAllowed({
    mode: 'otp-stdin',
    env: { HEADLESS: 'true' },
    isTty: true,
  });
});

test('assertChallengeAllowed: browser modes need headed', () => {
  assert.throws(
    () =>
      assertChallengeAllowed({
        mode: 'otp-browser',
        env: { HEADLESS: 'true' },
      }),
    /requires a visible browser/,
  );
  assertChallengeAllowed({
    mode: 'otp-browser',
    env: { HEADLESS: 'false' },
  });
  assertChallengeAllowed({
    mode: 'captcha-browser',
    env: { HEADLESS: 'false' },
  });
});

test('resolveAutoOtpPath priority: browser first', () => {
  assert.equal(resolveAutoOtpPath({ env: { HEADLESS: 'false' }, isTty: false }), 'otp-browser');
  assert.equal(resolveAutoOtpPath({ env: { HEADLESS: 'true' }, isTty: true }), 'otp-stdin');
  assert.throws(
    () => resolveAutoOtpPath({ env: { HEADLESS: 'true' }, isTty: false }),
    /headless and no TTY/,
  );
});

test('assertChallengeAllowed: auto needs headed or TTY', () => {
  assert.throws(
    () =>
      assertChallengeAllowed({
        mode: 'auto',
        env: { HEADLESS: 'true' },
        isTty: false,
      }),
    /auto mode needs a visible browser/,
  );
  assertChallengeAllowed({
    mode: 'auto',
    env: { HEADLESS: 'false' },
    isTty: false,
  });
  assertChallengeAllowed({
    mode: 'auto',
    env: { HEADLESS: 'true' },
    isTty: true,
  });
});

test('assertChallengeAllowed: --headed argv treats env as headed', () => {
  // Simulate CLI --headed even if HEADLESS=true in env map
  const prev = process.argv.slice();
  try {
    process.argv = [...prev, '--headed'];
    assertChallengeAllowed({
      mode: 'otp-browser',
      env: { HEADLESS: 'true' },
    });
  } finally {
    process.argv = prev;
  }
});

test('challengeModeEnvUpserts: otp-browser forces headed + slowMo', () => {
  const u = challengeModeEnvUpserts('otp-browser', { slowMo: '0' });
  assert.equal(u.AUTH_CHALLENGE_MODE, 'otp-browser');
  assert.equal(u.HEADLESS, 'false');
  assert.equal(u.SLOW_MO, '100');
});

test('challengeModeEnvUpserts: keeps existing slowMo', () => {
  const u = challengeModeEnvUpserts('captcha-browser', { slowMo: '250' });
  assert.equal(u.HEADLESS, 'false');
  assert.equal(u.SLOW_MO, undefined);
});

test('challengeModeEnvUpserts: otp-stdin does not force headed', () => {
  const u = challengeModeEnvUpserts('otp-stdin', { headless: 'true', slowMo: '0' });
  assert.equal(u.AUTH_CHALLENGE_MODE, 'otp-stdin');
  assert.equal(u.HEADLESS, undefined);
});

process.stdout.write('All human-challenge tests passed.\n');

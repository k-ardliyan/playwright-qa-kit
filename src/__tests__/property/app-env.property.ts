/// <reference types="node" />

// Feature: app-env control plane — OS > pin > default; CI ignores pin

import assert from 'node:assert/strict';
import { resolveAppEnv } from '../../utils/app-env';

function withEnv(appEnv: string | undefined, run: () => void): void {
  const prev = process.env.APP_ENV;
  if (appEnv === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = appEnv;
  try {
    run();
  } finally {
    if (prev === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = prev;
  }
}

function withCi(ci: boolean, run: () => void): void {
  const prev = process.env.CI;
  if (ci) process.env.CI = 'true';
  else delete process.env.CI;
  try {
    run();
  } finally {
    if (prev === undefined) delete process.env.CI;
    else process.env.CI = prev;
  }
}

// OS wins over pin
withEnv('staging', () => {
  const r = resolveAppEnv({ repoRoot: process.cwd(), pinFileContents: 'dev' });
  assert.equal(r.appEnv, 'staging');
  assert.equal(r.source, 'os');
});

// pin when OS unset
withEnv(undefined, () => {
  withCi(false, () => {
    const r = resolveAppEnv({ repoRoot: process.cwd(), pinFileContents: 'dev' });
    assert.equal(r.appEnv, 'dev');
    assert.equal(r.source, 'pin');
  });
});

// default local
withEnv(undefined, () => {
  withCi(false, () => {
    const r = resolveAppEnv({ repoRoot: process.cwd(), pinFileContents: null });
    assert.equal(r.appEnv, 'local');
    assert.equal(r.source, 'default');
  });
});

// unknown OS value → invalid_os, fall back local
withEnv('development', () => {
  const r = resolveAppEnv({ repoRoot: process.cwd() });
  assert.equal(r.appEnv, 'local');
  assert.equal(r.source, 'invalid_os');
  assert.equal(r.rawOsValue, 'development');
});

// invalid pin → invalid_pin
withEnv(undefined, () => {
  withCi(false, () => {
    const r = resolveAppEnv({
      repoRoot: process.cwd(),
      pinFileContents: 'development',
    });
    assert.equal(r.appEnv, 'local');
    assert.equal(r.source, 'invalid_pin');
    assert.equal(r.rawPinValue, 'development');
  });
});

// CI ignores pin
withEnv(undefined, () => {
  withCi(true, () => {
    const r = resolveAppEnv({
      repoRoot: process.cwd(),
      pinFileContents: 'staging',
    });
    assert.equal(r.appEnv, 'local');
    assert.equal(r.source, 'default');
  });
});

// CI + explicit APP_ENV still uses OS
withEnv('production', () => {
  withCi(true, () => {
    const r = resolveAppEnv({
      repoRoot: process.cwd(),
      pinFileContents: 'dev',
    });
    assert.equal(r.appEnv, 'production');
    assert.equal(r.source, 'os');
  });
});

console.log('✓ Property: resolveAppEnv OS > pin > default; CI ignores pin');

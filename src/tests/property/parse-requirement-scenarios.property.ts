/// <reference types="node" />

// Feature: parse-requirement-scenarios, Property: stray labels between Hasil
// and next ### must NOT be swallowed into expectedResult.
//
// Regression test for the bug where `parseExpectedResult` only broke on
// `##`/`###` headings, not on `STEPS_LABEL` or `PRECONDITION_LABEL`. A stray
// `**Prekondisi:**` line and the `**Langkah:**` block that followed were
// silently consumed into the expectedResult string.

import assert from 'node:assert/strict';
import { parseRequirementScenariosFromText } from '../../../mcp-server/src/tools/parse-requirement-scenarios';

function runCase(label: string, text: string, assertFn: () => void): void {
  try {
    assertFn();
    process.stdout.write(`✓ ${label}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`✗ ${label}\n   ${message}\n`);
    process.exitCode = 1;
  }
}

const SCENARIO_WITH_STRAY_LABELS = `### SC-01: Login sukses

**Langkah:**
1. Buka halaman login
2. Masukkan kredensial

**Hasil:**
User berhasil login

**Prekondisi:**
- Aplikasi sudah terpasang

**Langkah:**
1. Klik tombol logout

### SC-02: Logout

**Langkah:**
1. Klik logout

**Hasil:** Berhasil logout
`;

runCase(
  'stray Prekondisi + Langkah between Hasil and next ### do not corrupt expectedResult',
  SCENARIO_WITH_STRAY_LABELS,
  () => {
    const parsed = parseRequirementScenariosFromText(SCENARIO_WITH_STRAY_LABELS);
    assert.equal(parsed.length, 2, 'should parse both scenarios');

    const sc01 = parsed[0];
    assert.equal(sc01.id, 'SC-1');
    assert.equal(sc01.expectedResult, 'User berhasil login', 'expectedResult should be exact');
    assert.equal(sc01.precondition, 'Aplikasi sudah terpasang', 'precondition captured');
    assert.deepEqual(
      sc01.steps,
      ['Buka halaman login', 'Masukkan kredensial', 'Klik tombol logout'],
      'all three step groups should be collected',
    );

    const sc02 = parsed[1];
    assert.equal(sc02.id, 'SC-2');
    assert.deepEqual(sc02.steps, ['Klik logout']);
    assert.equal(sc02.expectedResult, 'Berhasil logout');
  },
);

const SCENARIO_WITH_H2_SECTION = `### SC-01: Login

**Langkah:**
1. Buka halaman login
2. Isi kredensial
3. Klik Login

**Hasil:** User berhasil masuk.

## Catatan Tambahan
Dokumen ini menjelaskan skenario pengujian login.

### SC-02: Logout

**Langkah:**
1. Klik logout

**Hasil:** Berhasil logout
`;

runCase(
  'outer loop terminates at ## Catatan Tambahan — both scenarios still parse',
  SCENARIO_WITH_H2_SECTION,
  () => {
    const parsed = parseRequirementScenariosFromText(SCENARIO_WITH_H2_SECTION);
    assert.equal(parsed.length, 2, 'should parse both scenarios');
    assert.equal(parsed[0].name, 'SC-01: Login');
    assert.equal(parsed[1].name, 'SC-02: Logout');
  },
);

const SCENARIO_MANUAL = `### SC-01: Login valid

**Langkah:**
1. Buka halaman login
2. Isi kredensial valid

**Hasil:** Login berhasil

### SC-02: CAPTCHA (@manual)

**Langkah:**
1. Selesaikan CAPTCHA

**Hasil:** Login berhasil setelah CAPTCHA
`;

runCase('@manual scenarios are flagged as non-automatable', SCENARIO_MANUAL, () => {
  const parsed = parseRequirementScenariosFromText(SCENARIO_MANUAL);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].automatable, true);
  assert.equal(parsed[1].automatable, false);
});

const NORMAL = `### SC-01: Login form

**Langkah:**
1. Buka halaman login
2. Masukkan username
3. Masukkan password
4. Klik Login

**Hasil:** Redirect ke dashboard
`;

runCase('well-formed scenario parses cleanly', NORMAL, () => {
  const parsed = parseRequirementScenariosFromText(NORMAL);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, 'SC-01: Login form');
  assert.equal(parsed[0].expectedResult, 'Redirect ke dashboard');
  assert.deepEqual(parsed[0].steps, [
    'Buka halaman login',
    'Masukkan username',
    'Masukkan password',
    'Klik Login',
  ]);
});

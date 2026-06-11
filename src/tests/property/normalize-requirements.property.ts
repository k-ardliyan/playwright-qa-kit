/// <reference types="node" />

// Feature: playwright-ai-agent-framework, Property 2: Requirements Normalization Round-Trip
// Feature: playwright-ai-agent-framework, Property 3: Requirements Error Handling

import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  normalizeRequirements,
  type NormalizeRequirementsOutput,
  type RequirementsContract,
} from '../../../mcp-server/src/tools/normalize-requirements';
import { validateRequirementText } from '../../../mcp-server/src/tools/validate-requirement';

function buildValidRequirementsText(
  title: string,
  acceptanceCriteria: string[],
  tags: string[],
): string {
  const lines: string[] = [`# ${title}`];
  for (const criterion of acceptanceCriteria) {
    lines.push(`- ${criterion}`);
  }
  if (tags.length > 0) {
    lines.push(`tags: ${tags.map((tag) => `#${tag}`).join(' ')}`);
  }
  return lines.join('\n');
}

function printContract(contract: RequirementsContract): string {
  const lines: string[] = [`id: ${contract.id}`, `# ${contract.title}`];
  for (const item of contract.acceptanceCriteria) {
    lines.push(`- ${item.description}`);
  }
  if (contract.tags.length > 0) {
    lines.push(`tags: ${contract.tags.map((tag) => `#${tag}`).join(' ')}`);
  }
  return lines.join('\n');
}

function canonicalize(contract: RequirementsContract): {
  id: string;
  title: string;
  acceptanceCriteria: string[];
  scenarioNames: string[];
  tags: string[];
} {
  return {
    id: contract.id,
    title: contract.title,
    acceptanceCriteria: contract.acceptanceCriteria.map((item) => item.description),
    scenarioNames: (contract.scenarios ?? []).map((item) => item.name),
    tags: [...contract.tags].sort((a, b) => a.localeCompare(b)),
  };
}

function expectSuccess(output: NormalizeRequirementsOutput): RequirementsContract {
  assert.equal(output.status, 'success');
  assert.ok(output.contract);
  return output.contract as RequirementsContract;
}

async function property2RoundTrip(): Promise<void> {
  const titleArb = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9 ]{2,28}$/);
  const criteriaArb = fc.array(fc.stringMatching(/^[A-Za-z0-9 ,.-]{3,60}$/), {
    minLength: 1,
    maxLength: 5,
  });
  const tagsArb = fc.uniqueArray(fc.stringMatching(/^[a-z0-9_-]{2,12}$/), {
    minLength: 0,
    maxLength: 4,
  });

  await fc.assert(
    fc.asyncProperty(titleArb, criteriaArb, tagsArb, async (title, criteria, tags) => {
      const input = buildValidRequirementsText(title.trim(), criteria, tags);

      const first = expectSuccess(normalizeRequirements(input));
      const printed = printContract(first);
      const second = expectSuccess(normalizeRequirements(printed));

      assert.deepEqual(canonicalize(second), canonicalize(first));
    }),
    { numRuns: 20 },
  );

  console.log('✓ Property 2 passed: normalize_requirements round-trip');
}

async function property3ErrorHandling(): Promise<void> {
  const invalidArb = fc.oneof(
    fc.constant(''),
    fc.constant('   \n\t   '),
    fc.stringMatching(/^[A-Za-z0-9 ]{1,24}$/).map((value) => `title: ${value}`),
    fc.stringMatching(/^[A-Za-z0-9 ]{1,24}$/).map((value) => `# ${value}`),
    fc.stringMatching(/^[A-Za-z0-9 ]{1,24}$/).map((value) => `- ${value}`),
  );

  await fc.assert(
    fc.asyncProperty(invalidArb, async (input) => {
      const output = normalizeRequirements(input);
      assert.equal(output.status, 'error');
      assert.ok(output.error);
      assert.equal(typeof output.error?.code, 'string');
      assert.equal((output.error?.code ?? '').length > 0, true);
      assert.equal(typeof output.error?.message, 'string');
      assert.equal((output.error?.message ?? '').length > 0, true);
    }),
    { numRuns: 20 },
  );

  console.log('✓ Property 3 passed: normalize_requirements error handling');
}

async function propertyScenariosFromIndonesianDoc(): Promise<void> {
  const sample = `# REQ-01: Lupa Password
Tags: #auth

## Kriteria Penerimaan
- Pengguna bisa membuka halaman Lupa Password.
- Form memvalidasi konfirmasi password.

## Skenario Uji

### 1. Sukses Reset Password
**Prekondisi:** Pengguna belum login
**Langkah:**
1. Buka halaman login
2. Klik Forgot Password
**Hasil:**
- Redirect ke halaman /forgot-password

### 2. Gagal CAPTCHA (@manual)
**Langkah:**
1. Isi CAPTCHA salah
**Hasil:**
- Error CAPTCHA tidak valid — verifikasi manual diperlukan karena CAPTCHA tidak dapat diotomatisasi
`;

  const output = expectSuccess(normalizeRequirements(sample));
  assert.equal(output.acceptanceCriteria.length, 2);
  assert.ok(output.scenarios);
  assert.equal(output.scenarios?.length, 2);
  assert.match(output.scenarios?.[0]?.name ?? '', /Sukses Reset Password/);
  assert.equal(output.scenarios?.[0]?.precondition, 'Pengguna belum login');
  assert.equal(output.scenarios?.[0]?.automatable, true);
  assert.equal(output.scenarios?.[1]?.automatable, false);

  console.log('✓ Scenario extraction passed for Indonesian requirement format');
}

async function propertyEnglishAliasLabels(): Promise<void> {
  const sample = `# REQ-02: Login Flow

## Acceptance Criteria
- User can open login page.

## Test Scenarios

### SC-01: Open login page
**Precondition:** User is not logged in
**Steps:**
1. Navigate to /login
2. Wait for form to load
**Expected Result:**
- Login form is visible on screen
`;

  const output = expectSuccess(normalizeRequirements(sample));
  assert.ok(output.scenarios);
  assert.equal(output.scenarios?.length, 1);
  assert.equal(output.scenarios?.[0]?.precondition, 'User is not logged in');
  assert.equal(output.scenarios?.[0]?.steps.length, 2);
  assert.match(output.scenarios?.[0]?.expectedResult ?? '', /visible/i);

  console.log('✓ English alias labels (Steps/Expected Result/Precondition) parsed correctly');
}

async function propertyMetadataSection(): Promise<void> {
  const sample = `# REQ-AUTH-002: Login Extension

## Metadata
- **Tags:** #auth #ui
- **Prioritas:** medium
- **Auth state:** unauthenticated
- **Halaman awal:** /login
- **POM yang dibutuhkan:** loginPage

## Kriteria Penerimaan
- Form login memvalidasi field kosong.

## Skenario Uji

### SC-01: Empty username
**Prekondisi:** Pengguna di halaman login
**Langkah:**
1. Buka halaman login
2. Submit tanpa username
**Hasil:**
- Pesan validasi username tampil di layar
`;

  const output = expectSuccess(normalizeRequirements(sample));
  assert.ok(output.metadata);
  assert.deepEqual(output.metadata?.authState, 'unauthenticated');
  assert.equal(output.metadata?.startPage, '/login');
  assert.deepEqual(output.metadata?.pomFixtures, ['loginPage']);
  assert.equal(output.metadata?.priority, 'medium');
  assert.ok(output.tags.includes('auth'));
  assert.ok(output.tags.includes('ui'));

  console.log('✓ Metadata section parsed correctly');
}

async function propertyValidateRequirementExample(): Promise<void> {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const examplePath = path.join(process.cwd(), 'requirements', 'example-login-extension.md');
  const text = fs.readFileSync(examplePath, 'utf-8');

  const result = validateRequirementText(text);
  assert.equal(result.status, 'success');
  assert.equal(result.violations.filter((v) => v.severity === 'error').length, 0);

  console.log('✓ validate_requirement passes for example-login-extension.md');
}

async function main(): Promise<void> {
  await property2RoundTrip();
  await property3ErrorHandling();
  await propertyScenariosFromIndonesianDoc();
  await propertyEnglishAliasLabels();
  await propertyMetadataSection();
  await propertyMetadataNotFallThroughToAcceptanceCriteria();
  await propertyValidateRequirementExample();
}

async function propertyMetadataNotFallThroughToAcceptanceCriteria(): Promise<void> {
  // Regression: when there is no `## Kriteria Penerimaan` / `## Acceptance
  // Criteria` section, the pre-scenario region must NOT include the
  // `## Metadata` bullets. Otherwise the bullet regex re-classifies them
  // as acceptance criteria.
  const sample = `# My Feature

## Metadata

- **Tags:** smoke
- **Priority:** high
- **Auth State:** authenticated

## Skenario Uji

### SC-01: User can do the thing

**Langkah:**
1. Open the page
2. Click the button

**Hasil:** The thing happens
`;

  const output = expectSuccess(normalizeRequirements(sample));
  assert.equal(
    output.acceptanceCriteria.length,
    0,
    'metadata bullets must not become acceptance criteria',
  );
  assert.ok(output.metadata, 'metadata should be parsed');
  assert.deepEqual(output.metadata?.tags, ['smoke']);
  assert.equal(output.scenarios?.length, 1);

  console.log('✓ Metadata section excluded from acceptance-criteria fallback');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

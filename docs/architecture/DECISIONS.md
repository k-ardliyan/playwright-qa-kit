# Architectural Decisions

> WHY di balik constraint-constraint di framework ini.
> Agent: baca ini jika kamu menemukan edge case yang tidak tercakup TL;DR.
> Last updated: 2026-07-27

---

## D-01: Auth via `authStatePath()`, bukan hardcode path

**Keputusan:** Selalu gunakan `authStatePath('<role>')` dari `src/support/auth-paths.ts`.

**Kenapa:** Path `.auth/{APP_ENV}/role.json` berubah setiap APP_ENV berbeda (local, staging, production).
Hardcode path → test pass di local, silently fail di CI/staging karena file tidak ada di path yang di-hardcode.

```ts
// ❌ Jangan
test.use({ storageState: '.auth/local/finance.json' });

// ✅ Lakukan
import { authStatePath } from '@/support/auth-paths';
test.use({ storageState: authStatePath('finance') });
```

---

## D-02: Import dari `@/fixtures/base.fixture`, bukan `@playwright/test`

**Keputusan:** Semua spec harus import `test` dan `expect` dari `@/fixtures/base.fixture`.

**Kenapa:** `base.fixture.ts` re-export framework fixtures (`logger`, lifecycle `testTrace`) yang dibutuhkan
untuk reporting dan debugging. Import langsung dari `@playwright/test` melewati fixture chain ini —
test akan jalan tapi tanpa trace, tanpa logger, dan reporter tidak bisa render detail yang benar.

```ts
// ❌ Jangan
import { test, expect } from '@playwright/test';

// ✅ Lakukan
import { test, expect } from '@/fixtures/base.fixture';
```

---

## D-03: Satu spec file per role, bukan satu file dengan multiple `test.use()`

**Keputusan:** Role-aware requirement → `src/tests/<feature>-<role>.spec.ts` per role.

**Kenapa:** Playwright tidak support multiple `test.use({ storageState })` dalam satu file dengan auth berbeda.
Satu file per role juga memudahkan `roleFilter` di pipeline dan `--grep` saat debugging.

```
// ❌ Jangan — tidak bekerja dengan benar
src/tests/invoice.spec.ts   ← berisi test finance DAN test hrd

// ✅ Lakukan
src/tests/invoice-finance.spec.ts
src/tests/invoice-hrd.spec.ts
```

---

## D-04: `APP_ENV` sebagai satu-satunya environment selector

**Keputusan:** Gunakan `APP_ENV` untuk menentukan target environment. Jangan gunakan `NODE_ENV`.

**Kenapa:** `NODE_ENV` adalah konvensi Node.js untuk development/production mode, bukan untuk target URL.
`APP_ENV` (local/staging/production) menentukan `.env.{APP_ENV}` mana yang di-load, termasuk `BASE_URL`,
kredensial, dan auth paths. Mixing keduanya menyebabkan test salah target secara silent.

---

## D-05: `test.skip()` bukan hapus — untuk scenario yang diblokir

**Keputusan:** Scenario yang tidak bisa diotomasi → `test.skip(true, '<alasan>')`, bukan dihapus.

**Kenapa:** Test yang dihapus hilang dari coverage report. `test.skip` dengan alasan eksplisit:

1. Mempertahankan visibility bahwa scenario ini ada tapi belum covered
2. Jadi reminder untuk diimplementasi nanti
3. Tidak merusak pipeline — skip dihitung dalam report sebagai `testsSkipped`

---

## D-06: `setTestMetadata()` selalu di baris pertama test body

**Keputusan:** Panggil `setTestMetadata(test, { testId, priority, inputData, ... })` sebagai statement pertama.

**Kenapa:** Custom reporter dan Table View dashboard membaca annotations yang di-set oleh `setTestMetadata`.
Kalau dipanggil setelah action pertama, ada kemungkinan test timeout atau fail sebelum metadata ter-set,
dan reporter tidak bisa render Test ID, Priority, atau Input Data untuk test tersebut.

---

## D-07: Barrel imports — selalu dari index, bukan path langsung

**Keputusan:** Import shared types dari `@/shared/types`, PW helpers dari `@/support/pw`.

**Kenapa:** Barrel exports memungkinkan refactor internal tanpa breaking semua import di test files.
Direct path imports (`@/support/pw/network-mock`) akan break jika file dipindah atau direstruktur.

```ts
// ❌ Jangan
import { networkMock } from '@/support/pw/network-mock';
import type { PipelineReport } from '@/shared/types/pipeline-metrics.schema';

// ✅ Lakukan
import { networkMock } from '@/support/pw';
import type { PipelineReport } from '@/shared/types';
```

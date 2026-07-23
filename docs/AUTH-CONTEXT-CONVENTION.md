# Auth Context Convention

Dokumen ini mendefinisikan konvensi penyimpanan auth state per role untuk framework Playwright QA ini.

> **Kelola kredensial (password, tambah/hapus role, encrypt):** lihat **[CREDENTIALS.md](CREDENTIALS.md)** — `npm run env:edit`.
>
> **Path auth setup (template core):** `src/support/auth.setup.ts`  
> (discover semua role login-ready dari env; multi-role otomatis).  
> Adapter ERPKU sample: `example/erpku/support/auth.setup.ts`.
>
> **Root Playwright wiring (official):** project `setup` → `chromium` memakai `dependencies: ['setup']`.  
> Default `storageState` di project chromium **kosong** (unauthenticated). Spec terautentikasi **wajib** override:
>
> ```ts
> import { authStatePath } from '@/support/auth-paths';
> test.use({ storageState: authStatePath('finance') });
> // setara: `.auth/${process.env.APP_ENV || 'local'}/finance.json`
> ```
>
> Tanpa kredensial login-ready, setup menulis `.auth/{APP_ENV}/user.json` kosong agar suite tidak gagal (demo tetap hijau).

---

## Struktur Direktori

Auth state **scoped by `APP_ENV`** (satu-satunya selector environment):

```
.auth/
  {APP_ENV}/              e.g. local | dev | staging | production
    user.json             ← default account (pipeline mode "general")
    super-admin.json
    finance.json
    hrd.json
    admin.json
```

Legacy (hanya `local`): `.auth/user.json` masih dibaca; `migrateLegacyAuthFiles()` menyalin ke `.auth/local/` saat auth setup.

File berisi Playwright storage state (cookies + localStorage).

> `.auth/` sudah ada di `.gitignore` — jangan commit auth state ke repository.

---

## Naming Convention

| Role bisnis   | Storage state path                 | Keterangan                                    |
| ------------- | ---------------------------------- | --------------------------------------------- |
| `user`        | `.auth/{APP_ENV}/user.json`        | Default authenticated user (mode **general**) |
| `super-admin` | `.auth/{APP_ENV}/super-admin.json` | Super admin                                   |
| `finance`     | `.auth/{APP_ENV}/finance.json`     | Finance                                       |
| `hrd`         | `.auth/{APP_ENV}/hrd.json`         | HRD                                           |
| `admin`       | `.auth/{APP_ENV}/admin.json`       | Admin                                         |

**Jangan** buat role / file `general` — `general` = mode requirement tanpa Role scope; auth-nya = **`user`**.

Helper: `authStatePath('finance')` / `authStateWritePath('finance')` di `src/support/auth-paths.ts`.

---

## Cara menjalankan Auth Setup

**Disarankan:** biarkan discovery otomatis di `src/support/auth.setup.ts` (setelah `env:edit` / wizard).

```bash
npx playwright test src/support/auth.setup.ts --project=setup
```

Setup mendaftarkan satu test `authenticate:<role>` per role yang **login-ready**  
(password + minimal satu EMAIL | USERNAME | PHONE). Login id: `LOGIN_ID_PREF` → email → username → phone.

Regenerate template multi-role (opsional): `npm run env:edit` → _Regenerasi auth.setup.ts_  
(atau `setup:wizard` Phase 5). Core discovery tetap jalan tanpa regenerate.

---

## Multi-role credentials

Lihat [CREDENTIALS.md](CREDENTIALS.md) — skema seragam per role; multi N=1 mirror ke `TEST_USER` opsional.

---

## Related

| Dokumen                                            | Isi                                 |
| -------------------------------------------------- | ----------------------------------- |
| [CREDENTIALS.md](CREDENTIALS.md)                   | Keys, identifier opsional, env:edit |
| [GUIDE.md](GUIDE.md)                               | APP_ENV control plane               |
| [writing-requirements.md](writing-requirements.md) | Mode general vs role-aware          |

# Kredensial & Multi-Role — Panduan Day-2

> **Satu halaman** untuk ganti password, tambah/hapus role, dan refresh session login.
> First-time setup? Mulai dari [GETTING-STARTED.md](GETTING-STARTED.md) (`npm run setup:wizard`).

---

## Naming Convention (sumber kebenaran)

| Role di UI / test     | Env keys                                                                  | Auth file                |
| --------------------- | ------------------------------------------------------------------------- | ------------------------ |
| `user` (default)      | `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (+ optional `USERNAME` / `PHONE`) | `.auth/user.json`        |
| `finance`             | `FINANCE_EMAIL`, `FINANCE_PASSWORD`                                       | `.auth/finance.json`     |
| `super-admin`         | `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`                               | `.auth/super-admin.json` |
| `<role>` (kebab-case) | `{ROLE_UPPER_SNAKE}_EMAIL`, `_PASSWORD`                                   | `.auth/<role>.json`      |

Contoh: role `super-admin` → keys `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` → file `.auth/super-admin.json`.

Validasi nama role: **huruf kecil, angka, tanda hubung** saja (`finance`, `super-admin`).

---

## First-time (wizard)

```bash
npm install
npm run setup:wizard
```

Phase 2 wizard mendukung single-role **atau** multi-role. Setelah selesai, nilai di `environments/local.env` dienkripsi (`encrypted:…`) — **itu normal**.

---

## Day-2: `npm run env:edit` (utama)

Jangan edit file `encrypted:…` di editor teks. Gunakan:

```bash
npm run env:edit                  # menu interaktif
npm run env:edit -- --list        # lihat keys (masked)
npm run env:edit -- --env dev     # environments/dev.env
```

### Menu yang sering dipakai

| Kebutuhan              | Aksi di menu                             |
| ---------------------- | ---------------------------------------- |
| Ganti password / email | **Edit kredensial role**                 |
| Tambah role baru       | **Tambah role**                          |
| Hapus role             | **Hapus role**                           |
| Ganti URL app          | **Edit BASE_URL / ENV_NAME**             |
| Simpan perubahan       | **Simpan & encrypt**                     |
| Regenerasi auth setup  | **Regenerasi src/support/auth.setup.ts** |

Setelah simpan, CLI mengingatkan refresh session.

---

## Refresh session (tanpa ganti password)

Kalau login expired / `.auth/*.json` basi:

```bash
npx playwright test src/support/auth.setup.ts --project=setup
```

File auth setup digenerate wizard di `src/support/auth.setup.ts`.  
Adapter ERPKU sample: `example/erpku/support/auth.setup.ts` (jalankan lewat config adapter).

---

## Enkripsi — yang perlu diketahui

| Item           | Lokasi / catatan                                                  |
| -------------- | ----------------------------------------------------------------- |
| Env file       | `environments/local.env` (gitignored)                             |
| Ciphertext     | `KEY=encrypted:BA+84…` — **normal**                               |
| Kunci dekripsi | `~/.dotenvx-keys/playwright-qa-kit/.env.keys` (**jangan commit**) |
| Auto-encrypt   | `npm run setup:check` juga mengenkripsi plaintext `.env`          |

### Kunci hilang di mesin baru

1. Minta `.env.keys` dari tim (via vault / channel aman), simpan ke `~/.dotenvx-keys/playwright-qa-kit/.env.keys`
2. **Atau** buat ulang:
   ```bash
   rm environments/local.env
   cp environments/local.env.example environments/local.env
   # isi BASE_URL + kredensial
   npm run env:edit   # simpan & encrypt
   ```

Lihat juga [TROUBLESHOOTING.md](TROUBLESHOOTING.md) Error #5.

---

## Fallback manual (jika CLI gagal)

```bash
# Decrypt in-place (butuh keys di env / -fk)
npx @dotenvx/dotenvx decrypt -f environments/local.env

# Edit plaintext di editor — lalu:
npx @dotenvx/dotenvx encrypt -f environments/local.env

# Pindahkan keys lokal ke folder aman jika muncul environments/.env.keys
```

Jangan commit `environments/*.env` atau `.env.keys`.

---

## Multi-role testing (ringkas)

1. Isi keys per role (`npm run env:edit` → Tambah role)
2. Pastikan `src/support/auth.setup.ts` memuat semua role (regenerate dari menu env:edit)
3. Jalankan setup project → menghasilkan `.auth/<role>.json`
4. Di spec: `test.use({ storageState: '.auth/finance.json' })`

Detail convention & contoh spec: [AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md).

---

## Related

| Dokumen                                                  | Isi                         |
| -------------------------------------------------------- | --------------------------- |
| [GETTING-STARTED.md](GETTING-STARTED.md)                 | Setup pertama               |
| [AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md) | Auth state per role di test |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)                 | Error setup / keys          |
| [GUIDE.md](GUIDE.md)                                     | Pipeline QA harian          |

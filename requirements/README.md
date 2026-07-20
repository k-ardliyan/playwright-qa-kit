# Requirements

Folder ini untuk **file requirement fitur** yang dibaca oleh Planner. Template dan file meta pakai prefix `_`.

## Cara Pakai

1. Salin [`_TEMPLATE.md`](_TEMPLATE.md) → `nama-fitur.md`
2. Isi semua field wajib di section `## Metadata`
3. Tulis skenario uji dengan format `### SC-XX:` + tag tipe skenario
4. Validasi: `npm run validate:requirement -- requirements/nama-fitur.md`

## Contoh

- **Contoh valid:** [`example-login-extension.md`](example-login-extension.md) — 2 skenario otomatis + 1 `@manual`
- **Contoh yang baik:** [`_GOOD_EXAMPLE.md`](_GOOD_EXAMPLE.md)
- **Contoh yang buruk:** [`_BAD_EXAMPLE.md`](_BAD_EXAMPLE.md)

## Dua Mode Penulisan

### Mode General (default)

Untuk fitur yang tidak membedakan perilaku per role. Cukup isi metadata wajib saja.

```markdown
- **Tags:** #auth #ui #smoke
- **Prioritas:** high
- **Auth state:** unauthenticated
- **Halaman awal:** /login
```

### Mode Role-Aware

Untuk fitur yang perilakunya berbeda per role bisnis (super-admin, finance, hrd, dsb).
Tambahkan field opsional `Role scope` dan `Access expectation`.

```markdown
- **Tags:** #finance #ui #regression
- **Prioritas:** high
- **Auth state:** authenticated
- **Halaman awal:** /finance/invoices
- **Role scope:** super-admin, finance
- **Access expectation:** super-admin: bisa approve dan reject; finance: bisa approve; hrd: tidak bisa membuka halaman ini
- **Risk level:** high
```

Validator akan memberi **warning** jika:

- `Auth state: authenticated` diisi tapi `Role scope` tidak ada (mungkin perlu ditambahkan)
- `Role scope` diisi tapi `Access expectation` tidak ada
- Requirement menyebut kata error/gagal/ditolak tapi tidak ada skenario `(@failure)`

## Tipe Skenario

Tambahkan tag di judul `### SC-XX:` untuk membedakan tipe:

| Tag                     | Artinya                                        |
| ----------------------- | ---------------------------------------------- |
| `(@success)`            | Happy path — alur normal berhasil              |
| `(@failure)`            | Negative path — input salah, validasi gagal    |
| `(@access-restriction)` | Role tidak berhak, akses ditolak               |
| `(@manual)`             | Tidak bisa diotomasi (CAPTCHA, OTP, biometric) |

Jika tidak diberi tag, skenario dianggap `(@success)` secara default.

## Referensi

- Panduan lengkap: [docs/GUIDE.md](../docs/GUIDE.md)
- Format requirement: [docs/writing-requirements.md](../docs/writing-requirements.md)
- Panduan skenario manual: [docs/MANUAL-SCENARIOS.md](../docs/MANUAL-SCENARIOS.md)

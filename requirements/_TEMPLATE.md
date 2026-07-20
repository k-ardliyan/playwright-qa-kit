# REQ-XXX: [Judul Fitur Singkat]

<!--
  CARA PAKAI TEMPLATE INI:
  1. Salin file ini → requirements/nama-fitur.md (ganti "nama-fitur" dengan nama file Anda)
  2. Ganti semua teks [dalam kurung siku] dengan isi Anda
  3. Hapus blok komentar ini sebelum commit
  4. Validasi: npm run validate:requirement -- requirements/nama-fitur.md

  CONTOH REQUIREMENT YANG BAIK:
  Lihat requirements/_GOOD_EXAMPLE.md

  CONTOH REQUIREMENT YANG BURUK (untuk perbandingan):
  Lihat requirements/_BAD_EXAMPLE.md
-->

## Metadata

| Field                 | Wajib?      | Contoh nilai                                     | Keterangan                                                                 |
| --------------------- | ----------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `Tags`                | ✅ Ya       | `#smoke #regression #ui`                         | Pisahkan dengan spasi. Dipakai filter test.                                |
| `Prioritas`           | ✅ Ya       | `high` / `medium` / `low`                        | Prioritas bisnis default untuk semua skenario.                             |
| `Auth state`          | ✅ Ya       | `unauthenticated` / `authenticated`              | Butuh login atau tidak.                                                    |
| `Halaman awal`        | ✅ Ya       | `/login`                                         | Path URL halaman pembuka scenario.                                         |
| `POM yang dibutuhkan` | ⚪ Opsional | `loginPage, dashboardPage`                       | Page Object Model yang akan dibuat Generator.                              |
| `Role scope`          | ⚪ Opsional | `super-admin, finance` / `semua role`            | Role bisnis yang terlibat. Isi jika fitur berbeda per role.                |
| `Access expectation`  | ⚪ Opsional | `finance: bisa approve; hrd: tidak bisa approve` | Role mana yang boleh/tidak boleh akses. Wajib diisi jika Role scope diisi. |
| `Risk level`          | ⚪ Opsional | `high` / `medium` / `low`                        | Dampak jika fitur ini gagal di produksi. Dipakai Healer untuk prioritasi.  |
| `Environment scope`   | ⚪ Opsional | `staging` / `production` / `all`                 | Environment mana yang relevan untuk requirement ini.                       |
| `Data scope`          | ⚪ Opsional | `seed data diperlukan: invoice_approved`         | Data khusus yang harus ada sebelum test bisa jalan.                        |

**Contoh Metadata yang baik (general flow):**

```
- **Tags:** #auth #ui #smoke
- **Prioritas:** high
- **Auth state:** unauthenticated
- **Halaman awal:** /login
- **POM yang dibutuhkan:** loginPage
```

**Contoh Metadata yang baik (role-aware flow):**

```
- **Tags:** #finance #ui #regression
- **Prioritas:** high
- **Auth state:** authenticated
- **Halaman awal:** /finance/invoices
- **POM yang dibutuhkan:** invoicePage, dashboardPage
- **Role scope:** super-admin, finance
- **Access expectation:** super-admin: bisa approve dan reject; finance: bisa approve; hrd: tidak bisa membuka halaman finance
- **Risk level:** high
```

## Kriteria Penerimaan

> Daftar 3-7 kondisi yang harus **terbukti** agar fitur "selesai".
> Setiap kriteria harus **observable** — bisa dibuktikan lewat UI/API.

**✅ Contoh Kriteria Penerimaan yang BAIK:**

- Pengguna dapat login dengan email valid dan password benar dalam waktu < 3 detik
- Login gagal menampilkan pesan error "Email atau password salah" di bawah form
- Setelah 5 kali gagal berturut-turut, akun terkunci selama 15 menit
- Session habis setelah 30 menit tidak ada aktivitas

**❌ Contoh Kriteria Penerimaan yang BURUK:**

- ~~Sistem login bekerja dengan baik~~ (tidak observable)
- ~~Login cepat dan aman~~ (terlalu generik)
- ~~User senang dengan fitur login~~ (subjektif)

## Skenario Uji

> Setiap skenario = satu alur user. Pakai heading `### SC-XX: Nama Skenario`.
> Setiap skenario WAJIB punya `**Langkah:**` (numbered list) dan `**Hasil yang Diharapkan:**` (bullet observable).
>
> **Tipe skenario** — tambahkan tag di judul heading:
>
> - `(@success)` — happy path, alur normal berhasil
> - `(@failure)` — negative path, input salah, validasi gagal
> - `(@access-restriction)` — role tidak berhak, akses ditolak
> - `(@manual)` — tidak bisa diotomasi (CAPTCHA, biometric, dsb)
>
> Jika tidak diberi tag, skenario dianggap `(@success)` secara default.
>
> **Field per skenario untuk Table View report:**
>
> - `Test ID` — wajib, format `TC-<MODUL>-<NNN>` (contoh: `TC-LOGIN-001`)
> - `Prioritas skenario` — opsional, override `Prioritas` global untuk skenario ini
> - `Layer terdampak` — opsional, komponen yang diuji: `FE` / `BE` / `DB` / `API`
> - `Input Data` — opsional, data input yang dipakai dalam skenario ini
> - `Hasil yang Diharapkan` — wajib (menggantikan `Hasil:`)

### SC-01: [Nama Skenario — Happy Path] (@success)

- **Test ID:** `TC-XXX-001`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE`

**Prekondisi:** [Keadaan awal sebelum skenario dimulai]

**Input Data:**

- field: value
- field: value

**Langkah:**

1. [Langkah pertama]
2. [Langkah kedua]
3. [Langkah ketiga]

**Hasil yang Diharapkan:**

- [Kondisi observable yang harus terbukti, misalnya: URL berubah ke /dashboard]
- [Kondisi observable kedua]

---

### SC-02: [Nama Skenario — Negative Path] (@failure)

- **Test ID:** `TC-XXX-002`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE`

**Prekondisi:** [Keadaan awal]

**Input Data:**

- field: value invalide

**Langkah:**

1. [Langkah pertama]
2. [Langkah kedua]

**Hasil yang Diharapkan:**

- [Pesan error yang muncul, misalnya: "Email atau password salah" tampil di bawah form]
- [Kondisi observable lain]

---

### SC-03: [Nama Skenario — Access Restriction] (@access-restriction)

> Gunakan skenario ini jika ada role yang tidak berhak mengakses fitur ini.

- **Test ID:** `TC-XXX-003`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:** Login sebagai [role yang tidak berhak], misalnya: HRD

**Langkah:**

1. Login sebagai [role yang tidak berhak]
2. Buka halaman [halaman yang dibatasi]

**Hasil yang Diharapkan:**

- [Halaman tidak dapat dibuka / redirect ke halaman lain]
- [Pesan "Akses ditolak" atau tombol tidak tersedia]

---

### SC-04: [Nama Skenario — Manual] (@manual)

> Gunakan skenario ini untuk flow yang tidak bisa diotomasi.

- **Test ID:** `TC-XXX-004`
- **Prioritas skenario:** `low`

**Prekondisi:** [Kondisi awal]

**Langkah:**

1. [Langkah manual pertama]
2. [Langkah manual kedua]

**Hasil yang Diharapkan:**

- [Hasil yang harus diverifikasi manual] — tidak bisa diotomasi karena: [alasan, misalnya: butuh CAPTCHA / SMS OTP / verifikasi biometrik]

---

> **Kapan skenario HARUS manual (`@manual`):**
>
> - Butuh **OTP / SMS / email** verifikasi (butuh akses ke device / inbox asli)
> - Butuh **payment gateway** asli dengan kartu test + 3DS
> - Butuh **biometric** (sidik jari, Face ID)
> - Butuh **visual review** manusia (layout PDF, warna, tipografi)
>
> **Lihat panduan lengkap:** [docs/MANUAL-SCENARIOS.md](../docs/MANUAL-SCENARIOS.md)

---

## ✅ Checklist Sebelum Simpan

- [ ] Judul `# REQ-XXX: ...` ada di baris pertama
- [ ] Section `## Metadata` terisi (minimal Tags, Prioritas, Auth state, Halaman awal)
- [ ] Jika `Auth state: authenticated`, pertimbangkan mengisi `Role scope` jika fitur berbeda per role
- [ ] Jika `Role scope` diisi, `Access expectation` juga diisi
- [ ] Minimal 1 bullet di `## Kriteria Penerimaan` dan semuanya observable
- [ ] Ada minimal 1 skenario `(@success)`
- [ ] Ada minimal 1 skenario `(@failure)` untuk fitur yang punya validasi atau negative path
- [ ] Skenario non-otomatis ditandai `(@manual)` di judul
- [ ] `@manual` scenario punya alasan jelas di **Hasil yang Diharapkan:**
- [ ] Setiap skenario punya `- **Test ID:** \`TC-XXX-NNN\``
- [ ] Setiap skenario punya `**Hasil yang Diharapkan:**` (bukan `**Hasil:**`)
- [ ] File sudah divalidasi: `npm run validate:requirement -- requirements/nama-fitur.md` (exit 0)

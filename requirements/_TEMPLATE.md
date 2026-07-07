# REQ-XXX: [Judul Fitur Singkat]

<!--
  CARA PAKAI TEMPLATE INI:
  1. Salin file ini → requirements/nama-fitur.md (ganti "nama-fitur" dengan nama file Anda)
  2. Ganti semua teks [dalam kurung siku] dengan isi Anda
  3. Hapus blok komentar ini sebelum commit
  4. Validasi: npm run validate:requirement -- requirements/nama-fitur.md

  CONTOH REQUIREMENT YANG BAIK:
  Lihat requirements/_GOOD_EXAMPLE.md

  CONTOH REQUIREMENT YANG BURUK (untuk对比):
  Lihat requirements/_BAD_EXAMPLE.md
-->

## Metadata

| Field                 | Wajib?      | Contoh nilai                        | Keterangan                                    |
| --------------------- | ----------- | ----------------------------------- | --------------------------------------------- |
| `Tags`                | ✅ Ya       | `#smoke #regression #ui`            | Pisahkan dengan spasi. Dipakai filter test.   |
| `Prioritas`           | ✅ Ya       | `high` / `medium` / `low`           | Prioritas bisnis.                             |
| `Auth state`          | ✅ Ya       | `unauthenticated` / `authenticated` | Butuh login atau tidak.                       |
| `Halaman awal`        | ✅ Ya       | `/login`                            | Path URL halaman pembuka scenario.            |
| `POM yang dibutuhkan` | ⚪ Opsional | `loginPage, dashboardPage`          | Page Object Model yang akan dibuat Generator. |

**Contoh Metadata yang baik:**

```
- **Tags:** #auth #ui #smoke
- **Prioritas:** high
- **Auth state:** unauthenticated
- **Halaman awal:** /login
- **POM yang dibutuhkan:** loginPage
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
> Setiap skenario WAJIB punya `**Langkah:**` (numbered list) dan `**Hasil:**` (bullet observable).

### SC-01: [Nama Skenario — Happy Path]

**Prekondisi:** [Keadaan awal sebelum scenario. Misal: "Pengguna belum login", "Keranjang kosong", "Akun `test@example.com` sudah terdaftar"]

**Langkah:**

1. [Aksi konkret yang bisa dilakukan user]
2. [Aksi konkret berikutnya]
3. [Aksi konkret berikutnya]

**Hasil:**

- [Hasil yang bisa DIAMATI — URL, teks, elemen visible, response API]
- [Hasil observable lainnya]

> **💡 Tips "Hasil" yang observable:**
>
> | ❌ Buruk                   | ✅ Baik                                                                     |
> | -------------------------- | --------------------------------------------------------------------------- |
> | "User berhasil login"      | "URL berubah ke `/dashboard`"                                               |
> | "Sistem menampilkan pesan" | "Muncul teks merah 'Email atau password salah'"                             |
> | "Data tersimpan"           | "Tombol 'Simpan' berubah jadi disabled, ada toast 'Data berhasil disimpan'" |
> | "Loading cepat"            | "Halaman `/dashboard` tampil dalam < 2 detik"                               |

### SC-02: [Nama Skenario — Negative Case]

**Prekondisi:** [State awal]

**Langkah:**

1. [Aksi yang seharusnya GAGAL / menampilkan error]
2. [Aksi]

**Hasil:**

- [Observable: error message, URL tetap, validation visible]
- [Observable lainnya]

### SC-03: [Nama Skenario Manual] (@manual)

**Prekondisi:** [State awal]

**Langkah:**

1. [Aksi yang butuh intervensi manusia]

**Hasil:**

- [Observable manual — WAJIB jelaskan kenapa `@manual`. Misal: "Login berhasil — verifikasi manual karena CAPTCHA tidak bisa di-automate"]

> **💡 Kapan pakai `(@manual)`?**
>
> Pakai tag ini di judul scenario kalau:
>
> - Butuh **CAPTCHA** atau reCAPTCHA (gak bisa di-automate tanpa bypass)
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
- [ ] Minimal 1 bullet di `## Kriteria Penerimaan` dan semuanya observable
- [ ] Setiap `### SC-XX` punya `**Prekondisi:**` (kalau relevan), `**Langkah:**` (numbered list), `**Hasil:**` (bullet observable)
- [ ] Skenario non-otomatis ditandai `(@manual)` di judul
- [ ] `@manual` scenario punya alasan jelas di **Hasil:**
- [ ] File sudah divalidasi: `npm run validate:requirement -- requirements/nama-fitur.md` (exit 0)

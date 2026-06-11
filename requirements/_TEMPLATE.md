# REQ-XXX: [Judul Fitur]

<!--
  PANDUAN SINGKAT (hapus blok komentar ini sebelum commit):
  - Salin file ini → requirements/nama-fitur.md
  - Isi semua section di bawah
  - Label **Langkah:** dan **Hasil:** harus persis (bold + titik dua)
  - Heading skenario harus ### (tiga hash)
  - Hasil harus observable: URL, teks, visibility — bukan "berjalan baik"
  - Tambahkan (@manual) di judul skenario yang tidak bisa diotomatisasi (CAPTCHA, email nyata)
-->

## Metadata

- **Tags:** #ui #auth
- **Prioritas:** medium
- **Auth state:** unauthenticated
- **Halaman awal:** /login
- **POM yang dibutuhkan:** loginPage, dashboardPage

## Kriteria Penerimaan

- Pengguna dapat [aksi yang dapat diamati].
- Sistem harus [validasi atau respons yang dapat diverifikasi].

## Skenario Uji

### SC-01: [Nama skenario — happy path]

**Prekondisi:** Pengguna berada di halaman login, belum login
**Langkah:**

1. Buka halaman login
2. Lakukan [aksi user konkret]
3. Verifikasi [elemen atau state]

**Hasil:**

- URL berubah ke [path yang diharapkan]
- Elemen [nama elemen] tampil dengan teks [teks yang diharapkan]

### SC-02: [Nama skenario — negative case]

**Prekondisi:** Pengguna berada di halaman login, belum login
**Langkah:**

1. Buka halaman login
2. Masukkan data tidak valid
3. Klik tombol submit

**Hasil:**

- Pesan error "[teks error]" tampil di layar
- Pengguna tetap di halaman login

### SC-03: [Nama skenario non-otomatis] (@manual)

**Prekondisi:** [state awal]
**Langkah:**

1. [langkah yang membutuhkan intervensi manual]

**Hasil:**

- [hasil yang hanya bisa diverifikasi manual — jelaskan alasan @manual]

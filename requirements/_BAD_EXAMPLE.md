# REQ-AUTH-099: Login Feature

<!--
  PERINGATAN: Ini contoh requirement yang BURUK.
  Digunakan untuk对比 supaya QA pemula belajar apa yang harus dihindari.

  Validasi file ini akan GAGAL dengan banyak error:
  $ npm run validate:requirement -- requirements/_BAD_EXAMPLE.md
  ✗ Judul terlalu generik
  ✗ Metadata tidak lengkap
  ✗ Skenario tidak punya Langkah/Hasil observable
  ✗ Kriteria penerimaan tidak observable
  ✗ Skenario @manual tanpa alasan
-->

## Metadata

<!-- ❌ BURUK: Tags kosong, Prioritas tidak spesifik, Auth state tidak jelas -->

- **Tags:**
- **Prioritas:**
- **Auth state:**
- **Halaman awal:**

## Kriteria Penerimaan

<!-- ❌ BURUK: Terlalu generik, tidak observable -->

- Login harus bekerja dengan baik dan cepat
- Sistem harus aman
- User harus senang dengan fitur ini
- Handle semua error dengan appropriate response

## Skenario Uji

<!-- ❌ BURUK: Skenario tanpa Prekondisi, Langkah terlalu vague, Hasil tidak observable -->

### SC-01: Login

<!-- ❌ Tidak ada Prekondisi -->

**Langkah:**

<!-- ❌ Langkah tidak spesifik, tidak actionable -->

1. User coba login
2. Klik tombol
3. Selesai

**Hasil:**

<!-- ❌ Hasil subjektif, tidak observable -->

- Login berhasil
- Sistem bekerja dengan baik

### SC-02: Login Gagal

**Langkah:**

1. User input data salah
2. Submit

**Hasil:**

- Muncul error
- User tau ada masalah

### SC-03: Login dengan Google

<!-- ❌ Tidak ada tag (@manual), padahal OAuth butuh intervensi -->

**Langkah:**

1. Klik tombol Google
2. Pilih akun
3. Allow

**Hasil:**

- Berhasil login

<!-- ❌ SC-04: Empty heading tanpa konten apa-apa — parser akan reject -->

### SC-04: Edge case

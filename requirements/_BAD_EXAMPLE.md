# Invalid Title Without REQ Prefix

<!--
  PERINGATAN: Ini contoh requirement yang BURUK (v2.0).
  Digunakan untuk perbandingan supaya QA pemula belajar apa yang harus dihindari.
  Validasi file ini akan menghasilkan error dan warning terstruktur.
-->

## Metadata

- **Tags:**
- **Prioritas:**
- **Auth state:**
- **Halaman awal:**

## Kriteria Penerimaan

- Login harus bekerja dengan baik dan cepat
- Sistem harus aman
- User harus senang dengan fitur ini

## Skenario Uji

### SC-01: Login

- **Covers:** `AC-99`

**Langkah:**

1. User coba login
2. Klik tombol

**Hasil:**

- Login berhasil dan menyenangkan

---

### SC-02: Login Gagal

**Langkah:**

1. User input data salah
2. Submit

**Hasil:**

- Muncul error

---

### SC-03: Login dengan Google (@manual)

**Langkah:**

1. Klik tombol Google
2. Pilih akun

**Hasil:**

- Berhasil login

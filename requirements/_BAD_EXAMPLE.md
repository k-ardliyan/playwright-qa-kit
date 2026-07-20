# REQ-AUTH-099: Login Feature

<!--
  PERINGATAN: Ini contoh requirement yang BURUK.
  Digunakan untuk perbandingan supaya QA pemula belajar apa yang harus dihindari.

  Validasi file ini akan GAGAL dengan banyak error:
  $ npm run validate:requirement -- requirements/_BAD_EXAMPLE.md

  Error yang diharapkan:
  ✗ title_required (format judul salah — tidak ada REQ-XXX yang valid)
  ✗ metadata_tags_required (Tags kosong)
  ✗ metadata_auth_required (Auth state tidak diisi)
  ✗ observable_result (Hasil subjektif, tidak observable)
  ✗ manual_reason (SC-03 tandai @manual tapi tidak ada alasan)

  Warning yang diharapkan:
  ✗ failure_scenario_recommended (ada kata "gagal" tapi tidak ada (@failure) tag)
  ✗ test_id_missing (tidak ada Test ID per skenario)
  ✗ expected_result_format (pakai "Hasil:" bukan "Hasil yang Diharapkan:")
-->

## Metadata

<!-- ❌ BURUK: Tags kosong, Auth state tidak jelas -->

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

<!-- ❌ BURUK: Tidak pakai tag tipe scenario, Langkah vague, Hasil tidak observable -->
<!-- ❌ BURUK: Tidak ada Test ID, tidak ada Input Data, pakai "Hasil:" bukan "Hasil yang Diharapkan:" -->

### SC-01: Login

<!-- ❌ Tidak ada Prekondisi, tidak ada Test ID -->

**Langkah:**

<!-- ❌ Langkah tidak spesifik, tidak actionable -->

1. User coba login
2. Klik tombol
3. Selesai

**Hasil:**

<!-- ❌ Hasil subjektif, tidak observable — validator akan warn "observable_result" -->
<!-- ❌ Pakai "Hasil:" bukan "Hasil yang Diharapkan:" -->

- Login berhasil
- Sistem bekerja dengan baik

---

### SC-02: Login Gagal

<!-- ❌ Tidak ada tag (@failure) padahal ini negative path -->
<!-- ❌ Tidak ada Test ID, tidak ada Input Data -->

**Langkah:**

1. User input data salah
2. Submit

**Hasil:**

- Muncul error
- User tau ada masalah

---

### SC-03: Login dengan Google (@manual)

<!-- ❌ Ada tag (@manual) tapi tidak ada alasan di Hasil yang Diharapkan -->
<!-- ❌ Tidak ada Test ID -->

**Langkah:**

1. Klik tombol Google
2. Pilih akun
3. Allow

**Hasil:**

- Berhasil login

---

### SC-04: Edge Case

<!-- ❌ Tidak ada Langkah dan Hasil — parser akan reject "scenario_structure" -->
<!-- ❌ Tidak ada Test ID -->

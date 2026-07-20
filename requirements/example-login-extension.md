# REQ-AUTH-002: Login — Validasi Field Kosong

<!--
  Contoh latihan pipeline + referensi format valid.
  Pipeline generate selalu ke src/tests/ (import @/fixtures/base.fixture).
  Path B (ERPKU adapter): jalankan smoke; jangan generate ke example/erpku/tests/.
  Prompt: docs/GUIDE.md — section "Prompt Siap Pakai"
-->

## Metadata

- **Tags:** #auth #ui #regression
- **Prioritas:** medium
- **Auth state:** unauthenticated
- **Halaman awal:** /login
- **POM yang dibutuhkan:** loginPage

## Kriteria Penerimaan

- Form login menolak submit ketika field username/email kosong
- Form login menolak submit ketika field password kosong
- Pesan validasi tampil di dekat field yang kosong

## Skenario Uji

### SC-01: Submit dengan Username Kosong (@failure)

- **Test ID:** `TC-AUTH-EXT-001`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE`

**Prekondisi:** Pengguna berada di halaman login, belum login

**Input Data:**

- username: (kosong)
- password: ValidPass123!

**Langkah:**

1. Buka halaman login
2. Biarkan field username/email kosong
3. Isi field password dengan nilai valid
4. Klik tombol login

**Hasil yang Diharapkan:**

- Pengguna tetap di halaman login (URL mengandung `/login`)
- Pesan validasi terkait username/email tampil di layar

---

### SC-02: Submit dengan Password Kosong (@failure)

- **Test ID:** `TC-AUTH-EXT-002`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE`

**Prekondisi:** Pengguna berada di halaman login, belum login

**Input Data:**

- username: qa.test@example.com
- password: (kosong)

**Langkah:**

1. Buka halaman login
2. Isi field username/email dengan kredensial valid
3. Biarkan field password kosong
4. Klik tombol login

**Hasil yang Diharapkan:**

- Pengguna tetap di halaman login (URL mengandung `/login`)
- Pesan validasi terkait password tampil di layar

---

### SC-03: Submit dengan Username dan Password Kosong (@failure)

- **Test ID:** `TC-AUTH-EXT-003`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE`

**Prekondisi:** Pengguna berada di halaman login, belum login

**Input Data:**

- username: (kosong)
- password: (kosong)

**Langkah:**

1. Buka halaman login
2. Biarkan field username/email kosong
3. Biarkan field password kosong
4. Klik tombol login

**Hasil yang Diharapkan:**

- Pengguna tetap di halaman login (URL mengandung `/login`)
- Pesan validasi untuk username/email tampil di layar
- Pesan validasi untuk password tampil di layar

---

### SC-04: Verifikasi CAPTCHA pada Login (@manual)

- **Test ID:** `TC-AUTH-EXT-004`
- **Prioritas skenario:** `low`

**Prekondisi:** CAPTCHA aktif di halaman login

**Langkah:**

1. Buka halaman login
2. Isi kredensial valid
3. Selesaikan CAPTCHA secara manual

**Hasil yang Diharapkan:**

- Login berhasil hanya setelah CAPTCHA benar — verifikasi manual diperlukan karena CAPTCHA tidak
  dapat diotomasi

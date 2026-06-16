# REQ-AUTH-002: Login — Validasi Field Kosong

<!--
  Contoh latihan workshop Path A + referensi format valid.
  Pipeline generate selalu ke src/tests/ (import @/fixtures/base.fixture).
  Path B: jalankan smoke adapter; jangan generate ke example/erpku/tests/.
  Prompt: docs/prompt-ai-agent.md — bagian "Contoh konkret"
-->

## Metadata

- **Tags:** #auth #ui #regression
- **Prioritas:** medium
- **Auth state:** unauthenticated
- **Halaman awal:** /login
- **POM yang dibutuhkan:** loginPage

## Kriteria Penerimaan

- Form login menolak submit ketika field username/email kosong.
- Form login menolak submit ketika field password kosong.
- Pesan validasi tampil di dekat field yang kosong.

## Skenario Uji

### SC-01: Submit dengan username kosong

**Prekondisi:** Pengguna berada di halaman login, belum login
**Langkah:**

1. Buka halaman login
2. Biarkan field username/email kosong
3. Isi field password dengan nilai valid
4. Klik tombol login

**Hasil:**

- Pengguna tetap di halaman login (URL mengandung `/login`)
- Pesan validasi terkait username/email tampil di layar

### SC-02: Submit dengan password kosong

**Prekondisi:** Pengguna berada di halaman login, belum login
**Langkah:**

1. Buka halaman login
2. Isi field username/email dengan kredensial valid
3. Biarkan field password kosong
4. Klik tombol login

**Hasil:**

- Pengguna tetap di halaman login (URL mengandung `/login`)
- Pesan validasi terkait password tampil di layar

### SC-03: Verifikasi CAPTCHA pada login (@manual)

**Prekondisi:** CAPTCHA aktif di halaman login
**Langkah:**

1. Buka halaman login
2. Isi kredensial valid
3. Selesaikan CAPTCHA secara manual

**Hasil:**

- Login berhasil hanya setelah CAPTCHA benar — verifikasi manual diperlukan karena CAPTCHA tidak dapat diotomatisasi

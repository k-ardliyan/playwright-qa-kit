# Login — Validasi Field Kosong Test Plan

**Seed:** `src/tests/seed.spec.ts`
**Requirement:** `requirements/example-login-extension.md`

## Application Overview

Halaman login ERP menolak submit ketika field username/email atau password kosong. Pengguna harus tetap di `/login` dan melihat pesan validasi di dekat field yang kosong. Auth state: unauthenticated. POM: `loginPage`. Tags: `@auth`, `@ui`, `@regression`.

## Test Scenarios

### SC-01: Submit dengan username kosong

**Seed:** `src/tests/seed.spec.ts`

| Scenario Name                        | Steps                                                                                                                                                                               | Expected Result                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| SC-01: Submit dengan username kosong | Given: Pengguna berada di halaman login, belum login; 1. Buka halaman login; 2. Biarkan field username/email kosong; 3. Isi field password dengan nilai valid; 4. Klik tombol login | Pengguna tetap di halaman login (URL mengandung `/login`); Pesan validasi terkait username/email tampil di layar |

### SC-02: Submit dengan password kosong

**Seed:** `src/tests/seed.spec.ts`

| Scenario Name                        | Steps                                                                                                                                                                                    | Expected Result                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| SC-02: Submit dengan password kosong | Given: Pengguna berada di halaman login, belum login; 1. Buka halaman login; 2. Isi field username/email dengan kredensial valid; 3. Biarkan field password kosong; 4. Klik tombol login | Pengguna tetap di halaman login (URL mengandung `/login`); Pesan validasi terkait password tampil di layar |

### SC-03: Verifikasi CAPTCHA pada login (@manual)

**Seed:** `src/tests/seed.spec.ts`

| Scenario Name                                  | Steps                                                                                                                      | Expected Result                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| SC-03: Verifikasi CAPTCHA pada login (@manual) | Given: CAPTCHA aktif di halaman login; 1. Buka halaman login; 2. Isi kredensial valid; 3. Selesaikan CAPTCHA secara manual | Login berhasil hanya setelah CAPTCHA benar — verifikasi manual diperlukan (@manual) |

# REQ-AUTH-001: Login — Akun Valid ke Dashboard

> **Contoh requirement yang BAIK** — digunakan sebagai referensi untuk menulis requirement baru.
> File ini divalidasi `validate_requirement` dengan exit 0.

## Metadata

- **Tags:** #auth #ui #smoke #regression
- **Prioritas:** high
- **Auth state:** unauthenticated
- **Halaman awal:** /login
- **POM yang dibutuhkan:** loginPage, dashboardPage

## Kriteria Penerimaan

- Pengguna dapat login dengan email + password valid dan diredirect ke `/dashboard` dalam < 3 detik
- Setelah login berhasil, header dashboard menampilkan greeting dengan nama user
- Session cookie tersimpan dengan expiry 24 jam
- Login gagal dengan kredensial invalid menampilkan error message yang jelas tanpa membocorkan info
  (misal: "Email atau password salah", BUKAN "Email tidak ditemukan")
- Form login menolak submit ketika field email kosong (HTML5 validation atau JS validation)
- Form login menolak submit ketika field password kosong

## Skenario Uji

### SC-01: Login Berhasil dengan Email dan Password Valid (@success)

- **Test ID:** `TC-AUTH-001`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:** Pengguna berada di halaman `/login`, akun `qa.test@example.com` terdaftar dengan
password `Test1234!`, user belum login.

**Input Data:**

- email: qa.test@example.com
- password: Test1234!

**Langkah:**

1. Ketik `qa.test@example.com` di field Email
2. Ketik `Test1234!` di field Password
3. Klik tombol "Masuk"

**Hasil yang Diharapkan:**

- URL browser berubah ke `/dashboard`
- Header dashboard menampilkan teks "Selamat datang, QA Test"
- Tombol "Logout" terlihat di pojok kanan atas header
- Cookie `session_id` ada di browser DevTools > Application > Cookies

---

### SC-02: Login Gagal dengan Password Salah (@failure)

- **Test ID:** `TC-AUTH-002`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:** Pengguna di `/login`, akun `qa.test@example.com` ada, password yang dipakai salah.

**Input Data:**

- email: qa.test@example.com
- password: WrongPass

**Langkah:**

1. Ketik `qa.test@example.com` di field Email
2. Ketik `WrongPass` di field Password
3. Klik tombol "Masuk"

**Hasil yang Diharapkan:**

- URL tetap di `/login` (tidak redirect)
- Muncul pesan error merah di bawah form: "Email atau password salah"
- Field password di-clear (kosong kembali)
- Tombol "Masuk" kembali enabled (tidak stuck di loading)

---

### SC-03: Submit dengan Email Kosong (@failure)

- **Test ID:** `TC-AUTH-003`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE`

**Prekondisi:** Pengguna di `/login`, field Email kosong.

**Input Data:**

- email: (kosong)
- password: Test1234!

**Langkah:**

1. Biarkan field Email kosong
2. Ketik `Test1234!` di field Password
3. Klik tombol "Masuk"

**Hasil yang Diharapkan:**

- Submit form ter-block (validasi muncul di field Email)
- URL tetap di `/login`
- Tidak ada request POST ke `/api/login`

---

### SC-04: Akun Terkunci Setelah 5 Kali Gagal (@failure)

- **Test ID:** `TC-AUTH-004`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:** Pengguna di `/login`, akun `qa.test@example.com` sudah pernah gagal login 4 kali
berturut-turut.

**Input Data:**

- email: qa.test@example.com
- password: WrongPass

**Langkah:**

1. Ketik `qa.test@example.com` di field Email
2. Ketik `WrongPass` di field Password
3. Klik tombol "Masuk" (ini kegagalan ke-5)

**Hasil yang Diharapkan:**

- URL tetap di `/login`
- Muncul pesan error: "Akun terkunci karena 5 kali gagal. Coba lagi dalam 15 menit."
- Field login disabled (abu-abu, tidak bisa diketik)
- API call `/api/auth/lock-status` return `{ locked: true, until: <timestamp> }`

---

### SC-05: Login dengan Google OAuth (@manual)

- **Test ID:** `TC-AUTH-005`
- **Prioritas skenario:** `low`

**Prekondisi:** Pengguna di `/login`, punya akun Google aktif, popup OAuth tidak di-block browser.

**Langkah:**

1. Klik tombol "Login dengan Google"
2. Pilih akun Google di popup OAuth
3. Klik tombol "Allow" di halaman permission Google

**Hasil yang Diharapkan:**

- URL kembali ke `/dashboard?oauth=success`
- Session tersimpan, greeting "Selamat datang" tampil
- Verifikasi manual diperlukan karena OAuth popup + akun Google asli tidak bisa diotomasi dari CI

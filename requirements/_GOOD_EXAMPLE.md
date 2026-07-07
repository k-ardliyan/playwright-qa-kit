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
- Login gagal dengan kredensial invalid menampilkan error message yang jelas tanpa membocorkan info (misal: "Email atau password salah", BUKAN "Email tidak ditemukan")
- Form login menolak submit ketika field email kosong (HTML5 validation atau JS validation)
- Form login menolak submit ketika field password kosong

## Skenario Uji

### SC-01: Login Berhasil dengan Email dan Password Valid

**Prekondisi:** Pengguna berada di halaman `/login`, akun `qa.test@example.com` terdaftar dengan password `Test1234!`, user belum login.

**Langkah:**

1. Ketik `qa.test@example.com` di field Email
2. Ketik `Test1234!` di field Password
3. Klik tombol "Masuk"

**Hasil:**

- URL browser berubah ke `/dashboard`
- Header dashboard menampilkan teks "Selamat datang, QA Test"
- Tombol "Logout" terlihat di pojok kanan atas header
- Cookie `session_id` ada di browser DevTools > Application > Cookies

### SC-02: Login Gagal dengan Password Salah

**Prekondisi:** Pengguna di `/login`, akun `qa.test@example.com` ada, password yang dipakai salah (`WrongPass`).

**Langkah:**

1. Ketik `qa.test@example.com` di field Email
2. Ketik `WrongPass` di field Password
3. Klik tombol "Masuk"

**Hasil:**

- URL tetap di `/login` (tidak redirect)
- Muncul pesan error merah di bawah form: "Email atau password salah"
- Field password di-clear (kosong kembali)
- Tombol "Masuk" kembali enabled (gak stuck di loading)

### SC-03: Submit dengan Email Kosong

**Prekondisi:** Pengguna di `/login`, field Email kosong.

**Langkah:**

1. Biarkan field Email kosong
2. Ketik `Test1234!` di field Password
3. Klik tombol "Masuk"

**Hasil:**

- Submit form ter-block (HTML5 validation muncul: "Please fill out this field" di field Email)
- URL tetap di `/login`
- Tidak ada request POST ke `/api/login` di Network tab

### SC-04: Login dengan Google OAuth (@manual)

**Prekondisi:** Pengguna di `/login`, punya akun Google aktif, popup OAuth tidak di-block browser.

**Langkah:**

1. Klik tombol "Login dengan Google"
2. Pilih akun Google di popup OAuth
3. Klik tombol "Allow" di halaman permission Google

**Hasil:**

- URL kembali ke `/dashboard?oauth=success`
- Session tersimpan, greeting "Selamat datang" tampil
- Verifikasi manual diperlukan karena OAuth popup + akun Google asli tidak bisa di-automate dari CI

### SC-05: Akun Terkunci Setelah 5 Kali Gagal

**Prekondisi:** Pengguna di `/login`, akun `qa.test@example.com` sudah pernah gagal login 4 kali berturut-turut.

**Langkah:**

1. Ketik `qa.test@example.com` di field Email
2. Ketik `WrongPass` di field Password
3. Klik tombol "Masuk" (ini kegagalan ke-5)

**Hasil:**

- URL tetap di `/login`
- Muncul pesan error: "Akun terkunci karena 5 kali gagal. Coba lagi dalam 15 menit."
- Field login disabled (abu-abu, tidak bisa diketik)
- API call `/api/auth/lock-status` return `{ locked: true, until: <timestamp> }`

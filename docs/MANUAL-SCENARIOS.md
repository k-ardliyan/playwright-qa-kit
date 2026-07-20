# Panduan Skenario `@manual`

Panduan ini untuk QA yang ingin tahu kapan dan bagaimana menandai skenario sebagai `(@manual)`.

---

## Apa itu Skenario `@manual`?

Skenario yang ditandai `(@manual)` di judul `### SC-XX: ...` berarti tidak bisa diotomasi dengan Playwright. Pipeline AI tetap mengenali dan memprosesnya, tapi Generator akan menghasilkan `test.skip(true, 'Manual: <alasan>')` — bukan test yang bisa dijalankan.

```markdown
### SC-04: Login dengan Google OAuth (@manual)
```

---

## Tipe Skenario — Konteks Lebih Luas

`(@manual)` adalah salah satu dari empat tipe skenario resmi:

| Tag                     | Artinya                                     | Di-generate sebagai              |
| ----------------------- | ------------------------------------------- | -------------------------------- |
| `(@success)`            | Happy path — alur normal berhasil           | Test penuh                       |
| `(@failure)`            | Negative path — input salah, validasi gagal | Test dengan assertion error      |
| `(@access-restriction)` | Role tidak berhak, akses ditolak            | Test yang assert penolakan akses |
| `(@manual)`             | Tidak bisa diotomasi                        | `test.skip` dengan alasan        |

Jika tidak diberi tag, skenario dianggap `(@success)` secara default.

---

## Kapan Pakai `(@manual)`?

Tandai `(@manual)` kalau skenario membutuhkan salah satu dari ini:

| Situasi                | Contoh                           | Kenapa Manual                              |
| ---------------------- | -------------------------------- | ------------------------------------------ |
| CAPTCHA / reCAPTCHA    | Login form pakai reCAPTCHA       | Tidak bisa diotomasi tanpa bypass (ilegal) |
| OTP / SMS verification | Login dengan SMS OTP             | Butuh akses ke HP asli                     |
| Email verification     | Konfirmasi signup via email link | Butuh inbox asli                           |
| Payment gateway        | Charge kartu kredit              | Butuh kartu test spesifik + 3DS callback   |
| Biometric              | Login sidik jari / Face ID       | Tidak bisa disimulasi di CI                |
| Visual review          | Cek layout invoice PDF           | Butuh verifikasi mata manusia              |
| Hardware interaction   | Scan barcode, print struk        | Tidak ada di environment CI                |
| Real-world timing      | Tunggu 24 jam untuk expiry test  | Tidak feasible di CI                       |

---

## Kapan TIDAK Pakai `(@manual)`?

Jangan pakai `(@manual)` hanya karena "ribet" — biasanya bisa diotomasi dengan effort tambahan.

- Login biasa → tinggal cari selector + isi form
- Klik tombol + lihat alert → `page.on('dialog')` bisa handle
- Upload file → `setInputFiles()` bisa handle
- Drag-and-drop → `page.dragAndDrop()` bisa handle

Kalau ragu, tanya maintainer framework dulu sebelum tandai `(@manual)`.

---

## Cara Tandai `(@manual)`

### Step 1: Tambah tag di judul skenario

```markdown
### SC-04: Login dengan Google OAuth (@manual)
```

### Step 2: Jelaskan alasan di bagian Hasil

```markdown
### SC-04: Login dengan Google OAuth (@manual)

**Prekondisi:** Pengguna di halaman login, Google OAuth aktif

**Langkah:**

1. Buka halaman login
2. Klik tombol "Login dengan Google"
3. Ikuti flow OAuth Google

**Hasil:**

- Login berhasil dan user diarahkan ke dashboard — tidak bisa diotomasi
  karena butuh akses akun Google nyata dan OAuth consent screen
```

Validator akan memberi warning jika `@manual` tidak punya alasan di bagian Hasil.

---

## Cara Cek Skenario `@manual` yang Pending

```bash
npm run manual:check
```

Output akan menampilkan semua skenario `(@manual)` di seluruh folder `requirements/` beserta alasannya.

---

## Do's and Don'ts

**Lakukan:**

- Tulis alasan yang jelas di bagian Hasil — bukan hanya "manual"
- Review skenario `(@manual)` secara berkala — banyak yang bisa diotomasi setelah tools berkembang
- Pertimbangkan `(@access-restriction)` untuk skenario "role tidak berhak akses" — itu bisa diotomasi

**Hindari:**

- Tandai `(@manual)` untuk hal yang sebenarnya bisa diotomasi Playwright
- Tambah `(@manual)` tanpa alasan jelas di Hasil — validator akan warning
- Salah gunakan `(@manual)` padahal seharusnya `(@failure)` atau `(@access-restriction)`

---

## Kapan Eskalasi ke Maintainer Framework

Tanya Framework Maintainer kalau:

- Tidak yakin apakah skenario bisa diotomasi
- Butuh setup khusus (simulator OTP, sandbox payment gateway)
- Ingin convert skenario `(@manual)` jadi automatable tapi butuh library baru

---

## Lihat Juga

- [requirements/_TEMPLATE.md](../requirements/_TEMPLATE.md) — format skenario lengkap
- [requirements/README.md](../requirements/README.md) — panduan tipe skenario dan role-aware
- [docs/writing-requirements.md](writing-requirements.md) — cara menulis requirement
- [docs/GUIDE.md](GUIDE.md) — panduan QA utama

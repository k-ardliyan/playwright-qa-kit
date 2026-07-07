# Panduan Skenario `@manual`

> Panduan ini untuk **QA non-coder pemula** yang ingin tahu kapan dan bagaimana menandai skenario sebagai `(@manual)`.

## Apa itu Skenario `@manual`?

Skenario yang ditandai `(@manual)` di judul heading `### SC-XX: ...` berarti **tidak bisa di-automate** dengan Playwright. Pipeline AI tetap akan mengenali dan memprosesnya, tapi akan di-skip saat eksekusi test.

**Contoh:**

```markdown
### SC-04: Login dengan Google OAuth (@manual)
```

## Kapan Pakai `(@manual)`?

Tandai `(@manual)` kalau skenario membutuhkan salah satu dari ini:

| Situasi                    | Contoh                           | Kenapa Manual                                           |
| -------------------------- | -------------------------------- | ------------------------------------------------------- |
| **CAPTCHA / reCAPTCHA**    | Login form pakai reCAPTCHA       | Gak bisa di-automate tanpa bypass (ilegal + unreliable) |
| **OTP / SMS verification** | Login dengan SMS OTP             | Butuh akses ke HP asli                                  |
| **Email verification**     | Konfirmasi signup via email link | Butuh inbox asli                                        |
| **Payment gateway**        | Charge kartu kredit              | Butuh kartu test spesifik + 3DS callback                |
| **Biometric**              | Login sidik jari / Face ID       | Gak bisa simulasi di CI                                 |
| **Visual review**          | Cek layout invoice PDF           | Butuh mata manusia untuk verifikasi visual              |
| **Hardware interaction**   | Scan barcode, print struk        | Gak ada di environment CI                               |
| **Real-world timing**      | Tunggu 24 jam untuk expiry test  | Gak feasible di CI                                      |

## Kapan TIDAK Pakai `(@manual)`?

Jangan pakai `(@manual)` kalau cuma karena "ribet" — biasanya bisa di-automate dengan effort tambahan.

**Contoh salah:**

- ❌ `(@manual)` untuk login biasa → tinggal cari selector + isi form
- ❌ `(@manual)` untuk klik tombol + lihat alert → `page.on('dialog')` bisa handle
- ❌ `(@manual)` untuk upload file → `setInputFiles()` bisa handle
- ❌ `(@manual)` untuk drag-and-drop → `page.dragAndDrop()` bisa handle

Kalau ragu, **tanya maintainer framework** dulu sebelum tandai `(@manual)`.

## Cara Tandai `(@manual)`

### Step 1: Tambah tag di judul skenario

```markdown
### SC-04: Login dengan Google OAuth (@manual)
```

### Step 2: Jelaskan alasan di bagian **Hasil:**

```markdown
### SC-04: Login dengan Google OAuth (@manual)

**Prekondisi:** Pengguna di `/login`, punya akun Google aktif, popup OAuth tidak di-block browser.

**Langkah:**

1. Klik tombol "Login dengan Google"
2. Pilih akun Google di popup OAuth
3. Klik tombol "Allow" di halaman permission Google

**Hasil:**

- URL kembali ke `/dashboard?oauth=success`
- Session tersimpan, greeting "Selamat datang" tampil
- **Verifikasi manual diperlukan karena OAuth popup + akun Google asli tidak bisa di-automate dari CI**
```

> **Penting:** Validator `validate_requirement` akan **warning** (bukan error) kalau `@manual` tidak punya penjelasan di Hasil.

## Apa yang Terjadi Saat Pipeline Jalan?

| Tahap        | Perilaku                                                    |
| ------------ | ----------------------------------------------------------- |
| **Validate** | Warning kalau `@manual` tanpa alasan (tidak block pipeline) |
| **Plan**     | Planner tetap masukkan ke test plan                         |
| **Generate** | Hasilkan `test.skip(true, 'Manual: <alasan>')` di spec file |
| **Execute**  | Test di-skip otomatis, gak dijalankan                       |
| **Report**   | Status `skipped` di coverage section                        |

## Workflow untuk QA Pemula

### Step 1: Tandai di requirement

Seperti contoh di atas. Format persis:

```markdown
### SC-XX: Nama Skenario (@manual)

**Prekondisi:** ...
**Langkah:**

1. ...

**Hasil:**

- ...
- **Verifikasi manual diperlukan karena <alasan>**
```

### Step 2: Jalanin pipeline seperti biasa

```bash
npm run qa:run -- requirements/fitur-saya.md
```

Skenario `@manual` akan otomatis ke-skip. Pipeline tetap lanjut.

### Step 3: Cek manual checklist

Setelah pipeline selesai, lihat report dashboard. Skenario `@manual` muncul di section "Skipped" dengan alasan.

### Step 4: Eksekusi manual + catat hasil

Jalankan langkah-langkah skenario secara manual di browser:

1. Buka URL yang dimaksud
2. Ikuti **Langkah** satu per satu
3. Verifikasi **Hasil** sama dengan yang tertulis di requirement
4. Catat hasil di spreadsheet/Notion tim QA

### Step 5: Update status (opsional, future)

Saat dashboard interaktif tersedia, klik checklist untuk tandai `☑ done` / `☐ pending`.

## Cek Semua Skenario Manual

Untuk lihat semua skenario `(@manual)` dari semua requirement file:

```bash
npm run manual:check
```

Output:

```
📋 Manual Scenarios Summary
════════════════════════════════════════════════

REQ-AUTH-001 (requirements/login.md):
  ☑ SC-04: Login dengan Google OAuth — done (2026-07-01 oleh QA-Andi)
  ☐ SC-07: Forgot password via email — pending

REQ-CHECKOUT-002 (requirements/checkout.md):
  ☐ SC-03: Bayar dengan kartu kredit — pending

Total: 3 manual scenarios (1 done, 2 pending)
```

## Best Practices

### ✅ DO

- ✅ Kasih **alasan jelas** di **Hasil:** (misal: "Butuh OTP dari HP", "CAPTCHA tidak bisa di-automate")
- ✅ Pisahkan skenario manual vs otomatis di requirement berbeda kalau bisa (lebih mudah review)
- ✅ Review skenario `(@manual)` **setiap release** — kalau CAPTCHA pindah ke reCAPTCHA v3 (automatable), hapus `(@manual)`
- ✅ Gunakan **unique timestamps / account test** di Prekondisi untuk skenario manual biar gak conflict dengan run paralel

### ❌ DON'T

- ❌ Jangan `@manual` hanya karena "ribet" — effort automation selalu worth it
- ❌ Jangan `@manual` untuk hal yang sebenarnya bisa di-automate dengan library Playwright (upload, drag, dialog, dll)
- ❌ Jangan `@manual` tanpa alasan di Hasil — validator akan warning
- ❌ Jangan tambah banyak `(@manual)` tanpa review berkala — biasanya bisa di-automate nanti saat tool lebih成熟

## Kapan Eskalasi

Tanya **Framework Maintainer** kalau:

- Tidak yakin apakah skenario bisa di-automate
- Butuh setup khusus (misal: simulator OTP, sandbox payment gateway)
- Ingin convert skenario `(@manual)` jadi automatable tapi butuh library baru

## Lihat Juga

- [requirements/_TEMPLATE.md](../requirements/_TEMPLATE.md) — format skenario lengkap
- [requirements/_GOOD_EXAMPLE.md](../requirements/_GOOD_EXAMPLE.md) — contoh requirement dengan `@manual`
- [docs/writing-requirements.md](writing-requirements.md) — cara menulis requirement
- [docs/GUIDE.md](GUIDE.md) — panduan QA utama

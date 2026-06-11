# Prompt untuk AI Eksternal (ChatGPT / Gemini)

Salin seluruh blok di bawah ke chat AI eksternal. Ganti `[CATATAN QA ANDA]` dengan catatan kasar tim QA.

---

## System / Instruksi (salin ke AI)

```
Kamu adalah asisten QA yang merapikan catatan uji menjadi dokumen requirement terstruktur.

TUGAS:
Konversi catatan QA di bawah menjadi satu file Markdown requirement sesuai template PERSIS.

ATURAN WAJIB:
1. Output HANYA Markdown mentah — tanpa penjelasan, tanpa kode Playwright, tanpa blok code fence.
2. Judul dokumen: # REQ-XXX: [Judul Fitur] (gunakan ID REQ jika ada di catatan, atau buat REQ-01).
3. Wajib ada section: ## Metadata, ## Kriteria Penerimaan, ## Skenario Uji.
4. Setiap skenario WAJIB pakai heading ### dan label persis:
   - **Prekondisi:** (jika relevan)
   - **Langkah:** (diikuti numbered list 1. 2. 3.)
   - **Hasil:** (diikuti bullet observable)
5. JANGAN ubah label **Langkah:** dan **Hasil:** — parser sistem hanya mengenali format bold + colon ini.
6. Hasil harus observable: URL, teks yang tampil, visibility elemen — BUKAN "berjalan baik" atau "sukses" tanpa detail.
7. Skenario yang tidak bisa diotomatisasi (CAPTCHA, email nyata, OTP SMS) → tambahkan (@manual) di judul ###.
8. Metadata minimal: Tags (#ui #auth dll), Auth state (unauthenticated/authenticated), Halaman awal.
9. Tulis dalam Bahasa Indonesia.

TEMPLATE STRUKTUR:

# REQ-XXX: [Judul Fitur]

## Metadata
- **Tags:** #ui
- **Prioritas:** high | medium | low
- **Auth state:** unauthenticated | authenticated
- **Halaman awal:** /path
- **POM yang dibutuhkan:** loginPage

## Kriteria Penerimaan
- [bullet observable]

## Skenario Uji

### SC-01: [Nama]
**Prekondisi:** ...
**Langkah:**
1. ...
**Hasil:**
- ...

CATATAN QA:
[CATATAN QA ANDA]
```

---

## Setelah AI Menghasilkan Output

1. Salin Markdown hasil AI.
2. Buat file baru: `requirements/nama-fitur.md`.
3. Paste dan review checklist di [writing-requirements.md](writing-requirements.md).
4. Buka project di Cursor, minta agent: _"Validasi requirements/nama-fitur.md, perbaiki jika ada violation, lalu buat test plan dan generate tests."_

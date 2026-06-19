# Menulis Requirement

Simpan file fitur di folder [`requirements/`](../requirements/), sejajar dengan [`_TEMPLATE.md`](../requirements/_TEMPLATE.md).

Setup mesin dan pipeline: [GUIDE.md](GUIDE.md)

## Alur kerja

1. Duplikat [`_TEMPLATE.md`](../requirements/_TEMPLATE.md) → `requirements/nama-fitur.md`.
2. Isi Metadata, Kriteria Penerimaan, dan Skenario Uji.
3. (Opsional) Rapikan catatan kasar via ChatGPT/Gemini — lihat section **Prompt untuk AI eksternal** di bawah.
4. Validasi: `npm run validate:requirement -- requirements/nama-fitur.md`
5. Koreksi ringan di editor jika perlu.
6. Pipeline AI di Codex: pakai section `Prompt Siap Pakai` di [GUIDE.md](GUIDE.md).

## Checklist sebelum commit

- [ ] `npm run validate:requirement` lulus (tanpa error)
- [ ] Judul `# REQ-XXX: ...` ada di baris pertama
- [ ] Section `## Metadata` terisi (minimal Tags dan Auth state)
- [ ] Minimal satu bullet di `## Kriteria Penerimaan`
- [ ] Setiap skenario punya `###` heading + `**Langkah:**` + `**Hasil:**`
- [ ] Hasil bersifat observable (URL, teks, visibility)
- [ ] Skenario non-otomatis ditandai `(@manual)` di judul
- [ ] Prekondisi diisi untuk skenario auth-sensitive

## Contoh

[`requirements/example-login-extension.md`](../requirements/example-login-extension.md)

## Format label (parser)

| Indonesia         | Alias Inggris (opsional)                                |
| ----------------- | ------------------------------------------------------- |
| `**Langkah:**`    | `**Steps:**`, `**Step:**`                               |
| `**Hasil:**`      | `**Expected Result:**`, `**Expected:**`, `**Outcome:**` |
| `**Prekondisi:**` | `**Precondition:**`, `**Given:**`                       |

## Prompt untuk AI eksternal (ChatGPT / Gemini)

Untuk merapikan catatan QA kasar menjadi requirement markdown, salin blok di bawah ke chat eksternal. Ganti `[CATATAN QA ANDA]` dengan catatan tim.

### System / Instruksi (salin ke AI)

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

### Langkah setelah AI selesai

1. Salin Markdown hasil AI ke `requirements/nama-fitur.md`.
2. Cek format dengan section **Format label (parser)** di atas.
3. Jalankan `npm run validate:requirement -- requirements/nama-fitur.md`.
4. Di VS Code Codex (atau Cursor Agent), pakai prompt validasi atau pipeline dari section `Prompt Siap Pakai` di [GUIDE.md](GUIDE.md).

## Troubleshooting validasi

| Rule                 | Perbaikan                                                   |
| -------------------- | ----------------------------------------------------------- |
| `title_required`     | Tambah `# REQ-01: Judul`                                    |
| `scenario_structure` | Cek bold `**Langkah:**` dan `**Hasil:**` per skenario `###` |
| `observable_result`  | Hasil harus URL/teks/visibility, bukan "berjalan baik"      |

Detail: [GUIDE — troubleshooting validate_requirement](GUIDE.md#troubleshooting-validate-requirement)

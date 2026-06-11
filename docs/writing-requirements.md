# Menulis Requirement

File fitur disimpan di folder [`requirements/`](../requirements/) — sejajar dengan [`_TEMPLATE.md`](../requirements/_TEMPLATE.md).

Panduan setup & pipeline: [GUIDE.md](GUIDE.md)

## Alur Kerja

1. **Salin template** — duplikat [`requirements/_TEMPLATE.md`](../requirements/_TEMPLATE.md) menjadi `requirements/nama-fitur.md`.
2. **Tulis skenario** — isi Metadata, Kriteria Penerimaan, dan Skenario Uji.
3. **(Opsional) AI eksternal** — gunakan [prompt-external-ai.md](prompt-external-ai.md) di ChatGPT/Gemini.
4. **Validasi format** — `npm run validate:requirement -- requirements/nama-fitur.md`
5. **Paste & adjust** — sesuaikan ringan dengan Agent di Cursor jika perlu.
6. **Jalankan pipeline** — prompt dari [prompt-cursor-agent.md](prompt-cursor-agent.md).

## Checklist Sebelum Commit

- [ ] `npm run validate:requirement` lulus (tanpa error)
- [ ] Judul `# REQ-XXX: ...` ada di baris pertama
- [ ] Section `## Metadata` terisi (minimal Tags dan Auth state)
- [ ] Minimal satu bullet di `## Kriteria Penerimaan`
- [ ] Setiap skenario punya `###` heading + `**Langkah:**` + `**Hasil:**`
- [ ] Hasil bersifat **observable** (URL, teks, visibility)
- [ ] Skenario non-otomatis ditandai `(@manual)` di judul
- [ ] Prekondisi diisi untuk skenario auth-sensitive

## Contoh

Lihat [`requirements/example-login-extension.md`](../requirements/example-login-extension.md).

## Format Label yang Didukung Parser

| Indonesia         | Alias Inggris (opsional)                                |
| ----------------- | ------------------------------------------------------- |
| `**Langkah:**`    | `**Steps:**`, `**Step:**`                               |
| `**Hasil:**`      | `**Expected Result:**`, `**Expected:**`, `**Outcome:**` |
| `**Prekondisi:**` | `**Precondition:**`, `**Given:**`                       |

## Troubleshooting Validasi

| Rule                 | Perbaikan                                                   |
| -------------------- | ----------------------------------------------------------- |
| `title_required`     | Tambah `# REQ-01: Judul`                                    |
| `scenario_structure` | Cek bold `**Langkah:**` dan `**Hasil:**` per skenario `###` |
| `observable_result`  | Hasil harus URL/teks/visibility, bukan "berjalan baik"      |

Detail lengkap: [GUIDE.md — Troubleshooting](GUIDE.md#troubleshooting-validate_requirement)

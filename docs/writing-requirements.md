# Menulis Requirement

Simpan file fitur di folder [`requirements/`](../requirements/), sejajar dengan [`_TEMPLATE.md`](../requirements/_TEMPLATE.md).

Setup mesin dan pipeline: [GUIDE.md](GUIDE.md)

## Alur kerja

1. Duplikat [`_TEMPLATE.md`](../requirements/_TEMPLATE.md) → `requirements/nama-fitur.md`.
2. Isi Metadata, Kriteria Penerimaan, dan Skenario Uji.
3. (Opsional) Rapikan catatan kasar via [prompt-external-ai.md](prompt-external-ai.md) di ChatGPT/Gemini.
4. Validasi: `npm run validate:requirement -- requirements/nama-fitur.md`
5. Koreksi ringan di editor jika perlu.
6. Pipeline AI di Codex: prompt dari [prompt-ai-agent.md](prompt-ai-agent.md).

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

## Troubleshooting validasi

| Rule                 | Perbaikan                                                   |
| -------------------- | ----------------------------------------------------------- |
| `title_required`     | Tambah `# REQ-01: Judul`                                    |
| `scenario_structure` | Cek bold `**Langkah:**` dan `**Hasil:**` per skenario `###` |
| `observable_result`  | Hasil harus URL/teks/visibility, bukan "berjalan baik"      |

Detail: [GUIDE — troubleshooting validate_requirement](GUIDE.md#troubleshooting-validate-requirement)

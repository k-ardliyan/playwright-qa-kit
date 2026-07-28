# Menulis Requirement

Simpan file fitur di folder [`requirements/`](../requirements/), sejajar dengan [`_TEMPLATE.md`](../requirements/_TEMPLATE.md).

Setup mesin dan pipeline: [GUIDE.md](GUIDE.md)

---

## Path A vs Path B: Kapan Pakai POM?

**Path A (default — tanpa POM):** Fitur baru, skenario sederhana, QA pemula. Generator pakai inline locators dari catalog → test langsung jalan. Tidak perlu buat POM sama sekali.

**Path B (reusable — dengan POM):** Fitur dipakai >2 spec, role-aware, atau butuh maintainability jangka panjang. QA jalankan `snapshot_page` → `generate_page_object` → edit scaffold → register di `src/fixtures/project.fixture.ts` → tambah field "POM yang dibutuhkan" di requirement.

Untuk QA pemula: **mulai dari Path A**. POM adalah optimasi, bukan keharusan.

---

## Alur kerja

1. Duplikat [`_TEMPLATE.md`](../requirements/_TEMPLATE.md) → `requirements/nama-fitur.md`.
2. Isi Metadata, Kriteria Penerimaan, dan Skenario Uji.
3. (Opsional) Rapikan catatan kasar via ChatGPT/Gemini — lihat section **Prompt untuk AI eksternal** di bawah.
4. Validasi: `npm run validate:requirement -- requirements/nama-fitur.md`
5. Koreksi ringan di editor jika perlu.
6. Pipeline AI di IDE: pakai section **Prompt Siap Pakai** di [GUIDE.md](GUIDE.md).

---

## Checklist sebelum commit

- [ ] `npm run validate:requirement` lulus (tanpa error)
- [ ] Judul `# REQ-XXX: ...` ada di baris pertama
- [ ] Section `## Metadata` terisi (minimal Tags, Auth state, Halaman awal)
- [ ] **`- **Module:** <nama-modul>`** diisi — wajib, validator akan error jika kosong
- [ ] `- **Feature:** <nama-fitur>` diisi jika memungkinkan — opsional tapi sangat direkomendasikan
- [ ] Minimal satu bullet di `## Kriteria Penerimaan`, semuanya observable
- [ ] Setiap skenario punya `### SC-XX:` heading + `**Langkah:**` + `**Hasil:**`
- [ ] Hasil bersifat observable (URL, teks, visibility — bukan "berjalan baik")
- [ ] Skenario non-otomatis ditandai `(@manual)` di judul
- [ ] Prekondisi diisi untuk skenario auth-sensitive
- [ ] Jika `Auth state: authenticated` dan fitur berbeda per role → tambah `Role scope` dan `Access expectation`
- [ ] (Disarankan) setiap skenario isi `- **Layer terdampak:** FE` / `BE` / `DB` / `API` — warning `layer_recommended` jika kosong

---

## Tipe Skenario

Tambahkan tag di judul `### SC-XX:` untuk membedakan tipe:

| Tag                     | Artinya                                        |
| ----------------------- | ---------------------------------------------- |
| `(@success)`            | Happy path — alur normal berhasil              |
| `(@failure)`            | Negative path — input salah, validasi gagal    |
| `(@access-restriction)` | Role tidak berhak, akses ditolak               |
| `(@manual)`             | Tidak bisa diotomasi (CAPTCHA, OTP, biometric) |

Capability tags (opsional, digabung di judul SC):

| Tag                     | Artinya                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `(@download)`           | Download file — `downloadAndSave`                                          |
| `(@upload)`             | Upload fixture-first — `uploadFixture` / `setInputFiles` (bukan OS picker) |
| `(@file-content)`       | Assert isi PDF/Excel — needles dari **Hasil** skenario                     |
| `(@network)`            | Mock HTTP                                                                  |
| `(@network-assert)`     | Live payload + response (`waitAndAssertApi` / partial contract)            |
| `(@hybrid)`             | Seed API + assert UI                                                       |
| `(@aria)` / `(@visual)` | Snapshot a11y / screenshot                                                 |

Upload **bukan** `@manual`. PDF **teks** = `@file-content`; PDF **layout** visual = `@manual`. Lihat [MANUAL-SCENARIOS.md](MANUAL-SCENARIOS.md) dan recipes file di `docs/recipes/`. Live network payload/response = `@network-assert` (bukan `@manual`, bukan overload `@network` mock) — lihat [network-assert.md](recipes/network-assert.md).

Jika tidak diberi tag tipe, skenario dianggap `(@success)` secara default.

---

## Metadata Opsional untuk Role-Aware Testing

Tambahkan field berikut jika fitur berbeda per role bisnis:

```markdown
- **Role scope:** super-admin, finance
- **Access expectation:** super-admin: bisa approve dan reject; finance: bisa approve; hrd: tidak bisa mengakses
- **Risk level:** high
```

Validator akan memberi warning jika:

- `Auth state: authenticated` tapi tidak ada `Role scope` (mungkin perlu ditambahkan)
- `Role scope` diisi tapi `Access expectation` kosong
- Requirement menyebut kata gagal/error/ditolak tapi tidak ada skenario `(@failure)`

Lihat panduan lengkap: [AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md)

### Mode general vs role-aware

- **general** = tidak ada `Role scope`; auth default = role kredensial **`user`** (`TEST_USER_*`), **bukan** role bernama `general`
- **role-aware** = ada `Role scope`; satu spek/auth per role bisnis (`finance`, `hrd`, …)
- `Role scope` memuat nama bisnis saja — jangan tulis `general` di daftar role

---

## Contoh & Referensi

| File                                                                                                  | Untuk apa                                           |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`requirements/_TEMPLATE.md`](../requirements/_TEMPLATE.md)                                           | Template utama yang Anda salin                      |
| [`requirements/_GOOD_EXAMPLE.md`](../requirements/_GOOD_EXAMPLE.md)                                   | Contoh requirement BAIK — target kualitas           |
| [`requirements/_BAD_EXAMPLE.md`](../requirements/_BAD_EXAMPLE.md)                                     | Contoh requirement BURUK — apa yang harus dihindari |
| [`requirements/auth/sample-login-empty-fields.md`](../requirements/auth/sample-login-empty-fields.md) | Contoh valid untuk latihan pipeline                 |

---

## Format label (parser)

| Indonesia         | Alias Inggris (opsional)                                |
| ----------------- | ------------------------------------------------------- |
| `**Langkah:**`    | `**Steps:**`, `**Step:**`                               |
| `**Hasil:**`      | `**Expected Result:**`, `**Expected:**`, `**Outcome:**` |
| `**Prekondisi:**` | `**Precondition:**`, `**Given:**`                       |

---

## Prompt untuk AI Eksternal (ChatGPT / Gemini)

Gunakan ini untuk mengubah catatan kasar atau tiket menjadi requirement siap pakai.

```
Tolong ubah catatan berikut menjadi requirement QA dalam format Markdown.

FORMAT YANG HARUS DIIKUTI:
# REQ-XXX: [Judul Fitur]

## Metadata
- **Tags:** #<tag1> #<tag2>
- **Prioritas:** high / medium / low
- **Auth state:** unauthenticated / authenticated
- **Halaman awal:** /path-halaman
- **POM yang dibutuhkan:** namaPage (opsional)
- **Role scope:** role1, role2 (HANYA jika fitur berbeda per role)
- **Access expectation:** role1: bisa X; role2: tidak bisa X (HANYA jika Role scope diisi)

## Kriteria Penerimaan
- [kondisi observable 1]
- [kondisi observable 2]

## Skenario Uji

### SC-01: [Nama Skenario] (@success)
**Prekondisi:** [kondisi awal]
**Langkah:**
1. [langkah 1]
2. [langkah 2]
**Hasil:**
- [hasil observable — URL, teks, elemen visible]

### SC-02: [Nama Skenario] (@failure)
**Prekondisi:** [kondisi awal]
**Langkah:**
1. [langkah 1]
**Hasil:**
- [pesan error atau kondisi gagal yang observable]

ATURAN PENTING:
- Hasil HARUS observable: URL, teks visible, elemen tampil/hilang
- JANGAN tulis "sistem bekerja dengan baik" — itu tidak observable
- Tandai (@manual) di judul skenario yang butuh CAPTCHA / OTP / biometric
- Setiap skenario harus punya Langkah dan Hasil

CATATAN SAYA:
[paste catatan Anda di sini]
```

### Langkah setelah AI selesai

1. Salin Markdown hasil AI ke `requirements/nama-fitur.md`.
2. Cek format dengan section **Format label (parser)** di atas.
3. Jalankan `npm run validate:requirement -- requirements/nama-fitur.md`.
4. Di IDE (Cursor/Kiro/Claude), pakai prompt pipeline dari section **Prompt Siap Pakai** di [GUIDE.md](GUIDE.md).

---

## Troubleshooting validasi

| Rule                           | Perbaikan                                                        |
| ------------------------------ | ---------------------------------------------------------------- |
| `title_required`               | Tambah `# REQ-01: Judul`                                         |
| `scenario_structure`           | Cek bold `**Langkah:**` dan `**Hasil:**` per skenario `###`      |
| `observable_result`            | Hasil harus URL/teks/visibility, bukan "berjalan baik"           |
| `role_scope_recommended`       | Jika authenticated + multi-role, tambah `Role scope` di Metadata |
| `access_expectation_missing`   | Tambah `Access expectation` jika `Role scope` sudah diisi        |
| `failure_scenario_recommended` | Tambah skenario `(@failure)` jika ada kata error/gagal/ditolak   |

Detail: [GUIDE — troubleshooting validate_requirement](GUIDE.md#troubleshooting-validate-requirement)

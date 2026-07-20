# Baseline & Regression Handling

Dokumen ini mendefinisikan konvensi untuk menyimpan baseline test, mengelola versi requirement, dan menjalankan regression test ketika feature yang sama diupdate.

---

## Konsep Dasar

### Baseline

**Baseline** adalah snapshot dari pipeline report yang sudah di-APPROVE: semua scenario pass, requirement tervalidasi, dan test bisa diandalkan sebagai referensi behavior yang benar.

Baseline disimpan di `reports/archive/<runId>/` dan berisi:

- `pipeline-report-<runId>.md` — Markdown report
- `pipeline-report-<runId>.json` — JSON report (opsional)
- `archive-meta.json` — metadata archive

### Regression Test

**Regression test** adalah test yang sudah ada dari baseline sebelumnya yang dijalankan ulang untuk memastikan perubahan feature tidak merusak behavior lama.

### Versi Requirement

Ketika feature yang sama diupdate (improvement, bugfix, behavior change), requirement-nya perlu diversi agar baseline lama tidak hilang.

---

## Konvensi Penamaan

### Requirement

| Situasi                     | Penamaan file                        |
| --------------------------- | ------------------------------------ |
| Requirement awal            | `requirements/<feature>.md`          |
| Feature update besar        | `requirements/<feature>-v2.md`       |
| Perubahan behavior spesifik | `requirements/<feature>-<aspect>.md` |

Contoh:

```
requirements/invoice-approve.md           ← versi awal
requirements/invoice-approve-v2.md        ← setelah perubahan approval flow
requirements/invoice-approve-bulk.md      ← fitur baru: bulk approval
```

### Archive Baseline

Baseline disimpan otomatis oleh `archive_report` MCP tool:

```
reports/
  archive/
    <runId-1>/                     ← baseline pertama (APPROVED)
      pipeline-report-<runId>.md
      pipeline-report-<runId>.json
      archive-meta.json
    <runId-2>/                     ← baseline kedua setelah improvement
      pipeline-report-<runId>.md
      archive-meta.json
```

---

## Alur: Feature Baru (Pertama Kali)

```
1. Tulis requirements/<feature>.md
2. Jalankan pipeline: Plan → Generate → Execute → Heal → Report
3. QA review → Keputusan: APPROVE
4. archive_report dipanggil otomatis oleh Reporter
5. Baseline tersimpan di reports/archive/<runId>/
6. Test di src/tests/<feature>.spec.ts menjadi regression guard
```

---

## Alur: Feature Update (Improvement)

Ketika PM/developer mengubah behavior feature yang sudah ada:

```
1. PM memberikan PRD baru atau update
2. QA turunkan ke requirements/<feature>-v2.md (atau update file yang ada jika minor)
3. Jalankan pipeline untuk requirement baru
4. Test lama di src/tests/<feature>.spec.ts TETAP ADA sebagai regression guard
5. Tambah test baru di src/tests/<feature>-v2.spec.ts untuk behavior baru
6. Jalankan keduanya: test lama (regression) + test baru (validation)
7. Jika test lama gagal karena behavior memang berubah: ini bukan bug, ini breaking change
   → Keputusan: update test lama sesuai behavior baru, arsipkan baseline lama
8. QA approve → arsipkan sebagai baseline baru
```

### Membedakan Regression Bug vs Intentional Change

| Situasi                                                       | Artinya            | Tindakan           |
| ------------------------------------------------------------- | ------------------ | ------------------ |
| Test lama fail, PM tidak tahu                                 | Regression bug     | FILE BUG           |
| Test lama fail, PM konfirmasi behavior berubah                | Intentional change | Update test lama   |
| Test lama fail, requirement baru kontradiksi requirement lama | Gap requirement    | REVISE REQUIREMENT |

---

## Menjalankan Regression Test

### Run semua regression test

```bash
# Jalankan semua test (termasuk regression)
npm test

# Jalankan hanya test bertag @regression
npm run test:smoke -- --grep @regression
```

### Run regression untuk feature spesifik

```bash
# Semua test untuk feature invoice
npx playwright test --grep "invoice"

# Test untuk role finance saja
npx playwright test src/tests/invoice-finance.spec.ts

# Test dengan tag @regression untuk role super-admin
npx playwright test src/tests/invoice-super-admin.spec.ts --grep @regression
```

---

## Membandingkan Dua Baseline

Gunakan MCP tool `compare_baselines` (Fase 5 — tersedia di pipeline):

```json
{
  "baselineRunId": "<runId-lama>",
  "currentRunId": "<runId-baru>",
  "feature": "invoice-approve"
}
```

Output menunjukkan:

- Scenario yang sebelumnya pass tapi sekarang fail (regression)
- Scenario baru yang belum ada di baseline sebelumnya
- Perubahan healing count (lebih banyak heal = test lebih fragile)

---

## Kapan Harus Buat Requirement Versi Baru vs Update yang Ada

**Update requirement yang ada** jika:

- Perubahan kecil: perbaikan typo, klarifikasi langkah, tambah edge case
- Acceptance criteria dipertajam tapi intent sama
- Scenario `@manual` berubah jadi bisa diotomasi

**Buat versi baru** (`-v2`, `-v3`, dst) jika:

- Flow utama berubah secara signifikan
- Role scope berubah (role baru ditambahkan atau dihapus)
- Behavior fundamental berbeda dari versi sebelumnya
- PM mengeluarkan PRD baru yang menggantikan PRD lama

---

## Struktur Archive yang Direkomendasikan

```
reports/
  archive/
    <runId>/
      pipeline-report-<runId>.md    ← full Markdown report
      pipeline-report-<runId>.json  ← JSON report (jika ada)
      archive-meta.json             ← runId, archivedAt, files
      triage-notes.md               ← catatan triage QA (opsional, buat manual)
  test-summary.json                 ← summary run terakhir
```

---

## Tips Praktis

1. **Jangan hapus test yang sudah di-approve** — itu regression guard. Ubah hanya jika behavior memang berubah secara intentional.

2. **Tag test dengan versi jika perlu** — `@v2` bisa dipakai untuk membedakan test baru dari test lama saat keduanya ada bersamaan.

3. **Archive sebelum major update** — sebelum mengubah banyak test sekaligus, pastikan baseline terakhir sudah di-archive.

4. **Baseline bukan hanya untuk "semua hijau"** — baseline juga berguna ketika ada perubahan yang membuat beberapa test fail secara intentional. Baseline lama menjadi referensi "behavior sebelumnya".

---

## Referensi

- Archive report: MCP tool `archive_report` (lihat `mcp-server/src/tools/archive-report.ts`)
- QA decision model: `docs/QA-DECISION-MODEL.md`
- Auth context: `docs/AUTH-CONTEXT-CONVENTION.md`
- Pipeline report format: `.github/agents/reporter.agent.md`

# QA Decision Model

Dokumen ini mendefinisikan keputusan resmi yang harus diambil QA setelah pipeline report keluar. Workflow tidak boleh mengambang — setiap pipeline run harus berakhir dengan satu keputusan yang jelas.

---

## Mengapa Ini Penting

Tanpa keputusan eksplisit, pipeline menjadi "run-and-forget": test jalan, report keluar, tidak ada yang tahu apa yang harus dilakukan selanjutnya. Dokumen ini membuat keputusan QA menjadi bagian resmi dari workflow, bukan afterthought.

---

## 6 Keputusan Post-Report

### ✅ Keputusan 1: APPROVE

**Kapan:** Semua scenario pass (atau failure sudah di-heal dan tidak ada unresolved).

**Kriteria:**

- `summary.testsFailing === 0`
- `unresolvedFailures` kosong atau tidak ada
- Coverage mencakup semua scenario yang direncanakan

**Tindakan:**

- Requirement dianggap tervalidasi
- Test dijadikan **regression baseline** — simpan di `reports/archive/<runId>/`
- Tandai requirement dengan status `validated` (opsional)
- Tidak ada perubahan code lagi selain dokumentasi

**Command:**

```bash
# Archive report sebagai baseline
npm run mcp:dev
# Gunakan MCP tool: archive_report({ runId, reportPath })
```

---

### 🐛 Keputusan 2: FILE BUG

**Kapan:** Ada failure dengan `failureSource: 'app'` — aplikasi punya bug, test sudah benar.

**Kriteria:**

- Healer mengklasifikasikan sebagai `product_bug`
- Failure tidak bisa diperbaiki dari sisi test
- Behavior aplikasi tidak sesuai requirement

**Tindakan:**

- Buat defect ticket di issue tracker
- Simpan test sebagai **regression guard** — jangan ubah test agar jadi hijau
- Tandai `unresolvedFailure` dengan nomor ticket
- Jalankan ulang setelah bug diperbaiki

**Template defect ticket:**

```
Title: [SC-XX] <scenario name> — <error message singkat>
Severity: <high/medium/low berdasarkan Risk level di requirement>
Steps to reproduce: <dari test steps>
Expected: <dari Expected Result di requirement>
Actual: <dari error message di report>
Regression test: src/tests/<feature>.spec.ts
Pipeline run: reports/archive/<runId>/
```

---

### 📝 Keputusan 3: REVISE REQUIREMENT

**Kapan:** Ada failure dengan `failureSource: 'requirement'` — requirement tidak cukup jelas, salah arah, atau tidak lengkap.

**Kriteria:**

- Test logic benar tapi scenario steps tidak bisa dieksekusi
- Expected result tidak observable atau kontradiktif
- Role scope tidak jelas menyebabkan scenario ambigu

**Tindakan:**

1. Revisi `requirements/<feature>.md` — perbaiki section yang bermasalah
2. Update scenario di requirement
3. Jalankan ulang Planner: `specs/<feature>-test-plan.md` diupdate
4. Generate ulang test yang terpengaruh
5. Rerun pipeline

**Jangan:** Turunkan ekspektasi test agar lulus — perbaiki requirement-nya.

---

### 🔧 Keputusan 4: FIX TEST / GENERATOR

**Kapan:** Ada failure dengan `failureSource: 'test'` atau `failureSource: 'ai_generation'` — test code salah, bukan aplikasinya.

**Kriteria:**

- Aplikasi berjalan benar, tapi test assertion salah
- Generator menghasilkan locator yang tidak akurat
- Test logic tidak sesuai dengan intent scenario

**Tindakan untuk `test`:**

- Edit `src/tests/<feature>.spec.ts` secara manual
- Perbaiki locator, assertion, atau flow
- Jalankan ulang `npm run test` untuk file tersebut
- Rerun pipeline dari phase Execute

**Tindakan untuk `ai_generation`:**

- Perbaiki input requirement atau test plan
- Atau perbaiki manual jika lebih cepat
- Tandai sebagai AI generation issue
- Jika pola yang sama berulang di beberapa requirement, jadikan kandidat improvement framework

---

### 🔧 Keputusan 5: FIX ENVIRONMENT

**Kapan:** Ada failure dengan `failureSource: 'env'` — auth setup, seed data, atau environment config bermasalah.

**Kriteria:**

- Auth file `.auth/<role>.json` tidak ada atau expired
- Seed data tidak tersedia / database kosong
- Environment variable tidak diset
- API external tidak bisa dijangkau

**Tindakan:**

1. **Auth issue:** Jalankan ulang auth setup
   ```bash
   npx playwright test auth.setup.ts
   ```
2. **Seed data:** Jalankan seed script atau reset database test
3. **Env config:** Periksa `.env` — pastikan semua variable terisi
4. Rerun pipeline dari phase Execute (tidak perlu plan ulang)

---

### 🚫 Keputusan 6: MARK BLOCKED

**Kapan:** Failure tidak bisa diselesaikan sekarang karena dependency eksternal, ketidakjelasan yang butuh klarifikasi PM, atau blocker yang di luar kontrol QA.

**Kriteria:**

- Semua kategori failure sudah dicoba tapi masih unresolved
- Butuh informasi dari pihak lain (PM, developer, DevOps)
- Feature belum selesai diimplementasi

**Tindakan:**

- Tandai scenario sebagai `blocked` di report
- Simpan trace + screenshot di `reports/archive/<runId>/`
- Dokumentasikan blocker secara eksplisit: apa yang dibutuhkan, dari siapa, kapan
- Jangan hapus atau ubah test — biarkan sebagai dokumentasi expectation
- Lanjutkan triage ketika blocker sudah resolved

---

## Matriks Keputusan Cepat

| Kondisi                                           | Keputusan             |
| ------------------------------------------------- | --------------------- |
| Semua pass, tidak ada unresolved                  | ✅ APPROVE            |
| Failure: app tidak sesuai requirement, test benar | 🐛 FILE BUG           |
| Failure: requirement tidak jelas atau salah       | 📝 REVISE REQUIREMENT |
| Failure: test code atau generator salah           | 🔧 FIX TEST/GENERATOR |
| Failure: auth/env/data tidak tersedia             | 🔧 FIX ENVIRONMENT    |
| Failure: tidak bisa diselesaikan sekarang         | 🚫 MARK BLOCKED       |

---

## Integrasi dengan Pipeline

Reporter Agent secara otomatis menyertakan section **QA Decision** di setiap Markdown report dengan 6 opsi di atas. QA engineer memilih satu opsi dan menghapus sisanya.

Setelah keputusan diambil, update field `qaDecision` di JSON report:

```json
{
  "qaDecision": "approve | file_bug | revise_requirement | fix_test | fix_environment | blocked",
  "qaDecisionNote": "Optional: nomor ticket, penjelasan singkat, atau link ke PR"
}
```

---

## Referensi

- Failure classification guide: `docs/FAILURE-TRIAGE.md`
- Auth context setup: `docs/AUTH-CONTEXT-CONVENTION.md`
- Baseline dan regression: `docs/BASELINE-REGRESSION.md`
- Pipeline report format: `.github/agents/reporter.agent.md`

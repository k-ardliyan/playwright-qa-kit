# Panduan Report QA — Playwright QA Kit

Dokumen ini menjelaskan **3 jenis report** yang dihasilkan framework setiap kali test dijalankan, format data yang tersedia, dan cara membacanya untuk keperluan QA.

---

## Ringkasan Report yang Dihasilkan

Setiap test run menghasilkan **3 lapisan report**:

```
Playwright Test Run
│
├── reports/html/index.html              ← Playwright built-in HTML report
├── reports/custom-dashboard.html        ← Custom dashboard (LOCAL mode)
├── reports/custom-dashboard-ci.html     ← Custom dashboard (CI mode)
├── reports/test-summary.json            ← Structured JSON summary
└── reports/pipeline-report-<runId>.md   ← Pipeline markdown report (saat run via orchestrator)
```

### 1. **Playwright HTML Report** (`reports/html/index.html`)

- **Sumber:** Playwright built-in reporter
- **Isi:** Test result per file, test step, screenshot, video, trace viewer
- **Kapan digunakan:** Debugging test individual, lihat trace interaktif

### 2. **Custom Dashboard** (`reports/custom-dashboard.html` / `custom-dashboard-ci.html`)

- **Sumber:** `CustomReporter` (`src/support/custom-reporter.ts`)
- **Isi:** **2 view mode**
  - **Accordion View** (default) — test cases grouped by feature/scenario dengan collapsible accordion
  - **Table View** (baru) — test cases dalam format tabel 9 kolom yang bisa di-export ke CSV/TSV/Confluence
- **Kapan digunakan:** QA review harian, test summary visual, export ke external tool

### 3. **Test Summary JSON** (`reports/test-summary.json`)

- **Sumber:** `CustomReporter` → `onEnd()`
- **Isi:** Structured JSON dengan metadata test, pass/fail counts, per-role breakdown (jika role-aware), dan detail test case per item
- **Kapan digunakan:** Automasi CI/CD, parsing programmatic, MCP tool integration

### 4. **Pipeline Report Markdown** (`reports/pipeline-report-<runId>.md`)

- **Sumber:** Reporter agent (`.github/agents/reporter.agent.md`)
- **Isi:** Markdown narrative dari full pipeline run (Plan → Generate → Execute → Heal → Report)
- **Kapan digunakan:** Review end-to-end pipeline result, audit trail, QA decision tracking

---

## Custom Dashboard — Anatomy & Fitur

### View Modes

Dashboard memiliki **2 mode view** yang bisa di-toggle melalui button di header:

#### **Accordion View** (Default)

- Test cases grouped by feature/scenario
- Setiap group bisa expand/collapse
- Cocok untuk: review visual cepat, drill-down per feature

#### **Table View** (Baru — v0.1.0-alpha.2)

- **9 kolom:**

| Kolom               | Deskripsi                                                   | Sumber Data                                                              |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Test ID**         | Unique identifier per test (e.g., `TC-LOGIN-01`)            | Dari annotation `@testId` di generated test, atau derived dari file path |
| **Description**     | Test title dari `test('...')`                               | Playwright `TestCase.title`                                              |
| **Test Step**       | List langkah eksekusi (1., 2., 3., ...)                     | Dari `test.step()` yang di-capture di `TestResult.steps`                 |
| **Input Data**      | Data input yang digunakan (username, password, form values) | Dari annotation `@inputData` atau fixture context                        |
| **Expected Result** | Hasil yang diharapkan (expected behavior)                   | Dari annotation `@expectedResult` atau requirement scenario              |
| **Actual Result**   | Hasil aktual eksekusi (PASS / error message + stack trace)  | Dari `TestResult.status` + `error.message`                               |
| **Status**          | Badge warna: ✅ **PASSED** / ❌ **FAILED** / ⏭️ **SKIPPED** | Dari `TestResult.status`                                                 |
| **Priority**        | Badge: 🔴 **HIGH** / 🟡 **MEDIUM** / 🟢 **LOW**             | Dari annotation `@priority` atau global requirement metadata             |
| **Notes**           | Screenshot, video, trace link, affected layer badges        | Dari `TestResult.attachments` + `@affectedLayer` annotation              |

- **Export:** Button di kanan atas tabel untuk export ke **CSV**, **TSV**, atau **Confluence Wiki Markup**
- **Responsive:** Table scroll horizontal untuk viewport kecil (issue #1 akan diperbaiki di release berikutnya)

---

## Data Schema — `test-summary.json`

### Root Schema

```typescript
interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number; // 0.0 - 1.0
  timestamp: string; // ISO 8601

  // === Table View extensions ===
  reportMode?: 'general' | 'role-aware';
  rolesInScope?: string[]; // ['finance', 'super-admin', 'hrd']
  testCases?: CollectedTestCase[]; // Detail per test case
}
```

### Per-Test Case Schema

```typescript
interface CollectedTestCase {
  testId: string; // 'TC-LOGIN-01' atau derived ID
  title: string; // Test title dari test('...')
  status: 'passed' | 'failed' | 'skipped';
  duration: number; // ms
  filePath: string; // Relative path dari repo root
  project: string; // 'chromium' | 'firefox' | 'webkit'

  // === Metadata dari annotation ===
  role?: string; // 'finance' | 'super-admin' | 'hrd'
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  affectedLayer?: Array<'ui' | 'api' | 'db' | 'integration'>;
  inputData?: Record<string, any>;
  expectedResult?: string;
  actualResult?: string; // Error message jika FAILED, 'Test passed' jika PASSED

  // === Test steps ===
  steps?: Array<{ name: string; duration: number; error?: string }>;

  // === Attachments ===
  attachments?: Array<{
    name: string;
    contentType: string; // 'image/png' | 'video/webm' | 'application/zip'
    path: string; // Relative path dari repo root
  }>;

  // === Error detail (jika FAILED) ===
  errorMessage?: string;
  stackTrace?: string;
  tracePath?: string; // Path ke trace.zip
  screenshotPath?: string; // Path ke screenshot.png
}
```

---

## Cara Membaca Report untuk QA

### Scenario 1: Review Harian Test Result

1. Buka `reports/custom-dashboard.html`
2. Lihat **Run Health Panel** di bagian atas:
   - Total tests, passed, failed, skipped
   - Pass rate (hijau ≥90%, kuning 70-89%, merah <70%)
   - Duration
3. Toggle ke **Table View**
4. Scan kolom **Status** — cari badge merah (❌ FAILED)
5. Untuk setiap FAILED:
   - Baca **Actual Result** — apakah error dari app atau test?
   - Cek **Priority** — HIGH priority di-triage duluan
   - Klik screenshot/video/trace di kolom **Notes** untuk investigasi

### Scenario 2: Export Report ke External Tool (Jira, Confluence, Excel)

1. Buka `reports/custom-dashboard.html`
2. Toggle ke **Table View**
3. Klik button **Export** di kanan atas tabel
4. Pilih format:
   - **CSV** → Import ke Excel/Google Sheets
   - **TSV** → Import ke tools yang butuh tab-separated
   - **Confluence** → Paste langsung ke Confluence page (sudah dalam format wiki markup)

### Scenario 3: Triage Failed Test — Tentukan Root Cause

Untuk classify failure, lihat failure source di pesan error test (`result.errors`) — heuristic: app/test/env/requirement.

| Kondisi Actual Result                                   | Decision                  | Action                                                 |
| ------------------------------------------------------- | ------------------------- | ------------------------------------------------------ |
| Error dari app (500, validation error, crash)           | 🐛 **FILE BUG**           | Buat defect ticket, keep test sebagai regression guard |
| Error dari test code (selector broken, assertion salah) | 🔧 **FIX TEST**           | Fix test code atau generator input, rerun              |
| Expected result tidak match requirement                 | 📝 **REVISE REQUIREMENT** | Update requirement, replan, regenerate                 |
| Auth/env issue (token expired, seed data missing)       | 🔧 **FIX ENVIRONMENT**    | Fix auth/env/seed, rerun dari Execute phase            |
| Blocker eksternal (API down, staging broken)            | 🚫 **MARK BLOCKED**       | Archive trace, document blocker                        |

### Scenario 4: Role-Aware Test — Review Per Role

Jika `reportMode: 'role-aware'` di `test-summary.json`:

1. Buka `reports/custom-dashboard.html`
2. Toggle ke **Table View**
3. Table akan grouped by **ROLE** dengan section header berwarna teal:
   ```
   ═══ ROLE: FINANCE ═══
   [table rows untuk role finance]

   ═══ ROLE: SUPER-ADMIN ═══
   [table rows untuk role super-admin]
   ```
4. Review pass rate per role — role mana yang paling stabil?
5. Export per role jika perlu (filter manual via Excel setelah export)

---

## Troubleshooting — Known Issues & Workarounds

### Issue #1: Table View tidak responsive di mobile/small viewport

**Gejala:** Tabel 9 kolom terlalu lebar, sebagian kolom terpotong di layar kecil  
**Workaround:** Scroll horizontal (ada scrollbar di bawah tabel)  
**Fix planned:** Responsive breakpoint + collapsible columns di v0.2.0

### Issue #2: Screenshot/video tidak muncul di kolom Notes

**Gejala:** Link ke `test-results/**/*.png` atau `*.webm` tidak resolve  
**Root cause:** Attachment path relatif dari HTML report yang standalone  
**Workaround:** Buka Playwright HTML report (`reports/html/index.html`) untuk lihat screenshot/video  
**Fix planned:** Copy attachments ke `reports/attachments/` dan update path di v0.2.0

### Issue #3: Actual Result error text tidak rapi (stack trace panjang)

**Gejala:** Stack trace multi-line tidak ter-format dengan baik, sulit dibaca  
**Workaround:** Copy text ke editor atau lihat full trace di Playwright HTML report  
**Fix planned:** Collapsible accordion untuk long error text + `white-space: pre-wrap` di v0.2.0

---

## Metadata Extraction — Annotation Pattern

Framework mengekstrak metadata dari **test annotation** yang ditulis oleh Generator agent. Pattern yang dikenali:

```typescript
test('should login successfully', async ({ page }) => {
  // @testId TC-LOGIN-01
  // @priority HIGH
  // @role finance
  // @affectedLayer ui,api
  // @inputData {"username": "finance@example.com", "password": "SecurePass123"}
  // @expectedResult User successfully logged in and redirected to dashboard

  await test.step('Navigate to login page', async () => {
    await page.goto('/login');
  });

  // ... test steps ...
});
```

Jika annotation tidak ada, framework fallback ke:

- `testId`: Derived dari file path + test title (e.g., `login-finance-should-login-successfully`)
- `priority`: Dari global requirement metadata atau default `MEDIUM`
- `role`: Extracted dari file name pattern `*-<role>.spec.ts`
- `actualResult`: Error message dari `TestResult.error` atau `'Test passed'`

---

## Pipeline Report — Markdown Format

Saat test dijalankan via **Orchestrator pipeline** (Plan → Generate → Execute → Heal → Report), Reporter agent menghasilkan markdown report di `reports/pipeline-report-<runId>.md`.

### Structure

```markdown
# Pipeline Report — <runId>

**Requirement:** `requirements/<feature-name>.md`  
**Mode:** general | role-aware  
**Started:** <ISO timestamp>  
**Duration:** XXs

---

## Run Summary

- **Total scenarios:** X
- **Tests generated:** Y
- **Passing:** Z (XX%)
- **Failing:** N
- **Skipped:** M

---

## Test Coverage

| Scenario                            | Status    | Duration | Role    | Notes                   |
| ----------------------------------- | --------- | -------- | ------- | ----------------------- |
| SC-01: Login with valid credentials | ✅ PASSED | 2.5s     | finance | -                       |
| SC-02: Login with invalid password  | ❌ FAILED | 1.8s     | finance | Error: Assertion failed |

---

## Test Cases (General Mode)

| Test ID     | Description                           | Status    | Priority | Notes                |
| ----------- | ------------------------------------- | --------- | -------- | -------------------- |
| TC-LOGIN-01 | should login successfully             | ✅ PASSED | HIGH     | -                    |
| TC-LOGIN-02 | should show error on invalid password | ❌ FAILED | HIGH     | Screenshot available |

---

## Unresolved Failures

### TC-LOGIN-02

- **Stage:** execute
- **Failure Source:** app
- **Error:** Expected error message "Invalid credentials" but got "Login failed"
- **Trace:** `test-results/.../trace.zip`
- **Screenshot:** `test-results/.../screenshot.png`

---

## QA Decision

**Decision:** 🐛 FILE BUG  
**Reason:** Error message mismatch — app returning generic "Login failed" instead of specific "Invalid credentials"  
**Action:** Create defect ticket JIRA-1234, keep test as regression guard
```

---

## FAQ

### Q: Bagaimana cara lihat test untuk role tertentu saja?

**A:** Saat run test, pass `roleFilter`:

```bash
npm run test -- --grep @finance
```

Atau via Orchestrator:

```json
{
  "requirementPath": "requirements/invoice-approve.md",
  "roleFilter": ["finance"]
}
```

### Q: Bagaimana cara archive report setelah QA review?

**A:** Reporter agent akan otomatis memanggil MCP tool `archive_report` setelah produce final report. Report akan disimpan ke `reports/archive/<runId>/`.

### Q: Apa bedanya `reportMode: 'general'` vs `'role-aware'`?

**A:**

- **General:** Satu test suite untuk semua user, tidak ada role-specific auth/data
- **Role-aware:** Test suite terbagi per role (finance, super-admin, hrd), masing-masing punya auth state (`storageState`) dan data seed sendiri

### Q: Bagaimana cara custom kolom Table View?

**A:** Edit `src/support/custom-dashboard/export-helpers.ts` → function `COLUMN_DEFINITIONS`. Tambah/hapus kolom sesuai kebutuhan. Rebuild report dengan run test ulang.

---

## Changelog

### v0.1.0-alpha.2 (Current)

- ✅ Table View dengan 9 kolom
- ✅ Export CSV/TSV/Confluence
- ✅ Role-aware grouping
- ✅ Annotation extraction (testId, priority, role, affectedLayer, inputData, expectedResult)
- ✅ Actual result capture (error message + stack trace)
- ⚠️ Known issues: responsive table, attachment path, long error text formatting

### v0.2.0 (Planned)

- 🔧 Fix responsive table layout
- 🔧 Copy attachments ke `reports/attachments/` dan update path
- 🔧 Collapsible long error text
- 🆕 Filter/search per kolom di Table View
- 🆕 Sort by Priority/Status/Duration
- 🆕 Dark mode toggle

---

**Pertanyaan atau feedback?** Buka issue di repo atau hubungi QA lead.

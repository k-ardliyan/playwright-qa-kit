# Setelah Pipeline Pertama

Panduan ini untuk QA yang baru saja menjalankan pipeline pertama lewat
Hermes Agent setelah `setup:wizard` selesai.

## Artefak yang harus muncul

Setelah pipeline Plan → Generate → Execute → Heal → Report selesai:

| Artefak                              | Wajib | Keterangan                                               |
| ------------------------------------ | ----- | -------------------------------------------------------- |
| `specs/login-test-plan.md`           | ✅    | Test plan dari Planner                                   |
| `src/tests/login*.spec.ts`           | ✅    | Spec Playwright dari Generator (Path A inline locators)  |
| `reports/pipeline-report-<runId>.md` | ✅    | Ringkasan eksekusi + unresolved failures                 |
| `reports/custom-dashboard.html`      | ✅    | Dashboard visual — **terbuka otomatis** setelah pipeline |
| `reports/test-summary.json`          | ✅    | Data mentah untuk tooling / agent                        |
| `reports/archive/<runId>/`           | ✅    | Snapshot report — buka untuk approval                    |

**Dashboard terbuka otomatis** lewat `npm run qa:run` (default ON).
Skip dengan `--no-open-dashboard` atau buka manual via OS file manager.

## Kalau Gagal — Baca failureSource

Hermes mengklasifikasikan setiap unresolved failure ke salah satu sumber:

| `failureSource` | Artinya                              | Tindakan                                                  |
| --------------- | ------------------------------------ | --------------------------------------------------------- |
| `app`           | Aplikasi yang salah (product bug)    | 🐛 FILE BUG — buat defect ticket, pertahankan test        |
| `requirement`   | Requirement ambigu atau kontradiktif | 📝 REVISE REQUIREMENT — perbaiki file, ulangi dari Plan   |
| `test`          | Test code / locator salah            | 🔧 FIX TEST — perbaiki src/tests/, re-run scoped          |
| `env`           | Env / auth / seed missing            | 🔧 FIX ENV — cek `.auth/`, `env:edit`, `auth.setup.ts`    |
| `ai_generation` | Generator salah pilih strategi       | 🔧 FIX GENERATOR input — biasanya tambahkan hint atau POM |

## 6 Keputusan QA

| Keputusan                 | Kapan                                              |
| ------------------------- | -------------------------------------------------- |
| ✅ **APPROVE**            | Semua pass. `archive_report` → baseline.           |
| 🐛 **FILE BUG**           | Ada `failureSource: 'app'`                         |
| 📝 **REVISE REQUIREMENT** | Ada `failureSource: 'requirement'`                 |
| 🔧 **FIX TEST/GENERATOR** | Ada `failureSource: 'test'` atau `'ai_generation'` |
| 🔧 **FIX ENVIRONMENT**    | Ada `failureSource: 'env'`                         |
| 🚫 **MARK BLOCKED**       | Tidak bisa resolve sekarang. Archive trace.        |

## Gejala Umum dan Fix Cepat

### ❌ "Dashboard redirect ke `/login` setelah login"

App menyimpan session di **localStorage** (bukan cookies). Pastikan `.auth/<role>.json` punya
`origins[0].localStorage` tidak kosong. File size harus > 100 bytes setelah auth.setup.

**Fix:**

```bash
npm run env:edit            # pastikan credentials benar
npx playwright test src/support/auth.setup.ts --project=setup
```

### ❌ "Test pass tapi dashboard `/login?redirect=%2Fdashboard`"

`expect(page).toHaveURL(/\/dashboard/)` false positive — pathname tetap `/login`.

**Fix di spec:** assert pathname, bukan URL:

```typescript
await expect.poll(() => new URL(page.url()).pathname).toContain('/dashboard');
```

### ❌ "Smoke test fail tapi `qa:run --dry-run` hijau"

`npm run test:smoke` menjalankan `--grep @smoke` (global). Tag `@smoke` hampir tidak ada di
spec yang di-generate. **Jalankan pipeline penuh di Hermes**, jangan pakai smoke untuk verifikasi.

### ❌ "Auth file 36 bytes (kosong)"

Template `auth.setup.ts` lama men-overwrite session valid dengan empty state. Sudah difix di
generator Juli 2026. **Re-run:**

```bash
npx playwright test src/support/auth.setup.ts --project=setup
```

### ❌ "Hermes bilang prompt di-paste tapi tidak ada yang terjadi"

Pastikan paste ke **Hermes Agent**, bukan ke chat biasa. Status harus
menunjukkan `MCP ● 3 servers`.

## Setelah Pipeline Pertama OK

```bash
# Tambah role baru / ganti password
npm run env:edit

# Refresh session setelah ganti kredensial
npx playwright test src/support/auth.setup.ts --project=setup

# Tulis requirement fitur berikutnya
cp requirements/_TEMPLATE.md requirements/fitur-baru.md
# Edit → validate → prompt Hermes

# Lihat seluruh docs entry points
cat docs/CHEATSHEET.md
```

## Referensi Cepat

| Kebutuhan                  | Buka                              |
| -------------------------- | --------------------------------- |
| Command ringkas            | `docs/CHEATSHEET.md`              |
| Setup mesin (first-time)   | `docs/GETTING-STARTED.md`         |
| Format requirement         | `docs/writing-requirements.md`    |
| Panduan pipeline lengkap   | `docs/GUIDE.md`                   |
| Role-aware testing         | `docs/AUTH-CONTEXT-CONVENTION.md` |
| Format laporan / dashboard | `docs/REPORT-GUIDE.md`            |
| Troubleshooting umum       | `docs/TROUBLESHOOTING.md`         |

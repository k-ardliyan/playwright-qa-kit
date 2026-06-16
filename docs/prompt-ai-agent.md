# Prompt Agent (Codex / Cursor)

Satu file untuk Codex (utama) dan Cursor Agent mode.

Ganti path `requirements/nama-fitur.md` dengan file fitur Anda.

**Referensi**

- [CUSTOM-MCP.md](../CUSTOM-MCP.md) — kontrak pipeline MCP
- [Framework core vs adapter](GUIDE.md#framework-core-vs-adapter) — Generator menulis ke `src/tests/`, bukan ke folder adapter ERPKU

---

## Validasi format saja

```
Validasi requirements/nama-fitur.md menggunakan tool validate_requirement di server playwright-qa.
Jika ada error severity, perbaiki file requirement lalu validasi ulang.
Jangan jalankan pipeline — hanya validasi dan perbaikan format.
```

---

## Pipeline lengkap

```
Jalankan pipeline lengkap untuk requirements/nama-fitur.md:

1. health_check (playwright-qa) — abort jika ada status fail
2. validate_requirement (playwright-qa) — perbaiki error sebelum lanjut
3. Planner: parse_requirement_scenarios + normalize_requirements → tulis specs/nama-fitur-test-plan.md
4. Generator: buat kode di src/tests/ (kebab-case .spec.ts, import @/fixtures/base.fixture) dari test plan
5. validate_generated_tests (playwright-qa)
6. run_tests (playwright-test)
7. Jika gagal (≤10): get_test_failures (playwright-qa) → Healer → validate_generated_tests → run_tests scoped
8. get_test_summary (playwright-qa)

Ikuti format requirement di requirements/_TEMPLATE.md.
Return unresolved failures jika ada.
```

---

## Plan saja (review test plan dulu)

```
Plan test scenarios dari requirements/nama-fitur.md:

1. validate_requirement (playwright-qa)
2. parse_requirement_scenarios + normalize_requirements (playwright-qa)
3. Tulis specs/nama-fitur-test-plan.md dengan tabel: Scenario Name | Steps | Expected Result

Jangan generate kode tes — hanya test plan.
```

---

## Generate saja (test plan sudah ada)

```
Generate Playwright tests dari specs/nama-fitur-test-plan.md:

1. Baca metadata dari normalize_requirements jika perlu
2. Untuk halaman baru: live verification via playwright-cli (preferred) atau browser_* MCP tools
3. Tulis file di src/tests/ (kebab-case .spec.ts, import @/fixtures/base.fixture)
4. validate_generated_tests (playwright-qa)
```

---

## Heal saja (setelah tes gagal)

```
Heal kegagalan tes:

1. get_test_failures (playwright-qa) dari test-results/results.json
2. Perbaiki file spec yang gagal di src/tests/ (gunakan tracePath/screenshotPath jika ada)
3. validate_generated_tests (playwright-qa)
4. run_tests (playwright-test) hanya untuk file yang diperbaiki
```

---

## Contoh konkret (latihan Path A)

```
Jalankan pipeline lengkap untuk requirements/example-login-extension.md.
Ikuti prompt "Pipeline lengkap" di atas.
```

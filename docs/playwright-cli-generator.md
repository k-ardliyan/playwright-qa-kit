# Playwright CLI — Generator Live Verification

Ringkasan workflow **playwright-cli** untuk fase Generator. CLI token-efficient; MCP tetap fallback. Detail skill: `.agents/skills/playwright-cli/`.

## Prasyarat

- Node.js >= 22.22.1
- `@playwright/test` >= 1.56
- CLI tersedia: `npx playwright-cli --help` (atau install global)

## Alur per skenario

1. **Seed aktif** — `run_tests` scoped ke `src/tests/seed.spec.ts` (fixtures + auth setup).
2. **Debug CLI** — di terminal terpisah:

   ```bash
   npx playwright test --debug=cli src/tests/seed.spec.ts
   ```

3. **Attach** — salin session id (`tw-XXXX`) dari output, lalu:

   ```bash
   npx playwright-cli attach tw-XXXX
   ```

4. **Replay langkah skenario** (satu per satu):

   ```bash
   npx playwright-cli snapshot
   npx playwright-cli click e5
   npx playwright-cli fill e3 "value"
   npx playwright-cli press Enter
   ```

5. **Emit kode** — setiap aksi CLI menulis Playwright TS ke output; gunakan sebagai basis file `.spec.ts`.
6. **Validasi** — `validate_generated_tests` (playwright-qa), lalu `run_tests` scoped ke file generated.

## Aturan penting

- **Jangan** `open` / `goto` URL mentah — selalu lewat attach seed test agar auth dan fixture benar.
- Prefer POM dari `project.fixture.ts` bila ada; CLI untuk discover selector halaman baru.
- Jika CLI tidak tersedia, fallback ke MCP `browser_*` tools (lihat `.github/agents/generator.agent.md`).

## Referensi

- [Generator agent](../.github/agents/generator.agent.md) — Live Verification Dual Path
- [Playwright CLI vs MCP](https://github.com/microsoft/playwright-cli) — kapan pakai masing-masing

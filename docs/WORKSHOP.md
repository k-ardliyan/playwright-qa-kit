# Workshop Alpha — v0.1.0-alpha.1

Script sesi **~120 menit**. Setup mesin, env, MCP → [GUIDE.md](GUIDE.md). Keterbatasan alpha → [ALPHA-LIMITATIONS.md](ALPHA-LIMITATIONS.md).

**Success per peserta (Path A):** 1 requirement valid + 1 spec dijalankan + `reports/custom-dashboard.html` dilihat.

---

## Facilitator (sebelum sesi)

1. Tag `v0.1.0-alpha.1` sudah di-push; bagikan URL clone + checkout tag
2. `npm run test:quality` hijau di mesin facilitator
3. Handout kredensial (URL, user, password) via chat — peserta paste ke `environments/local.env`
4. **Path A disarankan** untuk latihan requirement → pipeline AI. **Path B** = demo smoke + jelajah `example/erpku/` (bukan generate spec baru via AI) — lihat [GUIDE § Framework core vs adapter](GUIDE.md#framework-core-vs-project-adapter)
5. Dry-run Path A dengan 1 orang non-builder

---

## Peserta — checklist singkat

| #   | Path A (pipeline)                                         | Path B (adapter demo)                                                                   |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Install + `local.env` + `npm run health:check`            | Sama                                                                                    |
| 2   | MCP connected; restart setelah ubah env                   | Sama                                                                                    |
| 3   | Sanity: `npm test`                                        | Set adapter config + `AUTH_*` → sanity: `npm run test:erpku-example -- --project=smoke` |
| 4   | Tulis requirement (`_TEMPLATE.md` → `<fitur>.md`)         | Opsional: baca spec di `example/erpku/tests/`                                           |
| 5   | `npm run validate:requirement -- requirements/<fitur>.md` | —                                                                                       |
| 6   | Pipeline AI → [prompt-ai-agent.md](prompt-ai-agent.md)    | — (tidak generate ke adapter folder)                                                    |
| 7   | `reports/custom-dashboard.html`                           | Lihat laporan dari smoke run                                                            |

**Latihan pipeline (Path A):** [`requirements/example-login-extension.md`](../requirements/example-login-extension.md) — generate selalu ke `src/tests/`.

---

## Timeline

### Path A (~120 menit)

| Menit   | Aktivitas                           |
| ------- | ----------------------------------- |
| 0–30    | Setup (GUIDE) + `npm test`          |
| 30–35   | MCP connected                       |
| 35–55   | Tulis + validasi requirement        |
| 55–90   | Pipeline AI (Plan → Generate → Run) |
| 90–105  | Jalankan tes + dashboard            |
| 105–120 | Feedback + Q&A                      |

### Path B (~60 menit, tanpa pipeline AI)

| Menit | Aktivitas                                           |
| ----- | --------------------------------------------------- |
| 0–30  | Setup + adapter env + smoke run                     |
| 30–50 | Walkthrough `example/erpku/` (POM, fixtures, specs) |
| 50–60 | Feedback + Q&A                                      |

---

## Fallback tanpa MCP

```bash
npm run validate:requirement -- requirements/<fitur>.md
npm run validate
npm test
```

Facilitator lanjutkan demo Path A dengan `example-login-extension.md`.

---

## Feedback alpha

Sampaikan ke facilitator: path A/B, langkah yang macet, output `npm run health:check`, saran untuk beta.

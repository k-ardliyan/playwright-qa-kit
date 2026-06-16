# Workshop Cheat-Sheet — Alpha v0.1.0-alpha.1

Ringkas untuk **print / WhatsApp / meja**. Detail lengkap → [WORKSHOP.md](WORKSHOP.md) · Troubleshooting → [GUIDE.md](GUIDE.md).

**Repo:** [github.com/k-ardliyan/playwright-qa-kit](https://github.com/k-ardliyan/playwright-qa-kit) · branch **`main`** (alpha `v0.1.0-alpha.1`)

---

## Clone & install (laptop QA)

```bash
git clone https://github.com/k-ardliyan/playwright-qa-kit.git
cd playwright-qa-kit
npm install
npx playwright install --with-deps chromium
npm run mcp:build
```

---

## `environments/local.env`

```env
BASE_URL=http://<IP-FE-MEJA>:<port>/
APP_ENV=local
ENV_NAME=workshop-pod-N
PLAYWRIGHT_CONFIG=playwright.config.ts
TEST_USER_EMAIL=...
TEST_USER_PASSWORD=...
```

Setelah ubah env → **restart MCP** di VS Code. `BASE_URL` = IP FE meja (bukan `localhost` laptop QA).

---

## IP per kelompok (facilitator isi)

| Kelompok | IP FE | Port | IP BE | Catatan |
| -------- | ----- | ---- | ----- | ------- |
| 1        |       |      |       |         |
| 2        |       |      |       |         |
| 3        |       |      |       |         |
| 4        |       |      |       |         |
| 5        |       |      |       |         |

---

## Go/No-Go hari-H (centang per meja)

- [ ] **Kategori 1 — Facilitator** — tag, handout, IP + kredensial
- [ ] **Kategori 2 — BE/FE** — satu WiFi/LAN; FE `0.0.0.0`; API → IP BE; app buka dari browser QA
- [ ] **Kategori 3 — Prasyarat QA** — Node >= 22.22.1, Git, VS Code + Codex
- [ ] **Kategori 4 — Repo** — clone, tag, install, playwright, `mcp:build`
- [ ] **Kategori 5 — Env & MCP** — `local.env` + 3 MCP hijau di Codex
- [ ] **Kategori 6 — Verifikasi** — `health:check` no fail · `npm test` pass · browser buka `BASE_URL`

**GO** = Kategori 1–6 lulus · **NO-GO** = MCP merah / FE unreachable → eskalasi di bawah

---

## Verifikasi cepat

```bash
npm run health:check
npm test
```

---

## Pipeline hari-H (Path A)

1. Latihan: [`example-login-extension.md`](../requirements/example-login-extension.md)
2. Prompt Codex: [prompt-ai-agent.md](prompt-ai-agent.md) — bagian **Pipeline lengkap**
3. Generate selalu ke `src/tests/` · dashboard: `reports/custom-dashboard.html`
4. Fitur inventory kelompok → homework ([`_TEMPLATE.md`](../requirements/_TEMPLATE.md))

---

## Eskalasi (sebelum ping facilitator)

1. QA + Codex → [GUIDE — troubleshooting health_check](GUIDE.md#troubleshooting-health-check)
2. FE/BE meja → network, env, firewall, bug app
3. Facilitator → sertakan output `npm run health:check` + screenshot

---

Detail → [WORKSHOP.md](WORKSHOP.md) · Troubleshooting → [GUIDE.md](GUIDE.md)

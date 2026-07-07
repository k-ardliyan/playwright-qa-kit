# Dokumentasi Playwright QA Kit

Mulai dari [GUIDE.md](GUIDE.md). Repo: [github.com/k-ardliyan/playwright-qa-kit](https://github.com/k-ardliyan/playwright-qa-kit).

## QA — hari kerja

| Dokumen                                                                 | Isi                                                       |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| [GUIDE.md](GUIDE.md)                                                    | Setup lokal, pipeline, troubleshooting                    |
| [writing-requirements.md](writing-requirements.md)                      | Format requirement + prompt untuk ChatGPT/Gemini (merged) |
| [../README.md — Flow Harian](../README.md#flow-harian-qa--step-by-step) | Flow harian QA step-by-step dengan diagram                |

## Integration Layer (Multi-AI Client)

| Dokumen / Command                                                                     | Isi                                                |
| ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [../README.md — Integration Layer](../README.md#universal-ai-agent-integration-layer) | Overview multi-platform support                    |
| `npm run mcp:config`                                                                  | Generate MCP config untuk Claude/Cursor/Kiro       |
| `npm run manifest:generate`                                                           | Generate capability manifest (agent-manifest.json) |
| `npm run validate:agents`                                                             | Validasi agent instruction files                   |

## Maintainer / fork

| Dokumen                                  | Isi                                                 |
| ---------------------------------------- | --------------------------------------------------- |
| [FORK-ONBOARDING.md](FORK-ONBOARDING.md) | Fork template + integrasi ke repo existing (merged) |
| [recipes/README.md](recipes/README.md)   | Contoh playwright.config                            |
| [../CUSTOM-MCP.md](../CUSTOM-MCP.md)     | Kontrak MCP                                         |
| [../MAINTENANCE.md](../MAINTENANCE.md)   | Perawatan framework                                 |

Lihat juga [README.md](../README.md) di root repo.

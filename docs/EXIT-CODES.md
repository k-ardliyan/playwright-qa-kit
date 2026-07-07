# Exit Codes — CLI Reference

> Setiap CLI script di Playwright QA Kit mengembalikan exit code konsisten.
> Referensi ini untuk **scripting, CI, dan non-coder QA** yang ingin tahu "kenapa command ini gagal?".

## Tabel Exit Codes

| Code | Name       | Arti                                                                             | Apa yang harus dilakukan                                |
| ---- | ---------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `0`  | `OK`       | Sukses. Semua check lulus / command selesai tanpa masalah.                       | Lanjut ke step berikutnya.                              |
| `1`  | `FIXABLE`  | Ada error yang **QA bisa perbaiki sendiri** dengan mengikuti hint di output.     | Baca pesan error → jalankan hint → coba lagi.           |
| `2`  | `ESCALATE` | Bug di **framework** atau konfigurasi rusak yang butuh **Framework Maintainer**. | Hubungi maintainer. Jangan coba fix sendiri.            |
| `3`  | `USAGE`    | Argumen CLI salah atau file yang diberikan tidak valid.                          | Cek usage command, jalankan ulang dengan argumen benar. |

## Kapan Exit Code Muncul

| Script                              | Kemungkinan exit code                                         |
| ----------------------------------- | ------------------------------------------------------------- |
| `npm run setup:check`               | `0` (ok) / `1` (ada file missing)                             |
| `npm run health:check`              | `0` (sehat/warn) / `1` (fail) / `2` (escalate)                |
| `npm run validate:requirement -- X` | `0` (valid) / `1` (invalid) / `3` (argumen salah)             |
| `npm run qa:run -- X`               | `0` (semua ok) / `1` (fixable) / `2` (escalate) / `3` (usage) |
| `npm run manual:check`              | `0` (ada / tidak ada manual, info saja)                       |

## Contoh Output

### Success (exit 0)

```
[1/3] Pre-flight setup check
✓ Node.js >= 20.19.0
✓ MCP server built
✓ BASE_URL set

[2/3] Validate requirement
✓ Requirement valid
Score: 100/100

[3/3] Print pipeline prompt
📋 Prompt siap copy-paste ke AI agent:
──────────────────────────────────────
Jalankan pipeline lengkap untuk requirements/login.md ...
──────────────────────────────────────
```

### Fixable error (exit 1)

```
[1/3] Pre-flight setup check
✗ Environment file
  environments/local.env not found
  💡 Salin: cp environments/local.env.example environments/local.env
  📖 docs/GUIDE.md#setup-lokal
```

### Eskalasi (exit 2)

```
🆘 playwright-qa MCP build corrupt
  dist/index-mcp.js exists but fails module load test
  Hubungi Framework Maintainer. Jangan hapus dist/ manual.
```

### Usage error (exit 3)

```
✗ Argumen requirement file tidak ada
  Usage: npm run validate:requirement -- requirements/nama-fitur.md
  💡 Tambahkan path file setelah -- . Contoh: npm run validate:requirement -- requirements/login.md
```

## Untuk Scripting (CI / Shell)

```bash
# Pattern 1: stop on first error
npm run setup:check || { echo "Setup gagal, baca output"; exit 1; }

# Pattern 2: distinguish error types
npm run health:check
case $? in
  0) echo "Sehat, lanjut" ;;
  1) echo "Bisa di-fix sendiri" ;;
  2) echo "Hubungi maintainer" ;;
  3) echo "Salah command" ;;
esac
```

## Untuk CI (GitHub Actions)

```yaml
- name: Setup check
  run: npm run setup:check
  continue-on-error: false # fail PR kalau exit != 0

- name: Validate requirement
  run: npm run validate:requirement -- requirements/example-login-extension.md
  continue-on-error: false
```

## Untuk Non-Coder QA

Kalau Anda bukan developer dan hanya ingin tahu "command-nya gagal atau sukses?":

```bash
# Cara cepat cek exit code TANPA baca output detail
npm run setup:check > /dev/null 2>&1 && echo "✓ Sukses" || echo "✗ Gagal — baca output di atas"
```

Kalau gagal: **scroll ke atas** di terminal, lihat emoji:

- `✓` hijau → sukses
- `⚠` kuning → warning, masih bisa lanjut
- `✗` merah → gagal, baca hint + fix
- `🆘` merah → eskalasi, hubungi maintainer

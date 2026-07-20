# Failure Triage Guide

Dokumen ini adalah panduan untuk mengklasifikasikan dan menangani setiap tipe failure yang muncul dari pipeline Playwright QA.

---

## Tujuan Triage

Triage failure bukan hanya tentang "fix test agar hijau". Tujuannya adalah menjawab:

1. **Apa sumber masalahnya?** — Aplikasi, test, requirement, environment, atau AI generator?
2. **Siapa yang harus menangani?** — QA, developer, PM, atau DevOps?
3. **Apa tindakan yang tepat?** — Fix test, buat bug ticket, revisi requirement, atau perbaiki env?

---

## 5 Kategori Failure Source

### 1. `app` — Bug Aplikasi

**Ciri-ciri:**

- Test logic benar, locator akurat, tapi assertion gagal
- Behavior aplikasi tidak sesuai expected result di requirement
- Healer mengklasifikasikan sebagai `product_bug`
- Failure konsisten di beberapa run (bukan flaky)

**Contoh:**

- Button "Approve" tidak melakukan apa-apa saat diklik
- Pesan error tidak muncul setelah input invalid
- User dengan role `finance` bisa mengakses halaman yang seharusnya diblokir

**Tindakan:** Buat defect ticket. Jangan ubah test.

**Hati-hati:** Jangan terburu-buru mengklasifikasikan sebagai `app` bug tanpa memastikan test logic benar dan selector tidak stale.

---

### 2. `test` — Test Code Bermasalah

**Ciri-ciri:**

- Aplikasi berjalan benar, tapi test assertion salah
- Locator stale (DOM sudah berubah sejak test digenerate)
- Test mengasumsikan state yang berbeda dari kondisi aktual
- Healer berhasil memperbaiki (artinya: locator/timing issue yang healable)

**Contoh:**

- `getByRole('button', { name: 'Submit' })` tapi button sekarang bertuliskan "Kirim"
- `expect(page).toHaveURL('/dashboard')` tapi redirect sekarang ke `/home`
- Timing issue: elemen belum muncul saat di-assert

**Tindakan:** Edit test secara manual atau regenerate dari plan yang sudah diupdate.

---

### 3. `requirement` — Requirement Bermasalah

**Ciri-ciri:**

- Test tidak bisa diimplementasikan karena scenario steps ambigu
- Expected result tidak observable (tidak bisa dibuktikan lewat UI/API)
- Role scope tidak jelas menyebabkan generator membuat asumsi salah
- Scenario bertentangan dengan behavior aplikasi yang sebenarnya diinginkan

**Contoh:**

- "Sistem menampilkan data dengan benar" — tidak ada elemen UI yang bisa di-assert
- Scenario untuk role `finance` tapi tidak ada info akun login yang harus dipakai
- Langkah 3 mengasumsikan data yang tidak ada di environment test

**Tindakan:** Revisi requirement. Diskusikan dengan PM jika perlu klarifikasi.

---

### 4. `env` — Environment / Auth / Data Bermasalah

**Ciri-ciri:**

- Test gagal karena kondisi infrastruktur, bukan karena logika
- Auth file tidak ada atau expired
- Database kosong, seed data tidak tersedia
- API eksternal tidak bisa dijangkau
- Environment variable tidak diset

**Contoh:**

- `.auth/finance.json` tidak ada → login gagal sebelum test bahkan dimulai
- `process.env.BASE_URL` tidak diset → semua test timeout
- Seed data `invoice_approved` tidak ada → test approval gagal karena tidak ada data

**Tindakan:** Perbaiki setup infrastruktur. Rerun setelah diperbaiki.

**Indikator kuat:** Semua test untuk satu role gagal, tapi role lain pass → kemungkinan besar `env` issue (auth file missing).

---

### 5. `ai_generation` — Generator Menghasilkan Kode Salah

**Ciri-ciri:**

- Test structure valid tapi logic tidak sesuai dengan intent scenario
- Generator memilih selector yang salah padahal selector catalog tersedia
- Test melakukan terlalu banyak / terlalu sedikit dari yang diminta scenario
- Skeleton dihasilkan tapi seharusnya bisa digenerate penuh

**Contoh:**

- Scenario "login dengan password salah" tapi generator membuat test login sukses
- Generator menggunakan CSS selector hardcoded padahal selector catalog tersedia
- Test tidak punya `test.use({ storageState })` padahal scenario butuh auth

**Tindakan:** Perbaiki input requirement atau test plan. Edit manual jika lebih cepat. Tandai sebagai AI generation issue agar bisa diidentifikasi polanya.

---

## Alur Triage Step-by-Step

```
Failure muncul di report
        │
        ▼
1. Baca error message dan trace
        │
        ├─ Timeout / element not found
        │         │
        │         ├─ Element berubah di DOM? → test (stale locator)
        │         ├─ Element belum load? → test (timing)
        │         └─ Halaman tidak terbuka sama sekali? → env (auth/URL)
        │
        ├─ Assertion failed (expected ≠ actual)
        │         │
        │         ├─ Actual = behavior app yang salah? → app (bug)
        │         ├─ Actual = behavior app yang benar tapi test salah? → test
        │         └─ Expected result tidak jelas di requirement? → requirement
        │
        ├─ Login failed / unauthorized
        │         │
        │         ├─ Auth file tidak ada? → env
        │         ├─ Kredensial salah di .env? → env
        │         └─ Role tidak punya akses yang di-expect? → app atau requirement
        │
        └─ Test logic tidak masuk akal
                  │
                  └─ Generator salah interpret scenario? → ai_generation
```

---

## Triage dari Output Healer

Healer sudah melakukan triage awal. Gunakan outputnya sebagai starting point:

| Healer output                                              | Likely failure source                    |
| ---------------------------------------------------------- | ---------------------------------------- |
| `fixes: [...]` — healing berhasil                          | `test` (sudah di-heal, bukan unresolved) |
| `cannotFix: reason: "product_bug"`                         | `app`                                    |
| `cannotFix: reason: "auth setup missing"`                  | `env`                                    |
| `cannotFix: reason: "requirement unclear"`                 | `requirement`                            |
| `cannotFix: reason: "generated code doesn't match intent"` | `ai_generation`                          |
| `cannotFix: reason: "seed data missing"`                   | `env`                                    |

---

## Kapan Tidak Perlu Triage Panjang

Beberapa kasus bisa langsung ditangani tanpa triage mendalam:

| Situasi                                               | Tindakan langsung                                    |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Semua test satu role fail                             | Cek `.auth/<role>.json` dulu                         |
| Error `ECONNREFUSED` di semua test                    | Cek `BASE_URL` di `.env`                             |
| `expect(locator).toBeVisible()` fail tapi element ada | Update selector catalog                              |
| Test pass di lokal, fail di CI                        | Cek env variable di CI config                        |
| Flaky test (kadang pass kadang fail)                  | Tambah `await page.waitFor...` atau increase timeout |

---

## Dokumentasi Triage

Untuk setiap unresolved failure yang ditriage, dokumentasikan minimal:

```
Scenario: SC-XX — <nama>
Error: <pesan error singkat>
Failure source: app | test | requirement | env | ai_generation
Analisa: <apa yang ditemukan saat investigasi>
Tindakan: <apa yang akan dilakukan>
Owner: <siapa yang menangani>
Ticket: <nomor issue jika ada>
```

Simpan dokumentasi ini di `reports/archive/<runId>/triage-notes.md`.

---

## Referensi

- Keputusan setelah triage: `docs/QA-DECISION-MODEL.md`
- Auth setup: `docs/AUTH-CONTEXT-CONVENTION.md`
- Healer agent: `.github/agents/healer.agent.md`
- Reporter output format: `.github/agents/reporter.agent.md`

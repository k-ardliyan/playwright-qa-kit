# ERPku Example Suite

Folder ini berisi contoh implementasi **application-specific** untuk ERPku.

## Isi Folder

- `pages/customers/` → POM ERPku untuk domain Customers
- `tests/customers/` → UI tests khusus fitur Customers
- `tests/dashboard/` → dashboard tests yang memakai terminologi ERPku
- `mock-data/login.data.json` → sample data login

## Cara Adaptasi ke Aplikasi Anda

1. Duplikasi struktur ini ke folder contoh/domain aplikasi Anda.
2. Ganti locator, URL path, dan assertion agar sesuai aplikasi target.
3. Pindahkan data statis ke `src/shared/mock-data/` bila sudah generic.
4. Untuk test framework-level, tetap gunakan file generic di `src/`.

> Catatan: folder `src/` sengaja disisakan generic agar template ini reusable untuk proyek selain ERPku.

# REQ-API-001: Invoice Submission Network Assert

## Metadata

- **Module:** invoice
- **Feature:** submit-api
- **Tags:** #api #network #regression
- **Prioritas:** high
- **Risk:** medium
- **Auth state:** authenticated
- **Halaman awal:** /invoices/new
- **Role scope:** finance

## Kriteria Penerimaan

- **AC-01:** Submitting invoice triggers POST /api/v1/invoices with status 201.

## Skenario Uji

### SC-01: Submit invoice with backend verification (@success @network-assert)

- **Test ID:** `TC-NET-001`
- **Covers:** `AC-01`
- **Actor:** `finance`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:**
- Logged in as finance.

**Input Data:**
- amount: literal:5000000

**Langkah:**
1. Fill amount field with 5000000.
2. Click submit button.

**Hasil yang Diharapkan:**
- Request POST `/api/v1/invoices` returns 201 Created with `{ "id": string }`.

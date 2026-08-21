# REQ-FIN-001: Invoice Approval Workflow

## Metadata

- **Module:** finance
- **Feature:** invoice-approval
- **Tags:** #ui #finance #matrix
- **Prioritas:** critical
- **Risk:** high
- **Auth state:** authenticated
- **Halaman awal:** /finance/invoices
- **Role scope:** super-admin, finance, hrd

## Access Matrix

| Role        | Access | Expectation                                   |
| ----------- | ------ | --------------------------------------------- |
| super-admin | allow  | Can view, approve, and reject invoices        |
| finance     | allow  | Can view and approve invoices                 |
| hrd         | deny   | Cannot approve invoices; access is restricted |

## Kriteria Penerimaan

- **AC-01:** Finance user can approve an invoice.
- **AC-02:** HRD user is blocked from approving invoices.

## Skenario Uji

### SC-01: Finance approve invoice (@success)

- **Test ID:** `TC-INV-001`
- **Covers:** `AC-01`
- **Actor:** `finance`
- **Prioritas skenario:** `critical`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:**
- Logged in as finance.
- Invoice #INV-100 is in PENDING state.

**Input Data:**
- invoiceId: literal:INV-100

**Langkah:**
1. Navigate to `/finance/invoices`.
2. Click "Approve" for invoice INV-100.

**Hasil yang Diharapkan:**
- Toast shows "Invoice approved successfully".

### SC-02: HRD restricted from approve button (@access-restriction)

- **Test ID:** `TC-INV-002`
- **Covers:** `AC-02`
- **Actor:** `hrd`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE`

**Prekondisi:**
- Logged in as hrd.

**Input Data:**
- none

**Langkah:**
1. Navigate to `/finance/invoices`.

**Hasil yang Diharapkan:**
- Approve button is hidden or disabled.

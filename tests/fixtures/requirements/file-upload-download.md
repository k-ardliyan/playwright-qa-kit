# REQ-DOC-001: Supporting Document Attachment

## Metadata

- **Module:** document
- **Feature:** upload
- **Tags:** #upload #pdf #fixtures
- **Prioritas:** medium
- **Risk:** low
- **Auth state:** authenticated
- **Halaman awal:** /documents/upload
- **Role scope:** user

## Kriteria Penerimaan

- **AC-01:** User can upload PDF document fixture.

## Skenario Uji

### SC-01: Upload sample PDF attachment (@success)

- **Test ID:** `TC-DOC-001`
- **Covers:** `AC-01`
- **Actor:** `user`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:**
- Logged in as user.

**Input Data:**
- document: fixture:pdf/sample.pdf

**Langkah:**
1. Navigate to `/documents/upload`.
2. Select fixture file `pdf/sample.pdf`.
3. Click "Upload".

**Hasil yang Diharapkan:**
- Uploaded file name "sample.pdf" appears in list.

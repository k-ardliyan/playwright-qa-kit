# REQ-PUB-001: Landing Page Explore

## Metadata

- **Module:** landing
- **Feature:** explore
- **Tags:** #ui #public #smoke
- **Prioritas:** medium
- **Risk:** low
- **Auth state:** unauthenticated
- **Halaman awal:** /

## Kriteria Penerimaan

- **AC-01:** User can view public landing hero banner.
- **AC-02:** User can see quick navigation links.

## Skenario Uji

### SC-01: View landing hero (@smoke @success)

- **Test ID:** `TC-LANDING-001`
- **Covers:** `AC-01`
- **Actor:** `guest`
- **Prioritas skenario:** `medium`
- **Layer terdampak:** `FE`

**Prekondisi:**
- Browser is opened to landing page.

**Input Data:**
- none

**Langkah:**
1. Navigate to `/`.
2. Check hero title visibility.

**Hasil yang Diharapkan:**
- Hero banner displays "Welcome to ERPKu".

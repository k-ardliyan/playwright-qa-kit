# REQ-SEC-001: Hardware Security Key 2FA

## Metadata

- **Module:** security
- **Feature:** fido2-webauthn
- **Tags:** #security #2fa #manual
- **Prioritas:** high
- **Risk:** high
- **Auth state:** authenticated
- **Halaman awal:** /settings/security
- **Role scope:** user

## Kriteria Penerimaan

- **AC-01:** Physical security key tap is prompted during high-risk transfer.

## Skenario Uji

### SC-01: Physical FIDO2 key tap validation (@manual)

- **Test ID:** `TC-SEC-001`
- **Covers:** `AC-01`
- **Actor:** `user`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE` `Hardware`

**Prekondisi:**
- User account configured with physical YubiKey.

**Input Data:**
- none

**Langkah:**
1. Initiate high-risk funds transfer.
2. Insert physical security key and tap sensor when prompted.

**Hasil yang Diharapkan:**
- Browser native dialog closes and transaction completes.

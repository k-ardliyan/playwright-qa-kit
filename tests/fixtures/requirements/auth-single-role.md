# REQ-AUTH-001: User Profile Settings

## Metadata

- **Module:** auth
- **Feature:** profile
- **Tags:** #ui #profile #auth
- **Prioritas:** high
- **Risk:** medium
- **Auth state:** authenticated
- **Halaman awal:** /profile
- **Role scope:** user

## Kriteria Penerimaan

- **AC-01:** Authenticated user can view profile details.
- **AC-02:** User can update display name.

## Skenario Uji

### SC-01: View own profile details (@success)

- **Test ID:** `TC-PROFILE-001`
- **Covers:** `AC-01`
- **Actor:** `user`
- **Prioritas skenario:** `high`
- **Layer terdampak:** `FE` `BE`

**Prekondisi:**
- Logged in as user.

**Input Data:**
- user: credential:user.email

**Langkah:**
1. Navigate to `/profile`.
2. Verify display name is visible.

**Hasil yang Diharapkan:**
- Profile page renders user information accurately.

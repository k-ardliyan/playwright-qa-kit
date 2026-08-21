# PLAN-AUTH-001: Test Plan for User Login

## Metadata

- **Source requirement:** `requirements/_GOOD_EXAMPLE.md`
- **Module:** `auth`
- **Feature:** `login-valid`
- **Seed:** `seed:user.default`

## Catalog Evidence

- **Page:** `login-page` | `artifacts/selector-catalog/auth/login-form.json`

## Scenarios

### SC-01: Login Berhasil dengan Email dan Password Valid (@automated)

- **Test ID:** `TC-AUTH-001`
- **Covers:** `AC-01`, `AC-02`
- **Actor:** `user`
- **Auth Context:** `user`
- **Execution Mode:** `automated`

**Data Setup:**
- Seed user account with valid password

**Actions:**
- Navigate to /login
- Fill input[name="email"] with credential:user.email
- Fill input[name="password"] with credential:user.password
- Click button[type="submit"]

**Assertions:**
- [requirement] URL redirects to /dashboard
- [requirement] Dashboard header displays greeting text
- [requirement] Cookie session_id is stored in browser
- [framework-derived] Page title contains Dashboard

**Locator Intent:**
- input[name="email"]
- input[name="password"]
- button[type="submit"]
- header .user-greeting

**Network Expectations:**
- POST /api/auth/login -> 200

**Artifact Expectations:**
- screenshot on failure

**Cleanup:**
- clear session cookies

**Unknowns:**
- none

---

### SC-02: Login Gagal dengan Password Salah (@automated)

- **Test ID:** `TC-AUTH-002`
- **Covers:** `AC-03`
- **Actor:** `user`
- **Auth Context:** `user`
- **Execution Mode:** `automated`

**Data Setup:**
- Seed user account

**Actions:**
- Navigate to /login
- Fill input[name="email"] with credential:user.email
- Fill input[name="password"] with WrongPassword123!
- Click button[type="submit"]

**Assertions:**
- [requirement] URL remains at /login
- [requirement] Error alert displays Email atau password salah
- [framework-derived] Password input field is cleared

**Locator Intent:**
- input[name="email"]
- input[name="password"]
- button[type="submit"]
- .alert-danger

**Network Expectations:**
- POST /api/auth/login -> 401

**Artifact Expectations:**
- none

**Cleanup:**
- none

**Unknowns:**
- none

---

### SC-03: Submit dengan Email Kosong (@automated)

- **Test ID:** `TC-AUTH-003`
- **Covers:** `AC-04`
- **Actor:** `user`
- **Auth Context:** `user`
- **Execution Mode:** `automated`

**Data Setup:**
- none

**Actions:**
- Navigate to /login
- Fill input[name="password"] with credential:user.password
- Click button[type="submit"]

**Assertions:**
- [requirement] Form submission is blocked by validation
- [requirement] URL remains at /login

**Locator Intent:**
- input[name="email"]
- input[name="password"]
- button[type="submit"]

**Network Expectations:**
- none

**Artifact Expectations:**
- none

**Cleanup:**
- none

**Unknowns:**
- none

---

### SC-04: Akun Terkunci Setelah 5 Kali Gagal (@automated)

- **Test ID:** `TC-AUTH-004`
- **Covers:** `AC-05`
- **Actor:** `user`
- **Auth Context:** `user`
- **Execution Mode:** `automated`

**Data Setup:**
- Seed account with 4 consecutive failed attempts

**Actions:**
- Navigate to /login
- Fill input[name="email"] with credential:user.email
- Fill input[name="password"] with WrongPassword123!
- Click button[type="submit"]

**Assertions:**
- [requirement] URL remains at /login
- [requirement] Lockout alert message is visible
- [framework-derived] Login form inputs are disabled

**Locator Intent:**
- input[name="email"]
- input[name="password"]
- button[type="submit"]
- .lockout-message

**Network Expectations:**
- POST /api/auth/login -> 429

**Artifact Expectations:**
- none

**Cleanup:**
- reset account lock status

**Unknowns:**
- none

---

### SC-05: Login dengan Google OAuth (@manual)

- **Test ID:** `TC-AUTH-005`
- **Covers:** `AC-06`
- **Actor:** `user`
- **Auth Context:** `user`
- **Execution Mode:** `manual`

**Data Setup:**
- Active external Google account

**Actions:**
- Click Google OAuth sign-in button
- Complete authorization in popup

**Assertions:**
- [requirement] Redirected to dashboard upon OAuth success

**Locator Intent:**
- button.google-oauth

**Network Expectations:**
- none

**Artifact Expectations:**
- none

**Cleanup:**
- none

**Unknowns:**
- none

---

## Coverage Gaps

- none

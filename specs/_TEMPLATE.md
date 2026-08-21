# PLAN-XXX: Test Plan for [Feature Name]

<!--
  CARA PAKAI TEST PLAN TEMPLATE (v1.0):
  1. Dibuat oleh Planner Agent dari RequirementContractV1.
  2. Format: Markdown di specs/nama-fitur.plan.md.
  3. Divalidasi via MCP: compile_test_plan dan validate_plan.
-->

## Metadata

- **Source requirement:** `requirements/nama-fitur.md`
- **Source requirement hash:** `[requirement-source-hash]`
- **Module:** `[nama-modul]`
- **Feature:** `[nama-fitur]`
- **Seed:** `seed:[entity].[state]`

## Catalog Evidence

- **Page:** `login-form` | `artifacts/selector-catalog/auth/login-form.json`

## Scenarios

### SC-01: [Nama Skenario] (@automated)

- **Test ID:** `TC-XXX-001`
- **Covers:** `AC-01`, `AC-02`
- **Actor:** `finance`
- **Auth Context:** `finance`
- **Execution Mode:** `automated`

**Data Setup:**
- Seed entity in pending state

**Actions:**
- Navigate to /feature/path
- Fill form inputs
- Click submit button

**Assertions:**
- [requirement] Status changes to expected value
- [framework-derived] Network request succeeds with status 200
- [live-verification] Toast notification is visible

**Locator Intent:**
- input[name="title"]
- button[type="submit"]

**Network Expectations:**
- POST /api/feature -> 200

**Artifact Expectations:**
- screenshot on failure

**Cleanup:**
- none

**Unknowns:**
- none

---

## Coverage Gaps

- **Scenario:** `SC-03` | **AC:** `AC-04` | **Reason:** External OTP authentication requires physical device

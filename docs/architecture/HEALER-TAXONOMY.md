# Healer Failure Classification Taxonomy

> Authoritative taxonomy for failure root-cause triage and healer decision routing.

## Classification Classes (`failureSource`)

| Class           | Root Cause Examples                                                 | Is Healable? | Action / Decision                                               |
| --------------- | ------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| `app`           | 5xx Internal Server Error, unhandled JS exceptions, crash           | ❌ No         | 🐛 **FILE BUG** — keep test as regression guard, report defect  |
| `test`          | Changed DOM element, missing timeout wait, fragile selector         | ✅ Yes        | 🔧 **SELF-HEAL** — update selector/wait, rerun test             |
| `requirement`   | Outdated business logic, changed workflow step, new mandatory field | ❌ No         | 📝 **REVISE REQUIREMENT** — update requirement spec, replan     |
| `env`           | Expired auth token, DB not seeded, network connectivity failure     | ❌ No         | 🔧 **FIX ENVIRONMENT** — refresh auth or reseed database        |
| `ai_generation` | Syntactically invalid code, missing import, ephemeral ref leaked    | ✅ Yes        | 🔧 **FIX GENERATOR** — repair code generation / regenerate test |

## Healability Rules

1. **Application Defect Guard:** Never attempt locator healing when backend returns HTTP 5xx.
2. **Environment Defect Guard:** Never attempt code changes when auth storage state is missing or HTTP 401/403 is received.
3. **Max 3 Cycles:** A maximum of 3 healing cycles per test is enforced before marking as `cannotFix`.

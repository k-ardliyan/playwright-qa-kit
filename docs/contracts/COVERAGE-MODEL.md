# 4-Dimensional Coverage State Model

> Documentation for the 4-dimensional coverage state lifecycle in Playwright QA Kit.

## Coverage Dimensions

```text
Requirement / Plan       Generator            Test Runner           Reporter / QA
┌─────────────────┐   ┌───────────────┐   ┌─────────────────┐   ┌──────────────────┐
│   1. Design     │ → │ 2. Automation │ → │  3. Execution   │ → │ 4. Verification  │
│ planned         │   │ automated     │   │ executed        │   │ passed           │
│ unplanned       │   │ manual        │   │ not-executed    │   │ failed           │
│                 │   │ mixed         │   │                 │   │ healed           │
│                 │   │ unautomated   │   │                 │   │ unverified       │
└─────────────────┘   └───────────────┘   └─────────────────┘   └──────────────────┘
```

1. **Design State (`design`):**
   - `planned`: A corresponding test plan exists in `specs/`.
   - `unplanned`: No test plan exists yet.

2. **Automation State (`automation`):**
   - `automated`: Test specs exist under `tests/` with no manual scenarios.
   - `manual`: Only `@manual` scenarios exist in requirement.
   - `mixed`: Both automated tests and `@manual` scenarios exist.
   - `unautomated`: No test spec generated yet.

3. **Execution State (`execution`):**
   - `executed`: Tests have been executed in the most recent test run.
   - `not-executed`: Tests exist but have not been executed in the active run.

4. **Verification State (`verification`):**
   - `passed`: All executed tests passed.
   - `failed`: One or more tests failed.
   - `healed`: Failure was successfully self-healed by the Healer agent.
   - `unverified`: No execution results recorded yet.

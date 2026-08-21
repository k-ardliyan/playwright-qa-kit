# Harness & Pipeline Execution (`qa:run`)

> Documentation for the CLI harness `tools/scripts/qa-run.ts` and automated pipeline contracts.

## Overview

The `qa:run` CLI acts as a lightweight, typed orchestrator and pre-flight verifier before invoking the full AI Agent pipeline:

```bash
# Validate requirement and pre-flight environment
npm run qa:run -- requirements/auth/sample-login-empty-fields.md

# Dry-run validation only
npm run qa:run -- requirements/auth/sample-login-empty-fields.md --dry-run
```

## Contract Services

Unlike legacy CLI runners that scrape stdout lines with regex, `qa:run` uses typed, in-process contract services:

1. **Pre-flight Check:** Verifies Node, environment files (`config/environments/*.env`), and MCP build status.
2. **Requirement Validation:** Compiles requirement markdown via `compile_requirement` / `validateRequirement`, returning typed violations and deterministic score calculation.
3. **Prompt Generation:** Produces contextual prompt payload with embedded requirement contract, selector catalogs, and agent phase instructions.
4. **State Persistence:** Persists execution envelopes into `artifacts/reports/pipeline-state.json`.

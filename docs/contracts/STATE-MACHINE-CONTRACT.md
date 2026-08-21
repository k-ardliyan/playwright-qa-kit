# State Machine & Invalidation Contract

> Canonical specification for pipeline state persistence, resume safety, and cascade hash invalidation.

## Lifecycle States

```text
       ┌───────────┐
       │   idle    │
       └─────┬─────┘
             │ start
             ▼
       ┌───────────┐
 ┌────►│  running  ├─────┐
 │     └─────┬─────┘     │
 │           │ error     │ complete
 │ resume    ▼           ▼
 │     ┌───────────┐ ┌───────────┐
 └─────┤  paused/  │ │ completed │
       │  failed   │ └───────────┘
       └───────────┘
```

## Cascade Staleness Rules

When the pipeline state is resumed:

1. **Requirement Hash Check:** If `requirementHash` does not match the sha256 hash of the requirement file on disk, all phases (`plan`, `generate`, `execute`, `heal`, `report`) are invalidated and the run restarts from `plan`.
2. **Artifact Integrity Check:** If any artifact file listed for a completed phase is missing from disk, that phase and all downstream phases are invalidated.

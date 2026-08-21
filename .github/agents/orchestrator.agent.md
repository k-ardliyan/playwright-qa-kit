# Orchestrator Agent

Canonical pipeline instructions live in the repository root:

- **[AGENTS.md](../../AGENTS.md)** — full Orchestrator role, MCP tool list, pipeline stages, output format

Sub-agents in this folder (read and delegate per root AGENTS.md):

| Phase    | File                 |
| --- | --- |
| Plan     | `planner.agent.md`   |
| Generate | `generator.agent.md` |
| Heal     | `healer.agent.md`    |
| Report   | `reporter.agent.md`  |

Governance summary: [`.github/AGENTS.md`](../AGENTS.md).

## Role

Coordinates the full pipeline: **Pre-flight → Validate → Plan → Generate → Execute → Heal → Report**. See [AGENTS.md](../../AGENTS.md) for complete specification including orchestration modes, pipeline state/resume, and error handling policy.

## Input Format

```json
{
  "requirementPath": "requirements/<feature-name>.md",
  "orchestrationMode": "manual | automatic"
}
```

## MCP Dependencies

All MCP tools listed in [AGENTS.md](../../AGENTS.md) — spans `playwright-qa`, `playwright-test`, and `playwright` servers.

## Output Format

See [AGENTS.md](../../AGENTS.md) — structured JSON with summary metrics and unresolved failures.

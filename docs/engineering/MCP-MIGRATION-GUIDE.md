# Playwright MCP Modernization — Migration Notes

> Generated for task **MCP-102**.
> Migration guide for developers and QA users transitioning from legacy `.mcp.json` configuration to the framework-owned MCP launcher.

---

## 1. Summary of Changes

| Area                  | Before (Legacy)                               | After (Modernized)                                                         |
| --- | --- | --- |
| **Server Invocation** | `npx -y @playwright/mcp@0.0.78 --headless`    | `npx tsx scripts/playwright-mcp-launch.ts`                                 |
| **Capability Config** | Manual `--caps=network` in `.vscode/mcp.json` | Automatic intent routing (`author`, `debug`, `auth`, `visual`, `artifact`) |
| **Session Isolation** | Default persistent browser session            | Default isolated session per scenario                                      |
| **Authentication**    | Manual browser login                          | Automated storage state resolution (`authStatePath`)                       |
| **Live Assertions**   | External or manual verification               | Native `testing` capability with `LiveVerificationGate`                    |
| **Failure Healing**   | Heuristic selector patching                   | Evidence-backed healing with application bug protection                    |

---

## 2. Configuration Migration

### `.mcp.json` (Project Source of Truth)

Ensure your `.mcp.json` uses the launcher:

```json
{
  "servers": [
    {
      "name": "playwright",
      "command": "npx",
      "args": ["tsx", "scripts/playwright-mcp-launch.ts"]
    },
    {
      "name": "playwright-test",
      "command": "npx",
      "args": ["tsx", "scripts/playwright-test-mcp-launch.ts"]
    },
    {
      "name": "playwright-qa",
      "command": "node",
      "args": ["mcp-server/dist/index-mcp.js"]
    }
  ]
}
```

---

## 3. Running MCP Commands

- **Check MCP compatibility:**
  ```bash
  npm run mcp:check
  ```
- **Launch MCP in author mode with role:**
  ```bash
  npx tsx scripts/playwright-mcp-launch.ts --profile=author --role=finance
  ```
- **Launch MCP in debug mode with devtools & network:**
  ```bash
  npx tsx scripts/playwright-mcp-launch.ts --profile=debug
  ```
- **Interactive Auth Assist (SSO/2FA):**
  ```bash
  npx tsx scripts/playwright-mcp-launch.ts --profile=auth --role=super-admin --headed
  ```

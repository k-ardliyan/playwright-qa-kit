# CUSTOM-MCP

Authoritative documentation for MCP servers and custom QA tools in this repository.

## MCP Server Installation

Register and use these two servers (configured in `.vscode/mcp.json`):

1. **Playwright MCP** (`playwright`)
   - Command: `npx @playwright/mcp`
   - Optional local install: `npm install --save-dev @playwright/mcp`

2. **Custom QA MCP** (`playwright-qa`)
   - Build: `npm run mcp:build` (from root) or `npm run build` (inside `mcp-server/`)
   - Run: `node mcp-server/dist/index-mcp.js` (for standard stdio transport) or `npm run mcp:dev` (for dev mode)

## Running the Custom QA MCP Server

The server supports two transports:

- **Stdio Transport (Standard)**: Used by IDE/extension configurations (e.g. `.vscode/mcp.json`).
  ```bash
  node mcp-server/dist/index-mcp.js
  ```
- **HTTP Transport (Legacy/Testing)**: Listens on port `3100`.
  ```bash
  node mcp-server/dist/index.js
  ```

Default HTTP endpoint (if running HTTP transport): `http://localhost:3100`

---

## Tool: `get_test_failures`

Reads the most recent Playwright JSON result from `test-results/` and returns structured failures.

### Input JSON Schema

```json
{
  "type": "object",
  "properties": {
    "resultsDir": {
      "type": "string",
      "description": "Path to Playwright test-results directory. Defaults to cwd/test-results."
    }
  },
  "additionalProperties": false
}
```

### Output JSON Schema

```json
{
  "type": "object",
  "required": ["failures", "status", "message"],
  "properties": {
    "failures": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["testTitle", "filePath", "errorMessage", "duration"],
        "properties": {
          "testTitle": { "type": "string" },
          "filePath": { "type": "string" },
          "errorMessage": { "type": "string" },
          "duration": { "type": "number" },
          "lineNumber": { "type": "number" },
          "stackTrace": { "type": "string" }
        }
      }
    },
    "status": {
      "type": "string",
      "enum": ["success", "no_results", "error"]
    },
    "message": { "type": "string" }
  }
}
```

### Example HTTP Invocation (cURL)

```bash
curl -X POST http://localhost:3100/tools/get_test_failures
```

---

## Tool: `normalize_requirements`

Normalizes free-text requirements into a canonical contract object.

### Input JSON Schema

```json
{
  "type": "object",
  "required": ["requirementsText"],
  "properties": {
    "requirementsText": { "type": "string" }
  },
  "additionalProperties": false
}
```

### Output JSON Schema

```json
{
  "type": "object",
  "required": ["status"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "contract": {
      "type": "object",
      "required": ["id", "title", "acceptanceCriteria", "tags"],
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "acceptanceCriteria": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "description"],
            "properties": {
              "id": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "error": {
      "type": "object",
      "required": ["code", "message"],
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" }
      }
    }
  }
}
```

### Example HTTP Invocation (cURL)

```bash
curl -X POST http://localhost:3100/tools/normalize_requirements \
  -H "Content-Type: application/json" \
  -d "{\"requirementsText\":\"# Login\\n- User shall login with valid credentials\\n- System shall show dashboard\"}"
```

---

## MCP Client Invocation Example (Stdio/SSE)

```json
{
  "name": "normalize_requirements",
  "arguments": {
    "requirementsText": "# Login\n- User shall login with valid credentials"
  }
}
```

---

## Governance Rule

When any new MCP tool is added or an existing tool schema changes:

1. Update `mcp-server/src/` implementation.
2. Update this `CUSTOM-MCP.md` (name, input schema, output schema, examples).
3. Only then mark the tool work as complete.

`CUSTOM-MCP.md` is the authoritative reference for MCP tool contracts in this repository.

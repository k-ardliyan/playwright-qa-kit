#!/usr/bin/env bash
# Generate upstream Playwright Test Agent definitions for diff review.
# Does NOT overwrite repo agents — output goes to .tmp/init-agents-codex/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.tmp/init-agents-codex"

rm -rf "$OUT"
mkdir -p "$OUT"
cd "$OUT"

echo "[sync-init-agents] Generating upstream agents with --loop=codex ..."
npx playwright init-agents --loop=codex

echo ""
echo "[sync-init-agents] Done. Review diff against:"
echo "  $ROOT/.github/agents/planner.agent.md"
echo "  $ROOT/.github/agents/generator.agent.md"
echo "  $ROOT/.github/agents/healer.agent.md"
echo "  $ROOT/AGENTS.md"
echo ""
echo "Optional cross-check: npx playwright init-agents --loop=vscode in .tmp/init-agents-vscode/"

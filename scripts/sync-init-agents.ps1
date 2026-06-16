# Generate upstream Playwright Test Agent definitions for diff review.
# Does NOT overwrite repo agents — output goes to .tmp/init-agents-codex/
$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Out = Join-Path $Root ".tmp\init-agents-codex"

if (Test-Path $Out) {
  Remove-Item -Recurse -Force $Out
}
New-Item -ItemType Directory -Path $Out -Force | Out-Null
Push-Location $Out

Write-Host "[sync-init-agents] Generating upstream agents with --loop=codex ..."
npx playwright init-agents --loop=codex

Pop-Location

Write-Host ""
Write-Host "[sync-init-agents] Done. Review diff against:"
Write-Host "  $(Join-Path $Root '.github\agents\planner.agent.md')"
Write-Host "  $(Join-Path $Root '.github\agents\generator.agent.md')"
Write-Host "  $(Join-Path $Root '.github\agents\healer.agent.md')"
Write-Host "  $(Join-Path $Root 'AGENTS.md')"
Write-Host ""
Write-Host "Optional cross-check: npx playwright init-agents --loop=vscode in .tmp\init-agents-vscode\"

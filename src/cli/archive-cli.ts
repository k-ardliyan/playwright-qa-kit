#!/usr/bin/env npx tsx
/**
 * Archive CLI — save and view archived test runs.
 *
 * Usage:
 *   npm run archive:save                                # Interactive
 *   npm run archive:save -- --decision=APPROVE          # Non-interactive
 *   npm run archive:save -- --decision=APPROVE --yes    # Skip confirm
 *   npm run archive:view                                # List all
 *   npm run archive:view -- --run=run-20260730-125523   # Detail
 *   npm run archive:view -- --run=run-20260730-125523 --verbose  # Full test cases
 *
 * @module src/cli/archive-cli
 */

import * as path from 'node:path';
import * as readline from 'node:readline';
import {
  saveLatestRun,
  listArchivedRunIds,
  loadArchivedSummary,
  loadArchivedMetadata,
  loadArchivedReport,
  deleteArchivedReport,
  getLatestRunInfo,
  isLatestRunArchived,
  type QaDecision,
} from '../agents/reporter/report-archive';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_DECISIONS: QaDecision[] = [
  'APPROVE',
  'FILE_BUG',
  'REVISE_REQUIREMENT',
  'FIX_TEST',
  'FIX_ENV',
  'MARK_BLOCKED',
];

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    // Support both --key=value and --key value
    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      const key = arg.slice(2, eqIdx);
      result[key] = arg.slice(eqIdx + 1);
      continue;
    }

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      result[key] = next;
      i++;
    } else {
      result[key] = true;
    }
  }
  return result;
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  } catch {
    return iso;
  }
}

// ─── Save Command ────────────────────────────────────────────────────────────

async function saveCommand(args: Record<string, string | boolean>): Promise<void> {
  // Check if there's a latest run to save
  const latestRun = getLatestRunInfo();
  if (!latestRun) {
    console.error('❌ No test run found. Run tests first with: npm run test');
    process.exit(1);
  }

  // Check if already archived
  if (isLatestRunArchived()) {
    console.log('ℹ️  This run has already been saved to history.');
    process.exit(0);
  }

  // Display latest run info
  console.log('\n📊 Latest test run:');
  console.log(`   Ran at:    ${formatTimestamp(latestRun.timestamp)}`);
  console.log(`   Total:     ${latestRun.total}`);
  console.log(`   Passed:    ${latestRun.passed} ✅`);
  console.log(`   Failed:    ${latestRun.failed} ${latestRun.failed > 0 ? '❌' : ''}`);
  console.log(`   Skipped:   ${latestRun.skipped} ⏭️`);
  console.log(`   Pass Rate: ${latestRun.passRate}%`);
  console.log(`   Mode:      ${latestRun.reportMode}`);

  // Parse decision from args
  let decision = args.decision as string | undefined;
  let notes = args.notes as string | undefined;
  const yes = args.yes === true;

  // Interactive mode
  if (!decision) {
    const answer = await askQuestion('\n💾 Save this run to history? (y/N): ');
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Cancelled. Run not saved.');
      process.exit(0);
    }

    console.log(`\n   QA Decision options: ${VALID_DECISIONS.join(' | ')}`);
    const decisionInput = await askQuestion('   Decision: ');
    if (!VALID_DECISIONS.includes(decisionInput as QaDecision)) {
      console.error(
        `❌ Invalid decision: ${decisionInput}. Must be one of: ${VALID_DECISIONS.join(', ')}`,
      );
      process.exit(1);
    }
    decision = decisionInput;
  }

  // Validate decision
  if (!VALID_DECISIONS.includes(decision as QaDecision)) {
    console.error(
      `❌ Invalid decision: ${decision}. Must be one of: ${VALID_DECISIONS.join(', ')}`,
    );
    process.exit(1);
  }

  // Notes — skip prompt when --yes (non-interactive / CI)
  if (notes === undefined) {
    if (yes) {
      notes = '';
    } else {
      notes = (await askQuestion('   Notes (optional): ')) || '';
    }
  }

  // Confirm — skip when --yes
  if (!yes) {
    console.log(`\n   Decision: ${decision}`);
    console.log(`   Notes:    ${notes || '(none)'}`);
    const confirm = await askQuestion('   Confirm save? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled. Run not saved.');
      process.exit(0);
    }
  }

  // Save
  try {
    const result = saveLatestRun({
      qaDecision: decision as QaDecision,
      qaNotes: notes,
      triggerSource: 'cli',
    });
    console.log(`\n✅ Run saved to history!`);
    console.log(`   Run ID:  ${result.runId}`);
    console.log(`   Archive: ${path.relative(process.cwd(), result.archivePath)}`);
  } catch (err) {
    console.error(`❌ Failed to save: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

// ─── View Command ────────────────────────────────────────────────────────────

async function viewCommand(args: Record<string, string | boolean>): Promise<void> {
  const runId = args.run as string | undefined;
  const verbose = args.verbose === true;

  // List mode
  if (!runId) {
    const runIds = listArchivedRunIds();
    if (runIds.length === 0) {
      console.log('No archived runs found. Save a run with: npm run archive:save');
      return;
    }

    console.log(`\n📋 Archived Runs (${runIds.length} total):\n`);
    console.log('  Run ID                    Saved At              Decision    Pass%   Tests');
    console.log('  ───────────────────────── ───────────────────── ─────────── ─────── ──────');

    for (const id of runIds) {
      const metadata = loadArchivedMetadata(id);
      const summary = loadArchivedSummary(id);
      const savedAt = metadata ? formatTimestamp(metadata.savedAt) : '—';
      const decision = metadata?.qaDecision ?? '—';
      const total = (summary?.total as number) ?? '?';
      const passed = (summary?.passed as number) ?? -1;
      const failed = (summary?.failed as number) ?? -1;
      const passRate = (summary?.passRate as number) ?? -1;
      const statusIcon = failed === 0 ? '✅' : failed < 0 ? '❓' : '⚠️';

      console.log(
        `  ${id.padEnd(26)} ${savedAt.padEnd(21)} ${decision.padEnd(11)} ${String(passRate).padStart(5)}%   ${String(total).padStart(2)} (${passed}✅ ${failed}❌) ${statusIcon}`,
      );
    }
    console.log('');
    return;
  }

  // Detail mode
  const summary = loadArchivedSummary(runId);
  const metadata = loadArchivedMetadata(runId);
  const report = loadArchivedReport(runId);

  if (!summary && !report) {
    console.error(`❌ Run not found: ${runId}`);
    process.exit(1);
  }

  console.log(`\n📋 Run Detail: ${runId}`);
  console.log('─'.repeat(60));

  if (metadata) {
    console.log(`  Ran at:     ${formatTimestamp(metadata.ranAt)}`);
    console.log(`  Saved at:   ${formatTimestamp(metadata.savedAt)}`);
    console.log(`  Decision:   ${metadata.qaDecision}`);
    console.log(`  Notes:      ${metadata.qaNotes || '(none)'}`);
    console.log(
      `  Env:        ${metadata.appEnv}${metadata.baseUrl ? ` / ${metadata.baseUrl}` : ''}`,
    );
    console.log(`  Mode:       ${metadata.reportMode ?? '—'}`);
    if (metadata.requirementPath) {
      console.log(`  Requirement:${metadata.requirementPath}`);
    }
  }

  if (summary) {
    console.log('\n  Summary:');
    console.log(
      `    Total: ${summary.total} | Passed: ${summary.passed} ✅ | Failed: ${summary.failed} ❌ | Skipped: ${summary.skipped} ⏭️`,
    );
    console.log(`    Pass Rate: ${summary.passRate}%`);
    console.log(`    Mode: ${summary.reportMode ?? '—'}`);

    if (summary.rolesInScope) {
      console.log(`    Roles: ${(summary.rolesInScope as string[]).join(', ')}`);
    }
  }

  if (report?.summaryByRole && Object.keys(report.summaryByRole).length > 0) {
    console.log('\n  By Role:');
    for (const [role, data] of Object.entries(report.summaryByRole)) {
      console.log(`    ${role}: ${data.passing}✅ ${data.failing}❌ ${data.skipped}⏭️`);
    }
  }

  if (report?.summaryByModule && Object.keys(report.summaryByModule).length > 0) {
    console.log('\n  By Module:');
    for (const [mod, data] of Object.entries(report.summaryByModule)) {
      const features = Object.entries(data.features);
      if (features.length > 0) {
        console.log(`    ${mod}:`);
        for (const [feat, fdata] of features) {
          console.log(`      ${feat}: ${fdata.passing}✅ ${fdata.failing}❌`);
        }
      }
    }
  }

  // Test cases (verbose mode)
  if (verbose && report?.scenarios) {
    console.log('\n  Test Cases:');
    for (const sc of report.scenarios) {
      const icon = sc.status === 'passed' ? '✅' : sc.status === 'failed' ? '❌' : '⏭️';
      const roleStr = sc.role ? ` ${sc.role} /` : '';
      const modStr = sc.module ? ` ${sc.module} /` : '';
      const featStr = sc.feature ? ` ${sc.feature}` : '';
      console.log(`    ${icon} ${sc.scenarioId || sc.name} ${roleStr}${modStr}${featStr}`);
      if (sc.errorMessage) {
        console.log(`       Error: ${sc.errorMessage}`);
      }
    }
  }

  // Unresolved failures
  if (report?.unresolvedFailures && report.unresolvedFailures.length > 0) {
    console.log('\n  Unresolved Failures:');
    for (const f of report.unresolvedFailures) {
      console.log(`    ❌ ${f.scenarioId} (${f.failureSource})`);
      console.log(`       ${f.errorMessage}`);
      if (f.screenshotPath) {
        console.log(`       Screenshot: ${f.screenshotPath}`);
      }
      if (f.tracePath) {
        console.log(`       Trace: ${f.tracePath}`);
      }
    }
  }

  console.log('');
}

// ─── Delete Command ──────────────────────────────────────────────────────────

async function deleteCommand(args: Record<string, string | boolean>): Promise<void> {
  const runId = args.run as string | undefined;
  const yes = args.yes === true;

  if (!runId) {
    console.error('❌ Provide --run=<runId> to delete.');
    process.exit(1);
  }

  if (!yes) {
    const answer = await askQuestion(`⚠️  Delete archive ${runId}? This cannot be undone. (y/N): `);
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  const deleted = deleteArchivedReport(runId);
  if (deleted) {
    console.log(`✅ Deleted archive: ${runId}`);
  } else {
    console.error(`❌ Run not found: ${runId}`);
    process.exit(1);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv);
const command = process.argv[2]?.startsWith('--') ? null : process.argv[2];

switch (command) {
  case 'save':
    saveCommand(args).catch((err) => {
      console.error(err);
      process.exit(1);
    });
    break;
  case 'view':
    viewCommand(args).catch((err) => {
      console.error(err);
      process.exit(1);
    });
    break;
  case 'delete':
    deleteCommand(args).catch((err) => {
      console.error(err);
      process.exit(1);
    });
    break;
  default:
    console.log(`
archive-cli — Save and view archived test runs

Usage:
  npm run archive:save                                # Interactive save
  npm run archive:save -- --decision=APPROVE          # Non-interactive
  npm run archive:save -- --decision=APPROVE --yes    # Skip confirm
  npm run archive:save -- --decision=APPROVE --notes="Clean run"
  npm run archive:view                                # List all saved runs
  npm run archive:view -- --run=<runId>               # View run detail
  npm run archive:view -- --run=<runId> --verbose     # Full test cases
  npm run archive:delete -- --run=<runId>             # Delete archive

QA Decisions:
  APPROVE | FILE_BUG | REVISE_REQUIREMENT | FIX_TEST | FIX_ENV | MARK_BLOCKED
`);
}

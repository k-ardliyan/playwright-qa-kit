/**
 * list_requirement_status — coverage map requirements → plan → tests → manual.
 *
 * Helps QA answer: which features have a plan, generated specs, and manual gaps.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getRepoRoot, isPipelineRequirementRelativePath } from '../utils/safety';
import { getPlaywrightTestRoot } from '../utils/playwright-paths';

export interface RequirementStatusRow {
  requirementPath: string;
  planPath: string | null;
  hasPlan: boolean;
  testPaths: string[];
  hasTests: boolean;
  manualCount: number;
  lastStatus: string | null;
}

export interface ListRequirementStatusOutput {
  status: 'success' | 'error';
  requirements: RequirementStatusRow[];
  message: string;
}

function listFilesRecursive(dirPath: string, extension: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const repoRoot = getRepoRoot();
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && full.endsWith(extension)) {
        files.push(path.relative(repoRoot, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(dirPath);
  return files.sort((a, b) => a.localeCompare(b));
}

/** requirements/auth/login.md → auth/login (handles both / and \ separators) */
function requirementStem(reqRel: string): string {
  return reqRel
    .replace(/\\/g, '/') // normalise backslash first
    .replace(/^requirements\//, '')
    .replace(/\.md$/i, '');
}

function expectedPlanPath(stem: string): string {
  return `specs/${stem}-test-plan.md`;
}

function countManualScenarios(markdown: string): number {
  const matches = markdown.match(/^###\s+.+\(@manual\)/gim);
  return matches?.length ?? 0;
}

function loadLastStatusByFile(): Map<string, string> {
  const map = new Map<string, string>();
  const summaryPath = path.join(getRepoRoot(), 'reports', 'test-summary.json');
  if (!fs.existsSync(summaryPath)) return map;
  try {
    const raw = JSON.parse(fs.readFileSync(summaryPath, 'utf-8')) as {
      testCases?: Array<{ title?: string; status?: string; filePath?: string }>;
    };
    for (const tc of raw.testCases ?? []) {
      const file = (tc.filePath ?? '').replace(/\\/g, '/');
      if (!file || !tc.status) continue;
      // Prefer worst status if multiple cases per file
      const prev = map.get(file);
      if (!prev || prev === 'passed' || tc.status === 'failed' || tc.status === 'timedOut') {
        map.set(file, tc.status);
      }
    }
  } catch {
    // ignore corrupt summary
  }
  return map;
}

function lastStatusForTests(testPaths: string[], statusByFile: Map<string, string>): string | null {
  if (testPaths.length === 0) return null;
  const statuses = testPaths.map((p) => statusByFile.get(p)).filter(Boolean) as string[];
  if (statuses.length === 0) return null;
  if (statuses.some((s) => s === 'failed' || s === 'timedOut' || s === 'interrupted')) {
    return 'failed';
  }
  if (statuses.every((s) => s === 'passed')) return 'passed';
  if (statuses.some((s) => s === 'skipped')) return 'skipped';
  return statuses[0] ?? null;
}

export function listRequirementStatus(): ListRequirementStatusOutput {
  const repoRoot = getRepoRoot();
  const reqDir = path.join(repoRoot, 'requirements');
  const allReq = listFilesRecursive(reqDir, '.md').filter((r) =>
    isPipelineRequirementRelativePath(r),
  );
  const allSpecs = new Set(listFilesRecursive(path.join(repoRoot, 'specs'), '.md'));
  const testRoot = path.join(repoRoot, ...getPlaywrightTestRoot().split('/'));
  const allTests = listFilesRecursive(testRoot, '.spec.ts');
  const statusByFile = loadLastStatusByFile();

  const rows: RequirementStatusRow[] = allReq.map((requirementPath) => {
    const stem = requirementStem(requirementPath);
    const planCandidates = [
      expectedPlanPath(stem),
      // Flat legacy: nested req may still have plan under specs/<basename>-test-plan.md
      `specs/${path.posix.basename(stem)}-test-plan.md`,
    ];
    const planPath = planCandidates.find((p) => allSpecs.has(p)) ?? null;
    const hasPlan = planPath !== null;
    const baseName = path.posix.basename(stem);
    const dir = path.posix.dirname(stem);
    const testPaths = allTests.filter((t) => {
      const rel = t.replace(/^src\/tests\//, '').replace(/\.spec\.ts$/, '');
      // Mirror: requirements/auth/foo → src/tests/auth/foo*.spec.ts
      if (dir === '.') {
        return rel === baseName || rel.startsWith(`${baseName}-`);
      }
      return (
        rel === stem ||
        rel.startsWith(`${stem}-`) ||
        rel.startsWith(`${dir}/${baseName}-`) ||
        rel === baseName ||
        rel.startsWith(`${baseName}-`)
      );
    });

    let manualCount = 0;
    try {
      const md = fs.readFileSync(path.join(repoRoot, requirementPath), 'utf-8');
      manualCount = countManualScenarios(md);
    } catch {
      // ignore
    }

    return {
      requirementPath,
      planPath,
      hasPlan,
      testPaths,
      hasTests: testPaths.length > 0,
      manualCount,
      lastStatus: lastStatusForTests(testPaths, statusByFile),
    };
  });

  const planned = rows.filter((r) => r.hasPlan).length;
  const tested = rows.filter((r) => r.hasTests).length;
  return {
    status: 'success',
    requirements: rows,
    message: `${rows.length} requirement(s): ${planned} with plan, ${tested} with tests.`,
  };
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getRepoRoot } from '../utils/safety';
import { mcpWorkspace } from '../utils/workspace-paths';

export interface ArchiveReportInput {
  runId: string;
  reportPath: string;
  jsonReportPath?: string;
}

export interface ArchiveReportOutput {
  status: 'success' | 'error';
  archivePath?: string;
  archivedFiles?: string[];
  message: string;
}

/**
 * Archive a pipeline report (Markdown + optional JSON) to artifacts/reports/archive/<runId>/.
 * Safe to call multiple times — overwrites if already exists.
 */
export function archiveReport(input: ArchiveReportInput): ArchiveReportOutput {
  const { runId, reportPath, jsonReportPath } = input;

  if (!runId || typeof runId !== 'string' || runId.trim().length === 0) {
    return { status: 'error', message: 'runId is required and must be a non-empty string.' };
  }

  // Sanitise runId — only allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) {
    return {
      status: 'error',
      message: `Invalid runId "${runId}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
    };
  }

  const repoRoot = getRepoRoot();
  const archiveDir = path.join(mcpWorkspace.reportsDir, 'archive', runId);

  // Resolve and validate report path — must be inside repo
  const absoluteReportPath = path.resolve(repoRoot, reportPath);
  if (!absoluteReportPath.startsWith(repoRoot)) {
    return {
      status: 'error',
      message: `reportPath "${reportPath}" must be inside the repository root.`,
    };
  }

  if (!fs.existsSync(absoluteReportPath)) {
    return {
      status: 'error',
      message: `Report file not found: ${reportPath}`,
    };
  }

  try {
    fs.mkdirSync(archiveDir, { recursive: true });

    const archivedFiles: string[] = [];

    // Copy Markdown report
    const mdDest = path.join(archiveDir, path.basename(absoluteReportPath));
    fs.copyFileSync(absoluteReportPath, mdDest);
    archivedFiles.push(path.relative(repoRoot, mdDest).replace(/\\/g, '/'));

    // Copy JSON report if provided
    if (jsonReportPath) {
      const absoluteJsonPath = path.resolve(repoRoot, jsonReportPath);
      if (!absoluteJsonPath.startsWith(repoRoot)) {
        return {
          status: 'error',
          message: `jsonReportPath "${jsonReportPath}" must be inside the repository root.`,
        };
      }
      if (fs.existsSync(absoluteJsonPath)) {
        const jsonDest = path.join(archiveDir, path.basename(absoluteJsonPath));
        fs.copyFileSync(absoluteJsonPath, jsonDest);
        archivedFiles.push(path.relative(repoRoot, jsonDest).replace(/\\/g, '/'));
      }
    }

    // Write archive metadata
    const meta = {
      runId,
      archivedAt: new Date().toISOString(),
      files: archivedFiles,
    };
    fs.writeFileSync(path.join(archiveDir, 'archive-meta.json'), JSON.stringify(meta, null, 2));

    const archivePath = path.relative(repoRoot, archiveDir).replace(/\\/g, '/');

    return {
      status: 'success',
      archivePath,
      archivedFiles,
      message: `Report archived to ${archivePath} (${archivedFiles.length} file(s)).`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error archiving report';
    return { status: 'error', message };
  }
}

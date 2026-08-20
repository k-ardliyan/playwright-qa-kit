import * as fs from 'node:fs';
import * as path from 'node:path';

export interface RetentionPolicyOptions {
  maxAgeDays?: number;
}

export interface CleanupResult {
  deletedFiles: string[];
  retainedCount: number;
  freedBytes: number;
}

/**
 * Enforce artifact retention policy on an artifact directory. Recursively deletes
 * modified files older than the age threshold while conservatively counting
 * retained entries (files plus non-empty subdirectories).
 */
export function applyArtifactRetention(
  targetDir: string,
  options: RetentionPolicyOptions = {},
): CleanupResult {
  const maxAgeDays = options.maxAgeDays ?? 14;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const result: CleanupResult = { deletedFiles: [], retainedCount: 0, freedBytes: 0 };

  if (!fs.existsSync(targetDir)) {
    return result;
  }

  walk(targetDir);

  return result;

  function walk(dir: string): boolean {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let hasContent = false;

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      try {
        if (entry.isDirectory()) {
          if (walk(fullPath)) {
            hasContent = true; // subdirectory kept (has retained content)
          } else {
            fs.rmdirSync(fullPath); // empty subdir removed
          }
          continue;
        }

        const stats = fs.statSync(fullPath);
        const isOld = now - stats.mtimeMs > maxAgeMs;
        if (isOld) {
          result.freedBytes += stats.size;
          fs.unlinkSync(fullPath);
          result.deletedFiles.push(fullPath);
        } else {
          hasContent = true;
          result.retainedCount++;
        }
      } catch {
        // Ignore individual file/dir errors
      }
    }

    return hasContent;
  }
}

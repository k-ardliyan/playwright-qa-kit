import * as fs from 'node:fs';
import * as path from 'node:path';
import { logger } from './logger';

function listJsonFilesRecursively(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsonFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

export function getLatestJsonResultFile(resultsDir: string): string | null {
  const jsonFiles = listJsonFilesRecursively(resultsDir);
  if (jsonFiles.length === 0) {
    return null;
  }

  const latest = jsonFiles
    .map((filePath) => ({ filePath, mtimeMs: fs.statSync(filePath).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

  return latest?.filePath ?? null;
}

export function readTextFile(filePath: string): string {
  logger.info('Reading file.', { filePath });
  return fs.readFileSync(filePath, 'utf-8');
}

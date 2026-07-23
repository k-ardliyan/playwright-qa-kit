import * as fs from 'node:fs';
import * as path from 'node:path';
import { getRepoRoot, isPipelineRequirementRelativePath } from '../utils/safety';
import { getPlaywrightTestRoot } from '../utils/playwright-paths';

export interface ListArtifactsOutput {
  status: 'success' | 'error';
  requirements: string[];
  specs: string[];
  tests: string[];
  message: string;
}

function listFilesRecursive(dirPath: string, extension: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const repoRoot = getRepoRoot();
  const files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath, extension));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(extension)) {
      files.push(path.relative(repoRoot, fullPath).replace(/\\/g, '/'));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function listRequirementFeatures(): string[] {
  const repoRoot = getRepoRoot();
  const requirementsDir = path.join(repoRoot, 'requirements');
  // Reuse the recursive walker — supports both flat and nested domain subfolders
  const all = listFilesRecursive(requirementsDir, '.md');
  return all.filter((relative) => isPipelineRequirementRelativePath(relative));
}

export function listArtifacts(): ListArtifactsOutput {
  const requirements = listRequirementFeatures();
  const specs = listFilesRecursive(path.join(getRepoRoot(), 'specs'), '.md');
  const tests = listFilesRecursive(
    path.join(getRepoRoot(), ...getPlaywrightTestRoot().split('/')),
    '.spec.ts',
  );

  return {
    status: 'success',
    requirements,
    specs,
    tests,
    message: `Found ${requirements.length} requirement(s), ${specs.length} spec(s), ${tests.length} test file(s).`,
  };
}

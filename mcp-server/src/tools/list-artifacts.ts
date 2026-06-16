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

  if (!fs.existsSync(requirementsDir)) {
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(requirementsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }

    const relative = `requirements/${entry.name}`;
    if (isPipelineRequirementRelativePath(relative)) {
      files.push(relative);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
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

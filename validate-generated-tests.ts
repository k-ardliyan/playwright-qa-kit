/// <reference types="node" />

import fs from 'fs';
import path from 'path';

interface Violation {
  filePath: string;
  lineNumber: number;
  ruleName: string;
}

const TEST_ROOT = path.resolve(process.cwd(), 'src/tests');

function warn(message: string, error?: unknown): void {
  const details = error instanceof Error ? ` (${error.message})` : '';
  console.warn(`[WARN] ${message}${details}`);
}

function toRelative(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function getLineNumberFromIndex(content: string, index: number): number {
  if (index <= 0) {
    return 1;
  }
  return content.slice(0, index).split(/\r?\n/).length;
}

function findSpecFiles(dirPath: string): string[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files.push(...findSpecFiles(fullPath));
        continue;
      }

      if (entry.isFile() && fullPath.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    warn(`Unable to read directory: ${toRelative(dirPath)}`, error);
    return [];
  }
}

function validateImportRule(content: string, filePath: string): Violation | null {
  const importRegex = /import\s*{([^}]*)}\s*from\s*['"]@\/fixtures\/base\.fixture['"]/g;
  const match = importRegex.exec(content);

  if (!match) {
    return {
      filePath,
      lineNumber: 1,
      ruleName: 'Import rule: must import test from @/fixtures/base.fixture',
    };
  }

  const importClause = match[1] ?? '';
  const hasTestImport = /\btest\b/.test(importClause);

  if (!hasTestImport) {
    return {
      filePath,
      lineNumber: getLineNumberFromIndex(content, match.index),
      ruleName: 'Import rule: base fixture import must include test',
    };
  }

  return null;
}

function validatePresenceRule(
  content: string,
  filePath: string,
  regex: RegExp,
  ruleName: string,
): Violation | null {
  const match = regex.exec(content);
  if (match && typeof match.index === 'number') {
    return null;
  }

  return {
    filePath,
    lineNumber: 1,
    ruleName,
  };
}

function validateFile(filePath: string): Violation[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    warn(`Unable to read file: ${toRelative(filePath)}`, error);
    return [];
  }

  const violations: Violation[] = [];

  const importViolation = validateImportRule(content, filePath);
  if (importViolation) {
    violations.push(importViolation);
  }

  const describeViolation = validatePresenceRule(
    content,
    filePath,
    /test\.describe\s*\(/,
    'Describe rule: must contain at least one test.describe(...) block',
  );
  if (describeViolation) {
    violations.push(describeViolation);
  }

  const stepViolation = validatePresenceRule(
    content,
    filePath,
    /test\.step\s*\(/,
    'Step rule: must contain at least one test.step(...) call',
  );
  if (stepViolation) {
    violations.push(stepViolation);
  }

  return violations;
}

function main(): void {
  const specFiles = findSpecFiles(TEST_ROOT).sort((a, b) => a.localeCompare(b));
  const violations: Violation[] = [];

  for (const filePath of specFiles) {
    violations.push(...validateFile(filePath));
  }

  if (violations.length > 0) {
    for (const violation of violations) {
      const relativePath = toRelative(violation.filePath);
      console.error(
        `✗ ${relativePath}:${violation.lineNumber}\n  Violation: ${violation.ruleName}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`✓ Validated ${specFiles.length} test files`);
  console.log('✓ All structural checks passed');
  process.exitCode = 0;
}

main();

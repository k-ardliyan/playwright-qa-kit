import * as fs from 'node:fs';
import * as path from 'node:path';
import { getRepoRoot, resolveAllowedPath } from '../utils/safety';

export interface ValidationViolation {
  filePath: string;
  lineNumber: number;
  ruleName: string;
}

export interface ValidateGeneratedTestsOutput {
  status: 'success' | 'error';
  validatedCount: number;
  violations: ValidationViolation[];
  message: string;
}

const DEFAULT_TEST_ROOT = 'src/tests';

/**
 * Pre-existing or utility specs are exempt from the `// spec:` and `// seed:`
 * traceability header rules. Exemption is directory-scoped (not exact-path)
 * so adding a new utility spec in an exempt directory doesn't require a code
 * change here.
 */
const TRACEABILITY_EXEMPT_PREFIXES: ReadonlyArray<string> = [
  'src/tests/demo/',
  'src/tests/ui/smoke/',
  'src/tests/ui/auth/',
];
const TRACEABILITY_EXEMPT_FILES: ReadonlyArray<string> = ['src/tests/seed.spec.ts'];

function normalizeRelativePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function isTraceabilityExempt(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  if (normalized.includes('__property_validator__')) {
    return true;
  }
  if (TRACEABILITY_EXEMPT_FILES.includes(normalized)) {
    return true;
  }
  return TRACEABILITY_EXEMPT_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function getLineNumberFromIndex(content: string, index: number): number {
  if (index <= 0) {
    return 1;
  }
  return content.slice(0, index).split(/\r?\n/).length;
}

function findSpecFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

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
}

function validateImportRule(content: string, filePath: string): ValidationViolation | null {
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
  if (!/\btest\b/.test(importClause)) {
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
): ValidationViolation | null {
  if (regex.test(content)) {
    return null;
  }
  return { filePath, lineNumber: 1, ruleName };
}

function validateTraceabilityRule(
  content: string,
  filePath: string,
  relativePath: string,
): ValidationViolation[] {
  if (isTraceabilityExempt(relativePath)) {
    return [];
  }

  const violations: ValidationViolation[] = [];

  if (!/\/\/\s*spec:\s*.+/m.test(content)) {
    violations.push({
      filePath,
      lineNumber: 1,
      ruleName: 'Traceability rule: must include // spec: <path> comment before imports',
    });
  }

  if (!/\/\/\s*seed:\s*.+/m.test(content)) {
    violations.push({
      filePath,
      lineNumber: 1,
      ruleName:
        'Traceability rule: must include // seed: src/tests/seed.spec.ts comment before imports',
    });
  }

  return violations;
}

export function validateSpecFile(filePath: string, relativePath?: string): ValidationViolation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations: ValidationViolation[] = [];
  const rel = relativePath ?? normalizeRelativePath(filePath);

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

  violations.push(...validateTraceabilityRule(content, filePath, rel));

  return violations;
}

export function validateGeneratedTests(filePath?: string): ValidateGeneratedTestsOutput {
  const repoRoot = getRepoRoot();
  const violations: ValidationViolation[] = [];
  let specFiles: string[];

  if (filePath) {
    const resolved = resolveAllowedPath(filePath, 'tests', { mustExist: true });
    if (!resolved.ok) {
      return {
        status: 'error',
        validatedCount: 0,
        violations: [],
        message: resolved.error.message,
      };
    }

    if (!resolved.absolutePath.endsWith('.spec.ts')) {
      return {
        status: 'error',
        validatedCount: 0,
        violations: [],
        message: 'Only .spec.ts files can be validated.',
      };
    }

    specFiles = [resolved.absolutePath];
  } else {
    specFiles = findSpecFiles(path.join(repoRoot, DEFAULT_TEST_ROOT)).sort((a, b) =>
      a.localeCompare(b),
    );
  }

  for (const specPath of specFiles) {
    const relativeSpecPath = normalizeRelativePath(path.relative(repoRoot, specPath));
    try {
      violations.push(...validateSpecFile(specPath, relativeSpecPath));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read file';
      violations.push({
        filePath: specPath,
        lineNumber: 1,
        ruleName: `Read error: ${message}`,
      });
    }
  }

  const relativeViolations = violations.map((v) => ({
    ...v,
    filePath: path.relative(repoRoot, v.filePath).replace(/\\/g, '/'),
  }));

  if (relativeViolations.length > 0) {
    return {
      status: 'error',
      validatedCount: specFiles.length,
      violations: relativeViolations,
      message: `Found ${relativeViolations.length} violation(s) across ${specFiles.length} file(s).`,
    };
  }

  return {
    status: 'success',
    validatedCount: specFiles.length,
    violations: [],
    message: `Validated ${specFiles.length} test file(s); all structural checks passed.`,
  };
}

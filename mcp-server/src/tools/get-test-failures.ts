import * as path from 'node:path';
import { getLatestJsonResultFile, readTextFile } from '../utils/file-reader';
import { safeJsonParse } from '../utils/json-parser';
import { logger } from '../utils/logger';

export interface TestFailure {
  testTitle: string;
  filePath: string;
  errorMessage: string;
  duration: number;
  lineNumber?: number;
  stackTrace?: string;
}

export interface GetTestFailuresOutput {
  failures: TestFailure[];
  status: 'success' | 'no_results' | 'error';
  message: string;
}

interface ParsedErrorLocation {
  line?: number;
}

interface ParsedError {
  message?: string;
  value?: string;
  stack?: string;
  location?: ParsedErrorLocation;
}

interface ParsedResult {
  status?: string;
  duration?: number;
  error?: ParsedError;
  errors?: ParsedError[];
}

interface ParsedLocation {
  file?: string;
  line?: number;
}

interface ParsedTest {
  title?: string;
  results?: ParsedResult[];
  location?: ParsedLocation;
}

interface ParsedSpec {
  title?: string;
  tests?: ParsedTest[];
  file?: string;
}

interface ParsedSuite {
  title?: string;
  specs?: ParsedSpec[];
  suites?: ParsedSuite[];
  file?: string;
}

function extractErrorMessage(result: ParsedResult): string {
  const firstError = result.errors?.[0];
  return (
    result?.error?.message ??
    firstError?.message ??
    firstError?.value ??
    result?.error?.value ??
    'Unknown Playwright failure'
  );
}

function extractStackTrace(result: ParsedResult): string | undefined {
  const firstError = result.errors?.[0];
  return result.error?.stack ?? firstError?.stack;
}

function traverseSuites(
  suiteNode: ParsedSuite,
  inheritedTitle: string,
  failures: TestFailure[],
): void {
  const suiteTitle = [inheritedTitle, suiteNode.title].filter(Boolean).join(' > ');

  const specs = Array.isArray(suiteNode.specs) ? suiteNode.specs : [];
  for (const spec of specs) {
    const specTitle = [suiteTitle, spec.title].filter(Boolean).join(' > ');
    const tests = Array.isArray(spec.tests) ? spec.tests : [];

    for (const test of tests) {
      const testTitle = [specTitle, test.title].filter(Boolean).join(' > ');
      const results = Array.isArray(test.results) ? test.results : [];

      for (const result of results) {
        if (!['failed', 'timedOut', 'interrupted'].includes(result.status ?? '')) {
          continue;
        }

        const lineNumber = result.error?.location?.line ?? test.location?.line;
        const filePath = test.location?.file ?? spec.file ?? suiteNode.file ?? 'unknown';
        const failure: TestFailure = {
          testTitle: testTitle || 'Unnamed test',
          filePath,
          errorMessage: extractErrorMessage(result),
          duration: Number(result.duration ?? 0),
        };

        if (typeof lineNumber === 'number') {
          failure.lineNumber = lineNumber;
        }

        const stackTrace = extractStackTrace(result);
        if (stackTrace) {
          failure.stackTrace = stackTrace;
        }

        failures.push(failure);
      }
    }
  }

  const childSuites = Array.isArray(suiteNode.suites) ? suiteNode.suites : [];
  for (const child of childSuites) {
    traverseSuites(child, suiteTitle, failures);
  }
}

function parsePlaywrightResult(content: unknown): TestFailure[] {
  if (
    typeof content === 'object' &&
    content !== null &&
    Array.isArray((content as { failures?: unknown }).failures)
  ) {
    return ((content as { failures: unknown[] }).failures ?? [])
      .map((item): TestFailure | null => {
        const row = item as Partial<TestFailure>;
        if (!row.testTitle || !row.filePath || !row.errorMessage) {
          return null;
        }

        const mapped: TestFailure = {
          testTitle: String(row.testTitle),
          filePath: String(row.filePath),
          errorMessage: String(row.errorMessage),
          duration: Number(row.duration ?? 0),
        };

        if (typeof row.lineNumber === 'number') {
          mapped.lineNumber = row.lineNumber;
        }

        if (typeof row.stackTrace === 'string') {
          mapped.stackTrace = row.stackTrace;
        }

        return mapped;
      })
      .filter((item): item is TestFailure => item !== null);
  }

  const root = content as { suites?: ParsedSuite[] };
  const rootSuites = Array.isArray(root.suites) ? root.suites : [];
  const failures: TestFailure[] = [];

  for (const suite of rootSuites) {
    traverseSuites(suite, '', failures);
  }

  return failures;
}

export function getTestFailures(
  resultsDir = path.resolve(process.cwd(), 'test-results'),
): GetTestFailuresOutput {
  try {
    const latestResultFile = getLatestJsonResultFile(resultsDir);
    if (!latestResultFile) {
      const message = `No Playwright JSON results found in '${resultsDir}'.`;
      logger.info(message);
      return {
        failures: [],
        status: 'no_results',
        message,
      };
    }

    const raw = readTextFile(latestResultFile);
    const parsed = safeJsonParse<unknown>(raw);
    if (!parsed.ok) {
      return {
        failures: [],
        status: 'error',
        message: parsed.error.message,
      };
    }

    const failures = parsePlaywrightResult(parsed.data);
    logger.info('Collected Playwright test failures.', {
      latestResultFile,
      failureCount: failures.length,
    });

    return {
      failures,
      status: 'success',
      message: `Parsed ${failures.length} failure(s) from ${latestResultFile}`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error while reading test failures';
    logger.error('Failed to collect test failures.', { message });

    return {
      failures: [],
      status: 'error',
      message,
    };
  }
}

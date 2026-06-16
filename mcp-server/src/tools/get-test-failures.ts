import * as fs from 'node:fs';
import * as path from 'node:path';
import { getLatestJsonResultFile, readTextFile } from '../utils/file-reader';
import { safeJsonParse } from '../utils/json-parser';
import { getJsonResultsPath } from '../utils/playwright-paths';
import { getRepoRoot } from '../utils/safety';
import { logger } from '../utils/logger';

export interface TestFailure {
  testTitle: string;
  filePath: string;
  errorMessage: string;
  duration: number;
  lineNumber?: number;
  stackTrace?: string;
  tracePath?: string;
  screenshotPath?: string;
}

export interface GetTestFailuresOutput {
  failures: TestFailure[];
  status: 'success' | 'failure' | 'no_results' | 'partial' | 'error';
  message: string;
  sourceFile?: string;
}

interface ParsedAttachment {
  name?: string;
  path?: string;
  contentType?: string;
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
  attachments?: ParsedAttachment[];
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

const DEFAULT_RESULTS_DIR = path.resolve(getRepoRoot(), 'test-results');

function resolveResultsFile(resultsDir: string): string | null {
  const repoRoot = getRepoRoot();
  const normalizedDir = path.resolve(resultsDir);
  const defaultResultsDir = path.resolve(repoRoot, 'test-results');

  // Config-mapped JSON applies only when browsing the default test-results root.
  // Explicit subdirs (property fixtures, scoped Healer runs) must not pick stale global JSON.
  if (normalizedDir === defaultResultsDir) {
    const configMapped = path.resolve(repoRoot, getJsonResultsPath());
    if (fs.existsSync(configMapped)) {
      return configMapped;
    }
  }

  // Latest .json in the caller-supplied dir (default: test-results/).
  const latestInDir = getLatestJsonResultFile(resultsDir);
  if (latestInDir) {
    return latestInDir;
  }

  // Legacy results.json fallback.
  const explicit = path.resolve(resultsDir, 'results.json');
  return fs.existsSync(explicit) ? explicit : null;
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

function extractAttachmentPaths(result: ParsedResult): {
  tracePath?: string;
  screenshotPath?: string;
} {
  const attachments = Array.isArray(result.attachments) ? result.attachments : [];
  let tracePath: string | undefined;
  let screenshotPath: string | undefined;

  for (const attachment of attachments) {
    const name = (attachment.name ?? '').toLowerCase();
    const attachmentPath = attachment.path;
    if (!attachmentPath) {
      continue;
    }

    if (!tracePath && (name.includes('trace') || attachmentPath.endsWith('.zip'))) {
      tracePath = attachmentPath;
    }
    if (
      !screenshotPath &&
      (name.includes('screenshot') || attachment.contentType?.startsWith('image/'))
    ) {
      screenshotPath = attachmentPath;
    }
  }

  return { tracePath, screenshotPath };
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

      // Only the LAST attempt per test is authoritative — earlier failed
      // attempts that were retried-and-passed should not be reported.
      const lastResult = results[results.length - 1];
      if (!lastResult) continue;
      if (!['failed', 'timedOut', 'interrupted'].includes(lastResult.status ?? '')) {
        continue;
      }

      const result = lastResult;
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

      const { tracePath, screenshotPath } = extractAttachmentPaths(result);
      if (tracePath) {
        failure.tracePath = tracePath;
      }
      if (screenshotPath) {
        failure.screenshotPath = screenshotPath;
      }

      failures.push(failure);
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
        if (typeof row.tracePath === 'string') {
          mapped.tracePath = row.tracePath;
        }
        if (typeof row.screenshotPath === 'string') {
          mapped.screenshotPath = row.screenshotPath;
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

export function getTestFailures(resultsDir: string = DEFAULT_RESULTS_DIR): GetTestFailuresOutput {
  // Path containment is enforced at the MCP dispatch boundary (see
  // `mcp-server/src/tools/registry.ts` for the get_test_failures handler).
  // Direct callers (property tests, scripts) pass repo-relative paths
  // resolved against the cwd or absolute paths inside the temp dir; the
  // function trusts its input here.
  try {
    const resultFile = resolveResultsFile(resultsDir);
    if (!resultFile) {
      const message = `No Playwright JSON results found. Expected '${getJsonResultsPath()}' or JSON under '${resultsDir}'.`;
      logger.info(message);
      return {
        failures: [],
        status: 'no_results',
        message,
      };
    }

    const raw = readTextFile(resultFile);
    const parsed = safeJsonParse<unknown>(raw);
    if (!parsed.ok) {
      return {
        failures: [],
        status: 'error',
        message: parsed.error.message,
        sourceFile: resultFile,
      };
    }

    const failures = parsePlaywrightResult(parsed.data);
    const hasSuites =
      typeof parsed.data === 'object' &&
      parsed.data !== null &&
      Array.isArray((parsed.data as { suites?: unknown }).suites);

    const status: GetTestFailuresOutput['status'] =
      failures.length > 0 ? 'failure' : hasSuites ? 'success' : 'partial';

    logger.info('Collected Playwright test failures.', {
      resultFile,
      failureCount: failures.length,
      status,
    });

    return {
      failures,
      status,
      message: `Parsed ${failures.length} failure(s) from ${resultFile}`,
      sourceFile: resultFile,
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

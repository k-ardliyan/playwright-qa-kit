/**
 * Multi-Browser Executor and Result Merger
 *
 * Executes tests across chromium, firefox, and webkit browser targets
 * independently. Merges results and classifies cross-browser vs
 * browser-specific failures.
 *
 * Key behaviors:
 * - Browsers execute independently (failure in one doesn't block others)
 * - Cross-browser failures: test fails on some browsers, passes on others
 * - Browser-specific failures: test fails on exactly one browser
 * - Universal failures (fail on ALL browsers) are excluded from cross/specific lists
 * - Browser launch failure: mark tests as skipped, continue with remaining
 *
 * @module executor/multi-browser
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import type {
  BrowserTarget,
  BrowserResult,
  ShardResult,
  MergedExecutionResult,
  CrossBrowserFailure,
  MatrixExecutionResult,
  TestFailure,
  BrowserMatrix,
  BrowserMatrixOptions,
  TestShard,
  ExecutionSummary,
  RootCauseCategory,
} from '../shared/types';

/** Default maximum parallel browser executions */
const DEFAULT_MAX_PARALLEL_BROWSERS = 3;

/** Supported browser targets */
const SUPPORTED_BROWSERS: BrowserTarget[] = ['chromium', 'firefox', 'webkit'];

/**
 * Callback type for executing a shard on a specific browser.
 * Provided by the caller to integrate with the actual test runner.
 */
export type ShardExecutor = (browser: BrowserTarget, shard: TestShard) => Promise<ShardResult>;

/**
 * Builds a browser matrix configuration from options.
 *
 * @param options - Browser matrix options
 * @returns A normalized BrowserMatrix configuration
 */
export function buildBrowserMatrix(options: BrowserMatrixOptions): BrowserMatrix {
  // Filter to only supported browsers
  const browsers = options.browsers.filter((b) => SUPPORTED_BROWSERS.includes(b));

  // Default to all supported browsers if none provided
  const resolvedBrowsers = browsers.length > 0 ? browsers : SUPPORTED_BROWSERS;

  return {
    browsers: resolvedBrowsers,
    environments: options.environments ?? ['default'],
    maxParallelBrowsers: options.maxParallelBrowsers ?? DEFAULT_MAX_PARALLEL_BROWSERS,
  };
}

/**
 * Executes the full browser × shard matrix.
 *
 * Each browser runs independently — a failure or launch error in one browser
 * does not block execution on remaining browsers.
 *
 * @param matrix - Browser matrix configuration
 * @param shards - Test shards to execute
 * @param executor - Callback to execute a single shard on a browser
 * @returns Full matrix execution result
 */
export async function executeMatrix(
  matrix: BrowserMatrix,
  shards: TestShard[],
  executor: ShardExecutor,
): Promise<MatrixExecutionResult> {
  const startTime = Date.now();
  const allShardResults: ShardResult[] = [];
  const browserResults = new Map<BrowserTarget, BrowserResult>();
  const browsersUnavailable: BrowserTarget[] = [];

  // Execute each browser independently
  // Req 8.2: failure in one browser does not block others
  for (const browser of matrix.browsers) {
    const browserShardResults: ShardResult[] = [];
    let browserLaunchFailed = false;

    for (const shard of shards) {
      try {
        const result = await executor(browser, shard);
        browserShardResults.push(result);
      } catch (error) {
        // Req 8.7: browser launch failure — mark all tests as skipped
        browserLaunchFailed = true;
        const skippedResult: ShardResult = {
          shardIndex: shard.shardIndex,
          browser,
          passed: 0,
          failed: 0,
          duration: 0,
          testResults: shard.testFiles.map((file) => ({
            testTitle: file,
            filePath: file,
            passed: false,
            skipped: true,
            duration: 0,
            errorMessage: `Browser ${browser} unavailable: ${error instanceof Error ? error.message : String(error)}`,
          })),
        };
        browserShardResults.push(skippedResult);
      }
    }

    if (browserLaunchFailed) {
      browsersUnavailable.push(browser);
    }

    // Aggregate browser results
    const aggregated = aggregateBrowserResults(browser, browserShardResults);
    browserResults.set(browser, aggregated);
    allShardResults.push(...browserShardResults);
  }

  const totalDuration = Date.now() - startTime;

  // Determine overall status
  const totalFailed = Array.from(browserResults.values()).reduce((sum, br) => sum + br.failed, 0);
  const totalPassed = Array.from(browserResults.values()).reduce((sum, br) => sum + br.passed, 0);

  let status: MatrixExecutionResult['status'];
  if (totalFailed === 0) {
    status = 'success';
  } else if (totalPassed > 0) {
    status = 'partial_failure';
  } else {
    status = 'failure';
  }

  return {
    status,
    browserResults,
    totalDuration,
    shardResults: allShardResults,
  };
}

/**
 * Merges shard results from all browser/shard combinations into a unified
 * execution result with cross-browser and browser-specific failure classifications.
 *
 * This is the key logic function:
 * - Cross-browser failures: test fails on SOME browsers but passes on OTHERS
 * - Browser-specific failures: test fails on EXACTLY ONE browser, passes on all others
 * - Universal failures: test fails on ALL browsers — excluded from cross/specific lists
 *
 * Req 8.5: No test appears in both crossBrowserFailures and browserSpecificFailures
 *
 * @param shardResults - Array of shard results from all browser executions
 * @returns Merged execution result with failure classifications
 */
export function mergeResults(shardResults: ShardResult[]): MergedExecutionResult {
  // Determine which browsers participated
  const browsersInMatrix = [...new Set(shardResults.map((sr) => sr.browser))];

  // Build a map: testTitle → { browser → passed/failed/skipped }
  const testOutcomes = new Map<
    string,
    Map<BrowserTarget, { passed: boolean; skipped: boolean; errorMessage?: string }>
  >();

  for (const shard of shardResults) {
    for (const result of shard.testResults) {
      if (!testOutcomes.has(result.testTitle)) {
        testOutcomes.set(result.testTitle, new Map());
      }
      const browserMap = testOutcomes.get(result.testTitle)!;

      // If we already have a result for this browser (e.g., multiple shards), merge
      const existing = browserMap.get(shard.browser);
      if (existing) {
        // If either run failed, mark as failed overall
        browserMap.set(shard.browser, {
          passed: existing.passed && result.passed,
          skipped: existing.skipped && result.skipped,
          errorMessage: existing.errorMessage ?? result.errorMessage,
        });
      } else {
        browserMap.set(shard.browser, {
          passed: result.passed,
          skipped: result.skipped,
          errorMessage: result.errorMessage,
        });
      }
    }
  }

  const crossBrowserFailures: CrossBrowserFailure[] = [];
  const browserSpecificFailures = new Map<BrowserTarget, TestFailure[]>();
  const universalFailures: TestFailure[] = [];

  // Initialize browserSpecificFailures map
  for (const browser of browsersInMatrix) {
    browserSpecificFailures.set(browser, []);
  }

  // Classify each test
  for (const [testTitle, browserMap] of testOutcomes) {
    const failedOn: BrowserTarget[] = [];
    const passedOn: BrowserTarget[] = [];
    let errorMessage = '';

    for (const browser of browsersInMatrix) {
      const outcome = browserMap.get(browser);
      if (!outcome || outcome.skipped) {
        // Skipped tests are not counted as passed or failed for classification
        continue;
      }
      if (outcome.passed) {
        passedOn.push(browser);
      } else {
        failedOn.push(browser);
        if (!errorMessage && outcome.errorMessage) {
          errorMessage = outcome.errorMessage;
        }
      }
    }

    if (failedOn.length === 0) {
      // All passed or all skipped — no failure to classify
      continue;
    }

    // Determine how many non-skipped browsers participated
    const totalParticipating = failedOn.length + passedOn.length;

    if (failedOn.length === totalParticipating && totalParticipating > 0) {
      // Req 8.6: Fails on ALL participating browsers → universal failure
      universalFailures.push({
        testTitle,
        filePath: findFilePathForTest(testTitle, shardResults),
        errorMessage: errorMessage || 'Failed on all browsers',
        duration: 0,
        rootCause: 'locator' as RootCauseCategory,
      });
    } else if (passedOn.length > 0 && failedOn.length > 0) {
      if (failedOn.length === 1) {
        // Req 8.4: Fails on exactly one browser → browser-specific failure
        const browser = failedOn[0];
        const failures = browserSpecificFailures.get(browser) ?? [];
        failures.push({
          testTitle,
          filePath: findFilePathForTest(testTitle, shardResults),
          errorMessage: errorMessage || `Failed on ${browser}`,
          duration: 0,
          rootCause: 'locator' as RootCauseCategory,
        });
        browserSpecificFailures.set(browser, failures);
      } else {
        // Req 8.3: Fails on some, passes on others → cross-browser failure
        crossBrowserFailures.push({
          testTitle,
          failedOn,
          passedOn,
          likelyBrowserBug: failedOn.length === 1,
        });
      }
    }
  }

  // Build summary
  const summary = buildExecutionSummary(shardResults, browsersInMatrix);

  return {
    summary,
    crossBrowserFailures,
    browserSpecificFailures,
    universalFailures,
  };
}

/**
 * Aggregates shard results for a single browser into a BrowserResult.
 */
function aggregateBrowserResults(
  browser: BrowserTarget,
  shardResults: ShardResult[],
): BrowserResult {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures: TestFailure[] = [];

  for (const shard of shardResults) {
    passed += shard.passed;
    failed += shard.failed;

    for (const result of shard.testResults) {
      if (result.skipped) {
        skipped++;
      }
      if (!result.passed && !result.skipped) {
        failures.push({
          testTitle: result.testTitle,
          filePath: result.filePath,
          errorMessage: result.errorMessage ?? 'Unknown error',
          duration: result.duration,
          rootCause: 'locator' as RootCauseCategory,
        });
      }
    }
  }

  return {
    browser,
    passed,
    failed,
    skipped,
    failures,
    browserSpecificIssues: [],
  };
}

/**
 * Builds an ExecutionSummary from all shard results.
 */
function buildExecutionSummary(
  shardResults: ShardResult[],
  browsersInMatrix: BrowserTarget[],
): ExecutionSummary {
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalDuration = 0;
  const testTitles = new Set<string>();

  for (const shard of shardResults) {
    totalPassed += shard.passed;
    totalFailed += shard.failed;
    totalDuration += shard.duration;

    for (const result of shard.testResults) {
      testTitles.add(result.testTitle);
      if (result.skipped) {
        totalSkipped++;
      }
    }
  }

  // Determine which browsers were unavailable (all results are skipped)
  const browsersUnavailable: BrowserTarget[] = [];
  for (const browser of browsersInMatrix) {
    const browserShards = shardResults.filter((sr) => sr.browser === browser);
    const allSkipped =
      browserShards.length > 0 &&
      browserShards.every((shard) => shard.testResults.every((r) => r.skipped));
    if (allSkipped) {
      browsersUnavailable.push(browser);
    }
  }

  const browsersExecuted = browsersInMatrix.filter((b) => !browsersUnavailable.includes(b));

  return {
    totalTests: testTitles.size,
    totalPassed,
    totalFailed,
    totalSkipped,
    browsersExecuted,
    browsersUnavailable,
    totalDuration,
  };
}

/**
 * Finds the file path for a test by its title from the shard results.
 */
function findFilePathForTest(testTitle: string, shardResults: ShardResult[]): string {
  for (const shard of shardResults) {
    for (const result of shard.testResults) {
      if (result.testTitle === testTitle) {
        return result.filePath;
      }
    }
  }
  return 'unknown';
}

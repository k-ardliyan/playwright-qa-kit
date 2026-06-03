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
export declare function getTestFailures(resultsDir?: string): GetTestFailuresOutput;
//# sourceMappingURL=get-test-failures.d.ts.map

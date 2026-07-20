import type { TestResult } from '@playwright/test/reporter';

export type StepStatus = 'passed' | 'failed';

export type AttachmentKind = 'screenshot' | 'video' | 'trace' | 'other';

export type Priority = 'high' | 'medium' | 'low';

export type AffectedLayer = 'FE' | 'BE' | 'DB' | 'API';

export type ReportMode = 'general' | 'role-aware';

export interface CollectedAttachment {
  name: string;
  contentType?: string;
  relativePath: string;
  kind: AttachmentKind;
}

export interface CollectedError {
  message: string;
  stack?: string;
}

export interface CollectedStep {
  title: string;
  status: StepStatus;
  duration: number;
  errorMessage?: string;
  steps: CollectedStep[];
}

export interface CollectedTestData {
  title: string;
  fullTitle: string;
  filePath: string;
  status: TestResult['status'];
  duration: number;
  errorMessage: string;
  errors: CollectedError[];
  steps: CollectedStep[];
  attachments: CollectedAttachment[];
  retry: number;
  // === Table view metadata ===
  testId: string;
  scenarioId: string;
  role: string;
  priority: Priority;
  inputData: Record<string, string>;
  expectedResult: string;
  actualResult: string;
  affectedLayer: AffectedLayer[];
}

/**
 * Flat record per test case — stored in test-summary.json and exposed
 * via the get_test_summary MCP tool for the Reporter Agent.
 */
export interface CollectedTestCase {
  testId: string;
  scenarioId: string;
  title: string;
  role: string;
  status: string;
  priority: Priority;
  duration: number;
  inputData: Record<string, string>;
  expectedResult: string;
  actualResult: string;
  affectedLayer: AffectedLayer[];
  attachmentCount: number;
  hasTrace: boolean;
}

/**
 * Groups CollectedTestData by role for role-aware table rendering.
 */
export interface RoleGroup {
  role: string;
  tests: CollectedTestData[];
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  timestamp: string;
  // === Role-aware extensions ===
  reportMode: ReportMode;
  rolesInScope: string[];
  testCases: CollectedTestCase[];
}

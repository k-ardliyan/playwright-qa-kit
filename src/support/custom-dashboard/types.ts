import type { TestResult } from '@playwright/test/reporter';

export type StepStatus = 'passed' | 'failed';

export type AttachmentKind = 'screenshot' | 'video' | 'trace' | 'other';

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
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  timestamp: string;
}

import {
  escapeHtml,
  renderAttachmentsSection,
  renderErrorsSection,
  renderJiraButton,
  renderLayerBadges,
  renderPriorityBadge,
  renderStatusPill,
  renderStepsTimeline,
  renderTraceLinkFromAttachments,
} from './shared';
import type { CollectedTestData } from './types';

const UNHEALTHY_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);

function isUnhealthyStatus(status: string): boolean {
  return UNHEALTHY_STATUSES.has(status);
}

function renderInputDataSection(inputData: Record<string, string>): string {
  if (!inputData || Object.keys(inputData).length === 0) {
    return '';
  }
  const entries = Object.entries(inputData);
  return `
    <section class="detail-section">
      <h3 class="subheading">Input Data</h3>
      <div class="input-kv">
        ${entries.map(([k, v]) => `<div><span class="key">${escapeHtml(k)}:</span> ${escapeHtml(v)}</div>`).join('')}
      </div>
    </section>
  `;
}

function renderResultsSection(expected: string, actual: string): string {
  if (!expected && !actual) {
    return '';
  }
  return `
    <section class="detail-section">
      <h3 class="subheading">Expected vs Actual Result</h3>
      <div class="results-comparison">
        <div class="result-box">
          <span class="result-label">Expected</span>
          <div class="result-content">${escapeHtml(expected || '-')}</div>
        </div>
        <div class="result-box">
          <span class="result-label">Actual</span>
          <div class="result-content">${escapeHtml(actual || '-')}</div>
        </div>
      </div>
    </section>
  `;
}

function buildStatusGroups(collectedTests: CollectedTestData[]): Array<{
  key: 'unhealthy' | 'passed' | 'skipped';
  title: string;
  copy: string;
  tests: CollectedTestData[];
}> {
  const unhealthy = collectedTests.filter((testData) => isUnhealthyStatus(testData.status));
  const passed = collectedTests.filter((testData) => testData.status === 'passed');
  const skipped = collectedTests.filter((testData) => testData.status === 'skipped');

  const groups: Array<{
    key: 'unhealthy' | 'passed' | 'skipped';
    title: string;
    copy: string;
    tests: CollectedTestData[];
  }> = [
    {
      key: 'unhealthy',
      title: 'Unhealthy tests',
      copy: 'Triage these failures, timeouts, and interruptions first.',
      tests: unhealthy,
    },
    {
      key: 'passed',
      title: 'Passed tests',
      copy: 'Healthy executions kept quieter for audit-only review.',
      tests: passed,
    },
    {
      key: 'skipped',
      title: 'Skipped tests',
      copy: 'Coverage gaps or intentionally deferred cases.',
      tests: skipped,
    },
  ];

  return groups.filter((group) => group.tests.length > 0);
}

function renderGroupHeader(title: string, copy: string, count: number): string {
  return `
    <div class="test-group__header">
      <div>
        <h3 class="test-group__title">${escapeHtml(title)}</h3>
        <div class="test-group__copy">${escapeHtml(copy)}</div>
      </div>
      <span class="badge badge--local">${count} item${count === 1 ? '' : 's'}</span>
    </div>
  `;
}

export function renderTestDetailCard(testData: CollectedTestData, index: number): string {
  const status = String(testData.status);
  const unhealthy = isUnhealthyStatus(status);
  const openByDefault = unhealthy ? ' open' : '';
  const traceDisplay = renderTraceLinkFromAttachments(testData.attachments);
  const jiraActions = unhealthy
    ? `<div class="test-card__actions">${renderJiraButton(testData)}</div>`
    : '';
  const attachmentCount = testData.attachments.length;
  const errorCount = testData.errors.length;

  // Build summary badges
  const testIdBadge = testData.testId
    ? `<span class="badge badge--local" style="font-size:0.7rem;">${escapeHtml(testData.testId)}</span>`
    : '';
  const roleBadge = testData.role
    ? `<span class="badge badge--local" style="font-size:0.7rem;">👤 ${escapeHtml(testData.role.toUpperCase())}</span>`
    : '';
  const priorityBadge = renderPriorityBadge(testData.priority);

  return `
    <details class="test-card" data-status="${escapeHtml(status)}"${openByDefault}>
      <summary>
        <span class="test-card__index">${index + 1}.</span>
        <span class="test-card__title">${escapeHtml(testData.fullTitle)}</span>
        ${testIdBadge}
        ${roleBadge}
        ${priorityBadge}
        ${renderStatusPill(status)}
        <span class="test-card__duration">${testData.duration}ms</span>
      </summary>
      <div class="test-card__body">
        <div class="meta-grid">
          <div class="meta-grid__item">
            <span class="meta-grid__label">Test ID</span>
            <code>${escapeHtml(testData.testId || '-')}</code>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Scenario ID</span>
            <code>${escapeHtml(testData.scenarioId || '-')}</code>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">File</span>
            <code>${escapeHtml(testData.filePath)}</code>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Retry</span>
            <span class="meta-grid__value">${testData.retry}</span>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Evidence</span>
            <span class="meta-grid__value">${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}</span>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Errors</span>
            <span class="meta-grid__value">${errorCount}</span>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Trace</span>
            <span class="meta-grid__value">${traceDisplay}</span>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Affected Layer</span>
            <span class="meta-grid__value">${renderLayerBadges(testData.affectedLayer)}</span>
          </div>
        </div>

        ${renderInputDataSection(testData.inputData)}
        ${renderResultsSection(testData.expectedResult, testData.actualResult)}

        <section class="detail-section">
          <h3 class="subheading">Errors</h3>
          ${renderErrorsSection(testData.errors)}
        </section>

        <details class="detail-section detail-section--collapsible"${unhealthy ? ' open' : ''}>
          <summary class="subheading subheading--collapsible">Execution steps</summary>
          ${renderStepsTimeline(testData.steps)}
        </details>

        <section class="detail-section">
          <h3 class="subheading">Attachments</h3>
          ${renderAttachmentsSection(testData.attachments)}
        </section>

        ${jiraActions}
      </div>
    </details>
  `;
}

export function renderTestAccordion(collectedTests: CollectedTestData[]): string {
  if (collectedTests.length === 0) {
    return '<p class="empty-state">No test records were captured.</p>';
  }

  const groups = buildStatusGroups(collectedTests);
  let runningIndex = 0;

  return `
    <div class="test-groups">
      ${groups
        .map((group) => {
          const cards = group.tests
            .map((testData) => {
              const card = renderTestDetailCard(testData, runningIndex);
              runningIndex += 1;
              return card;
            })
            .join('');

          return `
            <section class="test-group test-group--${group.key}">
              ${renderGroupHeader(group.title, group.copy, group.tests.length)}
              <div class="test-accordion">${cards}</div>
            </section>
          `;
        })
        .join('')}
    </div>
  `;
}

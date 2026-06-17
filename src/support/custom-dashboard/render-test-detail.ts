import {
  escapeHtml,
  renderAttachmentsSection,
  renderErrorsSection,
  renderJiraButton,
  renderStatusPill,
  renderStepsTimeline,
  renderTraceLinkFromAttachments,
} from './shared';
import type { CollectedTestData } from './types';

export function renderTestDetailCard(testData: CollectedTestData, index: number): string {
  const status = String(testData.status);
  const isUnhealthy = ['failed', 'timedOut', 'interrupted'].includes(status);
  const openByDefault = isUnhealthy ? ' open' : '';
  const traceDisplay = renderTraceLinkFromAttachments(testData.attachments);
  const jiraActions = isUnhealthy
    ? `<div class="test-card__actions">${renderJiraButton(testData)}</div>`
    : '';

  return `
    <details class="test-card" data-status="${escapeHtml(status)}"${openByDefault}>
      <summary>
        <span class="test-card__index">${index + 1}.</span>
        <span class="test-card__title">${escapeHtml(testData.fullTitle)}</span>
        ${renderStatusPill(status)}
        <span class="test-card__duration">${testData.duration}ms</span>
      </summary>
      <div class="test-card__body">
        <div class="meta-grid">
          <div class="meta-grid__item">
            <span class="meta-grid__label">File</span>
            <code>${escapeHtml(testData.filePath)}</code>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Retry</span>
            <span>${testData.retry}</span>
          </div>
          <div class="meta-grid__item">
            <span class="meta-grid__label">Trace</span>
            <span>${traceDisplay}</span>
          </div>
        </div>

        <section class="detail-section">
          <h3 class="subheading">Errors</h3>
          ${renderErrorsSection(testData.errors)}
        </section>

        <details class="detail-section detail-section--collapsible"${isUnhealthy ? ' open' : ''}>
          <summary class="subheading subheading--collapsible">Test Steps</summary>
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

  return collectedTests.map((testData, index) => renderTestDetailCard(testData, index)).join('');
}

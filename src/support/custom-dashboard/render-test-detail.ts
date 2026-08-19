import {
  escapeHtml,
  renderAttachmentsSection,
  renderErrorsSection,
  renderLayerBadges,
  renderPriorityBadge,
  renderStatusPill,
  renderStepsTimeline,
  renderTraceLinkFromAttachments,
} from './shared';
import type { CollectedTestData } from './types';
import { buildFilterDataAttrs } from './filter-attrs';
import { decisionHintFor, decisionHintTooltipFor, explainFailure } from './failure-source';

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
  const actualLower = (actual || '').toLowerCase();
  const looksFailed =
    actualLower.includes('error') ||
    actualLower.includes('timeout') ||
    actualLower.includes('failed') ||
    actualLower.includes('not found');
  const actualBoxClass = looksFailed
    ? 'result-box result-box--failed'
    : 'result-box result-box--passed';
  return `
    <section class="detail-section">
      <h3 class="subheading">Expected vs Actual Result</h3>
      <div class="results-comparison">
        <div class="result-box">
          <span class="result-label">Expected</span>
          <div class="result-content">${escapeHtml(expected || '-')}</div>
        </div>
        <div class="${actualBoxClass}">
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

function buildFailurePacket(testData: CollectedTestData): string {
  // Keep first 3 lines of error/stack for ticket handoff without leaking huge stacks.
  const errorLines = (testData.errorMessage || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
  const errorBlock = errorLines.length > 0 ? errorLines.join('\n  ') : '-';

  const source = testData.failureSource || 'unknown';
  const sourceExplain = explainFailure(testData.errorMessage);
  const sourceLine = sourceExplain
    ? `- Source: ${source} (${decisionHintFor(testData.failureSource)}) — ${sourceExplain}`
    : `- Source: ${source} (${decisionHintFor(testData.failureSource)})`;

  return [
    `### ${testData.testId || '-'} — ${testData.title}`,
    ``,
    `- Status: ${testData.status}`,
    `- Scenario: ${testData.scenarioId || '-'}`,
    sourceLine,
    `- Retry: ${testData.retry ?? 0}`,
    `- Duration: ${testData.duration}ms`,
    ``,
    `**Expected:** ${testData.expectedResult || '-'}`,
    ``,
    `**Actual:** ${testData.actualResult || '-'}`,
    ``,
    `**Error:**`,
    '```',
    `  ${errorBlock}`,
    '```',
    ``,
    `- File: ${testData.filePath}`,
    `- Trace: ${
      testData.attachments.find((a) => a.kind === 'trace')?.relativePath ||
      (testData.hasTrace ? '(available — open dashboard drawer)' : 'none')
    }`,
  ].join('\n');
}

function statusGlyph(status: string): string {
  if (isUnhealthyStatus(status)) {
    return '<span class="test-file-test-status-icon test-file-test-status-icon--failed" aria-hidden="true">✕</span>';
  }
  if (status === 'skipped') {
    return '<span class="test-file-test-status-icon test-file-test-status-icon--skipped" aria-hidden="true">⊘</span>';
  }
  return '<span class="test-file-test-status-icon test-file-test-status-icon--passed" aria-hidden="true">✓</span>';
}

export function renderTestDetailCard(testData: CollectedTestData, index: number): string {
  const status = String(testData.status);
  const unhealthy = isUnhealthyStatus(status);
  // All cards start collapsed (including failed) — QA expands intentionally.
  const traceDisplay = renderTraceLinkFromAttachments(testData.attachments);
  const packet = buildFailurePacket(testData);
  const failureActions = unhealthy
    ? `<div class="test-card__actions">
        <button type="button" class="btn btn--ghost" data-copy-packet="${escapeHtml(packet)}">Copy failure packet</button>
      </div>`
    : '';
  const attachmentCount = testData.attachments.length;
  const errorCount = testData.errors.length;
  const stepCount = testData.steps.length;
  const rowKey = `${testData.testId || 'row'}-${index}`;

  const testIdBadge = testData.testId
    ? `<span class="badge badge--meta">${escapeHtml(testData.testId)}</span>`
    : '';
  const roleBadge = testData.role
    ? `<span class="badge badge--meta">${escapeHtml(testData.role.toUpperCase())}</span>`
    : '';
  const priorityBadge = renderPriorityBadge(testData.priority);
  const sourceBadge = testData.failureSource
    ? `<span class="failure-source failure-source--${escapeHtml(testData.failureSource)}" title="${escapeHtml(decisionHintTooltipFor(testData.failureSource, testData.errorMessage))}">${escapeHtml(testData.failureSource.toUpperCase())}</span>`
    : '';

  const pathLabel = testData.filePath ? escapeHtml(testData.filePath) : '';

  return `
      <details class="test-card test-file-test test-file-test-outcome-${escapeHtml(status)}" ${buildFilterDataAttrs(testData, rowKey)} data-duration="${testData.duration}">
        <summary class="test-card__summary">
          <div class="test-card__summary-row">
            <span class="test-card__index">${index + 1}.</span>
            ${statusGlyph(status)}
            <span class="test-card__title test-file-title">${escapeHtml(testData.fullTitle)}</span>
            <span class="test-card__badges">
              ${testIdBadge}
              ${roleBadge}
              ${priorityBadge}
              ${sourceBadge}
              ${renderStatusPill(status)}
            </span>
            <span class="test-card__duration" data-testid="test-duration">${testData.duration}ms</span>
          </div>
        <div class="test-card__meta-row test-file-details-row">
          ${pathLabel ? `<span class="test-file-path">${pathLabel}</span>` : ''}
          ${traceDisplay}
        </div>
      </summary>
      <div class="test-card__body test-result">
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
          ${
            testData.failureSource
              ? `<div class="meta-grid__item">
            <span class="meta-grid__label">Failure source</span>
            <span class="meta-grid__value">${sourceBadge} <span class="decision-hint" title="${escapeHtml(decisionHintTooltipFor(testData.failureSource, testData.errorMessage))}">→ ${escapeHtml(decisionHintFor(testData.failureSource))}</span></span>
          </div>`
              : ''
          }
        </div>

        ${renderInputDataSection(testData.inputData)}
        ${renderResultsSection(testData.expectedResult, testData.actualResult)}

        ${
          errorCount > 0
            ? `<details class="chip detail-chip" open>
          <summary class="chip-header">Errors <span class="chip-count">${errorCount}</span></summary>
          <div class="chip-body">
            ${renderErrorsSection(testData.errors)}
          </div>
        </details>`
            : ''
        }

        <details class="chip detail-chip"${unhealthy || stepCount > 0 ? ' open' : ''}>
          <summary class="chip-header">Test Steps <span class="chip-count">${stepCount}</span></summary>
          <div class="chip-body chip-body--steps">
            ${renderStepsTimeline(testData.steps)}
          </div>
        </details>

        <details class="chip detail-chip"${attachmentCount > 0 ? ' open' : ''}>
          <summary class="chip-header">Attachments <span class="chip-count">${attachmentCount}</span></summary>
          <div class="chip-body">
            ${renderAttachmentsSection(testData.attachments)}
          </div>
        </details>

        ${failureActions}
      </div>
    </details>
  `;
}

export function renderAccordionToolbar(): string {
  return `
    <div class="accordion-toolbar" id="accordion-toolbar" data-toolbar-for="accordion" role="toolbar" aria-label="Accordion controls">
      <span class="accordion-toolbar__label">Accordion</span>
      <select class="sort-select cmd-select" id="accordion-sort-select" aria-label="Sort accordion cards">
        <option value="default">Default order</option>
        <option value="status-fail-first">Status (fail first)</option>
        <option value="priority-high-first">Priority (high first)</option>
        <option value="duration-desc">Duration (longest first)</option>
      </select>
    </div>
  `;
}

export function renderTestAccordion(collectedTests: CollectedTestData[]): string {
  if (collectedTests.length === 0) {
    return '<p class="empty-state">No test records were captured.</p>';
  }

  const groups = buildStatusGroups(collectedTests);
  let runningIndex = 0;

  const groupsHtml = groups
    .map((group) => {
      const cards = group.tests
        .map((testData) => {
          const card = renderTestDetailCard(testData, runningIndex);
          runningIndex += 1;
          return card;
        })
        .join('');

      return `
        <section class="test-group test-group--${group.key}" data-group-key="${group.key}">
          ${renderGroupHeader(group.title, group.copy, group.tests.length)}
          <div class="test-accordion" data-accordion-list>${cards}</div>
        </section>
      `;
    })
    .join('');

  // Content only — toolbar is composed OUTSIDE #view-accordion by build-dashboard-html.
  return `
    <div class="accordion-view" id="view-accordion-content">
      <div class="test-groups" data-accordion-groups>
        ${groupsHtml}
      </div>
    </div>
    <script>
    (function () {
      function initAccordionSort() {
        var sortEl = document.getElementById('accordion-sort-select');
        var root = document.getElementById('view-accordion');
        if (!sortEl || !root) return;

        var groupsRoot = root.querySelector('[data-accordion-groups]');
        if (!groupsRoot) return;

        var originalGroups = Array.prototype.slice.call(groupsRoot.children);
        var originalCardsByGroup = originalGroups.map(function (section) {
          var list = section.querySelector('[data-accordion-list]');
          return list ? Array.prototype.slice.call(list.children) : [];
        });

        function statusRank(s) {
          s = String(s || '').toLowerCase();
          if (s === 'failed' || s === 'timedout' || s === 'interrupted') return 0;
          if (s === 'skipped') return 1;
          if (s === 'passed') return 2;
          return 99;
        }
        function priorityRank(p) {
          p = String(p || '').toLowerCase();
          if (p === 'high') return 0;
          if (p === 'medium') return 1;
          if (p === 'low') return 2;
          return 99;
        }
        function durationMs(card) {
          var d = card.getAttribute('data-duration');
          if (d != null && d !== '') {
            var n = parseFloat(d);
            if (!isNaN(n)) return n;
          }
          var t = card.querySelector('.test-card__duration');
          if (!t) return 0;
          var text = String(t.textContent || '');
          var m = text.match(/([0-9]+(?:\\.[0-9]+)?)/);
          return m ? parseFloat(m[1]) : 0;
        }
        function renumber() {
          var cards = root.querySelectorAll('.test-card');
          for (var i = 0; i < cards.length; i++) {
            var idx = cards[i].querySelector('.test-card__index');
            if (idx) idx.textContent = (i + 1) + '.';
          }
        }

        function applySort(key) {
          if (key === 'default') {
            originalGroups.forEach(function (section, gi) {
              groupsRoot.appendChild(section);
              section.hidden = false;
              var list = section.querySelector('[data-accordion-list]');
              if (!list) return;
              (originalCardsByGroup[gi] || []).forEach(function (c) { list.appendChild(c); });
            });
            renumber();
            return;
          }

          var allCards = [];
          originalGroups.forEach(function (section) {
            var list = section.querySelector('[data-accordion-list]');
            if (!list) return;
            Array.prototype.slice.call(list.children).forEach(function (c) {
              if (c.classList && c.classList.contains('test-card')) allCards.push(c);
            });
          });

          allCards.sort(function (a, b) {
            if (key === 'status-fail-first') {
              var sr = statusRank(a.getAttribute('data-status')) - statusRank(b.getAttribute('data-status'));
              if (sr !== 0) return sr;
              return priorityRank(a.getAttribute('data-priority')) - priorityRank(b.getAttribute('data-priority'));
            }
            if (key === 'priority-high-first') {
              var pr = priorityRank(a.getAttribute('data-priority')) - priorityRank(b.getAttribute('data-priority'));
              if (pr !== 0) return pr;
              return statusRank(a.getAttribute('data-status')) - statusRank(b.getAttribute('data-status'));
            }
            if (key === 'duration-desc') {
              return durationMs(b) - durationMs(a);
            }
            return 0;
          });

          var firstList = null;
          originalGroups.forEach(function (section) {
            var list = section.querySelector('[data-accordion-list]');
            if (!list) return;
            if (!firstList) {
              firstList = list;
              section.hidden = false;
            } else {
              section.hidden = true;
            }
          });
          if (firstList) {
            allCards.forEach(function (c) { firstList.appendChild(c); });
          }
          renumber();
        }

        sortEl.addEventListener('change', function () {
          applySort(sortEl.value);
        });
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordionSort);
      } else {
        initAccordionSort();
      }
    })();
    </script>
  `;
}

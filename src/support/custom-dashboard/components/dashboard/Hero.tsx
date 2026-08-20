/** @jsxImportSource @kitajs/html */
import type { CollectedTestData, TestSummary } from '../../types';
import { Icon } from '../shared/Icon';

export interface HeroProps {
  mode: 'local' | 'ci';
  summary: TestSummary;
  collectedTests: CollectedTestData[];
}

const UNHEALTHY_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);

function getVerdict(summary?: TestSummary): {
  label: string;
  tone: 'healthy' | 'warning' | 'critical';
  summaryLine: string;
} {
  const failed = summary?.failed ?? 0;
  const skipped = summary?.skipped ?? 0;
  const total = summary?.total ?? 0;

  if (failed > 0) {
    return {
      label: 'Run failed',
      tone: 'critical',
      summaryLine: `${failed} unhealthy test${failed === 1 ? '' : 's'} need${failed === 1 ? 's' : ''} triage.`,
    };
  }

  if (skipped > 0) {
    return {
      label: 'Run degraded',
      tone: 'warning',
      summaryLine: `${skipped} skipped test${skipped === 1 ? '' : 's'} reduced coverage.`,
    };
  }

  return {
    label: 'Run healthy',
    tone: 'healthy',
    summaryLine: total > 0 ? 'All executed tests passed.' : 'No tests were captured in this run.',
  };
}

export function formatDisplayTime(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const day = d.getDate();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${mon} ${yr}, ${hh}:${mm}`;
  } catch {
    return raw;
  }
}

function formatDurationMs(ms: number): string {
  if (!ms || ms < 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function truncateMiddle(value: string, max = 18): string {
  if (!value || value.length <= max) return value;
  const keep = Math.floor((max - 1) / 2);
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

export function Hero({ mode, summary, collectedTests }: HeroProps) {
  const verdict = getVerdict(summary);
  const tests = Array.isArray(collectedTests) ? collectedTests : [];
  const unhealthyCount = tests.filter((testData) => UNHEALTHY_STATUSES.has(testData.status)).length;

  const displayTime = formatDisplayTime(summary?.timestamp || '');
  const appEnv = summary?.runMeta?.appEnv ?? 'unknown';
  const runId = summary?.runMeta?.runId;
  const totalDuration = formatDurationMs(summary?.runMeta?.totalDurationMs ?? 0);
  const showFailMark = verdict.tone === 'critical';

  return (
    <header class={`hero hero--${verdict.tone}`}>
      <div class="hero__top-row">
        <div class="hero__identity">
          <div class="hero__mark" aria-hidden="true">
            <Icon name="doc" />
            {showFailMark && <span class="hero__mark-x">×</span>}
          </div>
          <div class="hero__copy">
            <div class="hero__eyebrow">
              {mode === 'ci' ? 'CI EXECUTION REPORT' : 'LOCAL EXECUTION REPORT'}
            </div>
            <h1 class="hero__title">
              {verdict.label === 'Run failed'
                ? 'Run Failed'
                : verdict.label === 'Run healthy'
                  ? 'Run Healthy'
                  : 'Run Degraded'}
            </h1>
            <p class="hero__subtitle" safe>
              {verdict.summaryLine}
            </p>
          </div>
        </div>
        <div class="hero__top-actions">
          <span class={`badge ${mode === 'ci' ? 'badge--ci' : 'badge--local'}`}>
            <Icon name="pin" /> {mode === 'ci' ? 'CI MODE' : 'LOCAL MODE'}
          </span>
        </div>
      </div>

      <div class="hero__meta-inline">
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">
            <Icon name="layers" />
          </span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">APP_ENV</span>
            <strong safe>{appEnv}</strong>
          </span>
        </div>
        {runId ? (
          <div class="hero__meta-item">
            <span class="hero__meta-icon" aria-hidden="true">
              <Icon name="list" />
            </span>
            <span class="hero__meta-text">
              <span class="hero__meta-label">Run ID</span>
              <strong title={runId} safe>
                {truncateMiddle(runId, 16)}
              </strong>
            </span>
          </div>
        ) : null}
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">
            <Icon name="calendar" />
          </span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">Generated</span>
            <strong safe>{displayTime}</strong>
          </span>
        </div>
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">
            <Icon name="clock" />
          </span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">Duration</span>
            <strong safe>{totalDuration}</strong>
          </span>
        </div>
        <div class="hero__meta-item">
          <span class="hero__meta-icon" aria-hidden="true">
            <Icon name="heart" />
          </span>
          <span class="hero__meta-text">
            <span class="hero__meta-label">Unhealthy</span>
            <strong>{unhealthyCount}</strong>
          </span>
        </div>
      </div>

      <div class="hero-stat-bar">
        <div class="hero-stat">
          <span class="hero-stat__icon" aria-hidden="true">
            <Icon name="list" />
          </span>
          <span class="hero-stat__copy">
            <span class="hero-stat__num">{summary?.total ?? 0}</span>
            <span class="hero-stat__lbl">Total</span>
          </span>
        </div>
        <div class="hero-stat hero-stat--passed">
          <span class="hero-stat__icon" aria-hidden="true">
            <Icon name="check" />
          </span>
          <span class="hero-stat__copy">
            <span class="hero-stat__num">{summary?.passed ?? 0}</span>
            <span class="hero-stat__lbl">Passed</span>
          </span>
        </div>
        <div class="hero-stat hero-stat--failed">
          <span class="hero-stat__icon" aria-hidden="true">
            <Icon name="x" />
          </span>
          <span class="hero-stat__copy">
            <span class="hero-stat__num">{summary?.failed ?? 0}</span>
            <span class="hero-stat__lbl">Failed</span>
          </span>
        </div>
        <div class="hero-stat hero-stat--skipped">
          <span class="hero-stat__icon" aria-hidden="true">
            <Icon name="skip" />
          </span>
          <span class="hero-stat__copy">
            <span class="hero-stat__num">{summary?.skipped ?? 0}</span>
            <span class="hero-stat__lbl">Skipped</span>
          </span>
        </div>
        <div class="hero-stat hero-stat--accent">
          <span class="hero-stat__icon" aria-hidden="true">
            <Icon name="chart" />
          </span>
          <span class="hero-stat__copy">
            <span class="hero-stat__num">{summary?.passRate ?? 0}%</span>
            <span class="hero-stat__lbl">Pass rate</span>
          </span>
        </div>
      </div>
    </header>
  );
}

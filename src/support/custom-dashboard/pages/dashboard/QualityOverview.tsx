/** @jsxImportSource @kitajs/html */
import type { Children } from '@kitajs/html';
import type { QualityMetrics } from '../../domain/dashboard';
import { IconTrend, IconHistory, IconCheck, IconDashboard } from '../../components/shared/icons';

export interface QualityOverviewProps {
  metrics: QualityMetrics;
}

export function QualityOverview({ metrics }: QualityOverviewProps) {
  const cards: Array<{
    title: string;
    value: string;
    subtitle: string;
    icon: Children;
    cls: string;
  }> = [
    {
      title: 'Overall Pass Rate',
      value: `${metrics.overallPassRate}%`,
      subtitle: 'Across all recorded runs',
      icon: <IconTrend size={18} />,
      cls: 'kpi-pass-rate',
    },
    {
      title: 'Archived Runs',
      value: String(metrics.totalArchivedRuns),
      subtitle: 'QA-validated benchmarks',
      icon: <IconHistory size={18} />,
      cls: 'kpi-archives',
    },
    {
      title: 'Approved Runs',
      value: String(metrics.approvedRunsCount),
      subtitle: 'Passed exit criteria',
      icon: <IconCheck size={18} />,
      cls: 'kpi-approved',
    },
    {
      title: 'Active Test Series',
      value: String(metrics.activeTestSeriesCount),
      subtitle: 'Distinct test suites',
      icon: <IconDashboard size={18} />,
      cls: 'kpi-series',
    },
  ];

  return (
    <div class="quality-overview-grid">
      {cards.map((card) => (
        <div class={`kpi-card ${card.cls}`}>
          <div class="kpi-card__header">
            <span class="kpi-card__title" safe>
              {card.title}
            </span>
            <span class="kpi-card__icon">{card.icon}</span>
          </div>
          <div class="kpi-card__value font-mono" safe>
            {card.value}
          </div>
          <div class="kpi-card__subtitle muted" safe>
            {card.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}

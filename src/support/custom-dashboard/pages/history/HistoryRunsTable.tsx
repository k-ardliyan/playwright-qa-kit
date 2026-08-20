/** @jsxImportSource @kitajs/html */
import type { ReportHistoryEntry } from '../../../../agents/reporter/report-history';
import {
  DataTable,
  DataTableContainer,
  DataTableHead,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableActions,
} from '../../components/data-table';
import {
  IconCheck,
  IconCross,
  IconAlert,
  IconTrash,
  IconEdit,
} from '../../components/shared/icons';

export interface HistoryRunsTableProps {
  history: ReportHistoryEntry[];
  latestRunId?: string;
  serveMode?: boolean;
}

function formatTimestampShort(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())} ${d.toLocaleString('en-US', { month: 'short' })} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export function HistoryRunsTable({
  history = [],
  latestRunId,
  serveMode = true,
}: HistoryRunsTableProps) {
  if (!history || history.length === 0) {
    return (
      <DataTableEmpty
        icon="📜"
        message="No archived test runs found."
        submessage="Run tests and save results to build your persistent test history."
      />
    );
  }

  return (
    <DataTableContainer>
      <DataTable variant="history" id="history-table">
        <DataTableHead>
          <tr>
            <DataTableCell isHeader class="col-status">
              Status
            </DataTableCell>
            <DataTableCell isHeader class="col-testing">
              Test Run / Target
            </DataTableCell>
            <DataTableCell isHeader class="col-env">
              Env
            </DataTableCell>
            <DataTableCell isHeader class="col-rate">
              Pass Rate
            </DataTableCell>
            <DataTableCell isHeader class="col-tests">
              Tests
            </DataTableCell>
            <DataTableCell isHeader class="col-decision">
              QA Decision
            </DataTableCell>
            <DataTableCell isHeader class="col-date">
              Saved Date
            </DataTableCell>
            <DataTableCell isHeader class="col-notes">
              Notes
            </DataTableCell>
            <DataTableCell isHeader class="col-actions">
              Actions
            </DataTableCell>
          </tr>
        </DataTableHead>
        <tbody>
          {history.map((entry) => {
            const passRateClass =
              entry.passRate >= 80 ? 'rate-good' : entry.passRate >= 50 ? 'rate-warn' : 'rate-bad';
            const decisionClass = entry.qaDecision
              ? `decision-badge decision-${entry.qaDecision.toLowerCase().replace(/_/g, '-')}`
              : 'muted';
            const savedAtFormatted = entry.savedAt ? formatTimestampShort(entry.savedAt) : '—';
            const notesText = entry.qaNotes || '—';

            const displayLabel = entry.displayName || entry.runId;
            const subtitleParts = [
              entry.requirementId || entry.testSeriesId || '',
              entry.appEnv || '',
            ].filter(Boolean);

            const isLatest = Boolean(latestRunId && entry.runId === latestRunId);

            const viewAction = serveMode
              ? `window.location.href='/history/${encodeURIComponent(entry.runId)}'`
              : `showArchiveDetail('${entry.runId}')`;

            const compareAction = serveMode
              ? `window.location.href='/compare?baseline=${encodeURIComponent(entry.runId)}'`
              : `alert('Compare requires the dashboard server. Run: npm run dashboard:serve')`;

            return (
              <DataTableRow
                class="history-row"
                data-run-id={entry.runId}
                data-display-name={entry.displayName || ''}
                data-series={entry.testSeriesId || ''}
                data-req={entry.requirementId || ''}
                data-decision={entry.qaDecision || ''}
                data-notes={entry.qaNotes || ''}
                onclick={viewAction}
              >
                <DataTableCell class="history-status">
                  {entry.status === 'success' ? (
                    <span class="status-indicator status-indicator--passed" title="All Passed">
                      <IconCheck size={12} />
                    </span>
                  ) : entry.status === 'partial' ? (
                    <span class="status-indicator status-indicator--warning" title="Partial Pass">
                      <IconAlert size={12} />
                    </span>
                  ) : (
                    <span class="status-indicator status-indicator--failed" title="Failed">
                      <IconCross size={12} />
                    </span>
                  )}
                </DataTableCell>
                <DataTableCell class="history-testing-cell">
                  <div class="run-title-group">
                    <span class="run-display-name" title={displayLabel} safe>
                      {displayLabel}
                    </span>
                    {isLatest && <span class="latest-badge">LATEST</span>}
                  </div>
                  {subtitleParts.length > 0 && (
                    <div class="run-subtitle muted" safe>
                      {subtitleParts.join(' · ')}
                    </div>
                  )}
                  <div class="run-machine-id muted font-mono" safe>
                    {entry.runId}
                  </div>
                </DataTableCell>
                <DataTableCell class="history-env">
                  <span class="env-tag" safe>
                    {entry.appEnv}
                  </span>
                </DataTableCell>
                <DataTableCell class={`history-rate ${passRateClass}`}>
                  <strong class="font-mono">{entry.passRate}%</strong>
                </DataTableCell>
                <DataTableCell class="history-tests">
                  <span class="font-mono">{entry.totalTests}</span>{' '}
                  <span class="tests-breakdown font-mono muted">
                    ({entry.passed}P · {entry.failed}F)
                  </span>
                </DataTableCell>
                <DataTableCell class="history-decision">
                  {entry.qaDecision ? (
                    <span class={decisionClass}>{entry.qaDecision}</span>
                  ) : (
                    <span class="muted">—</span>
                  )}
                </DataTableCell>
                <DataTableCell class="history-date font-mono" title={entry.savedAt || entry.ranAt}>
                  <span safe>{savedAtFormatted}</span>
                </DataTableCell>
                <DataTableCell class="history-notes" title={entry.qaNotes || ''}>
                  <span safe>{notesText}</span>
                </DataTableCell>
                <DataTableActions>
                  <button
                    class="btn-sm btn-view"
                    type="button"
                    onclick={`event.stopPropagation();${viewAction}`}
                    title="View report details"
                  >
                    View
                  </button>
                  <button
                    class="btn-sm btn-compare"
                    type="button"
                    onclick={`event.stopPropagation();${compareAction}`}
                    title="Compare with another run"
                  >
                    Compare
                  </button>
                  <button
                    class="btn-sm btn-edit"
                    type="button"
                    onclick={`event.stopPropagation();openEditModal('${entry.runId}')`}
                    title="Edit run details"
                  >
                    <IconEdit size={13} />
                  </button>
                  <button
                    class="btn-sm btn-delete"
                    type="button"
                    onclick={`event.stopPropagation();deleteArchive('${entry.runId}')`}
                    title="Delete archived run"
                  >
                    <IconTrash size={13} />
                  </button>
                </DataTableActions>
              </DataTableRow>
            );
          })}
        </tbody>
      </DataTable>
    </DataTableContainer>
  );
}

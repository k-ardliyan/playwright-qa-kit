/** Light-theme CSS for generated custom-dashboard.html */
export function getDashboardStyles(): string {
  return `
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
      --passed: #059669;
      --passed-bg: #ecfdf5;
      --failed: #dc2626;
      --failed-bg: #fef2f2;
      --skipped: #d97706;
      --skipped-bg: #fffbeb;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
      --radius: 12px;
      --radius-sm: 8px;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 48px;
    }

    @media (max-width: 640px) {
      .page { padding: 20px 14px 32px; }
    }

    .hero {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
    }

    .hero__title {
      margin: 0 0 6px;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    @media (max-width: 640px) {
      .hero__title { font-size: 1.375rem; }
    }

    .hero__subtitle {
      margin: 0;
      color: var(--muted);
      font-size: 0.875rem;
      word-break: break-word;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge--local { background: #dbeafe; color: #1d4ed8; }
    .badge--ci { background: #ede9fe; color: #6d28d9; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    @media (max-width: 640px) {
      .stat-grid { gap: 10px; }
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 18px;
      box-shadow: var(--shadow);
    }

    .stat-card__label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .stat-card__value {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .stat-card--passed .stat-card__value { color: var(--passed); }
    .stat-card--failed .stat-card__value { color: var(--failed); }
    .stat-card--skipped .stat-card__value { color: var(--skipped); }

    .layout {
      display: grid;
      grid-template-columns: minmax(240px, 320px) 1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; }
    }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
    }

    .panel__title {
      margin: 0 0 16px;
      font-size: 1rem;
      font-weight: 600;
    }

    .section-title {
      margin: 32px 0 16px;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .empty-state {
      color: var(--muted);
      margin: 0;
      padding: 12px 0;
    }

    .muted { color: var(--muted); }

    .table-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    table.data-table {
      width: 100%;
      min-width: 520px;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 0.875rem;
    }

    .data-table thead th {
      text-align: left;
      padding: 10px 12px;
      background: #f1f5f9;
      color: var(--muted);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border);
    }

    .data-table tbody td {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }

    .data-table code {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 0.8125rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      word-break: break-word;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 500;
      text-decoration: none;
      border: 1px solid transparent;
      transition: background 0.15s, border-color 0.15s;
    }

    .btn--primary {
      background: var(--accent);
      color: #fff;
    }

    .btn--primary:hover { background: var(--accent-hover); }

    .btn--ghost {
      background: #f1f5f9;
      color: var(--text);
      border-color: var(--border);
    }

    .btn--ghost:hover { background: #e2e8f0; }

    .status-pill {
      display: inline-flex;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: lowercase;
    }

    .status-pill--passed { background: var(--passed-bg); color: var(--passed); }
    .status-pill--failed,
    .status-pill--timedOut,
    .status-pill--interrupted { background: var(--failed-bg); color: var(--failed); }
    .status-pill--skipped { background: var(--skipped-bg); color: var(--skipped); }

    .test-accordion {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    details.test-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    details.test-card summary {
      cursor: pointer;
      padding: 16px 18px;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    details.test-card summary::-webkit-details-marker { display: none; }

    details.test-card[open] summary {
      border-bottom: 1px solid var(--border);
      background: #f8fafc;
    }

    .test-card__index {
      font-weight: 600;
      color: var(--muted);
      flex-shrink: 0;
    }

    .test-card__title {
      flex: 1 1 200px;
      min-width: 0;
      font-weight: 600;
      font-size: 0.9375rem;
      word-break: break-word;
    }

    .test-card__duration {
      color: var(--muted);
      font-size: 0.8125rem;
      flex-shrink: 0;
    }

    @media (max-width: 640px) {
      details.test-card summary {
        flex-direction: column;
        align-items: flex-start;
      }

      .test-card__title { flex-basis: auto; width: 100%; }
    }

    .test-card__body { padding: 18px; }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 8px;
    }

    .meta-grid__label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .detail-section {
      margin-top: 20px;
      padding-top: 4px;
    }

    .subheading {
      margin: 0 0 10px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .error-block {
      white-space: pre-wrap;
      margin: 0 0 12px;
      padding: 12px 14px;
      background: var(--failed-bg);
      border-left: 4px solid var(--failed);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      font-family: ui-monospace, Consolas, monospace;
      font-size: 0.8125rem;
      color: #991b1b;
      overflow-x: auto;
    }

    .step-error {
      margin: 6px 0 8px;
      padding: 8px 10px;
      background: var(--failed-bg);
      border-radius: var(--radius-sm);
      font-family: ui-monospace, Consolas, monospace;
      font-size: 0.75rem;
      color: #991b1b;
      overflow-x: auto;
    }

    .steps-timeline {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    details.step-details {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: #fafbfc;
      overflow: hidden;
    }

    details.step-details summary {
      cursor: pointer;
      list-style: none;
      padding: 10px 12px;
    }

    details.step-details summary::-webkit-details-marker { display: none; }

    details.step-details summary.steps-timeline__header::before {
      content: '▸';
      flex-shrink: 0;
      width: 14px;
      color: var(--muted);
      transition: transform 0.15s ease;
    }

    details.step-details[open] > summary.steps-timeline__header::before {
      transform: rotate(90deg);
    }

    details.step-details[open] > summary {
      border-bottom: 1px solid var(--border);
      background: #f8fafc;
    }

    .step-details__body {
      padding: 8px 10px 10px;
    }

    .steps-timeline__item {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      background: #fafbfc;
    }

    .steps-timeline__item--leaf {
      padding: 10px 12px;
    }

    .steps-timeline__header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .steps-timeline__icon { flex-shrink: 0; }

    .steps-timeline__title {
      flex: 1;
      min-width: 0;
      word-break: break-word;
    }

    .steps-timeline__duration {
      color: var(--muted);
      font-size: 0.8125rem;
      flex-shrink: 0;
    }

    .steps-timeline__nested {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-left: 8px;
      border-left: 2px solid var(--border);
    }

    .step-details--nested-1 { margin-left: 0; }
    .step-details--nested-2 { margin-left: 0; }
    .step-details--nested-3 { margin-left: 0; }

    .detail-section--collapsible {
      margin-top: 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: #fafbfc;
      overflow: hidden;
    }

    .detail-section--collapsible > summary.subheading--collapsible {
      cursor: pointer;
      list-style: none;
      margin: 0;
      padding: 12px 14px;
      background: #f8fafc;
      border-bottom: 1px solid transparent;
    }

    .detail-section--collapsible > summary.subheading--collapsible::-webkit-details-marker {
      display: none;
    }

    .detail-section--collapsible > summary.subheading--collapsible::before {
      content: '▸';
      display: inline-block;
      margin-right: 8px;
      color: var(--muted);
      transition: transform 0.15s ease;
    }

    .detail-section--collapsible[open] > summary.subheading--collapsible::before {
      transform: rotate(90deg);
    }

    .detail-section--collapsible[open] > summary.subheading--collapsible {
      border-bottom-color: var(--border);
    }

    .detail-section--collapsible > .steps-timeline,
    .detail-section--collapsible > .empty-state {
      padding: 12px 14px 14px;
    }

    .attachment-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 640px) {
      .attachment-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (min-width: 960px) {
      .attachment-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .attachment-card {
      margin: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: #fafbfc;
    }

    .attachment-card img,
    .attachment-card video {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      background: #0f172a;
    }

    .attachment-card figcaption {
      padding: 8px 10px;
      font-size: 0.75rem;
      color: var(--muted);
      word-break: break-word;
    }

    .attachment-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .attachment-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 500;
      text-decoration: none;
      background: #f1f5f9;
      color: var(--text);
      border: 1px solid var(--border);
      word-break: break-word;
    }

    .attachment-chip:hover { background: #e2e8f0; }

    .attachment-chip--trace {
      background: #ede9fe;
      border-color: #ddd6fe;
      color: #5b21b6;
    }

    .test-card__actions {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .alert {
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-top: 24px;
    }

    .alert--warning {
      background: var(--failed-bg);
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .chart-wrap {
      display: flex;
      justify-content: center;
      max-width: 100%;
      position: relative;
      height: 280px;
    }

    .chart-wrap canvas {
      max-width: 100%;
    }
  `;
}

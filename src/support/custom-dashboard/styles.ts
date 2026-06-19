/** Themable CSS for generated custom-dashboard.html (light + dark via data-theme). */
export function getDashboardStyles(): string {
  return `
    :root {
      color-scheme: light;
      --bg: #f4f7fb;
      --bg-accent: #eef2f9;
      --surface: #ffffff;
      --surface-strong: #ffffff;
      --surface-muted: #f1f5f9;
      --surface-soft: rgba(241, 245, 249, 0.85);
      --text: #0f172a;
      --muted: #64748b;
      --border: rgba(148, 163, 184, 0.28);
      --border-strong: rgba(37, 99, 235, 0.22);
      --passed: #15803d;
      --passed-bg: rgba(34, 197, 94, 0.14);
      --failed: #be123c;
      --failed-bg: rgba(244, 63, 94, 0.12);
      --skipped: #b45309;
      --skipped-bg: rgba(245, 158, 11, 0.18);
      --accent: #2563eb;
      --accent-strong: #1d4ed8;
      --success: #15803d;
      --danger: #be123c;
      --shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
      --chart-center-text: #0f172a;
      --chart-center-subtext: #64748b;
      --radius-lg: 24px;
      --radius: 18px;
      --radius-sm: 12px;
      --radius-xs: 8px;
    }

    html[data-theme="dark"] {
      color-scheme: dark;
      --bg: #08101d;
      --bg-accent: #0f172a;
      --surface: rgba(15, 23, 42, 0.9);
      --surface-strong: #121a2b;
      --surface-muted: #172234;
      --surface-soft: rgba(23, 34, 52, 0.82);
      --text: #d8e1f0;
      --muted: #7e8ca5;
      --border: rgba(148, 163, 184, 0.18);
      --border-strong: rgba(125, 211, 252, 0.24);
      --passed: #4ade80;
      --passed-bg: rgba(74, 222, 128, 0.12);
      --failed: #fb7185;
      --failed-bg: rgba(251, 113, 133, 0.12);
      --skipped: #f59e0b;
      --skipped-bg: rgba(245, 158, 11, 0.12);
      --accent: #7dd3fc;
      --accent-strong: #38bdf8;
      --success: #22c55e;
      --danger: #f43f5e;
      --shadow: 0 18px 40px rgba(2, 6, 23, 0.38);
      --chart-center-text: #f8fbff;
      --chart-center-subtext: #9fb2cf;
    }

    * { box-sizing: border-box; }

    html {
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 28%),
        radial-gradient(circle at top right, rgba(34, 197, 94, 0.06), transparent 24%),
        linear-gradient(180deg, #f6f9fd 0%, #eef2f9 60%, #f4f7fb 100%);
    }

    html[data-theme="dark"] {
      background:
        radial-gradient(circle at top left, rgba(125, 211, 252, 0.12), transparent 28%),
        radial-gradient(circle at top right, rgba(244, 63, 94, 0.12), transparent 22%),
        linear-gradient(180deg, #07101d 0%, #0b1220 42%, #09111d 100%);
    }

    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: transparent;
      color: var(--text);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    .page-shell {
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }

    .page-backdrop {
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 20% 10%, rgba(56, 189, 248, 0.08), transparent 24%),
        radial-gradient(circle at 80% 6%, rgba(244, 63, 94, 0.08), transparent 20%);
      opacity: 0.7;
    }

    html[data-theme="dark"] .page-backdrop {
      background:
        radial-gradient(circle at 20% 10%, rgba(56, 189, 248, 0.12), transparent 24%),
        radial-gradient(circle at 80% 6%, rgba(244, 63, 94, 0.12), transparent 20%);
      opacity: 0.9;
    }

    .page {
      max-width: 1360px;
      margin: 0 auto;
      padding: 36px 24px 52px;
      position: relative;
      z-index: 1;
    }

    @media (max-width: 720px) {
      .page { padding: 18px 14px 32px; }
    }

    .hero {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(280px, 360px);
      gap: 20px;
      padding: 24px 24px 22px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      background: linear-gradient(145deg, var(--surface), var(--surface-muted));
      box-shadow: var(--shadow);
      overflow: hidden;
      margin-bottom: 24px;
    }

    .hero::after {
      content: '';
      position: absolute;
      inset: auto -80px -120px auto;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      background: var(--accent-soft, rgba(125, 211, 252, 0.12));
      filter: blur(14px);
      opacity: 0.55;
    }

    .hero--critical { border-color: rgba(190, 18, 60, 0.32); }
    .hero--warning { border-color: rgba(180, 83, 9, 0.32); }
    .hero--healthy { border-color: rgba(21, 128, 61, 0.28); }

    html[data-theme="dark"] .hero--critical { border-color: rgba(251, 113, 133, 0.35); }
    html[data-theme="dark"] .hero--warning { border-color: rgba(245, 158, 11, 0.35); }
    html[data-theme="dark"] .hero--healthy { border-color: rgba(74, 222, 128, 0.32); }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; }
    }

    .hero__copy {
      position: relative;
      z-index: 1;
    }

    .hero__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 6px 11px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: var(--accent-soft, rgba(37, 99, 235, 0.08));
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .hero__title {
      margin: 0 0 8px;
      font-size: clamp(2rem, 4vw, 3.35rem);
      line-height: 0.96;
      letter-spacing: -0.05em;
      font-weight: 800;
    }

    .hero__subtitle {
      margin: 0;
      color: var(--muted);
      max-width: 60ch;
      font-size: 0.98rem;
    }

    .hero__meta {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 14px;
      align-content: start;
      padding: 4px 0 0;
    }

    .hero__top-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .hero__meta-grid {
      display: grid;
      gap: 12px;
      padding: 16px 18px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--surface-soft);
      backdrop-filter: blur(12px);
    }

    .hero__meta-grid strong {
      display: block;
      margin-top: 4px;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      word-break: break-word;
    }

    .hero__meta-label {
      display: block;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 0.73rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border: 1px solid transparent;
    }

    .badge--local {
      background: rgba(37, 99, 235, 0.1);
      color: #1d4ed8;
      border-color: rgba(37, 99, 235, 0.2);
    }

    .badge--ci {
      background: rgba(217, 70, 239, 0.12);
      color: #a21caf;
      border-color: rgba(217, 70, 239, 0.22);
    }

    html[data-theme="dark"] .badge--local {
      background: rgba(125, 211, 252, 0.12);
      color: #8bdcff;
      border-color: rgba(125, 211, 252, 0.2);
    }

    html[data-theme="dark"] .badge--ci {
      background: rgba(251, 113, 133, 0.12);
      color: #ff9aae;
      border-color: rgba(251, 113, 133, 0.22);
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px 7px 9px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease;
    }

    .theme-toggle:hover { transform: translateY(-1px); background: var(--surface-muted); }
    .theme-toggle:active { transform: translateY(0); }

    .theme-toggle__icon {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-soft, rgba(37, 99, 235, 0.12));
      color: var(--accent);
      font-size: 0.78rem;
      line-height: 1;
    }

    .theme-toggle__label {
      min-width: 64px;
      text-align: left;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 18px;
      box-shadow: var(--shadow);
    }

    .stat-card__label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }

    .stat-card__value {
      font-size: 1.9rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: var(--text);
    }

    .stat-card--passed .stat-card__value { color: var(--passed); }
    .stat-card--failed .stat-card__value { color: var(--failed); }
    .stat-card--skipped .stat-card__value { color: var(--skipped); }
    .stat-card--accent .stat-card__value { color: var(--accent); }

    .report-layout {
      display: grid;
      grid-template-columns: minmax(260px, 330px) minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1040px) {
      .report-layout { grid-template-columns: 1fr; }
    }

    .rail {
      display: grid;
      gap: 16px;
      align-content: start;
      position: sticky;
      top: 18px;
    }

    @media (max-width: 1040px) {
      .rail {
        position: static;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
    }

    .main-column {
      display: grid;
      gap: 18px;
      align-content: start;
    }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
      box-shadow: var(--shadow);
    }

    .panel--chart { padding-bottom: 12px; }

    .panel__eyebrow {
      display: inline-flex;
      margin-bottom: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .panel__title {
      margin: 0 0 12px;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .section-title {
      margin: 0;
      font-size: 1.18rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--text);
    }

    .section-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .section-copy {
      color: var(--muted);
      font-size: 0.9rem;
    }

    .empty-state {
      color: var(--muted);
      margin: 0;
      padding: 12px 0;
      font-size: 0.92rem;
    }

    .muted { color: var(--muted); }

    .summary-list {
      display: grid;
      gap: 12px;
      margin: 0;
    }

    .summary-list div {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 11px;
      border-bottom: 1px solid var(--border);
    }

    .summary-list div:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .summary-list dt {
      color: var(--muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }

    .summary-list dd {
      margin: 0;
      text-align: right;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text);
    }

    .legend-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 12px;
    }

    .legend-list li {
      display: grid;
      grid-template-columns: 12px 1fr;
      gap: 12px;
      align-items: start;
    }

    .legend-list strong {
      display: block;
      margin-bottom: 2px;
      color: var(--text);
      font-size: 0.9rem;
    }

    .legend-list span {
      color: var(--muted);
      font-size: 0.84rem;
      display: block;
    }

    .legend-swatch {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      margin-top: 4px;
      box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.1);
    }

    html[data-theme="dark"] .legend-swatch {
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.03);
    }

    .legend-swatch--failed { background: var(--failed); }
    .legend-swatch--passed { background: var(--passed); }
    .legend-swatch--skipped { background: var(--skipped); }

    .deep-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 10px;
    }

    .deep-links li { display: block; }

    .deep-link {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-muted);
      text-decoration: none;
      color: var(--text);
      transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease;
    }

    .deep-link:hover {
      transform: translateY(-1px);
      border-color: var(--border-strong);
      background: var(--surface);
    }

    .deep-link__title {
      font-weight: 700;
      font-size: 0.92rem;
      color: var(--text);
    }

    .deep-link__copy {
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.4;
    }

    .deep-link__path {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.74rem;
      color: var(--accent-strong);
    }

    html[data-theme="dark"] .deep-link__path { color: var(--accent); }

    .status-pill {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.73rem;
      font-weight: 700;
      text-transform: lowercase;
      border: 1px solid transparent;
    }

    .status-pill--passed {
      background: var(--passed-bg);
      color: var(--passed);
      border-color: rgba(21, 128, 61, 0.2);
    }

    .status-pill--failed {
      background: var(--failed-bg);
      color: var(--failed);
      border-color: rgba(190, 18, 60, 0.18);
    }

    .status-pill--skipped {
      background: var(--skipped-bg);
      color: var(--skipped);
      border-color: rgba(180, 83, 9, 0.18);
    }

    html[data-theme="dark"] .status-pill--passed { border-color: rgba(74, 222, 128, 0.2); }
    html[data-theme="dark"] .status-pill--failed { border-color: rgba(251, 113, 133, 0.2); }
    html[data-theme="dark"] .status-pill--skipped { border-color: rgba(245, 158, 11, 0.2); }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      border: 1px solid transparent;
      transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease;
    }

    .btn:hover { transform: translateY(-1px); }

    .btn--primary {
      background: linear-gradient(135deg, #f43f5e, #be123c);
      color: #fff;
      box-shadow: 0 10px 18px rgba(190, 18, 60, 0.22);
    }

    .btn--primary:hover { background: linear-gradient(135deg, #f43f5e, #9f1239); }

    html[data-theme="dark"] .btn--primary {
      background: linear-gradient(135deg, #fb7185, #f43f5e);
      box-shadow: 0 10px 18px rgba(244, 63, 94, 0.22);
    }

    html[data-theme="dark"] .btn--primary:hover { background: linear-gradient(135deg, #ff89a3, #f43f5e); }

    .btn--ghost {
      background: rgba(37, 99, 235, 0.08);
      color: var(--accent-strong);
      border-color: rgba(37, 99, 235, 0.18);
    }

    .btn--ghost:hover { background: rgba(37, 99, 235, 0.14); }

    html[data-theme="dark"] .btn--ghost {
      background: rgba(125, 211, 252, 0.08);
      color: var(--accent);
      border-color: rgba(125, 211, 252, 0.2);
    }

    html[data-theme="dark"] .btn--ghost:hover { background: rgba(125, 211, 252, 0.16); }

    .test-groups {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .test-group {
      display: grid;
      gap: 12px;
    }

    .test-group__header {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .test-group__title {
      margin: 0;
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .test-group__copy {
      color: var(--muted);
      font-size: 0.84rem;
    }

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
      position: relative;
    }

    details.test-card::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 4px;
      background: var(--border-strong);
    }

    details.test-card[data-status="failed"]::before,
    details.test-card[data-status="timedOut"]::before,
    details.test-card[data-status="interrupted"]::before {
      background: linear-gradient(180deg, var(--failed) 0%, var(--danger) 100%);
    }

    details.test-card[data-status="passed"]::before { background: linear-gradient(180deg, var(--passed) 0%, var(--success) 100%); }
    details.test-card[data-status="skipped"]::before { background: linear-gradient(180deg, var(--skipped) 0%, #92400e 100%); }

    details.test-card summary {
      cursor: pointer;
      padding: 16px 18px 16px 20px;
      list-style: none;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    details.test-card summary::-webkit-details-marker { display: none; }

    details.test-card[open] summary {
      border-bottom: 1px solid var(--border);
      background: var(--surface-muted);
    }

    details.test-card[open] {
      border-color: var(--border-strong);
    }

    details.test-card[data-status="failed"],
    details.test-card[data-status="timedOut"],
    details.test-card[data-status="interrupted"] {
      border-color: rgba(190, 18, 60, 0.28);
      background: var(--surface);
    }

    html[data-theme="dark"] details.test-card[data-status="failed"],
    html[data-theme="dark"] details.test-card[data-status="timedOut"],
    html[data-theme="dark"] details.test-card[data-status="interrupted"] {
      border-color: rgba(251, 113, 133, 0.24);
      background: linear-gradient(180deg, rgba(28, 18, 28, 0.98), rgba(16, 18, 31, 0.95));
    }

    .test-card__index {
      font-weight: 700;
      color: var(--muted);
      font-size: 0.82rem;
      flex-shrink: 0;
    }

    .test-card__title {
      min-width: 0;
      font-weight: 700;
      font-size: 0.95rem;
      word-break: break-word;
      color: var(--text);
    }

    .test-card__duration {
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    @media (max-width: 760px) {
      details.test-card summary {
        grid-template-columns: 1fr;
        align-items: start;
      }

      .test-card__title { width: 100%; }
    }

    .test-card__body {
      padding: 18px 18px 20px 20px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 8px;
    }

    .meta-grid__item {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-muted);
      padding: 12px 13px;
    }

    .meta-grid__label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }

    .meta-grid code,
    .meta-grid__value {
      display: block;
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.82rem;
      word-break: break-word;
    }

    .meta-grid code {
      padding: 0;
      background: transparent;
      border-radius: 0;
    }

    .detail-section {
      margin-top: 20px;
      padding-top: 4px;
    }

    .subheading {
      margin: 0 0 10px;
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .error-block,
    .step-error {
      white-space: pre-wrap;
      margin: 0 0 12px;
      padding: 12px 14px;
      background: var(--failed-bg);
      border: 1px solid rgba(190, 18, 60, 0.18);
      border-left: 4px solid var(--failed);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.8rem;
      color: #9f1239;
      overflow-x: auto;
    }

    html[data-theme="dark"] .error-block,
    html[data-theme="dark"] .step-error {
      background: rgba(69, 10, 26, 0.52);
      border-color: rgba(251, 113, 133, 0.18);
      color: #ffd8df;
    }

    .step-error {
      margin-top: 10px;
    }

    .detail-section--collapsible {
      margin-top: 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-muted);
      overflow: hidden;
    }

    .detail-section--collapsible > summary.subheading--collapsible {
      cursor: pointer;
      list-style: none;
      margin: 0;
      padding: 12px 14px;
      background: var(--surface);
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

    .steps-timeline {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    details.step-details,
    .steps-timeline__item {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      overflow: hidden;
    }

    details.step-details[open] > summary {
      border-bottom: 1px solid var(--border);
      background: var(--surface-muted);
    }

    .steps-timeline__item--failed,
    details.step-details--failed {
      border-color: rgba(190, 18, 60, 0.22);
      background: var(--failed-bg);
    }

    html[data-theme="dark"] .steps-timeline__item--failed,
    html[data-theme="dark"] details.step-details--failed {
      border-color: rgba(251, 113, 133, 0.22);
      background: rgba(41, 18, 30, 0.54);
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

    .steps-timeline__item {
      padding: 10px 12px;
    }

    .step-details__body {
      padding: 8px 10px 10px;
    }

    .steps-timeline__header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .steps-timeline__icon {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 800;
      background: var(--accent-soft, rgba(37, 99, 235, 0.12));
      color: var(--accent-strong);
      flex-shrink: 0;
    }

    html[data-theme="dark"] .steps-timeline__icon {
      background: rgba(125, 211, 252, 0.12);
      color: var(--accent);
    }

    .steps-timeline__item--failed .steps-timeline__icon,
    details.step-details--failed .steps-timeline__icon {
      background: var(--failed-bg);
      color: var(--failed);
    }

    html[data-theme="dark"] .steps-timeline__item--failed .steps-timeline__icon,
    html[data-theme="dark"] details.step-details--failed .steps-timeline__icon {
      background: rgba(251, 113, 133, 0.16);
      color: #ff9aae;
    }

    .steps-timeline__title {
      flex: 1;
      min-width: 0;
      word-break: break-word;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.82rem;
      color: var(--text);
    }

    .steps-timeline__duration {
      color: var(--muted);
      font-size: 0.76rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .steps-timeline__nested {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-left: 10px;
      border-left: 2px solid var(--border-strong);
    }

    .attachment-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 640px) {
      .attachment-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (min-width: 1120px) {
      .attachment-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .attachment-card {
      margin: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--surface-muted);
    }

    .attachment-card img,
    .attachment-card video {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      background: #f1f5f9;
    }

    html[data-theme="dark"] .attachment-card img,
    html[data-theme="dark"] .attachment-card video {
      background: #020617;
    }

    .attachment-card figcaption {
      padding: 9px 11px;
      font-size: 0.76rem;
      color: var(--muted);
      word-break: break-word;
      border-top: 1px solid var(--border);
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
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      background: var(--surface-muted);
      color: var(--text);
      border: 1px solid var(--border);
      word-break: break-word;
    }

    .attachment-chip:hover { background: var(--bg-accent); }

    .attachment-chip--trace {
      background: rgba(37, 99, 235, 0.1);
      border-color: rgba(37, 99, 235, 0.2);
      color: var(--accent-strong);
    }

    html[data-theme="dark"] .attachment-chip--trace {
      background: rgba(125, 211, 252, 0.12);
      border-color: rgba(125, 211, 252, 0.2);
      color: var(--accent);
    }

    .test-card__actions {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .alert {
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      border: 1px solid transparent;
    }

    .alert--warning {
      background: var(--failed-bg);
      border-color: rgba(190, 18, 60, 0.22);
      color: #9f1239;
    }

    .alert--success {
      background: rgba(34, 197, 94, 0.12);
      border-color: rgba(21, 128, 61, 0.22);
      color: #166534;
    }

    html[data-theme="dark"] .alert--warning {
      background: rgba(69, 10, 26, 0.46);
      border-color: rgba(251, 113, 133, 0.26);
      color: #ffd8df;
    }

    html[data-theme="dark"] .alert--success {
      background: rgba(11, 63, 35, 0.42);
      border-color: rgba(74, 222, 128, 0.22);
      color: #dcfce7;
    }

    .chart-wrap {
      display: flex;
      justify-content: center;
      max-width: 100%;
      position: relative;
      height: 290px;
    }

    .chart-wrap canvas {
      max-width: 100%;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    a {
      color: var(--accent-strong);
      text-decoration: none;
    }

    html[data-theme="dark"] a { color: var(--accent); }

    a:hover { color: var(--accent); }
    html[data-theme="dark"] a:hover { color: #b2ebff; }

    a:focus-visible,
    summary:focus-visible,
    .btn:focus-visible,
    .theme-toggle:focus-visible {
      outline: 2px solid var(--accent-strong);
      outline-offset: 2px;
    }

    html[data-theme="dark"] a:focus-visible,
    html[data-theme="dark"] summary:focus-visible,
    html[data-theme="dark"] .btn:focus-visible,
    html[data-theme="dark"] .theme-toggle:focus-visible {
      outline-color: var(--accent);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    }
  `;
}

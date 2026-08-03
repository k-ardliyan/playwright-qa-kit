/** Themable CSS for generated custom-dashboard.html (light + dark via data-theme). */
export function getDashboardStyles(): string {
  return `
    :root {
      color-scheme: light;
      --bg: #fdf8f3;
      --bg-accent: #faf3eb;
      --surface: #ffffff;
      --surface-strong: #fffbf7;
      --surface-muted: #f7efe6;
      --surface-soft: rgba(247, 239, 230, 0.92);
      --text: #1a1a2e;
      --muted: #6b5b4f;
      --border: rgba(196, 149, 106, 0.22);
      --border-strong: rgba(180, 120, 70, 0.34);
      --passed: #3d8b55;
      --passed-bg: #e7f5ea;
      --failed: #c45c5c;
      --failed-bg: #fdeceb;
      --skipped: #c48a2b;
      --skipped-bg: #fdf3dc;
      --accent: #c4956a;
      --accent-strong: #a87648;
      --accent-soft: #f3e4d4;
      --info: #4f7cac;
      --info-bg: #e6f0f8;
      --success: #3d8b55;
      --danger: #c45c5c;
      --shadow: 0 1px 2px rgba(80, 50, 20, 0.04), 0 12px 28px rgba(180, 120, 70, 0.08);
      --chart-center-text: #1a1a2e;
      --chart-center-subtext: #6b5b4f;
      --radius-lg: 10px;
            --radius: 8px;
            --radius-sm: 6px;
            --radius-xs: 4px;
            --radius-pill: 999px;
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    html[data-theme="dark"] {
      color-scheme: dark;
      --bg: #17110d;
      --bg-accent: #1d1611;
      --surface: #221a14;
      --surface-strong: #2a2119;
      --surface-muted: #32271e;
      --surface-soft: rgba(50, 39, 30, 0.92);
      --text: #f6efe7;
      --muted: #b9a594;
      --border: rgba(212, 165, 116, 0.2);
      --border-strong: rgba(212, 165, 116, 0.34);
      --passed: #7dcea0;
      --passed-bg: rgba(125, 206, 160, 0.12);
      --failed: #f0a3a0;
      --failed-bg: rgba(196, 92, 92, 0.18);
      --skipped: #f0c674;
      --skipped-bg: rgba(196, 138, 43, 0.16);
      --accent: #d4a574;
      --accent-strong: #e0b98a;
      --accent-soft: rgba(212, 165, 116, 0.16);
      --info: #8fb8e0;
      --info-bg: rgba(79, 124, 172, 0.18);
      --success: #7dcea0;
      --danger: #f0a3a0;
      --shadow: 0 1px 0 rgba(255,255,255,0.03), 0 14px 32px rgba(0, 0, 0, 0.42);
      --chart-center-text: #f6efe7;
      --chart-center-subtext: #b9a594;
    }

    * { box-sizing: border-box; }

    html {
      background: var(--bg);
    }

    html[data-theme="dark"] {
      background: var(--bg);
    }

    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: transparent;
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    code, pre, .tbl-test-id, .meta-grid__item code, .error-block {
      font-family: var(--mono);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
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
      z-index: 0;
      background:
        radial-gradient(ellipse 42% 34% at 0% 0%, rgba(197, 213, 192, 0.28), transparent 62%),
        radial-gradient(ellipse 36% 30% at 100% 100%, rgba(232, 196, 196, 0.22), transparent 60%),
        radial-gradient(ellipse 28% 22% at 92% 8%, rgba(243, 228, 212, 0.45), transparent 55%);
    }

    html[data-theme="dark"] .page-backdrop {
      background:
        radial-gradient(ellipse 42% 34% at 0% 0%, rgba(120, 140, 110, 0.12), transparent 62%),
        radial-gradient(ellipse 36% 30% at 100% 100%, rgba(140, 100, 100, 0.12), transparent 60%);
    }

    .page {
      max-width: none;
      width: 100%;
      margin: 0;
      padding: 20px 24px 48px;
      position: relative;
      z-index: 1;
    }

    @media (min-width: 1440px) {
      .page { padding: 24px 32px 56px; }
    }

    @media (max-width: 720px) {
      .page { padding: 14px 12px 32px; }
    }

    .hero {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 18px 20px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      box-shadow: var(--shadow);
      overflow: hidden;
      margin-bottom: 16px;
    }

    .hero::after { display: none; }

    .hero--critical { border-color: rgba(196, 149, 106, 0.35); background: linear-gradient(180deg, #fff9f2 0%, #ffffff 55%); }
    .hero--warning { border-color: rgba(196, 138, 43, 0.3); }
    .hero--healthy { border-color: rgba(61, 139, 85, 0.28); }

    html[data-theme="dark"] .hero--critical {
      border-color: rgba(212, 165, 116, 0.35);
      background: linear-gradient(180deg, #2a1f16 0%, var(--surface) 60%);
    }
    html[data-theme="dark"] .hero--warning { border-color: rgba(251, 191, 36, 0.35); }
    html[data-theme="dark"] .hero--healthy { border-color: rgba(74, 222, 128, 0.32); }

    @media (max-width: 720px) {
      .hero { padding: 14px; }
    }

    .hero__top-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* Icon mark stretches to full text-stack height (not a short fixed square) */
                .hero__identity {
                  display: flex;
                  align-items: stretch;
                  gap: 14px;
                  min-width: 0;
                  flex: 1;
                }

                .hero__mark {
                  /* Height follows .hero__copy; width locks to square via aspect-ratio */
                  box-sizing: border-box;
                  flex: 0 0 auto;
                  align-self: stretch;
                  width: auto;
                  height: auto;
                  min-height: 4.5rem;
                  aspect-ratio: 1 / 1;
                  border-radius: 14px;
                  background: var(--accent-soft);
                  color: var(--accent);
                  display: grid;
                  place-items: center;
                  position: relative;
                }

                .hero__mark svg {
                  width: 52%;
                  height: 52%;
                  max-width: 36px;
                  max-height: 36px;
                  min-width: 22px;
                  min-height: 22px;
                  display: block;
                }

                .hero__mark-x {
                  position: absolute;
                  right: -5px;
                  bottom: -5px;
                  width: 20px;
                  height: 20px;
                  border-radius: 999px;
                  background: var(--accent);
                  color: #fff;
                  display: grid;
                  place-items: center;
                  font-size: 12px;
                  font-weight: 800;
                  line-height: 1;
                  border: 2px solid var(--surface);
                  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
                }

                .hero__top-actions {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  align-self: center;
                }

                .hero__body {
                  display: none;
                }

                .hero__copy {
                  min-width: 0;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  gap: 4px;
                  padding: 2px 0;
                }

                .hero__eyebrow {
                  display: block;
                  margin: 0;
                  padding: 0;
                  border: 0;
                  background: transparent;
                  color: var(--accent);
                  text-transform: uppercase;
                  letter-spacing: 0.08em;
                  font-size: 0.72rem;
                  font-weight: 700;
                  line-height: 1.25;
                }

                .hero__title {
                  margin: 0;
                  font-size: clamp(1.4rem, 2.2vw, 1.85rem);
                  line-height: 1.2;
                  letter-spacing: -0.03em;
                  font-weight: 800;
                  color: var(--text);
                }

                .hero__subtitle {
                  margin: 0;
                  color: var(--muted);
                  max-width: 70ch;
                  font-size: 0.88rem;
                  line-height: 1.35;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }

    .hero__meta-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 18px;
      align-items: center;
      justify-content: flex-end;
    }

    .hero__meta-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .hero__meta-icon {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--accent);
      display: grid;
      place-items: center;
      flex: 0 0 auto;
    }

    .hero__meta-icon svg { width: 13px; height: 13px; }

    .hero__meta-text {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      gap: 6px;
      white-space: nowrap;
    }

    .hero__meta-label {
      display: inline;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.62rem;
      font-weight: 700;
    }

    .hero__meta-item strong {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text);
    }

    .badge {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid transparent;
      white-space: nowrap;
      line-height: 1;
    }

    .badge svg {
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
      display: block;
    }

    .badge--local, .badge--ci {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .theme-toggle {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .theme-toggle__icon {
      width: 16px;
      height: 16px;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
    }

    .theme-toggle__icon svg {
      width: 14px;
      height: 14px;
      display: block;
    }

    .theme-toggle__label {
      white-space: nowrap;
    }

    .theme-toggle:hover { border-color: var(--border-strong); }

    .hero-stat-bar {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
      overflow: hidden;
    }

    html[data-theme="dark"] .hero-stat-bar {
      background: var(--surface-muted);
    }

    .hero-stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-right: 1px solid var(--border);
      min-width: 0;
      background: transparent;
      border-radius: 0;
    }

    .hero-stat:last-child { border-right: 0; }

    .hero-stat__icon {
      width: 40px;
      height: 40px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      background: var(--accent-soft);
      color: var(--accent);
    }

    .hero-stat__icon svg { width: 18px; height: 18px; }

    .hero-stat--passed .hero-stat__icon { background: var(--passed-bg); color: var(--passed); }
    .hero-stat--failed .hero-stat__icon { background: var(--failed-bg); color: var(--failed); }
    .hero-stat--skipped .hero-stat__icon { background: var(--skipped-bg); color: var(--skipped); }
    .hero-stat--accent .hero-stat__icon { background: var(--info-bg); color: var(--info); }

    .hero-stat__copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .hero-stat__num {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .hero-stat__lbl {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .hero-stat--passed .hero-stat__num { color: var(--passed); }
    .hero-stat--failed .hero-stat__num { color: var(--failed); }
    .hero-stat--skipped .hero-stat__num { color: var(--skipped); }
    .hero-stat--accent .hero-stat__num { color: var(--info); }

    @media (max-width: 960px) {
      .hero-stat-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hero-stat { border-bottom: 1px solid var(--border); }
    }

    @media (max-width: 560px) {
      .hero-stat-bar { grid-template-columns: 1fr; }
    }

    .theme-toggle__icon {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      background: var(--accent-soft);
      color: var(--accent);
      line-height: 1;
    }

    .theme-toggle__icon svg {
      width: 14px;
      height: 14px;
      display: block;
    }

    .theme-toggle__label {
      min-width: auto;
      white-space: nowrap;
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

    /* ---- Info strip (single collapsible with 4 panels inside) ---- */
    details.info-strip {
      margin-bottom: 24px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .info-strip__toggle {
      cursor: pointer;
      list-style: none;
      padding: 12px 16px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: var(--surface-muted);
      border-bottom: 1px solid transparent;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      transition: background 0.14s ease;
    }

    .info-strip__toggle:hover {
      background: var(--bg-accent);
    }

    .info-strip__toggle::-webkit-details-marker { display: none; }

    .info-strip__toggle::before {
      content: '▸';
      transition: transform 0.15s ease;
      flex-shrink: 0;
    }

    details.info-strip[open] > .info-strip__toggle::before {
      transform: rotate(90deg);
    }

    details.info-strip[open] > .info-strip__toggle {
      border-bottom-color: var(--border);
    }

    .info-strip__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1px;
      background: var(--border);
    }

    .info-panel {
      background: var(--surface);
      padding: 0;
    }

    .info-panel .panel {
      border: 0;
      border-radius: 0;
      box-shadow: none;
      padding: 16px;
    }

    .report-layout {
      display: block;
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
      min-width: 0;
      overflow-x: auto;
    }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
      box-shadow: var(--shadow);
      min-width: 0;
      overflow-x: auto;
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
              display: flex;
              flex-direction: column;
              gap: 8px;
              flex: 1 1 auto;
              min-height: 0;
            }

            .deep-links--row {
              flex-direction: row;
              flex-wrap: wrap;
              gap: 10px;
            }

            .deep-links--row > li {
              flex: 1 1 220px;
              min-width: 0;
            }

            .deep-links li {
              display: block;
              flex: 0 0 auto;
            }

        .deep-link {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 3px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-muted);
          text-decoration: none;
          color: var(--text);
          transition: border-color 0.14s ease, background 0.14s ease;
          overflow: visible;
        }

        .deep-link:hover {
          transform: none;
          border-color: var(--border-strong);
          background: var(--surface);
        }

        .deep-link__title {
          font-weight: 700;
          font-size: 0.82rem;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .deep-link__copy {
          color: var(--muted);
          font-size: 0.72rem;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .deep-link__path {
          font-family: var(--mono);
          font-size: 0.68rem;
          color: var(--accent-strong);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        html[data-theme="dark"] .deep-link__path { color: var(--accent); }

        .deep-links__hint {
          margin: 8px 0 0;
          font-size: 0.68rem;
          color: var(--muted);
          line-height: 1.35;
        }

        .panel--deep-links {
          min-width: 0;
        }

            .status-pill {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 5px 11px;
              border-radius: 999px;
              font-size: 0.75rem;
              font-weight: 700;
              text-transform: none;
              border: 1px solid transparent;
              white-space: nowrap;
            }

    .status-pill--passed {
      background: var(--passed-bg);
      color: var(--passed);
      border-color: rgba(22, 163, 74, 0.18);
    }

    .status-pill--failed {
      background: var(--failed-bg);
      color: var(--failed);
      border-color: rgba(196, 92, 92, 0.22);
    }

    .status-pill--skipped {
      background: var(--skipped-bg);
      color: var(--skipped);
      border-color: rgba(245, 158, 11, 0.18);
    }

    html[data-theme="dark"] .status-pill--passed { border-color: rgba(74, 222, 128, 0.2); }
    html[data-theme="dark"] .status-pill--failed { border-color: rgba(251, 113, 133, 0.2); }
    html[data-theme="dark"] .status-pill--skipped { border-color: rgba(245, 158, 11, 0.2); }

    .status-pill--full.status-pill--full {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      width: auto;
      border-radius: 999px;
      padding: 5px 11px;
      text-align: center;
    }

    .status-pill__icon {
      font-weight: 800;
      line-height: 1;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      border: 1px solid transparent;
      cursor: pointer;
      transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease;
    }

    .btn:hover { transform: translateY(-1px); }

    .btn--primary {
      background: var(--accent);
      color: #fff;
      box-shadow: 0 8px 18px rgba(180, 120, 70, 0.22);
    }

    .btn--primary:hover { background: var(--accent-strong); color: #fff; }

    html[data-theme="dark"] .btn--primary {
      background: var(--accent);
      box-shadow: 0 10px 18px rgba(212, 165, 116, 0.18);
    }

    html[data-theme="dark"] .btn--primary:hover { background: var(--accent-strong); }

    .btn--ghost {
      background: var(--surface);
      color: var(--text);
      border-color: var(--border);
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
          gap: 0;
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          background: var(--surface);
        }

        details.test-card {
          background: var(--surface);
          border: 0;
          border-bottom: 1px solid var(--border);
          border-radius: 0;
          box-shadow: none;
          overflow: hidden;
          position: relative;
        }

        details.test-card:last-child {
          border-bottom: 0;
        }

        details.test-card::before {
          content: '';
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: transparent;
        }

        details.test-card[data-status="failed"]::before,
        details.test-card[data-status="timedOut"]::before,
        details.test-card[data-status="interrupted"]::before {
          background: var(--failed);
        }

        details.test-card[data-status="passed"]::before { background: var(--passed); }
        details.test-card[data-status="skipped"]::before { background: var(--skipped); }

        details.test-card summary.test-card__summary {
          cursor: pointer;
          padding: 10px 12px 8px 14px;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }

        details.test-card summary::-webkit-details-marker { display: none; }

        details.test-card[open] summary.test-card__summary {
          border-bottom: 1px solid var(--border);
          background: var(--surface-muted);
        }

        details.test-card:hover > summary.test-card__summary {
          background: var(--surface-muted);
        }

        details.test-card[open] {
          border-color: var(--border);
        }

        details.test-card[data-status="failed"],
        details.test-card[data-status="timedOut"],
        details.test-card[data-status="interrupted"] {
          border-color: var(--border);
          background: var(--surface);
        }

        html[data-theme="dark"] details.test-card[data-status="failed"],
        html[data-theme="dark"] details.test-card[data-status="timedOut"],
        html[data-theme="dark"] details.test-card[data-status="interrupted"] {
          border-color: var(--border);
          background: var(--surface);
        }

        .test-card__summary-row {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.35;
        }

        .test-card__meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 0 0 0 28px;
          font-size: 0.75rem;
          color: var(--muted);
          line-height: 1.3;
        }

        .test-file-path {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.72rem;
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .test-file-test-status-icon {
          flex: none;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 800;
          line-height: 1;
          margin-top: 2px;
        }

        .test-file-test-status-icon--failed { color: var(--failed); }
        .test-file-test-status-icon--passed { color: var(--passed); }
        .test-file-test-status-icon--skipped { color: var(--skipped); }

        .test-card__index {
          font-weight: 700;
          color: var(--muted);
          font-size: 0.75rem;
          flex-shrink: 0;
          min-width: 1.4rem;
        }

        .test-card__title,
        .test-file-title {
          min-width: 0;
          font-weight: 600;
          font-size: 0.92rem;
          word-break: break-word;
          color: var(--text);
          line-height: 1.35;
          flex: 1 1 220px;
        }

        /* Unified pill metrics so badges sit evenly side-by-side */
            .test-card__badges {
              display: inline-flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 6px;
            }

            .test-card__badges > .badge,
            .test-card__badges > .status-pill,
            .test-card__badges > .priority-badge,
            .test-card__badges > .failure-source,
            .test-card__badges > .layer-badge {
              box-sizing: border-box;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 24px;
              min-height: 24px;
              max-height: 24px;
              padding: 0 10px;
              border-radius: 999px;
              font-size: 0.7rem;
              font-weight: 700;
              line-height: 1;
              letter-spacing: 0.02em;
              white-space: nowrap;
              border: 1px solid transparent;
              vertical-align: middle;
            }

            .test-card__badges > .status-pill--full {
              gap: 4px;
              padding: 0 10px;
            }

            .badge--meta {
              background: var(--surface-muted);
              color: var(--text);
              border-color: var(--border);
              font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              font-weight: 600;
              text-transform: none;
            }

            .chip-body--steps {
              padding: 0;
            }

            .steps-panel {
              display: flex;
              flex-direction: column;
              min-width: 0;
            }

            /* Native-like subnav search for steps */
            .step-filter {
              position: relative;
              display: flex;
              align-items: center;
              margin: 0;
              padding: 10px 12px;
              border-bottom: 1px solid var(--border);
              background: var(--surface-muted);
              gap: 0;
            }

            .step-filter__icon {
              position: absolute;
              left: 22px;
              top: 50%;
              transform: translateY(-50%);
              color: var(--muted);
              font-size: 0.9rem;
              pointer-events: none;
              line-height: 1;
            }

            .step-filter__input {
              width: 100%;
              box-sizing: border-box;
              height: 32px;
              padding: 0 12px 0 32px;
              border: 1px solid var(--border);
              border-radius: 6px;
              background: var(--surface);
              color: var(--text);
              font-size: 0.82rem;
              line-height: 32px;
              outline: none;
            }

            .step-filter__input:focus {
              border-color: var(--accent);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
            }

            .step-filter__input::placeholder {
                          color: var(--muted);
                        }

                        .step-filter-empty {
                          margin: 0;
                          padding: 12px 14px 14px;
                          color: var(--muted);
                          font-size: 0.82rem;
                          border-top: 1px solid var(--border);
                        }

                        .step-filter-empty[hidden] {
                          display: none !important;
                        }

            .steps-panel > .steps-tree,
            .steps-panel > .tree-item-list {
              border-top: 0;
            }

            .status-pill,
            .priority-badge,
            .failure-source,
            .layer-badge {
              box-sizing: border-box;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 24px;
              min-height: 24px;
              padding: 0 10px;
              border-radius: 999px;
              font-size: 0.7rem;
              font-weight: 700;
              line-height: 1;
              white-space: nowrap;
              border: 1px solid transparent;
              vertical-align: middle;
            }

            .status-pill {
              text-transform: none;
              gap: 4px;
            }

            .priority-badge {
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }

            .layer-badge {
              text-transform: uppercase;
              font-size: 0.66rem;
              padding: 0 8px;
              min-height: 22px;
              height: 22px;
            }

            .failure-source {
              letter-spacing: 0.03em;
            }

            .status-pill--full {
              gap: 4px;
            }

            .status-pill__icon {
              font-weight: 800;
              line-height: 1;
              font-size: 0.72rem;
            }

            .chip.detail-chip > .chip-body {
              padding: 12px 14px;
            }

            .chip.detail-chip > .chip-body--steps {
              padding: 0;
            }

            .chip.detail-chip > .chip-body--flush {
              padding: 0;
            }

            .meta-grid {
              margin-bottom: 0;
            }

            .detail-section {
              margin-top: 0;
              padding: 0;
            }

            .input-kv,
            .results-comparison {
              padding: 0;
            }

        .test-card__duration {
          color: var(--muted);
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
          margin-left: auto;
          white-space: nowrap;
        }

        @media (max-width: 760px) {
          .test-card__summary-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .test-card__title { width: 100%; }
          .test-card__duration { margin-left: 0; }
          .test-card__meta-row { padding-left: 0; }
        }

        .test-card__body,
        .test-result {
          padding: 12px 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Playwright-like collapsible chips inside test body */
        .chip.detail-chip {
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--surface);
          overflow: hidden;
        }

        .chip.detail-chip > .chip-header {
          cursor: pointer;
          list-style: none;
          margin: 0;
          padding: 0 10px;
          background: var(--surface-muted);
          border-bottom: 1px solid transparent;
          font-weight: 600;
          font-size: 0.84rem;
          line-height: 36px;
          color: var(--text);
          user-select: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chip.detail-chip > .chip-header::-webkit-details-marker { display: none; }

        .chip.detail-chip > .chip-header::before {
          content: '▸';
          display: inline-block;
          width: 14px;
          margin-right: 6px;
          color: var(--muted);
          transition: transform 0.12s ease;
        }

        .chip.detail-chip[open] > .chip-header::before {
          transform: rotate(90deg);
        }

        .chip.detail-chip[open] > .chip-header {
          border-bottom-color: var(--border);
        }

        .chip-count {
          display: inline-block;
          min-width: 18px;
          margin-left: 6px;
          padding: 0 6px;
          border-radius: 999px;
          background: var(--border);
          color: var(--muted);
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 18px;
          vertical-align: middle;
        }

        .chip-body {
          padding: 12px 14px;
        }

        .chip-body--flush {
          padding: 0;
        }

        /* Native-like error blocks */
        .test-error-container {
          position: relative;
          white-space: pre;
          flex: none;
          padding: 0;
          background-color: var(--surface-muted);
          border-radius: 6px;
          line-height: initial;
          margin-bottom: 6px;
          overflow: hidden;
        }

        .test-error-view,
        .error-block {
          overflow: auto;
          margin: 0;
          padding: 14px 16px;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.8rem;
          color: #9f1239;
          background: var(--failed-bg);
          border: 0;
          border-left: 4px solid var(--failed);
          border-radius: 0;
        }

        html[data-theme="dark"] .test-error-view,
        html[data-theme="dark"] .error-block {
          color: #ffd8df;
          background: rgba(69, 10, 26, 0.52);
        }

        /* Playwright tree-item steps */
        .tree-item-list,
        .steps-tree {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .tree-item {
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                  min-width: 0;
                  line-height: 36px;
                  border-top: 1px solid var(--border);
                }

                /* Critical: author display:flex overrides UA [hidden] without this */
                .tree-item[hidden],
                .tree-item.tree-item--filtered-out {
                  display: none !important;
                }

        .tree-item:first-child {
          border-top: 0;
        }

        .tree-item--failed {
          background: color-mix(in srgb, var(--failed-bg) 55%, transparent);
        }

        .tree-item__title {
          cursor: default;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px 0 4px;
          list-style: none;
          user-select: none;
        }

        details.tree-item--branch > summary.tree-item__title {
          cursor: pointer;
        }

        details.tree-item--branch > summary.tree-item__title::-webkit-details-marker {
          display: none;
        }

        details.tree-item--branch > summary.tree-item__title::before {
          content: '▸';
          flex: none;
          width: 14px;
          color: var(--muted);
          transition: transform 0.12s ease;
        }

        details.tree-item--branch[open] > summary.tree-item__title::before {
          transform: rotate(90deg);
        }

        .tree-item__spacer {
          display: inline-block;
          width: 14px;
          flex: none;
        }

        .tree-item__status {
          flex: none;
          width: 16px;
          text-align: center;
          font-weight: 800;
          font-size: 0.78rem;
        }

        .tree-item__status--failed { color: var(--failed); }
        .tree-item__status--passed { color: var(--passed); }
        .tree-item__status--skipped { color: var(--skipped); }

        .tree-item__label {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.8rem;
          color: var(--text);
        }

        .tree-item__duration {
          flex: none;
          margin-left: auto;
          color: var(--muted);
          font-size: 0.74rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .tree-item__body {
          padding: 0 0 8px;
        }

        .tree-item__children {
          display: flex;
          flex-direction: column;
        }

        .tree-item__body .test-error-container {
          margin: 0 12px 8px;
        }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }

    .meta-grid__item {
      border: 1px solid var(--border);
      border-radius: var(--radius-xs);
      background: var(--surface-muted);
      padding: 8px 10px;
    }

    .meta-grid__label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .meta-grid code,
    .meta-grid__value {
      display: block;
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.78rem;
      word-break: break-all;
      line-height: 1.4;
    }

    .meta-grid code {
      background: transparent;
      padding: 0;
      border: none;
    }

    .detail-section {
          margin-top: 0;
          padding-top: 0;
        }

        .subheading {
          margin: 0 0 8px;
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .input-kv {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .input-kv .key {
          font-weight: 600;
          color: var(--accent);
          margin-right: 6px;
        }

        .results-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 720px) {
          .results-comparison { grid-template-columns: 1fr; }
        }

        .deep-links__hint {
          margin: 10px 0 0;
          font-size: 0.72rem;
          color: var(--muted);
          line-height: 1.4;
        }

        .deep-links__hint code {
          font-size: 0.7rem;
        }

    .result-box {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      background: var(--surface-muted);
    }
    .result-box .result-content {
      white-space: normal;
      word-break: break-word;
      line-height: 1.45;
      background: transparent;
    }
    .result-box--failed .result-content {
      color: var(--failed);
      font-weight: 600;
    }
    .result-box--passed .result-content {
      color: var(--passed);
      font-weight: 500;
    }

    .result-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .result-content {
      font-size: 0.8rem;
      line-height: 1.4;
      color: var(--text);
      word-break: break-word;
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
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              justify-content: space-between;
              gap: 12px 16px;
              padding: 14px 16px;
              border-radius: var(--radius);
              font-size: 0.9rem;
              border: 1px solid transparent;
              margin: 0 0 14px;
            }

            .alert__body {
              display: flex;
              align-items: center;
              gap: 12px;
              min-width: 0;
              flex: 1 1 280px;
            }

            .alert__icon {
              width: 32px;
              height: 32px;
              border-radius: 999px;
              display: grid;
              place-items: center;
              flex: 0 0 auto;
              background: rgba(255, 255, 255, 0.55);
              color: currentColor;
            }

            .alert__icon svg { width: 16px; height: 16px; display: block; }

            .alert__copy {
              display: flex;
              flex-wrap: wrap;
              gap: 4px 8px;
              align-items: center;
              line-height: 1.35;
            }

            .alert__copy strong { font-weight: 800; }

            .alert__actions {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              align-items: center;
              justify-content: flex-end;
            }

        .alert--warning {
          background: linear-gradient(180deg, #fdf3e8 0%, #fcefe4 100%);
          border-color: rgba(196, 149, 106, 0.28);
          color: #8a5a2b;
        }

        .alert--success {
          background: linear-gradient(180deg, #f0faf2 0%, #e7f5ea 100%);
          border-color: rgba(61, 139, 85, 0.22);
          color: #2f6b42;
        }

        html[data-theme="dark"] .alert--warning {
          background: rgba(80, 50, 20, 0.4);
          border-color: rgba(212, 165, 116, 0.28);
          color: #f0d7b8;
        }

        html[data-theme="dark"] .alert--success {
          background: rgba(20, 60, 35, 0.4);
          border-color: rgba(125, 206, 160, 0.22);
          color: #dcfce7;
        }

        .results-footer {
          text-align: center;
          color: var(--muted);
          font-size: 0.82rem;
          margin: 14px 0 8px;
        }

        .btn__icon {
          display: inline-grid;
          place-items: center;
          width: 16px;
          height: 16px;
        }

        .btn__icon svg { width: 14px; height: 14px; }

        .btn--sm {
          padding: 7px 12px;
          font-size: 0.78rem;
        }

        .btn--ghost {
          background: var(--surface);
          color: var(--text);
          border-color: var(--border);
        }

        .btn--ghost:hover {
          border-color: var(--border-strong);
          background: var(--surface-muted);
        }

        .btn--primary {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
          box-shadow: 0 8px 18px rgba(180, 120, 70, 0.22);
        }

        .btn--primary:hover {
          background: var(--accent-strong);
          border-color: var(--accent-strong);
        }

        .column-picker {
          position: relative;
        }

        .column-picker__btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .column-picker__btn:hover {
          border-color: var(--border-strong);
          background: var(--surface-muted);
        }

        .column-picker__btn svg {
          width: 15px;
          height: 15px;
        }

        .column-picker__menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 220px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          box-shadow: var(--shadow);
          z-index: 40;
          display: none;
        }

        .column-picker.is-open .column-picker__menu {
          display: block;
        }

        .column-picker__title {
                  font-size: 0.72rem;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  color: var(--muted);
                  margin: 0 0 8px;
                }

                .column-picker__title--section {
                  margin-top: 12px;
                  padding-top: 10px;
                  border-top: 1px solid var(--border);
                }

                .column-picker__hint {
                  margin-left: 4px;
                  font-size: 0.7rem;
                  font-weight: 500;
                  color: var(--muted);
                  text-transform: none;
                  letter-spacing: 0;
                }

                .column-picker__item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 6px 4px;
                  font-size: 0.82rem;
                  color: var(--text);
                  cursor: pointer;
                  border-radius: 8px;
                }

        .column-picker__item:hover {
          background: var(--surface-muted);
        }

        .column-picker__item input:disabled {
          opacity: 0.55;
        }

        .column-picker__item--locked {
          opacity: 0.75;
        }

        .column-picker__actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }

        .column-picker__actions button {
          flex: 1;
          height: 30px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface-muted);
          color: var(--text);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
        }

        .qa-report-table th[data-col-hidden="1"],
        .qa-report-table td[data-col-hidden="1"] {
          display: none !important;
        }

    .chart-wrap {
      display: flex;
      justify-content: center;
      max-width: 100%;
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
    html[data-theme="dark"] a:hover { color: #ffb3c9; }

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

    /* =========================================================
       TABLE VIEW — new in v2
       ========================================================= */

    /* View toggle tabs */
    .view-toggle {
      display: flex;
      gap: 4px;
      margin-bottom: 14px;
    }

    .toggle-btn {
      padding: 7px 16px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface-muted);
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.14s ease, border-color 0.14s ease, color 0.14s ease;
    }

    .toggle-btn:hover {
      border-color: var(--border-strong);
      color: var(--text);
    }

    .toggle-btn--active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    html[data-theme="dark"] .toggle-btn--active {
      background: var(--accent);
      color: #0a1929;
    }

    /* Hidden panel */
    .view-panel--hidden { display: none; }
    .view-panel--active { display: block; }

    /* Toolbar row — stand-alone, OUTSIDE #view-table / #view-accordion */
            .table-toolbar,
            .accordion-toolbar {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
              flex-wrap: wrap;
              padding: 10px 12px;
              border: 1px solid var(--border);
              border-radius: var(--radius-sm);
              background: var(--surface);
            }

            .table-toolbar.view-toolbar--hidden,
            .accordion-toolbar.view-toolbar--hidden,
            .table-toolbar[hidden],
            .accordion-toolbar[hidden] {
              display: none !important;
            }

            .table-toolbar__label,
            .accordion-toolbar__label {
              font-size: 0.72rem;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: var(--muted);
              margin-right: 4px;
            }

            .sort-select {
              cursor: pointer;
            }

            .sort-select:focus { outline: 2px solid var(--accent); outline-offset: 2px; }

            .export-buttons {
              display: flex;
              gap: 6px;
              margin-left: auto;
              flex-wrap: wrap;
            }

            .btn--sm {
              padding: 6px 12px;
              font-size: 0.78rem;
            }

    /* Table wrapper — horizontal scroll only when needed */
    .table-wrapper {
      overflow-x: auto;
      overflow-y: visible;
      max-height: none;
      width: 100%;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface);
    }

    /* Core table — fixed layout so right columns never collapse/disappear */
    .qa-report-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 12.5px;
      min-width: 1280px;
      table-layout: fixed;
      --row-bg: var(--surface);
      --row-bg-hover: #f7efe6;
      --row-bg-failed: #fdf1ef;
      --row-bg-skipped: #fdf8ec;
    }

    html[data-theme="dark"] .qa-report-table {
      --row-bg: var(--surface);
      --row-bg-hover: #32271e;
      --row-bg-failed: #2a1818;
      --row-bg-skipped: #2a2314;
    }

    .qa-report-table th {
      background: var(--surface-muted);
      padding: 9px 10px;
      text-align: left;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-bottom: 1px solid var(--border);
      color: var(--muted);
      white-space: nowrap;
      position: sticky;
      top: 0;
      z-index: 3;
    }

    .qa-report-table td {
          padding: 8px 10px;
          vertical-align: top;
          border-bottom: 1px solid var(--border);
          color: var(--text);
          background: var(--row-bg);
          overflow: visible;
        }

    .qa-report-table tbody tr:last-child td { border-bottom: 0; }

    .qa-report-table tbody tr:hover td {
      background: var(--row-bg-hover);
    }

    .tbl-row--failed td,
    .tbl-row--timedOut td,
    .tbl-row--interrupted td {
      background: var(--row-bg-failed);
    }

    html[data-theme="dark"] .tbl-row--failed td,
    html[data-theme="dark"] .tbl-row--timedOut td,
    html[data-theme="dark"] .tbl-row--interrupted td {
      background: var(--row-bg-failed);
    }

    .tbl-row--skipped td {
      background: var(--row-bg-skipped);
    }

    /* Explicit column widths so STATUS / PRIORITY / SOURCE / NOTES always reserved */
    .qa-report-table .tbl-test-id,
    .qa-report-table th[data-col="testId"] { width: 110px; }
    .qa-report-table .tbl-module,
    .qa-report-table th[data-col="module"] { width: 90px; }
    .qa-report-table .tbl-feature,
    .qa-report-table th[data-col="feature"] { width: 110px; }
    .qa-report-table .tbl-description,
    .qa-report-table th[data-col="description"] { width: 160px; }
    .qa-report-table .tbl-steps,
    .qa-report-table th[data-col="steps"] { width: 200px; }
    .qa-report-table .tbl-input,
    .qa-report-table th[data-col="input"] { width: 150px; }
    .qa-report-table .tbl-expected,
    .qa-report-table th[data-col="expected"] { width: 160px; }
    .qa-report-table .tbl-actual,
    .qa-report-table th[data-col="actual"] { width: 170px; }
    .qa-report-table .tbl-status,
    .qa-report-table th[data-col="status"] { width: 100px; }
    .qa-report-table .tbl-priority,
    .qa-report-table th[data-col="priority"] { width: 90px; }
    .qa-report-table .tbl-source,
        .qa-report-table th[data-col="source"] { width: 150px; }
    .qa-report-table .tbl-notes,
    .qa-report-table th[data-col="notes"] { width: 130px; }

    /* Sticky only Test ID (left identity) — simple, no mid-table sticky */
        .qa-report-table .col-sticky-0 {
          position: sticky;
          left: 0;
          z-index: 4;
          background: var(--row-bg);
          box-shadow: 1px 0 0 var(--border);
        }
        .qa-report-table thead .col-sticky-0 {
          z-index: 5;
          background: var(--surface-muted);
        }
        .qa-report-table tbody tr:hover .col-sticky-0 {
          background: var(--row-bg-hover);
        }
        .qa-report-table tbody tr.tbl-row--failed .col-sticky-0,
        .qa-report-table tbody tr.tbl-row--timedOut .col-sticky-0,
        .qa-report-table tbody tr.tbl-row--interrupted .col-sticky-0 {
          background: var(--row-bg-failed);
        }
        .qa-report-table tbody tr.tbl-row--skipped .col-sticky-0 {
          background: var(--row-bg-skipped);
        }

        /* Pin toggles from Filter columns menu */
        html[data-sticky-header="off"] .qa-report-table th {
          position: static;
          top: auto;
          z-index: auto;
        }
        html[data-sticky-left="off"] .qa-report-table .col-sticky-0 {
          position: static;
          left: auto;
          z-index: auto;
          box-shadow: none;
        }

        /* Kill leftover sticky-1/2 completely */
        .qa-report-table .col-sticky-1,
        .qa-report-table .col-sticky-2 {
          position: static !important;
          left: auto !important;
          box-shadow: none !important;
        }

        /* Body text columns: multi-line wrap, full content, never ellipsis-truncate */
                .steps-flat,
                .input-flat,
                .tbl-description .tbl-title,
                .tbl-expected,
                .tbl-actual .actual-result--passed,
                .tbl-actual .actual-result--failed {
                  display: block;
                  white-space: normal;
                  overflow: visible;
                  text-overflow: clip;
                  max-width: 100%;
                  max-height: none;
                  word-break: break-word;
                  overflow-wrap: anywhere;
                  font-size: 12px;
                  line-height: 1.45;
                  -webkit-line-clamp: unset;
                }

                .steps-flat__item,
                .input-flat__pair {
                  display: block;
                  margin: 0 0 4px;
                  padding: 0;
                  line-height: 1.45;
                  word-break: break-word;
                  overflow-wrap: anywhere;
                }

                .steps-flat__item:last-child,
                .input-flat__pair:last-child {
                  margin-bottom: 0;
                }

                .steps-flat__n {
                  color: var(--muted);
                  font-weight: 600;
                  font-variant-numeric: tabular-nums;
                  margin-right: 4px;
                }

                .input-flat .key {
                  color: var(--accent);
                  font-weight: 600;
                }

                .input-flat .val {
                  color: var(--text);
                }

                .tbl-description .tbl-title,
                .tbl-expected {
                  display: block;
                  white-space: normal;
                  overflow: visible;
                  text-overflow: clip;
                  max-width: 100%;
                  word-break: break-word;
                  overflow-wrap: anywhere;
                  line-height: 1.4;
                }

                .tbl-actual {
                  overflow: visible;
                }

                .tbl-actual .actual-result--passed,
                                .tbl-actual .actual-result--failed {
                                  display: block;
                                  white-space: normal;
                                  overflow: visible;
                                  text-overflow: clip;
                                  max-height: none;
                                  word-break: break-word;
                                  overflow-wrap: anywhere;
                                  line-height: 1.4;
                                }

                        .tbl-actual .actual-result--passed {
                          color: var(--passed);
                          font-weight: 500;
                        }

                        .tbl-actual .actual-result--failed {
                                                  color: var(--failed);
                                                  font-weight: 600;
                                                  background: transparent;
                                                }

                                /* Notes cell — stacked rows: time, screenshot, video, trace, badges */
                .notes-cell {
                          display: flex;
                          flex-direction: column;
                          flex-wrap: nowrap;
                          align-items: flex-start;
                          justify-content: flex-start;
                          gap: 6px;
                          overflow: visible;
                          min-width: 0;
                          text-align: left;
                          width: 100%;
                        }

                        .qa-report-table .tbl-notes,
                        .qa-report-table th[data-col="notes"] {
                          text-align: left;
                        }

                        .notes-row {
                          display: flex;
                          flex-wrap: wrap;
                          align-items: center;
                          justify-content: flex-start;
                          gap: 4px;
                          min-width: 0;
                        }

                        .notes-row--scenario {
                          gap: 0;
                        }

                        .notes-scenario {
                          display: inline-block;
                          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
                          font-size: 0.7rem;
                          color: var(--muted-strong, var(--muted));
                          background: var(--surface-muted);
                          padding: 1px 6px;
                          border-radius: 4px;
                          border: 1px solid var(--border);
                          max-width: 100%;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: nowrap;
                        }

                .status-pill,
                .priority-badge {
                  white-space: nowrap;
                }

        /* Never hide table columns via media query — use horizontal scroll instead */
        .qa-report-table .col-secondary,
        .qa-report-table .col-tertiary {
          display: table-cell !important;
        }

        .qa-report-table td {
          vertical-align: top;
          overflow: visible;
        }

        .actual-result--passed { color: var(--passed); font-weight: 500; background: transparent; }
        .actual-result--failed { color: var(--failed); font-weight: 600; background: transparent; }

    .panel {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          box-shadow: var(--shadow);
          min-width: 0;
          overflow: visible;
          max-height: none;
        }

    .panel--chart {
      padding-bottom: 12px;
      overflow: visible;
    }

    .chart-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 100%;
      height: 220px;
      overflow: visible;
    }

    .chart-wrap canvas {
      max-width: 100%;
      max-height: 220px;
    }

    .summary-list {
      margin: 0;
      overflow: visible;
    }

    .run-details {
              margin-top: 18px;
              border: 1px solid var(--border);
              border-radius: var(--radius-sm);
              background: var(--surface);
              overflow: visible;
            }

            /* Unified Operate card: evidence inventory + related links (Opsi A refined) */
                        /* Default collapsed; expand summary for drill-down */
                        .artifacts-card {
                          margin-top: 18px;
                          border: 1px solid var(--border);
                          border-radius: var(--radius);
                          background: var(--surface);
                          box-shadow: var(--shadow);
                          overflow: hidden;
                        }

                        .artifacts-card__summary {
                                      display: flex;
                                      align-items: center;
                                      justify-content: space-between;
                                      gap: 12px 16px;
                                      /* Extra right padding so chevron is not flush against the card edge */
                                      padding: 12px 20px 12px 14px;
                                      cursor: pointer;
                                      list-style: none;
                                      user-select: none;
                                    }

                        .artifacts-card__summary::-webkit-details-marker {
                          display: none;
                        }

                        .artifacts-card__summary:hover {
                          background: color-mix(in srgb, var(--accent-soft) 28%, var(--surface));
                        }

                        .artifacts-card[open] .artifacts-card__summary {
                          border-bottom: 1px solid var(--border);
                        }

                        .artifacts-card__titles {
                          display: flex;
                          flex-direction: column;
                          gap: 2px;
                          min-width: 0;
                        }

                        .artifacts-card__eyebrow {
                          display: block;
                          font-size: 0.68rem;
                          font-weight: 700;
                          letter-spacing: 0.08em;
                          text-transform: uppercase;
                          color: var(--accent);
                        }

                        .artifacts-card__title {
                          margin: 0;
                          font-size: 1rem;
                          font-weight: 800;
                          letter-spacing: -0.02em;
                          color: var(--text);
                          line-height: 1.25;
                        }

                        .artifacts-card__readiness {
                          margin: 0;
                          font-size: 0.78rem;
                          color: var(--muted);
                          font-weight: 500;
                        }

                        .artifacts-card__chevron {
                                      flex: 0 0 auto;
                                      width: 10px;
                                      height: 10px;
                                      border-right: 2px solid var(--muted);
                                      border-bottom: 2px solid var(--muted);
                                      transform: rotate(45deg);
                                      margin-top: -4px;
                                      margin-right: 4px;
                                      transition: transform 0.15s ease;
                                    }

                        .artifacts-card[open] .artifacts-card__chevron {
                          transform: rotate(225deg);
                          margin-top: 4px;
                        }

                        .artifacts-card__body {
                          display: flex;
                          flex-direction: column;
                          gap: 14px;
                          padding: 14px 16px 16px;
                        }

                        .artifacts-card__hint {
                          margin: 0;
                          font-size: 0.74rem;
                          color: var(--muted);
                          line-height: 1.4;
                        }

                        .artifacts-card__hint code {
                          font-size: 0.72rem;
                          color: var(--accent-strong);
                        }

                        .artifacts-card__grid {
                          display: grid;
                          grid-template-columns: repeat(4, minmax(0, 1fr));
                          gap: 10px;
                          align-items: stretch;
                        }

                        .artifacts-bucket {
                          display: flex;
                          flex-direction: column;
                          gap: 8px;
                          min-width: 0;
                          max-height: 220px;
                          padding: 12px;
                          border-radius: 10px;
                          border: 1px solid var(--border);
                          background: linear-gradient(180deg, var(--surface-muted) 0%, var(--surface) 72%);
                        }

                        .artifacts-bucket--empty {
                          opacity: 0.72;
                          max-height: none;
                          min-height: 0;
                        }

                        .artifacts-bucket__head {
                          display: flex;
                          align-items: baseline;
                          justify-content: space-between;
                          gap: 8px;
                          flex: 0 0 auto;
                        }

                        .artifacts-bucket__label {
                          font-size: 0.68rem;
                          font-weight: 700;
                          letter-spacing: 0.06em;
                          text-transform: uppercase;
                          color: var(--muted);
                        }

                        .artifacts-bucket__count {
                          font-size: 1.35rem;
                          font-weight: 800;
                          color: var(--text);
                          line-height: 1;
                          font-variant-numeric: tabular-nums;
                        }

                        .artifacts-bucket--traces .artifacts-bucket__count { color: var(--info); }
                        .artifacts-bucket--screenshots .artifacts-bucket__count { color: var(--accent-strong); }
                        .artifacts-bucket--videos .artifacts-bucket__count { color: #0f766e; }
                        .artifacts-bucket--retries .artifacts-bucket__count { color: var(--skipped); }

                        .artifacts-card__files {
                          list-style: none;
                          margin: 0;
                          padding: 0;
                          display: flex;
                          flex-direction: column;
                          gap: 6px;
                          flex: 1 1 auto;
                          min-height: 0;
                          max-height: 148px;
                          overflow-y: auto;
                          overscroll-behavior: contain;
                        }

                        .artifacts-card__file {
                          display: flex;
                          flex-direction: column;
                          gap: 2px;
                          padding: 8px 9px;
                          border-radius: 8px;
                          border: 1px solid transparent;
                          background: var(--surface);
                          text-decoration: none;
                          color: inherit;
                          min-width: 0;
                          transition: border-color 0.12s ease, background 0.12s ease;
                        }

                        a.artifacts-card__file:hover {
                          border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
                          background: color-mix(in srgb, var(--accent-soft) 55%, var(--surface));
                        }

                        .artifacts-card__file--static {
                          cursor: default;
                        }

                        .artifacts-card__file-name {
                          font-size: 0.78rem;
                          font-weight: 700;
                          color: var(--text);
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                        }

                        .artifacts-card__file-sub {
                          font-size: 0.7rem;
                          color: var(--muted);
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                        }

                        .artifacts-card__empty {
                          margin: 0;
                          font-size: 0.74rem;
                          color: var(--muted);
                          line-height: 1.35;
                        }

                        .artifacts-card__more {
                          margin: 0;
                          font-size: 0.7rem;
                          font-weight: 600;
                          color: var(--accent-strong);
                          line-height: 1.3;
                        }

                        .artifacts-card__links {
                          display: grid;
                          grid-template-columns: auto repeat(3, minmax(0, 1fr));
                          gap: 8px;
                          align-items: stretch;
                          margin-top: 4px;
                          padding-top: 16px;
                          border-top: 1px solid var(--border);
                        }

                        .artifacts-card__links-label {
                          align-self: center;
                          font-size: 0.66rem;
                          font-weight: 700;
                          letter-spacing: 0.08em;
                          text-transform: uppercase;
                          color: var(--muted);
                          padding: 0 4px;
                        }

                        .artifacts-link {
                          display: flex;
                          flex-direction: column;
                          gap: 2px;
                          min-width: 0;
                          padding: 10px 12px;
                          border-radius: 8px;
                          border: 1px solid var(--border);
                          background: var(--surface-muted);
                          text-decoration: none;
                          color: inherit;
                          transition: border-color 0.12s ease, background 0.12s ease;
                        }

                        .artifacts-link:hover {
                          border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
                          background: color-mix(in srgb, var(--accent-soft) 40%, var(--surface));
                        }

                        .artifacts-link__title {
                          font-size: 0.8rem;
                          font-weight: 700;
                          color: var(--text);
                        }

                        .artifacts-link__path {
                          font-size: 0.7rem;
                          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
                          color: var(--accent-strong);
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                        }

                        @media (max-width: 960px) {
                          .artifacts-card__grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                          }

                          .artifacts-card__links {
                            grid-template-columns: 1fr 1fr;
                          }

                          .artifacts-card__links-label {
                            grid-column: 1 / -1;
                          }
                        }

                        @media (max-width: 560px) {
                          .artifacts-card__grid {
                            grid-template-columns: 1fr;
                          }

                          .artifacts-card__links {
                            grid-template-columns: 1fr;
                          }

                          .artifacts-bucket {
                            max-height: none;
                          }
                        }

                        /* legacy run-details shell (unused after Opsi A) kept for safety */
                        .artifacts-strip {
                          margin-top: 18px;
                          display: flex;
                          flex-direction: column;
                          gap: 12px;
                        }

                        .run-details__grid {
                          display: grid;
                          grid-template-columns: repeat(4, minmax(0, 1fr));
                          gap: 12px;
                          padding: 0 14px 14px;
                          overflow: visible;
                          align-items: stretch;
                        }

        .run-details .info-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          background: var(--surface);
        }

        .run-details .info-panel .panel,
        .run-details .panel,
        .run-details .panel--rail {
          overflow: visible !important;
          max-height: none !important;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .run-details .panel--chart .chart-wrap {
          flex: 1 1 auto;
          min-height: 180px;
          height: auto;
          max-height: none;
        }

        .run-details .summary-list,
        .run-details .legend-list {
          flex: 1 1 auto;
        }

        .run-details .panel--rail .deep-links {
          flex: 1 1 auto;
        }

        .run-details .panel--rail .deep-links__hint {
          margin-top: auto;
          padding-top: 8px;
        }

        @media (max-width: 1100px) {
          .run-details__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .run-details__grid {
            grid-template-columns: 1fr;
          }
        }

    /* Table density is fixed dense — no Comfortable/Dense picker */
        .qa-report-table td,
        .qa-report-table th {
          padding: 5px 8px;
          font-size: 12px;
        }

        .steps-flat,
        .input-flat,
        .tbl-description .tbl-title,
        .tbl-expected,
        .tbl-expected__text,
        .tbl-actual .actual-result--passed,
        .tbl-actual .actual-result--failed {
          white-space: normal;
          display: block;
          overflow: visible;
          text-overflow: clip;
          -webkit-line-clamp: unset;
          max-height: none;
          line-height: 1.35;
          font-size: 12px;
        }

        /* Role section header — cream/caramel (sync with pink SaaS shell, not teal) */
            .role-section {
              margin-bottom: 20px;
              max-width: 100%;
              overflow: hidden;
            }

            .role-section-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 16px;
              background: linear-gradient(90deg, var(--accent-soft), rgba(243, 228, 212, 0.35));
              border: 1px solid var(--border-strong);
              border-bottom: 0;
              border-radius: var(--radius-sm) var(--radius-sm) 0 0;
              color: var(--accent-strong);
              font-weight: 700;
              font-size: 13px;
              letter-spacing: 0.06em;
            }

            html[data-theme="dark"] .role-section-header {
              background: linear-gradient(90deg, rgba(212, 165, 116, 0.18), rgba(212, 165, 116, 0.06));
              border-color: rgba(212, 165, 116, 0.28);
              color: var(--accent-strong);
            }

            .role-section-count {
              font-size: 11px;
              font-weight: 600;
              opacity: 0.75;
              color: var(--muted);
              text-transform: none;
              letter-spacing: 0;
            }

    .role-section .table-wrapper {
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      border-top: 0;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Priority badges */
    .priority-badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .priority-badge--high {
      background: #f5d0a9;
      color: #8a4b1a;
      border-color: rgba(180, 120, 70, 0.22);
    }

    .priority-badge--medium {
      background: #f8e8c8;
      color: #9a6b1f;
      border-color: rgba(196, 138, 43, 0.22);
    }

    .priority-badge--low {
      background: var(--passed-bg);
      color: var(--passed);
      border-color: rgba(61, 139, 85, 0.18);
    }

    html[data-theme="dark"] .priority-badge--high { color: #f0d0a8; background: rgba(212,165,116,0.18); }
    html[data-theme="dark"] .priority-badge--medium { color: #f0c674; background: rgba(196,138,43,0.16); }
    html[data-theme="dark"] .priority-badge--low { color: #7dcea0; background: rgba(125,206,160,0.12); }

    /* Layer badges */
    .layer-badge {
      display: inline-flex;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 1px;
      white-space: nowrap;
    }

    .layer-badge--fe  { background: var(--info-bg); color: #1d4ed8; }
    .layer-badge--be  { background: #f3e8ff; color: #6b21a8; }
    .layer-badge--db  { background: #fef9c3; color: #713f12; }
    .layer-badge--api { background: #dcfce7; color: #14532d; }

    html[data-theme="dark"] .layer-badge--fe  { background: rgba(59,130,246,0.18); color: #93c5fd; }
    html[data-theme="dark"] .layer-badge--be  { background: rgba(168,85,247,0.18); color: #d8b4fe; }
    html[data-theme="dark"] .layer-badge--db  { background: rgba(234,179,8,0.16);  color: #fde047; }
    html[data-theme="dark"] .layer-badge--api { background: rgba(34,197,94,0.16);  color: #86efac; }

    /* Module / Feature chips (table cells) */
    .module-chip {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
      background: var(--accent, #c4956a);
      color: #fff;
      white-space: nowrap;
      text-transform: lowercase;
    }
    .feature-chip {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.2px;
      background: var(--surface-muted, #e8e0d6);
      color: var(--text, #333);
      border: 1px solid var(--border, #d0c8bc);
      white-space: nowrap;
      text-transform: lowercase;
    }
    html[data-theme='dark'] .module-chip {
      background: var(--accent, #c4956a);
      color: #fff;
    }
    html[data-theme='dark'] .feature-chip {
      background: var(--surface-muted);
      color: var(--text);
      border-color: var(--border);
    }

    /* Actual result coloring */
    .actual-result--passed { color: var(--passed); font-weight: 500; background: transparent !important; }
        .actual-result--failed { color: var(--failed); font-weight: 600; background: transparent !important; }

        .tbl-actual .actual-result--passed,
        .tbl-actual .actual-result--failed {
          background: transparent !important;
        }

        .tbl-row--failed .tbl-actual,
        .tbl-row--timedOut .tbl-actual,
        .tbl-row--interrupted .tbl-actual {
          background: var(--row-bg-failed);
        }

    /* Notes cell — stacked rows: time, screenshot, video, trace, badges */
            .notes-cell {
              display: flex;
              flex-direction: column;
              flex-wrap: nowrap;
              align-items: flex-start;
              justify-content: flex-start;
              gap: 6px;
              min-width: 100px;
              text-align: left;
              width: 100%;
            }

            .notes-row {
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              justify-content: flex-start;
              gap: 4px;
              width: 100%;
            }

    .notes-row--meta {
      gap: 6px;
    }

    .notes-row--evidence {
      gap: 4px;
    }

    .duration {
      font-size: 11px;
      color: var(--muted);
      font-weight: 600;
      white-space: nowrap;
    }

    .evidence-link {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      text-decoration: none;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      color: var(--text);
      white-space: nowrap;
      transition: background 0.12s;
    }

    .evidence-link:hover {
      background: var(--bg-accent);
    }

    .evidence-thumbs {
      display: inline-flex;
      gap: 4px;
    }

    .evidence-thumb {
      display: inline-flex;
    }

    .evidence-thumb img {
      width: 28px;
      height: 20px;
      object-fit: cover;
      border-radius: 3px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: transform 0.12s;
    }

    .evidence-thumb img:hover {
      transform: scale(1.08);
    }

    .evidence-more {
      font-size: 10px;
      color: var(--muted);
      font-weight: 600;
    }

    .evidence-video {
      position: relative;
      display: inline-block;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .evidence-video video {
      display: block;
      width: 120px;
      height: 68px;
      object-fit: cover;
    }

    .evidence-video__overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.3);
      color: #fff;
      font-size: 18px;
      font-weight: 700;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .evidence-video:hover .evidence-video__overlay {
      opacity: 1;
    }

    /* Input data key-value */
    .input-kv { font-size: 12px; line-height: 1.7; }
    .input-kv .key { color: var(--accent); font-weight: 600; }

    /* Steps list (legacy class kept for accordion if any) */
        .steps-list {
          margin: 0;
          padding-left: 16px;
          font-size: 12px;
          line-height: 1.5;
          list-style: disc;
        }

        .steps-list li {
          margin: 0;
        }

    /* Test ID column */
    .tbl-test-id code {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      white-space: nowrap;
    }

    html[data-theme="dark"] .tbl-test-id code { color: var(--accent); }

    /* Title — no truncation */
    .tbl-title {
      cursor: default;
      display: block;
      word-break: break-word;
      line-height: 1.45;
      font-weight: 500;
    }

    /* ---- Command bar (full-width sticky operate strip) ---- */
    .command-bar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      margin: 0 0 12px;
      background: color-mix(in srgb, var(--bg) 90%, transparent);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }

    .cmd-search-wrap {
      position: relative;
      flex: 1 1 240px;
      min-width: 200px;
      max-width: 440px;
      display: block;
    }

    .cmd-search__icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--muted);
      pointer-events: none;
    }

    .cmd-search__icon svg { width: 16px; height: 16px; display: block; }

    .cmd-search {
      width: 100%;
      height: 38px;
      padding: 0 12px 0 36px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 0.86rem;
    }

    .cmd-search:focus {
      outline: none;
      border-color: var(--border-strong);
      box-shadow: 0 0 0 3px rgba(196, 149, 106, 0.18);
    }

    .cmd-select, .sort-select {
          height: 38px;
          /* Extra right padding so native chevron is not flush against the edge */
          padding: 0 34px 0 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background-color: var(--surface);
          color: var(--text);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 12px 12px;
        }

        .cmd-select:focus, .sort-select:focus {
          outline: none;
          border-color: var(--border-strong);
          box-shadow: 0 0 0 3px rgba(196, 149, 106, 0.18);
        }

        .cmd-check {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--muted);
          user-select: none;
          white-space: nowrap;
        }

        .command-bar__right {
          margin-left: auto;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .filter-count {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--muted);
          white-space: nowrap;
          margin-left: auto;
        }

    .role-health {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 12px;
    }

    .role-health__chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      font-size: 0.78rem;
    }

    .role-health__chip--good { border-color: rgba(21,128,61,0.35); }
    .role-health__chip--warn { border-color: rgba(180,83,9,0.35); }
    .role-health__chip--bad { border-color: rgba(190,18,60,0.35); }
    .role-health__rate { color: var(--muted); font-variant-numeric: tabular-nums; }

    .section-head--toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .panel--bleed {
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
    }

    .report-layout, .main-column {
      width: 100%;
      max-width: none;
      display: block;
    }

    .run-details {
          margin-top: 18px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          overflow: visible;
        }

        .run-details__toggle {
          cursor: pointer;
          padding: 12px 14px;
          font-weight: 600;
          list-style: none;
        }

        .run-details__toggle::-webkit-details-marker { display: none; }

        .run-details__grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 0 14px 14px;
          align-items: stretch;
        }

        @media (max-width: 1100px) {
          .run-details__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .run-details__grid {
            grid-template-columns: 1fr;
          }
        }

    .failure-source {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          border: 1px solid transparent;
          background: var(--info-bg);
          color: var(--info);
        }

        .failure-source--app { color: var(--failed); background: var(--failed-bg); border-color: rgba(255,45,106,0.18); }
        .failure-source--test { color: var(--info); background: var(--info-bg); border-color: rgba(59,130,246,0.22); }
        .failure-source--env { color: var(--skipped); background: var(--skipped-bg); border-color: rgba(245,158,11,0.22); }
        .failure-source--requirement { color: #7c3aed; background: #f3e8ff; }
        .failure-source--ai_generation { color: #0f766e; background: #ccfbf1; }
        .failure-source--unknown { color: var(--muted); background: var(--surface-muted); }

        /* SOURCE column — self-explanatory stack, not bare pills only */
        .src-cell {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
          text-align: left;
          min-width: 0;
          max-width: 100%;
        }

        .src-cell__row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .src-cell__k {
          flex: 0 0 auto;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          min-width: 2.4rem;
        }

        .src-cell__blurb {
          margin: 0;
          padding: 0;
          font-size: 0.72rem;
          line-height: 1.35;
          font-weight: 500;
          color: var(--text);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .src-cell--empty {
          gap: 2px;
        }

        .src-empty-dash {
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1;
        }

        .src-empty-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--muted);
        }

        .src-empty-note {
          font-size: 0.68rem;
          color: var(--muted);
          line-height: 1.3;
          opacity: 0.9;
        }

        .decision-hint {
                  display: inline-flex;
                  align-items: center;
                  margin-left: 0;
                  font-size: 0.68rem;
                  color: var(--info);
                  font-weight: 700;
                  background: var(--info-bg);
                  border-radius: 999px;
                  padding: 2px 7px;
                  white-space: nowrap;
                  border: 1px solid color-mix(in srgb, var(--info) 22%, transparent);
                }

            .error-summary { display: flex; flex-direction: column; gap: 8px; }
    .error-details summary { cursor: pointer; font-size: 0.8rem; font-weight: 600; color: var(--accent-strong); }
    .error-block--summary { max-height: 4.5em; overflow: hidden; }

    .cell-expand summary { cursor: pointer; list-style: none; }
    .cell-expand__full {
      margin: 8px 0 0;
      white-space: pre-wrap;
      font-size: 0.75rem;
    }

    .fallback-bars { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .fallback-bars .bar {
      height: 10px;
      border-radius: 999px;
      background: var(--surface-muted);
      position: relative;
      overflow: hidden;
    }
    .fallback-bars .bar > span {
      display: block;
      height: 100%;
      width: var(--w, 0%);
      background: var(--accent);
    }
    .fallback-bars .bar--passed > span { background: var(--passed); }
    .fallback-bars .bar--failed > span { background: var(--failed); }
    .fallback-bars .bar--skipped > span { background: var(--skipped); }

    /* ── History tab ────────────────────────────────────────────────────── */
    .history-section { padding: 16px 0; }
    .history-empty { text-align: center; padding: 40px 0; color: var(--muted); font-size: 0.9rem; }
    .history-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .history-table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--border-strong); font-weight: 600; color: var(--muted); white-space: nowrap; }
    .history-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .history-table tr:hover td { background: var(--bg-accent); }
    .history-row { transition: background 0.15s; }
    .history-run-id { font-family: var(--mono, monospace); font-size: 0.78rem; }
    .history-date { white-space: nowrap; }
    .history-req { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .history-env { font-size: 0.78rem; text-transform: uppercase; }
    .history-rate { font-weight: 600; text-align: right; }
    .history-tests { text-align: center; }
    .history-status { text-align: center; }
    .history-actions { text-align: right; white-space: nowrap; }
    .history-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
    .history-trend { margin-top: 16px; padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border); }

    .rate-good { color: var(--passed); font-weight: 700; }
    .rate-warn { color: var(--skipped); font-weight: 700; }
    .rate-bad  { color: var(--failed); font-weight: 700; }

    .trend-sparkline { display: inline-block; vertical-align: middle; }
    .trend-sparkline polyline { fill: none; stroke: var(--accent); stroke-width: 1.8; stroke-linejoin: round; }
    .trend-sparkline circle { fill: var(--accent); }

    .btn-sm { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); font-size: 0.75rem; cursor: pointer; transition: all 0.15s; }
    .btn-compare {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--surface); color: var(--accent-strong); font-size: 0.75rem;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-compare:hover { background: var(--accent-soft); border-color: var(--accent); }

    .muted { color: var(--muted); }

    .comparison-section { margin-top: 24px; padding: 16px; background: var(--surface); border-radius: 10px; border: 1px solid var(--border); }
    .comparison-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
    .comparison-header h3 { font-size: 0.9rem; margin: 0; color: var(--accent-strong); }
    .comparison-stats { display: flex; gap: 16px; font-size: 0.78rem; color: var(--muted); }
    .comparison-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
    .comparison-table th { text-align: left; padding: 6px 10px; border-bottom: 2px solid var(--border-strong); font-weight: 600; color: var(--muted); }
    .comparison-table td { padding: 6px 10px; border-bottom: 1px solid var(--border); }
    .diff-row { transition: background 0.15s; }
    .diff-row:hover td { background: var(--bg-accent); }
    .diff-regressed { color: var(--failed); font-weight: 600; }
    .diff-fixed { color: var(--passed); font-weight: 600; }
    .diff-stable { color: var(--muted); }
    .diff-flaky { color: var(--skipped); font-weight: 600; }
    .diff-new { color: var(--info); font-weight: 600; }
    .diff-removed { color: var(--muted); font-style: italic; }

    /* ── Save banner (top-level, always visible) ─────────────────────── */
    .save-banner-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 20px; margin-bottom: 0;
      background: linear-gradient(90deg, rgba(196,149,106,0.15) 0%, rgba(196,149,106,0.05) 100%);
      border-bottom: 2px solid var(--accent, #c4956a);
      font-size: 0.9rem; position: sticky; top: 0; z-index: 100;
    }
    .save-banner-top__content { display: flex; align-items: center; gap: 8px; }
    .save-banner-top__icon { font-size: 1.1rem; }
    .save-banner-top__text { font-weight: 500; color: var(--fg); }
    .save-banner-top__actions { display: flex; align-items: center; gap: 8px; }
    .btn-save-primary {
      padding: 8px 20px; background: var(--accent, #c4956a); color: #fff;
      border: none; border-radius: 6px; cursor: pointer; font-weight: 700;
      font-size: 0.9rem; letter-spacing: 0.02em; transition: opacity 0.15s;
    }
    .btn-save-primary:hover { opacity: 0.85; }
    .btn-dismiss-sm {
      padding: 4px 8px; background: transparent;
      border: 1px solid var(--border); border-radius: 4px;
      cursor: pointer; color: var(--muted); font-size: 0.8rem;
    }
    .btn-dismiss-sm:hover { background: var(--bg-accent); color: var(--fg); }

    /* ── Save banner (in-History tab, legacy) ────────────────────────── */
    .save-banner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; margin-bottom: 12px;
      background: var(--bg-accent); border: 1px solid var(--accent, #c4956a);
      border-radius: 6px; font-size: 0.9rem;
    }
    .save-banner__actions { display: flex; gap: 8px; }

    /* ── Save modal ──────────────────────────────────────────────────── */
    .save-modal { position: fixed; inset: 0; z-index: 1400; display: flex; align-items: center; justify-content: center; }
    .save-modal__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
    .save-modal__content { position: relative; background: var(--bg); border-radius: 8px; padding: 24px; min-width: 400px; max-width: 500px; z-index: 1; }
    .save-modal__content h3 { margin-top: 0; }
    .save-modal__form { display: flex; flex-direction: column; gap: 12px; }
    .save-modal__form label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; font-weight: 600; }
    .save-modal__form select, .save-modal__form textarea {
      padding: 8px; border: 1px solid var(--border); border-radius: 4px;
      background: var(--bg); color: var(--fg); font-size: 0.85rem;
    }
    .save-modal__form textarea { resize: vertical; }
    .save-modal__actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-save-confirm { padding: 8px 16px; background: var(--accent, #c4956a); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-save-confirm:hover { opacity: 0.9; }
    .btn-cancel { padding: 8px 16px; background: transparent; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; }
    .required { color: var(--failed); }

    /* ── Archive detail ──────────────────────────────────────────────── */
    .archive-detail { padding: 16px 0; }
    .archive-detail__header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .archive-detail__header h3 { margin: 0; }
    .btn-back { padding: 6px 12px; background: transparent; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-back:hover { background: var(--bg-accent); }
    .archive-detail__meta { padding: 12px; background: var(--bg-accent); border-radius: 6px; margin-bottom: 12px; font-size: 0.85rem; line-height: 1.6; }
    .archive-detail__summary { margin-bottom: 12px; }
    .archive-detail__breakdown { margin-bottom: 12px; }
    .archive-detail__cases { margin-bottom: 12px; }

    /* ── Decision badges ─────────────────────────────────────────────── */
    .decision-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .decision-approve { background: #d4edda; color: #155724; }
    .decision-file-bug { background: #f8d7da; color: #721c24; }
    .decision-revise-requirement { background: #fff3cd; color: #856404; }
    .decision-fix-test { background: #cce5ff; color: #004085; }
    .decision-fix-env { background: #e2e3e5; color: #383d41; }
    .decision-mark-blocked { background: #d6d8db; color: #1b1e21; }

    /* ── Action buttons ──────────────────────────────────────────────── */
    .btn-view { background: transparent; border: 1px solid var(--accent, #c4956a); color: var(--accent, #c4956a); }
    .btn-view:hover { background: var(--accent, #c4956a); color: #fff; }
    .btn-delete { background: transparent; border: 1px solid var(--failed); color: var(--failed); opacity: 0.6; }
    .btn-delete:hover { opacity: 1; background: var(--failed); color: #fff; }
    .btn-save { background: var(--accent, #c4956a); color: #fff; border: none; }
    .btn-save:hover { opacity: 0.9; }
    .btn-dismiss { background: transparent; border: 1px solid var(--border); }
    .btn-dismiss:hover { background: var(--bg-accent); }

    /* ── History table update ────────────────────────────────────────── */
    .history-decision { text-align: center; }
    .history-notes { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .history-row { cursor: pointer; }
    .history-row:hover td { background: var(--bg-accent); }
  `;
}

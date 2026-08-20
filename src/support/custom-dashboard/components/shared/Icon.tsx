/** @jsxImportSource @kitajs/html */
export type IconName =
  | 'doc'
  | 'layers'
  | 'calendar'
  | 'clock'
  | 'heart'
  | 'list'
  | 'check'
  | 'x'
  | 'skip'
  | 'chart'
  | 'pin'
  | 'search'
  | 'warn'
  | 'download'
  | 'table'
  | 'sun'
  | 'moon';

export interface IconProps {
  name: IconName;
  class?: string;
}

const COMMON_SVG_ATTRS = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.8',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const;

export function Icon({ name, class: className }: IconProps) {
  const cls = className ? ` ${className}` : '';

  switch (name) {
    case 'doc':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-doc${cls}`}>
          <path
            {...COMMON_SVG_ATTRS}
            d="M7 3.5h7.5L19 8v12.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"
          />
          <path {...COMMON_SVG_ATTRS} d="M14 3.5V8h5" />
          <path {...COMMON_SVG_ATTRS} d="M9 13h6M9 16.5h4" />
        </svg>
      );
    case 'layers':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-layers${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="m12 3 9 5-9 5-9-5 9-5z" />
          <path {...COMMON_SVG_ATTRS} d="m3 12 9 5 9-5" />
          <path {...COMMON_SVG_ATTRS} d="m3 16 9 5 9-5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-calendar${cls}`}>
          <rect {...COMMON_SVG_ATTRS} x="3" y="5" width="18" height="16" rx="2" />
          <path {...COMMON_SVG_ATTRS} d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-clock${cls}`}>
          <circle {...COMMON_SVG_ATTRS} cx="12" cy="12" r="9" />
          <path {...COMMON_SVG_ATTRS} d="M12 7v5l3 2" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-heart${cls}`}>
          <path
            {...COMMON_SVG_ATTRS}
            d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z"
          />
        </svg>
      );
    case 'list':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-list${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-check${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="m6 12 4 4 8-8" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-x${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M7 7l10 10M17 7 7 17" />
        </svg>
      );
    case 'skip':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-skip${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M6 7v10l7-5-7-5zM15 7v10" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-chart${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M12 3a9 9 0 1 0 9 9h-9V3z" />
          <path {...COMMON_SVG_ATTRS} d="M13.5 3.5A8.5 8.5 0 0 1 20.5 10.5H13.5V3.5z" />
        </svg>
      );
    case 'pin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-pin${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
          <circle {...COMMON_SVG_ATTRS} cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-search${cls}`}>
          <circle {...COMMON_SVG_ATTRS} cx="11" cy="11" r="7" />
          <path {...COMMON_SVG_ATTRS} d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'warn':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-warn${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M12 3 2 20h20L12 3z" />
          <path {...COMMON_SVG_ATTRS} d="M12 10v4M12 17h.01" />
        </svg>
      );
    case 'download':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-download${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M12 4v11M7 11l5 5 5-5M5 20h14" />
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-table${cls}`}>
          <rect {...COMMON_SVG_ATTRS} x="3" y="4" width="18" height="16" rx="2" />
          <path {...COMMON_SVG_ATTRS} d="M3 10h18M3 15h18M9 10v10M15 10v10" />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-sun${cls}`}>
          <circle {...COMMON_SVG_ATTRS} cx="12" cy="12" r="4" />
          <path
            {...COMMON_SVG_ATTRS}
            d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M5 19l1.5-1.5"
          />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" class={`icon-moon${cls}`}>
          <path {...COMMON_SVG_ATTRS} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    default:
      return null;
  }
}

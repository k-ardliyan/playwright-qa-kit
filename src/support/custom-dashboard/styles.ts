import { getDashboardStyles as loadStyles } from './renderer/render-assets';

/**
 * Themable CSS for generated custom-dashboard.html (light + dark via data-theme).
 * Delegates to extracted CSS files via render-assets.ts.
 */
export function getDashboardStyles(): string {
  return loadStyles();
}

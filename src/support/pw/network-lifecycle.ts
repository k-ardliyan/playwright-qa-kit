import type { Page, Route } from '@playwright/test';

type RouteHandler = (route: Route) => Promise<void> | void;

const activeRoutesRegistry = new WeakMap<
  Page,
  Set<{ url: string | RegExp; handler: RouteHandler }>
>();

/**
 * Register an active route pattern + handler for a page to track mock lifecycle.
 */
export function trackActiveRoute(page: Page, url: string | RegExp, handler: RouteHandler): void {
  let routes = activeRoutesRegistry.get(page);
  if (!routes) {
    routes = new Set();
    activeRoutesRegistry.set(page, routes);
  }
  routes.add({ url, handler });
}

/**
 * Untrack an active route pattern + handler.
 */
export function untrackActiveRoute(page: Page, url: string | RegExp, handler: RouteHandler): void {
  const routes = activeRoutesRegistry.get(page);
  if (routes) {
    for (const entry of routes) {
      if (entry.url === url && entry.handler === handler) {
        routes.delete(entry);
      }
    }
  }
}

/**
 * Execute an action with a temporary network route, guaranteeing unroute cleanup in finally.
 */
export async function withTemporaryRoute<T>(
  page: Page,
  url: string | RegExp,
  handler: RouteHandler,
  action: () => Promise<T>,
): Promise<T> {
  await page.route(url, handler);
  trackActiveRoute(page, url, handler);
  try {
    return await action();
  } finally {
    try {
      await page.unroute(url, handler);
    } catch {
      // Ignore cleanup error if page already closed
    }
    untrackActiveRoute(page, url, handler);
  }
}

/**
 * Cleanup any leftover active routes on a page.
 */
export async function cleanupActiveRoutes(page: Page): Promise<string[]> {
  const routes = activeRoutesRegistry.get(page);
  if (!routes || routes.size === 0) return [];

  const cleaned: string[] = [];
  for (const entry of Array.from(routes)) {
    try {
      await page.unroute(entry.url, entry.handler);
      cleaned.push(typeof entry.url === 'string' ? entry.url : entry.url.source);
    } catch {
      // Ignore if unroute fails
    }
  }
  routes.clear();
  return cleaned;
}

/**
 * Execute an action with simulated offline mode, guaranteeing online restoration in finally.
 */
export async function withOfflineMode<T>(page: Page, action: () => Promise<T>): Promise<T> {
  const context = page.context();
  await context.setOffline(true);
  try {
    return await action();
  } finally {
    try {
      await context.setOffline(false);
    } catch {
      // Ignore if context closed
    }
  }
}

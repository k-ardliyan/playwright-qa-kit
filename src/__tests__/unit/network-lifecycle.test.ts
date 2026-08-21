import { test, expect, type Page, type Route } from '@playwright/test';
import {
  withTemporaryRoute,
  cleanupActiveRoutes,
  withOfflineMode,
  trackActiveRoute,
} from '../../support/pw/network-lifecycle';

test.describe('Network Lifecycle & Offline Workflows (MCP-051, MCP-052)', () => {
  test('withTemporaryRoute sets up route and cleans up after execution', async () => {
    let routeCalled = false;
    let unrouteCalled = false;

    const mockPage = {
      route: async (_url: string | RegExp, _handler: (r: Route) => unknown) => {
        routeCalled = true;
      },
      unroute: async (_url: string | RegExp, _handler?: (r: Route) => unknown) => {
        unrouteCalled = true;
      },
    } as unknown as Page;

    const result = await withTemporaryRoute(
      mockPage,
      '**/api/users',
      async (route) => {
        await route.fulfill({ status: 500 });
      },
      async () => {
        expect(routeCalled).toBe(true);
        return 'executed';
      },
    );

    expect(result).toBe('executed');
    expect(unrouteCalled).toBe(true);
  });

  test('withTemporaryRoute cleans up route even if action throws error', async () => {
    let unrouteCalled = false;

    const mockPage = {
      route: async () => {},
      unroute: async () => {
        unrouteCalled = true;
      },
    } as unknown as Page;

    await expect(
      withTemporaryRoute(
        mockPage,
        '**/api/users',
        () => {},
        async () => {
          throw new Error('Action failed');
        },
      ),
    ).rejects.toThrow('Action failed');

    expect(unrouteCalled).toBe(true);
  });

  test('cleanupActiveRoutes cleans up tracked routes', async () => {
    const unrouted: string[] = [];
    const mockPage = {
      unroute: async (url: string | RegExp) => {
        unrouted.push(typeof url === 'string' ? url : url.source);
      },
    } as unknown as Page;

    trackActiveRoute(mockPage, '**/api/v1/resource', () => {});
    trackActiveRoute(mockPage, '**/api/v2/items', () => {});

    const cleaned = await cleanupActiveRoutes(mockPage);
    expect(cleaned).toContain('**/api/v1/resource');
    expect(cleaned).toContain('**/api/v2/items');
    expect(unrouted.length).toBe(2);
  });

  test('withOfflineMode sets offline true then restores offline false', async () => {
    const offlineStates: boolean[] = [];

    const mockPage = {
      context: () => ({
        setOffline: async (offline: boolean) => {
          offlineStates.push(offline);
        },
      }),
    } as unknown as Page;

    const res = await withOfflineMode(mockPage, async () => {
      expect(offlineStates).toEqual([true]);
      return 'offline-checked';
    });

    expect(res).toBe('offline-checked');
    expect(offlineStates).toEqual([true, false]);
  });
});

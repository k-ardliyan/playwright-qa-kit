/**
 * API helpers — official `APIRequestContext` / `request` fixture wrappers for hybrid tests.
 *
 * Use in `@hybrid` scenarios: seed via API, assert UI, cleanup via API.
 *
 * @see https://playwright.dev/docs/api-testing
 */

import type { APIRequestContext, APIResponse } from '@playwright/test';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiJsonResult<T = unknown> {
  status: number;
  ok: boolean;
  body: T;
  response: APIResponse;
}

export async function apiJson<T = unknown>(
  request: APIRequestContext,
  method: HttpMethod,
  url: string,
  options?: {
    data?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean>;
    failOnStatusCode?: boolean;
  },
): Promise<ApiJsonResult<T>> {
  const response = await request.fetch(url, {
    method,
    data: options?.data,
    headers: options?.headers,
    params: options?.params,
    failOnStatusCode: options?.failOnStatusCode ?? false,
  });

  const contentType = response.headers()['content-type'] ?? '';
  let body: T;
  if (contentType.includes('application/json')) {
    body = (await response.json().catch(() => ({}))) as T;
  } else {
    const text = await response.text().catch(() => '');
    body = text ? ({ raw: text } as unknown as T) : ({} as T);
  }

  return {
    status: response.status(),
    ok: response.ok(),
    body,
    response,
  };
}

/** Convenience POST JSON seed. */
export async function apiSeed<T = unknown>(
  request: APIRequestContext,
  url: string,
  data: unknown,
  headers?: Record<string, string>,
): Promise<ApiJsonResult<T>> {
  return apiJson<T>(request, 'POST', url, { data, headers });
}

/** Convenience DELETE cleanup. */
export async function apiCleanup(
  request: APIRequestContext,
  url: string,
  headers?: Record<string, string>,
): Promise<ApiJsonResult> {
  return apiJson(request, 'DELETE', url, { headers });
}

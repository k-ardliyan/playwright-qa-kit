/**
 * Playwright network observe/assert helpers — thin wrappers around official APIs.
 *
 * Prefer these in `(@network-assert)` scenarios (live payload + response checks).
 * For mock/failure paths keep using `(@network)` + network-mock helpers.
 *
 * Reliability tip: if events seem missing (Service Worker / MSW), set:
 *   test.use({ serviceWorkers: 'block' });
 * @see https://playwright.dev/docs/network
 */

import * as fs from 'node:fs';
import type { Page, Request, Response, TestInfo } from '@playwright/test';
import {
  assertNetworkContractHit,
  matchNetworkHit,
  redactHit,
  type NetworkContractFile,
  type NetworkHit,
  type NetworkMatchSpec,
} from './network-assert-core';

export interface WaitForApiMatch {
  method?: string | string[];
  urlIncludes?: string;
  urlRegex?: RegExp | string;
  status?: number | number[];
  timeout?: number;
}

export interface WaitForApiResult {
  request: Request;
  response: Response;
  reqBody: unknown;
  resBody: unknown;
  hit: NetworkHit;
}

function methodsMatch(actual: string, expected?: string | string[]): boolean {
  if (!expected) return true;
  const list = Array.isArray(expected) ? expected : [expected];
  return list.map((m) => m.toUpperCase()).includes(actual.toUpperCase());
}

function statusMatch(actual: number, expected?: number | number[]): boolean {
  if (expected === undefined) return true;
  const list = Array.isArray(expected) ? expected : [expected];
  return list.includes(actual);
}

function urlMatch(url: string, m: WaitForApiMatch): boolean {
  if (m.urlIncludes && !url.includes(m.urlIncludes)) return false;
  if (m.urlRegex) {
    const re = typeof m.urlRegex === 'string' ? new RegExp(m.urlRegex) : m.urlRegex;
    if (!re.test(url)) return false;
  }
  // If neither url filter provided, match any URL (caller should usually filter).
  return true;
}

async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return request.postDataJSON();
  } catch {
    return request.postData();
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const ct = response.headers()['content-type'] ?? '';
  if (ct.includes('application/json')) {
    return response.json().catch(async () => response.text().catch(() => null));
  }
  return response.text().catch(() => null);
}

/**
 * Race-safe: registers waitForResponse BEFORE running action.
 * Prefer this over raw waitForResponse in generated tests.
 */
export async function waitForApi(
  page: Page,
  match: WaitForApiMatch,
  action: () => Promise<void>,
): Promise<WaitForApiResult> {
  if (!match.urlIncludes && !match.urlRegex) {
    throw new Error(
      'waitForApi: provide urlIncludes and/or urlRegex to avoid matching unrelated traffic',
    );
  }

  const responsePromise = page.waitForResponse(
    (res) => {
      const req = res.request();
      return (
        methodsMatch(req.method(), match.method) &&
        urlMatch(res.url(), match) &&
        statusMatch(res.status(), match.status)
      );
    },
    { timeout: match.timeout },
  );

  await action();
  const response = await responsePromise;
  const request = response.request();
  const reqBody = await readRequestBody(request);
  const resBody = await readResponseBody(response);

  const hit: NetworkHit = {
    method: request.method(),
    url: response.url(),
    status: response.status(),
    requestHeaders: request.headers(),
    responseHeaders: response.headers(),
    requestBody: reqBody,
    responseBody: resBody,
  };

  return { request, response, reqBody, resBody, hit };
}

export function assertNetworkMatch(hit: NetworkHit, spec: NetworkMatchSpec): void {
  const result = matchNetworkHit(hit, spec);
  if (!result.ok) {
    throw new Error(`assertNetworkMatch failed:\n- ${result.errors.join('\n- ')}`);
  }
}

export function assertNetworkContract(
  hit: NetworkHit,
  contract: NetworkContractFile | string,
  overlays?: Partial<NetworkMatchSpec>,
): void {
  assertNetworkContractHit(hit, contract, overlays);
}

export type WaitAndAssertSpec = WaitForApiMatch & {
  /** Inline partial match (preferred when Input Data lists keys). */
  assert?: NetworkMatchSpec;
  /** Optional committed contract path or object. */
  contract?: NetworkContractFile | string;
  /** Merged into contract match when contract is used. */
  contractOverlays?: Partial<NetworkMatchSpec>;
};

/**
 * One-shot: wait for API during action, then assert partial match and/or contract.
 * Prefer this in generated `@network-assert` tests when Input Data is complete.
 */
export async function waitAndAssertApi(
  page: Page,
  spec: WaitAndAssertSpec,
  action: () => Promise<void>,
): Promise<WaitForApiResult> {
  const { assert: assertSpec, contract, contractOverlays, ...match } = spec;
  if (!assertSpec && !contract) {
    throw new Error(
      'waitAndAssertApi: provide assert (inline NetworkMatchSpec) and/or contract path',
    );
  }

  const result = await waitForApi(page, match, action);

  if (assertSpec) {
    // Default method/url/status from wait match when assert omits them
    assertNetworkMatch(result.hit, {
      method: assertSpec.method ?? match.method,
      urlIncludes: assertSpec.urlIncludes ?? match.urlIncludes,
      urlRegex:
        assertSpec.urlRegex ??
        (typeof match.urlRegex === 'string' ? match.urlRegex : match.urlRegex?.source),
      status: assertSpec.status ?? match.status,
      request: assertSpec.request,
      response: assertSpec.response,
    });
  }

  if (contract) {
    assertNetworkContract(result.hit, contract, contractOverlays);
  }

  return result;
}

export interface RecorderOptions {
  urlIncludes?: string;
  urlRegex?: RegExp | string;
  methods?: string[];
  ignoreUrlRegexes?: (RegExp | string)[];
  maxHits?: number;
  maxBodyChars?: number;
}

export interface NetworkRecorder {
  stop: () => Promise<NetworkHit[]>;
  hits: () => NetworkHit[];
}

const DEFAULT_IGNORE: RegExp[] = [
  /\.(js|css|png|jpe?g|gif|svg|ico|woff2?|map|ttf|eot)(\?|$)/i,
  /google-analytics|googletagmanager|hotjar|sentry|facebook|doubleclick|segment\.io|clarity\.ms/i,
];

export function startNetworkRecorder(page: Page, options: RecorderOptions = {}): NetworkRecorder {
  const hits: NetworkHit[] = [];
  const max = options.maxHits ?? 50;
  const maxBodyChars = options.maxBodyChars ?? 64_000;
  const ignore = [
    ...DEFAULT_IGNORE,
    ...(options.ignoreUrlRegexes ?? []).map((r) => (typeof r === 'string' ? new RegExp(r) : r)),
  ];
  const pending = new Set<Promise<void>>();

  const onResponse = (response: Response): void => {
    const job = (async () => {
      try {
        if (hits.length >= max) return;
        const url = response.url();
        if (ignore.some((re) => re.test(url))) return;
        if (options.urlIncludes && !url.includes(options.urlIncludes)) return;
        if (options.urlRegex) {
          const re =
            typeof options.urlRegex === 'string' ? new RegExp(options.urlRegex) : options.urlRegex;
          if (!re.test(url)) return;
        }
        const req = response.request();
        if (
          options.methods &&
          !options.methods.map((m) => m.toUpperCase()).includes(req.method().toUpperCase())
        ) {
          return;
        }

        let reqBody = await readRequestBody(req);
        let resBody = await readResponseBody(response);
        if (typeof reqBody === 'string' && reqBody.length > maxBodyChars) {
          reqBody = `${reqBody.slice(0, maxBodyChars)}…[truncated]`;
        }
        if (typeof resBody === 'string' && resBody.length > maxBodyChars) {
          resBody = `${resBody.slice(0, maxBodyChars)}…[truncated]`;
        }

        const hit = redactHit({
          method: req.method(),
          url,
          status: response.status(),
          requestHeaders: req.headers(),
          responseHeaders: response.headers(),
          requestBody: reqBody,
          responseBody: resBody,
        });
        hits.push(hit);
      } catch {
        /* best-effort collector — never fail the test from the listener */
      }
    })();
    pending.add(job);
    void job.finally(() => pending.delete(job));
  };

  page.on('response', onResponse);

  return {
    hits: () => [...hits],
    stop: async () => {
      page.off('response', onResponse);
      // Drain in-flight body reads so hits are complete before returning.
      await Promise.allSettled([...pending]);
      return [...hits];
    },
  };
}

export async function attachNetworkCapture(
  testInfo: Pick<TestInfo, 'attach' | 'outputPath'>,
  hits: NetworkHit[],
  name = 'network-capture.json',
): Promise<string> {
  const redacted = hits.map((h) => redactHit(h));
  const payload = {
    capturedAt: new Date().toISOString(),
    hitCount: redacted.length,
    hits: redacted,
  };
  const body = JSON.stringify(payload, null, 2);
  const out = testInfo.outputPath(name);
  fs.mkdirSync(pathDirname(out), { recursive: true });
  fs.writeFileSync(out, body, 'utf-8');
  await testInfo.attach(name, { body, contentType: 'application/json' });
  return out;
}

function pathDirname(filePath: string): string {
  const idx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return idx >= 0 ? filePath.slice(0, idx) : '.';
}

/**
 * Optional HAR replay/record (Phase 5 light).
 * Default update when UPDATE_HAR=1.
 */
export async function useHar(
  page: Page,
  harPath: string,
  options?: {
    url?: string | RegExp;
    update?: boolean;
    notFound?: 'abort' | 'fallback';
  },
): Promise<void> {
  await page.routeFromHAR(harPath, {
    url: options?.url ?? '**/api/**',
    update: options?.update ?? process.env.UPDATE_HAR === '1',
    notFound: options?.notFound ?? 'abort',
  });
}

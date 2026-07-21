import { test, expect } from '@/fixtures/base.fixture';
import { setTestMetadata, captureActualResult } from '@/support/test-metadata';
import {
  mockJson,
  unmockAll,
  expectAllVisible,
  expectSoftFieldErrors,
  expectAriaSnapshot,
} from '@/support/pw';

/**
 * Demo: official Playwright power features used by the framework helpers.
 * Self-contained (page.setContent + page.route) — no external app dependency.
 *
 * Note: about:blank + relative fetch('/api/…') is unreliable. Use absolute
 * mock origin (https://pw-power.local/…) so route globs always match.
 */
const MOCK_ORIGIN = 'https://pw-power.local';

test.describe('Playwright Power Features', { tag: ['@demo', '@pw-power'] }, () => {
  test('network mock + soft asserts + ARIA snapshot', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-PW-POWER-01',
      priority: 'HIGH',
      affectedLayer: ['FE', 'API'],
      expectedResult:
        'Mocked API returns ok; soft asserts pass; ARIA snapshot matches fixture tree',
      inputData: { fixture: 'setContent', api: `${MOCK_ORIGIN}/api/demo` },
    });

    await test.step('Register network mock', async () => {
      await mockJson(page, '**/api/demo', { ok: true, source: 'mock' }, 200);
    });

    await test.step('Load isolated HTML fixture', async () => {
      await page.setContent(`<!DOCTYPE html>
<html lang="en">
  <body>
    <main>
      <h1>Demo Power</h1>
      <button type="button" id="load">Load</button>
      <button type="button" id="secondary">Secondary</button>
      <p id="status" role="status">idle</p>
      <div id="errors" hidden>
        <span class="err-email">Email is required</span>
        <span class="err-password">Password is required</span>
      </div>
    </main>
    <script>
      document.getElementById('load').addEventListener('click', async () => {
        const res = await fetch('${MOCK_ORIGIN}/api/demo');
        const data = await res.json();
        document.getElementById('status').textContent = data.ok ? 'ok:' + data.source : 'fail';
      });
    </script>
  </body>
</html>`);
    });

    await test.step('Soft-assert key controls are visible', async () => {
      await expectAllVisible([
        page.getByRole('heading', { name: 'Demo Power' }),
        page.getByRole('button', { name: 'Load' }),
        page.getByRole('button', { name: 'Secondary' }),
      ]);
    });

    await test.step('Trigger mocked API and assert UI', async () => {
      await page.getByRole('button', { name: 'Load' }).click();
      await expect(page.getByRole('status')).toHaveText('ok:mock');
    });

    await test.step('ARIA snapshot on main landmark', async () => {
      await expectAriaSnapshot(
        page.getByRole('main'),
        `
          - main:
            - heading "Demo Power" [level=1]
            - button "Load"
            - button "Secondary"
            - status: ok:mock
        `,
      );
    });

    await test.step('Soft multi-field error pattern (visible messages)', async () => {
      await page.evaluate(() => {
        const el = document.getElementById('errors');
        if (el) el.hidden = false;
      });
      await expectSoftFieldErrors([
        { locator: page.locator('.err-email'), message: 'Email is required' },
        { locator: page.locator('.err-password'), message: 'Password is required' },
      ]);
    });

    await test.step('Cleanup routes', async () => {
      await unmockAll(page);
      captureActualResult('Mock API ok; soft asserts + ARIA snapshot confirmed');
    });
  });

  test('server error mock surfaces failure payload', async ({ page }) => {
    setTestMetadata({
      testId: 'TC-PW-POWER-02',
      priority: 'MEDIUM',
      affectedLayer: ['FE', 'API'],
      expectedResult: 'Mocked 500 response is reflected in status text',
      inputData: { status: '500', api: `${MOCK_ORIGIN}/api/fail` },
    });

    await test.step('Mock 500 and load fixture', async () => {
      await mockJson(page, '**/api/fail', { error: 'boom' }, 500);
      await page.setContent(`<!DOCTYPE html>
<html><body>
  <button id="go">Go</button>
  <pre id="out"></pre>
  <script>
    document.getElementById('go').onclick = async () => {
      try {
        const r = await fetch('${MOCK_ORIGIN}/api/fail');
        document.getElementById('out').textContent = r.status + ':' + await r.text();
      } catch (e) {
        document.getElementById('out').textContent = 'err:' + e;
      }
    };
  </script>
</body></html>`);
    });

    await test.step('Assert error payload', async () => {
      await page.locator('#go').click();
      await expect(page.locator('#out')).toContainText('500');
      await expect(page.locator('#out')).toContainText('boom');
      captureActualResult('500 boom payload rendered from mock');
    });

    await unmockAll(page);
  });
});

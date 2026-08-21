import { test, expect } from '@playwright/test';
import { type CatalogIndex } from '../../../tools/mcp/src/tools/_internal/snapshot-core';
import { SELECTOR_CATALOG_SCHEMA_V1, computeSourceHash } from '@/contracts';

test.describe('Selector Catalog Evolution (Phase 7)', () => {
  test('CatalogIndex has schemaVersion qa.selector-catalog/v1 and deterministic hash', () => {
    const ariaYaml = `
- button "Submit"
- textbox "Username"
    `.trim();

    const hash = computeSourceHash(ariaYaml);

    const catalog: CatalogIndex = {
      schemaVersion: SELECTOR_CATALOG_SCHEMA_V1,
      featureName: 'auth',
      pageName: 'login-form',
      url: 'https://example.com/login',
      hash,
      catalogHash: hash,
      capturedAt: new Date().toISOString(),
      truncated: false,
      elementCount: 2,
      elements: [
        {
          role: 'button',
          name: 'Submit',
          primary: "page.getByRole('button', { name: 'Submit', exact: true })",
          candidates: [
            {
              source: 'role',
              expression: "page.getByRole('button', { name: 'Submit', exact: true })",
            },
          ],
          fragile: false,
        },
        {
          role: 'textbox',
          name: 'Username',
          primary: "page.getByLabel('Username')",
          candidates: [
            {
              source: 'label',
              expression: "page.getByLabel('Username')",
            },
          ],
          fragile: false,
        },
      ],
    };

    expect(catalog.schemaVersion).toBe('qa.selector-catalog/v1');
    expect(catalog.catalogHash).toBe(hash);
    expect(catalog.elements.length).toBe(2);
    expect(catalog.elements[0].fragile).toBe(false);
  });
});

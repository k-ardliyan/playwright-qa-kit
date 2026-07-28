import { test, expect } from '@playwright/test';
import {
  toCsv,
  toTsv,
  toConfluenceMarkup,
  toConfluenceHtml,
} from '../../support/custom-dashboard/export-helpers';
import type { CollectedTestData } from '../../support/custom-dashboard/types';

function sample(partial: Partial<CollectedTestData> = {}): CollectedTestData {
  return {
    title: 'sample test',
    fullTitle: 'Suite > sample test',
    filePath: 'src/tests/sample.spec.ts',
    status: 'failed',
    duration: 1200,
    errorMessage: 'TimeoutError: locator.click',
    errors: [{ message: 'TimeoutError: locator.click' }],
    steps: [
      { title: 'open checkout', status: 'passed', duration: 200, steps: [] },
      { title: 'click pay', status: 'failed', duration: 1000, steps: [] },
    ],
    attachments: [],
    retry: 0,
    testId: 'TC-SAMP-01',
    scenarioId: 'SC-01',
    role: 'finance',
    module: 'general',
    feature: 'general',
    priority: 'high',
    inputData: { user: 'a', amount: '100' },
    expectedResult: 'ok',
    actualResult: 'failed\nTimeoutError',
    affectedLayer: ['FE'],
    failureSource: 'test',
    ...partial,
  };
}

test.describe('dashboard export SOURCE column', () => {
  test('toCsv includes SOURCE header and value', () => {
    const csv = toCsv([sample()], 'general');
    expect(csv).toMatch(/"SOURCE"/);
    expect(csv).toMatch(/"TEST"/);
    const header = csv.split(/\r?\n/)[0] ?? '';
    expect(header.split(',').length).toBe(12);
  });

  test('toTsv role-aware includes ROLE and SOURCE', () => {
    const tsv = toTsv([sample()], 'role-aware');
    const header = tsv.split('\n')[0] ?? '';
    expect(header).toContain('ROLE');
    expect(header).toContain('SOURCE');
    expect(tsv).toContain('FINANCE');
    expect(tsv).toContain('TEST');
  });

  test('passed rows export empty source as dash', () => {
    const csv = toCsv(
      [
        sample({
          status: 'passed',
          failureSource: undefined,
          actualResult: 'ok',
          errorMessage: '',
          errors: [],
          steps: [{ title: 'single step', status: 'passed', duration: 100, steps: [] }],
          inputData: { user: 'a' },
        }),
      ],
      'general',
    );
    // Full CSV body (quoted fields may contain newlines — do not assert on line[1] alone)
    expect(csv).toMatch(/"PASSED"/);
    expect(csv).toMatch(/"SOURCE"/);
    // SOURCE column value for empty failureSource is "-" (priority remains HIGH from sample)
    expect(csv).toMatch(/"PASSED","HIGH","-"/);
  });
});

test.describe('dashboard Confluence export paste quality', () => {
  test('toConfluenceMarkup uses wiki table headers and flattens newlines', () => {
    const wiki = toConfluenceMarkup([sample()], 'general');
    expect(wiki).toContain('h3. QA Report export');
    expect(wiki).toMatch(/\|\| TEST ID \|\|/);
    expect(wiki).toMatch(/\| TC-SAMP-01 \|/);
    const dataRows = wiki.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('||'));
    expect(dataRows.length).toBe(1);
    expect(dataRows[0]).not.toMatch(/\n/);
    expect(wiki).toContain('✗ FAILED');
    expect(wiki).toContain('SC-01');
  });

  test('toConfluenceHtml is rich table with Atlassian-like styles', () => {
    const html = toConfluenceHtml([sample()], 'general');
    expect(html).toContain('<table');
    expect(html).toContain('QA Report');
    expect(html).toContain('#f4f5f7');
    expect(html).toContain('#dfe1e6');
    expect(html).toContain('#ffebe6');
    expect(html).toContain('TC-SAMP-01');
    expect(html).toContain('<br>');
    expect(html).toContain('border-collapse:collapse');
  });

  test('toConfluenceHtml role-aware keeps ROLE rowspan cream band', () => {
    const html = toConfluenceHtml(
      [
        sample({ role: 'finance', testId: 'TC-A' }),
        sample({ role: 'finance', testId: 'TC-B', title: 'second finance' }),
        sample({ role: 'admin', testId: 'TC-C', title: 'admin case' }),
      ],
      'role-aware',
    );
    expect(html).toContain('rowspan="2"'); // finance group
    expect(html).toContain('FINANCE');
    expect(html).toContain('ADMIN');
    // Bold, no background fill on the ROLE cell — Atlassian default
    const roleCellMatch = html.match(/<td[^>]*rowspan="\d+"[^>]*style="([^"]+)">FINANCE</);
    expect(roleCellMatch).not.toBeNull();
    expect(roleCellMatch![1]).toMatch(/font-weight:700/);
    expect(roleCellMatch![1]).not.toMatch(/background:/);
    // ROLE cell only once per group (rowspan), not repeated thrice as plain cells only
    const financeCells = (html.match(/>FINANCE</g) || []).length;
    expect(financeCells).toBe(1);
  });

  test('toTsv flattens multi-line cells for spreadsheet paste', () => {
    const tsv = toTsv([sample()], 'general');
    const lines = tsv.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain(' | ');
    expect(lines[1]).toContain('SC-01');
  });
});

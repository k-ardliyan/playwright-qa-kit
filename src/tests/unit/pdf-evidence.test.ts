import { test, expect } from '@playwright/test';
import type { PdfEvidence } from '../../shared/mcp/pdf-evidence';

/**
 * MCP-082 / MCP-083 guard: keeps the rendered-page vs downloaded-file PDF
 * discriminant stable and documents the two distinct evidence kinds.
 */
test.describe('PDF evidence types (MCP-082/083)', () => {
  test('distinguishes browser-rendered page PDF from downloaded file inspection', () => {
    const rendered: PdfEvidence = {
      kind: 'browser-rendered-page',
      url: 'https://app.test/invoices/1',
      pdfPath: 'test-results/mcp/run/report.pdf',
      pageCount: 2,
      fileSizeBytes: 1234,
      timestamp: '2026-08-20T00:00:00Z',
    };
    const downloaded: PdfEvidence = {
      kind: 'downloaded-file',
      fileName: 'invoice.pdf',
      filePath: 'test-fixtures/artifacts/invoice.pdf',
      extractedTextExcerpt: 'Total: $100',
      matchedTokens: ['Total'],
      timestamp: '2026-08-20T00:00:00Z',
    };

    const label = (e: PdfEvidence): string =>
      e.kind === 'browser-rendered-page' ? e.url : e.fileName;
    expect(label(rendered)).toBe('https://app.test/invoices/1');
    expect(label(downloaded)).toBe('invoice.pdf');
  });

  test('rendered PDF evidence carries mandatory location metadata', () => {
    const e: PdfEvidence = {
      kind: 'browser-rendered-page',
      url: 'https://app.test/report',
      pdfPath: 'test-results/mcp/run/report.pdf',
      timestamp: '2026-08-20T00:00:00Z',
    };
    expect(e.kind).toBe('browser-rendered-page');
    expect(e.pdfPath).toBeTruthy();
    expect(e.timestamp).toBeTruthy();
  });
});

export interface RenderedPdfEvidence {
  kind: 'browser-rendered-page';
  url: string;
  pdfPath: string;
  pageCount?: number;
  fileSizeBytes?: number;
  timestamp: string;
}

export interface DownloadedPdfInspection {
  kind: 'downloaded-file';
  fileName: string;
  filePath: string;
  extractedTextExcerpt?: string;
  matchedTokens?: string[];
  timestamp: string;
}

export type PdfEvidence = RenderedPdfEvidence | DownloadedPdfInspection;

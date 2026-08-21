/**
 * AUTO-SYNCED from src/support/pw/file-content-core.ts — do not edit by hand.
 * Run: npm run sync:file-core  (also runs inside npm run mcp:build)
 */
export type FileKind = 'pdf' | 'xlsx' | 'zip' | 'png' | 'jpg' | 'gif' | 'csv' | 'txt' | 'unknown';
/** Resolve repository root. */
export declare function findRepoRoot(start?: string): string;
/** Absolute path under `tests/data/`. */
export declare function fixturePath(...parts: string[]): string;
/** Detect common file kinds from magic bytes (envelope layer). */
export declare function detectMagic(buffer: Buffer): FileKind;
/**
 * Prefer extension when magic is zip (xlsx) or ambiguous.
 */
export declare function detectFileKind(filePath: string, buffer?: Buffer): FileKind;
export interface InspectFileResult {
    filePath: string;
    filename: string;
    size: number;
    kind: FileKind;
    magic: FileKind;
}
export declare function inspectFileLocal(filePath: string): InspectFileResult;
/** Extract plain text from a PDF. Returns raw text for scenario-owned matching. */
export declare function extractPdfText(filePath: string, maxChars?: number): Promise<string>;
export interface ExcelSummary {
    sheetNames: string[];
    headers: string[];
    sampleRows: string[][];
}
/** Read sheet names, header row, and sample data rows (scenario defines expected headers). */
export declare function readExcelSummary(filePath: string, options?: {
    sheet?: string | number;
    maxRows?: number;
}): Promise<ExcelSummary>;
/**
 * Assert every needle appears in haystack. Needles are **caller-defined**
 * (from the scenario) — never a fixed product schema.
 */
export declare function assertStringsContain(haystack: string, needles: string[]): void;
/** Scenario-owned patterns: string substring or RegExp. */
export declare function assertTextMatches(haystack: string, patterns: Array<string | RegExp>): void;
export declare function assertPdfContains(filePath: string, needles: string[]): Promise<void>;
/** Like assertPdfContains but allows RegExp patterns from the scenario. */
export declare function assertPdfMatches(filePath: string, patterns: Array<string | RegExp>): Promise<void>;
export declare function assertExcelHeaders(filePath: string, headers: string[], sheet?: string | number): Promise<void>;
export declare function assertFileMagic(filePath: string, expected: FileKind | FileKind[]): void;
export declare function assertDownloadedEnvelope(filePath: string, expect: {
    kind?: FileKind;
    ext?: RegExp | string;
    minBytes?: number;
}): void;
//# sourceMappingURL=file-content-core.d.ts.map
export interface ArchiveReportInput {
    runId: string;
    reportPath: string;
    jsonReportPath?: string;
}
export interface ArchiveReportOutput {
    status: 'success' | 'error';
    archivePath?: string;
    archivedFiles?: string[];
    message: string;
}
/**
 * Archive a pipeline report (Markdown + optional JSON) to reports/archive/<runId>/.
 * Safe to call multiple times — overwrites if already exists.
 */
export declare function archiveReport(input: ArchiveReportInput): ArchiveReportOutput;
//# sourceMappingURL=archive-report.d.ts.map
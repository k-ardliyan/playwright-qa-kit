/**
 * MCP tool: `generate_page_object`.
 *
 * Read selector catalog JSON → generate TypeScript POM scaffold.
 * Never overwrites existing files unless force=true.
 */
import { type ToolError } from '../utils/safety';
export interface GeneratePageObjectArgs {
    featureName?: unknown;
    pageName?: unknown;
    className?: unknown;
    outputPath?: unknown;
    force?: unknown;
}
export interface GeneratePageObjectOutput {
    status: 'created' | 'skipped' | 'error';
    path?: string;
    elementCount?: number;
    fragileCount?: number;
    warnings?: string[];
    message: string;
    error?: ToolError;
}
export declare function generatePageObject(args: GeneratePageObjectArgs | undefined): Promise<GeneratePageObjectOutput>;
//# sourceMappingURL=generate-page-object.d.ts.map
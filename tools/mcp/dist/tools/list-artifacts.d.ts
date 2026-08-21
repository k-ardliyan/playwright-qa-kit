export interface ListArtifactsOutput {
    status: 'success' | 'error';
    requirements: string[];
    specs: string[];
    tests: string[];
    fixtures: string[];
    message: string;
}
export declare function listArtifacts(): ListArtifactsOutput;
//# sourceMappingURL=list-artifacts.d.ts.map
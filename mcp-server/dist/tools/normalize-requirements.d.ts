export interface AcceptanceCriterion {
  id: string;
  description: string;
}
export interface RequirementsContract {
  id: string;
  title: string;
  acceptanceCriteria: AcceptanceCriterion[];
  tags: string[];
}
export interface NormalizeRequirementsOutput {
  contract?: RequirementsContract;
  status: 'success' | 'error';
  error?: {
    code: string;
    message: string;
  };
}
export declare function normalizeRequirements(
  requirementsText: string,
): NormalizeRequirementsOutput;
//# sourceMappingURL=normalize-requirements.d.ts.map

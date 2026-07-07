/**
 * Shared Type Definitions — Agent AI Integration Layer
 *
 * Core types used across all integration layer modules:
 * protocol, state, hooks, orchestrator, manifest, and config generation.
 *
 * @module agents/integration/types
 */

/**
 * Pipeline execution phases in sequential order.
 */
export type PipelinePhase = 'plan' | 'generate' | 'execute' | 'heal' | 'report';

/**
 * Structured error returned by the protocol or pipeline phases.
 */
export interface ProtocolError {
  code: string;
  message: string;
  phase?: PipelinePhase;
  retryable: boolean;
}

/**
 * Result of a single pipeline phase execution.
 */
export interface PhaseResult {
  phase: PipelinePhase;
  status: 'success' | 'error';
  output?: unknown;
  artifacts?: string[];
  error?: ProtocolError;
}

/**
 * Descriptor for a supported orchestration mode.
 */
export interface OrchestrationModeDescriptor {
  mode: 'manual' | 'automatic';
  description: string;
}

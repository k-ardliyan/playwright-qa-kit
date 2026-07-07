/**
 * Pipeline State Manager
 *
 * Persists pipeline execution progress for resume capability.
 * State is stored as plain JSON in `reports/pipeline-state.json`.
 * Completed states are archived to `reports/archive/pipeline-state-<runId>.json`.
 *
 * @module agents/integration/state
 */

import * as fs from 'fs';
import * as path from 'path';
import { PipelinePhase, ProtocolError } from './types';

/**
 * Ordered sequence of pipeline phases for resume logic.
 */
const PHASE_SEQUENCE: PipelinePhase[] = ['plan', 'generate', 'execute', 'heal', 'report'];

/**
 * Default path for the active pipeline state file.
 */
const STATE_FILE_PATH = path.resolve('reports/pipeline-state.json');

/**
 * Default directory for archived pipeline state files.
 */
const ARCHIVE_DIR = path.resolve('reports/archive');

/**
 * Persistent state for a pipeline run.
 */
export interface PipelineState {
  runId: string; // UUID v4
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentPhase: PipelinePhase | null;
  completedPhases: PipelinePhase[];
  artifacts: Record<PipelinePhase, string[]>; // paths to intermediate files
  timestamp: string; // ISO 8601, last update
  startedAt: string; // ISO 8601
  requirementPath: string;
  orchestrationMode: 'manual' | 'automatic';
  errors: ProtocolError[];
}

/**
 * Save the pipeline state to `reports/pipeline-state.json`.
 *
 * Creates the `reports/` directory if it does not exist.
 * Updates the `timestamp` field to the current ISO 8601 string before writing.
 */
export function saveState(state: PipelineState): void {
  const dir = path.dirname(STATE_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  state.timestamp = new Date().toISOString();
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Load the pipeline state from `reports/pipeline-state.json`.
 *
 * Returns `null` if the state file does not exist.
 */
export function loadState(): PipelineState | null {
  if (!fs.existsSync(STATE_FILE_PATH)) {
    return null;
  }
  const content = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
  return JSON.parse(content) as PipelineState;
}

/**
 * Archive a pipeline state to `reports/archive/pipeline-state-<runId>.json`.
 *
 * Creates the `reports/archive/` directory if it does not exist.
 */
export function archiveState(state: PipelineState): void {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  const archivePath = path.join(ARCHIVE_DIR, `pipeline-state-${state.runId}.json`);
  fs.writeFileSync(archivePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Resume a pipeline run from the last completed phase.
 *
 * Logic:
 * 1. Load state from `reports/pipeline-state.json`
 * 2. If no state file exists, return an error
 * 3. Validate all artifact paths still exist on disk
 * 4. If artifacts are missing, invalidate the affected phase and all subsequent phases
 * 5. Determine resume point: first phase in sequence not in completedPhases
 * 6. Return the updated state and the phase to resume from
 */
export function resumeState():
  { state: PipelineState; resumePhase: PipelinePhase } | { error: string } {
  const state = loadState();

  if (!state) {
    return { error: 'No resumable pipeline run found.' };
  }

  // Validate artifact paths for each completed phase
  // Find the earliest phase with missing artifacts
  let earliestInvalidIndex = -1;

  for (let i = 0; i < PHASE_SEQUENCE.length; i++) {
    const phase = PHASE_SEQUENCE[i];
    if (!state.completedPhases.includes(phase)) {
      continue;
    }

    const phaseArtifacts = state.artifacts[phase] || [];
    const hasMissingArtifact = phaseArtifacts.some(
      (artifactPath) => !fs.existsSync(path.resolve(artifactPath)),
    );

    if (hasMissingArtifact) {
      if (earliestInvalidIndex === -1) {
        earliestInvalidIndex = i;
      }
    }
  }

  // If artifacts are missing, invalidate affected phase and all subsequent phases
  if (earliestInvalidIndex !== -1) {
    const phasesToInvalidate = PHASE_SEQUENCE.slice(earliestInvalidIndex);
    for (const phase of phasesToInvalidate) {
      state.completedPhases = state.completedPhases.filter((p) => p !== phase);
      state.artifacts[phase] = [];
    }
    // Persist the updated state
    saveState(state);
  }

  // Determine resume point: first phase not in completedPhases
  const resumePhase = PHASE_SEQUENCE.find((phase) => !state.completedPhases.includes(phase));

  // If all phases are complete (shouldn't normally happen on resume), default to 'plan'
  const targetPhase: PipelinePhase = resumePhase || 'plan';

  return { state, resumePhase: targetPhase };
}

/**
 * Mark a pipeline run as completed, save the state, and archive it.
 *
 * Sets `status` to `'completed'`, saves the state, then archives it.
 */
export function markCompleted(state: PipelineState): void {
  state.status = 'completed';
  saveState(state);
  archiveState(state);
}

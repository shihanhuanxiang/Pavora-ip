// PAVORA promptPipeline — debug snapshot (Stage B, plan §0.6 / §1).
// Reuses the existing PAVORA_DEBUG_PROMPT localStorage flag introduced by
// narrativeService's buildFinalVisualPromptV11 snapshot mechanism. Writes to
// a distinct key (PAVORA_LAST_PIPELINE_REPORTS) so it does not clobber the
// narrative-specific PAVORA_LAST_FINAL_PROMPT_DEBUG snapshot; both can be
// inspected side by side during manual GOLDEN_TEST_SET walkthroughs.

import type { PromptSanitizerReport } from '../shared/services/promptSanitizer';
import type { PipelineMode } from './mode';

export const PIPELINE_DEBUG_FLAG_KEY = 'PAVORA_DEBUG_PROMPT';
export const PIPELINE_DEBUG_SNAPSHOT_KEY = 'PAVORA_LAST_PIPELINE_REPORTS';
const PIPELINE_DEBUG_HISTORY_LIMIT = 20;

export interface PipelineDebugSnapshot {
  source: string;
  mode: PipelineMode;
  timestamp: string;
  rawLength: number;
  finalLength: number;
  blocked: boolean;
  report: PromptSanitizerReport;
  finalPrompt: string;
  rawPrompt: string;
}

const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    return window.localStorage.getItem(PIPELINE_DEBUG_FLAG_KEY) === '1';
  } catch {
    return false;
  }
};

// Appends the snapshot to a bounded rolling history so multiple modules'
// dry-run reports can be collected across a manual walkthrough session
// (plan §5: "各模組 dry-run report 連續無誤殺").
export const recordPipelineDebugSnapshot = (snapshot: PipelineDebugSnapshot): void => {
  if (!isDebugEnabled()) {
    return;
  }
  try {
    const existingRaw = window.localStorage.getItem(PIPELINE_DEBUG_SNAPSHOT_KEY);
    const existing: PipelineDebugSnapshot[] = existingRaw ? JSON.parse(existingRaw) : [];
    const next = [...existing, snapshot].slice(-PIPELINE_DEBUG_HISTORY_LIMIT);
    window.localStorage.setItem(PIPELINE_DEBUG_SNAPSHOT_KEY, JSON.stringify(next));
    console.info('[PAVORA_PIPELINE_DEBUG]', snapshot);
  } catch {
    // Best-effort only; never let debug snapshotting affect the pipeline result.
  }
};

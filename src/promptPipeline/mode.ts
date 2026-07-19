// PAVORA promptPipeline — global mode switch (Stage B, plan §5).
// Two-phase rollout: 'dryrun' (report only, never mutates output) -> 'enforce'
// (removes forbidden terms via existing promptSanitizer, still never hard-blocks
// generation per plan §6 item 10). Single source of truth so it can be flipped
// back instantly without touching call sites.

export type PipelineMode = 'dryrun' | 'enforce';

export const PIPELINE_MODE_STORAGE_KEY = 'PAVORA_PIPELINE_MODE';

// T11 (2026-07-19): global default flipped to 'enforce'. All production exits
// already ran enforce explicitly since Stage 1b; call sites now rely on this
// default. Dryrun remains available for tests/diagnostics via explicit option
// or localStorage override.
const DEFAULT_PIPELINE_MODE: PipelineMode = 'enforce';

const isValidMode = (value: unknown): value is PipelineMode => {
  return value === 'dryrun' || value === 'enforce';
};

export const getPipelineMode = (): PipelineMode => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PIPELINE_MODE;
  }
  try {
    const stored = window.localStorage.getItem(PIPELINE_MODE_STORAGE_KEY);
    return isValidMode(stored) ? stored : DEFAULT_PIPELINE_MODE;
  } catch {
    return DEFAULT_PIPELINE_MODE;
  }
};

export const setPipelineMode = (mode: PipelineMode): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(PIPELINE_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable (e.g. private mode quota) — silently no-op,
    // callers fall back to DEFAULT_PIPELINE_MODE via getPipelineMode().
  }
};

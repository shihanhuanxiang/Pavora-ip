// PAVORA domain: ipContent — usage recorder (Stage C, package C5).
// Purpose: replace the fake getImagenUsage()===0 stub with a real
// per-generation usage log, scoped (Plan A, minimal invasion) to the
// narrative "generate image" main line first (Hank's daily workflow).
// Full 13-engine coverage is an explicit follow-up package, not done here.
//
// Reuses the bounded-history localStorage pattern from
// src/promptPipeline/debug.ts: a single rolling-array key, best-effort
// try/catch on every write, silent no-op when localStorage/window is
// unavailable (SSR-safe). This module must NEVER throw into or otherwise
// affect the calling generation flow.
//
// Only metadata is stored — never image bytes/data URLs.

export const USAGE_LOG_KEY = 'PAVORA_USAGE_LOG';
const USAGE_LOG_HISTORY_LIMIT = 500;

export type UsageKind = 'image' | 'text';

export interface UsageLogEntry {
  module: string;
  kind: UsageKind;
  model_id?: string;
  scene_id?: string;
  ok: boolean;
  ts: number;
}

export interface UsageSummary {
  totalImages: number;
  totalTexts: number;
  failures: number;
  byModule: Record<string, number>;
}

const hasLocalStorage = (): boolean => {
  return typeof window !== 'undefined' && !!window.localStorage;
};

const readLog = (): UsageLogEntry[] => {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(USAGE_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Best-effort append to a bounded rolling history. Never throws — any
// failure (quota exceeded, JSON errors, missing localStorage) is swallowed
// so a usage-logging problem can never break image/text generation.
export const recordGeneration = (entry: {
  module: string;
  kind: UsageKind;
  model_id?: string;
  scene_id?: string;
  ok: boolean;
  ts?: number;
}): void => {
  try {
    if (!hasLocalStorage()) return;
    const existing = readLog();
    const next: UsageLogEntry = {
      module: entry.module,
      kind: entry.kind,
      model_id: entry.model_id,
      scene_id: entry.scene_id,
      ok: entry.ok,
      ts: entry.ts ?? Date.now(),
    };
    const updated = [...existing, next].slice(-USAGE_LOG_HISTORY_LIMIT);
    window.localStorage.setItem(USAGE_LOG_KEY, JSON.stringify(updated));
  } catch {
    // Best-effort only; never let usage logging affect the generation flow.
  }
};

// Stage E, package E3 — quota skeleton (no billing yet).
//
// Default daily image quota. Deliberately very high so Hank's normal daily
// usage NEVER hits it in practice; this is a skeleton for the future real
// quota/billing system, not a working limiter yet.
export const DEFAULT_DAILY_IMAGE_LIMIT = 500;

// Future hook (not implemented yet): once real plans/billing exist, a
// per-user limit lookup (e.g. fetch plan tier for userId and return its
// image quota) should be inserted here, falling back to
// DEFAULT_DAILY_IMAGE_LIMIT when no plan/userId is available. For now this
// always resolves to the constant.
const resolveDailyImageLimit = (_userId?: string): number => {
  // TODO(E4+/billing): look up plan-specific limit 
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
  // TODO(E4+/billing): look up plan-specific limit by userId here.
  return DEFAULT_DAILY_IMAGE_LIMIT;
};

// Counts image-generation entries whose timestamp falls on the caller's
// local calendar day (not UTC). We deliberately use local time because the
// limit is meant to match what the human user perceives as "today", and
// PAVORA is single-timezone/device-local for now (no server-side day
// boundary to reconcile with yet).
const countImagesToday = (log: UsageLogEntry[]): number => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let count = 0;
  for (const item of log) {
    if (item.kind === 'image' && item.ts >= startOfToday) count += 1;
  }
  return count;
};

// Quota check for the narrative image-generation main line. userId is
// accepted now purely as an interface reservation for the future
// mandatory-login world (Hank's decision) — it is not yet used to scope
// the log or the limit, since usage is still recorded per-device only.
//
// fail-open by design: this is a quota SKELETON stage, not real billing.
// Any failure (localStorage unavailable, JSON corruption, etc.) must never
// block Hank's actual image generation, so on error we return
// allowed: true. Once real metering/billing lands, this should flip to
// fail-closed.
export const checkQuota = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId?: string
): { allowed: boolean; remaining: number; limit: number } => {
  try {
    const limit = resolveDailyImageLimit(userId);
    const log = readLog();
    const usedToday = countImagesToday(log);
    const remaining = Math.max(0, limit - usedToday);
    return { allowed: usedToday < limit, remaining, limit };
  } catch {
    // Fail-open: never let a quota-check bug block generation at this stage.
    return { allowed: true, remaining: DEFAULT_DAILY_IMAGE_LIMIT, limit: DEFAULT_DAILY_IMAGE_LIMIT };
  }
};

// Aggregates the rolling log into summary counters. Also best-effort:
// on any failure returns a zeroed summary rather than throwing.
export const getUsageSummary = (): UsageSummary => {
  try {
    const log = readLog();
    const summary: UsageSummary = {
      totalImages: 0,
      totalTexts: 0,
      failures: 0,
      byModule: {},
    };
    for (const item of log) {
      if (item.kind === 'image') summary.totalImages += 1;
      else if (item.kind === 'text') summary.totalTexts += 1;
      if (!item.ok) summary.failures += 1;
      summary.byModule[item.module] = (summary.byModule[item.module] || 0) + 1;
    }
    return summary;
  } catch {
    return { totalImages: 0, totalTexts: 0, failures: 0, byModule: {} };
  }
};

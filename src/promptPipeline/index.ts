// PAVORA promptPipeline — Stage B unified sanitize gate (plan §1).
//
// Scope (see handoff_docs/PAVORA_B_PROMPT_PIPELINE_PLAN.md §1, §6):
// - This is the FIRST step only: a thin gate that routes every image-prompt
//   exit point through the existing promptSanitizer, with a dry-run/enforce
//   switch (plan §5). It does NOT rewrite detector logic, does NOT unify the
//   17 src/prompts/* builders, and does NOT auto-rewrite hardcoded subject /
//   Chinese / male-mismatch issues (report-only for those, per plan §6.5).
// - detector arrays (FORBIDDEN_FACIAL_MARK_TERMS / HARDCODED_SUBJECT_TERMS)
//   in promptSanitizer.ts are untouched; this module only imports them
//   indirectly via sanitizePromptText / validatePromptText.

import {
  sanitizePromptText,
  validatePromptText,
  type PromptSanitizerReport
} from '../shared/services/promptSanitizer';
import { getPipelineMode, type PipelineMode } from './mode';
import { recordPipelineDebugSnapshot } from './debug';

export type { PipelineMode } from './mode';
export { getPipelineMode, setPipelineMode } from './mode';

export interface PipelineOptions {
  /** Caller identity, e.g. 'hairSalon' / 'sceneGeneration'. Flows into debug snapshot / report. */
  source: string;
  /** Defaults to the global flag from getPipelineMode() when omitted. */
  mode?: PipelineMode;
  /**
   * When true, additionally flags woman/female/她 usage as a warning
   * (male subject mistakenly described as female). This is a call-time
   * option check, not a new detector array entry (plan §1, PITFALLS #10).
   */
  expectMale?: boolean;
  /**
   * Stage 1b: enforce mode now strips Chinese characters / CJK punctuation
   * (full-English final prompt rule). Display-layer ZH exits (e.g.
   * narrative:diaryVisualPromptZH) set keepChinese: true to retain ZH text
   * while still removing forbidden facial-mark terms. No effect in dryrun.
   */
  keepChinese?: boolean;
}

export interface PipelineResult {
  /** dryrun: original prompt, unchanged. enforce: prompt after forbidden-term removal. */
  prompt: string;
  /** Sanitizer report type, reused as-is from promptSanitizer. */
  report: PromptSanitizerReport;
  /** true only in enforce mode when the sanitized prompt is still not clean. */
  blocked: boolean;
  source: string;
}

const MALE_MISMATCH_PATTERN = /\b(woman|female)\b|她/i;

const appendMaleMismatchWarning = (report: PromptSanitizerReport, prompt: string): PromptSanitizerReport => {
  if (!MALE_MISMATCH_PATTERN.test(prompt)) {
    return report;
  }
  return {
    ...report,
    warnings: [...report.warnings, 'expectMale: prompt contains woman/female/她 wording for a male subject.']
  };
};

/**
 * Single entry point: every image-prompt exit point should call this
 * immediately before the prompt is handed to the image model.
 *
 * dryrun (default): validatePromptText only. Prompt is returned unchanged,
 *   blocked is always false. Report is recorded to the debug snapshot when
 *   PAVORA_DEBUG_PROMPT=1.
 * enforce: sanitizePromptText — removes forbidden facial-mark terms,
 *   strips Chinese characters / CJK punctuation (Stage 1b, unless
 *   keepChinese is set) and normalizes whitespace. blocked = !report.isClean
 *   afterward (hardcoded subject / male-mismatch remain report-only per plan
 *   §6.5 and §6.10 — callers may choose to act on `blocked`, this package
 *   does not hard-stop generation).
 */
export function runPromptPipeline(prompt: string, options: PipelineOptions): PipelineResult {
  const mode = options.mode ?? getPipelineMode();
  const source = options.source;

  let resultPrompt: string;
  let report: PromptSanitizerReport;
  let blocked: boolean;

  if (mode === 'enforce') {
    const sanitized = sanitizePromptText(prompt, { stripChinese: !options.keepChinese });
    resultPrompt = sanitized.prompt;
    report = sanitized.report;
    blocked = !report.isClean;
  } else {
    resultPrompt = prompt;
    report = validatePromptText(prompt);
    blocked = false;
  }

  if (options.expectMale) {
    report = appendMaleMismatchWarning(report, resultPrompt);
  }

  recordPipelineDebugSnapshot({
    source,
    mode,
    timestamp: new Date().toISOString(),
    rawLength: prompt.length,
    finalLength: resultPrompt.length,
    blocked,
    report,
    finalPrompt: resultPrompt,
    rawPrompt: prompt
  });

  return {
    prompt: resultPrompt,
    report,
    blocked,
    source
  };
}

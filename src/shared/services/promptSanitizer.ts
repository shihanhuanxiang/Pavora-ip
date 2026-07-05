export const FORBIDDEN_FACIAL_MARK_TERMS = [
  'dark facial spots',
  'dark facial spot',
  'beauty marks',
  'beauty mark',
  'birthmarks',
  'birthmark',
  'skin marks',
  'skin mark',
  'freckles',
  'freckle',
  'moles',
  'mole',
  '臉部淡斑',
  '微小淡斑',
  '小淡斑',
  '淡斑',
  '臉部斑點',
  '臉上斑點',
  '斑點',
  '臉部黑點',
  '臉上黑點',
  '黑點',
  '美人痣',
  '臉部痣',
  '臉上痣',
  '痣',
  '雀斑',
  '胎記',
  '皮膚標記',
  '臉部標記'
] as const;

// Stage 19B note:
// These terms are detector signatures for hardcoded subject residue.
// They must not be used as prompt generation sources.
// Do not remove them just to make project-wide grep return zero;
// sanitizer coverage must continue to catch legacy polluted prompts.
export const HARDCODED_SUBJECT_TERMS = [
  'Asian woman',
  'Asian man',
  'Asian girl',
  'Asian boy',
  'Korean woman',
  'Chinese woman',
  'Japanese woman'
] as const;

export interface PromptSanitizerReport {
  originalLength: number;
  sanitizedLength: number;
  removedTerms: string[];
  hasForbiddenFacialMarkTerms: boolean;
  hasHardcodedSubjectTerms: boolean;
  hasChineseCharacters: boolean;
  warnings: string[];
  isClean: boolean;
}

export interface PromptSanitizerResult {
  prompt: string;
  report: PromptSanitizerReport;
}

const CHINESE_CHARACTER_PATTERN = /[\u4e00-\u9fff]/;

// Stage 1b: enforce-mode Chinese stripping (full-English final prompt rule).
// Han characters plus CJK/fullwidth punctuation are removed so no ZH residue
// survives on the image-model path. Display-layer ZH prompts opt out via
// sanitize option { stripChinese: false } (pipeline option keepChinese).
// Fullwidth alphanumerics (\uff21\uff3a\uff10\uff19) are intentionally not stripped.
const CHINESE_STRIP_PATTERN = /[\u4e00-\u9fff]/g;
const CJK_PUNCTUATION_STRIP_PATTERN = /[\u3000-\u303f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]/g;

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const hasCjkCharacters = (value: string): boolean => {
  return /[\u4e00-\u9fff]/.test(value);
};

const buildTermPattern = (term: string): RegExp => {
  const escapedTerm = escapeRegExp(term).replace(/\s+/g, '\\s+');
  if (hasCjkCharacters(term)) {
    return new RegExp(escapedTerm, 'gi');
  }
  return new RegExp(`\\b${escapedTerm}\\b`, 'gi');
};

const unique = (values: string[]): string[] => {
  return Array.from(new Set(values));
};

const findTerms = (prompt: string, terms: readonly string[]): string[] => {
  const matches: string[] = [];
  for (const term of terms) {
    if (buildTermPattern(term).test(prompt)) {
      matches.push(term);
    }
  }
  return matches;
};

const normalizePromptSpacing = (prompt: string): string => {
  return prompt
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([,.;:]){2,}/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .trim();
};

const buildReport = (originalPrompt: string, currentPrompt: string, removedTerms: string[] = []): PromptSanitizerReport => {
  const forbiddenMatches = findTerms(currentPrompt, FORBIDDEN_FACIAL_MARK_TERMS);
  const hardcodedSubjectMatches = findTerms(currentPrompt, HARDCODED_SUBJECT_TERMS);
  const hasChineseCharacters = CHINESE_CHARACTER_PATTERN.test(currentPrompt);
  const warnings: string[] = [];

  if (forbiddenMatches.length > 0) {
    warnings.push(`Forbidden facial mark terms remain: ${forbiddenMatches.join(', ')}`);
  }

  if (hardcodedSubjectMatches.length > 0) {
    warnings.push(`Hardcoded subject terms remain: ${hardcodedSubjectMatches.join(', ')}`);
  }

  if (hasChineseCharacters) {
    warnings.push('Chinese characters remain in final prompt path.');
  }

  return {
    originalLength: originalPrompt.length,
    sanitizedLength: currentPrompt.length,
    removedTerms: unique(removedTerms),
    hasForbiddenFacialMarkTerms: forbiddenMatches.length > 0,
    hasHardcodedSubjectTerms: hardcodedSubjectMatches.length > 0,
    hasChineseCharacters,
    warnings,
    isClean: forbiddenMatches.length === 0 && hardcodedSubjectMatches.length === 0 && !hasChineseCharacters
  };
};

export const validatePromptText = (prompt: string): PromptSanitizerReport => {
  return buildReport(prompt, prompt);
};

export interface SanitizePromptOptions {
  /**
   * Default true: strip Chinese characters and CJK punctuation (Stage 1b,
   * full-English final prompt rule). Set false only for display-layer ZH
   * prompts that must keep Chinese while still removing forbidden terms.
   */
  stripChinese?: boolean;
}

export const sanitizePromptText = (prompt: string, options: SanitizePromptOptions = {}): PromptSanitizerResult => {
  const stripChinese = options.stripChinese !== false;
  let sanitizedPrompt = prompt;
  const removedTerms: string[] = [];

  const orderedTerms = Array.from(FORBIDDEN_FACIAL_MARK_TERMS).sort((a, b) => b.length - a.length);

  for (const term of orderedTerms) {
    const pattern = buildTermPattern(term);
    if (pattern.test(sanitizedPrompt)) {
      removedTerms.push(term);
      sanitizedPrompt = sanitizedPrompt.replace(pattern, '');
    }
  }

  if (stripChinese) {
    // Replace with a space (not empty string) so adjacent English tokens do
    // not get glued together; normalizePromptSpacing collapses the residue.
    sanitizedPrompt = sanitizedPrompt
      .replace(CHINESE_STRIP_PATTERN, ' ')
      .replace(CJK_PUNCTUATION_STRIP_PATTERN, ' ');
  }

  sanitizedPrompt = normalizePromptSpacing(sanitizedPrompt);

  return {
    prompt: sanitizedPrompt,
    report: buildReport(prompt, sanitizedPrompt, removedTerms)
  };
};

export const sanitizeFinalPrompt = sanitizePromptText;

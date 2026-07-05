// PAVORA promptPipeline — golden sanitizer verification (plan §4).
//
// Pure assert-based regression script, no test framework (plan §6.6 / tooling
// fact: no jest/vitest, only tsx is available). Run with:
//   npx tsx src/promptPipeline/verify/goldenSanitizer.ts
// Exits non-zero on any failure so it can be used as a manual/CI gate.
//
// Coverage (plan §4.1):
// - GOLDEN G01-style forbidden facial-mark term removal (enforce mode)
// - Full detector-term coverage: every FORBIDDEN_FACIAL_MARK_TERMS entry must
//   still be detected (guards against accidental detector regression, but
//   this script never modifies the detector arrays themselves — plan §6.3)
// - Hardcoded subject term detection (report-only, dry-run)
// - Chinese-character detection (full-English rule)
// - Male-mismatch warning (expectMale option)
// - Reverse false-positive guard: legitimate natural-skin-texture fixtures
//   must remain untouched and reported clean (plan §4.1, PITFALLS #3)
// - KNOWN-GAP fixtures (plan §4.2): bare "spot"/"patch"/"blemish" are NOT in
//   the detector array today. These fixtures assert CURRENT behavior
//   (undetected) and are explicitly labeled as a known gap, not silently
//   passed off as covered. Closing this gap is out of scope for this plan
//   (would require detector changes + a false-positive regression pass).
// - Equivalence check (plan §2 package 2): runPromptPipeline(enforce) output
//   must be byte-identical to the pre-existing sanitizeFinalPrompt(...).prompt
//   for the same input — proves the narrative integration changed nothing.

import { runPromptPipeline } from '../index';
import {
  sanitizeFinalPrompt,
  FORBIDDEN_FACIAL_MARK_TERMS,
  HARDCODED_SUBJECT_TERMS
} from '../../shared/services/promptSanitizer';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) {
    pass += 1;
  } else {
    fail += 1;
    failures.push(msg);
  }
}

// --- 1. Equivalence: runPromptPipeline(enforce) === sanitizeFinalPrompt (plan §2 pkg 2) ---
{
  const fixtures = [
    '[Subject]: a woman with a small mole near her left eye, freckles across cheeks',
    '[Subject]: Asian woman standing in a park, natural pore texture visible',
    '這是一段包含中文字元的 prompt，不應該出現在最終送模輸出',
    '[Subject]: clean prompt, no forbidden terms, subsurface scattering skin texture'
  ];
  for (const raw of fixtures) {
    const before = sanitizeFinalPrompt(raw);
    const after = runPromptPipeline(raw, { source: 'verify:equivalence', mode: 'enforce' });
    assert(
      after.prompt === before.prompt,
      `EQUIVALENCE mismatch for input "${raw.slice(0, 40)}...": pipeline="${after.prompt}" legacy="${before.prompt}"`
    );
    assert(
      after.report.isClean === before.report.isClean,
      `EQUIVALENCE report.isClean mismatch for "${raw.slice(0, 40)}..."`
    );
  }
}

// --- 2. G01-style: forbidden facial-mark terms removed under enforce ---
{
  const namedTerms = ['mole', 'freckle', 'beauty mark', 'birthmark', '痣', '淡斑', '黑點', '雀斑'];
  for (const term of namedTerms) {
    const raw = `[Subject]: a person with a ${term} on the cheek, cinematic lighting`;
    const result = runPromptPipeline(raw, { source: 'verify:g01', mode: 'enforce' });
    assert(
      !result.report.hasForbiddenFacialMarkTerms,
      `G01: hasForbiddenFacialMarkTerms should be false after enforce for term "${term}"`
    );
    assert(
      !result.prompt.toLowerCase().includes(term.toLowerCase()),
      `G01: sanitized prompt should no longer contain "${term}" but got: "${result.prompt}"`
    );
  }
}

// --- 3. Full detector coverage: every FORBIDDEN_FACIAL_MARK_TERMS entry is still detected ---
{
  for (const term of FORBIDDEN_FACIAL_MARK_TERMS) {
    const raw = `context prefix ${term} context suffix`;
    const result = runPromptPipeline(raw, { source: 'verify:detector-coverage', mode: 'dryrun' });
    assert(
      result.report.hasForbiddenFacialMarkTerms,
      `DETECTOR-COVERAGE: term "${term}" was not detected by hasForbiddenFacialMarkTerms (dry-run report)`
    );
  }
}

// --- 4. Hardcoded subject terms: report-only, dry-run must not mutate ---
{
  for (const term of HARDCODED_SUBJECT_TERMS) {
    const raw = `[Subject]: ${term} walking down a street, editorial fashion photography`;
    const result = runPromptPipeline(raw, { source: 'verify:hardcoded-subject', mode: 'dryrun' });
    assert(
      result.report.hasHardcodedSubjectTerms,
      `HARDCODED-SUBJECT: "${term}" should be flagged hasHardcodedSubjectTerms=true`
    );
    assert(
      result.prompt === raw,
      `HARDCODED-SUBJECT: dry-run must not mutate prompt for "${term}"`
    );
    assert(
      result.blocked === false,
      `HARDCODED-SUBJECT: dry-run blocked must always be false ("${term}")`
    );
  }
}

// --- 5. Full-English rule: Chinese characters detected ---
{
  const raw = '[Scene]: 山林間的午後陽光, soft rim light, editorial fashion';
  const result = runPromptPipeline(raw, { source: 'verify:chinese-detect', mode: 'dryrun' });
  assert(result.report.hasChineseCharacters, 'CHINESE-DETECT: hasChineseCharacters should be true');
  assert(result.prompt === raw, 'CHINESE-DETECT: dry-run must not mutate prompt');
}

// --- 6. Male-mismatch warning (expectMale option, plan §1) ---
{
  const raw = '[Subject]: a man in a business suit, the female model is standing near a window';
  const withFlag = runPromptPipeline(raw, { source: 'verify:male-mismatch', mode: 'dryrun', expectMale: true });
  assert(
    withFlag.report.warnings.some(w => w.toLowerCase().includes('expectmale')),
    `MALE-MISMATCH: expected an expectMale warning, got warnings=${JSON.stringify(withFlag.report.warnings)}`
  );

  const withoutFlag = runPromptPipeline(raw, { source: 'verify:male-mismatch-off', mode: 'dryrun' });
  assert(
    !withoutFlag.report.warnings.some(w => w.toLowerCase().includes('expectmale')),
    'MALE-MISMATCH: warning must NOT appear when expectMale is not set'
  );

  const cleanMale = '[Subject]: a man in a business suit standing near a window';
  const cleanResult = runPromptPipeline(cleanMale, { source: 'verify:male-clean', mode: 'dryrun', expectMale: true });
  assert(
    !cleanResult.report.warnings.some(w => w.toLowerCase().includes('expectmale')),
    'MALE-MISMATCH: no warning expected when prompt has no woman/female/她 wording'
  );
}

// --- 7. Reverse false-positive guard: legitimate natural-skin-texture fixtures (PITFALLS #3) ---
{
  const legitFixtures = [
    '[Skin]: visible pore texture, natural skin, subsurface scattering, editorial macro detail',
    '[Skin]: natural skin texture with realistic subsurface scattering, no retouching',
    '[Food]: mole sauce served on the side, warm ambient light'
  ];
  for (const raw of legitFixtures) {
    const dryResult = runPromptPipeline(raw, { source: 'verify:false-positive-dryrun', mode: 'dryrun' });
    const enforceResult = runPromptPipeline(raw, { source: 'verify:false-positive-enforce', mode: 'enforce' });
    if (raw.includes('mole sauce')) {
      // KNOWN LIMITATION: "mole" as a bare detector term matches "mole sauce" too
      // (word-boundary regex has no semantic awareness). This is documented,
      // pre-existing sanitizer behavior (not introduced by this plan) — flagged
      // here as a known false-positive rather than silently ignored.
      // Check the dry-run report (pre-removal) since enforce mode strips the
      // matched term, which would trivially flip hasForbiddenFacialMarkTerms
      // back to false after the fact.
      assert(
        dryResult.report.hasForbiddenFacialMarkTerms === true,
        'KNOWN-LIMITATION check drifted: "mole sauce" no longer flagged in dry-run — detector behavior changed unexpectedly'
      );
      assert(
        enforceResult.prompt !== raw,
        'KNOWN-LIMITATION check drifted: enforce mode no longer strips "mole" from "mole sauce" — detector behavior changed unexpectedly'
      );
      continue;
    }
    assert(dryResult.report.isClean, `FALSE-POSITIVE-GUARD: expected isClean=true (dry-run) for: "${raw}"`);
    assert(dryResult.prompt === raw, `FALSE-POSITIVE-GUARD: dry-run must not mutate: "${raw}"`);
    assert(enforceResult.report.isClean, `FALSE-POSITIVE-GUARD: expected isClean=true (enforce) for: "${raw}"`);
    assert(enforceResult.prompt === raw, `FALSE-POSITIVE-GUARD: enforce must not alter legitimate prompt: "${raw}"`);
  }
}

// --- 8. KNOWN-GAP (plan §4.2): bare spot/patch/blemish are NOT in the detector today ---
{
  const knownGapTerms = ['spot', 'patch', 'blemish'];
  for (const term of knownGapTerms) {
    const raw = `[Skin]: a small ${term} visible on the cheek under studio light`;
    const result = runPromptPipeline(raw, { source: 'verify:known-gap', mode: 'dryrun' });
    // Asserting CURRENT (gap) behavior: NOT detected. If this ever flips to
    // true, the detector array changed — that requires its own reviewed
    // package with a false-positive regression pass (plan §6.7), not a
    // silent pass here.
    assert(
      result.report.hasForbiddenFacialMarkTerms === false,
      `KNOWN-GAP drifted: bare "${term}" is now being detected — detector array changed outside this plan's scope`
    );
  }
}

// --- 9. Dry-run global non-mutation guarantee ---
{
  const raw = '[Subject]: Asian woman with a mole, 中文殘留, she/her pronouns, natural pore texture';
  const result = runPromptPipeline(raw, { source: 'verify:dryrun-non-mutation', mode: 'dryrun' });
  assert(result.prompt === raw, 'DRYRUN-NON-MUTATION: dry-run must return the prompt unchanged regardless of content');
  assert(result.blocked === false, 'DRYRUN-NON-MUTATION: blocked must always be false in dry-run');
}

console.log(`PASS ${pass} / FAIL ${fail}`);
if (failures.length > 0) {
  console.error('\nFailures:');
  for (const f of failures) {
    console.error(` - ${f}`);
  }
}
process.exit(failures.length ? 1 : 0);

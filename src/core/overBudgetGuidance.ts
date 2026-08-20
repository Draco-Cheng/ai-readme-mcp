/**
 * Over-budget guidance shared by compress_ai_readme and update_ai_readme.
 *
 * When an AI_README is over its token budget, deterministic tools can't fix it —
 * an LLM must. There are THREE distinct cures, and picking the wrong one wastes
 * the agent's effort:
 *   - REWRITE: the file is genuinely bloated (filler, things AI can re-derive) →
 *     cut it down.
 *   - SPLIT: ONE section documents a whole subsystem dense with non-obvious traps
 *     → that content isn't filler, so rewriting can only fit it by DELETING real
 *     signal. The fix is to relocate the section into a child-directory AI_README.
 *   - RESTRUCTURE: no single section dominates, but there are MANY sections.
 *     The doc shape is a SYMPTOM — the directory likely hosts too many parallel
 *     features in one flat level. The real fix is an architecture decision
 *     (regroup files into feature subdirectories, judged from the actual code,
 *     not the doc); the AI_README splitting is a consequence, not the goal.
 *
 * Both compress (user ran it) and update (an edit pushed the file over budget)
 * reach this fork, so the decision lives here, used by both — otherwise update
 * would only ever say "rewrite" and the agent, told to hit <400, would have to
 * either delete load-bearing safety rules or give up.
 *
 * The MCP has no LLM: it only DETECTS the shape (dominant section vs many
 * sections) deterministically. The agent decides where content moves — and for
 * RESTRUCTURE specifically, moving files is a visible, hard-to-reverse change,
 * so the agent MUST confirm with the user before acting.
 */

import { renderWritingGuide } from './writingGuide.js';
import { DEFAULT_TOKEN_BUDGET, idealTokens } from './budget.js';
import { analyzeSections, type SectionStat } from './sectionAnalysis.js';

/**
 * REWRITE instruction — file is bloated, cut it down in place.
 */
export function buildRewriteInstruction(
  readmePath: string,
  tokens: number,
  score: number,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): string {
  const guide = renderWritingGuide('full', tokenBudget);
  const ideal = idealTokens(tokenBudget);
  return (
    `\n\n🛠️  MANDATORY REWRITE — ${readmePath}: ${tokens} tokens (target <${tokenBudget}), score ${score}/100. ` +
    `Over budget because content is long, not padded — regex can't fix, an LLM rewrite can.\n` +
    `NEXT call MUST be update_ai_readme 'rewrite' on this file, full content from scratch. Nothing else until done.\n\n` +
    `Exact call shape:\n` +
    `  update_ai_readme({\n` +
    `    readmePath: "${readmePath}",\n` +
    `    operations: [{ type: "rewrite", content: "<full new file content here>" }]\n` +
    `  })\n\n` +
    `NOT a squeeze — a CUT. Remove low-value INFORMATION, not words.\n` +
    `Be willing to DELETE. When unsure a line earns its place, cut it — don't keep it just because it's already there. A dropped low-value line costs nothing; a kept one costs budget every read.\n` +
    `Rewrite reqs (keywords not prose):\n` +
    `  - Target <${tokenBudget} tokens, ideally <${ideal}. Fragments + bullets.\n` +
    `  - Bullets, 1 "- " per fact AI'd get wrong from code (+why only if it stops reversion). Run-on chaining facts with ";"/"then" = wall → break into bullets.\n` +
    `  - KEEP only: project-specific + non-obvious — traps ("bcrypt direct, NOT passlib"), cross-dir deps, invariants/gotchas.\n` +
    `  - DELETE: anything AI re-derives from code — directory structure, standard naming, framework defaults, generic test commands, code examples, exhaustive lists (endpoints/fields/per-file), step-by-step how-to.\n` +
    `  - Read the current file first to extract real signal.\n\n` +
    `Then verify with validate_ai_readmes, resume your task.\n\n` +
    `${guide}`
  );
}

/**
 * SPLIT instruction — one subsystem section dominates, relocate it to a child dir.
 */
export function buildSplitInstruction(
  readmePath: string,
  tokens: number,
  section: SectionStat,
  thresholdFraction: number
): string {
  const pct = Math.round(section.fraction * 100);
  return (
    `\n\n✂️  SPLIT, don't squeeze — ${readmePath}: ${tokens} tokens, ONE section ` +
    `"${section.heading}" (line ${section.line}) = ~${section.tokens} tokens (${pct}%, over ${Math.round(thresholdFraction * 100)}% threshold).\n` +
    `Dense subsystem, NOT filler — rewrite would delete real signal. Relocate, don't shrink.\n\n` +
    `BEFORE any other task:\n` +
    `  1. Find the dir that subsystem lives in (section names the real files/paths). Child AI_README goes THERE → get_context surfaces it only when editing that subsystem.\n` +
    `  2. Write the section to that dir's AI_README (standalone file, own # H1):\n` +
    `       update_ai_readme({ readmePath: "<subsystem-dir>/AI_README.md", operations: [{ type: "rewrite", content: "<the section, as a standalone file with its own # H1>" }] })\n` +
    `  3. Replace the section in ${readmePath} with ONE pointer line:\n` +
    `       update_ai_readme({ readmePath: "${readmePath}", operations: [{ type: "replace", searchText: "<the whole section>", content: "<subsystem>: see <subsystem-dir>/AI_README.md" }] })\n\n` +
    `Why: subsystem detail stops counting against the parent on every unrelated edit; each file stays in budget → no more compress/re-bloat oscillation.\n\n` +
    `No child dir fits? → fall back to rewrite (restraint test, cut what AI re-derives).\n\n` +
    `Then verify both files with validate_ai_readmes, resume your task.`
  );
}

/**
 * A directory hosting this many `##`/`###` sections, none dominant, is a sign the
 * DIRECTORY (not the file) is overloaded — one feature-topic per section is normal;
 * this many means too many features share one AI_README. Picked as "clearly more
 * than a normal multi-topic file", not derived from any measurement.
 */
const MANY_SECTIONS_THRESHOLD = 6;

/**
 * RESTRUCTURE instruction — no dominant section, but many sections. The doc
 * shape is only a SYMPTOM: the likely root cause is that the DIRECTORY hosts
 * too many parallel features in one flat level. The real question is an
 * architecture one — should these files be regrouped into feature
 * subdirectories? — and the AI_README shrinking is a natural consequence of
 * answering it, not the goal. The instruction therefore sends the agent to
 * inspect the actual files first, and keeps the tone advisory: the section
 * count is a deterministic hint, not a verdict.
 */
export function buildRestructureInstruction(
  readmePath: string,
  tokens: number,
  sectionCount: number,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): string {
  return (
    `\n\nARCHITECTURE CHECK — ${readmePath}: ${sectionCount} sections, none dominant, ${tokens} tokens ` +
    `(target <${tokenBudget}). That doc shape is usually a SYMPTOM: the directory likely hosts too many ` +
    `parallel features in one flat level. The question is NOT "how do I shrink this file" — it's "should this ` +
    `directory be regrouped into feature subdirectories". If yes, the AI_README splits naturally as a side effect.\n\n` +
    `1. INSPECT THE ACTUAL FILES first — list the directory's contents and judge from the code (not from the ` +
    `AI_README's headings) whether the files fall into coherent, independent feature groups.\n` +
    `   - If they're actually cohesive (shared logic, one domain) → this signal is a false positive; fall back ` +
    `to a rewrite of the doc and do NOT touch the directory.\n` +
    `2. If regrouping makes sense, STOP and confirm with the user before moving anything — propose the feature ` +
    `groups and wait for approval. Moving files is a visible, hard-to-reverse change (use \`git mv\` to keep history).\n\n` +
    `Once approved, per feature group:\n` +
    `  - \`git mv\` its files into a child directory (e.g. \`<feature>/\`).\n` +
    `  - Write its conventions into \`<feature-dir>/AI_README.md\` (standalone file, own # H1):\n` +
    `      update_ai_readme({ readmePath: "<feature-dir>/AI_README.md", operations: [{ type: "rewrite", content: "<that feature's sections>" }] })\n` +
    `  - Replace the moved section in ${readmePath} with ONE pointer line:\n` +
    `      update_ai_readme({ readmePath: "${readmePath}", operations: [{ type: "replace", searchText: "<the section>", content: "<feature>: see <feature-dir>/AI_README.md" }] })\n\n` +
    `Why: the codebase gets maintainable feature boundaries (the actual goal), developers stop wading through ` +
    `one flat directory, and each feature's conventions stop counting against the parent on unrelated edits.\n\n` +
    `Then verify all files with validate_ai_readmes, resume your task.`
  );
}

export type OverBudgetMode = 'split' | 'restructure' | 'rewrite';

export interface OverBudgetDiagnosis {
  mode: OverBudgetMode;
  /** Set only for mode 'split' — the section that crossed the threshold. */
  dominant: SectionStat | null;
  sectionCount: number;
}

/**
 * Classify an over-budget file: SPLIT vs RESTRUCTURE vs REWRITE. Single source
 * of the decision — the full instructions (compress/update) and the one-line
 * diagnosis labels (validate) must never disagree about the same file.
 *   - One section >= thresholdFraction of the file → SPLIT (relocate that section).
 *   - No dominant section but MANY_SECTIONS_THRESHOLD+ sections → RESTRUCTURE
 *     (the directory hosts too many features; split it, not the file).
 *   - Otherwise → REWRITE (the file itself is just bloated).
 */
export function diagnoseOverBudget(
  content: string,
  thresholdFraction: number
): OverBudgetDiagnosis {
  const { dominant, sections } = analyzeSections(content);
  if (dominant && dominant.fraction >= thresholdFraction) {
    return { mode: 'split', dominant, sectionCount: sections.length };
  }
  if (sections.length >= MANY_SECTIONS_THRESHOLD) {
    return { mode: 'restructure', dominant: null, sectionCount: sections.length };
  }
  return { mode: 'rewrite', dominant: null, sectionCount: sections.length };
}

/**
 * Build the full actionable instruction for an over-budget file. Caller must
 * have already established the file IS over budget.
 */
export function buildOverBudgetGuidance(
  readmePath: string,
  content: string,
  tokens: number,
  score: number,
  thresholdFraction: number,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): { instruction: string; mode: OverBudgetMode } {
  const diagnosis = diagnoseOverBudget(content, thresholdFraction);
  if (diagnosis.mode === 'split') {
    return {
      instruction: buildSplitInstruction(readmePath, tokens, diagnosis.dominant!, thresholdFraction),
      mode: 'split',
    };
  }
  if (diagnosis.mode === 'restructure') {
    return {
      instruction: buildRestructureInstruction(readmePath, tokens, diagnosis.sectionCount, tokenBudget),
      mode: 'restructure',
    };
  }
  return {
    instruction: buildRewriteInstruction(readmePath, tokens, score, tokenBudget),
    mode: 'rewrite',
  };
}

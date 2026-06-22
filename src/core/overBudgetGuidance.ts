/**
 * Over-budget guidance shared by compress_ai_readme and update_ai_readme.
 *
 * When an AI_README is over its token budget, deterministic tools can't fix it —
 * an LLM must. There are TWO distinct cures, and picking the wrong one wastes the
 * agent's effort:
 *   - REWRITE: the file is genuinely bloated (filler, things AI can re-derive) →
 *     cut it down.
 *   - SPLIT: ONE section documents a whole subsystem dense with non-obvious traps
 *     → that content isn't filler, so rewriting can only fit it by DELETING real
 *     signal. The fix is to relocate the section into a child-directory AI_README.
 *
 * Both compress (user ran it) and update (an edit pushed the file over budget)
 * reach this fork, so the decision lives here, used by both — otherwise update
 * would only ever say "rewrite" and the agent, told to hit <400, would have to
 * either delete load-bearing safety rules or give up.
 *
 * The MCP has no LLM: it only DETECTS the dominant section deterministically and
 * names it. The agent decides which child directory it belongs to and moves it.
 */

import { renderWritingGuide } from './writingGuide.js';
import { analyzeSections, type SectionStat } from './sectionAnalysis.js';

/**
 * REWRITE instruction — file is bloated, cut it down in place.
 */
export function buildRewriteInstruction(readmePath: string, tokens: number, score: number): string {
  const guide = renderWritingGuide('full');
  return (
    `\n\n🛠️  MANDATORY REWRITE — ${readmePath} is at ${tokens} tokens (target: <400), score ${score}/100. ` +
    `The file is still over budget because the content is long, not padded. ` +
    `Deterministic filler-stripping cannot fix this — an LLM rewrite can.\n\n` +
    `Your NEXT tool call MUST be update_ai_readme on this same file with a single 'rewrite' operation that replaces the entire content from scratch. ` +
    `Do not proceed with any other task until this rewrite is done.\n\n` +
    `Exact call shape:\n` +
    `  update_ai_readme({\n` +
    `    readmePath: "${readmePath}",\n` +
    `    operations: [{ type: "rewrite", content: "<full new file content here>" }]\n` +
    `  })\n\n` +
    `This is NOT a squeeze — it is a CUT. The file is long because it records things AI can find itself, not because the sentences are wordy. Removing words won't fix it; removing low-value INFORMATION will.\n\n` +
    `Rewrite requirements:\n` +
    `  - Target: <400 tokens, ideally <200\n` +
    `  - Apply the restraint test to every line: keep it ONLY if it is project-specific AND non-obvious — a fact AI would get wrong by reading the code alone. If AI can re-derive it from the code, DELETE it.\n` +
    `  - DELETE outright: project/directory structure, standard naming, framework defaults, generic test commands, code examples, AND exhaustive enumerations (full endpoint lists, every field/column, per-file descriptions) — AI reads these from the source.\n` +
    `  - KEEP: tech choices with a trap ("bcrypt direct, NOT passlib"), cross-directory deps, invariants/gotchas, the WHY behind a non-obvious rule.\n` +
    `  - Collapse "one line per instance" into "one rule + why". Prefer fewer, higher-signal lines.\n` +
    `  - Use fragments and bullets, not prose paragraphs.\n` +
    `  - Read the current file first to extract the real signal.\n\n` +
    `After the rewrite, verify with validate_ai_readmes, then resume your original task.\n\n` +
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
    `\n\n✂️  SPLIT, don't squeeze — ${readmePath} is at ${tokens} tokens, and ONE section ` +
    `"${section.heading}" (line ${section.line}) alone is ~${section.tokens} tokens (${pct}% of the file, over the ${Math.round(thresholdFraction * 100)}% split threshold).\n` +
    `This section documents a subsystem dense with its own non-obvious traps — it is NOT filler, so compression/rewrite would have to DELETE real signal to fit. The right fix is to relocate it, not shrink it.\n\n` +
    `Do this BEFORE any other task:\n` +
    `  1. Identify the directory that subsystem actually lives in (read the section — it references the real files/paths). The child AI_README goes THERE so get_context_for_file surfaces it only when editing that subsystem.\n` +
    `  2. Create/extend that directory's AI_README with the section content:\n` +
    `       update_ai_readme({ readmePath: "<subsystem-dir>/AI_README.md", operations: [{ type: "rewrite", content: "<the section, as a standalone file with its own # H1>" }] })\n` +
    `  3. Remove the section from ${readmePath} and leave ONE pointer line in its place, e.g.:\n` +
    `       update_ai_readme({ readmePath: "${readmePath}", operations: [{ type: "replace", searchText: "<the whole section>", content: "<subsystem>: see <subsystem-dir>/AI_README.md" }] })\n\n` +
    `Why this breaks the loop: the heavy subsystem detail no longer counts against the parent file's budget on every unrelated edit, and each file stays independently within budget — so you stop oscillating between compress and re-bloat.\n\n` +
    `If NO child directory fits (the dense content genuinely belongs at this level), fall back to a rewrite instead — apply the restraint test and cut what AI can re-derive.\n\n` +
    `After splitting, verify both files with validate_ai_readmes, then resume your original task.`
  );
}

/**
 * Decide SPLIT vs REWRITE for an over-budget file. Split when one section occupies
 * >= thresholdFraction of the file; otherwise rewrite. Caller must have already
 * established the file IS over budget.
 */
export function buildOverBudgetGuidance(
  readmePath: string,
  content: string,
  tokens: number,
  score: number,
  thresholdFraction: number
): { instruction: string; mode: 'split' | 'rewrite' } {
  const { dominant } = analyzeSections(content);
  if (dominant && dominant.fraction >= thresholdFraction) {
    return {
      instruction: buildSplitInstruction(readmePath, tokens, dominant, thresholdFraction),
      mode: 'split',
    };
  }
  return {
    instruction: buildRewriteInstruction(readmePath, tokens, score),
    mode: 'rewrite',
  };
}

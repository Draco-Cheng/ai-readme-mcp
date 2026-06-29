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
 * Decide SPLIT vs REWRITE for an over-budget file. Split when one section occupies
 * >= thresholdFraction of the file; otherwise rewrite. Caller must have already
 * established the file IS over budget.
 */
export function buildOverBudgetGuidance(
  readmePath: string,
  content: string,
  tokens: number,
  score: number,
  thresholdFraction: number,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): { instruction: string; mode: 'split' | 'rewrite' } {
  const { dominant } = analyzeSections(content);
  if (dominant && dominant.fraction >= thresholdFraction) {
    return {
      instruction: buildSplitInstruction(readmePath, tokens, dominant, thresholdFraction),
      mode: 'split',
    };
  }
  return {
    instruction: buildRewriteInstruction(readmePath, tokens, score, tokenBudget),
    mode: 'rewrite',
  };
}

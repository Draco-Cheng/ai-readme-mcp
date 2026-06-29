/**
 * Shared writing guide for AI_README files.
 * Used by init (to teach the philosophy upfront) and validate (to remind
 * when scores are low — so AI follows the same standard in both contexts).
 */

import { DEFAULT_TOKEN_BUDGET, lightTierTokens, fullTierTokens } from './budget.js';

export const TOKEN_EFFICIENT_FORMAT_GUIDE = `## Writing Style: Keywords, not prose

AI_README is read by AI, not humans. Keywords > sentences:

**Core rule — bullets, 1 bullet = 1 fact:**
- Each "- " bullet carries ONE fact AI'd get wrong from code alone (+why only if it stops reversion).
- A run-on sentence chaining facts with ";"/"then"/"—" is a wall: break it into separate bullets.
- Fragments, not sentences. No prose paragraphs — when you append to a dense block, bullet the existing wall too, never grow it.

**Drop entirely:**
- Articles (a, an, the in prose); filler (just, really, basically, actually, simply, essentially, generally)
- Hedging / prefixes ("You should", "Remember to", "it might be worth") — state the rule
- Verbose phrases: "in order to" → "to", "utilize" → "use"
- Anything AI re-derives from code: directory structure, standard naming, framework defaults, generic test commands, exhaustive lists, step-by-step how-to

**Preserve exactly (never compress):** code blocks + inline code, file paths, URLs, commands, technical terms, versions.

**Examples (✅ = 1 fact per bullet, fragments):**
\`\`\`
❌ You should always run the tests before committing any changes.
✅ Run tests before commit.

❌ This module is responsible for handling all authentication logic.
✅ Handles auth logic.

❌ Release TAG-ONLY: CD never bumps package.json (private, Docker). $VERSION from tag. CD via nx release version --dry-run then git tag, no commit to main, nx affected clean (deploy.yml).
✅ Release tag-only; $VERSION from git tag. CD tags w/o commit→main → nx affected stays clean. See deploy.yml.
\`\`\`
`;

/**
 * Compact reminder for drifting READMEs — short bullet list of the core principle.
 * Used standalone for mid-tier issues. For severe cases, callers append
 * TOKEN_EFFICIENT_FORMAT_GUIDE separately so the full ❌→✅ examples follow.
 */
/** "Under N tokens" line scales with the project budget (default 400). */
export function renderLowScoreReminder(tokenBudget: number = DEFAULT_TOKEN_BUDGET): string {
  return `📖 **AI_README is for AI, not humans.** Keywords, not prose:
- 1 bullet ("- ") = 1 fact AI'd get wrong from code (+why only if it stops reversion). A run-on chaining facts with ";"/"then" is a wall → break into bullets.
- Under ${tokenBudget} tokens. Fragments, no prose paragraphs. State rules directly (no "You should"/"Remember to").
- Drop filler (just, really, basically, in order to, utilize) AND anything AI re-derives from code: project structure, standard naming, generic test commands, exhaustive lists.
- Keep only project-specific + non-obvious.`;
}

// Tiered thresholds: light reminder for "drifting", full guide for "needs rewrite".
// Token thresholds fire even when score is OK — a 900-token file with one warning
// scores 75 but is already 2x over budget and needs the same nudge. Token cutoffs
// derive from the project's tokenBudget (see budget.ts); score cutoffs are fixed.
export const SCORE_LIGHT_THRESHOLD = 80;
export const SCORE_FULL_THRESHOLD = 60;

export type WritingGuideTier = 'none' | 'light' | 'full';

/**
 * Pick which writing-guide tier to surface for a single README, based on score
 * and token count. Shared between validate (multi-file summary) and update
 * (single-file post-write check) so both tools give the same nudge. The token
 * cutoffs scale with tokenBudget so a higher-budget project isn't nagged at 500.
 */
export function pickWritingGuideTier(
  score: number,
  tokens: number,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): WritingGuideTier {
  if (score < SCORE_FULL_THRESHOLD || tokens > fullTierTokens(tokenBudget)) return 'full';
  if (score < SCORE_LIGHT_THRESHOLD || tokens > lightTierTokens(tokenBudget)) return 'light';
  return 'none';
}

/**
 * Render the writing-guide reminder for a given tier. Returns empty string
 * for 'none' so callers can unconditionally append.
 */
export function renderWritingGuide(
  tier: WritingGuideTier,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): string {
  if (tier === 'full') return TOKEN_EFFICIENT_FORMAT_GUIDE;
  if (tier === 'light') return renderLowScoreReminder(tokenBudget);
  return '';
}

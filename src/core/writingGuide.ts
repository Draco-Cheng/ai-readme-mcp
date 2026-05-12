/**
 * Shared writing guide for AI_README files.
 * Used by init (to teach the philosophy upfront) and validate (to remind
 * when scores are low — so AI follows the same standard in both contexts).
 */

export const TOKEN_EFFICIENT_FORMAT_GUIDE = `## Writing Style: Token-Efficient Format

AI_README is read by AI, not humans. Use token-efficient prose to minimize context consumption:

**Remove these words entirely:**
- Articles: a, an, the (in prose)
- Filler: just, really, basically, actually, simply, essentially, generally
- Hedging: "it might be worth", "you could consider", "it would be good to"
- Fluff connectives: however, furthermore, additionally, in addition
- Verbose phrases: "in order to" → "to", "make sure to" → "ensure", "utilize" → "use"
- Prefixes: "You should", "Remember to", "Make sure to" — just state the rule

**Fragments are OK** — incomplete sentences are fine, AI understands them:
\`\`\`
❌ You should always run the tests before committing any changes.
✅ Run tests before commit.

❌ This module is responsible for handling all authentication logic.
✅ Handles auth logic.
\`\`\`

**Preserve exactly (never compress):**
- Code blocks (\`\`\`...\`\`\`) and inline code (\`...\`)
- File paths, URLs, commands
- Technical terms, library names, version numbers

**More examples:**
\`\`\`
❌ The application uses a microservices architecture with the following components.
✅ Microservices. API gateway routes requests to services.

❌ It is important to note that all exports must be named, not default.
✅ Named exports only.
\`\`\`
`;

/**
 * Compact reminder for drifting READMEs — short bullet list of the core principle.
 * Used standalone for mid-tier issues. For severe cases, callers append
 * TOKEN_EFFICIENT_FORMAT_GUIDE separately so the full ❌→✅ examples follow.
 */
export const LOW_SCORE_REMINDER = `📖 **AI_README is for AI, not humans.** Write key points, not full prose:
- Keep under 400 tokens — fragments and bullet points beat paragraphs
- State rules directly — no "You should", "Remember to", "Make sure to"
- Drop filler — just, really, basically, actually, simply, in order to, utilize
- Skip what AI can discover itself — project structure, standard naming (camelCase/PascalCase), npm test commands
- Keep only what's project-specific and non-obvious`;

// Tiered thresholds: light reminder for "drifting", full guide for "needs rewrite".
// Token thresholds fire even when score is OK — a 900-token file with one warning
// scores 75 but is already 2x over budget and needs the same nudge.
export const SCORE_LIGHT_THRESHOLD = 80;
export const SCORE_FULL_THRESHOLD = 60;
export const TOKENS_LIGHT_THRESHOLD = 500;
export const TOKENS_FULL_THRESHOLD = 700;

export type WritingGuideTier = 'none' | 'light' | 'full';

/**
 * Pick which writing-guide tier to surface for a single README, based on score
 * and token count. Shared between validate (multi-file summary) and update
 * (single-file post-write check) so both tools give the same nudge.
 */
export function pickWritingGuideTier(score: number, tokens: number): WritingGuideTier {
  if (score < SCORE_FULL_THRESHOLD || tokens > TOKENS_FULL_THRESHOLD) return 'full';
  if (score < SCORE_LIGHT_THRESHOLD || tokens > TOKENS_LIGHT_THRESHOLD) return 'light';
  return 'none';
}

/**
 * Render the writing-guide reminder for a given tier. Returns empty string
 * for 'none' so callers can unconditionally append.
 */
export function renderWritingGuide(tier: WritingGuideTier): string {
  if (tier === 'full') return TOKEN_EFFICIENT_FORMAT_GUIDE;
  if (tier === 'light') return LOW_SCORE_REMINDER;
  return '';
}

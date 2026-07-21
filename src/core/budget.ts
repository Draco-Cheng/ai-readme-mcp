/**
 * Single source of truth for the token budget.
 *
 * The budget is one user-facing number (`tokenBudget`, from .aireadme.config.json,
 * default 400). Everything else — the validator's tier thresholds, the writing-
 * guide nudge tiers, and the numbers printed in over-budget prompts — DERIVES
 * from it here, so a project that sets `tokenBudget: 800` gets every gate, tier,
 * and prompt scaled. Nothing downstream may hardcode the derived numbers.
 *
 * Deliberate ratio choices (not all historical):
 * - light nudge = 1.0×: tokenBudget is documented as "a target — files over it
 *   get nudged", so crossing the budget itself must produce a (light) nudge.
 *   A higher ratio creates a silent band (budget..ratio×budget) where a file
 *   is over target yet nothing speaks up.
 * - error = 2.0×: the natural "double the budget" line (was 2.5, an artifact
 *   of the historical 1000/400).
 */

/** Default budget when no .aireadme.config.json sets tokenBudget. */
export const DEFAULT_TOKEN_BUDGET = 400;

/** Validator tokenLimits as fractions of tokenBudget. */
const LIMIT_RATIOS = {
  excellent: 0.5, // 200 @ 400
  good: 1.0, //      400 @ 400
  warning: 1.5, //   600 @ 400
  error: 2.0, //     800 @ 400 — was 2.5 (historical 1000/400); 2× reads as the
  //                 natural "double the budget" line. Rarely first defense:
  //                 the 1.75× full tier forces rewrite/split before this.
} as const;

/** Writing-guide nudge tiers as fractions of tokenBudget. */
const TIER_RATIOS = {
  light: 1.0, // 400 @ 400 — over budget → "drifting", nudge starts HERE
  full: 1.75, // 700 @ 400 — "needs rewrite"
} as const;

/** The "ideal" target shown in prompts (aim well under the ceiling). */
const IDEAL_RATIO = 0.5; // 200 @ 400

export interface DerivedTokenLimits {
  excellent: number;
  good: number;
  warning: number;
  error: number;
}

/** Derive the four validator thresholds from a single tokenBudget. */
export function deriveTokenLimits(tokenBudget: number): DerivedTokenLimits {
  return {
    excellent: Math.round(tokenBudget * LIMIT_RATIOS.excellent),
    good: Math.round(tokenBudget * LIMIT_RATIOS.good),
    warning: Math.round(tokenBudget * LIMIT_RATIOS.warning),
    error: Math.round(tokenBudget * LIMIT_RATIOS.error),
  };
}

/** Token count above which a file is "drifting" (light nudge). */
export function lightTierTokens(tokenBudget: number): number {
  return Math.round(tokenBudget * TIER_RATIOS.light);
}

/** Token count above which a file "needs rewriting" (full nudge). */
export function fullTierTokens(tokenBudget: number): number {
  return Math.round(tokenBudget * TIER_RATIOS.full);
}

/** The "ideally <N" target surfaced in rewrite/guide prompts. */
export function idealTokens(tokenBudget: number): number {
  return Math.round(tokenBudget * IDEAL_RATIO);
}

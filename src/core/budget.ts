/**
 * Single source of truth for the token budget.
 *
 * The budget is one user-facing number (`tokenBudget`, from .aireadme.config.json,
 * default 400). Everything else — the validator's tier thresholds, the writing-
 * guide nudge tiers, and the numbers printed in over-budget prompts — DERIVES
 * from it here, so a project that sets `tokenBudget: 800` gets every gate, tier,
 * and prompt scaled. Nothing downstream may hardcode 400/200/500/700.
 *
 * The ratios are pinned so the default tokenBudget=400 reproduces the historical
 * constants exactly (200/400/600/1000 limits, 500/700 nudge tiers, ideal=200) —
 * existing projects see zero behavior change.
 */

/** Default budget when no .aireadme.config.json sets tokenBudget. */
export const DEFAULT_TOKEN_BUDGET = 400;

/** Validator tokenLimits as fractions of tokenBudget. */
const LIMIT_RATIOS = {
  excellent: 0.5, // 200 @ 400
  good: 1.0, //      400 @ 400
  warning: 1.5, //   600 @ 400
  error: 2.5, //    1000 @ 400
} as const;

/** Writing-guide nudge tiers as fractions of tokenBudget. */
const TIER_RATIOS = {
  light: 1.25, // 500 @ 400 — "drifting"
  full: 1.75, //  700 @ 400 — "needs rewrite"
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

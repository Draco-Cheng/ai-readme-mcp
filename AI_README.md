# AI_README

TypeScript ESM MCP server (Node >=18). Bundled via `tsup`. Tests via `tsx --test` (NOT vitest).

## Conventions
- ESM imports need `.js` extensions
- Zod schemas defined in tool files, NOT in core
- Tool handlers parse with zod then delegate to core class — no business logic in tool files
- `compress_ai_readme` uses deterministic regex transforms only — no LLM calls


- Token budget: ONE knob `tokenBudget` (.aireadme.config.json, default 400). All thresholds/tiers/prompt numbers derive from it via `src/core/budget.ts` — never hardcode 400/200/500/700.
- compress/update load config via `loadConfigNearest()` (walks UP), NEVER `dirname(dirname(readmePath))` — that misses root config for READMEs >1 level deep → silent fallback to default budget.
- `tokenBudget` is a TARGET not a hard cap — files over it are nudged, never rejected; error tier = 2.5× (config field name reflects this, NOT `maxTokens`).
- `excludePatterns` dual-purpose: scanner skips them AND `getContextForPath` short-circuits (excluded path gets no README, not even root). Config values AUGMENT defaults (node_modules always kept); per-call REPLACES. All via `resolveExcludePatterns()`.
- get_context response MUST distinguish "skipped (excluded)" from "no README found" — else LLM mistakes opt-out for missing-README and calls init.
- Test files run in PARALLEL; each must use its own `tests/temp-<name>` dir — a shared temp dir lets one suite's after() rm() delete another's fixture mid-test.

- Guidance level (`guidanceLevel` in .aireadme.config.json, high default|medium): tool descriptions read it SYNC from cwd at startup — ListTools ships before any call, so no projectRoot. high = old text verbatim. See src/core/verbosity.ts.
## Cross-directory dependencies
`src/tools/` imports from `src/core/` and `src/types/`. `src/core/` imports from `src/types/` only. No circular dependencies.

## Release Conventions
- Version lives in 4 places, bumped separately: `package.json`, `clawhub/plugin/package.json`, `clawhub/plugin/openclaw.plugin.json`, plus `clawhub/skills/SKILL.md` (own publish)
- CLAWHUB publish scans `./clawhub/plugin` only — `.claude/` and src stay out
- Release/publish sequence: See package.json scripts + clawhub CLI.

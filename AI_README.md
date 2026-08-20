# AI_README

TypeScript ESM MCP server (Node >=18). Bundled via `tsup`. Tests via `tsx --test` (NOT vitest).

## Conventions
- ESM imports need `.js` extensions
- Zod schemas defined in tool files, NOT in core
- Tool handlers parse with zod then delegate to core class — no business logic in tool files
- `compress_ai_readme` uses deterministic regex transforms only — no LLM calls


- Token budget: ONE knob `tokenBudget` (.aireadme.config.json, default 400) — all thresholds/tiers derive from it via `src/core/budget.ts`, never hardcoded.
- ALL tools (incl. compress/update) require `projectRoot` + read config via `loadConfig(projectRoot)` — one path, no walk-up/guessing.
- `tokenBudget` = TARGET not hard cap — crossing it triggers light nudge (1.0× on purpose, no silent band); error = 2×; never rejected (hence NOT named `maxTokens`).
- `excludePatterns`: scanner skips + `getContextForPath` short-circuits (NO README, not "missing" — else LLM calls init). Config AUGMENTS defaults, per-call REPLACES; via `resolveExcludePatterns()`.
- Test files run in PARALLEL; each must use its own `tests/temp-<name>` dir — a shared temp dir lets one suite's after() rm() delete another's fixture mid-test.

- `guidanceLevel` (config, high default|medium): read SYNC from cwd at startup — ListTools has no projectRoot yet. See src/core/verbosity.ts.
## Cross-directory dependencies
`src/tools/` imports from `src/core/` and `src/types/`. `src/core/` imports from `src/types/` only. No circular dependencies.

## Release Conventions
- Version lives in 4 places, bumped separately: `package.json`, `clawhub/plugin/package.json`, `clawhub/plugin/openclaw.plugin.json`, plus `clawhub/skills/SKILL.md` (own publish)
- CLAWHUB publish scans `./clawhub/plugin` only — `.claude/` and src stay out
- Release/publish sequence: See package.json scripts + clawhub CLI.
- After editing any .md, before publish: code-fence count MUST be even (grep the fence marker). Odd = unbalanced fences → npm silently won't render the README.

- Over-budget: dominant section (≥40%) → SPLIT; else ≥6 sections → RESTRUCTURE (split dir by feature, needs user confirm); else REWRITE. Dominant check wins over section count.

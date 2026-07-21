# AI_README

TypeScript ESM MCP server (Node >=18). Bundled via `tsup`. Tests via `tsx --test` (NOT vitest).

## Conventions
- ESM imports need `.js` extensions
- Zod schemas defined in tool files, NOT in core
- Tool handlers parse with zod then delegate to core class — no business logic in tool files
- `compress_ai_readme` uses deterministic regex transforms only — no LLM calls


- Token budget: ONE knob `tokenBudget` (.aireadme.config.json, default 400). All thresholds/tiers/prompt numbers derive from it via `src/core/budget.ts` — never hardcode them.
- ALL tools (incl. compress/update) require `projectRoot` + read config via `loadConfig(projectRoot)` — one path, no walk-up/guessing.
- `tokenBudget` = TARGET not hard cap — crossing it triggers light nudge (1.0× on purpose, no silent band); error = 2×; never rejected (hence NOT named `maxTokens`).
- `excludePatterns` dual-purpose: scanner skips them AND `getContextForPath` short-circuits (excluded path gets NO README). Config AUGMENTS defaults (node_modules always kept), per-call REPLACES; all via `resolveExcludePatterns()`. Response MUST distinguish "skipped" from "no README found" — else LLM calls init on an opt-out.
- Test files run in PARALLEL; each must use its own `tests/temp-<name>` dir — a shared temp dir lets one suite's after() rm() delete another's fixture mid-test.

- `guidanceLevel` (.aireadme.config.json, high default|medium): read SYNC from cwd at startup (ListTools has no projectRoot). high = old prompt verbatim. See src/core/verbosity.ts.
## Cross-directory dependencies
`src/tools/` imports from `src/core/` and `src/types/`. `src/core/` imports from `src/types/` only. No circular dependencies.

## Release Conventions
- Version lives in 4 places, bumped separately: `package.json`, `clawhub/plugin/package.json`, `clawhub/plugin/openclaw.plugin.json`, plus `clawhub/skills/SKILL.md` (own publish)
- CLAWHUB publish scans `./clawhub/plugin` only — `.claude/` and src stay out
- Release/publish sequence: See package.json scripts + clawhub CLI.
- After editing any .md, before publish: code-fence count MUST be even (grep the fence marker). Odd = unbalanced fences → npm silently won't render the README.

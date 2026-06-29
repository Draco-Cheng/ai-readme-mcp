# AI_README

TypeScript ESM MCP server (Node >=18). Bundled via `tsup`. Tests via `tsx --test` (NOT vitest).

## Conventions
- ESM imports need `.js` extensions
- Zod schemas defined in tool files, NOT in core
- Tool handlers parse with zod then delegate to core class — no business logic in tool files
- `compress_ai_readme` uses deterministic regex transforms only — no LLM calls

## Cross-directory dependencies
`src/tools/` imports from `src/core/` and `src/types/`. `src/core/` imports from `src/types/` only. No circular dependencies.

## Release Conventions
- Version lives in 4 places, bumped separately: `package.json`, `clawhub/plugin/package.json`, `clawhub/plugin/openclaw.plugin.json`, plus `clawhub/skills/SKILL.md` (own publish)
- CLAWHUB publish scans `./clawhub/plugin` only — `.claude/` and src stay out
- Release/publish sequence: See package.json scripts + clawhub CLI.

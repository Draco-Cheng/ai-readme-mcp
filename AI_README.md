# AI_README

TypeScript ESM MCP server (Node >=18). Built with `@modelcontextprotocol/sdk`, `zod`, `zod-to-json-schema`, `fs-extra`, `glob`, `minimatch`, `remark`/`unified`. Bundled via `tsup`. Tests via `tsx --test`.

## Conventions
- ESM only (`"type": "module"`); use `.js` extensions in imports
- Named exports only — no default exports
- Zod schemas defined in tool files, not in core
- Core classes accept optional config via constructor; defaults live in `src/types/index.ts`
- Tool handlers parse with zod schema then delegate to core class — no business logic in tool files
- `compress_ai_readme` uses deterministic regex transforms only — no LLM calls
- Version sourced at runtime from `package.json` via `readFileSync`
- Build output to `dist/`; `prepublishOnly` runs build

## Cross-directory dependencies
`src/tools/` imports from `src/core/` and `src/types/`. `src/core/` imports from `src/types/` only. No circular dependencies.





## Release Conventions
- Version bump on release: update in 3 places — `package.json`, `openclaw.plugin.json`, `skills/clawhub/SKILL.md`
- After version bump: `npm publish`, then `clawhub package publish . --source-repo Draco-Cheng/ai-readme-mcp --source-commit <hash>`
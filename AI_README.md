# AI_README

Node.js MCP server (TypeScript, ESM) that manages AI_README.md files for AI assistants.
Built with `@modelcontextprotocol/sdk`, compiled via `tsup`, tested with `tsx --test`.

## Architecture

- `src/index.ts` — MCP server entry point; registers all tools via `@modelcontextprotocol/sdk`
- `src/tools/` — one file per MCP tool (`getContext`, `update`, `validate`, `discover`, `init`); each exports a zod schema + handler function
- `src/core/` — shared logic: `scanner.ts` (glob-based AI_README discovery), `router.ts` (context routing by path proximity), `updater.ts` (file write + backup), `validator.ts`, `detector.ts`
- `src/types/index.ts` — all shared TypeScript interfaces and types

## Conventions

- All imports use `.js` extension (ESM)
- Tool input schemas defined with `zod`; converted to JSON Schema via `zod-to-json-schema`
- No default exports; use named exports throughout
- Tests live in `tests/` using Node.js built-in test runner (`tsx --test`)
- Build output goes to `dist/`; never edit dist files directly

## Cross-directory dependencies

- `src/tools/` depends on `src/core/` and `src/types/`
- `src/core/` depends on `src/types/` only
- Test fixtures in `tests/fixtures/sample-monorepo/` are used by integration tests



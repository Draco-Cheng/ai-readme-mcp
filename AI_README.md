# AI_README MCP Server

MCP server for managing AI_README.md files - provides context to AI assistants about project conventions.

## Tech Stack
- TypeScript (ES2022, Node16 modules, strict mode)
- MCP SDK (`@modelcontextprotocol/sdk`)
- Zod for schema validation
- tsup for bundling
- tsx for testing

## Architecture
- `src/index.ts` - MCP server entry, tool registration
- `src/tools/` - Tool implementations (discover, getContext, update, validate, init)
- `src/core/` - Core logic (scanner, router, updater, validator, detector)
- `src/types/` - TypeScript interfaces and types

## Coding Conventions
- ESM-only (`"type": "module"`, `.js` extensions in imports)
- Zod schemas for input validation, exported alongside tools
- Tool functions return structured objects, server wraps as JSON
- Prefer `fs-extra` over native fs
- Use `glob` package for file pattern matching

## Cross-directory dependencies
- Tools in `src/tools/` import core modules from `src/core/`
- Types exported from `src/types/index.ts` used everywhere

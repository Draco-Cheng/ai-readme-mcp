# AI_README MCP Server

MCP server for managing AI_README.md files across projects.

## Architecture

- **Type:** MCP Server / Node.js Library
- **Language:** TypeScript 5.3+
- **Runtime:** Node.js 18+
- **Build:** tsup
- **Test:** tsx --test

## Directory Structure

- src/index.ts - MCP server entry
- src/tools/ - 5 MCP tools
- src/core/ - Scanner, router, updater, validator
- tests/unit/ - 57 tests passing

## Coding Conventions

### Critical: Path Handling
Always normalize to Unix-style: filePath.replace(/\\/g, '/')
Essential for cross-platform - minimatch requires forward slashes.

### Module System
- ESM with .js imports (required)
- Named exports only

### Code Style
- TypeScript strict mode
- Avoid any
- JSDoc for exports

### Testing
- Run: tsx --test tests/**/*.test.ts
- All 57 tests must pass

## MCP Tools

1. discover_ai_readmes - Scan and index
2. get_context_for_file - Get relevant context
3. update_ai_readme - Update with operations
4. validate_ai_readmes - Validate quality
5. init_ai_readme - Create from template

## Tool Implementation Pattern

Each tool needs:
1. Zod schema for validation
2. TypeScript types from schema
3. Error handling
4. Export from src/tools/

## Important Notes

### Path Normalization
- Always use Unix-style internally
- Use path.join() for OS-specific operations

### Error Handling
- Wrap MCP calls in try-catch
- Return descriptive messages
- Log errors to stderr

### Validation Defaults
- Excellent: <200 tokens
- Good: <400 tokens
- Warning: <600 tokens
- Error: >1000 tokens
- Code blocks: Prohibited
- Max line: 100

## When Modifying

1. Update tests first (57 must pass)
2. Always normalize paths
3. Follow tool pattern in src/tools/
4. Update docs/ if needed

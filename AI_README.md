# AI_README MCP Server Project

MCP (Model Context Protocol) server for managing AI_README.md files across projects.

## Project Architecture

- **Type:** MCP Server / Node.js Library
- **Language:** TypeScript 5.3+
- **Runtime:** Node.js 18+
- **Build Tool:** tsup
- **Test Framework:** Node.js native test runner (tsx --test)

## Directory Structure

```
src/
├── index.ts           # MCP Server entry point
├── tools/             # MCP tool implementations (5 tools)
├── core/              # Core business logic (scanner, router, updater, validator)
└── types/             # TypeScript type definitions

tests/unit/            # 57 tests, all passing
docs/                  # Detailed documentation
docs/templates/        # AI_README templates
```

## Coding Conventions

### Critical: Path Handling

**Always normalize paths to Unix-style (forward slashes):**
```typescript
const normalizedPath = filePath.replace(/\\/g, '/');
```
This is essential for cross-platform compatibility - minimatch doesn't work with Windows backslashes.

### Module System
- ESM (ES Modules) with `.js` imports (required)
- No default exports, use named exports
- Import example: `import { Scanner } from './scanner.js';`

### Code Style
- TypeScript strict mode enabled
- No `any` unless absolutely necessary
- JSDoc comments for all exported functions
- One class per file for core modules

### Testing
- Node.js native test runner (not vitest)
- Run with: `tsx --test tests/**/*.test.ts`
- All 57 tests must pass before commit
- Test both happy paths and error cases

## MCP Tools

Five tools available:
1. **discover_ai_readmes** - Scan project and build README index
2. **get_context_for_file** - Get relevant context for a file path
3. **update_ai_readme** - Update README with operations (append, replace, etc.)
4. **validate_ai_readmes** - Validate README quality and token count
5. **init_ai_readme** - Create new README from template

All tools return JSON. See [SPEC.md](./docs/SPEC.md) for detailed API.

## MCP Tool Implementation Pattern

Each tool should have:
1. Zod schema for input validation
2. TypeScript types derived from schema
3. Implementation function with error handling
4. Export from separate file in `src/tools/`

Example:
```typescript
export const myToolSchema = z.object({
  param: z.string().describe('Parameter description'),
});

export type MyToolInput = z.infer<typeof myToolSchema>;

export async function myTool(input: MyToolInput) {
  // Implementation
}
```

## Important Notes

### Path Normalization
- Always normalize to Unix-style paths internally
- Use `path.join()` only when needed for OS-specific operations
- All internal comparisons use forward slashes

### Error Handling
- Wrap MCP tool calls in try-catch
- Return error responses with descriptive messages
- Log errors with `console.error()` (goes to stderr)

### Performance
- Scanner can cache README content with `cacheContent: true`
- Router reuses index, can be updated without re-creating

## Phase Status

- ✅ Phase 0-3: Core features complete (discovery, context, update, validation)
- 🚧 Phase 4: Templates done, other advanced features pending
- 📋 Phase 5: Watch mode, caching, VSCode extension

## Validation Defaults

Token limits (adjustable via config):
- Excellent: <400 tokens
- Good: <600 tokens
- Warning: <1000 tokens
- Error: >1500 tokens

Pass config directly in tool calls to customize rules.

## When Modifying This Project

1. Update tests first, ensure all 57 tests pass
2. Always normalize paths to Unix-style
3. Follow the tool implementation pattern in `src/tools/`
4. Update relevant docs in `docs/` folder

## Related Documentation

- [SPEC.md](./docs/SPEC.md) - Complete specification
- [QUICK_START.md](./docs/QUICK_START.md) - 5-minute setup guide
- [EXAMPLES.md](./docs/EXAMPLES.md) - Usage examples

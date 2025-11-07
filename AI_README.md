# AI_README MCP Server Project

This is an MCP (Model Context Protocol) server for managing AI_README.md files across projects.

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
├── tools/             # MCP Tool implementations
│   ├── discover.ts    # discover_ai_readmes tool
│   ├── getContext.ts  # get_context_for_file tool
│   ├── update.ts      # update_ai_readme tool
│   └── validate.ts    # validate_ai_readmes tool
├── core/              # Core business logic
│   ├── scanner.ts     # AIReadmeScanner - discovers README files
│   ├── router.ts      # ContextRouter - routes files to relevant READMEs
│   ├── updater.ts     # ReadmeUpdater - updates README files
│   └── validator.ts   # ReadmeValidator - validates README quality
├── types/             # TypeScript type definitions
└── utils/             # Utility functions (future)

tests/
├── unit/              # Unit tests for core modules
│   ├── scanner.test.ts
│   ├── router.test.ts
│   ├── updater.test.ts
│   └── validator.test.ts
└── fixtures/          # Test fixtures (sample monorepo structure)

docs/
├── SPEC.md            # Project specification
├── QUICK_START.md     # 5-minute setup guide
├── MCP_CONFIG.md      # Detailed MCP configuration
├── EXAMPLES.md        # Real-world usage examples
└── templates/         # AI_README templates for users
```

## Coding Conventions

### TypeScript

- **Strict Mode:** Enabled in tsconfig.json
- **Module System:** ESM (ES Modules) with `.js` imports
- **Target:** Node.js 18+
- **Type Safety:** No `any` unless absolutely necessary

### File Naming

- **Source Files:** camelCase (e.g., `scanner.ts`, `router.ts`)
- **Type Files:** camelCase with descriptive names (e.g., `index.ts` in types folder)
- **Test Files:** Match source with `.test.ts` suffix (e.g., `scanner.test.ts`)

### Code Organization

- **One class per file** for core modules
- **Export named exports**, avoid default exports
- **Import with `.js` extension** (required for ESM)
  ```typescript
  import { Scanner } from './scanner.js'; // ✅ Correct
  import { Scanner } from './scanner';     // ❌ Wrong
  ```

### Documentation

- **JSDoc comments** for all exported functions and classes
- **Inline comments** for complex logic explaining the "why"
- **Type annotations** for all function parameters and return values

### Path Handling

**CRITICAL:** Always normalize paths to Unix-style (forward slashes):
```typescript
// Always normalize Windows paths to Unix-style for cross-platform compatibility
const normalizedPath = filePath.replace(/\\/g, '/');
```

This is essential because:
- minimatch (glob matching) doesn't work with Windows backslashes
- Consistency across different operating systems
- All internal path comparisons use Unix-style paths

## Testing

### Test Framework

- **Node.js native test runner** (not vitest - had compatibility issues)
- **Run with:** `tsx --test tests/**/*.test.ts`
- **Watch mode:** `tsx --test --watch tests/**/*.test.ts`

### Test Structure

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('MyComponent', () => {
  describe('myMethod()', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myMethod(input);

      // Assert
      assert.strictEqual(result, expected);
    });
  });
});
```

### Test Coverage

- **Target:** 80%+ coverage
- **Current Status:** 57/57 tests passing (100%)
- Test both happy paths and error cases
- Use descriptive test names that explain the scenario

### Test Fixtures

Located in `tests/fixtures/sample-monorepo/`:
- Realistic monorepo structure
- Multiple AI_README files at different levels
- Used by both scanner and router tests

## MCP Server Conventions

### Tool Implementation

Each MCP tool should have:
1. **Zod schema** for input validation
2. **TypeScript types** derived from schema
3. **Implementation function** with clear error handling
4. **Exported from separate file** in `src/tools/`

Example:
```typescript
// src/tools/myTool.ts
import { z } from 'zod';

export const myToolSchema = z.object({
  param: z.string().describe('Parameter description'),
});

export type MyToolInput = z.infer<typeof myToolSchema>;

export async function myTool(input: MyToolInput) {
  // Implementation
  return result;
}
```

### Response Formats

- **discover_ai_readmes:** Returns JSON with README index
- **get_context_for_file:** Returns formatted markdown prompt
- **update_ai_readme:** Returns JSON with update results and validation warnings
- **validate_ai_readmes:** Returns JSON with validation report for all READMEs

All tools return text content blocks for the MCP protocol.

## Build & Development

### Build
```bash
npm run build        # Build to dist/
npm run dev         # Watch mode
```

### Testing
```bash
npm test            # Run all tests
npm run typecheck   # TypeScript type checking
```

### Output
- Built files go to `dist/`
- Entry point: `dist/index.js`
- Type definitions: `dist/index.d.ts`

## Important Notes

### Cross-Platform Compatibility

- Always use forward slashes (`/`) internally for paths
- Normalize Windows paths immediately when reading from filesystem
- Use `path.join()` only when needed for OS-specific operations

### Error Handling

- Wrap MCP tool calls in try-catch
- Return error responses with `isError: true`
- Log errors with `console.error()` (goes to stderr, not MCP protocol)

### Performance

- **Scanner:** Can cache README content with `cacheContent: true` option
- **Router:** Reuses index, can be updated without re-creating instance

## Phase Status

- ✅ **Phase 0:** Initial setup complete
- ✅ **Phase 1:** MVP with discovery and context retrieval complete
- ✅ **Phase 2:** Update/sync functionality complete
- ✅ **Phase 3:** Validation and quality checks complete
- 📋 **Phase 4:** Advanced features (watch mode, caching, VSCode extension)

### Phase 3: Validation Features

- **ReadmeValidator:** Validates AI_README files for token count, structure, and quality
- **Flexible configuration:** Pass config directly in tool calls to customize validation rules
- **Auto-validation:** update_ai_readme tool automatically validates after changes
- **Standalone validation:** validate_ai_readmes tool for checking all READMEs
- **Quality scoring:** 0-100 score based on token count, structure, and issues
- **Token estimation:** Simple word-based formula (words × 1.3) for approximate token counting

## Configuration

### Validation Configuration (Optional)

Validation uses sensible defaults. You can customize rules by passing a `config` parameter when calling validation tools:

```typescript
// Example: Customize validation when calling validate_ai_readmes
{
  projectRoot: "/path/to/project",
  config: {
    maxTokens: 300,          // Stricter token limit
    rules: {
      requireH1: true,
      requireSections: ["## Architecture", "## Security"],
      allowCodeBlocks: true,
      maxLineLength: 120
    },
    tokenLimits: {
      excellent: 200,
      good: 300,
      warning: 500,
      error: 800
    }
  }
}
```

**Default values:**
- `maxTokens: 500`
- `requireH1: true`
- `allowCodeBlocks: true`
- `maxLineLength: 120`
- Token limits: excellent (<300), good (<500), warning (<800), error (>1200)

## When Modifying This Project

1. **Adding new MCP tools:** Follow the pattern in `src/tools/`
2. **Changing core logic:** Update tests first, ensure all 57 tests pass
3. **Path handling:** Always normalize to Unix-style paths
4. **Documentation:** Update relevant docs in `docs/` folder
5. **Breaking changes:** Update version number and CHANGELOG

## Related Documentation

- [Project Specification](./docs/SPEC.md) - Complete spec
- [Quick Start](./docs/QUICK_START.md) - User setup guide
- [Examples](./docs/EXAMPLES.md) - Usage examples

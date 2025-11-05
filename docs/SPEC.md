# MCP AI_README Manager - Project Specification

> **Purpose:** Build an MCP (Model Context Protocol) server to automatically manage and sync AI_README.md files across projects, enabling AI assistants to intelligently read and update relevant context documentation when modifying code.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Use Cases](#use-cases)
- [Implementation Specification](#implementation-specification)
- [API Design](#api-design)
- [Installation & Configuration](#installation--configuration)
- [Development Roadmap](#development-roadmap)

---

## Project Overview

### Background

In monorepos or multi-level projects, it's common to create `AI_README.md` files for different modules to document:
- Architectural conventions
- Coding standards
- Project-specific context
- Domain knowledge that AI assistants need to know

**Current Pain Points:**
1. When AI modifies frontend code, it doesn't know to read `apps/frontend/AI_README.md`
2. AI makes structural changes but forgets to update related AI_README files
3. Lack of automation to maintain consistency across these documentation files

### Solution

Develop an **MCP Server** that provides:
- **Smart Detection**: Automatically find the most relevant AI_README.md based on file paths
- **Context Injection**: Automatically inject relevant AI_README content into AI's prompt context
- **Bidirectional Sync**: Automatically update corresponding AI_README when AI modifies code
- **Version Tracking**: Record AI_README change history

---

## Core Features

### 1. AI_README File Discovery

```
Function: Automatically scan project and build an index of AI_README.md files

Input: Project root directory path
Output: {
  "projectRoot": "/path/to/project",
  "readmeFiles": [
    {
      "path": "AI_README.md",
      "scope": "root",
      "level": 0,
      "modules": ["*"]
    },
    {
      "path": "apps/frontend/AI_README.md",
      "scope": "frontend",
      "level": 1,
      "modules": ["apps/frontend/**"]
    },
    {
      "path": "apps/backend/AI_README.md",
      "scope": "backend",
      "level": 1,
      "modules": ["apps/backend/**"]
    }
  ]
}
```

**Implementation Details:**
- Recursive directory scanning
- Build glob pattern mapping table
- Support custom exclusion rules (node_modules, .git, etc.)

### 2. Context Routing

```
Function: Based on target file path, find all relevant AI_READMEs

Input: File path (e.g., "apps/frontend/src/components/Button.tsx")
Output: [
  {
    "path": "AI_README.md",
    "content": "...",  // Root-level general conventions
    "relevance": "root"
  },
  {
    "path": "apps/frontend/AI_README.md",
    "content": "...",  // Frontend-specific conventions
    "relevance": "direct"
  }
]
```

**Routing Logic:**
1. Find the nearest parent directory AI_README (direct match)
2. Recursively traverse up to find root-level AI_README (general conventions)
3. Sort by relevance (specific to general)

### 3. Prompt Enhancement

```
Function: Inject AI_README content into AI's system prompt

Mode A - Automatic (Recommended):
MCP automatically provides context in the background when AI modifies files

Mode B - Manual:
Provide a tool for AI to explicitly request context
```

**Prompt Template:**
```markdown
## 📚 Project Context for: {filePath}

### Root Conventions (AI_README.md)
{rootReadmeContent}

### Module-Specific Conventions ({scopePath}/AI_README.md)
{moduleReadmeContent}

---
**Important Reminders:**
- Follow the above conventions when making changes
- If your changes affect architecture or conventions, please update the relevant AI_README
```

### 4. AI_README Update

```
Function: Update corresponding AI_README when AI makes architectural changes

Input: {
  "targetPath": "apps/frontend/AI_README.md",
  "updates": [
    {
      "section": "## Directory Structure",
      "action": "append",
      "content": "├── src/utils/  # New utility functions"
    }
  ]
}

Output: {
  "success": true,
  "updatedPath": "apps/frontend/AI_README.md",
  "backup": ".ai_readme_history/frontend_20250105_143022.md"
}
```

**Update Strategy:**
- Support append, replace, delete operations
- Automatic backup to `.ai_readme_history/`
- Generate suggested git commit messages

### 5. Validation & Health Check

```
Function: Validate AI_README content integrity and consistency

Checks:
- Required sections exist (Directory Structure, Conventions, etc.)
- Cross-referenced links are valid
- Consistency with actual code structure
- Markdown syntax is correct

Output: {
  "valid": false,
  "issues": [
    {
      "file": "apps/frontend/AI_README.md",
      "line": 23,
      "issue": "Referenced file 'src/hooks/usePingApi.ts' does not exist"
    }
  ]
}
```

---

## Technical Architecture

### Recommended Tech Stack

**Primary Choice: TypeScript (Strongly Recommended)**

```
Technology Combination:
- Language: TypeScript 5.x
- Framework: @modelcontextprotocol/sdk
- File Processing: fs-extra, glob, minimatch
- Markdown Parsing: remark, unified
- Git Integration: simple-git
- Testing: Vitest
- Bundling: tsup
- Publishing: npm
```

### Project Structure

```
ai-readme-mcp/
├── src/
│   ├── index.ts                 # MCP Server entry point
│   ├── server.ts                # MCP Server main logic
│   ├── tools/                   # MCP Tools implementation
│   │   ├── discover.ts          # AI_README discovery
│   │   ├── getContext.ts        # Context routing
│   │   ├── updateReadme.ts      # AI_README updates
│   │   └── validate.ts          # Validation tool
│   ├── core/
│   │   ├── scanner.ts           # File scanning engine
│   │   ├── matcher.ts           # Path matching logic
│   │   ├── parser.ts            # Markdown parsing
│   │   └── updater.ts           # File update logic
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── utils/
│       ├── logger.ts            # Logging utility
│       ├── cache.ts             # Caching mechanism
│       └── git.ts               # Git operations
├── tests/
│   ├── fixtures/                # Test project samples
│   │   └── sample-monorepo/
│   │       ├── AI_README.md
│   │       ├── apps/
│   │       │   ├── frontend/AI_README.md
│   │       │   └── backend/AI_README.md
│   └── *.test.ts
├── docs/
│   ├── API.md                   # API documentation
│   ├── INTEGRATION.md           # Integration guide
│   └── EXAMPLES.md              # Usage examples
├── package.json
├── tsconfig.json
├── tsup.config.ts               # Build configuration
└── README.md
```

---

## Use Cases

### Scenario 1: AI Modifies Frontend Component

**Context:** AI needs to create `apps/frontend/src/components/atoms/Button.tsx`

**Flow:**
1. Claude Code detects operation on file under `apps/frontend/`
2. MCP Server automatically triggers `getContext` tool
3. Returns:
   - `AI_README.md` (root-level conventions)
   - `apps/frontend/AI_README.md` (frontend conventions)
4. Claude creates Button component following Atomic Design conventions

### Scenario 2: AI Refactors Project Structure

**Context:** AI adds `apps/backend/services/` directory

**Flow:**
1. AI creates new directory and files
2. AI calls `updateReadme` tool
3. Updates Directory Structure section in `apps/backend/AI_README.md`
4. Automatically backs up old version to `.ai_readme_history/`
5. Prompts user to commit changes

### Scenario 3: Multi-Developer Project Health Check

**Context:** Periodic validation of AI_README correctness

**Flow:**
1. CI/CD executes `validate` tool
2. Checks all AI_README cross-references
3. Validates directory structure descriptions match reality
4. Generates report, marks sections needing updates

---

## Implementation Specification

### MCP Tools Definition

#### 1. `discover_ai_readmes`

```typescript
{
  name: "discover_ai_readmes",
  description: "Scan the project and discover all AI_README.md files",
  inputSchema: {
    type: "object",
    properties: {
      projectRoot: {
        type: "string",
        description: "The root directory of the project"
      },
      excludePatterns: {
        type: "array",
        items: { type: "string" },
        description: "Glob patterns to exclude (e.g., ['node_modules/**', '.git/**'])"
      }
    },
    required: ["projectRoot"]
  }
}
```

#### 2. `get_context_for_file`

```typescript
{
  name: "get_context_for_file",
  description: "Get relevant AI_README context for a specific file path",
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "The file path to get context for (relative to project root)"
      },
      includeRoot: {
        type: "boolean",
        description: "Whether to include root-level AI_README (default: true)"
      }
    },
    required: ["filePath"]
  }
}
```

#### 3. `update_ai_readme`

```typescript
{
  name: "update_ai_readme",
  description: "Update an AI_README.md file with new content",
  inputSchema: {
    type: "object",
    properties: {
      readmePath: {
        type: "string",
        description: "Path to the AI_README.md file"
      },
      section: {
        type: "string",
        description: "The section heading to update (e.g., '## Directory Structure')"
      },
      action: {
        type: "string",
        enum: ["append", "replace", "delete"],
        description: "The type of update to perform"
      },
      content: {
        type: "string",
        description: "The content to add or replace"
      },
      createBackup: {
        type: "boolean",
        description: "Whether to create a backup (default: true)"
      }
    },
    required: ["readmePath", "section", "action"]
  }
}
```

#### 4. `validate_ai_readmes`

```typescript
{
  name: "validate_ai_readmes",
  description: "Validate all AI_README files in the project",
  inputSchema: {
    type: "object",
    properties: {
      projectRoot: {
        type: "string",
        description: "The root directory of the project"
      },
      checks: {
        type: "array",
        items: {
          type: "string",
          enum: ["structure", "links", "consistency", "syntax"]
        },
        description: "Types of validation to perform"
      }
    },
    required: ["projectRoot"]
  }
}
```

### MCP Resources Definition (Optional)

```typescript
{
  uri: "ai-readme://project/index",
  name: "AI_README Index",
  description: "Index of all AI_README files in the project",
  mimeType: "application/json"
}
```

---

## API Design

### Core Classes

#### `AIReadmeScanner`

```typescript
class AIReadmeScanner {
  constructor(projectRoot: string, options?: ScannerOptions);

  async scan(): Promise<ReadmeIndex>;
  async watch(): Promise<void>; // Monitor file changes
  async refresh(): Promise<void>;
}

interface ReadmeIndex {
  projectRoot: string;
  readmes: ReadmeEntry[];
  lastUpdated: Date;
}

interface ReadmeEntry {
  path: string;
  scope: string;
  level: number;
  patterns: string[];
  content?: string;
}
```

#### `ContextRouter`

```typescript
class ContextRouter {
  constructor(index: ReadmeIndex);

  getContextForFile(filePath: string): ReadmeContext[];
  getContextForPattern(pattern: string): ReadmeContext[];
}

interface ReadmeContext {
  path: string;
  content: string;
  relevance: 'root' | 'direct' | 'parent';
  distance: number; // Directory level distance
}
```

#### `ReadmeUpdater`

```typescript
class ReadmeUpdater {
  constructor(options?: UpdaterOptions);

  async updateSection(
    readmePath: string,
    section: string,
    action: UpdateAction,
    content: string
  ): Promise<UpdateResult>;

  async createBackup(filePath: string): Promise<string>;
  async restoreBackup(backupPath: string): Promise<void>;
}

type UpdateAction = 'append' | 'replace' | 'delete';

interface UpdateResult {
  success: boolean;
  updatedPath: string;
  backupPath?: string;
  diff: string;
}
```

#### `ReadmeValidator`

```typescript
class ReadmeValidator {
  constructor(projectRoot: string);

  async validate(checks: ValidationCheck[]): Promise<ValidationReport>;
  async validateStructure(readmePath: string): Promise<StructureIssue[]>;
  async validateLinks(readmePath: string): Promise<LinkIssue[]>;
  async validateConsistency(): Promise<ConsistencyIssue[]>;
}

interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
}
```

---

## Installation & Configuration

### User Installation Steps

#### 1. Install MCP Server

```bash
# Install from npm
npm install -g ai-readme-mcp

# Or use npx (no global install needed)
npx ai-readme-mcp
```

#### 2. Configure Claude Code

Add to Claude Code configuration file:

**Method A: Using `claude_desktop_config.json`**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["-y", "ai-readme-mcp"],
      "env": {
        "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

**Method B: Using Project-Local Configuration**

Create `.claude/mcp.json` in project root:

```json
{
  "ai-readme-manager": {
    "enabled": true,
    "autoInject": true,
    "excludePatterns": [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**"
    ],
    "backupDir": ".ai_readme_history",
    "validation": {
      "onSave": true,
      "checks": ["structure", "links", "consistency"]
    }
  }
}
```

#### 3. Initialize Project

```bash
# Run in project root directory
npx ai-readme-mcp init

# Output:
# ✓ Discovered 3 AI_README.md files
# ✓ Created index at .ai_readme_cache/index.json
# ✓ Validated all files (0 issues found)
```

---

## Development Roadmap

### Phase 1: MVP (Core Features)

**Goal: Basic discovery and context injection**

- [ ] Implement `AIReadmeScanner`
- [ ] Implement `ContextRouter`
- [ ] Create `discover_ai_readmes` tool
- [ ] Create `get_context_for_file` tool
- [ ] Write basic tests
- [ ] Write README and API documentation

**Estimated Time: 2-3 weeks**

### Phase 2: Update & Sync

**Goal: Bidirectional sync capability**

- [ ] Implement `ReadmeUpdater`
- [ ] Create `update_ai_readme` tool
- [ ] Implement backup mechanism
- [ ] Integrate Git operations
- [ ] Add diff preview functionality

**Estimated Time: 2 weeks**

### Phase 3: Validation & Quality

**Goal: Ensure AI_README quality**

- [ ] Implement `ReadmeValidator`
- [ ] Create `validate_ai_readmes` tool
- [ ] Add CI/CD integration examples
- [ ] Implement auto-fix suggestions

**Estimated Time: 1-2 weeks**

### Phase 4: Advanced Features

**Goal: Enhanced user experience**

- [ ] Implement file watching (watch mode)
- [ ] Add caching mechanism
- [ ] Create VSCode Extension
- [ ] Support custom templates
- [ ] Multi-language AI_README support

**Estimated Time: 2-3 weeks**

### Phase 5: Ecosystem Integration

**Goal: Wide adoption**

- [ ] Publish to npm
- [ ] Create Claude Code Plugin
- [ ] Write detailed tutorials
- [ ] Build example project repository
- [ ] Community feedback & iteration

**Estimated Time: Ongoing**

---

## Development Environment Setup

### Prerequisites

- Node.js 18+
- pnpm/npm/yarn
- Git
- TypeScript 5+

### Quick Start

```bash
# 1. Create project
mkdir ai-readme-mcp
cd ai-readme-mcp

# 2. Initialize
pnpm init

# 3. Install dependencies
pnpm add @modelcontextprotocol/sdk zod
pnpm add -D typescript @types/node vitest tsup

# 4. Setup TypeScript
pnpm tsc --init

# 5. Create basic structure
mkdir -p src/{tools,core,types,utils}
touch src/index.ts src/server.ts

# 6. Start development
pnpm dev
```

### package.json Example

```json
{
  "name": "ai-readme-mcp",
  "version": "0.1.0",
  "description": "MCP server for managing AI_README.md files in projects",
  "type": "module",
  "bin": {
    "ai-readme-mcp": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.22.4",
    "glob": "^10.3.10",
    "minimatch": "^9.0.3",
    "fs-extra": "^11.2.0",
    "remark": "^15.0.1",
    "remark-parse": "^11.0.0",
    "unified": "^11.0.4",
    "simple-git": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/fs-extra": "^11.0.4",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "tsup": "^8.0.1"
  },
  "keywords": [
    "mcp",
    "ai",
    "readme",
    "context",
    "claude",
    "llm"
  ],
  "license": "MIT"
}
```

---

## Testing Strategy

### Test Architecture

```
tests/
├── unit/
│   ├── scanner.test.ts
│   ├── router.test.ts
│   ├── updater.test.ts
│   └── validator.test.ts
├── integration/
│   ├── mcp-tools.test.ts
│   └── end-to-end.test.ts
├── fixtures/
│   ├── sample-monorepo/
│   │   ├── AI_README.md
│   │   ├── apps/
│   │   │   ├── frontend/
│   │   │   │   ├── AI_README.md
│   │   │   │   └── src/components/Button.tsx
│   │   │   └── backend/
│   │   │       ├── AI_README.md
│   │   │       └── main.py
│   └── invalid-project/
└── helpers/
    └── test-utils.ts
```

### Key Test Cases

```typescript
describe('ContextRouter', () => {
  it('should find direct parent AI_README', () => {
    const context = router.getContextForFile('apps/frontend/src/Button.tsx');
    expect(context).toHaveLength(2);
    expect(context[0].relevance).toBe('direct');
    expect(context[0].path).toBe('apps/frontend/AI_README.md');
  });

  it('should handle nested directories correctly', () => {
    const context = router.getContextForFile('apps/frontend/src/components/atoms/Button.tsx');
    // Should still find apps/frontend/AI_README.md and root-level
    expect(context.some(c => c.path === 'apps/frontend/AI_README.md')).toBe(true);
  });

  it('should prioritize by distance', () => {
    const context = router.getContextForFile('apps/backend/main.py');
    expect(context[0].distance).toBeLessThan(context[1].distance);
  });
});
```

---

## Documentation Guide

### README.md Structure

```markdown
# AI_README MCP Server

> Intelligent context management for AI_README.md files in your projects

## Features
- 🔍 Automatic discovery of AI_README files
- 🎯 Smart context routing based on file paths
- 🔄 Bidirectional sync (read + update)
- ✅ Validation and health checks
- 🚀 Easy integration with Claude Code

## Quick Start
[Installation & configuration steps]

## How It Works
[Use cases and flow diagrams]

## API Reference
[Tool definitions and examples]

## Configuration
[Configuration options]

## Examples
[Real-world usage examples]

## Contributing
[Contribution guide]

## License
MIT
```

---

## Extensibility Considerations

### Support for Other AI Assistants

Design with generality in mind, beyond Claude Code, also support:
- GitHub Copilot
- Cursor
- Continue.dev
- Generic MCP clients

### Support for Other Context File Formats

Future expansion to support:
- `.ai-context.yaml`
- `.cursorrules`
- `.github/AI_GUIDELINES.md`

### Plugin System

Allow users to customize:
- Validation rules
- Update strategies
- File naming patterns

---

## FAQ

### Q1: Why not just use Claude's Project Knowledge?

**A:** Project Knowledge is static global knowledge, while AI_README Manager provides:
- Dynamic, path-based context routing
- Bidirectional sync (AI can update documentation)
- Modular context management (different conventions for different directories)

### Q2: How's the performance? Will large monorepos be slow?

**A:** Multi-layer optimization:
- Build index cache after first scan
- Support incremental updates (watch mode)
- Only load needed AI_READMEs (lazy loading)

### Q3: What if AI_READMEs conflict?

**A:** Hierarchical override strategy:
- More specific conventions take precedence (subdirectory > parent)
- Explicitly mark conflicts and prompt user

### Q4: Can it be used in non-monorepo projects?

**A:** Absolutely! Even with just a root-level AI_README.md, it still provides:
- Automatic context injection
- Update management
- Validation features

---

## Reference Resources

### MCP Related

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)

### Example Projects

- [MCP Servers Collection](https://github.com/modelcontextprotocol/servers)
- Reference your monorepo structure:
  - `AI_README.md` (root level)
  - `apps/frontend/AI_README.md`
  - `apps/backend/AI_README.md`

### Related Tools

- [unified](https://unifiedjs.com/) - Markdown AST processing
- [remark](https://remark.js.org/) - Markdown parser
- [simple-git](https://github.com/steveukx/git-js) - Git operations

---

## License

MIT License

---

## Contact

- GitHub Issues: [project-repo]/issues
- Discord: [community-link]
- Email: [maintainer-email]

---

## Next Steps

1. ✅ Read and understand this specification document
2. ⚙️ Create new GitHub repository: `ai-readme-mcp`
3. 🛠️ Start implementation following Phase 1 roadmap
4. 📝 Reference [MCP TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/examples)
5. 🧪 Use your monorepo as a test case

**Estimated Total Development Time: 8-12 weeks**

Happy coding! 🚀

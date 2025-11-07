# AI_README MCP Server

> Intelligent context management for AI_README.md files in your projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 📋 Overview

AI_README MCP Server is a Model Context Protocol (MCP) server that automatically manages and syncs AI_README.md files across your projects. It enables AI assistants to intelligently read and update relevant context documentation when modifying code.

## ✨ Features

### Available Now

- 🔍 **Automatic Discovery** - Scan and index all AI_README.md files in your project (Phase 1)
- 🎯 **Smart Context Routing** - Find relevant README content based on file paths (Phase 1)
- 🔄 **Update & Sync** - AI can both read and update AI_README files (Phase 2)
- 📦 **Easy Integration** - Works seamlessly with Claude Code and other MCP clients
- 🧪 **Well Tested** - 36 unit tests, 100% passing

### Coming Soon

- ✅ **Validation & Health Checks** - Ensure README consistency and integrity (Phase 3)
- 🎬 **Watch Mode** - Auto-sync changes to README files (Phase 4)

## 🚀 Quick Start

### Installation

> **Note:** Currently requires manual installation. npm package coming soon!

**Step 1: Clone and Build**

```bash
# Clone this repository to a permanent location
git clone https://github.com/Draco-Cheng/ai-readme-mcp.git ~/ai-readme-mcp
cd ~/ai-readme-mcp

# Install and build
npm install
npm run build
```

**Step 2: Configure in Your Projects**

See configuration section below to set up the MCP server in your projects.

### Configuration for Claude Code (VSCode Extension)

**Option 1: Using CLI (Recommended)**

In your project directory, run:

```bash
# If you cloned to ~/ai-readme-mcp:
claude mcp add --transport stdio ai-readme-manager --scope project -- node ~/ai-readme-mcp/dist/index.js

# Or use absolute path:
claude mcp add --transport stdio ai-readme-manager --scope project -- node /path/to/ai-readme-mcp/dist/index.js
```

This creates a `.mcp.json` file in your project root.

**Option 2: Manual Configuration**

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/ai-readme-mcp/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/ai-readme-mcp` with your actual installation path.

**Path examples:**
- **Windows:** `"C:\\Users\\YourName\\ai-readme-mcp\\dist\\index.js"`
- **macOS/Linux:** `"~/ai-readme-mcp/dist/index.js"` or `"/home/username/ai-readme-mcp/dist/index.js"`

> 💡 **Tip:** Clone to a permanent location like `~/ai-readme-mcp` so the path stays consistent across projects.

**Verify Installation:**

```bash
claude mcp get ai-readme-manager
```

You should see `Status: ✓ Connected`

### Configuration for Claude Desktop Application

Add to `claude_desktop_config.json`:

**Windows:** `%APPDATA%\claude\claude_desktop_config.json`
**macOS/Linux:** `~/.config/claude/config.json` or `~/Library/Application Support/Claude/config.json`

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "node",
      "args": ["/absolute/path/to/ai-readme-mcp/dist/index.js"]
    }
  }
}
```

Replace with your actual path. See examples in Claude Code configuration above.

### Create Your First AI_README

Create `AI_README.md` in your project root:

```markdown
# My Project

## Architecture
- Framework: React + Express
- Database: PostgreSQL

## Coding Conventions
- Use TypeScript for all files
- Components in PascalCase
- Test coverage: 80%+

## Testing
Run tests with: `npm test`
```

### Test the Integration

Restart Claude Code, then ask:

> "I'm about to create a new component. What conventions should I follow?"

Claude will use the MCP server to retrieve your AI_README context!

For detailed setup instructions, see [Quick Start Guide](./docs/QUICK_START.md).

## 🏗️ Project Structure

```
ai-readme-mcp/
├── src/
│   ├── index.ts           # MCP Server entry point
│   ├── tools/             # MCP Tools implementation
│   ├── core/              # Core logic (scanner, router, updater)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test fixtures
└── docs/                  # Documentation
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn
- TypeScript 5+

### Setup

```bash
# Clone the repository
git clone https://github.com/Draco-Cheng/ai-readme-mcp.git
cd ai-readme-mcp

# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm test

# Build the project
npm run build

# Development mode with watch
npm run dev
```

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get started in 10 minutes
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- [Project Specification](./docs/SPEC.md) - Complete technical specification
- [AI_README Templates](./docs/templates/) - Example templates for your projects

## 🛠️ Available MCP Tools

### `discover_ai_readmes`

Scans your project and discovers all AI_README.md files.

```typescript
// Parameters
{
  projectRoot: string;           // Required: Project root directory
  excludePatterns?: string[];    // Optional: Glob patterns to exclude
}

// Returns
{
  projectRoot: string;
  totalFound: number;
  readmeFiles: Array<{
    path: string;
    scope: string;
    level: number;
    patterns: string[];
  }>;
  lastUpdated: string;
}
```

### `get_context_for_file`

Gets relevant AI_README context for a specific file path.

```typescript
// Parameters
{
  projectRoot: string;           // Required: Project root directory
  filePath: string;              // Required: File path relative to root
  includeRoot?: boolean;         // Optional: Include root README (default: true)
  excludePatterns?: string[];    // Optional: Glob patterns to exclude
}

// Returns
{
  filePath: string;
  totalContexts: number;
  contexts: Array<{
    path: string;
    relevance: 'root' | 'direct' | 'parent';
    distance: number;
    content: string;
  }>;
  formattedPrompt: string;       // Ready-to-use formatted context
}
```

### `update_ai_readme`

Update an AI_README.md file with specified operations.

```typescript
// Parameters
{
  readmePath: string;            // Required: Path to AI_README.md file
  operations: Array<{            // Required: Update operations to perform
    type: 'append' | 'prepend' | 'replace' | 'insert-after' | 'insert-before';
    content: string;             // Content to add or replace
    section?: string;            // Section heading (for insert operations)
    searchText?: string;         // Text to search for (for replace)
  }>;
}

// Returns
{
  success: boolean;
  readmePath: string;
  changes: Array<{
    operation: string;
    section?: string;
    linesAdded: number;
    linesRemoved: number;
  }>;
  summary: string;               // Includes reminder to use git diff
  error?: string;                // Error message if failed
}
```

**Note:** Changes are written directly to the file. Use Git for version control:
- Review changes: `git diff AI_README.md`
- Undo changes: `git checkout AI_README.md`
- Commit changes: `git add AI_README.md && git commit -m "Update AI_README"`
```

**Example Usage:**

```typescript
// Append new section
{
  readmePath: "apps/frontend/AI_README.md",
  operations: [{
    type: "append",
    content: "## Performance\n- Use React.memo for expensive components"
  }]
}

// Insert after specific section
{
  readmePath: "AI_README.md",
  operations: [{
    type: "insert-after",
    section: "## Coding Conventions",
    content: "### Code Style\n- Use TypeScript strict mode\n- Prefer const over let"
  }]
}

// Replace specific text
{
  readmePath: "AI_README.md",
  operations: [{
    type: "replace",
    searchText: "Run tests with npm test",
    content: "Run tests with: `npm test` or `npm run test:watch`"
  }]
}
```

## 🗺️ Development Roadmap

### Phase 0: Initial Setup ✅ COMPLETED
- [x] Project structure
- [x] TypeScript configuration
- [x] Build tooling (tsup)
- [x] Testing setup (Node.js native test runner)
- [x] Basic type definitions

### Phase 1: MVP (Core Features) ✅ COMPLETED
- [x] Implement AIReadmeScanner
- [x] Implement ContextRouter
- [x] Create `discover_ai_readmes` tool
- [x] Create `get_context_for_file` tool
- [x] Write comprehensive tests (26 tests, all passing)
- [x] MCP server integration
- [x] Documentation and templates

### Phase 2: Update & Sync ✅ COMPLETED
- [x] Implement ReadmeUpdater
- [x] Create `update_ai_readme` tool
- [x] Support 5 operation types (append, prepend, replace, insert-after, insert-before)
- [x] Write comprehensive tests (36 tests total, all passing)

### Phase 3: Validation & Quality 📋 NEXT
- [ ] Implement ReadmeValidator
- [ ] Create `validate_ai_readmes` tool
- [ ] Health check functionality

### Phase 4: Advanced Features
- [ ] Watch mode for auto-sync
- [ ] Performance optimization and caching
- [ ] VSCode Extension

### Phase 5: Distribution
- [ ] Publish to npm registry
- [ ] Add npx support for easier installation
- [ ] CI/CD pipeline for automated releases

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Resources

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)

## 📧 Contact

- GitHub Issues: https://github.com/Draco-Cheng/ai-readme-mcp/issues
- Project Link: https://github.com/Draco-Cheng/ai-readme-mcp

---

**Status:** 🚧 In Development | **Version:** 0.1.0 | **Last Updated:** 2025-11-05

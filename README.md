# AI_README MCP Server

> Intelligent context management for AI_README.md files in your projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 📋 Overview

AI_README MCP Server is a Model Context Protocol (MCP) server that automatically manages and syncs AI_README.md files across your projects. It enables AI assistants to intelligently read and update relevant context documentation when modifying code.

## ✨ Features

### Available Now (Phase 1 Complete)

- 🔍 **Automatic Discovery** - Scan and index all AI_README.md files in your project
- 🎯 **Smart Context Routing** - Find relevant README content based on file paths
- 📦 **Easy Integration** - Works seamlessly with Claude Code and other MCP clients
- 🧪 **Well Tested** - 26 unit tests, 100% passing

### Coming Soon

- 🔄 **Bidirectional Sync** - AI can both read and update AI_README files (Phase 2)
- ✅ **Validation & Health Checks** - Ensure README consistency and integrity (Phase 3)

## 🚀 Quick Start

### Installation

#### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-readme-mcp.git
cd ai-readme-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

#### Option 2: Using npx (when published)

```bash
npx ai-readme-mcp
```

### Configuration for Claude Code

Add to your Claude Code MCP configuration file:

**Windows:** `%APPDATA%\claude\claude_desktop_config.json`
**macOS/Linux:** `~/.config/claude/config.json` or `~/Library/Application Support/Claude/config.json`

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "node",
      "args": ["d:/Home/WorkSpace/playground/ai-readme-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

Replace the path with your actual installation path.

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
git clone https://github.com/yourusername/ai-readme-mcp.git
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

- [Quick Start Guide](./docs/QUICK_START.md) - Get started in 5 minutes
- [MCP Configuration](./docs/MCP_CONFIG.md) - Detailed configuration guide
- [Project Specification](./docs/SPEC.md) - Complete project specification
- [AI_README Templates](./docs/templates/) - Example templates for your projects
  - [Root-level Template](./docs/templates/ROOT_AI_README_TEMPLATE.md)
  - [Frontend Template](./docs/templates/FRONTEND_AI_README_TEMPLATE.md)
  - [Backend Template](./docs/templates/BACKEND_AI_README_TEMPLATE.md)

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

### Phase 2: Update & Sync 📋 NEXT
- [ ] Implement ReadmeUpdater
- [ ] Create `update_ai_readme` tool
- [ ] Backup mechanism

### Phase 3: Validation & Quality
- [ ] Implement ReadmeValidator
- [ ] Create `validate_ai_readmes` tool

### Phase 4: Advanced Features
- [ ] Watch mode
- [ ] Caching
- [ ] VSCode Extension

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Resources

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)

## 📧 Contact

- GitHub Issues: [project-repo]/issues
- Project Link: [https://github.com/yourusername/ai-readme-mcp](https://github.com/yourusername/ai-readme-mcp)

---

**Status:** 🚧 In Development | **Version:** 0.1.0 | **Last Updated:** 2025-11-05

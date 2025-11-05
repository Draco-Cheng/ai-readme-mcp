# AI_README MCP Server

> Intelligent context management for AI_README.md files in your projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 📋 Overview

AI_README MCP Server is a Model Context Protocol (MCP) server that automatically manages and syncs AI_README.md files across your projects. It enables AI assistants to intelligently read and update relevant context documentation when modifying code.

## ✨ Features (Planned)

- 🔍 **Automatic Discovery** - Scan and index all AI_README.md files in your project
- 🎯 **Smart Context Routing** - Find relevant README content based on file paths
- 🔄 **Bidirectional Sync** - AI can both read and update AI_README files
- ✅ **Validation & Health Checks** - Ensure README consistency and integrity
- 📦 **Easy Integration** - Works seamlessly with Claude Code and other MCP clients

## 🚀 Quick Start

> **Note:** This project is currently in active development (Phase 0 - Initial Setup)

### Installation

```bash
npm install -g ai-readme-mcp
```

### Configuration

Add to your Claude Code configuration:

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

- [Project Specification](./SPEC.md) - Detailed project specification
- [API Documentation](./docs/API.md) - Coming soon
- [Integration Guide](./docs/INTEGRATION.md) - Coming soon

## 🗺️ Development Roadmap

### Phase 0: Initial Setup ✅ (Current)
- [x] Project structure
- [x] TypeScript configuration
- [x] Build tooling (tsup)
- [x] Testing setup (vitest)
- [x] Basic type definitions

### Phase 1: MVP (Core Features) 🚧
- [ ] Implement AIReadmeScanner
- [ ] Implement ContextRouter
- [ ] Create `discover_ai_readmes` tool
- [ ] Create `get_context_for_file` tool
- [ ] Write basic tests

### Phase 2: Update & Sync
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

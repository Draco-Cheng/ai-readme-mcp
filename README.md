# AI_README MCP Server

> Intelligent context management for AI_README.md files in your projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 📋 Overview

AI_README MCP Server is a Model Context Protocol (MCP) server that automatically manages and syncs AI_README.md files across your projects. It enables AI assistants to intelligently read and update relevant context documentation when modifying code.

### Why AI_README?

When working with AI assistants on code projects, **consistency and quality matter**. This tool helps teams:

- **🤝 Standardize AI interactions** - Ensure all team members and AI assistants follow the same coding standards, conventions, and best practices
- **📈 Improve AI output quality** - By providing clear, structured context, AI generates more accurate and consistent code that matches your project's style
- **🎯 Maintain consistency across teams** - When multiple developers use AI assistants, AI_README ensures everyone gets the same guidelines and standards
- **⚡ Save time on onboarding** - New team members and AI assistants instantly understand project conventions without lengthy explanations
- **🔄 Keep documentation in sync** - AI can automatically update README files as the project evolves, maintaining up-to-date documentation

Think of it as a **"style guide and context manager for AI"** - ensuring every AI interaction in your project follows your team's standards and produces high-quality, consistent output.

## ✨ Features

- 🔍 **Automatic Discovery** - Scan and index all AI_README.md files in your project
- 🎯 **Smart Context Routing** - Find relevant README content based on file paths
- 🔄 **Update & Sync** - AI can both read and update AI_README files
- ✅ **Validation & Quality** - Ensure README consistency with token limits and structure checks
- 📝 **Template System** - Initialize new AI_README files from templates
- 📦 **Easy Integration** - Works seamlessly with Cursor, Claude Code, and other MCP clients


## 🚀 Quick Start

### Installation

**Option 1: Using npx (Recommended - After npm publish)**

No installation needed! Just configure and use via npx:

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["-y", "ai-readme-mcp"]
    }
  }
}
```

The `-y` flag automatically accepts the npx prompt.

**Option 2: Global Installation (After npm publish)**

```bash
npm install -g ai-readme-mcp
```

Then configure:

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "ai-readme-mcp"
    }
  }
}
```

**Option 3: Local Development (Current)**

> **Note:** Use this method before npm package is published.

```bash
# Clone this repository to a permanent location
git clone https://github.com/Draco-Cheng/ai-readme-mcp.git ~/ai-readme-mcp
cd ~/ai-readme-mcp

# Install and build
npm install
npm run build
```

Then see configuration section below for manual setup.

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

### Configuration for Cursor

Add to Cursor's MCP configuration file:

**Windows:** `%APPDATA%\Cursor\User\mcp.json`
**macOS/Linux:** `~/.cursor/mcp.json`

**After npm publish (Recommended):**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["-y", "ai-readme-mcp"]
    }
  }
}
```

**Or if globally installed:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "ai-readme-mcp"
    }
  }
}
```

**Current (local development):**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "node",
      "args": [
        "D:\\Home\\WorkSpace\\playground\\ai-readme-mcp\\dist\\index.js"
      ]
    }
  }
}
```

**Verify Installation:**

After configuring, restart Cursor completely. The MCP server should be available to AI assistants in Cursor.

### Configuration for Claude Desktop Application

Add to `claude_desktop_config.json`:

**Windows:** `%APPDATA%\claude\claude_desktop_config.json`
**macOS/Linux:** `~/.config/claude/config.json` or `~/Library/Application Support/Claude/config.json`

**After npm publish (Recommended):**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["-y", "ai-readme-mcp"]
    }
  }
}
```

**Or if globally installed:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "ai-readme-mcp"
    }
  }
}
```

**Current (local development):**

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

## 🚀 What's Next

We're actively working on new features:

- **Watch Mode** - Auto-sync changes when AI_README files are modified
- **Performance Optimization** - Caching and incremental updates
- **VSCode Extension** - Visual interface for managing AI_README files
- **CI/CD Integration** - GitHub Actions for automated README validation

Want to contribute? Check out our [Contributing Guide](./CONTRIBUTING.md)!

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

**Status:** ✅ Published | **Version:** 0.2.0 | **Last Updated:** 2025-11-07

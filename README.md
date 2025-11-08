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
- 🤖 **Smart Initialization** - Auto-generate AI_README files based on project analysis
- 🏗️ **Monorepo Support** - Place AI_README.md files at different folder levels; the tool automatically finds and uses the most relevant one
- 📦 **Easy Integration** - Works seamlessly with Cursor, Claude Code, and other MCP clients


## 🚀 Quick Start

### Installation

**Option 1: Using npx (Recommended)**

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

**Option 2: Global Installation**

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

**Option 3: Local Development**

> **Note:** Use this method if you want to modify or contribute to the source code.

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

**Using npx (Recommended):**

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

**If globally installed:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "ai-readme-mcp"
    }
  }
}
```

**For local development:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "node",
      "args": ["/path/to/ai-readme-mcp/dist/index.js"]
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

**Using npx (Recommended):**

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

**If globally installed:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "ai-readme-mcp"
    }
  }
}
```

**For local development:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "node",
      "args": ["/path/to/ai-readme-mcp/dist/index.js"]
    }
  }
}
```

### Create Your First AI_README

You can use the `init_ai_readme` MCP tool to automatically generate a customized AI_README.md based on your project:

**Smart Mode (Default)**:
The tool automatically detects your project and generates relevant content:
- Detects project type (library/application/monorepo)
- Identifies language (TypeScript, Python, Go, Rust, Java, etc.)
- Recognizes framework (React, Vue, Next.js, Express, NestJS, etc.)
- Analyzes directory structure
- Generates framework-specific conventions

Ask your AI assistant:
> "Please use init_ai_readme to create an AI_README.md for this project"

Or create manually:

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

### Multi-Level AI_README (Not Just for Monorepos!)

**The power of this tool is multi-level documentation** - not just for monorepos, but for **any project** that wants to organize conventions by module or feature.

**Why multi-level?**
- 🎯 **Avoid bloated root README** - Keep each README focused and concise
- 📍 **Precise context** - AI gets only the relevant conventions for the code it's working on
- 🔧 **Flexible organization** - Organize by feature, module, or any structure that makes sense

Simply place `AI_README.md` files at different folder levels:

```
my-monorepo/
├── AI_README.md                    # Root-level conventions (applies to all)
├── apps/
│   ├── frontend/
│   │   ├── AI_README.md           # Frontend-specific conventions
│   │   └── src/components/Button.tsx
│   └── backend/
│       ├── AI_README.md           # Backend-specific conventions
│       └── src/api/users.ts
└── packages/
    └── shared/
        ├── AI_README.md           # Shared library conventions
        └── src/utils.ts
```

**Smart Empty README Handling:**
- 📝 If you create an empty `AI_README.md` in a subdirectory, the tool can auto-fill it with relevant conventions
- 🔗 For subdirectories with parent READMEs, generates differential content (only module-specific conventions)
- 📋 For root directories, generates full project analysis
- Ask your AI: "This AI_README.md is empty, can you help fill it?"

When AI works on a file, it automatically gets:
- The **most relevant** AI_README (closest parent directory)
- Plus the **root-level** AI_README (for project-wide standards)

For example, when editing `apps/frontend/src/components/Button.tsx`:
- ✅ Gets `apps/frontend/AI_README.md` (React component standards)
- ✅ Gets root `AI_README.md` (project-wide Git, testing conventions)

### Test the Integration

Restart your IDE, then ask your AI assistant:

> "I'm about to create a new component. What conventions should I follow?"

The AI will automatically retrieve your AI_README context!

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

## 🛠️ Available MCP Tools

### `init_ai_readme`

Initialize a new AI_README.md file with smart content generation based on project analysis.

```typescript
// Parameters
{
  targetPath: string;              // Required: Directory where AI_README.md will be created
  projectName?: string;            // Optional: Project name (auto-detected if not provided)
  overwrite?: boolean;             // Optional: Overwrite existing file (default: false)
  smart?: boolean;                 // Optional: Enable smart content generation (default: true)
}

// Returns
{
  success: boolean;
  readmePath: string;
  action: 'created' | 'filled' | 'overwritten';
  projectInfo?: {
    projectName: string;
    projectType: 'library' | 'application' | 'monorepo' | 'unknown';
    language: string;
    framework?: string;
    packageManager?: string;
    hasTests: boolean;
    mainDirs: string[];
  };
  message: string;
}
```

**Smart Mode Features**:
- Auto-detects project type, language, and framework
- Generates framework-specific conventions (React, Vue, Python, etc.)
- For subdirectories with parent READMEs, generates differential content
- Handles empty files (< 50 chars) by auto-filling them
- Analyzes directory structure and dependencies

**Example Usage**:

```typescript
// Create smart README for React project
{
  targetPath: "/path/to/react-app",
  smart: true
}
// Result: Auto-detects React, generates component naming conventions, etc.

// Fill empty subdirectory README
{
  targetPath: "/path/to/monorepo/apps/frontend"
}
// Result: Generates differential content extending root README
```

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

### `validate_ai_readmes`

Validate all AI_README.md files in your project for quality and token efficiency.

```typescript
// Parameters
{
  projectRoot: string;             // Required: Project root directory
  excludePatterns?: string[];      // Optional: Glob patterns to exclude
  config?: {                       // Optional: Custom validation config
    maxTokens?: number;
    rules?: {
      requireH1?: boolean;
      requireSections?: string[];
      allowCodeBlocks?: boolean;
      maxLineLength?: number;
    };
    tokenLimits?: {
      excellent?: number;          // Default: 200
      good?: number;              // Default: 400
      warning?: number;           // Default: 600
      error?: number;             // Default: 1000
    };
  };
}

// Returns
{
  valid: boolean;
  totalFiles: number;
  results: Array<{
    path: string;
    valid: boolean;
    tokens: number;
    rating: 'excellent' | 'good' | 'needs-improvement' | 'too-long';
    issues: string[];
    suggestions: string[];
  }>;
  summary: string;
}
```

**Validation Features**:
- Token counting for AI consumption optimization
- Structure validation (H1 heading, sections)
- Line length checks (default: 100 chars)
- Code block detection (disabled by default for strict mode)
- Quality ratings based on token count

**Default Token Limits (Strict Mode)**:
- 🌟 Excellent: < 200 tokens
- ✅ Good: < 400 tokens
- ⚠️ Needs improvement: < 600 tokens
- ❌ Too long: > 1000 tokens

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

**Status:** ✅ Published | **Version:** 0.3.0 | **Last Updated:** 2025-11-08

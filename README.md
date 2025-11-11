# AI_README MCP Server

> A smart documentation system that helps AI assistants understand and follow your project's conventions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 📋 Overview

**AI_README MCP Server** is a Model Context Protocol (MCP) server that helps AI assistants understand your project conventions through dedicated `AI_README.md` guide files. It automatically discovers, routes, and manages these files so AI can generate consistent, high-quality code that matches your team's standards.

**Works with:** Cursor, Claude Code, and other MCP-compatible AI tools.

---

## 🎯 The Problem

When working with AI assistants (like Claude, GPT, or other AI coding tools), you've probably experienced:

- ❌ **Inconsistent code style** - AI generates code that doesn't match your project's conventions
- ❌ **Repeated instructions** - You have to tell the AI the same rules over and over
- ❌ **Team inconsistency** - Different team members get different AI outputs, leading to fragmented code quality
- ❌ **Context loss** - AI forgets your project's specific patterns and best practices
- ❌ **No single source of truth** - Team conventions exist in Slack messages, PRs, and people's heads, not in a format AI can use

## 💡 The Solution

**AI_README.md** - A dedicated guide file specifically designed for AI assistants to read.

Think of it as:
- 📖 A "style guide" that AI reads before writing code
- 🎓 An "onboarding document" that teaches AI your project's conventions
- 🔧 A "configuration file" for AI behavior in your codebase
- 🤝 A **"team contract"** that ensures every developer's AI assistant follows the same standards

### How It Works

1. **Create** `AI_README.md` files in your project (root or specific directories)
2. **Document** your conventions: coding standards, architecture patterns, naming rules, testing requirements
3. **Commit to git** - Share conventions with your entire team
4. **AI reads it automatically** before making changes - ensuring every team member's AI follows the same rules
5. **Keep it in sync** - AI can update the README as your project evolves

### What This MCP Server Does

This MCP (Model Context Protocol) server automates the entire workflow:

- 🔍 **Auto-discovers** all AI_README.md files in your project
- 🎯 **Routes context** - AI gets the most relevant README for the code it's editing
- 🚀 **Guided initialization** - `init_ai_readme` scans for empty files and guides AI through population
- ✏️ **Updates automatically** - AI can add new conventions it discovers while coding
- ✅ **Validates quality** - Ensures READMEs are concise and optimized for AI consumption

**Result:** Every AI interaction in your project follows your team's standards and produces consistent, high-quality code.

---

## ✨ Features

- 🔍 **Automatic Discovery** - Scan and index all AI_README.md files in your project
- 🎯 **Smart Context Routing** - Find relevant README content based on file paths
- 🤝 **Team Consistency** - Every team member's AI assistant reads the same conventions from git, ensuring uniform code quality
- 🚀 **Guided Initialization** - `init_ai_readme` tool scans for empty files and guides AI through population
- 🔄 **Update & Sync** - AI can both read and update AI_README files
- ✅ **Validation & Quality** - Ensure README consistency with token limits and structure checks
- 🏗️ **Monorepo Support** - Place AI_README.md files at different folder levels; the tool automatically finds and uses the most relevant one
- 📦 **Easy Integration** - Works seamlessly with Cursor, Claude Code, and other MCP clients

---

## 🚀 Installation & Setup

### For Claude Code (VSCode Extension)

**Step 1: Add MCP Server**

In your project directory, run:

```bash
claude mcp add --scope project ai-readme-manager npx -- ai-readme-mcp
```

This creates a `.mcp.json` file that uses `npx` to run the package - no installation or path configuration needed!

**Step 2: Enable Project MCP Servers**

Create or edit `.claude/settings.local.json` in your project:

```json
{
  "enableAllProjectMcpServers": true
}
```

**Step 3: Auto-approve MCP Tools (Optional but Recommended)**

To avoid "Yes/No" prompts every time and enable "Yes, Do not ask again" option, add the tools to your allow list.

In `.claude/settings.local.json`, add:

```json
{
  "permissions": {
    "allow": [
      "mcp__ai-readme-manager__discover_ai_readmes",
      "mcp__ai-readme-manager__get_context_for_file",
      "mcp__ai-readme-manager__update_ai_readme",
      "mcp__ai-readme-manager__validate_ai_readmes",
      "mcp__ai-readme-manager__init_ai_readme"
    ]
  },
  "enableAllProjectMcpServers": true
}
```

> **Note:** Without this configuration, you'll be prompted for approval every time Claude uses these tools, and the "Do not ask again" option won't appear.

**Step 4: Verify Installation**

```bash
claude mcp get ai-readme-manager
```

You should see `Status: ✓ Connected`

### For Cursor

Add to Cursor's MCP configuration file:
- **Windows:** `%APPDATA%\Cursor\User\mcp.json`
- **macOS/Linux:** `~/.cursor/mcp.json`

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

After configuring, restart Cursor completely.

### For Claude Desktop Application

Add to `claude_desktop_config.json`:
- **Windows:** `%APPDATA%\claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/config.json`
- **Linux:** `~/.config/claude/config.json`

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

### Alternative Installation Methods

The above methods use `npx` (recommended). If you prefer other approaches, you can use these configurations in your MCP config file:
- **Claude Code:** `.mcp.json` (project root)
- **Cursor:** `%APPDATA%\Cursor\User\mcp.json` (Windows) or `~/.cursor/mcp.json` (macOS/Linux)
- **Claude Desktop:** `claude_desktop_config.json` (see paths above)

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

> The `-y` flag automatically accepts the npx prompt.

**Option 2: Global Installation**

Install once globally, use everywhere:

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

> **Pros:** Faster startup (no npx download). **Cons:** Need to manually update when new versions release.

---

## Create Your First AI_README

You have two main approaches to create and populate AI_README files:

### Option 1: Automated Initialization (Recommended)

Use the `init_ai_readme` tool to automatically scan and populate empty AI_README files:

**Step 1:** Create empty AI_README.md files where needed

```bash
# Example: Create empty AI_READMEs in different directories
touch AI_README.md
touch apps/backend/AI_README.md
touch apps/frontend/AI_README.md
```

**Step 2:** Trigger the initialization

In your AI assistant (Claude Code, Cursor, etc.), simply say:

> "Please run init_ai_readme for this project"

Or more explicitly:

> "Initialize AI_README files"
> "Help me populate the empty AI_README files"

**What happens:**
- 🔍 Scans your project for empty AI_README files
- 📝 Creates root-level AI_README if none exist
- 📋 Provides detailed step-by-step instructions for each file
- 🤖 AI assistant will then:
  - Explore relevant directories
  - Analyze your codebase (tech stack, patterns, conventions)
  - Populate each AI_README with relevant documentation

**When to use `init_ai_readme`:**
- First time setting up AI_README in your project
- After creating new empty AI_README.md files in subdirectories
- When `get_context_for_file` detects empty AI_README files
- To batch-process multiple empty AI_README files

### Option 2: Manual Creation

Create and write AI_README.md files yourself:

```markdown
# My Project

## Tech Stack
- Framework: React + Express
- Database: PostgreSQL
- Testing: Jest + Vitest

## Architecture Patterns
- Follows MVC pattern for backend
- Component-based architecture for frontend
- RESTful API design

## Coding Conventions
- Use TypeScript for all files
- Components in PascalCase
- Functions and variables in camelCase
- Test coverage: 80%+ required

## Testing
Run tests with: `npm test`
Write tests alongside source files
```

**Best Practices:**
- Keep it concise (< 400 tokens is ideal)
- Focus on conventions, not documentation
- Update as your project evolves
- Use AI to help maintain it

---

## Multi-Level AI_README (Not Just for Monorepos!)

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
- 📝 Create empty `AI_README.md` files in subdirectories where you need specific conventions
- 🚀 Run `init_ai_readme` tool (just tell your AI: "Please initialize AI_README files")
- 🤖 AI automatically analyzes each directory and populates conventions
- 🔗 For subdirectories with parent READMEs, generates differential content (only module-specific conventions)
- 📋 For root directories, generates full project analysis

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

---

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

### Local Development Configuration

If you're developing or modifying the source code, configure your MCP client to use your local build:

**For Claude Code - Add with CLI:**

```bash
# Linux/macOS:
claude mcp add --transport stdio ai-readme-manager --scope project -- node ~/ai-readme-mcp/dist/index.js

# Windows:
claude mcp add --transport stdio ai-readme-manager --scope project -- node C:\Users\YourName\ai-readme-mcp\dist\index.js
```

**For Claude Code - Manual `.mcp.json`:**

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

**For Cursor or Claude Desktop:**

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

**Path examples:**
- **Windows:** `"C:\\Users\\YourName\\ai-readme-mcp\\dist\\index.js"` (use `\\` for escaping)
- **macOS/Linux:** `"/home/username/ai-readme-mcp/dist/index.js"`

---

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get started in 10 minutes
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- [Project Specification](./docs/SPEC.md) - Complete technical specification

---

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

### `init_ai_readme`

Initialize and populate empty AI_README files in your project.

```typescript
// Parameters
{
  projectRoot: string;             // Required: Project root directory
  excludePatterns?: string[];      // Optional: Glob patterns to exclude
  targetPath?: string;             // Optional: Specific directory to initialize
}

// Returns
{
  success: boolean;
  message: string;
  readmesToInitialize: string[];   // Paths to empty AI_README files
  instructions: string;            // Detailed step-by-step guide for populating
}
```

**Features:**
- 🔍 Scans project for empty or missing AI_README files
- 📝 Creates root-level AI_README if none exist
- 📋 Generates detailed step-by-step instructions for each file
- 🎯 Can target specific directories with `targetPath` parameter
- 🤖 Guides AI through analysis: tech stack, patterns, conventions

**Example Usage:**

```typescript
// Initialize all empty AI_READMEs in project
{
  projectRoot: "/path/to/project"
}

// Initialize only in specific directory
{
  projectRoot: "/path/to/project",
  targetPath: "apps/backend"
}
```

**Typical Workflow:**
1. AI assistant runs `init_ai_readme`
2. Receives detailed instructions for each empty file
3. Follows instructions:
   - Uses `Glob` to scan directory
   - Reads 2-5 key source files
   - Analyzes tech stack, patterns, conventions
4. Uses `update_ai_readme` to populate each file
5. Verifies with `get_context_for_file` or `validate_ai_readmes`

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

---

## 🚀 What's Next

We're actively working on new features:

- **Auto-populate Empty AI_README** - Automatically generate AI_README content when `get_context_for_file` detects empty files, reducing manual initialization steps
- **Enhanced Tool Triggering** - Improve tool descriptions and prompts to ensure AI assistants trigger tools at the right moments with better precision and reliability
- **CI/CD Integration** - GitHub Actions for automated README validation
- **VSCode Extension** - Native VSCode extension with visual UI for managing AI_README files, offering a more integrated experience alongside the current MCP server

Want to contribute? Check out our [Contributing Guide](./CONTRIBUTING.md)!

---

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

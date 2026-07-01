# AI_README MCP Server

> A smart documentation system that helps AI assistants understand and follow your project's conventions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 📑 Quick Navigation


- [Installation & Setup](#-installation--setup)
  - [For Claude Code](#for-claude-code-vscode-extension)
  - [For Cursor](#for-cursor)
  - [For GitHub Copilot](#for-github-copilot-vscode-1102)
  - [For Claude Desktop](#for-claude-desktop-application)
  - [For OpenClaw](#for-openclaw)
  - [Alternative Installation Methods](#alternative-installation-methods)
- [Quick Start](#-quick-start)
- [Manual Creation & Editing](#️-manual-creation--editing)
- [Configuration (`.aireadme.config.json`)](#️-configuration-aireadmeconfigjson)
- [Validate & Compress AI_README Files](#️-validate--compress-ai_readme-files)
- [Multi-Level AI_README](#multi-level-ai_readme-not-just-for-monorepos)
- [Available MCP Tools](#️-available-mcp-tools)


---

## 📋 Overview

**AI_README MCP Server** is a Model Context Protocol (MCP) server that helps AI assistants understand your project conventions through dedicated `AI_README.md` guide files. It automatically discovers, routes, and manages these files so AI can generate consistent, high-quality code that matches your team's standards.

**Works with:** GitHub Copilot (VSCode 1.102+), Claude Code, Cursor, OpenClaw, and other MCP-compatible AI tools.

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
- 🗜️ **Auto-Compression** - `compress_ai_readme` removes filler language and verbose phrases automatically, reducing token footprint without losing information
- 🏗️ **Monorepo Support** - Place AI_README.md files at different folder levels; the tool automatically finds and uses the most relevant one
- 📦 **Easy Integration** - Works seamlessly with Cursor, Claude Code, and other MCP clients

---

## 🚀 Installation & Setup

### For Claude Code (VSCode Extension)

> **💡 Model Recommendation:** For the best experience, use larger models (Sonnet or Opus) which have stronger instruction-following capabilities and more reliably trigger MCP tools. Smaller models like Haiku may not consistently call the tools when appropriate.

**Step 1: Add MCP Server**

In your project directory, run:

```bash
claude mcp add --scope project ai-readme-manager npx -- ai-readme-mcp@latest
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
      "mcp__ai-readme-manager__init_ai_readme",
      "mcp__ai-readme-manager__compress_ai_readme"
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

**Step 5: Add `CLAUDE.md` Instructions**

Add the following to your project's `CLAUDE.md` to ensure Claude consistently calls the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `mcp__ai-readme-manager__get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `mcp__ai-readme-manager__init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `mcp__ai-readme-manager__update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `mcp__ai-readme-manager__update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `mcp__ai-readme-manager__update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `mcp__ai-readme-manager__update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

> **Why this matters:** Without `CLAUDE.md`, Claude may skip calling the MCP tools, causing it to generate code that ignores your project's conventions. This step is essential for reliable tool triggering.

### For Cursor

Add to Cursor's MCP configuration file:
- **Windows:** `%APPDATA%\Cursor\User\mcp.json`
- **macOS/Linux:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

After configuring, restart Cursor completely.

**Add `AGENTS.md` Instructions**

Add the following to your project's `AGENTS.md` to ensure Cursor consistently uses the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

### For GitHub Copilot (VSCode 1.102+)

**Requirements:**
- VSCode 1.102 or later
- GitHub Copilot & Copilot Chat extensions installed

**Option 1: Using VSCode Settings UI**

1. Open VSCode Settings (Ctrl+,)
2. Search for "MCP"
3. Click "Edit in settings.json"
4. Add the MCP server configuration

**Option 2: Manual Configuration**

Add to your VSCode `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

After configuring, restart VSCode and you'll see the MCP tools available in GitHub Copilot Chat!

**Add `.github/copilot-instructions.md` Instructions**

Create `.github/copilot-instructions.md` in your project to ensure Copilot consistently uses the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

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
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

**Add `CLAUDE.md` Instructions**

Add the following to your project's `CLAUDE.md` to ensure Claude Desktop consistently uses the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

### For OpenClaw

> **Perfect for vibe coding / iterative AI development** — OpenClaw users often run AI agents in tight loops to build or refactor code. Without persistent context, each iteration risks breaking conventions set in previous rounds. `ai-readme-mcp` gives your agent a stable memory of project rules across every loop.

**Option 1: CLI (Recommended)**

```bash
openclaw mcp set ai-readme-manager '{"command":"npx","args":["ai-readme-mcp@latest"]}'
```

**Option 2: Edit config file directly**

Add to `~/.openclaw/openclaw.json`:

```json
{
  "mcp": {
    "servers": {
      "ai-readme-manager": {
        "command": "npx",
        "args": ["ai-readme-mcp@latest"]
      }
    }
  }
}
```

After configuring, restart OpenClaw to load the new MCP server. Verify with:

```bash
openclaw mcp list
```

**Add skill instructions**

To ensure OpenClaw's agent consistently reads project conventions before each code change, add the following to your skill or system prompt:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

> **Why this matters for iterative agents:** In agentic loops, each iteration is a fresh context. Without `AI_README.md`, the agent has no memory of decisions made in previous rounds — leading to style drift, conflicting patterns, and regressions. `ai-readme-mcp` acts as the persistent memory layer that keeps every loop grounded in the same conventions.

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
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

> The `-y` flag automatically accepts the npx prompt. The `@latest` ensures you always get the newest version.

**Option 2: Global Installation**

Install once globally, use everywhere:

```bash
npm install -g ai-readme-mcp@latest
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

> **Don't forget:** After configuring the MCP server, add the instructions file for your AI tool — see the setup section for your specific client above (`CLAUDE.md`, `AGENTS.md`, or `.github/copilot-instructions.md`).

---

## 🚀 Quick Start

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

> "Please use the init_ai_readme MCP tool for this project"

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

---

## ✏️ Manual Creation & Editing

You can always create and edit AI_README.md files yourself - **no tools required**. There's no required format; AI treats it as plain text, so even a single line works!

This is your project's documentation. Feel free to edit it anytime - whether you're setting up for the first time, adding new conventions, or correcting something the AI wrote.

**Simple examples that work perfectly:**

```markdown
Never use emoji in code or comments.
```

```markdown
Use Tailwind CSS, not inline styles.
Always use TypeScript strict mode.
```

```markdown
This is a Next.js 14 app with App Router.
Use server components by default.
Database: Prisma + PostgreSQL.
```

**Key point:** Write whatever helps AI understand your preferences. A few clear sentences are often better than lengthy documentation.

**Best Practices:**
- Keep it concise (< 400 tokens is ideal)
- Focus on conventions, not documentation
- Update as your project evolves - add new rules whenever you notice AI doing something wrong
- Review AI-made updates with `git diff AI_README.md` and edit freely
- Use AI to help maintain it, but you're always the final editor

---

## ⚙️ Configuration (`.aireadme.config.json`)

Most projects need no config — the defaults target tight, AI-optimized files (< 400 tokens). But large monorepos often have directories whose conventions genuinely don't compress that far. Drop a `.aireadme.config.json` at your project root to raise the budget:

```json
{
  "tokenBudget": 800
}
```

**`tokenBudget` is the single knob.** Set it and *everything* scales with it — the quality-score thresholds, the "drifting / needs-rewrite" nudges, and the numbers printed in the over-budget prompts. You don't set five numbers; you set one.

> **It's a target, not a hard cap.** A file is never rejected or truncated for going over `tokenBudget` — it just gets nudged to tighten up. Validation only flags an *error* at the top tier (2.5 × budget). So a 420-token file under an 800 budget is perfectly fine.

| Tier | Formula | @ 400 (default) | @ 800 |
|---|---|---|---|
| Excellent | ½ × tokenBudget | 200 | 400 |
| Good (the target) | 1 × tokenBudget | 400 | 800 |
| Warning | 1.5 × tokenBudget | 600 | 1200 |
| Error | 2.5 × tokenBudget | 1000 | 2000 |

Omitting the file is identical to `{ "tokenBudget": 400 }` — existing projects see no change. Advanced overrides (`tokenLimits`, `rules`, `sectionSplitThreshold`) are still accepted and win over the derived values when set explicitly.

> Tip: prefer raising `tokenBudget` only when content is genuinely irreducible. If a single section dominates an over-budget file, the tool will suggest *splitting* it into a child-directory `AI_README.md` instead — that keeps each file tight without inflating the budget.

### Excluding directories

By default the scanner skips `node_modules`, `.git`, `dist`, `build`, `.next`, and `coverage`. To always ignore extra directories (e.g. generated code, a `legacy/` tree, or a `docs/` folder you don't want the agent to consult conventions for), add `excludePatterns`:

```json
{
  "excludePatterns": ["**/legacy/**", "**/docs/**"]
}
```

`excludePatterns` is a single "I don't care about this path" knob, applied two ways:

1. The scanner skips these directories (no AI_README inside them gets indexed).
2. `get_context_for_file` short-circuits when the file you're editing matches — no AI_README context (not even root) is injected. The tool returns a one-line note instead. This avoids forcing a heavy root AI_README on agents editing `docs/` or other non-code paths.

Built-in ignores (`node_modules` etc.) stay excluded on top of yours — you can't accidentally start scanning them. (Passing `excludePatterns` directly to a tool call still overrides the config for that one call.)

### Validation rules (optional)

Two rules are worth overriding for some teams:

```json
{
  "rules": {
    "allowCodeBlocks": true,
    "requireSections": ["## Conventions", "## Cross-directory dependencies"]
  }
}
```

- **`allowCodeBlocks`** (default `false`) — code fences are flagged by default because they burn tokens. Set `true` if a snippet genuinely belongs in your AI_README.
- **`requireSections`** (default none) — warn when a listed section heading is missing, e.g. to enforce a house template across every AI_README.

### Guidance level

The tool descriptions and the guidance appended to `get_context_for_file` are sent to the model **every turn**. If this server dominates your context budget, switch to `medium` — it trims the descriptions ~80% and drops the AI_README-writing guide from every read (that guidance still lives on `update_ai_readme`, where it's actually needed):

```json
{
  "guidanceLevel": "medium"
}
```

- **`high`** (default) — the full "call this every time" prompting. Best for smaller / less compliant models that need a push to call the tools.
- **`medium`** — much smaller footprint. Best for capable models (Opus/Sonnet) where the extra tokens are pure cost.

> **Read once at startup** from the `.aireadme.config.json` at the server's working directory, so a change needs a server restart to take effect. (Tool descriptions ship before any tool call, so this is the one setting read from cwd rather than a per-call `projectRoot`.) It only controls the server's prompt overhead — not what your AI_README files say or how validation behaves.

---

## 🗜️ Validate & Compress AI_README Files

Keep your AI_README files concise and token-efficient with a single prompt to your AI assistant:

> Validate and compress all AI_README files using `validate_ai_readmes` and `compress_ai_readme`.

The AI will automatically run the full cycle: `validate_ai_readmes` → `compress_ai_readme` (dry-run preview) → apply → re-validate.

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
    tokenBudget?: number;          // Single knob; derives the tiers below (default: 400)
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

### `compress_ai_readme`

Compress an AI_README.md file using deterministic filler-language removal. No LLM call — pure regex transforms.

```typescript
// Parameters
{
  readmePath: string;    // Required: Absolute path to AI_README.md file
  dryRun?: boolean;      // Optional: Preview changes without writing (default: false)
}

// Returns
{
  success: boolean;
  readmePath: string;
  summary: string;                  // Human-readable summary with token diff
  tokensBefore: number;
  tokensAfter: number;
  reductionPercent: number;
  changes: Array<{
    line: number;
    original: string;
    compressed: string;
    patterns: string[];             // Filler patterns that were removed
  }>;
  written: boolean;                 // false if dryRun or no changes found
}
```

**What it removes (prose only — code blocks are never touched):**
- Filler words: `just`, `really`, `basically`, `actually`, `simply`, `essentially`
- Verbose phrases: `in order to` → `to`, `utilize` → `use`, `make sure to` → `ensure`
- Hedging: `you should`, `remember to`, `it might be worth`, `please note that`
- Fluff connectives: `furthermore`, `additionally`, `in addition`, `moreover`

**Output may contain sentence fragments — this is intentional.** Token-efficient format is valid for AI_README files.

**Typical Workflow:**
1. Run `validate_ai_readmes` — note any `filler-language` warnings
2. Run `compress_ai_readme` with `dryRun: true` to preview
3. Run again without `dryRun` to apply
4. Re-run `validate_ai_readmes` to confirm improvement

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

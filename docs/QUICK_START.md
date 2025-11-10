# Quick Start Guide

This guide will help you get the AI_README MCP Server running with Claude Code in 5 minutes.

## Step 1: Build the MCP Server

```bash
# Navigate to the project directory
cd /path/to/ai-readme-mcp

# Build the server
npm run build
```

You should see output like:
```
CLI Building entry: src/index.ts
CLI Using tsconfig: tsconfig.json
CLI tsup v8.3.5
CLI Target: esnext
CLI Cleaning output folder
dist/index.js  11.50 KB
dist/index.d.ts   1.36 KB
```

## Step 2: Configure Claude Code

**Recommended:** Use npx (no path configuration needed):

```bash
claude mcp add --scope project ai-readme-manager npx -- ai-readme-mcp
```

This will create `.mcp.json` in your project root using `npx` - works on all platforms!

**Alternative:** Use local installation with absolute path:

```bash
# Linux/macOS:
claude mcp add --transport stdio ai-readme-manager --scope project -- node /home/username/ai-readme-mcp/dist/index.js

# Windows (~ doesn't work, use absolute path):
claude mcp add --transport stdio ai-readme-manager --scope project -- node C:\Users\YourName\ai-readme-mcp\dist\index.js
```

**Or manually create `.mcp.json`:**

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

Or with local installation:

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

**Path examples for local installation:**
- Windows: `"C:\\Users\\YourName\\ai-readme-mcp\\dist\\index.js"` (use `\\` for escaping)
- macOS/Linux: `"/home/username/ai-readme-mcp/dist/index.js"`

## Step 3: Enable Project MCP Servers

Create or edit `.claude/settings.local.json` in your project:

```json
{
  "enableAllProjectMcpServers": true
}
```

## Step 4: Verify Installation

Check MCP server status:

```bash
claude mcp get ai-readme-manager
```

You should see `Status: ✓ Connected`

## Step 5: (Optional) Auto-approve MCP Tools

To avoid confirmation prompts every time AI uses the MCP tools, add them to your allow list.

In `.claude/settings.local.json`, add to the `permissions.allow` array:

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

> **Note:** This is optional. If you prefer to approve each MCP call, skip this step.

## Step 6: Restart Claude Code

Restart Claude Code (Developer: Reload Window) to load the MCP server.

In a new conversation, verify by asking:

> "What MCP tools do you have available?"

You should see:
- `discover_ai_readmes` - Scan project for AI_README files
- `get_context_for_file` - Get relevant context for a file
- `update_ai_readme` - Update AI_README files
- `validate_ai_readmes` - Validate AI_README files structure and token count
- `init_ai_readme` - Initialize and populate empty AI_README files

## Step 7: Create Your First AI_README

You have two options:

### Option 1: Automated Initialization (Recommended)

Create an empty `AI_README.md` file in your project root:

```bash
touch AI_README.md
```

Then ask Claude:

> "Please run init_ai_readme for this project"

Claude will automatically:
- Scan your codebase
- Analyze tech stack and patterns
- Populate AI_README with relevant conventions

### Option 2: Manual Creation

Create `AI_README.md` with concise conventions (keep it under 400 tokens):

```markdown
# Tech Stack
- Framework: React 18
- Language: TypeScript 5
- Build: Vite
- Testing: Vitest

## Conventions

### File Structure
- Components: `src/components/`
- Utils: `src/utils/`
- Types: `src/types/`

### Naming
- Components: PascalCase (`Button.tsx`)
- Utils: camelCase (`formatDate.ts`)
- CSS: kebab-case (`button-styles.css`)

### Code Style
- TypeScript only
- Functional components + hooks
- JSDoc for exports
- 80%+ test coverage

## Critical Rules
- Never commit `.env`
- Run linter before commit
```

> **Note:** Keep AI_README concise! Focus on actionable conventions, not documentation.

## Step 8: Test It Out

Now ask Claude Code to use the context:

> "I'm about to create a new component in src/components/UserProfile.tsx. What conventions should I follow?"

Claude will use the `get_context_for_file` tool to fetch your AI_README content and provide context-aware guidance!

You can also ask Claude to update your AI_README:

> "Please add a new section about Performance to our AI_README with best practices for React components"

Claude will use the `update_ai_readme` tool to add the content (with automatic backup)!

## Next Steps

### For Monorepos

Create AI_README files at multiple levels:

```
your-project/
├── AI_README.md                    # Root-level conventions
├── apps/
│   ├── frontend/
│   │   ├── AI_README.md           # Frontend-specific conventions
│   │   └── src/
│   └── backend/
│       ├── AI_README.md           # Backend-specific conventions
│       └── src/
└── packages/
    └── shared/
        └── AI_README.md           # Shared code conventions
```

### Discover All READMEs

Ask Claude:

> "Can you discover all AI_README files in my project?"

### Get Context for Specific Files

> "What context is relevant for apps/frontend/src/components/Button.tsx?"

## Troubleshooting

### Server Not Starting

Check Claude Code logs for errors. The server should output:
```
AI_README MCP Server started
Available tools: discover_ai_readmes, get_context_for_file
```

### Tools Not Available

1. Verify the config file path is correct
2. Check that the path to `dist/index.js` is correct and absolute
3. Ensure the project was built (`npm run build`)
4. Restart Claude Code completely

### Permission Errors

Make sure the MCP server has read permissions for your project directories.

### MCP Tools Not Loading

If tools don't appear in new conversations:

1. Check `.claude/settings.local.json` has `"enableAllProjectMcpServers": true`
2. Verify MCP server is Connected: `claude mcp get ai-readme-manager`
3. Restart Claude Code completely
4. Try `claude mcp reset-project-choices` and restart

## Learn More

- See [templates](./templates/) for AI_README examples
- Check [SPEC.md](./SPEC.md) for complete specification
- Visit [GitHub repo](https://github.com/Draco-Cheng/ai-readme-mcp) for updates

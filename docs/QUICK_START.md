# Quick Start Guide

This guide will help you get the AI_README MCP Server running with Claude Code in 5 minutes.

## Step 1: Build the MCP Server

```bash
# Navigate to the project directory
cd d:/Home/WorkSpace/playground/ai-readme-mcp

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

Create or edit your Claude Code MCP configuration file:

**For Windows:**
- File location: `%APPDATA%\claude\claude_desktop_config.json` or similar

**For macOS/Linux:**
- File location: `~/.config/claude/config.json` or `~/Library/Application Support/Claude/config.json`

Add this configuration:

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

**Important:** Replace `d:/Home/WorkSpace/playground/ai-readme-mcp/dist/index.js` with the actual path to your built server.

## Step 3: Restart Claude Code

After updating the configuration file, restart Claude Code completely to load the MCP server.

## Step 4: Verify Installation

In Claude Code, you can verify the server is running by asking:

> "What MCP tools do you have available?"

You should see:
- `discover_ai_readmes` - Scan project for AI_README files
- `get_context_for_file` - Get relevant context for a file

## Step 5: Create Your First AI_README

Create a file called `AI_README.md` in your project root:

```markdown
# Project Overview

This is a [your project type] using [your tech stack].

## Architecture

- **Framework:** [e.g., React, Express, etc.]
- **Language:** [e.g., TypeScript]
- **Build Tool:** [e.g., Vite, Webpack]

## Coding Conventions

### File Organization
- Components go in `src/components/`
- Utilities go in `src/utils/`
- Types go in `src/types/`

### Naming Conventions
- Use PascalCase for component files: `Button.tsx`
- Use camelCase for utility files: `formatDate.ts`
- Use kebab-case for CSS files: `button-styles.css`

### Code Style
- Use TypeScript for all new files
- Prefer functional components with hooks
- Always add JSDoc comments for exported functions
- Write tests for all business logic

## Testing

- Unit tests using [your test framework]
- Run tests with: `npm test`
- Coverage threshold: 80%

## Important Notes

- Never commit `.env` files
- Always run linter before committing
- Update this README when architecture changes
```

## Step 6: Test It Out

Now ask Claude Code to use the context:

> "I'm about to create a new component in src/components/UserProfile.tsx. What conventions should I follow?"

Claude will use the `get_context_for_file` tool to fetch your AI_README content and provide context-aware guidance!

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

## Advanced Usage

See [MCP_CONFIG.md](./MCP_CONFIG.md) for detailed configuration options and advanced features.

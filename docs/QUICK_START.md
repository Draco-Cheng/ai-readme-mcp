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

**Recommended:** Use the CLI to add the MCP server:

```bash
claude mcp add --transport stdio ai-readme-manager --scope project -- node /absolute/path/to/ai-readme-mcp/dist/index.js
```

This will create `.mcp.json` in your project root.

**Or manually create `.mcp.json`:**

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

**Path examples:**
- Windows: `"C:\\Users\\YourName\\projects\\ai-readme-mcp\\dist\\index.js"`
- macOS/Linux: `"/home/username/projects/ai-readme-mcp/dist/index.js"`

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

## Step 5: Restart Claude Code

Restart Claude Code (Developer: Reload Window) to load the MCP server.

In a new conversation, verify by asking:

> "What MCP tools do you have available?"

You should see:
- `discover_ai_readmes` - Scan project for AI_README files
- `get_context_for_file` - Get relevant context for a file

## Step 6: Create Your First AI_README

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

## Step 7: Test It Out

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

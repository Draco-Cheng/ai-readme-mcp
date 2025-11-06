# MCP Configuration Guide

This guide shows how to configure the AI_README MCP Server with Claude Code.

## Installation

### Option 1: Local Development (from this directory)

```bash
# Build the project
npm run build

# The server is now ready at dist/index.js
```

### Option 2: Using npx (when published)

```bash
npx ai-readme-mcp
```

## Configuration for Claude Code

### Method 1: Global Configuration

Add to your Claude Code configuration file (usually at `~/.config/claude/config.json` or similar):

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

**Note**: Replace the path with the actual path to your `dist/index.js` file.

### Method 2: Using npx (after publishing)

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["-y", "ai-readme-mcp"],
      "env": {}
    }
  }
}
```

### Method 3: Project-Local Configuration

Create `.claude/mcp-config.json` in your project root:

```json
{
  "ai-readme-manager": {
    "command": "npx",
    "args": ["-y", "ai-readme-mcp"],
    "enabled": true
  }
}
```

## Available Tools

Once configured, Claude Code will have access to these tools:

### 1. `discover_ai_readmes`

Scans your project and discovers all AI_README.md files.

**Parameters:**
- `projectRoot` (string, required): The root directory of the project
- `excludePatterns` (array of strings, optional): Glob patterns to exclude

**Example:**
```json
{
  "projectRoot": "/path/to/your/project",
  "excludePatterns": ["node_modules/**", ".git/**"]
}
```

**Returns:**
```json
{
  "projectRoot": "/path/to/your/project",
  "totalFound": 3,
  "readmeFiles": [
    {
      "path": "AI_README.md",
      "scope": "root",
      "level": 0,
      "patterns": ["**/*"]
    }
  ],
  "lastUpdated": "2025-11-05T22:52:28.290Z"
}
```

### 2. `get_context_for_file`

Gets relevant AI_README context for a specific file.

**Parameters:**
- `projectRoot` (string, required): The root directory of the project
- `filePath` (string, required): The file path relative to project root
- `includeRoot` (boolean, optional, default: true): Include root-level README
- `excludePatterns` (array of strings, optional): Glob patterns to exclude

**Example:**
```json
{
  "projectRoot": "/path/to/your/project",
  "filePath": "apps/frontend/src/components/Button.tsx",
  "includeRoot": true
}
```

**Returns:**
A formatted prompt with all relevant AI_README content:

```markdown
## 📚 Project Context for: apps/frontend/src/components/Button.tsx

### Parent Module Conventions (apps/frontend/AI_README.md)

[Content from apps/frontend/AI_README.md]

### Root Conventions (AI_README.md)

[Content from AI_README.md]

---
**Important Reminders:**
- Follow the above conventions when making changes
- If your changes affect architecture or conventions, consider updating the relevant AI_README
```

## Usage Examples

### Discovering README Files

When working in a new project, ask Claude:

> "Can you discover all AI_README files in this project?"

Claude will use the `discover_ai_readmes` tool to scan and show you all README files.

### Getting Context Before Making Changes

When you want to modify a file:

> "I'm about to modify apps/frontend/src/App.tsx. What conventions should I follow?"

Claude will use `get_context_for_file` to retrieve relevant README content and provide context-aware guidance.

### Automatic Context Injection

Ideally, Claude Code will automatically inject context when you:
1. Open a file for editing
2. Ask questions about specific files
3. Request to create new files in specific directories

## Troubleshooting

### Server Not Starting

Check the logs in Claude Code. The server should output:
```
AI_README MCP Server started
Available tools: discover_ai_readmes, get_context_for_file
```

### Tools Not Available

1. Verify the configuration file is correctly formatted
2. Check that the path to `dist/index.js` is correct
3. Ensure the project has been built (`npm run build`)
4. Restart Claude Code after configuration changes

### Permission Errors

Make sure the MCP server has read permissions for your project directory.

## Next Steps

After configuration:

1. Create AI_README.md files in your project
2. Structure them hierarchically (root, module-level, etc.)
3. Let Claude automatically use context when helping you code
4. Update README files as your project evolves

## Example AI_README.md Structure

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

Each README should document:
- Architecture decisions
- Coding conventions
- Directory structure
- Testing requirements
- Any domain-specific knowledge

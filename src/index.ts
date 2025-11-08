/**
 * AI_README MCP Server
 * Entry point for the MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  discoverAIReadmes,
  discoverSchema,
  type DiscoverInput,
} from './tools/discover.js';
import {
  getContextForFile,
  getContextSchema,
  type GetContextInput,
} from './tools/getContext.js';
import {
  updateAIReadme,
  updateSchema,
  type UpdateInput,
} from './tools/update.js';
import {
  validateAIReadmes,
  validateSchema,
  type ValidateInput,
} from './tools/validate.js';
import {
  initAIReadme,
  initSchema,
  type InitInput,
} from './tools/init.js';

const server = new Server(
  {
    name: 'ai-readme-mcp',
    version: '0.3.2',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool: list_tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'discover_ai_readmes',
        description:
          'Scan the project and discover all AI_README.md files. Returns an index of all README files with their paths, scopes, and coverage patterns.',
        inputSchema: zodToJsonSchema(discoverSchema),
      },
      {
        name: 'get_context_for_file',
        description:
          '⚠️ REQUIRED: Call this tool BEFORE creating or editing ANY file to get project conventions.\n\n' +
          'Gets relevant AI_README context for a specific file path. Returns formatted guidelines that MUST be followed when writing code.\n\n' +
          '**When to call this tool:**\n' +
          '- BEFORE using Write tool (creating new files)\n' +
          '- BEFORE using Edit tool (modifying existing files)\n' +
          '- AFTER updating AI_README (to get fresh context)\n' +
          '- Works even if the target file does not exist yet\n\n' +
          '**Recommended workflow:**\n' +
          '1. Establishing NEW conventions: update_ai_readme → get_context_for_file → Write/Edit\n' +
          '2. Following existing conventions: get_context_for_file → Write/Edit\n' +
          '3. Documenting discovered patterns: Write/Edit → update_ai_readme\n\n' +
          '**Example:** Before creating Button.tsx, call get_context_for_file with filePath="src/components/Button.tsx" to learn styling preferences (CSS Modules vs Tailwind), naming conventions, component patterns, etc.',
        inputSchema: zodToJsonSchema(getContextSchema),
      },
      {
        name: 'update_ai_readme',
        description:
          'Update an AI_README.md file to document conventions, patterns, or architectural decisions. Supports append, prepend, replace, insert-after, insert-before operations. Auto-validates after update.\n\n' +
          '**When to use this tool:**\n' +
          '1. BEFORE code changes: When establishing NEW conventions\n' +
          '   - User requests a style/approach change (e.g., "use CSS Modules instead of Tailwind")\n' +
          '   - Choosing between multiple approaches (e.g., state management libraries)\n' +
          '   - Setting up new architectural patterns or folder structures\n' +
          '   - Workflow: update_ai_readme → get_context_for_file → Write/Edit\n\n' +
          '2. AFTER code changes: When documenting discovered patterns\n' +
          '   - Found consistent patterns in existing code\n' +
          '   - Identified team conventions from code review\n' +
          '   - Workflow: Write/Edit → update_ai_readme\n\n' +
          '**Example scenarios:**\n' +
          '- User: "Use CSS Modules instead of Tailwind" → Update AI_README first, then modify code\n' +
          '- User: "Add error handling to API calls" → Code first, document pattern after if it\'s new\n\n' +
          'Note: Only update when documenting NEW conventions - avoid duplicates.',
        inputSchema: zodToJsonSchema(updateSchema),
      },
      {
        name: 'validate_ai_readmes',
        description:
          'Validate all AI_README.md files in a project. Checks token count, structure, and content quality. Returns validation results with suggestions for improvement.',
        inputSchema: zodToJsonSchema(validateSchema),
      },
      {
        name: 'init_ai_readme',
        description:
          'Initialize or fill an AI_README.md file with smart content based on project analysis. Auto-detects project type, language, and framework. Use this to create new READMEs or fill empty ones.',
        inputSchema: zodToJsonSchema(initSchema),
      },
    ],
  };
});

// Register tool: call_tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'discover_ai_readmes') {
      const input = discoverSchema.parse(args) as DiscoverInput;
      const result = await discoverAIReadmes(input);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'get_context_for_file') {
      const input = getContextSchema.parse(args) as GetContextInput;
      const result = await getContextForFile(input);
      return {
        content: [
          {
            type: 'text',
            text: result.formattedPrompt,
          },
        ],
      };
    }

    if (name === 'update_ai_readme') {
      const input = updateSchema.parse(args) as UpdateInput;
      const result = await updateAIReadme(input);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'validate_ai_readmes') {
      const input = validateSchema.parse(args) as ValidateInput;
      const result = await validateAIReadmes(input);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'init_ai_readme') {
      const input = initSchema.parse(args) as InitInput;
      const result = await initAIReadme(input);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('AI_README MCP Server started');
  console.error('Available tools: discover_ai_readmes, get_context_for_file, update_ai_readme, validate_ai_readmes, init_ai_readme');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

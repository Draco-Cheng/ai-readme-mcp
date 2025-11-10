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
          '**When to call:**\n' +
          '- BEFORE using Write tool (creating new files)\n' +
          '- BEFORE using Edit tool (modifying existing files)\n' +
          '- AFTER updating AI_README (to get fresh context)\n' +
          '- Works even if the target file does not exist yet\n\n' +
          '**Workflows:**\n' +
          '1. Following conventions: get_context_for_file → Write/Edit\n' +
          '2. Establishing NEW conventions: update_ai_readme → get_context_for_file → Write/Edit\n' +
          '3. Empty AI_README detected: Use `init_ai_readme` tool (tool will suggest this)\n' +
          '4. Document discovered patterns: Write/Edit → update_ai_readme\n\n' +
          '**Example:** Before creating Button.tsx, call get_context_for_file with filePath="src/components/Button.tsx" to learn styling preferences (CSS Modules vs Tailwind), naming conventions, component patterns, etc.',
        inputSchema: zodToJsonSchema(getContextSchema),
      },
      {
        name: 'update_ai_readme',
        description:
          'Update an AI_README.md file to document conventions, patterns, or architectural decisions. Supports append, prepend, replace, insert-after, insert-before operations.\n\n' +
          '**CRITICAL: Token Efficiency Rules**\n' +
          '- Keep content EXTREMELY concise (< 400 tokens ideal, < 600 warning, > 1000 error)\n' +
          '- Only document ACTIONABLE conventions that affect code generation\n' +
          '- NO explanations, NO examples, NO verbose descriptions\n' +
          '- Use bullet points, avoid complete sentences when possible\n' +
          '- Focus on: tech stack, naming rules, patterns, architectural decisions\n' +
          '- AVOID: project background, how-to guides, documentation, obvious practices\n\n' +
          '**When to use:**\n' +
          '1. BEFORE code changes: Establishing NEW conventions\n' +
          '   - User requests style/approach change (e.g., "use CSS Modules")\n' +
          '   - Choosing between approaches (e.g., state management)\n' +
          '   - Setting up new architectural patterns\n' +
          '   - Workflow: update_ai_readme → get_context_for_file → Write/Edit\n\n' +
          '2. AFTER code changes: Documenting discovered patterns\n' +
          '   - Found consistent patterns in existing code\n' +
          '   - Workflow: Write/Edit → update_ai_readme\n\n' +
          '**Quality checklist before updating:**\n' +
          'Is this a CONVENTION or PATTERN (not documentation)?\n' +
          'Will this help AI generate better code?\n' +
          'Is it concise (<3 words per bullet)?\n' +
          'Does it avoid obvious/general practices?\n' +
          'Reject: project descriptions, tutorials, general best practices\n\n' +
          '**Example (GOOD):**\n' +
          '- Use CSS Modules\n' +
          '- Components in PascalCase\n' +
          '- Test coverage: 80%+\n\n' +
          '**Example (BAD - too verbose):**\n' +
          '- We use CSS Modules for styling because it provides better type safety and scoping compared to Tailwind...',
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
          '🚀 Initialize and populate empty AI_README files in your project.\n\n' +
          'Scans the project for empty or missing AI_README files and guides you through populating them with project conventions.\n\n' +
          '**When to use:**\n' +
          '- First time setting up AI_README in a project\n' +
          '- When get_context_for_file detects empty AI_README files\n' +
          '- After creating new empty AI_README.md files manually\n' +
          '- To populate multiple AI_README files at once\n\n' +
          '**What it does:**\n' +
          '1. Scans project for empty AI_README files\n' +
          '2. Creates root-level AI_README if none exist\n' +
          '3. Provides step-by-step instructions to populate each file\n' +
          '4. Guides analysis of tech stack, patterns, and conventions\n\n' +
          '**Workflow:**\n' +
          '1. Call init_ai_readme\n' +
          '2. Follow the instructions to explore directories\n' +
          '3. Use update_ai_readme to populate each file\n' +
          '4. Call get_context_for_file to verify and use conventions\n\n' +
          '**Example:** `init_ai_readme({ projectRoot: "/path/to/project" })`',
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
            text: result.instructions || JSON.stringify(result, null, 2),
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

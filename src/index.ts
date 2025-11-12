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
          '🚨 MANDATORY FIRST STEP: Call this BEFORE planning or coding\n\n' +
          '═══════════════════════════════════════════════════════════════\n' +
          '⚠️  CRITICAL RULE: You MUST call this tool BEFORE:\n' +
          '   • Planning with TodoWrite (to plan based on conventions)\n' +
          '   • Using Write tool (creating files)\n' +
          '   • Using Edit tool (modifying files)\n' +
          '   • Making architectural decisions\n' +
          '   • Suggesting code implementations\n' +
          '═══════════════════════════════════════════════════════════════\n\n' +
          '❓ WHY call this before planning?\n' +
          'Planning requires understanding project conventions. Without context, you might plan an approach that conflicts with existing architecture (e.g., planning to use Tailwind when project uses CSS Modules).\n\n' +
          '📋 What this tool does:\n' +
          'Gets relevant AI_README context for a file path. Returns project conventions and patterns that MUST be followed.\n\n' +
          '🔍 Auto-trigger keywords (when you see these, call this tool IMMEDIATELY):\n' +
          '"add", "create", "implement", "modify", "edit", "refactor", "suggest", "what should", "how to structure", "optimize", "improve"\n\n' +
          '✅ CORRECT workflow:\n' +
          '1. User requests: "refactor this" / "add feature" / "create component"\n' +
          '2. → Call get_context_for_file FIRST (understand conventions)\n' +
          '3. → Plan with TodoWrite (based on conventions learned)\n' +
          '4. → Execute with Write/Edit (following the plan)\n\n' +
          '❌ WRONG workflow:\n' +
          '1. User requests: "refactor this"\n' +
          '2. ❌ TodoWrite immediately (planning without context)\n' +
          '3. ❌ get_context later (too late, already planned wrong approach)\n' +
          '4. ❌ Write/Edit (executing flawed plan)\n\n' +
          '📝 Common workflows:\n' +
          '• Following existing conventions:\n' +
          '  get_context_for_file → TodoWrite (optional) → Write/Edit\n\n' +
          '• Establishing NEW conventions:\n' +
          '  update_ai_readme → get_context_for_file → TodoWrite → Write/Edit\n\n' +
          '• Empty README detected:\n' +
          '  init_ai_readme → get_context_for_file → TodoWrite → Write/Edit\n\n' +
          '• Document discovered patterns:\n' +
          '  Write/Edit → update_ai_readme\n\n' +
          '💡 Pro tip: Works even if target file doesn\'t exist yet!\n\n' +
          '📌 Example:\n' +
          'User: "Refactor Button.tsx"\n' +
          'You: get_context_for_file({ filePath: "src/components/Button.tsx" })\n' +
          '→ Learn: CSS Modules, PascalCase, Atomic Design structure\n' +
          '→ Then plan refactoring based on these conventions',
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
          '   - Making architectural decisions\n' +
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

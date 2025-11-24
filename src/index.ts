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
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const server = new Server(
  {
    name: 'ai-readme-mcp',
    version: packageJson.version,
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
          '🚨 ALWAYS CALL THIS FIRST - NO EXCEPTIONS\n\n' +
          'WHEN TO CALL (check these FIRST before responding):\n' +
          '✓ User asks: optimize, improve, analyze, review, suggest, think, opinion\n' +
          '✓ User mentions: file name, component name, project, codebase, backend, frontend\n' +
          '✓ User asks: "what can", "what should", "how to", "can you", "help me"\n' +
          '✓ Before: Write, Edit, TodoWrite, suggesting ANY code changes\n\n' +
          'IF ANY ABOVE = TRUE → CALL get_context_for_file IMMEDIATELY\n\n' +
          '═══════════════════════════════════════════════════════════════\n\n' +
          'MANDATORY RULE:\n' +
          'EVERY response that involves code/suggestions MUST start with get_context_for_file\n\n' +
          '═══════════════════════════════════════════════════════════════\n\n' +
          'What this tool does:\n' +
          'Gets AI_README context showing project conventions that MUST be followed.\n\n' +
          'Why it matters:\n' +
          '❌ Without: Wrong tech (suggest Tailwind when project uses CSS Modules)\n' +
          '✅ With: Suggestions fit existing codebase perfectly\n\n' +
          'DETECT CONFLICTS:\n' +
          'After reading context, if user wants X but AI_README says Y:\n' +
          '→ This is ARCHITECTURAL DECISION\n' +
          '→ Workflow: get_context → update_ai_readme → get_context → Write/Edit',
        inputSchema: zodToJsonSchema(getContextSchema),
      },
      {
        name: 'update_ai_readme',
        description:
          '🚩 CALL THIS when user changes TECHNOLOGY/CONVENTION\n\n' +
          'WHEN TO CALL (after get_context detects conflict):\n' +
          '✓ User says: "don\'t use X", "don\'t want", "not X", "instead"\n' +
          '✓ User says: "use Y", "prefer", "switch to", "change to"\n' +
          '✓ User tech choice ≠ AI_README tech (CONFLICT)\n' +
          '✓ Pattern change affects multiple files\n\n' +
          'IF ANY ABOVE = TRUE → CALL update_ai_readme BEFORE changing code\n\n' +
          '═══════════════════════════════════════════════════════════════\n\n' +
          'MANDATORY WORKFLOW:\n' +
          '1. get_context (read current conventions)\n' +
          '2. DETECT CONFLICT: User wants X but AI_README says Y\n' +
          '3. update_ai_readme (change Y → X) ← YOU ARE HERE\n' +
          '4. get_context (verify update)\n' +
          '5. Write/Edit (follow new convention)\n\n' +
          '═══════════════════════════════════════════════════════════════\n\n' +
          'Example:\n' +
          'User: "I don\'t want Tailwind" (after seeing AI_README says "Tailwind")\n' +
          '→ CONFLICT! Call update_ai_readme to change "Tailwind" → "CSS Modules"\n\n' +
          'Content Rules:\n' +
          '- Extremely concise (< 400 tokens)\n' +
          '- Only actionable conventions (tech, naming, patterns)\n' +
          '- NO explanations or examples',
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

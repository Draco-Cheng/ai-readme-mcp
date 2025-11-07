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

const server = new Server(
  {
    name: 'ai-readme-mcp',
    version: '0.1.0',
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
          'Get relevant AI_README context for a specific file path. Returns formatted context from relevant README files to help understand project conventions.',
        inputSchema: zodToJsonSchema(getContextSchema),
      },
      {
        name: 'update_ai_readme',
        description:
          'Update an AI_README.md file with specified operations (append, prepend, replace, insert-after, insert-before). Changes are written directly; use Git for version control.',
        inputSchema: zodToJsonSchema(updateSchema),
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
  console.error('Available tools: discover_ai_readmes, get_context_for_file, update_ai_readme');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

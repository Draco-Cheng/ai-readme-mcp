/**
 * AI_README MCP Server
 * Entry point for the MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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

// TODO: Register tools here
// - discover_ai_readmes
// - get_context_for_file
// - update_ai_readme
// - validate_ai_readmes

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('AI_README MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/**
 * MCP Tool: get_context_for_file
 * Gets relevant AI_README context for a specific file path
 */

import { z } from 'zod';
import { AIReadmeScanner } from '../core/scanner.js';
import { ContextRouter } from '../core/router.js';

export const getContextSchema = z.object({
  projectRoot: z.string().describe('The root directory of the project'),
  filePath: z
    .string()
    .describe('The file path to get context for (relative to project root)'),
  includeRoot: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include root-level AI_README (default: true)'),
  excludePatterns: z
    .array(z.string())
    .optional()
    .describe('Glob patterns to exclude when scanning'),
});

export type GetContextInput = z.infer<typeof getContextSchema>;

export async function getContextForFile(input: GetContextInput) {
  const { projectRoot, filePath, includeRoot, excludePatterns } = input;

  // First, scan the project to build the index
  const scanner = new AIReadmeScanner(projectRoot, {
    excludePatterns,
    cacheContent: true, // Cache content for context retrieval
  });

  const index = await scanner.scan();

  // Create router and get context
  const router = new ContextRouter(index);
  const contexts = await router.getContextForFile(filePath, includeRoot);

  // Format the response with a helpful prompt template
  const formattedContexts = contexts.map((ctx) => ({
    path: ctx.path,
    relevance: ctx.relevance,
    distance: ctx.distance,
    content: ctx.content,
  }));

  // Generate a formatted prompt for the AI
  let promptText = `## 📚 Project Context for: ${filePath}\n\n`;

  for (const ctx of formattedContexts) {
    if (ctx.relevance === 'root') {
      promptText += `### Root Conventions (${ctx.path})\n\n`;
    } else if (ctx.relevance === 'direct') {
      promptText += `### Direct Module Conventions (${ctx.path})\n\n`;
    } else {
      promptText += `### Parent Module Conventions (${ctx.path})\n\n`;
    }

    promptText += ctx.content + '\n\n';
  }

  promptText += `---\n**Important Reminders:**\n`;
  promptText += `- Follow the above conventions when making changes\n`;
  promptText += `- If your changes affect architecture or conventions, consider updating the relevant AI_README\n`;

  return {
    filePath,
    totalContexts: contexts.length,
    contexts: formattedContexts,
    formattedPrompt: promptText,
  };
}

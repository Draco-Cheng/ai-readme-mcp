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

  if (contexts.length === 0) {
    // No AI_README found - provide helpful guidance
    promptText += `⚠️ **No AI_README.md files found in this project.**\n\n`;
    promptText += `To get the most out of AI assistance, consider creating an AI_README.md file to document:\n`;
    promptText += `- Project architecture and conventions\n`;
    promptText += `- Coding standards and best practices\n`;
    promptText += `- Testing requirements\n`;
    promptText += `- Common patterns to follow\n\n`;
    promptText += `**Quick Start:**\n`;
    promptText += `Use the \`init_ai_readme\` tool to create a template:\n`;
    promptText += `- Creates AI_README.md from a customizable template\n`;
    promptText += `- Helps maintain consistency across your team\n`;
    promptText += `- Improves AI output quality\n`;
  } else {
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

    promptText += `---\n`;
    promptText += `**Important:**\n`;
    promptText += `- Follow the above conventions when making changes\n`;
    promptText += `- When establishing NEW conventions: update AI_README first → get context → write code\n`;
    promptText += `- When discovering patterns in existing code: document them in AI_README afterward\n`;
  }

  return {
    filePath,
    totalContexts: contexts.length,
    contexts: formattedContexts,
    formattedPrompt: promptText,
  };
}

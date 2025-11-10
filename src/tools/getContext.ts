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

  // Check for empty AI_README files
  const hasEmptyReadmes = contexts.some(ctx => !ctx.content || ctx.content.trim().length === 0);
  const hasNoReadmes = contexts.length === 0;

  // Format the response with a helpful prompt template
  const formattedContexts = contexts.map((ctx) => ({
    path: ctx.path,
    relevance: ctx.relevance,
    distance: ctx.distance,
    content: ctx.content,
  }));

  // Generate a formatted prompt for the AI
  let promptText = `## 📚 Project Context for: ${filePath}\n\n`;

  // Simple check: if empty or no READMEs, suggest using init tool
  if (hasNoReadmes || hasEmptyReadmes) {
    promptText += `⚠️ **Empty or missing AI_README files detected.**\n\n`;
    promptText += `**Recommended Action:** Use the \`init_ai_readme\` tool to automatically populate AI_README files.\n\n`;
    promptText += `\`\`\`\n`;
    promptText += `init_ai_readme({ projectRoot: "${projectRoot.replace(/\\/g, '/')}" })\n`;
    promptText += `\`\`\`\n\n`;
    promptText += `This tool will:\n`;
    promptText += `- Scan the project for empty AI_README files\n`;
    promptText += `- Guide you through populating them with conventions\n`;
    promptText += `- Ensure consistent documentation across your project\n\n`;
    promptText += `💡 Alternatively, you can manually create and populate AI_README.md files, then call this tool again.\n\n`;
    promptText += `---\n\n`;
  }

  // Filter out empty contexts (content with only whitespace)
  const nonEmptyContexts = contexts.filter(ctx => ctx.content && ctx.content.trim().length > 0);

  if (nonEmptyContexts.length > 0) {
    // Show non-empty contexts
    for (const ctx of nonEmptyContexts) {
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

/**
 * MCP Tool: get_context_for_file
 * Gets relevant AI_README context for a specific file path
 */

import { z } from 'zod';
import { AIReadmeScanner } from '../core/scanner.js';
import { ContextRouter } from '../core/router.js';

export const getContextSchema = z.object({
  projectRoot: z.string().describe('The root directory of the project. Use the current working directory (e.g., from environment or pwd). If unsure, pass the project root path.'),
  path: z
    .string()
    .describe(
      'The path to get context for (relative to project root). ' +
      'Can be either a FILE path or a DIRECTORY path. ' +
      'Examples: "src/components/Button.tsx", "src/components", "README.md", "src/app". ' +
      'Use "." to get root-level context when no specific file is known. ' +
      'The tool will find all relevant AI_README files in the path\'s directory and parent directories.'
    ),
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
  const { projectRoot, path, includeRoot, excludePatterns } = input;

  // First, scan the project to build the index
  const scanner = new AIReadmeScanner(projectRoot, {
    excludePatterns,
    cacheContent: true, // Cache content for context retrieval
  });

  const index = await scanner.scan();

  // Create router and get context
  const router = new ContextRouter(index);
  const contexts = await router.getContextForPath(path, includeRoot);

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
  let promptText = `## 📚 Project Context for: ${path}\n\n`;

  // Simple check: if empty or no READMEs, suggest using init tool
  if (hasNoReadmes || hasEmptyReadmes) {
    promptText += `🚨 **STOP — DO NOT PROCEED WITH ANY CODE TASK.**\n\n`;
    promptText += `Empty or missing AI_README files detected. You MUST call \`init_ai_readme\` before continuing.\n\n`;
    promptText += `**Call this now:**\n`;
    promptText += `\`\`\`\n`;
    promptText += `init_ai_readme({ projectRoot: "${projectRoot.replace(/\\/g, '/')}" })\n`;
    promptText += `\`\`\`\n\n`;
    promptText += `Do NOT proceed with the original task until AI_README files are populated.\n\n`;
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
    path,
    totalContexts: contexts.length,
    contexts: formattedContexts,
    formattedPrompt: promptText,
  };
}

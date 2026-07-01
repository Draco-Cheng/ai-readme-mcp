/**
 * MCP Tool: get_context_for_file
 * Gets relevant AI_README context for a specific file path
 */

import { z } from 'zod';
import { minimatch } from 'minimatch';
import { AIReadmeScanner, resolveExcludePatterns } from '../core/scanner.js';
import { ContextRouter } from '../core/router.js';
import { ReadmeValidator } from '../core/validator.js';
import { resolveVerbosity } from '../core/verbosity.js';

function pathMatchesExcludes(targetPath: string, patterns: string[]): boolean {
  return patterns.some(p => minimatch(targetPath, p, { dot: true }));
}

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

  const config = await ReadmeValidator.loadConfig(projectRoot);

  const resolvedExcludes = resolveExcludePatterns(excludePatterns, config?.excludePatterns);

  // First, scan the project to build the index
  const scanner = new AIReadmeScanner(projectRoot, {
    excludePatterns: resolvedExcludes,
    cacheContent: true, // Cache content for context retrieval
  });

  const index = await scanner.scan();

  // Create router and get context. Same exclude globs gate the routing layer:
  // if the file the caller is editing sits under an excluded path, the user
  // has opted out — don't push any context (including root) at them.
  const router = new ContextRouter(index);
  const contexts = await router.getContextForPath(path, includeRoot, resolvedExcludes);

  // If the path is excluded by user config, short-circuit with a one-liner so
  // the LLM doesn't mistake "no context" for "AI_README missing → run init".
  if (contexts.length === 0 && pathMatchesExcludes(path, resolvedExcludes)) {
    return {
      path,
      totalContexts: 0,
      contexts: [],
      formattedPrompt:
        `## 📚 Project Context for: ${path}\n\n` +
        `_This path is excluded by \`excludePatterns\` — no AI_README context injected._\n`,
    };
  }

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

    // The writing-guide reminder is only useful when the agent is actually
    // WRITING an AI_README — but it gets appended to every read. In medium mode
    // collapse it to one line (update_ai_readme carries the full guidance where
    // it's needed); high mode keeps the full reminder inline.
    if (resolveVerbosity(config?.verbosity) === 'medium') {
      promptText += `---\n`;
      promptText += `Follow the above conventions. To record a new/changed convention, use update_ai_readme (never edit AI_README.md directly).\n`;
    } else {
      promptText += `---\n`;
      promptText += `**Important:**\n`;
      promptText += `- Follow the above conventions when making changes\n`;
      promptText += `- When establishing NEW conventions: update AI_README first → get context → write code\n`;
      promptText += `- When discovering patterns in existing code: document them in AI_README afterward\n`;
      promptText += `- Record a convention ONLY if it is non-obvious (AI would get it wrong by reading the code alone) — as one line. Record nothing AI can re-derive from the code: directory structure, standard naming, framework defaults, generic test commands, exhaustive endpoint/field/file lists, per-file descriptions. ("We use async/await" is obvious; "bcrypt direct, NOT passlib" is a trap worth a line.)\n`;
      promptText += `- Adding to AI_README: bulleted keywords, NOT prose. 1 bullet ("- ") = 1 fact AI'd get wrong from code (+why only if it stops reversion). A run-on sentence chaining facts with ";"/"then"/"—" is a wall — break it into separate bullets. Fragments.\n`;
      promptText += `  KEEP the fact (rule/invariant/trap) + why. DROP how-to AI reads from code — where it lives (paths, template names), what toggles it (flags, env), step-by-step mechanism → one "See <file>." pointer. Naming a file is fine; describing its contents is not.\n`;
      promptText += `  When you append to a dense section, break the existing paragraph into bullets too — never grow the wall.\n`;
    }
  }

  return {
    path,
    totalContexts: contexts.length,
    contexts: formattedContexts,
    formattedPrompt: promptText,
  };
}

/**
 * MCP Tool: init_ai_readme
 * Scans project for empty AI_README files and populates them with AI-generated content
 */

import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { AIReadmeScanner, resolveExcludePatterns } from '../core/scanner.js';
import { ReadmeValidator } from '../core/validator.js';
import { TOKEN_EFFICIENT_FORMAT_GUIDE } from '../core/writingGuide.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/index.js';

export const initSchema = z.object({
  projectRoot: z.string().describe('The root directory of the project. Use the current working directory (e.g., from environment or pwd). If unsure, pass the project root path.'),
  excludePatterns: z
    .array(z.string())
    .optional()
    .describe('Glob patterns to exclude when scanning'),
  targetPath: z
    .string()
    .optional()
    .describe('Specific directory to initialize (optional, defaults to scanning entire project)'),
});

export type InitInput = z.infer<typeof initSchema>;

interface EmptyReadmeInfo {
  path: string;
  dirPath: string;
  needsCreation: boolean;
}

/**
 * Initialize AI_README files in the project
 * - Scans for empty or missing AI_README files
 * - Prompts AI to populate them with project conventions
 */
export async function initAIReadme(input: InitInput) {
  const { projectRoot, excludePatterns, targetPath } = input;

  const config = await ReadmeValidator.loadConfig(projectRoot);
  const tokenBudget = config?.tokenBudget ?? DEFAULT_VALIDATION_CONFIG.tokenBudget;

  // Scan the project
  const scanner = new AIReadmeScanner(projectRoot, {
    excludePatterns: resolveExcludePatterns(excludePatterns, config?.excludePatterns),
    cacheContent: true,
  });

  const index = await scanner.scan();

  // Find empty AI_README files
  const emptyReadmes: EmptyReadmeInfo[] = [];

  // Check existing AI_READMEs
  for (const readme of index.readmes) {
    if (!readme.content || readme.content.trim().length === 0) {
      emptyReadmes.push({
        path: readme.path,
        dirPath: readme.path.replace(/[\/\\]AI_README\.md$/, ''),
        needsCreation: false,
      });
    }
  }

  // Check if root-level AI_README is missing (even if sub-directories have one)
  const rootReadmePath = join(projectRoot, 'AI_README.md');
  const hasRootReadme = index.readmes.some(r => {
    const normalized = r.path.replace(/\\/g, '/');
    const normalizedRoot = projectRoot.replace(/\\/g, '/');
    return normalized === `${normalizedRoot}/AI_README.md` || normalized === rootReadmePath.replace(/\\/g, '/');
  });

  if (index.readmes.length === 0) {
    // No AI_README exists at all — create one at project root
    if (!existsSync(rootReadmePath)) {
      await writeFile(rootReadmePath, '', 'utf-8');
    }

    emptyReadmes.push({
      path: rootReadmePath,
      dirPath: projectRoot,
      needsCreation: true,
    });
  }

  // If targetPath is specified, filter to only that path
  let targetReadmes = emptyReadmes;
  if (targetPath) {
    const normalizedTarget = targetPath.replace(/\\/g, '/');
    targetReadmes = emptyReadmes.filter(r =>
      r.dirPath.replace(/\\/g, '/').includes(normalizedTarget)
    );
  }

  // If no empty READMEs found
  if (targetReadmes.length === 0) {
    const populatedPaths = index.readmes.map(r => `- ${r.path.replace(/\\/g, '/')}`).join('\n');
    const rootWarning = !hasRootReadme && index.readmes.length > 0
      ? `\n\n⚠️ **No root-level AI_README.md found.**\n` +
        `Sub-directory README(s) exist but there is no project-wide conventions file at the root.\n` +
        `Ask the user: "Do you want me to create a root-level AI_README.md for project-wide conventions?"`
      : '';

    return {
      success: true,
      message: `✅ All existing AI_README files are already populated!\n\nFound:\n${populatedPaths}${rootWarning}`,
      initialized: [],
    };
  }

  // Generate initialization instructions for AI
  let promptText = `# 🚀 AI_README Initialization\n\n`;
  promptText += `Found ${targetReadmes.length} AI_README file(s) that need population.\n\n`;

  if (targetReadmes.some(r => r.needsCreation)) {
    promptText += `✅ Created empty AI_README file(s) at:\n`;
    for (const readme of targetReadmes.filter(r => r.needsCreation)) {
      promptText += `- ${readme.path.replace(/\\/g, '/')}\n`;
    }
    promptText += `\n`;
  }

  promptText += `## 📋 Required Actions\n\n`;
  promptText += `You must populate the following AI_README files by analyzing their respective directories:\n\n`;

  for (let i = 0; i < targetReadmes.length; i++) {
    const readme = targetReadmes[i]!;
    const readmePath = readme.path.replace(/\\/g, '/');
    const dirPath = readme.dirPath.replace(/\\/g, '/');

    promptText += `### ${i + 1}. ${readmePath}\n\n`;
    promptText += `**Directory to analyze:** \`${dirPath}\`\n\n`;
    promptText += `**Steps:**\n\n`;
    promptText += `1. **Scan directory contents:**\n`;
    promptText += `   \`\`\`\n`;
    promptText += `   Use Glob: pattern="**/*", path="${dirPath}"\n`;
    promptText += `   \`\`\`\n\n`;
    promptText += `2. **Read key source files** (pick 2-5 representative files):\n`;
    promptText += `   - Configuration files (package.json, tsconfig.json, etc.)\n`;
    promptText += `   - Main source files\n`;
    promptText += `   - Important modules/components\n\n`;
    promptText += `3. **Analyze and write a concise AI_README:**\n\n`;
    promptText += `   Use update_ai_readme to populate. Format = bulleted keywords, NOT prose: 1 "- " bullet = 1 fact AI'd get wrong from code alone (+why only if it stops reversion). Record only non-obvious facts; skip anything AI can re-derive from the code.\n\n`;
    promptText += `   **What to include (pick what's relevant, one bullet each):**\n`;
    promptText += `   - Tech choices that are traps (a non-default/surprising one), not the whole stack AI reads from deps\n`;
    promptText += `   - **Cross-directory dependencies** (IMPORTANT for monorepos: "UI components in libs/ui", "shared types in packages/common")\n`;
    promptText += `   - Invariants / restrictions AI would violate (e.g., "no emoji", "never write to X directly")\n`;
    promptText += `   - For where-it-lives / how-it-works: one "See <file>." pointer, not a description of its contents\n\n`;
    promptText += `   **Example - bullets, 1 fact each:**\n`;
    promptText += `   \`\`\`\n`;
    promptText += `   # apps/web\n`;
    promptText += `   - Next.js 14 App Router; Server Components by default (mark client with "use client")\n`;
    promptText += `   - Tailwind only — no inline styles, no CSS modules\n`;
    promptText += `   - Shared UI in libs/ui-components; shared types in packages/common\n`;
    promptText += `   \`\`\`\n\n`;
    promptText += `   **Keep it concise:** <${tokenBudget} tokens. Focus on what helps AI generate better code.\n\n`;
  }

  promptText += `${TOKEN_EFFICIENT_FORMAT_GUIDE}\n`;

  promptText += `## 🔍 Validation & Optimization\n\n`;
  promptText += `After populating each AI_README, run validation and fix any issues:\n\n`;
  promptText += `1. **Run validate_ai_readmes** to check for problems\n`;
  promptText += `2. **Fix any warnings** - remove redundant content (Project Structure, Naming Conventions, Testing sections)\n`;
  promptText += `3. **Fix filler-language warnings** - compress verbose lines or run compress_ai_readme\n`;
  promptText += `4. **Add "## Cross-directory dependencies"** section (can be empty or "None" if no external dependencies)\n`;
  promptText += `5. **Re-validate** until all files pass with no warnings\n\n`;

  promptText += `---\n\n`;
  promptText += `💡 **Remember:** AI_README is for AI, not humans. Write what helps AI understand your project - token-efficient format beats lengthy documentation.\n`;

  return {
    success: true,
    message: `Found ${targetReadmes.length} AI_README file(s) to initialize`,
    readmesToInitialize: targetReadmes.map(r => r.path.replace(/\\/g, '/')),
    instructions: promptText,
  };
}

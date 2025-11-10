/**
 * MCP Tool: init_ai_readme
 * Scans project for empty AI_README files and populates them with AI-generated content
 */

import { z } from 'zod';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { AIReadmeScanner } from '../core/scanner.js';

export const initSchema = z.object({
  projectRoot: z.string().describe('The root directory of the project'),
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

  // Scan the project
  const scanner = new AIReadmeScanner(projectRoot, {
    excludePatterns,
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

  // If no AI_README exists at all, create one at project root
  if (index.readmes.length === 0) {
    const rootReadmePath = join(projectRoot, 'AI_README.md');

    // Create empty file if it doesn't exist
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
    return {
      success: true,
      message: '✅ All AI_README files are already populated!',
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
    const readme = targetReadmes[i];
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
    promptText += `3. **Analyze and identify:**\n`;
    promptText += `   - 📦 **Tech Stack**: Frameworks, libraries, languages, tools\n`;
    promptText += `   - 🏗️ **Architecture**: Project structure, design patterns\n`;
    promptText += `   - 📝 **Coding Conventions**: Naming, formatting, patterns\n`;
    promptText += `   - 🗂️ **File Structure**: Directory organization, module boundaries\n\n`;
    promptText += `4. **Populate AI_README:**\n`;
    promptText += `   \`\`\`\n`;
    promptText += `   Use update_ai_readme:\n`;
    promptText += `   {\n`;
    promptText += `     readmePath: "${readmePath}",\n`;
    promptText += `     operations: [{\n`;
    promptText += `       type: "append",\n`;
    promptText += `       content: "<your analysis in markdown format>"\n`;
    promptText += `     }]\n`;
    promptText += `   }\n`;
    promptText += `   \`\`\`\n\n`;
    promptText += `   **Include these sections:**\n`;
    promptText += `   - \`## Tech Stack\` - List frameworks, libraries, tools\n`;
    promptText += `   - \`## Architecture Patterns\` - Design patterns, project structure\n`;
    promptText += `   - \`## Coding Conventions\` - Naming, formatting, best practices\n`;
    promptText += `   - \`## File Structure\` - Directory organization (brief)\n\n`;
    promptText += `   **Keep it concise:** AI_READMEs should be <400 tokens. Focus on actionable conventions.\n\n`;
  }

  promptText += `---\n\n`;
  promptText += `💡 **Tips:**\n`;
  promptText += `- Work through each README sequentially\n`;
  promptText += `- Be concise - every token counts!\n`;
  promptText += `- Focus on conventions that help generate better code\n`;
  promptText += `- After completing all, you can verify with \`validate_ai_readmes\`\n\n`;
  promptText += `**Start with the first AI_README now!**\n`;

  return {
    success: true,
    message: `Found ${targetReadmes.length} AI_README file(s) to initialize`,
    readmesToInitialize: targetReadmes.map(r => r.path.replace(/\\/g, '/')),
    instructions: promptText,
  };
}

import { z } from 'zod';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Zod schema for init_ai_readme tool
 */
export const initSchema = z.object({
  targetPath: z.string().describe('Directory where AI_README.md will be created'),
  projectName: z.string().optional().describe('Project name to use in the template (optional)'),
  overwrite: z.boolean().optional().describe('Whether to overwrite existing AI_README.md (default: false)'),
});

export type InitInput = z.infer<typeof initSchema>;

/**
 * Initialize a new AI_README.md file from template
 *
 * @param input - Initialization parameters
 * @returns Result with created file path
 *
 * @example
 * ```typescript
 * await initAIReadme({
 *   targetPath: '/path/to/project',
 *   projectName: 'My Awesome Project',
 *   overwrite: false
 * });
 * ```
 */
export async function initAIReadme(input: InitInput) {
  const { targetPath, projectName, overwrite = false } = input;

  try {
    // Validate target path
    if (!existsSync(targetPath)) {
      return {
        success: false,
        error: `Target directory does not exist: ${targetPath}`,
        message: `Failed to create AI_README.md: Directory not found`,
      };
    }

    const readmePath = join(targetPath, 'AI_README.md');

    // Check if file already exists
    if (existsSync(readmePath) && !overwrite) {
      return {
        success: false,
        error: 'AI_README.md already exists',
        message: `AI_README.md already exists at ${readmePath}. Use overwrite: true to replace it.`,
        existingPath: readmePath,
      };
    }

    // Get template path
    // In production (dist/), template is at ../../docs/templates/basic.md
    // In development (src/), template is at ../../docs/templates/basic.md
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const templatePath = join(__dirname, '..', '..', 'docs', 'templates', 'basic.md');

    if (!existsSync(templatePath)) {
      return {
        success: false,
        error: `Template file not found: ${templatePath}`,
        message: 'Template file is missing. Please check installation.',
      };
    }

    // Read template
    let content = await readFile(templatePath, 'utf-8');

    // Replace placeholders
    const finalProjectName = projectName || 'Project Name';
    content = content.replace(/\{\{PROJECT_NAME\}\}/g, finalProjectName);

    // Write to target
    await writeFile(readmePath, content, 'utf-8');

    return {
      success: true,
      readmePath,
      projectName: finalProjectName,
      message: `Successfully created AI_README.md at ${readmePath}. Edit the file to customize it for your project.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: `Failed to create AI_README.md: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

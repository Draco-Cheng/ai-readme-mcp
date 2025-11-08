import { z } from 'zod';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { ProjectDetector } from '../core/detector.js';
import { AIReadmeScanner } from '../core/scanner.js';

/**
 * Zod schema for init_ai_readme tool
 */
export const initSchema = z.object({
  targetPath: z.string().describe('Directory where AI_README.md will be created'),
  projectName: z.string().optional().describe('Project name to use in the template (optional)'),
  overwrite: z.boolean().optional().describe('Whether to overwrite existing AI_README.md (default: false)'),
  smart: z.boolean().optional().describe('Enable smart content generation based on project analysis (default: true)'),
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
  const smart = input.smart !== false; // Default to true unless explicitly set to false

  console.error(`[DEBUG] init_ai_readme: smart=${smart}, input.smart=${input.smart}`);

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

    // Check if file exists and is empty
    const fileExists = existsSync(readmePath);
    let isEmpty = false;

    if (fileExists) {
      const existingContent = await readFile(readmePath, 'utf-8');
      isEmpty = existingContent.trim().length < 50; // Consider empty if less than 50 characters

      if (!isEmpty && !overwrite) {
        return {
          success: false,
          error: 'AI_README.md already exists with content',
          message: `AI_README.md already exists at ${readmePath}. Use overwrite: true to replace it.`,
          existingPath: readmePath,
        };
      }
    }

    let content: string;
    let detectedInfo: any = {};

    if (smart) {
      // Smart mode: detect project and generate customized content
      const detector = new ProjectDetector(targetPath);
      const projectInfo = await detector.detect();
      detectedInfo = projectInfo;

      // Check if there's a parent AI_README
      const parentReadme = await findParentReadme(targetPath);
      const isSubdirectory = parentReadme !== null;

      // Generate smart content
      content = await generateSmartContent(projectInfo, targetPath, isSubdirectory, parentReadme);
    } else {
      // Basic mode: use template
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

      content = await readFile(templatePath, 'utf-8');
      const finalProjectName = projectName || 'Project Name';
      content = content.replace(/\{\{PROJECT_NAME\}\}/g, finalProjectName);
    }

    // Write to target
    await writeFile(readmePath, content, 'utf-8');

    const action = fileExists ? (isEmpty ? 'filled' : 'overwritten') : 'created';

    return {
      success: true,
      readmePath,
      action,
      projectInfo: smart ? detectedInfo : undefined,
      message: `Successfully ${action} AI_README.md at ${readmePath}. ${smart ? 'Content generated based on project analysis.' : 'Edit the file to customize it for your project.'}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: `Failed to create AI_README.md: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Find parent AI_README.md by traversing up the directory tree
 */
async function findParentReadme(targetPath: string): Promise<string | null> {
  let currentPath = dirname(targetPath);
  const root = '/';

  while (currentPath !== root) {
    const readmePath = join(currentPath, 'AI_README.md');
    if (existsSync(readmePath)) {
      const content = await readFile(readmePath, 'utf-8');
      // Only consider it a parent if it has content
      if (content.trim().length > 50) {
        return currentPath;
      }
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) break; // Reached filesystem root
    currentPath = parentPath;
  }

  return null;
}

/**
 * Generate smart content based on project analysis
 */
async function generateSmartContent(
  projectInfo: any,
  targetPath: string,
  isSubdirectory: boolean,
  parentPath: string | null
): Promise<string> {
  let content = `# ${projectInfo.projectName}\n\n`;

  // Add subdirectory note if applicable
  if (isSubdirectory && parentPath) {
    const relativePath = relative(parentPath, targetPath);
    content += `> This README extends the root AI_README.md with ${relativePath}-specific conventions.\n\n`;
  }

  // Architecture section
  content += `## Architecture\n\n`;
  content += `- **Type:** ${projectInfo.projectType}\n`;
  content += `- **Language:** ${projectInfo.language}\n`;
  if (projectInfo.framework) {
    content += `- **Framework:** ${projectInfo.framework}\n`;
  }
  content += `\n`;

  // Directory Structure
  if (projectInfo.mainDirs && projectInfo.mainDirs.length > 0) {
    content += `## Directory Structure\n\n`;
    for (const dir of projectInfo.mainDirs) {
      content += `- ${dir}/ - [Add description]\n`;
    }
    content += `\n`;
  }

  // Coding Conventions
  content += `## Coding Conventions\n\n`;
  content += `### File Naming\n`;
  content += `- [Add your file naming conventions here]\n\n`;

  content += `### Code Style\n`;
  if (projectInfo.language === 'TypeScript') {
    content += `- Use TypeScript strict mode\n`;
    content += `- Prefer interfaces over types for object shapes\n`;
  } else if (projectInfo.language === 'Python') {
    content += `- Follow PEP 8 style guide\n`;
    content += `- Use type hints\n`;
  }
  content += `- [Add more style guidelines]\n\n`;

  // Framework-specific conventions
  if (projectInfo.framework) {
    content += `### ${projectInfo.framework} Conventions\n`;
    if (projectInfo.framework === 'React') {
      content += `- Component naming: PascalCase\n`;
      content += `- Hooks naming: use prefix 'use'\n`;
      content += `- Prefer functional components\n`;
    } else if (projectInfo.framework === 'Vue') {
      content += `- Component naming: PascalCase or kebab-case\n`;
      content += `- Use Composition API\n`;
    }
    content += `\n`;
  }

  // Testing
  content += `## Testing\n\n`;
  if (projectInfo.hasTests) {
    content += `- Tests are located in test directories\n`;
  }
  if (projectInfo.packageManager) {
    content += `- Run: \`${projectInfo.packageManager} test\`\n`;
  } else {
    content += `- Run: [Add test command]\n`;
  }
  content += `- Coverage target: [Add target or "not enforced"]\n\n`;

  // Dependencies
  if (projectInfo.dependencies && projectInfo.dependencies.length > 0) {
    content += `## Key Dependencies\n\n`;
    for (const dep of projectInfo.dependencies) {
      content += `- ${dep} - [Add purpose]\n`;
    }
    content += `\n`;
  }

  // Development
  content += `## Development\n\n`;
  if (projectInfo.packageManager) {
    content += `- Install: \`${projectInfo.packageManager} install\`\n`;
    content += `- Dev: \`${projectInfo.packageManager} run dev\`\n`;
    content += `- Build: \`${projectInfo.packageManager} run build\`\n`;
  }
  content += `\n`;

  // Important Notes
  content += `## Important Notes\n\n`;
  content += `- [Add critical information that AI should know]\n`;
  content += `- [Security considerations]\n`;
  content += `- [Performance considerations]\n`;

  return content;
}

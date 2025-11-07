import { z } from 'zod';
import { ReadmeValidator } from '../core/validator.js';
import { AIReadmeScanner } from '../core/scanner.js';
import type { ValidationConfig } from '../types/index.js';

/**
 * Zod schema for validate_ai_readmes tool
 */
export const validateSchema = z.object({
  projectRoot: z.string().describe('The root directory of the project'),
  excludePatterns: z.array(z.string()).optional().describe(
    'Glob patterns to exclude (e.g., ["node_modules/**", ".git/**"])'
  ),
  config: z.object({
    maxTokens: z.number().optional(),
    rules: z.object({
      requireH1: z.boolean().optional(),
      requireSections: z.array(z.string()).optional(),
      allowCodeBlocks: z.boolean().optional(),
      maxLineLength: z.number().optional(),
    }).optional(),
    tokenLimits: z.object({
      excellent: z.number().optional(),
      good: z.number().optional(),
      warning: z.number().optional(),
      error: z.number().optional(),
    }).optional(),
  }).optional().describe('Custom validation configuration (optional, uses defaults if not provided)'),
});

export type ValidateInput = z.infer<typeof validateSchema>;

/**
 * Validate all AI_README.md files in a project
 *
 * @param input - Validation parameters
 * @returns Validation results for all README files
 *
 * @example
 * ```typescript
 * await validateAIReadmes({
 *   projectRoot: '/path/to/project',
 *   excludePatterns: ['node_modules/**'],
 *   config: {
 *     maxTokens: 500,
 *     rules: {
 *       requireH1: true,
 *       requireSections: ['## Architecture', '## Conventions']
 *     }
 *   }
 * });
 * ```
 */
export async function validateAIReadmes(input: ValidateInput) {
  const { projectRoot, excludePatterns, config: userConfig } = input;

  try {
    // Use provided config, fallback to file config if available, then defaults
    let config: Partial<ValidationConfig> | undefined = userConfig;

    if (!config) {
      // Optionally load from .aireadme.config.json if it exists
      const fileConfig = await ReadmeValidator.loadConfig(projectRoot);
      if (fileConfig) {
        config = fileConfig;
      }
    }

    // Create validator with config
    const validator = new ReadmeValidator(config);

    // Scan for all README files
    const scanner = new AIReadmeScanner(projectRoot, {
      excludePatterns: excludePatterns || [],
      cacheContent: false,
    });
    const index = await scanner.scan();

    // Validate each README
    const results = [];
    for (const readme of index.readmes) {
      const result = await validator.validate(readme.path);
      results.push(result);
    }

    // Calculate overall statistics
    const totalFiles = results.length;
    const validFiles = results.filter(r => r.valid).length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const averageScore = totalFiles > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / totalFiles)
      : 0;

    // Group issues by severity
    const issuesBySeverity = {
      error: 0,
      warning: 0,
      info: 0,
    };
    for (const result of results) {
      for (const issue of result.issues) {
        issuesBySeverity[issue.type]++;
      }
    }

    return {
      success: true,
      projectRoot,
      summary: {
        totalFiles,
        validFiles,
        invalidFiles: totalFiles - validFiles,
        totalIssues,
        averageScore,
        issuesBySeverity,
      },
      results,
      message: totalIssues === 0
        ? `All ${totalFiles} README files passed validation! Average score: ${averageScore}/100`
        : `Found ${totalIssues} issues across ${totalFiles} README files. ${validFiles} files passed validation.`,
    };
  } catch (error) {
    return {
      success: false,
      projectRoot,
      error: error instanceof Error ? error.message : String(error),
      message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

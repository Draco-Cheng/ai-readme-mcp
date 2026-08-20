import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join, isAbsolute } from 'path';
import { ReadmeValidator } from '../core/validator.js';
import { AIReadmeScanner, resolveExcludePatterns } from '../core/scanner.js';
import { pickWritingGuideTier, renderWritingGuide } from '../core/writingGuide.js';
import { diagnoseOverBudget } from '../core/overBudgetGuidance.js';
import type { ValidationConfig } from '../types/index.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/index.js';

/**
 * Zod schema for validate_ai_readmes tool
 */
export const validateSchema = z.object({
  projectRoot: z.string().describe('The root directory of the project. Use the current working directory (e.g., from environment or pwd). If unsure, pass the project root path.'),
  excludePatterns: z.array(z.string()).optional().describe(
    'Glob patterns to exclude (e.g., ["node_modules/**", ".git/**"])'
  ),
  config: z.object({
    tokenBudget: z.number().optional(),
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
 *     tokenBudget: 500,
 *     rules: {
 *       requireH1: true,
 *       requireSections: ['## Architecture', '## Conventions']
 *     }
 *   }
 * });
 * ```
 */
function buildValidationMessage(
  totalFiles: number,
  validFiles: number,
  totalIssues: number,
  averageScore: number,
  results: Awaited<ReturnType<InstanceType<typeof ReadmeValidator>['validate']>>[],
  tokenBudget: number,
  diagnoses: Map<string, string>
): string {
  if (totalIssues === 0) {
    return `All ${totalFiles} README files passed validation! Average score: ${averageScore}/100`;
  }

  let msg = `Found ${totalIssues} issues across ${totalFiles} README files. ${validFiles} files passed validation.`;

  // Check if any file has filler-language or token-count warnings → suggest compress
  const fillerFiles = results.filter(r =>
    r.issues.some(i => i.rule === 'filler-language' || (i.rule === 'token-count' && i.type !== 'info'))
  );
  if (fillerFiles.length > 0) {
    const paths = fillerFiles.map(r => r.filePath).join(', ');
    msg += `\n\n💡 Run compress_ai_readme on: ${paths}\n   Use dryRun:true first to preview changes.`;
  }

  // Tiered writing-philosophy reminder. Individual issue suggestions don't convey
  // the overall direction (concise, fragments OK, AI-not-human audience), so when
  // files are drifting we surface the same guide taught at init time.
  const tiered = results.map(r => ({
    result: r,
    score: r.score ?? 100,
    tokens: r.stats?.tokens ?? 0,
    tier: pickWritingGuideTier(r.score ?? 100, r.stats?.tokens ?? 0, tokenBudget),
  }));

  const fullTier = tiered.filter(t => t.tier === 'full');
  const lightTier = tiered.filter(t => t.tier === 'light');

  if (fullTier.length > 0) {
    // Per-file diagnosis, not a blanket "rewrite": the right fix differs
    // (split a dominant section / architecture check / rewrite), and telling
    // the agent "rewrite" for a split-shaped file makes it delete real signal.
    // validate only LABELS the fix; compress/update deliver the full steps.
    const paths = fullTier
      .map(t => {
        const label = diagnoses.get(t.result.filePath);
        return `${t.result.filePath} (score: ${t.score}, tokens: ${t.tokens})${label ? ` — likely fix: ${label}` : ''}`;
      })
      .join('\n  - ');
    msg += `\n\n🚨 These files are severely over budget — patching won't fix them:\n  - ${paths}\n\n` +
      `Run compress_ai_readme (or edit via update_ai_readme) on each — it returns the full steps for the fix named above.\n\n` +
      `${renderWritingGuide('full', tokenBudget)}`;
  } else if (lightTier.length > 0) {
    const paths = lightTier
      .map(t => `${t.result.filePath} (score: ${t.score}, tokens: ${t.tokens})`)
      .join('\n  - ');
    msg += `\n\n⚠️  These files are drifting — tighten them up:\n  - ${paths}\n\n${renderWritingGuide('light', tokenBudget)}`;
  }

  return msg;
}

export async function validateAIReadmes(input: ValidateInput) {
  const { projectRoot, excludePatterns, config: userConfig } = input;

  try {
    // Always load the file config — even when a per-call config is given, it
    // carries project-level excludePatterns the caller didn't pass.
    const fileConfig = await ReadmeValidator.loadConfig(projectRoot);

    // Use provided config, fallback to file config if available, then defaults.
    const config: Partial<ValidationConfig> | undefined = userConfig ?? fileConfig ?? undefined;

    const tokenBudget = config?.tokenBudget ?? DEFAULT_VALIDATION_CONFIG.tokenBudget;

    // Create validator with config
    const validator = new ReadmeValidator(config);

    // Scan for all README files
    const scanner = new AIReadmeScanner(projectRoot, {
      excludePatterns: resolveExcludePatterns(excludePatterns, fileConfig?.excludePatterns),
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

    // One-line fix diagnosis for severely over-budget files — same decision
    // core as compress/update (diagnoseOverBudget), so the survey label never
    // disagrees with the tool that later acts on the file.
    const splitThreshold =
      config?.sectionSplitThreshold ?? DEFAULT_VALIDATION_CONFIG.sectionSplitThreshold;
    const diagnoses = new Map<string, string>();
    for (const r of results) {
      const tier = pickWritingGuideTier(r.score ?? 100, r.stats?.tokens ?? 0, tokenBudget);
      if (tier !== 'full') continue;
      const abs = isAbsolute(r.filePath) ? r.filePath : join(projectRoot, r.filePath);
      const content = await readFile(abs, 'utf-8').catch(() => '');
      if (!content) continue;
      const d = diagnoseOverBudget(content, splitThreshold);
      diagnoses.set(
        r.filePath,
        d.mode === 'split'
          ? `SPLIT — "${d.dominant!.heading}" ≈${Math.round(d.dominant!.fraction * 100)}% of the file`
          : d.mode === 'restructure'
          ? `ARCHITECTURE CHECK — ${d.sectionCount} sections, none dominant`
          : 'REWRITE — cut low-value content'
      );
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
      message: buildValidationMessage(totalFiles, validFiles, totalIssues, averageScore, results, tokenBudget, diagnoses),
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

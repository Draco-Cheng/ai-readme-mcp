import { z } from 'zod';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname } from 'path';
import { ReadmeUpdater, UpdateOperation } from '../core/updater.js';
import { ReadmeValidator } from '../core/validator.js';
import { pickWritingGuideTier, renderWritingGuide } from '../core/writingGuide.js';
import { buildOverBudgetGuidance } from '../core/overBudgetGuidance.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/index.js';

/**
 * Zod schema for update operation
 */
const updateOperationSchema = z.object({
  type: z.enum(['replace', 'append', 'prepend', 'insert-after', 'insert-before', 'rewrite']).describe(
    'Type of update operation. PREFER targeted operations for normal edits — rewrite is a last resort.\n' +
    '- "replace": targeted text replacement (default choice for editing existing content)\n' +
    '- "insert-after" / "insert-before": add content around a section heading\n' +
    '- "append" / "prepend": add at file boundaries\n' +
    '- "rewrite": replace the ENTIRE file content. ONLY use when the file is corrupted, duplicated, or so bloated that targeted operations are impractical. NEVER use for small additions or single-section updates — those should use replace or insert-after.'
  ),
  section: z.string().optional().describe(
    'Section heading to target (e.g., "## Coding Conventions")'
  ),
  searchText: z.string().optional().describe(
    'Text to search for (required for replace operation)'
  ),
  content: z.string().describe('Content to add or replace (for rewrite: the full new file content)'),
});

/**
 * Zod schema for update_ai_readme tool
 */
export const updateSchema = z.object({
  readmePath: z.string().describe('Path to the AI_README.md file to update'),
  operations: z.array(updateOperationSchema).describe(
    'List of update operations to perform'
  ),
});

export type UpdateInput = z.infer<typeof updateSchema>;

/**
 * Update an AI_README.md file with specified operations
 *
 * @param input - Update parameters
 * @returns Update result with changes
 *
 * @example
 * ```typescript
 * await updateAIReadme({
 *   readmePath: 'apps/frontend/AI_README.md',
 *   operations: [{
 *     type: 'insert-after',
 *     section: '## Directory Structure',
 *     content: '├── src/hooks/  # Custom React hooks'
 *   }]
 * });
 * ```
 *
 * Note: Changes are immediately written to the file.
 * Use git to track changes and rollback if needed.
 */
export async function updateAIReadme(input: UpdateInput) {
  const { readmePath, operations } = input;

  // Snapshot pre-edit health so we can distinguish "AI made it worse" from
  // "file was already broken before this edit" — phrasing changes accordingly.
  const projectRoot = dirname(dirname(readmePath));
  const config = await ReadmeValidator.loadConfig(projectRoot);
  const preValidator = new ReadmeValidator(config || undefined);
  const before = existsSync(readmePath)
    ? await preValidator.validate(readmePath).catch(() => null)
    : null;
  const beforeScore = before?.score ?? 100;
  const beforeTokens = before?.stats?.tokens ?? 0;

  const updater = new ReadmeUpdater();

  // Perform update
  const result = await updater.update(readmePath, operations as UpdateOperation[]);

  if (!result.success) {
    return {
      success: false,
      readmePath,
      error: result.error,
      summary: `Failed to update ${readmePath}: ${result.error}`,
    };
  }

  // Auto-validate after update
  try {
    const validator = new ReadmeValidator(config || undefined);
    const validation = await validator.validate(readmePath);

    // Collect validation warnings
    const warnings = validation.issues
      .filter(i => i.type === 'warning' || i.type === 'error')
      .map(i => `[${i.type.toUpperCase()}] ${i.message}`);

    const workflowTip = result.changes.some(c =>
      c.operation === 'replace' || c.operation === 'append' || c.operation === 'prepend'
    )
      ? '\n\n💡 NEXT STEP: Use get_context_for_file before writing code to ensure you\'re following the updated conventions.'
      : '';

    const compressTip = validation.issues.some(
      i => i.rule === 'filler-language' || (i.rule === 'token-count' && i.type !== 'info')
    )
      ? `\n\n💡 Run compress_ai_readme on ${readmePath} to reduce token footprint. Use dryRun:true first to preview.`
      : '';

    // Tiered writing-guide reminder. Phrasing depends on whether this edit
    // made things worse (you broke it → corrective) or the file was already
    // unhealthy before (heads-up → opportunity to fix). AI shrugs off accusations
    // when "it wasn't me", so don't accuse if the data doesn't support it.
    const tier = pickWritingGuideTier(validation.score ?? 100, validation.stats?.tokens ?? 0);
    const guide = renderWritingGuide(tier);
    const tokens = validation.stats?.tokens ?? 0;
    const score = validation.score ?? 0;
    const SCORE_REGRESSION = 10;
    const TOKEN_REGRESSION = 50;
    const madeWorse =
      before !== null &&
      (score < beforeScore - SCORE_REGRESSION || tokens > beforeTokens + TOKEN_REGRESSION);
    const delta = before !== null
      ? ` (was: ${beforeScore}/${beforeTokens}t → now: ${score}/${tokens}t)`
      : '';

    // For the severe (full) tier, decide SPLIT vs REWRITE the same way compress
    // does — a single subsystem section dominating the file should be relocated,
    // not squeezed. Without this, update only ever says "rewrite", so an edit that
    // pushes a subsystem-heavy file over budget forces the agent to either delete
    // load-bearing safety rules or give up at the <400 gate.
    let fullTierGuidance: { instruction: string; mode: 'split' | 'rewrite' } | null = null;
    if (tier === 'full') {
      const splitThreshold =
        config?.sectionSplitThreshold ?? DEFAULT_VALIDATION_CONFIG.sectionSplitThreshold;
      const content = await readFile(readmePath, 'utf-8').catch(() => '');
      fullTierGuidance = buildOverBudgetGuidance(
        readmePath,
        content,
        tokens,
        score,
        splitThreshold
      );
    }

    let writingGuideTip = '';
    if (tier === 'full' && madeWorse) {
      writingGuideTip = `\n\n🚨 STOP — your edit made ${readmePath} worse${delta}.\nThis isn't a patch problem.${fullTierGuidance!.instruction}`;
    } else if (tier === 'full') {
      writingGuideTip = fullTierGuidance!.instruction;
    } else if (tier === 'light' && madeWorse) {
      writingGuideTip = `\n\n⚠️  Your edit is pushing ${readmePath} off-spec${delta}. Tighten it now before adding more:\n\n${guide}`;
    } else if (tier === 'light') {
      writingGuideTip = `\n\n💡 ${readmePath} is drifting (${tokens} tokens, score ${score}/100). Consider tightening it next time you touch this file:\n\n${guide}`;
    }

    // Experiment: when the file is in 'full' tier (severely broken), return
    // success:false so AI treats this as a failed tool call rather than a
    // successful-with-warnings one. The edit was actually applied, but we want
    // AI to halt and act on the over-budget instruction (split or rewrite).
    const reportSuccess = tier !== 'full';
    const fix = fullTierGuidance?.mode === 'split' ? 'split' : 'rewrite';
    const failureBanner = !reportSuccess
      ? `❌ Update applied, but the file is unusable as AI context (${tokens} tokens, score ${score}/100). Returning success:false to force you to handle the ${fix} before continuing. The edit IS on disk — do not re-apply it. Just do the ${fix} described below.\n\n`
      : '';

    return {
      success: reportSuccess,
      readmePath,
      changes: result.changes,
      summary: `${failureBanner}Successfully updated ${readmePath} with ${result.changes.length} operation(s). Use 'git diff' to review changes.${workflowTip}${compressTip}${writingGuideTip}`,
      validation: {
        valid: validation.valid,
        score: validation.score,
        warnings: warnings.length > 0 ? warnings : undefined,
        stats: validation.stats,
      },
    };
  } catch (validationError) {
    // If validation fails, still return success for the update
    return {
      success: true,
      readmePath,
      changes: result.changes,
      summary: `Successfully updated ${readmePath} with ${result.changes.length} operation(s). Use 'git diff' to review changes.`,
      validation: {
        valid: false,
        error: validationError instanceof Error ? validationError.message : 'Validation failed',
      },
    };
  }
}

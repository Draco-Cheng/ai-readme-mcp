import { z } from 'zod';
import { dirname } from 'path';
import { ReadmeCompressor } from '../core/compressor.js';
import { ReadmeValidator } from '../core/validator.js';
import { pickWritingGuideTier } from '../core/writingGuide.js';
import { buildOverBudgetGuidance } from '../core/overBudgetGuidance.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/index.js';

export const compressSchema = z.object({
  readmePath: z.string().describe('Absolute path to the AI_README.md file to compress'),
  dryRun: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'If true, return compression preview without writing the file (default: false)'
    ),
});

export type CompressInput = z.infer<typeof compressSchema>;

/**
 * Compress an AI_README.md file using deterministic filler-language removal.
 *
 * Applies token-efficient compression rules:
 * - Removes filler words (just, really, basically, actually...)
 * - Shortens verbose phrases ("in order to" → "to", "utilize" → "use"...)
 * - Removes hedging ("you should", "make sure to", "it might be worth"...)
 * - Never touches code blocks, inline code, headings, or technical terms
 *
 * @param input - Compress parameters
 * @returns Compression result with token diff and list of changes
 */
export async function compressAIReadme(input: CompressInput) {
  const { readmePath, dryRun } = input;
  const compressor = new ReadmeCompressor();

  try {
    const result = await compressor.compress(readmePath, dryRun);

    // Validate the post-compression file against the configured token budget.
    // "No filler" is NOT the same as "within budget" — a file can be tight prose
    // yet still too long. Surface the real budget state instead of declaring
    // victory on filler-count alone.
    const projectRoot = dirname(dirname(readmePath));
    const config = await ReadmeValidator.loadConfig(projectRoot);
    const tokenBudget = config?.tokenBudget ?? DEFAULT_VALIDATION_CONFIG.tokenBudget;
    const validator = new ReadmeValidator(config || undefined);
    const validation = await validator.validate(readmePath).catch(() => null);
    const tokens = validation?.stats?.tokens ?? result.tokensAfter;
    const score = validation?.score ?? 100;
    const tier = pickWritingGuideTier(score, tokens, tokenBudget);
    const overBudget = tier !== 'none';
    const splitThreshold =
      config?.sectionSplitThreshold ?? DEFAULT_VALIDATION_CONFIG.sectionSplitThreshold;
    // Section analysis runs on the post-regex content (what the file is/will be
    // after the filler phase), so split decisions reflect the compressed state.
    const analyzedContent = result.compressedContent;

    if (result.changes.length === 0) {
      // No filler to strip. If still over budget, the file is long (not padded)
      // and needs an LLM rewrite — don't mislead the agent with "already concise".
      if (overBudget) {
        const { instruction, mode } = buildOverBudgetGuidance(
          readmePath,
          analyzedContent,
          tokens,
          score,
          splitThreshold,
          tokenBudget
        );
        const tail =
          mode === 'split'
            ? `one section dominates the file, so the fix is to SPLIT it out (below), not squeeze.`
            : `the regex phase can't do it, so the rewrite phase below is the rest of THIS compression, not optional follow-up.`;
        return {
          success: false,
          readmePath,
          summary:
            `⚠️ compress_ai_readme is NOT done with ${readmePath}. ` +
            `The deterministic (regex) phase found no filler to strip, but the file is still over budget ` +
            `(${tokens} tokens, score ${score}/100). The user asked to compress this file, so it MUST get shorter — ` +
            `${tail}${instruction}`,
          tokensBefore: result.tokensBefore,
          tokensAfter: result.tokensAfter,
          reductionPercent: 0,
          changes: [],
          written: false,
          overBudget: true,
          mode,
        };
      }
      return {
        success: true,
        readmePath,
        summary: `No filler language found in ${readmePath}. File is already concise (${tokens} tokens).`,
        tokensBefore: result.tokensBefore,
        tokensAfter: result.tokensAfter,
        reductionPercent: 0,
        changes: [],
        written: false,
      };
    }

    const action = dryRun ? 'Preview (dry-run)' : 'Compressed';
    const changeList = result.changes
      .slice(0, 10)
      .map(
        (c) =>
          `  Line ${c.line}: "${c.original.slice(0, 60)}${c.original.length > 60 ? '...' : ''}"` +
          `\n           → "${c.compressed.slice(0, 60)}${c.compressed.length > 60 ? '...' : ''}"`
      )
      .join('\n');

    const truncated = result.changes.length > 10 ? `\n  ... and ${result.changes.length - 10} more` : '';

    // Filler was stripped, but for a dry run the file on disk is unchanged, so the
    // validation above reflects pre-compression state. Re-estimate budget from the
    // compressed token count in that case; for a real write, trust the validator.
    const stillOverBudget = dryRun
      ? pickWritingGuideTier(score, result.tokensAfter, tokenBudget) !== 'none'
      : overBudget;
    const overBudgetGuidance = stillOverBudget
      ? buildOverBudgetGuidance(
          readmePath,
          analyzedContent,
          dryRun ? result.tokensAfter : tokens,
          score,
          splitThreshold,
          tokenBudget
        )
      : null;

    return {
      success: !stillOverBudget,
      readmePath,
      summary: [
        `${action}: ${readmePath}`,
        `Tokens: ${result.tokensBefore} → ${result.tokensAfter} (-${result.reductionPercent}%)`,
        `Changed ${result.changes.length} line(s):`,
        changeList + truncated,
        dryRun
          ? '\n💡 Run without dryRun:true to apply changes.'
          : '\n✅ File written. Use git diff to review.',
      ].join('\n') + (overBudgetGuidance?.instruction ?? ''),
      tokensBefore: result.tokensBefore,
      tokensAfter: result.tokensAfter,
      reductionPercent: result.reductionPercent,
      changes: result.changes,
      written: result.written,
      overBudget: stillOverBudget,
      mode: overBudgetGuidance?.mode,
    };
  } catch (error) {
    return {
      success: false,
      readmePath,
      summary: `Failed to compress ${readmePath}: ${error instanceof Error ? error.message : String(error)}`,
      tokensBefore: 0,
      tokensAfter: 0,
      reductionPercent: 0,
      changes: [],
      written: false,
    };
  }
}

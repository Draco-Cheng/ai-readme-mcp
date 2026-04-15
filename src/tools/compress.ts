import { z } from 'zod';
import { ReadmeCompressor } from '../core/compressor.js';

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

    if (result.changes.length === 0) {
      return {
        success: true,
        readmePath,
        summary: `No filler language found in ${readmePath}. File is already concise.`,
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

    return {
      success: true,
      readmePath,
      summary: [
        `${action}: ${readmePath}`,
        `Tokens: ${result.tokensBefore} → ${result.tokensAfter} (-${result.reductionPercent}%)`,
        `Changed ${result.changes.length} line(s):`,
        changeList + truncated,
        dryRun
          ? '\n💡 Run without dryRun:true to apply changes.'
          : '\n✅ File written. Use git diff to review.',
      ].join('\n'),
      tokensBefore: result.tokensBefore,
      tokensAfter: result.tokensAfter,
      reductionPercent: result.reductionPercent,
      changes: result.changes,
      written: result.written,
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

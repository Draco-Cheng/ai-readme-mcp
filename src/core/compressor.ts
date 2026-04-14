import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { CompressResult, CompressSuggestion } from '../types/index.js';

/**
 * Filler pattern: [regex, replacement]
 * Replacement '' means remove the phrase entirely.
 * Order matters — more specific patterns first.
 */
const FILLER_PATTERNS: Array<[RegExp, string]> = [
  // Verbose phrases → shorter equivalents
  [/\bin order to\b/gi, 'to'],
  [/\bmake sure that\b/gi, 'ensure'],
  [/\bmake sure to\b/gi, 'ensure'],
  [/\bthe reason is because\b/gi, 'because'],
  [/\bthe reason was because\b/gi, 'because'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bin the event that\b/gi, 'if'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bat the present time\b/gi, 'now'],
  [/\ba large number of\b/gi, 'many'],
  [/\ba wide variety of\b/gi, 'various'],
  [/\bmake use of\b/gi, 'use'],
  [/\butili[sz]e\b/gi, 'use'],
  [/\bimplement a solution for\b/gi, 'fix'],

  // Remove-only phrases (no replacement)
  [/\bit is important to note that\b/gi, ''],
  [/\bit is worth noting that\b/gi, ''],
  [/\bit might be worth\b/gi, ''],
  [/\bit would be good to\b/gi, ''],
  [/\byou could consider\b/gi, ''],
  [/\byou may want to\b/gi, ''],
  [/\bplease note that\b/gi, ''],
  [/\bnote that\b/gi, ''],
  [/\byou should always\b/gi, ''],
  [/\balways remember to\b/gi, ''],
  [/\bremember to\b/gi, ''],
  [/\byou should\b/gi, ''],
  [/\bbasically\b/gi, ''],
  [/\bessentially\b/gi, ''],
  [/\bgenerally speaking\b/gi, ''],
  [/\bin general,? \b/gi, ''],
  [/\bjust\b/gi, ''],
  [/\breally\b/gi, ''],
  [/\bactually\b/gi, ''],
  [/\bsimply\b/gi, ''],
  [/\bfurthermore,? \b/gi, ''],
  [/\badditionally,? \b/gi, ''],
  [/\bin addition,? \b/gi, ''],
  [/\bmoreover,? \b/gi, ''],
  [/\bhowever,? \b/gi, ''],
  [/\bsure,? \b/gi, ''],
  [/\bcertainly,? \b/gi, ''],
  [/\bof course,? \b/gi, ''],
  [/\bhappy to \b/gi, ''],
];

/**
 * Returns true if a line is inside a fenced code block or is indented code.
 * Caller tracks block state externally.
 */
function isCodeFence(line: string): boolean {
  return /^```/.test(line.trim());
}

function isIndentedCode(line: string): boolean {
  return /^    /.test(line); // 4-space indent = code block in some MD flavours
}

/**
 * Compress a single prose line. Returns null if line is unchanged.
 */
export function compressLine(line: string): { compressed: string; patterns: string[] } | null {
  const foundPatterns: string[] = [];
  let result = line;

  for (const [pattern, replacement] of FILLER_PATTERNS) {
    const match = result.match(pattern);
    if (match) {
      foundPatterns.push(match[0]);
      result = result.replace(pattern, replacement);
    }
  }

  // Clean up multiple spaces left by removals
  result = result.replace(/  +/g, ' ').trim();

  // Restore original indentation (leading whitespace)
  const leadingWhitespace = line.match(/^(\s*)/)?.[1] ?? '';
  if (leadingWhitespace && !result.startsWith(leadingWhitespace)) {
    result = leadingWhitespace + result.trimStart();
  }

  if (foundPatterns.length === 0 || result === line) return null;

  return { compressed: result, patterns: foundPatterns };
}

/**
 * Estimate token count (word-based approximation, same as validator)
 */
function estimateTokens(content: string): number {
  const words = content.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.round(words * 1.3);
}

/**
 * ReadmeCompressor - Deterministic compression of AI_README.md prose sections.
 *
 * Rules:
 * - Code blocks (``` fenced) are NEVER modified.
 * - Inline code (`...`) is NEVER modified.
 * - Headings are passed through unchanged.
 * - Only prose lines are compressed using FILLER_PATTERNS.
 */
export class ReadmeCompressor {
  /**
   * Compress a README file in-place.
   *
   * @param readmePath - Absolute path to the AI_README.md file
   * @param dryRun - If true, compute result but do NOT write the file
   * @returns CompressResult with before/after stats
   */
  async compress(readmePath: string, dryRun = false): Promise<CompressResult> {
    if (!existsSync(readmePath)) {
      throw new Error(`File not found: ${readmePath}`);
    }

    const originalContent = await readFile(readmePath, 'utf-8');
    const lines = originalContent.split('\n');

    const compressedLines: string[] = [];
    const changes: CompressSuggestion[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track fenced code block boundaries
      if (isCodeFence(line ?? '')) {
        inCodeBlock = !inCodeBlock;
        compressedLines.push(line ?? '');
        continue;
      }

      // Inside code block or indented code — pass through unchanged
      if (inCodeBlock || isIndentedCode(line ?? '')) {
        compressedLines.push(line ?? '');
        continue;
      }

      // Skip headings
      if ((line ?? '').trim().match(/^#{1,6}\s/)) {
        compressedLines.push(line ?? '');
        continue;
      }

      // Compress prose line
      const result = compressLine(line ?? '');
      if (result) {
        compressedLines.push(result.compressed);
        changes.push({
          line: i + 1,
          original: (line ?? '').trim(),
          compressed: result.compressed.trim(),
          patterns: result.patterns,
        });
      } else {
        compressedLines.push(line ?? '');
      }
    }

    const compressedContent = compressedLines.join('\n');
    const tokensBefore = estimateTokens(originalContent);
    const tokensAfter = estimateTokens(compressedContent);
    const reductionPercent =
      tokensBefore > 0 ? Math.round(((tokensBefore - tokensAfter) / tokensBefore) * 100) : 0;

    if (!dryRun && changes.length > 0) {
      await writeFile(readmePath, compressedContent, 'utf-8');
    }

    return {
      readmePath,
      originalContent,
      compressedContent,
      tokensBefore,
      tokensAfter,
      reductionPercent,
      changes,
      written: !dryRun && changes.length > 0,
    };
  }
}

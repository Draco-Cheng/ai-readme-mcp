import { z } from 'zod';
import { dirname } from 'path';
import { ReadmeCompressor } from '../core/compressor.js';
import { ReadmeValidator } from '../core/validator.js';
import { pickWritingGuideTier, renderWritingGuide } from '../core/writingGuide.js';

/**
 * Build the over-budget rewrite instruction shared by both the "filler stripped
 * but still too long" and "no filler but already too long" paths.
 *
 * Filler-stripping is deterministic regex — it removes padding but cannot shorten
 * content that is long because it says a lot. When the file is STILL over budget
 * after compression (or was never padded to begin with), the only fix is an LLM
 * rewrite. The MCP server has no model of its own, so it hands the job to the
 * calling agent via the same 'rewrite' operation update_ai_readme uses.
 */
function buildRewriteInstruction(readmePath: string, tokens: number, score: number): string {
  const guide = renderWritingGuide('full');
  return (
    `\n\n🛠️  MANDATORY REWRITE — ${readmePath} is at ${tokens} tokens (target: <400), score ${score}/100. ` +
    `Compression removed all filler it could, but the file is still over budget because the content is long, not padded. ` +
    `Deterministic filler-stripping cannot fix this — an LLM rewrite can.\n\n` +
    `Your NEXT tool call MUST be update_ai_readme on this same file with a single 'rewrite' operation that replaces the entire content from scratch. ` +
    `Do not proceed with any other task until this rewrite is done.\n\n` +
    `Exact call shape:\n` +
    `  update_ai_readme({\n` +
    `    readmePath: "${readmePath}",\n` +
    `    operations: [{ type: "rewrite", content: "<full new file content here>" }]\n` +
    `  })\n\n` +
    `This is NOT a squeeze — it is a CUT. The file is long because it records things AI can find itself, not because the sentences are wordy. Removing words won't fix it; removing low-value INFORMATION will.\n\n` +
    `Rewrite requirements:\n` +
    `  - Target: <400 tokens, ideally <200\n` +
    `  - Apply the restraint test to every line: keep it ONLY if it is project-specific AND non-obvious — a fact AI would get wrong by reading the code alone. If AI can re-derive it from the code, DELETE it.\n` +
    `  - DELETE outright: project/directory structure, standard naming, framework defaults, generic test commands, code examples, AND exhaustive enumerations (full endpoint lists, every field/column, per-file descriptions) — AI reads these from the source.\n` +
    `  - KEEP: tech choices with a trap ("bcrypt direct, NOT passlib"), cross-directory deps, invariants/gotchas, the WHY behind a non-obvious rule.\n` +
    `  - Collapse "one line per instance" into "one rule + why". Prefer fewer, higher-signal lines.\n` +
    `  - Use fragments and bullets, not prose paragraphs.\n` +
    `  - Read the current file first to extract the real signal.\n\n` +
    `After the rewrite, verify with validate_ai_readmes, then resume your original task.\n\n` +
    `${guide}`
  );
}

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
    const validator = new ReadmeValidator(config || undefined);
    const validation = await validator.validate(readmePath).catch(() => null);
    const tokens = validation?.stats?.tokens ?? result.tokensAfter;
    const score = validation?.score ?? 100;
    const tier = pickWritingGuideTier(score, tokens);
    const overBudget = tier !== 'none';

    if (result.changes.length === 0) {
      // No filler to strip. If still over budget, the file is long (not padded)
      // and needs an LLM rewrite — don't mislead the agent with "already concise".
      if (overBudget) {
        const instruction = buildRewriteInstruction(readmePath, tokens, score);
        return {
          success: false,
          readmePath,
          summary:
            `⚠️ compress_ai_readme is NOT done with ${readmePath}. ` +
            `The deterministic (regex) phase found no filler to strip, but the file is still over budget ` +
            `(${tokens} tokens, score ${score}/100). The user asked to compress this file, so it MUST get shorter — ` +
            `the regex phase can't do it, so the rewrite phase below is the rest of THIS compression, not optional follow-up.${instruction}`,
          tokensBefore: result.tokensBefore,
          tokensAfter: result.tokensAfter,
          reductionPercent: 0,
          changes: [],
          written: false,
          overBudget: true,
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
      ? pickWritingGuideTier(score, result.tokensAfter) !== 'none'
      : overBudget;
    const rewriteTip = stillOverBudget
      ? buildRewriteInstruction(readmePath, dryRun ? result.tokensAfter : tokens, score)
      : '';

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
      ].join('\n') + rewriteTip,
      tokensBefore: result.tokensBefore,
      tokensAfter: result.tokensAfter,
      reductionPercent: result.reductionPercent,
      changes: result.changes,
      written: result.written,
      overBudget: stillOverBudget,
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

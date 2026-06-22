import { z } from 'zod';
import { dirname } from 'path';
import { ReadmeCompressor } from '../core/compressor.js';
import { ReadmeValidator } from '../core/validator.js';
import { pickWritingGuideTier, renderWritingGuide } from '../core/writingGuide.js';
import { analyzeSections, type SectionStat } from '../core/sectionAnalysis.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/index.js';

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

/**
 * Build the SPLIT instruction — used when an over-budget file is dominated by a
 * single section documenting one subsystem (e.g. a catalog-import pipeline with
 * its own OOM/subprocess/retry traps). Rewriting can't shrink it without losing
 * signal, so the fix is to MOVE that section into a child-directory AI_README.
 *
 * Like the rewrite handoff, the MCP server only detects the dominant section and
 * names it; the agent decides which child directory it belongs to (a semantic
 * call) and performs the move with existing tools.
 */
function buildSplitInstruction(
  readmePath: string,
  tokens: number,
  section: SectionStat,
  thresholdPct: number
): string {
  const pct = Math.round(section.fraction * 100);
  return (
    `\n\n✂️  SPLIT, don't squeeze — ${readmePath} is at ${tokens} tokens, and ONE section ` +
    `"${section.heading}" (line ${section.line}) alone is ~${section.tokens} tokens (${pct}% of the file, over the ${Math.round(thresholdPct * 100)}% split threshold).\n` +
    `This section documents a subsystem dense with its own non-obvious traps — it is NOT filler, so compression/rewrite would have to DELETE real signal to fit. The right fix is to relocate it, not shrink it.\n\n` +
    `Do this BEFORE any other task:\n` +
    `  1. Identify the directory that subsystem actually lives in (read the section — it references the real files/paths). The child AI_README goes THERE so get_context_for_file surfaces it only when editing that subsystem.\n` +
    `  2. Create/extend that directory's AI_README with the section content:\n` +
    `       update_ai_readme({ readmePath: "<subsystem-dir>/AI_README.md", operations: [{ type: "rewrite", content: "<the section, as a standalone file with its own # H1>" }] })\n` +
    `  3. Remove the section from ${readmePath} and leave ONE pointer line in its place, e.g.:\n` +
    `       update_ai_readme({ readmePath: "${readmePath}", operations: [{ type: "replace", searchText: "<the whole section>", content: "<subsystem>: see <subsystem-dir>/AI_README.md" }] })\n\n` +
    `Why this breaks the loop: the heavy subsystem detail no longer counts against the parent file's budget on every unrelated edit, and each file stays independently within budget — so you stop oscillating between compress and re-bloat.\n\n` +
    `If NO child directory fits (the dense content genuinely belongs at this level), fall back to a rewrite instead — apply the restraint test and cut what AI can re-derive.\n\n` +
    `After splitting, verify both files with validate_ai_readmes, then resume your original task.`
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
 * Decide how to handle an over-budget file: SPLIT (a single subsystem section
 * dominates → relocate it) or REWRITE (genuinely bloated → cut). Returns the
 * over-budget instruction text plus a short reason for the summary line.
 *
 * Both triggers from the design must hold for a split:
 *   1. file is over budget (caller already established this), AND
 *   2. one section occupies >= sectionSplitThreshold of the file.
 * When compression couldn't shrink the file (filler-free, point 3), that's the
 * caller's signal the length is structural — exactly when split/rewrite apply.
 */
function buildOverBudgetGuidance(
  readmePath: string,
  content: string,
  tokens: number,
  score: number,
  thresholdFraction: number
): { instruction: string; mode: 'split' | 'rewrite' } {
  const { dominant } = analyzeSections(content);
  if (dominant && dominant.fraction >= thresholdFraction) {
    return {
      instruction: buildSplitInstruction(readmePath, tokens, dominant, thresholdFraction),
      mode: 'split',
    };
  }
  return {
    instruction: buildRewriteInstruction(readmePath, tokens, score),
    mode: 'rewrite',
  };
}

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
          splitThreshold
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
      ? pickWritingGuideTier(score, result.tokensAfter) !== 'none'
      : overBudget;
    const overBudgetGuidance = stillOverBudget
      ? buildOverBudgetGuidance(
          readmePath,
          analyzedContent,
          dryRun ? result.tokensAfter : tokens,
          score,
          splitThreshold
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

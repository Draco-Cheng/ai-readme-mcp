/**
 * Section-level token analysis for AI_README files.
 *
 * When a file is over budget, the fix is usually CUT (rewrite) — but sometimes
 * the file is long because ONE `## section` documents a whole subsystem with its
 * own pile of non-obvious traps (OOM gotchas, subprocess wiring, retry rules).
 * That content isn't redundant, so compress/rewrite can't shrink it without
 * losing signal. The right move is to SPLIT it into a child-directory AI_README.
 *
 * This module finds the dominant section so compress can decide "split vs squeeze".
 * It is deterministic (no LLM) — it only measures size, it does NOT decide where
 * the section should move; that semantic call is left to the agent.
 */

/**
 * Estimate token count (word-based approximation, same heuristic as validator
 * and compressor so the numbers line up across tools).
 */
function estimateTokens(content: string): number {
  const words = content.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.round(words * 1.3);
}

export interface SectionStat {
  /** Heading text including the `##` markers, e.g. "## Catalog-import" */
  heading: string;
  /** Heading line number (1-based) */
  line: number;
  /** Estimated tokens of the section body (heading + content until next heading) */
  tokens: number;
  /** Fraction of the whole file's tokens this section occupies (0..1) */
  fraction: number;
}

export interface DominantSectionResult {
  /** The largest section, or null if the file has no `##`/`###` sections */
  dominant: SectionStat | null;
  /** All sections, sorted largest-first */
  sections: SectionStat[];
  /** Total estimated tokens of the file */
  totalTokens: number;
}

/**
 * Split a README into H2/H3 sections and measure each one's token share.
 *
 * A "section" runs from a heading line up to (but not including) the next heading
 * of the same-or-higher level. The H1 title / preamble before the first H2 is not
 * counted as a section (it's the file's frame, not a splittable subsystem).
 *
 * Code fences are tracked so a `##` inside a ``` block isn't mistaken for a heading.
 */
export function analyzeSections(content: string): DominantSectionResult {
  const lines = content.split('\n');
  const totalTokens = estimateTokens(content);

  const sections: SectionStat[] = [];
  let inCodeBlock = false;
  let current: { heading: string; line: number; bodyLines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const body = [current.heading, ...current.bodyLines].join('\n');
    const tokens = estimateTokens(body);
    sections.push({
      heading: current.heading.trim(),
      line: current.line,
      tokens,
      fraction: totalTokens > 0 ? tokens / totalTokens : 0,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      if (current) current.bodyLines.push(line);
      continue;
    }

    // Only H2/H3 outside code start a splittable section. H1 is the file frame.
    const isSectionHeading = !inCodeBlock && /^#{2,3}\s/.test(line.trim());

    if (isSectionHeading) {
      flush();
      current = { heading: line, line: i + 1, bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  flush();

  sections.sort((a, b) => b.tokens - a.tokens);

  return {
    dominant: sections[0] ?? null,
    sections,
    totalTokens,
  };
}

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildOverBudgetGuidance } from '../../src/core/overBudgetGuidance.js';

// Helper: build content with N sections of roughly equal size, so no single
// section dominates — isolates the "many sections" trigger from the
// "one dominant section" trigger.
function manySections(count: number, wordsPerSection = 20): string {
  const body = Array.from({ length: wordsPerSection }, (_, i) => `word${i}`).join(' ');
  const sections = Array.from(
    { length: count },
    (_, i) => `## Section ${i}\n${body}`
  );
  return `# Title\n\n${sections.join('\n\n')}`;
}

// Helper: content with one huge section and several small ones, so the
// dominant section clearly exceeds the split threshold.
function oneDominantSection(dominantWords: number, smallSectionCount = 2): string {
  const dominantBody = Array.from({ length: dominantWords }, (_, i) => `word${i}`).join(' ');
  const small = Array.from(
    { length: smallSectionCount },
    (_, i) => `## Small ${i}\nshort`
  );
  return `# Title\n\n## Dominant\n${dominantBody}\n\n${small.join('\n\n')}`;
}

describe('buildOverBudgetGuidance — three-way split/restructure/rewrite', () => {
  it('picks SPLIT when one section dominates (>= threshold)', () => {
    const content = oneDominantSection(500, 2);
    const { mode, instruction } = buildOverBudgetGuidance(
      'AI_README.md',
      content,
      900,
      40,
      0.4,
      400
    );
    assert.equal(mode, 'split');
    assert.ok(instruction.includes('SPLIT'), 'instruction should say SPLIT');
    assert.ok(!instruction.includes('ARCHITECTURE CHECK'));
  });

  it('picks RESTRUCTURE when there are many sections and none dominates', () => {
    // 8 roughly-equal sections: no single one hits the 40% threshold, but the
    // section count (8) clears the "many sections" bar (6).
    const content = manySections(8, 20);
    const { mode, instruction } = buildOverBudgetGuidance(
      'apps/admin/AI_README.md',
      content,
      900,
      40,
      0.4,
      400
    );
    assert.equal(mode, 'restructure');
    assert.ok(instruction.includes('ARCHITECTURE CHECK'), 'instruction should frame this as an architecture question');
    assert.ok(
      instruction.includes('INSPECT THE ACTUAL FILES'),
      'agent must judge from real files, not AI_README headings'
    );
    assert.ok(
      instruction.includes('confirm with the user'),
      'restructure MUST require user confirmation before moving files'
    );
  });

  it('picks REWRITE when sections are few and none dominates (genuinely bloated prose)', () => {
    // Only 3 sections, none dominant — below the many-sections bar (6), so
    // this is "just long", not a shape problem.
    const content = manySections(3, 20);
    const { mode, instruction } = buildOverBudgetGuidance(
      'AI_README.md',
      content,
      900,
      40,
      0.4,
      400
    );
    assert.equal(mode, 'rewrite');
    assert.ok(instruction.includes('REWRITE'), 'instruction should say REWRITE');
  });

  it('RESTRUCTURE requires the section count to actually be high — a borderline count still rewrites', () => {
    // 5 sections: below MANY_SECTIONS_THRESHOLD (6) → rewrite, not restructure.
    const content = manySections(5, 20);
    const { mode } = buildOverBudgetGuidance('AI_README.md', content, 900, 40, 0.4, 400);
    assert.equal(mode, 'rewrite');
  });

  it('dominant-section check takes priority even when section count is also high', () => {
    // Many small sections PLUS one dominant one — split wins, since relocating
    // the dominant section is the more targeted fix.
    const smallSections = Array.from({ length: 8 }, (_, i) => `## Small ${i}\nshort`).join('\n\n');
    const dominantWords = Array.from({ length: 600 }, (_, i) => `word${i}`).join(' ');
    const content = `# Title\n\n## Dominant\n${dominantWords}\n\n${smallSections}`;
    const { mode } = buildOverBudgetGuidance('AI_README.md', content, 900, 40, 0.4, 400);
    assert.equal(mode, 'split');
  });
});

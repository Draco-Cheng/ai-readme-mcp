import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_TOKEN_BUDGET,
  deriveTokenLimits,
  lightTierTokens,
  fullTierTokens,
  idealTokens,
} from '../../src/core/budget.js';
import { pickWritingGuideTier } from '../../src/core/writingGuide.js';

describe('budget — derive thresholds from tokenBudget', () => {
  it('default tokenBudget derives the expected validator limits', () => {
    assert.equal(DEFAULT_TOKEN_BUDGET, 400);
    assert.deepEqual(deriveTokenLimits(400), {
      excellent: 200,
      good: 400,
      warning: 600,
      // 2.0× — the natural "double the budget" line (was 2.5×/1000 historically).
      error: 800,
    });
    // Light tier = 1.0× ON PURPOSE: crossing the budget itself must nudge —
    // a higher ratio creates a silent band where a file is over target yet
    // nothing speaks up. (Historically 1.25×/500; changed deliberately.)
    assert.equal(lightTierTokens(400), 400);
    assert.equal(fullTierTokens(400), 700);
    assert.equal(idealTokens(400), 200);
  });

  it('scales proportionally for a larger budget', () => {
    assert.deepEqual(deriveTokenLimits(800), {
      excellent: 400,
      good: 800,
      warning: 1200,
      error: 1600,
    });
    assert.equal(lightTierTokens(800), 800);
    assert.equal(fullTierTokens(800), 1400);
    assert.equal(idealTokens(800), 400);
  });
});

describe('pickWritingGuideTier — scales with tokenBudget', () => {
  it('a 750-token file is "full" at default 400 but "none" at 800', () => {
    // 750 > 700 (full @ 400) → full; but 750 < 800 (light @ 800) → none.
    assert.equal(pickWritingGuideTier(100, 750), 'full');
    assert.equal(pickWritingGuideTier(100, 750, 800), 'none');
  });

  it('crossing the budget itself triggers the light nudge (no silent band)', () => {
    // 631 @ budget 550: over budget → light. Under the old 1.25× ratio this
    // sat silently between 550 and 687.
    assert.equal(pickWritingGuideTier(100, 631, 550), 'light');
    // At or under budget → none.
    assert.equal(pickWritingGuideTier(100, 550, 550), 'none');
  });

  it('low score still forces a tier regardless of budget', () => {
    assert.equal(pickWritingGuideTier(50, 10, 800), 'full');
  });
});

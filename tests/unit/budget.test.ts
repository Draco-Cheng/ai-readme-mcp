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
  it('default tokenBudget reproduces the historical constants exactly', () => {
    // Behavior guarantee: existing projects (no config) see ZERO change.
    assert.equal(DEFAULT_TOKEN_BUDGET, 400);
    assert.deepEqual(deriveTokenLimits(400), {
      excellent: 200,
      good: 400,
      warning: 600,
      error: 1000,
    });
    assert.equal(lightTierTokens(400), 500);
    assert.equal(fullTierTokens(400), 700);
    assert.equal(idealTokens(400), 200);
  });

  it('scales proportionally for a larger budget', () => {
    assert.deepEqual(deriveTokenLimits(800), {
      excellent: 400,
      good: 800,
      warning: 1200,
      error: 2000,
    });
    assert.equal(lightTierTokens(800), 1000);
    assert.equal(fullTierTokens(800), 1400);
    assert.equal(idealTokens(800), 400);
  });
});

describe('pickWritingGuideTier — scales with tokenBudget', () => {
  it('a 750-token file is "full" at default 400 but "none" at 800', () => {
    // 750 > 700 (full @ 400) → full; but 750 < 1000 (light @ 800) → none.
    assert.equal(pickWritingGuideTier(100, 750), 'full');
    assert.equal(pickWritingGuideTier(100, 750, 800), 'none');
  });

  it('low score still forces a tier regardless of budget', () => {
    assert.equal(pickWritingGuideTier(50, 10, 800), 'full');
  });
});

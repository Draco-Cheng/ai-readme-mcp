import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  resolveVerbosity,
  serverInstructions,
  getContextDescription,
  updateDescription,
} from '../../src/core/verbosity.js';

describe('resolveVerbosity', () => {
  it('defaults to high when unset or unrecognized', () => {
    assert.equal(resolveVerbosity(undefined), 'high');
    assert.equal(resolveVerbosity('nonsense'), 'high');
  });

  it('is medium only for the "medium" value (case-insensitive)', () => {
    assert.equal(resolveVerbosity('medium'), 'medium');
    assert.equal(resolveVerbosity('MEDIUM'), 'medium');
  });

  it('accepts explicit high', () => {
    assert.equal(resolveVerbosity('high'), 'high');
  });
});

describe('description builders — medium is materially smaller than high', () => {
  for (const build of [serverInstructions, getContextDescription, updateDescription]) {
    it(`${build.name}: medium < high`, () => {
      const high = build('high');
      const medium = build('medium');
      assert.ok(medium.length > 0, 'medium not empty');
      assert.ok(
        medium.length < high.length / 2,
        `${build.name} medium (${medium.length}) should be < half of high (${high.length})`
      );
    });
  }
});

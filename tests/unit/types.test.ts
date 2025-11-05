import { describe, it, expect } from 'vitest';
import type { ReadmeEntry, ReadmeIndex } from '../../src/types/index.js';

describe('Type definitions', () => {
  it('should create a valid ReadmeEntry', () => {
    const entry: ReadmeEntry = {
      path: 'AI_README.md',
      scope: 'root',
      level: 0,
      patterns: ['**/*'],
    };

    expect(entry.path).toBe('AI_README.md');
    expect(entry.scope).toBe('root');
    expect(entry.level).toBe(0);
  });

  it('should create a valid ReadmeIndex', () => {
    const index: ReadmeIndex = {
      projectRoot: '/test/project',
      readmes: [],
      lastUpdated: new Date(),
    };

    expect(index.projectRoot).toBe('/test/project');
    expect(index.readmes).toEqual([]);
    expect(index.lastUpdated).toBeInstanceOf(Date);
  });
});

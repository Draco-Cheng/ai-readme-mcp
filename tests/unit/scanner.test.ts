/**
 * Scanner tests using Node.js native test runner
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join } from 'path';
import { AIReadmeScanner } from '../../src/core/scanner.js';
import type { ReadmeIndex } from '../../src/types/index.js';

describe('AIReadmeScanner', () => {
  const fixtureRoot = join(process.cwd(), 'tests', 'fixtures', 'sample-monorepo');
  let scanner: AIReadmeScanner;
  let index: ReadmeIndex;

  before(async () => {
    scanner = new AIReadmeScanner(fixtureRoot);
    index = await scanner.scan();
  });

  describe('scan()', () => {
    it('should discover all AI_README.md files', () => {
      assert.strictEqual(index.readmes.length, 3, 'Should find 3 AI_README files');
    });

    it('should include root level README', () => {
      const rootReadme = index.readmes.find(r => r.scope === 'root');
      assert.ok(rootReadme, 'Root README should exist');
      assert.strictEqual(rootReadme.level, 0, 'Root level should be 0');
      assert.strictEqual(rootReadme.path, 'AI_README.md', 'Root path should be AI_README.md');
    });

    it('should include frontend README', () => {
      const frontendReadme = index.readmes.find(r => r.scope === 'apps-frontend');
      assert.ok(frontendReadme, 'Frontend README should exist');
      assert.strictEqual(frontendReadme.level, 2, 'Frontend level should be 2');
      assert.strictEqual(frontendReadme.path, 'apps/frontend/AI_README.md');
    });

    it('should include backend README', () => {
      const backendReadme = index.readmes.find(r => r.scope === 'apps-backend');
      assert.ok(backendReadme, 'Backend README should exist');
      assert.strictEqual(backendReadme.level, 2, 'Backend level should be 2');
      assert.strictEqual(backendReadme.path, 'apps/backend/AI_README.md');
    });

    it('should sort READMEs by level (root first)', () => {
      assert.strictEqual(index.readmes[0]?.level, 0, 'First README should be level 0');
      assert.strictEqual(index.readmes[0]?.scope, 'root', 'First README should be root');
    });

    it('should cache README content when enabled', () => {
      const rootReadme = index.readmes.find(r => r.scope === 'root');
      assert.ok(rootReadme?.content, 'Content should be cached');
      assert.ok(rootReadme.content.includes('Root Level AI_README'), 'Content should include title');
    });

    it('should generate correct glob patterns', () => {
      const rootReadme = index.readmes.find(r => r.scope === 'root');
      assert.deepStrictEqual(rootReadme?.patterns, ['**/*'], 'Root should match all');

      const frontendReadme = index.readmes.find(r => r.scope === 'apps-frontend');
      assert.ok(frontendReadme?.patterns.includes('apps/frontend/**/*'));
      assert.ok(frontendReadme?.patterns.includes('apps/frontend/*'));
    });

    it('should set correct project root', () => {
      assert.strictEqual(index.projectRoot, fixtureRoot);
    });

    it('should set lastUpdated timestamp', () => {
      assert.ok(index.lastUpdated instanceof Date, 'lastUpdated should be a Date');
    });
  });

  describe('options', () => {
    it('should use default exclude patterns', () => {
      const options = scanner.getOptions();
      assert.ok(options.excludePatterns.includes('**/node_modules/**'));
      assert.ok(options.excludePatterns.includes('**/.git/**'));
    });

    it('should accept custom exclude patterns', async () => {
      const customScanner = new AIReadmeScanner(fixtureRoot, {
        excludePatterns: ['**/custom/**'],
      });
      const options = customScanner.getOptions();
      assert.deepStrictEqual(options.excludePatterns, ['**/custom/**']);
    });

    it('should allow disabling content caching', async () => {
      const noCacheScanner = new AIReadmeScanner(fixtureRoot, {
        cacheContent: false,
      });
      const noCacheIndex = await noCacheScanner.scan();
      const rootReadme = noCacheIndex.readmes.find(r => r.scope === 'root');
      assert.strictEqual(rootReadme?.content, undefined, 'Content should not be cached');
    });
  });

  describe('refresh()', () => {
    it('should re-scan the project', async () => {
      const newIndex = await scanner.refresh();
      assert.strictEqual(newIndex.readmes.length, 3);
      assert.ok(newIndex.lastUpdated instanceof Date);
    });
  });

  describe('getProjectRoot()', () => {
    it('should return the project root path', () => {
      assert.strictEqual(scanner.getProjectRoot(), fixtureRoot);
    });
  });
});

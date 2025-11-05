/**
 * Router tests using Node.js native test runner
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join } from 'path';
import { AIReadmeScanner } from '../../src/core/scanner.js';
import { ContextRouter } from '../../src/core/router.js';
import type { ReadmeIndex } from '../../src/types/index.js';

describe('ContextRouter', () => {
  const fixtureRoot = join(process.cwd(), 'tests', 'fixtures', 'sample-monorepo');
  let router: ContextRouter;
  let index: ReadmeIndex;

  before(async () => {
    const scanner = new AIReadmeScanner(fixtureRoot);
    index = await scanner.scan();
    router = new ContextRouter(index);
  });

  describe('getContextForFile()', () => {
    it('should find direct parent README for frontend component', async () => {
      const contexts = await router.getContextForFile(
        'apps/frontend/src/components/atoms/Button.tsx'
      );

      assert.ok(contexts.length > 0, 'Should return at least one context');

      // Should include frontend README as direct/parent match
      const frontendContext = contexts.find(c =>
        c.path === 'apps/frontend/AI_README.md'
      );
      assert.ok(frontendContext, 'Should include frontend README');
      assert.strictEqual(frontendContext.relevance, 'parent', 'Should be parent relevance');
    });

    it('should include root README by default', async () => {
      const contexts = await router.getContextForFile(
        'apps/frontend/src/components/atoms/Button.tsx'
      );

      const rootContext = contexts.find(c => c.path === 'AI_README.md');
      assert.ok(rootContext, 'Should include root README');
      assert.strictEqual(rootContext.relevance, 'root', 'Should be root relevance');
    });

    it('should exclude root README when includeRoot is false', async () => {
      const contexts = await router.getContextForFile(
        'apps/frontend/src/components/atoms/Button.tsx',
        false
      );

      const rootContext = contexts.find(c => c.path === 'AI_README.md');
      assert.strictEqual(rootContext, undefined, 'Should not include root README');
    });

    it('should find correct README for backend file', async () => {
      const contexts = await router.getContextForFile(
        'apps/backend/src/routes/users.ts'
      );

      const backendContext = contexts.find(c =>
        c.path === 'apps/backend/AI_README.md'
      );
      assert.ok(backendContext, 'Should include backend README');
      assert.strictEqual(backendContext.relevance, 'parent');
    });

    it('should calculate correct distance', async () => {
      const contexts = await router.getContextForFile(
        'apps/frontend/src/components/atoms/Button.tsx'
      );

      const frontendContext = contexts.find(c =>
        c.path === 'apps/frontend/AI_README.md'
      );

      // Button.tsx is 3 levels deep from apps/frontend: src/components/atoms
      assert.strictEqual(frontendContext?.distance, 3, 'Distance should be 3');
    });

    it('should sort contexts by distance (closest first)', async () => {
      const contexts = await router.getContextForFile(
        'apps/frontend/src/components/atoms/Button.tsx'
      );

      // Frontend README should be closer than root
      const frontendIndex = contexts.findIndex(c =>
        c.path === 'apps/frontend/AI_README.md'
      );
      const rootIndex = contexts.findIndex(c => c.path === 'AI_README.md');

      assert.ok(frontendIndex < rootIndex, 'Frontend should be before root');
    });

    it('should return content from cached README', async () => {
      const contexts = await router.getContextForFile(
        'apps/frontend/src/components/atoms/Button.tsx'
      );

      const frontendContext = contexts.find(c =>
        c.path === 'apps/frontend/AI_README.md'
      );

      assert.ok(frontendContext?.content, 'Should have content');
      assert.ok(frontendContext.content.includes('Frontend AI_README'));
    });

    it('should handle file in root directory', async () => {
      const contexts = await router.getContextForFile('README.md');

      assert.ok(contexts.length > 0);
      const rootContext = contexts.find(c => c.path === 'AI_README.md');
      assert.ok(rootContext, 'Should include root README');
    });

    it('should handle file in packages/shared', async () => {
      const contexts = await router.getContextForFile(
        'packages/shared/src/utils/format.ts'
      );

      // Should only match root README (no packages/shared/AI_README.md exists)
      assert.strictEqual(contexts.length, 1, 'Should only match root');
      assert.strictEqual(contexts[0]?.path, 'AI_README.md');
      assert.strictEqual(contexts[0]?.relevance, 'root');
    });
  });

  describe('getContextForFiles()', () => {
    it('should get contexts for multiple files', async () => {
      const files = [
        'apps/frontend/src/components/atoms/Button.tsx',
        'apps/backend/src/routes/users.ts',
      ];

      const results = await router.getContextForFiles(files);

      assert.strictEqual(results.size, 2, 'Should have 2 results');
      assert.ok(results.get(files[0]), 'Should have result for first file');
      assert.ok(results.get(files[1]), 'Should have result for second file');
    });
  });

  describe('updateIndex()', () => {
    it('should update the internal index', async () => {
      const newScanner = new AIReadmeScanner(fixtureRoot);
      const newIndex = await newScanner.scan();

      router.updateIndex(newIndex);

      const currentIndex = router.getIndex();
      assert.strictEqual(currentIndex, newIndex);
    });
  });

  describe('getIndex()', () => {
    it('should return the current index', () => {
      const currentIndex = router.getIndex();
      // Just check that it returns a valid index with correct structure
      assert.ok(currentIndex, 'Should return an index');
      assert.strictEqual(currentIndex.readmes.length, 3, 'Should have 3 readmes');
      assert.ok(currentIndex.projectRoot, 'Should have project root');
      assert.ok(currentIndex.lastUpdated instanceof Date, 'Should have lastUpdated');
    });
  });
});

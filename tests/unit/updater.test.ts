import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ReadmeUpdater } from '../../src/core/updater.js';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Per-file temp dir — see validator.test.ts: parallel files sharing one temp dir
// race on cleanup.
const TEST_DIR = join(process.cwd(), 'tests', 'temp-updater');
const TEST_README = join(TEST_DIR, 'TEST_README.md');

const SAMPLE_README = `# Test Project

## Architecture

This is the architecture section.

## Coding Conventions

### File Organization
- Components in src/components/
- Utils in src/utils/

### Naming
- PascalCase for components

## Testing

Run tests with npm test.
`;

describe('ReadmeUpdater', () => {
  let updater: ReadmeUpdater;

  before(async () => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      await mkdir(TEST_DIR, { recursive: true });
    }
  });

  after(async () => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    // Reset updater and test file before each test
    updater = new ReadmeUpdater();
    await writeFile(TEST_README, SAMPLE_README, 'utf-8');
  });

  describe('constructor', () => {
    it('should create updater', () => {
      const newUpdater = new ReadmeUpdater();
      assert.ok(newUpdater, 'Updater should be created');
    });
  });

  describe('update() - append operation', () => {
    it('should append content to the end of file', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'append',
          content: '## Performance\n\n- Use memoization',
        },
      ]);

      assert.strictEqual(result.success, true, 'Update should succeed');
      assert.strictEqual(result.changes.length, 1, 'Should have 1 change');
      assert.strictEqual(result.changes[0].operation, 'append');

      const content = await readFile(TEST_README, 'utf-8');
      assert.ok(content.includes('## Performance'), 'Should include new section');
      assert.ok(content.includes('Use memoization'), 'Should include new content');
    });
  });

  describe('update() - prepend operation', () => {
    it('should prepend content to the beginning of file', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'prepend',
          content: '> This is a prepended note',
        },
      ]);

      assert.strictEqual(result.success, true, 'Update should succeed');
      const content = await readFile(TEST_README, 'utf-8');
      assert.ok(
        content.startsWith('> This is a prepended note'),
        'Should start with prepended content'
      );
    });
  });

  describe('update() - replace operation', () => {
    it('should replace specific text', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'replace',
          searchText: 'Run tests with npm test.',
          content: 'Run tests with: `npm test` or `npm run test:watch`',
        },
      ]);

      assert.strictEqual(result.success, true, 'Update should succeed');
      const content = await readFile(TEST_README, 'utf-8');
      assert.ok(
        content.includes('npm run test:watch'),
        'Should include replaced content'
      );
      assert.ok(
        !content.includes('Run tests with npm test.'),
        'Should not include old content'
      );
    });

    it('should fail if search text not found', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'replace',
          searchText: 'This text does not exist',
          content: 'New content',
        },
      ]);

      assert.strictEqual(result.success, false, 'Update should fail');
      assert.ok(
        result.error?.includes('Text not found'),
        'Error should mention text not found'
      );
    });

    it('should show the closest matching lines when searchText is a near-miss', async () => {
      // One word off from the real line ("Run tests with npm test." in the fixture) —
      // this is the common case: an LLM re-typing remembered content instead of
      // copying it exactly.
      const result = await updater.update(TEST_README, [
        {
          type: 'replace',
          searchText: 'Run tests using npm test.',
          content: 'New content',
        },
      ]);

      assert.strictEqual(result.success, false, 'Update should fail');
      assert.ok(
        result.error?.includes('Closest match in the file'),
        'Error should surface the closest match'
      );
      assert.ok(
        result.error?.includes('Run tests with npm test.'),
        'Closest match should show the actual line'
      );
    });

    it('should omit the hint when nothing in the file is close enough', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'replace',
          searchText: 'Completely unrelated multi word content string here',
          content: 'New content',
        },
      ]);

      assert.strictEqual(result.success, false, 'Update should fail');
      assert.ok(
        !result.error?.includes('Closest match in the file'),
        'Should not show a misleading low-similarity match'
      );
    });
  });

  describe('update() - insert-after operation', () => {
    it('should insert content after a section', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'insert-after',
          section: '## Coding Conventions',
          content: '### Code Style\n- Use TypeScript strict mode',
        },
      ]);

      assert.strictEqual(result.success, true, 'Update should succeed');
      const content = await readFile(TEST_README, 'utf-8');
      assert.ok(content.includes('### Code Style'), 'Should include new subsection');

      // Verify it's after "Coding Conventions" but before "Testing"
      const codingConvIndex = content.indexOf('## Coding Conventions');
      const codeStyleIndex = content.indexOf('### Code Style');
      const testingIndex = content.indexOf('## Testing');

      assert.ok(
        codeStyleIndex > codingConvIndex,
        'Code Style should be after Coding Conventions'
      );
      assert.ok(codeStyleIndex < testingIndex, 'Code Style should be before Testing');
    });

    it('should fail if section not found', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'insert-after',
          section: '## Nonexistent Section',
          content: 'New content',
        },
      ]);

      assert.strictEqual(result.success, false, 'Update should fail');
      assert.ok(
        result.error?.includes('Section not found'),
        'Error should mention section not found'
      );
    });
  });

  describe('update() - insert-before operation', () => {
    it('should insert content before a section', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'insert-before',
          section: '## Testing',
          content: '## Performance\n\n- Optimize bundle size',
        },
      ]);

      assert.strictEqual(result.success, true, 'Update should succeed');
      const content = await readFile(TEST_README, 'utf-8');

      // Verify it's before "Testing"
      const performanceIndex = content.indexOf('## Performance');
      const testingIndex = content.indexOf('## Testing');

      assert.ok(
        performanceIndex < testingIndex,
        'Performance should be before Testing'
      );
    });
  });

  describe('update() - multiple operations', () => {
    it('should apply multiple operations in sequence', async () => {
      const result = await updater.update(TEST_README, [
        {
          type: 'append',
          content: '## License\n\nMIT',
        },
        {
          type: 'replace',
          searchText: 'npm test',
          content: 'npm run test',
        },
      ]);

      assert.strictEqual(result.success, true, 'Update should succeed');
      assert.strictEqual(result.changes.length, 2, 'Should have 2 changes');

      const content = await readFile(TEST_README, 'utf-8');
      assert.ok(content.includes('## License'), 'Should include appended section');
      assert.ok(content.includes('npm run test'), 'Should include replaced text');
    });
  });

  describe('update() - error handling', () => {
    it('should handle file not found', async () => {
      const result = await updater.update('/nonexistent/file.md', [
        {
          type: 'append',
          content: 'test',
        },
      ]);

      assert.strictEqual(result.success, false, 'Update should fail');
      assert.ok(
        result.error?.includes('File not found'),
        'Error should mention file not found'
      );
    });
  });
});

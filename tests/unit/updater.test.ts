import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { ReadmeUpdater } from '../../src/core/updater.js';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_DIR = join(process.cwd(), 'tests', 'temp');
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

  describe('constructor', () => {
    it('should create updater with default options', () => {
      updater = new ReadmeUpdater();
      assert.ok(updater);
    });

    it('should create updater with custom backup dir', () => {
      updater = new ReadmeUpdater({ backupDir: '.custom_backups' });
      assert.ok(updater);
    });
  });

  describe('backup()', () => {
    it('should create a backup of the README file', async () => {
      // Create test file
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const backupPath = await updater.backup(TEST_README);

      assert.ok(existsSync(backupPath), 'Backup file should exist');
      assert.ok(backupPath.includes('.ai_readme_history'), 'Backup should be in history dir');
      assert.ok(backupPath.includes('.backup'), 'Backup should have .backup extension');

      const backupContent = await readFile(backupPath, 'utf-8');
      assert.strictEqual(backupContent, SAMPLE_README, 'Backup content should match original');
    });
  });

  describe('update() - append operation', () => {
    it('should append content to the end of file', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(
        TEST_README,
        [
          {
            type: 'append',
            content: '## New Section\n\nThis is new content.',
          },
        ],
        { createBackup: true }
      );

      assert.strictEqual(result.success, true, 'Update should succeed');
      assert.ok(result.backupPath, 'Should create backup');
      assert.strictEqual(result.changes.length, 1, 'Should have one change');
      assert.strictEqual(result.changes[0].operation, 'append');

      const updatedContent = await readFile(TEST_README, 'utf-8');
      assert.ok(updatedContent.includes('## New Section'), 'Should contain new section');
    });
  });

  describe('update() - prepend operation', () => {
    it('should prepend content to the beginning of file', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(
        TEST_README,
        [
          {
            type: 'prepend',
            content: '> **Note:** This is a test project',
          },
        ],
        { createBackup: false }
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.backupPath, undefined, 'Should not create backup');

      const updatedContent = await readFile(TEST_README, 'utf-8');
      assert.ok(updatedContent.startsWith('> **Note:**'), 'Should start with prepended content');
    });
  });

  describe('update() - replace operation', () => {
    it('should replace specific text', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(
        TEST_README,
        [
          {
            type: 'replace',
            searchText: 'Run tests with npm test.',
            content: 'Run tests with: `npm test` or `npm run test:watch`',
          },
        ]
      );

      assert.strictEqual(result.success, true);

      const updatedContent = await readFile(TEST_README, 'utf-8');
      assert.ok(updatedContent.includes('npm run test:watch'), 'Should contain replaced text');
      assert.ok(!updatedContent.includes('Run tests with npm test.'), 'Should not contain old text');
    });

    it('should fail if search text not found', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(
        TEST_README,
        [
          {
            type: 'replace',
            searchText: 'THIS TEXT DOES NOT EXIST',
            content: 'New content',
          },
        ]
      );

      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('not found'), 'Should have error about text not found');
    });
  });

  describe('update() - insert-after operation', () => {
    it('should insert content after a section', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(
        TEST_README,
        [
          {
            type: 'insert-after',
            section: '## Coding Conventions',
            content: '### Code Style\n- Use TypeScript strict mode\n- Prefer const over let',
          },
        ]
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.changes[0].section, '## Coding Conventions');

      const updatedContent = await readFile(TEST_README, 'utf-8');
      assert.ok(updatedContent.includes('### Code Style'), 'Should contain inserted content');
      assert.ok(updatedContent.includes('TypeScript strict mode'), 'Should contain inserted detail');

      // Check order: should be after "Coding Conventions" but before "Testing"
      const codingConvIndex = updatedContent.indexOf('## Coding Conventions');
      const codeStyleIndex = updatedContent.indexOf('### Code Style');
      const testingIndex = updatedContent.indexOf('## Testing');

      assert.ok(codeStyleIndex > codingConvIndex, 'Should be after Coding Conventions');
      assert.ok(codeStyleIndex < testingIndex, 'Should be before Testing');
    });

    it('should fail if section not found', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(
        TEST_README,
        [
          {
            type: 'insert-after',
            section: '## Non-existent Section',
            content: 'New content',
          },
        ]
      );

      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('not found'), 'Should have error about section not found');
    });
  });

  describe('update() - insert-before operation', () => {
    it('should insert content before a section', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(
        TEST_README,
        [
          {
            type: 'insert-before',
            section: '## Testing',
            content: '## Security\n\n- Never commit secrets\n- Use environment variables',
          },
        ]
      );

      assert.strictEqual(result.success, true);

      const updatedContent = await readFile(TEST_README, 'utf-8');
      assert.ok(updatedContent.includes('## Security'), 'Should contain inserted section');

      // Check order: should be before "Testing"
      const securityIndex = updatedContent.indexOf('## Security');
      const testingIndex = updatedContent.indexOf('## Testing');

      assert.ok(securityIndex < testingIndex, 'Should be before Testing');
    });
  });

  describe('update() - multiple operations', () => {
    it('should apply multiple operations in sequence', async () => {
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const result = await updater.update(TEST_README, [
        {
          type: 'prepend',
          content: '> Project README\n',
        },
        {
          type: 'insert-after',
          section: '## Architecture',
          content: '- Microservices architecture\n- Event-driven design',
        },
        {
          type: 'append',
          content: '\n## License\n\nMIT',
        },
      ]);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.changes.length, 3, 'Should have 3 changes');

      const updatedContent = await readFile(TEST_README, 'utf-8');
      assert.ok(updatedContent.startsWith('> Project README'), 'Should have prepended content');
      assert.ok(updatedContent.includes('Microservices architecture'), 'Should have inserted content');
      assert.ok(updatedContent.includes('## License'), 'Should have appended content');
    });
  });

  describe('update() - error handling', () => {
    it('should handle file not found', async () => {
      updater = new ReadmeUpdater();
      const result = await updater.update(
        '/path/to/nonexistent/file.md',
        [{ type: 'append', content: 'test' }]
      );

      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('not found'), 'Should have file not found error');
    });
  });

  describe('rollback()', () => {
    it('should rollback to a previous backup', async () => {
      // Create and update file
      await writeFile(TEST_README, SAMPLE_README, 'utf-8');

      updater = new ReadmeUpdater();
      const backupPath = await updater.backup(TEST_README);

      // Modify the file
      await writeFile(TEST_README, 'Modified content', 'utf-8');

      // Rollback
      const success = await updater.rollback(backupPath, TEST_README);
      assert.strictEqual(success, true, 'Rollback should succeed');

      const restoredContent = await readFile(TEST_README, 'utf-8');
      assert.strictEqual(restoredContent, SAMPLE_README, 'Content should be restored');
    });

    it('should fail if backup file not found', async () => {
      updater = new ReadmeUpdater();
      const success = await updater.rollback('/nonexistent/backup.md', TEST_README);

      assert.strictEqual(success, false, 'Rollback should fail');
    });
  });
});

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { compressLine, ReadmeCompressor } from '../../src/core/compressor.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_DIR = join(process.cwd(), 'tests', 'temp');
const TEST_README = join(TEST_DIR, 'COMPRESS_TEST_README.md');

// ---------------------------------------------------------------------------
// compressLine unit tests
// ---------------------------------------------------------------------------

describe('compressLine', () => {
  it('returns null for already-concise lines', () => {
    assert.strictEqual(compressLine('Use Tailwind CSS.'), null);
    assert.strictEqual(compressLine('Run tests before push.'), null);
    assert.strictEqual(compressLine(''), null);
  });

  it('shortens "in order to" → "to"', () => {
    const result = compressLine('Call the API in order to fetch data.');
    assert.ok(result, 'should return a result');
    assert.ok(result!.compressed.includes('to fetch'), `got: ${result!.compressed}`);
    assert.ok(!result!.compressed.includes('in order to'));
  });

  it('shortens "make sure to" → "ensure"', () => {
    const result = compressLine('Make sure to run tests before merging.');
    assert.ok(result);
    assert.ok(result!.compressed.toLowerCase().includes('ensure'));
  });

  it('shortens "utilize" → "use"', () => {
    const result = compressLine('Utilize the helper functions from utils/.');
    assert.ok(result);
    assert.ok(result!.compressed.includes('use'));
    assert.ok(!result!.compressed.includes('utilize'));
  });

  it('removes "you should"', () => {
    const result = compressLine('You should always add types to exports.');
    assert.ok(result);
    assert.ok(!result!.compressed.toLowerCase().includes('you should'));
  });

  it('removes "basically"', () => {
    const result = compressLine('This is basically a wrapper around fetch.');
    assert.ok(result);
    assert.ok(!result!.compressed.includes('basically'));
  });

  it('removes "furthermore"', () => {
    const result = compressLine('Furthermore, all exports must be named.');
    assert.ok(result);
    assert.ok(!result!.compressed.toLowerCase().includes('furthermore'));
  });

  it('handles multiple patterns in one line', () => {
    const result = compressLine('You should basically utilize ESM imports in order to stay consistent.');
    assert.ok(result);
    assert.ok(!result!.compressed.toLowerCase().includes('you should'));
    assert.ok(!result!.compressed.includes('basically'));
    assert.ok(!result!.compressed.includes('utilize'));
    assert.ok(!result!.compressed.includes('in order to'));
  });

  it('preserves heading lines unchanged', () => {
    // compressLine itself doesn't skip headings — the compressor loop does.
    // A heading with no filler should return null.
    assert.strictEqual(compressLine('## Architecture'), null);
  });

  it('preserves indentation of compressed line', () => {
    const result = compressLine('  - You should utilize TypeScript throughout.');
    assert.ok(result);
    assert.ok(result!.compressed.startsWith('  '), `expected leading spaces, got: "${result!.compressed}"`);
  });
});

// ---------------------------------------------------------------------------
// ReadmeCompressor integration tests (file-based)
// ---------------------------------------------------------------------------

describe('ReadmeCompressor', () => {
  before(async () => {
    if (!existsSync(TEST_DIR)) {
      await mkdir(TEST_DIR, { recursive: true });
    }
  });

  after(async () => {
    if (existsSync(TEST_README)) {
      await rm(TEST_README);
    }
  });

  it('throws for non-existent file', async () => {
    const compressor = new ReadmeCompressor();
    await assert.rejects(
      () => compressor.compress(join(TEST_DIR, 'nonexistent.md')),
      /File not found/
    );
  });

  it('returns no changes for already-concise content', async () => {
    const content = `# Project\n\nNode.js MCP server. Use ESM imports.\n\n## Cross-directory dependencies\n\nNone.\n`;
    await writeFile(TEST_README, content, 'utf-8');

    const compressor = new ReadmeCompressor();
    const result = await compressor.compress(TEST_README, true); // dryRun
    assert.strictEqual(result.changes.length, 0);
    assert.strictEqual(result.written, false);
  });

  it('compresses filler language and reports token reduction', async () => {
    const content = [
      '# Project',
      '',
      'You should always make sure to utilize the helper utilities in order to stay consistent.',
      'Basically, this is just a wrapper around the fetch API.',
      'Furthermore, you should remember to add types to all exports.',
      '',
      '## Cross-directory dependencies',
      '',
      'None.',
    ].join('\n');
    await writeFile(TEST_README, content, 'utf-8');

    const compressor = new ReadmeCompressor();
    const result = await compressor.compress(TEST_README, true); // dryRun — don't write

    assert.ok(result.changes.length >= 2, `expected ≥2 changes, got ${result.changes.length}`);
    assert.ok(result.tokensAfter < result.tokensBefore, 'tokens should decrease');
    assert.ok(result.reductionPercent > 0);
    assert.strictEqual(result.written, false);
  });

  it('does not modify code blocks', async () => {
    const codeBlock = '```typescript\n// you should utilize this pattern\nconst x = utilize(foo);\n```';
    const content = `# Project\n\n${codeBlock}\n\nUse ESM imports.\n`;
    await writeFile(TEST_README, content, 'utf-8');

    const compressor = new ReadmeCompressor();
    const result = await compressor.compress(TEST_README, true);

    // Code block lines must be unchanged
    assert.ok(result.compressedContent.includes('// you should utilize this pattern'));
    assert.ok(result.compressedContent.includes('const x = utilize(foo);'));
  });

  it('writes file when dryRun is false and changes exist', async () => {
    const content = `# Project\n\nYou should basically utilize ESM imports.\n`;
    await writeFile(TEST_README, content, 'utf-8');

    const compressor = new ReadmeCompressor();
    const result = await compressor.compress(TEST_README, false);

    assert.strictEqual(result.written, true);
    assert.ok(result.changes.length > 0);
    // Compressed content must differ from original
    assert.notStrictEqual(result.compressedContent, result.originalContent);
  });
});

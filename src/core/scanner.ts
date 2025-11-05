/**
 * AIReadmeScanner - Scans project directories for AI_README.md files
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import type { ReadmeEntry, ReadmeIndex, ScannerOptions } from '../types/index.js';

export class AIReadmeScanner {
  private projectRoot: string;
  private options: Required<ScannerOptions>;

  constructor(projectRoot: string, options?: ScannerOptions) {
    this.projectRoot = projectRoot;
    this.options = {
      excludePatterns: options?.excludePatterns || [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
      ],
      cacheContent: options?.cacheContent ?? true,
      readmeFilename: options?.readmeFilename || 'AI_README.md',
    };
  }

  /**
   * Scan the project directory for AI_README.md files
   */
  async scan(): Promise<ReadmeIndex> {
    const pattern = `**/${this.options.readmeFilename}`;
    const ignore = this.options.excludePatterns;

    // Find all AI_README.md files
    const files = await glob(pattern, {
      cwd: this.projectRoot,
      ignore,
      absolute: false,
      nodir: true,
    });

    // Build ReadmeEntry objects
    const readmes: ReadmeEntry[] = [];

    for (const file of files) {
      const entry = await this.createReadmeEntry(file);
      readmes.push(entry);
    }

    // Sort by level (root first, then deeper levels)
    readmes.sort((a, b) => a.level - b.level);

    return {
      projectRoot: this.projectRoot,
      readmes,
      lastUpdated: new Date(),
    };
  }

  /**
   * Create a ReadmeEntry from a file path
   */
  private async createReadmeEntry(filePath: string): Promise<ReadmeEntry> {
    // Normalize path to use forward slashes (Unix-style) for consistency
    const normalizedPath = filePath.replace(/\\/g, '/');
    const dir = dirname(normalizedPath);
    const level = dir === '.' ? 0 : dir.split('/').length;
    const scope = dir === '.' ? 'root' : dir.replace(/\//g, '-');

    // Generate glob patterns this README covers
    const patterns = this.generatePatterns(dir);

    // Optionally cache content
    let content: string | undefined;
    if (this.options.cacheContent) {
      try {
        const fullPath = join(this.projectRoot, filePath);
        content = await readFile(fullPath, 'utf-8');
      } catch (error) {
        console.error(`Failed to read ${filePath}:`, error);
      }
    }

    return {
      path: normalizedPath,
      scope,
      level,
      patterns,
      content,
    };
  }

  /**
   * Generate glob patterns that this README covers
   */
  private generatePatterns(dir: string): string[] {
    if (dir === '.') {
      return ['**/*']; // Root level covers everything
    }

    return [
      `${dir}/**/*`,  // All files in this directory and subdirectories
      `${dir}/*`,     // Direct children
    ];
  }

  /**
   * Refresh the scan (re-scan the project)
   */
  async refresh(): Promise<ReadmeIndex> {
    return this.scan();
  }

  /**
   * Get the project root directory
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Get current scanner options
   */
  getOptions(): Required<ScannerOptions> {
    return { ...this.options };
  }
}

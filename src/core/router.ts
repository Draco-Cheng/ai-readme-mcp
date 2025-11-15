/**
 * ContextRouter - Routes file paths to relevant AI_README contexts
 */

import { minimatch } from 'minimatch';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import type { ReadmeContext, ReadmeIndex, ReadmeEntry } from '../types/index.js';

export class ContextRouter {
  private index: ReadmeIndex;

  constructor(index: ReadmeIndex) {
    this.index = index;
  }

  /**
   * Get relevant AI_README contexts for a specific path (file or directory)
   * @param targetPath - The path relative to project root (can be file or directory)
   * @param includeRoot - Whether to include root-level README (default: true)
   */
  async getContextForPath(
    targetPath: string,
    includeRoot: boolean = true
  ): Promise<ReadmeContext[]> {
    const contexts: ReadmeContext[] = [];

    // Find matching READMEs
    for (const readme of this.index.readmes) {
      const match = this.matchesPath(targetPath, readme);

      if (!match) continue;

      // Skip root if not requested
      if (!includeRoot && readme.level === 0) continue;

      // Calculate distance from path to README
      const distance = this.calculateDistance(targetPath, readme);

      // Get content
      const content = await this.getReadmeContent(readme);

      // Determine relevance
      const relevance = this.determineRelevance(targetPath, readme);

      contexts.push({
        path: readme.path,
        content,
        relevance,
        distance,
      });
    }

    // Sort by distance (closest first) and then by relevance
    contexts.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      // If same distance, prioritize direct > parent > root
      const relevanceOrder = { direct: 0, parent: 1, root: 2 };
      return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
    });

    return contexts;
  }

  /**
   * Get contexts for multiple paths (files or directories)
   */
  async getContextForPaths(paths: string[]): Promise<Map<string, ReadmeContext[]>> {
    const results = new Map<string, ReadmeContext[]>();

    for (const path of paths) {
      const contexts = await this.getContextForPath(path);
      results.set(path, contexts);
    }

    return results;
  }

  /**
   * Get the directory from a path (handles both file and directory paths)
   */
  private getFileDir(targetPath: string): string {
    // If it has an extension, it's likely a file; otherwise treat as directory
    const isDirectory = !/\.[^./\\]+$/.test(targetPath);
    return isDirectory ? targetPath : dirname(targetPath);
  }

  /**
   * Check if a path matches a README's patterns
   */
  private matchesPath(targetPath: string, readme: ReadmeEntry): boolean {
    const readmeDir = dirname(readme.path);
    const targetDir = this.getFileDir(targetPath);

    // Root README always matches everything
    if (readmeDir === '.') {
      return true;
    }

    // Fast path: Direct directory match
    if (targetDir === readmeDir) {
      return true;
    }

    // Fast path: Check if target is under this README's directory
    if (targetDir.startsWith(readmeDir + '/')) {
      return true;
    }

    // Pattern matching (slower but handles edge cases)
    return readme.patterns.some(pattern => {
      return minimatch(targetPath, pattern, { dot: true });
    });
  }

  /**
   * Calculate the directory distance between a path and a README
   */
  private calculateDistance(targetPath: string, readme: ReadmeEntry): number {
    const fileDir = this.getFileDir(targetPath);
    const readmeDir = dirname(readme.path);

    // If README is at root
    if (readmeDir === '.') {
      return fileDir === '.' ? 0 : fileDir.split('/').length;
    }

    // If file is in the same directory as README
    if (fileDir === readmeDir) {
      return 0;
    }

    // If file is in a subdirectory of README's directory
    if (fileDir.startsWith(readmeDir + '/')) {
      const subPath = fileDir.slice(readmeDir.length + 1);
      return subPath.split('/').length;
    }

    // Calculate levels up
    const fileParts = fileDir.split('/');
    const readmeParts = readmeDir.split('/');

    // Find common ancestor
    let commonDepth = 0;
    for (let i = 0; i < Math.min(fileParts.length, readmeParts.length); i++) {
      if (fileParts[i] === readmeParts[i]) {
        commonDepth++;
      } else {
        break;
      }
    }

    // Distance is the sum of levels to go up and down
    return (fileParts.length - commonDepth) + (readmeParts.length - commonDepth);
  }

  /**
   * Determine the relevance type of a README for a path
   */
  private determineRelevance(
    targetPath: string,
    readme: ReadmeEntry
  ): 'root' | 'direct' | 'parent' {
    const fileDir = this.getFileDir(targetPath);
    const readmeDir = dirname(readme.path);

    // Root level README
    if (readmeDir === '.') {
      return 'root';
    }

    // Direct match (same directory)
    if (fileDir === readmeDir) {
      return 'direct';
    }

    // Parent directory
    if (fileDir.startsWith(readmeDir + '/')) {
      return 'parent';
    }

    return 'parent';
  }

  /**
   * Get the content of a README (from cache or file system)
   */
  private async getReadmeContent(readme: ReadmeEntry): Promise<string> {
    // Return cached content if available
    if (readme.content) {
      return readme.content;
    }

    // Otherwise read from file system
    try {
      const fullPath = join(this.index.projectRoot, readme.path);
      return await readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Failed to read ${readme.path}:`, error);
      return `[Error: Could not read ${readme.path}]`;
    }
  }

  /**
   * Update the index (useful after re-scanning)
   */
  updateIndex(index: ReadmeIndex): void {
    this.index = index;
  }

  /**
   * Get the current index
   */
  getIndex(): ReadmeIndex {
    return this.index;
  }
}

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
   * Get relevant AI_README contexts for a specific file path
   * @param filePath - The file path relative to project root
   * @param includeRoot - Whether to include root-level README (default: true)
   */
  async getContextForFile(
    filePath: string,
    includeRoot: boolean = true
  ): Promise<ReadmeContext[]> {
    const contexts: ReadmeContext[] = [];

    // Find matching READMEs
    for (const readme of this.index.readmes) {
      const match = this.matchesPath(filePath, readme);

      if (!match) continue;

      // Skip root if not requested
      if (!includeRoot && readme.level === 0) continue;

      // Calculate distance from file to README
      const distance = this.calculateDistance(filePath, readme);

      // Get content
      const content = await this.getReadmeContent(readme);

      // Determine relevance
      const relevance = this.determineRelevance(filePath, readme);

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
   * Get contexts for multiple files
   */
  async getContextForFiles(filePaths: string[]): Promise<Map<string, ReadmeContext[]>> {
    const results = new Map<string, ReadmeContext[]>();

    for (const filePath of filePaths) {
      const contexts = await this.getContextForFile(filePath);
      results.set(filePath, contexts);
    }

    return results;
  }

  /**
   * Check if a file path matches a README's patterns
   */
  private matchesPath(filePath: string, readme: ReadmeEntry): boolean {
    return readme.patterns.some(pattern => {
      return minimatch(filePath, pattern, { dot: true });
    });
  }

  /**
   * Calculate the directory distance between a file and a README
   */
  private calculateDistance(filePath: string, readme: ReadmeEntry): number {
    const fileDir = dirname(filePath);
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
   * Determine the relevance type of a README for a file
   */
  private determineRelevance(
    filePath: string,
    readme: ReadmeEntry
  ): 'root' | 'direct' | 'parent' {
    const fileDir = dirname(filePath);
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

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface UpdateOperation {
  type: 'replace' | 'append' | 'prepend' | 'insert-after' | 'insert-before';
  section?: string; // Section heading to target (e.g., "## Coding Conventions")
  searchText?: string; // Text to search for (for replace operations)
  content: string; // Content to add/replace
}

export interface UpdateResult {
  success: boolean;
  changes: {
    operation: string;
    section?: string;
    linesAdded: number;
    linesRemoved: number;
  }[];
  error?: string;
}

/**
 * ReadmeUpdater - Handles updating AI_README.md files
 *
 * Features:
 * - Section-based updates
 * - Multiple operation types (append, prepend, replace, insert-after, insert-before)
 * - Detailed change tracking
 *
 * Note: Version control is handled by Git. Use git diff/revert for rollback.
 */
export class ReadmeUpdater {
  constructor() {
    // No configuration needed
  }

  /**
   * Update a README file with given operations
   *
   * @param readmePath - Path to the AI_README.md file
   * @param operations - List of update operations
   * @returns Update result with changes
   */
  async update(
    readmePath: string,
    operations: UpdateOperation[]
  ): Promise<UpdateResult> {
    try {
      // Read current content (empty string if file doesn't exist or is empty)
      let content = '';
      if (existsSync(readmePath)) {
        content = await readFile(readmePath, 'utf-8');
      }

      // Apply operations
      let updatedContent = content;
      const changes: UpdateResult['changes'] = [];

      for (const operation of operations) {
        const result = await this.applyOperation(updatedContent, operation);
        updatedContent = result.content;
        changes.push(result.change);
      }

      // Write updated content
      await writeFile(readmePath, updatedContent, 'utf-8');

      return {
        success: true,
        changes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        changes: [],
      };
    }
  }

  /**
   * Apply a single update operation to content
   *
   * @param content - Current content
   * @param operation - Operation to apply
   * @returns Updated content and change info
   */
  private async applyOperation(
    content: string,
    operation: UpdateOperation
  ): Promise<{ content: string; change: UpdateResult['changes'][0] }> {
    const lines = content.split('\n');
    let updatedLines = [...lines];
    let linesAdded = 0;
    let linesRemoved = 0;

    switch (operation.type) {
      case 'append': {
        // Add content to the end
        updatedLines.push('', operation.content);
        linesAdded = operation.content.split('\n').length + 1;
        break;
      }

      case 'prepend': {
        // Add content to the beginning
        updatedLines.unshift(operation.content, '');
        linesAdded = operation.content.split('\n').length + 1;
        break;
      }

      case 'replace': {
        // Replace specific text
        if (!operation.searchText) {
          throw new Error('searchText is required for replace operation');
        }

        const originalContent = updatedLines.join('\n');
        const newContent = originalContent.replace(
          operation.searchText,
          operation.content
        );

        if (originalContent === newContent) {
          throw new Error(`Text not found: ${operation.searchText}`);
        }

        updatedLines = newContent.split('\n');
        linesRemoved = operation.searchText.split('\n').length;
        linesAdded = operation.content.split('\n').length;
        break;
      }

      case 'insert-after': {
        // Insert content after a section
        if (!operation.section) {
          throw new Error('section is required for insert-after operation');
        }

        const sectionIndex = this.findSectionIndex(updatedLines, operation.section);
        if (sectionIndex === -1) {
          throw new Error(`Section not found: ${operation.section}`);
        }

        // Find the end of the section content
        const insertIndex = this.findSectionEnd(updatedLines, sectionIndex);
        updatedLines.splice(insertIndex, 0, '', operation.content);
        linesAdded = operation.content.split('\n').length + 1;
        break;
      }

      case 'insert-before': {
        // Insert content before a section
        if (!operation.section) {
          throw new Error('section is required for insert-before operation');
        }

        const sectionIndex = this.findSectionIndex(updatedLines, operation.section);
        if (sectionIndex === -1) {
          throw new Error(`Section not found: ${operation.section}`);
        }

        updatedLines.splice(sectionIndex, 0, operation.content, '');
        linesAdded = operation.content.split('\n').length + 1;
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    return {
      content: updatedLines.join('\n'),
      change: {
        operation: operation.type,
        section: operation.section,
        linesAdded,
        linesRemoved,
      },
    };
  }

  /**
   * Find the index of a section heading
   *
   * @param lines - Content lines
   * @param section - Section heading (e.g., "## Coding Conventions")
   * @returns Index of the section, or -1 if not found
   */
  private findSectionIndex(lines: string[], section: string): number {
    return lines.findIndex((line) => line.trim() === section.trim());
  }

  /**
   * Find the end of a section (before the next section of same or higher level)
   *
   * @param lines - Content lines
   * @param startIndex - Index of the section heading
   * @returns Index where the section ends
   */
  private findSectionEnd(lines: string[], startIndex: number): number {
    const startLine = lines[startIndex];
    if (!startLine) {
      return lines.length;
    }

    const sectionLevel = this.getSectionLevel(startLine);

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        const level = this.getSectionLevel(trimmedLine);
        if (level <= sectionLevel) {
          return i;
        }
      }
    }

    return lines.length;
  }

  /**
   * Get the heading level of a markdown section
   *
   * @param line - Line containing a heading
   * @returns Heading level (1-6)
   */
  private getSectionLevel(line: string): number {
    const match = line.match(/^(#{1,6})\s/);
    return match && match[1] ? match[1].length : 0;
  }
}

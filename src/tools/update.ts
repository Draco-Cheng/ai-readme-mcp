import { z } from 'zod';
import { ReadmeUpdater, UpdateOperation } from '../core/updater.js';

/**
 * Zod schema for update operation
 */
const updateOperationSchema = z.object({
  type: z.enum(['replace', 'append', 'prepend', 'insert-after', 'insert-before']).describe(
    'Type of update operation'
  ),
  section: z.string().optional().describe(
    'Section heading to target (e.g., "## Coding Conventions")'
  ),
  searchText: z.string().optional().describe(
    'Text to search for (required for replace operation)'
  ),
  content: z.string().describe('Content to add or replace'),
});

/**
 * Zod schema for update_ai_readme tool
 */
export const updateSchema = z.object({
  readmePath: z.string().describe('Path to the AI_README.md file to update'),
  operations: z.array(updateOperationSchema).describe(
    'List of update operations to perform'
  ),
  createBackup: z.boolean().optional().default(true).describe(
    'Whether to create a backup before updating (default: true)'
  ),
});

export type UpdateInput = z.infer<typeof updateSchema>;

/**
 * Update an AI_README.md file with specified operations
 *
 * @param input - Update parameters
 * @returns Update result with backup info and changes
 *
 * @example
 * ```typescript
 * await updateAIReadme({
 *   readmePath: 'apps/frontend/AI_README.md',
 *   operations: [{
 *     type: 'insert-after',
 *     section: '## Directory Structure',
 *     content: '├── src/hooks/  # Custom React hooks'
 *   }],
 *   createBackup: true
 * });
 * ```
 */
export async function updateAIReadme(input: UpdateInput) {
  const { readmePath, operations, createBackup } = input;

  const updater = new ReadmeUpdater({
    createBackup,
  });

  // Perform update
  const result = await updater.update(readmePath, operations as UpdateOperation[], {
    createBackup,
  });

  // Format response
  if (result.success) {
    return {
      success: true,
      readmePath,
      backupPath: result.backupPath,
      changes: result.changes,
      summary: `Successfully updated ${readmePath} with ${result.changes.length} operation(s).`,
    };
  } else {
    return {
      success: false,
      readmePath,
      error: result.error,
      summary: `Failed to update ${readmePath}: ${result.error}`,
    };
  }
}

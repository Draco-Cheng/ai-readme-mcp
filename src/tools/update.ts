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
});

export type UpdateInput = z.infer<typeof updateSchema>;

/**
 * Update an AI_README.md file with specified operations
 *
 * @param input - Update parameters
 * @returns Update result with changes
 *
 * @example
 * ```typescript
 * await updateAIReadme({
 *   readmePath: 'apps/frontend/AI_README.md',
 *   operations: [{
 *     type: 'insert-after',
 *     section: '## Directory Structure',
 *     content: '├── src/hooks/  # Custom React hooks'
 *   }]
 * });
 * ```
 *
 * Note: Changes are immediately written to the file.
 * Use git to track changes and rollback if needed.
 */
export async function updateAIReadme(input: UpdateInput) {
  const { readmePath, operations } = input;

  const updater = new ReadmeUpdater();

  // Perform update
  const result = await updater.update(readmePath, operations as UpdateOperation[]);

  // Format response
  if (result.success) {
    return {
      success: true,
      readmePath,
      changes: result.changes,
      summary: `Successfully updated ${readmePath} with ${result.changes.length} operation(s). Use 'git diff' to review changes.`,
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

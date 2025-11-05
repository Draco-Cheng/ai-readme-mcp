/**
 * MCP Tool: discover_ai_readmes
 * Scans the project and discovers all AI_README.md files
 */

import { z } from 'zod';
import { AIReadmeScanner } from '../core/scanner.js';

export const discoverSchema = z.object({
  projectRoot: z.string().describe('The root directory of the project'),
  excludePatterns: z
    .array(z.string())
    .optional()
    .describe("Glob patterns to exclude (e.g., ['node_modules/**', '.git/**'])"),
});

export type DiscoverInput = z.infer<typeof discoverSchema>;

export async function discoverAIReadmes(input: DiscoverInput) {
  const { projectRoot, excludePatterns } = input;

  // Create scanner with options
  const scanner = new AIReadmeScanner(projectRoot, {
    excludePatterns,
    cacheContent: false, // Don't cache content in discovery phase
  });

  // Scan the project
  const index = await scanner.scan();

  // Format the response
  return {
    projectRoot: index.projectRoot,
    totalFound: index.readmes.length,
    readmeFiles: index.readmes.map((readme) => ({
      path: readme.path,
      scope: readme.scope,
      level: readme.level,
      patterns: readme.patterns,
    })),
    lastUpdated: index.lastUpdated.toISOString(),
  };
}

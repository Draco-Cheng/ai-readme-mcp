/**
 * Core type definitions for AI_README MCP Server
 */

/**
 * Represents a single AI_README.md file entry in the index
 */
export interface ReadmeEntry {
  /** Absolute or relative path to the AI_README.md file */
  path: string;
  /** Scope identifier (e.g., 'root', 'frontend', 'backend') */
  scope: string;
  /** Directory level depth (0 for root) */
  level: number;
  /** Glob patterns this README covers */
  patterns: string[];
  /** Cached content of the README (optional) */
  content?: string;
}

/**
 * Index of all AI_README files in the project
 */
export interface ReadmeIndex {
  /** Root directory of the project */
  projectRoot: string;
  /** List of discovered README entries */
  readmes: ReadmeEntry[];
  /** Timestamp of last index update */
  lastUpdated: Date;
}

/**
 * Context information for a specific file
 */
export interface ReadmeContext {
  /** Path to the AI_README.md file */
  path: string;
  /** Content of the README */
  content: string;
  /** Relevance type */
  relevance: 'root' | 'direct' | 'parent';
  /** Distance in directory levels from target file */
  distance: number;
}

/**
 * Options for the scanner
 */
export interface ScannerOptions {
  /** Patterns to exclude from scanning */
  excludePatterns?: string[];
  /** Whether to cache README contents */
  cacheContent?: boolean;
  /** Custom README filename (default: 'AI_README.md') */
  readmeFilename?: string;
}

/**
 * Update action types for AI_README modifications
 */
export type UpdateAction = 'append' | 'replace' | 'delete';

/**
 * Result of an update operation
 */
export interface UpdateResult {
  /** Whether the update succeeded */
  success: boolean;
  /** Path to the updated file */
  updatedPath: string;
  /** Path to backup file (if created) */
  backupPath?: string;
  /** Diff of changes made */
  diff: string;
}

/**
 * Options for the updater
 */
export interface UpdaterOptions {
  /** Directory for backups (default: '.ai_readme_history') */
  backupDir?: string;
  /** Whether to create backups */
  createBackup?: boolean;
}

/**
 * Validation check types
 */
export type ValidationCheck = 'structure' | 'links' | 'consistency' | 'syntax';

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** File with the issue */
  file: string;
  /** Line number (if applicable) */
  line?: number;
  /** Issue severity */
  severity: 'error' | 'warning';
  /** Issue type */
  type: ValidationCheck;
  /** Description of the issue */
  message: string;
}

/**
 * Validation report
 */
export interface ValidationReport {
  /** Whether all validations passed */
  valid: boolean;
  /** List of issues found */
  issues: ValidationIssue[];
  /** Timestamp of validation */
  timestamp: Date;
}

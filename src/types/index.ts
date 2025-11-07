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
 * Validation configuration
 */
export interface ValidationConfig {
  /** Maximum tokens allowed (default: 500) */
  maxTokens?: number;
  /** Validation rules */
  rules?: {
    /** Require H1 heading (default: true) */
    requireH1?: boolean;
    /** Required sections (default: []) */
    requireSections?: string[];
    /** Allow code blocks (default: true) */
    allowCodeBlocks?: boolean;
    /** Maximum line length (default: 120) */
    maxLineLength?: number;
  };
  /** Token limit thresholds */
  tokenLimits?: {
    /** Excellent: under this many tokens (default: 300) */
    excellent?: number;
    /** Good: under this many tokens (default: 500) */
    good?: number;
    /** Warning: under this many tokens (default: 800) */
    warning?: number;
    /** Error: over this many tokens (default: 1200) */
    error?: number;
  };
}

/**
 * Fully resolved validation configuration (all properties required)
 */
export interface ResolvedValidationConfig {
  maxTokens: number;
  rules: {
    requireH1: boolean;
    requireSections: string[];
    allowCodeBlocks: boolean;
    maxLineLength: number;
  };
  tokenLimits: {
    excellent: number;
    good: number;
    warning: number;
    error: number;
  };
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ResolvedValidationConfig = {
  maxTokens: 600,
  rules: {
    requireH1: true,
    requireSections: [],
    allowCodeBlocks: true,
    maxLineLength: 120,
  },
  tokenLimits: {
    excellent: 400,
    good: 600,
    warning: 1000,
    error: 1500,
  },
};

/**
 * Validation issue severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation rule type
 */
export type ValidationRule =
  | 'token-count'
  | 'require-h1'
  | 'require-sections'
  | 'code-blocks'
  | 'line-length'
  | 'empty-content'
  | 'structure';

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** Issue severity */
  type: ValidationSeverity;
  /** Rule that triggered this issue */
  rule: ValidationRule;
  /** Issue message */
  message: string;
  /** Line number (if applicable) */
  line?: number;
  /** Suggestion for fixing */
  suggestion?: string;
}

/**
 * Validation result for a single README
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Path to the README file */
  filePath: string;
  /** List of issues found */
  issues: ValidationIssue[];
  /** Quality score (0-100) */
  score?: number;
  /** Token count statistics */
  stats?: {
    tokens: number;
    lines: number;
    characters: number;
  };
}

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
  /**
   * Target token budget (default: 400). A TARGET, not a hard cap — files over it
   * are nudged, never rejected. All other thresholds derive from it (see budget.ts).
   */
  tokenBudget?: number;
  /**
   * Project-level globs to exclude from scanning. AUGMENT the scanner's built-in
   * defaults (node_modules, .git, ...) — they do not replace them. A per-call
   * excludePatterns argument still overrides. See resolveExcludePatterns().
   */
  excludePatterns?: string[];
  /**
   * How much guidance (tool descriptions + get_context reminder) the server
   * sends the model (neutral levels, not a good/bad choice):
   *   'high' (default) — full "call every time" prompting.
   *   'medium' — ~80% smaller; best for capable models watching context cost.
   * Read once at server startup from .aireadme.config.json at the server's cwd.
   * See verbosity.ts / resolveVerbosity().
   */
  guidanceLevel?: 'high' | 'medium';
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
    /** Good: under this many tokens (default: 400 = tokenBudget) */
    good?: number;
    /** Warning: under this many tokens (default: 800) */
    warning?: number;
    /** Error: over this many tokens (default: 1200) */
    error?: number;
  };
  /**
   * Fraction (0..1) of total tokens a single section may occupy before an
   * over-budget file is treated as "split this subsystem out" rather than
   * "rewrite/squeeze". Default: 0.40.
   */
  sectionSplitThreshold?: number;
}

/**
 * Fully resolved validation configuration (all properties required)
 */
export interface ResolvedValidationConfig {
  tokenBudget: number;
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
  sectionSplitThreshold: number;
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ResolvedValidationConfig = {
  tokenBudget: 400,
  rules: {
    requireH1: true,
    requireSections: [],
    allowCodeBlocks: false,
    maxLineLength: 100,
  },
  tokenLimits: {
    excellent: 200,
    good: 400,
    warning: 600,
    error: 1000,
  },
  sectionSplitThreshold: 0.4,
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
  | 'structure'
  | 'redundant-content'
  | 'filler-language';

/**
 * A single compress suggestion for a line
 */
export interface CompressSuggestion {
  /** Line number (1-based) */
  line: number;
  /** Original line text */
  original: string;
  /** Suggested compressed version */
  compressed: string;
  /** Filler patterns found */
  patterns: string[];
}

/**
 * Result of compress operation
 */
export interface CompressResult {
  /** Path to the AI_README.md file */
  readmePath: string;
  /** Original content */
  originalContent: string;
  /** Compressed content */
  compressedContent: string;
  /** Token counts before/after */
  tokensBefore: number;
  tokensAfter: number;
  /** Token reduction percentage */
  reductionPercent: number;
  /** Lines that were changed */
  changes: CompressSuggestion[];
  /** Whether the file was written */
  written: boolean;
}

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

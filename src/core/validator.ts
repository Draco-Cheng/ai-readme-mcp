import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type {
  ValidationConfig,
  ResolvedValidationConfig,
  ValidationResult,
  ValidationIssue,
} from '../types/index.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/index.js';

/**
 * ReadmeValidator - Validates AI_README.md files
 *
 * Features:
 * - Token count validation
 * - Structure validation
 * - Content quality checks
 * - Configurable rules via constructor parameter
 */
export class ReadmeValidator {
  private config: ResolvedValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    // Merge user config with defaults
    this.config = this.mergeConfig(config || {});
  }

  /**
   * Merge user config with default config
   */
  private mergeConfig(userConfig: Partial<ValidationConfig>): ResolvedValidationConfig {
    return {
      maxTokens: userConfig.maxTokens ?? DEFAULT_VALIDATION_CONFIG.maxTokens,
      rules: {
        ...DEFAULT_VALIDATION_CONFIG.rules,
        ...(userConfig.rules || {}),
      },
      tokenLimits: {
        ...DEFAULT_VALIDATION_CONFIG.tokenLimits,
        ...(userConfig.tokenLimits || {}),
      },
    };
  }

  /**
   * Validate a single AI_README.md file
   *
   * @param readmePath - Path to the README file
   * @returns Validation result
   */
  async validate(readmePath: string): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Check file exists
    if (!existsSync(readmePath)) {
      return {
        valid: false,
        filePath: readmePath,
        issues: [
          {
            type: 'error',
            rule: 'structure',
            message: `File not found: ${readmePath}`,
          },
        ],
      };
    }

    // Read content
    const content = await readFile(readmePath, 'utf-8');

    // Check if file is empty
    if (content.trim().length === 0) {
      issues.push({
        type: 'error',
        rule: 'empty-content',
        message: 'README file is empty',
        suggestion: 'Add content to the README file',
      });
    }

    // Calculate statistics
    const lines = content.split('\n');
    const tokens = this.estimateTokens(content);
    const characters = content.length;

    // Validate token count
    this.validateTokenCount(tokens, issues);

    // Validate structure
    this.validateStructure(content, lines, issues);

    // Validate line length
    this.validateLineLength(lines, issues);

    // Validate code blocks
    this.validateCodeBlocks(content, issues);

    // Calculate score
    const score = this.calculateScore(issues, tokens);

    return {
      valid: !issues.some((i) => i.type === 'error'),
      filePath: readmePath,
      issues,
      score,
      stats: {
        tokens,
        lines: lines.length,
        characters,
      },
    };
  }

  /**
   * Estimate token count (simple word-based estimation)
   * Formula: words * 1.3 (approximate token-to-word ratio)
   */
  private estimateTokens(content: string): number {
    const words = content.split(/\s+/).filter((w) => w.length > 0).length;
    return Math.round(words * 1.3);
  }

  /**
   * Validate token count against limits
   */
  private validateTokenCount(tokens: number, issues: ValidationIssue[]): void {
    const { tokenLimits, maxTokens } = this.config;

    if (tokens > tokenLimits.error) {
      issues.push({
        type: 'error',
        rule: 'token-count',
        message: `README is too long (${tokens} tokens). Maximum recommended: ${maxTokens} tokens.`,
        suggestion: 'Remove unnecessary content, use bullet points instead of paragraphs, and avoid code examples.',
      });
    } else if (tokens > tokenLimits.warning) {
      issues.push({
        type: 'warning',
        rule: 'token-count',
        message: `README is quite long (${tokens} tokens). Consider keeping it under ${tokenLimits.good} tokens.`,
        suggestion: 'Simplify content and remove redundant information.',
      });
    } else if (tokens > tokenLimits.good) {
      issues.push({
        type: 'info',
        rule: 'token-count',
        message: `README length is acceptable (${tokens} tokens).`,
      });
    }
  }

  /**
   * Validate README structure
   */
  private validateStructure(_content: string, lines: string[], issues: ValidationIssue[]): void {
    // Check for H1 heading
    if (this.config.rules.requireH1) {
      const hasH1 = lines.some((line) => line.trim().match(/^#\s+[^#]/));
      if (!hasH1) {
        issues.push({
          type: 'error',
          rule: 'require-h1',
          message: 'README must have a H1 heading (# Title)',
          suggestion: 'Add a title at the beginning of the file: # Project Name',
        });
      }
    }

    // Check for required sections
    if (this.config.rules.requireSections && this.config.rules.requireSections.length > 0) {
      for (const section of this.config.rules.requireSections) {
        const hasSection = lines.some((line) => line.trim() === section);
        if (!hasSection) {
          issues.push({
            type: 'warning',
            rule: 'require-sections',
            message: `Missing required section: ${section}`,
            suggestion: `Add section: ${section}`,
          });
        }
      }
    }
  }

  /**
   * Validate line length
   */
  private validateLineLength(lines: string[], issues: ValidationIssue[]): void {
    const { maxLineLength } = this.config.rules;
    const longLines = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.length > maxLineLength);

    if (longLines.length > 3) {
      // Only warn if there are many long lines
      issues.push({
        type: 'info',
        rule: 'line-length',
        message: `${longLines.length} lines exceed ${maxLineLength} characters`,
        suggestion: 'Consider breaking long lines for better readability',
      });
    }
  }

  /**
   * Validate code blocks
   */
  private validateCodeBlocks(content: string, issues: ValidationIssue[]): void {
    if (!this.config.rules.allowCodeBlocks) {
      const codeBlockCount = (content.match(/```/g) || []).length / 2;
      if (codeBlockCount > 0) {
        issues.push({
          type: 'warning',
          rule: 'code-blocks',
          message: `Found ${codeBlockCount} code blocks. Code examples consume many tokens.`,
          suggestion: 'Remove code examples or move them to separate documentation.',
        });
      }
    }
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateScore(issues: ValidationIssue[], tokens: number): number {
    let score = 100;

    // Deduct points for issues
    for (const issue of issues) {
      if (issue.type === 'error') score -= 20;
      else if (issue.type === 'warning') score -= 10;
      else if (issue.type === 'info') score -= 2;
    }

    // Deduct points for excessive length
    const { tokenLimits } = this.config;
    if (tokens > tokenLimits.error) score -= 30;
    else if (tokens > tokenLimits.warning) score -= 15;
    else if (tokens < tokenLimits.excellent) score += 10; // Bonus for concise READMEs

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Load validation config from .aireadme.config.json
   *
   * @param projectRoot - Project root directory
   * @returns Validation config or null if not found
   */
  static async loadConfig(projectRoot: string): Promise<Partial<ValidationConfig> | null> {
    const configPath = join(projectRoot, '.aireadme.config.json');

    if (!existsSync(configPath)) {
      return null;
    }

    try {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.validation || config; // Support both formats
    } catch (error) {
      console.error(`Failed to load config from ${configPath}:`, error);
      return null;
    }
  }
}

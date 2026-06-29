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
import { deriveTokenLimits } from './budget.js';

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
    const tokenBudget = userConfig.tokenBudget ?? DEFAULT_VALIDATION_CONFIG.tokenBudget;
    return {
      tokenBudget,
      rules: {
        ...DEFAULT_VALIDATION_CONFIG.rules,
        ...(userConfig.rules || {}),
      },
      // Token limits derive from tokenBudget so a project sets ONE number and the
      // four thresholds scale with it (½ / 1× / 1.5× / 2.5× of tokenBudget — equals
      // the historical 200/400/600/1000 at the default tokenBudget=400). Any limit
      // the user sets explicitly still wins.
      tokenLimits: {
        ...deriveTokenLimits(tokenBudget),
        ...(userConfig.tokenLimits || {}),
      },
      sectionSplitThreshold:
        userConfig.sectionSplitThreshold ?? DEFAULT_VALIDATION_CONFIG.sectionSplitThreshold,
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

    // Detect redundant content
    this.detectRedundantContent(content, lines, issues);

    // Detect filler language
    this.detectFillerLanguage(lines, issues);

    // Calculate score
    const score = this.calculateScore(issues, tokens);

    return {
      valid: !issues.some((i) => i.type === 'error' || i.type === 'warning'),
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
    const { tokenLimits, tokenBudget } = this.config;

    if (tokens > tokenLimits.error) {
      issues.push({
        type: 'error',
        rule: 'token-count',
        message: `README is too long (${tokens} tokens). Target budget: ${tokenBudget} tokens.`,
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
   * Detect redundant content that wastes tokens
   * AI can discover this information itself, so including it wastes context
   */
  private detectRedundantContent(content: string, lines: string[], issues: ValidationIssue[]): void {
    const lowerContent = content.toLowerCase();

    // Detect "Project Structure" section - AI can use Glob to discover this
    // Match: ## Project Structure, ## Structure, # Project Structure
    const hasProjectStructure =
      lines.some((line) => /^#{1,2}\s*(project\s+)?structure/i.test(line.trim())) ||
      // Also detect directory listing patterns: - `src/` or - src/
      (content.match(/^-\s+`?src\//m) && content.match(/^-\s+`?(tests?|lib|dist)\//m));

    if (hasProjectStructure) {
      issues.push({
        type: 'warning',
        rule: 'redundant-content',
        message: 'Found "Project Structure" section - AI can discover directories with Glob tool',
        suggestion: 'Remove directory listings. Only mention cross-directory dependencies (e.g., "UI components in libs/ui")',
      });
    }

    // Detect "Naming Conventions" section - AI already knows standard conventions
    // Match: ## Naming, ## Naming Conventions, ## File Naming
    const hasNamingSection = lines.some((line) =>
      /^#{1,2}\s*(file\s+)?naming(\s+conventions?)?/i.test(line.trim())
    );
    const hasStandardNamingRules =
      lowerContent.includes('camelcase') ||
      lowerContent.includes('pascalcase') ||
      lowerContent.includes('kebab-case');

    if (hasNamingSection && hasStandardNamingRules) {
      issues.push({
        type: 'warning',
        rule: 'redundant-content',
        message: 'Found standard naming conventions - AI already knows camelCase/PascalCase/kebab-case',
        suggestion: 'Remove standard naming rules. Only mention project-specific conventions that differ from standard',
      });
    }

    // Detect "Testing" section - AI can read package.json for test commands
    // Match: ## Testing, ## Tests, ## Test
    const hasTestingSection = lines.some((line) =>
      /^#{1,2}\s*tests?(ing)?$/i.test(line.trim())
    );
    const hasGenericTestInfo =
      lowerContent.includes('npm test') ||
      lowerContent.includes('npm run test') ||
      lowerContent.includes('test files:') ||
      /tests?\/\*\*\//.test(lowerContent); // test/**/*.test.ts patterns

    if (hasTestingSection && hasGenericTestInfo) {
      issues.push({
        type: 'warning',
        rule: 'redundant-content',
        message: 'Found generic testing section - AI can read test commands from package.json',
        suggestion: 'Remove test file patterns and npm commands. Only keep unique testing conventions',
      });
    }

    // Detect exhaustive enumerations - AI reads full endpoint/field/file lists
    // from the source. A README that lists every router, column, or file is
    // re-stating the code, not documenting non-obvious conventions.
    // Heuristic: a single line packing many inline-code tokens (e.g.
    // `/auth /products /sizes ...` or `colA colB colC ...`) is a code dump.
    const INLINE_LIST_THRESHOLD = 6; // 6+ inline-code spans on one line = enumeration
    const dumpLine = lines.find((line) => {
      if (line.trim().startsWith('#') || line.trim().startsWith('```')) return false;
      const inlineSpans = line.match(/`[^`]+`/g) ?? [];
      // Either many separate spans, or one span stuffed with many space-separated tokens
      const stuffedSpan = inlineSpans.some(
        (s) => (s.replace(/`/g, '').trim().split(/\s+/).length) >= INLINE_LIST_THRESHOLD
      );
      return inlineSpans.length >= INLINE_LIST_THRESHOLD || stuffedSpan;
    });

    if (dumpLine) {
      issues.push({
        type: 'warning',
        rule: 'redundant-content',
        message:
          'Found an exhaustive enumeration (long inline list of endpoints/fields/files) - AI reads these from the source',
        suggestion:
          'Drop the full list. Keep only non-obvious entries or state the convention (e.g. "all routers proxy-prefixed /api") instead of listing every route.',
      });
    }

    // Check for Cross-directory dependencies section
    const hasCrossDirSection = lines.some((line) =>
      /^#{1,2}\s*cross[- ]?dir(ectory)?\s*(dep(endenc(y|ies))?)?/i.test(line.trim())
    );

    if (!hasCrossDirSection) {
      issues.push({
        type: 'info',
        rule: 'structure',
        message: 'No "Cross-directory dependencies" section found',
        suggestion: 'Add "## Cross-directory dependencies" section if this directory uses resources from other directories (can be empty if none)',
      });
    }
  }

  /**
   * Detect filler language that wastes tokens without adding information
   * Reports lines with filler and suggests compressed alternatives
   */
  private detectFillerLanguage(lines: string[], issues: ValidationIssue[]): void {
    // Patterns to detect and their replacements
    // Format: [regex, replacement or ''] — '' means delete phrase
    const fillerPatterns: Array<[RegExp, string]> = [
      // Articles (only at word boundaries in prose context)
      [/\b(in order to)\b/gi, 'to'],
      [/\b(make sure to|make sure that)\b/gi, 'ensure'],
      [/\b(the reason (is|was) because)\b/gi, 'because'],
      [/\b(it is important to note that|it is worth noting that)\b/gi, ''],
      [/\b(it might be worth|it would be good to|you could consider|you may want to)\b/gi, ''],
      [/\b(please note that|note that)\b/gi, ''],
      [/\b(basically|essentially|generally speaking|in general)\b/gi, ''],
      [/\b(just|really|actually|simply)\b/gi, ''],
      [/\b(furthermore|additionally|in addition|moreover|however,? )\b/gi, ''],
      [/\b(you should always|you should|you must remember to|remember to|always remember to)\b/gi, ''],
      [/\b(make use of)\b/gi, 'use'],
      [/\b(utilize|utilise)\b/gi, 'use'],
      [/\b(implement a solution for)\b/gi, 'fix'],
      [/\b(in the event that)\b/gi, 'if'],
      [/\b(at this point in time|at the present time)\b/gi, 'now'],
      [/\b(due to the fact that)\b/gi, 'because'],
      [/\b(a large number of)\b/gi, 'many'],
      [/\b(a wide variety of)\b/gi, 'various'],
      [/\b(sure,? |certainly,? |of course,? |happy to |I'd recommend )\b/gi, ''],
    ];

    const fillerLines: Array<{ lineNum: number; line: string; compressed: string; found: string[] }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim().startsWith('```') || line.trim().startsWith('    ')) {
        continue; // skip code blocks and indented code
      }
      // Skip lines that are headings or pure code
      if (line.trim().match(/^#{1,6}\s/)) continue;

      const foundPatterns: string[] = [];
      let compressed = line;

      for (const [pattern, replacement] of fillerPatterns) {
        const match = compressed.match(pattern);
        if (match) {
          foundPatterns.push(match[0]);
          compressed = compressed.replace(pattern, replacement);
        }
      }

      // Clean up double spaces left by removals
      compressed = compressed.replace(/\s{2,}/g, ' ').trim();

      if (foundPatterns.length > 0 && compressed !== line.trim()) {
        fillerLines.push({ lineNum: i + 1, line: line.trim(), compressed, found: foundPatterns });
      }
    }

    if (fillerLines.length > 0) {
      const examples = fillerLines.slice(0, 3).map(f =>
        `  Line ${f.lineNum}: "${f.line.slice(0, 60)}${f.line.length > 60 ? '...' : ''}" → "${f.compressed.slice(0, 60)}${f.compressed.length > 60 ? '...' : ''}"`
      ).join('\n');

      issues.push({
        type: 'warning',
        rule: 'filler-language',
        message: `Found ${fillerLines.length} line(s) with filler language (wasted tokens):\n${examples}`,
        suggestion: 'Run compress_ai_readme to auto-compress filler language and reduce token count.',
      });
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

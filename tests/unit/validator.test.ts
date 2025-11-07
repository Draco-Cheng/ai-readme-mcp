import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ReadmeValidator } from '../../src/core/validator.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_DIR = join(process.cwd(), 'tests', 'temp');
const TEST_README = join(TEST_DIR, 'VALIDATOR_TEST_README.md');
const CONFIG_FILE = join(TEST_DIR, '.aireadme.config.json');

const SHORT_README = `# Test Project

Simple and concise README with minimal content.

- Feature A
- Feature B
`;

const MEDIUM_README = `# Test Project

## Overview

This is a medium-length README that provides essential information about the project.

## Features

- Feature A: Does something useful
- Feature B: Does something else
- Feature C: Additional functionality

## Structure

- src/ - Source code
- tests/ - Test files
- docs/ - Documentation

## Usage

Install dependencies and run the project:

\`\`\`bash
npm install
npm start
\`\`\`

## Contributing

Please follow the coding conventions outlined in this project.
`;

const LONG_README = `# Test Project

## Overview

This is an extremely long README file that contains way too much information and exceeds recommended token limits. It includes multiple sections with extensive details, code examples, and verbose explanations that are not necessary for AI context.

## Architecture

The architecture of this project is complex and involves multiple layers of abstraction. We have implemented a microservices architecture with event-driven communication patterns. Each service is independently deployable and scalable.

### Frontend Layer

The frontend is built using React with TypeScript. We use a component-based architecture with strict separation of concerns. State management is handled through Redux with Redux Toolkit for simplified store configuration.

### Backend Layer

The backend consists of multiple Node.js services written in TypeScript. We use Express for the REST API layer and Socket.io for real-time communication. Database access is managed through TypeORM with PostgreSQL as the primary database.

### Infrastructure

Our infrastructure is deployed on AWS using ECS for container orchestration. We use Terraform for infrastructure as code. Monitoring is done through CloudWatch and Datadog. CI/CD pipelines are configured with GitHub Actions.

## Coding Conventions

### TypeScript

- Always use strict mode
- Prefer interfaces over types
- Use explicit return types
- Avoid any types
- Use readonly when possible
- Prefer const over let
- Use arrow functions for callbacks

### React

- Use functional components with hooks
- Avoid class components
- Use memo for expensive renders
- Custom hooks for reusable logic
- Props should be typed with interfaces
- Use useCallback for function props

### File Organization

- One component per file
- Colocate tests with components
- Group related components in folders
- Use index.ts for exports
- Separate business logic from UI

## Testing Strategy

We maintain high test coverage across the codebase. Unit tests are written using Jest and React Testing Library. Integration tests use Cypress. E2E tests run in CI/CD pipeline before deployment.

## Deployment Process

Deployments are automated through GitHub Actions. When code is merged to main, the CI pipeline runs tests, builds Docker images, pushes to ECR, and updates ECS services. Rollback is automated if health checks fail.

## Performance Optimization

We use various techniques to optimize performance including code splitting, lazy loading, memoization, virtual scrolling for long lists, and CDN for static assets. Bundle size is monitored and kept under 200KB for initial load.
`.repeat(3); // Repeat to make it really long

const NO_H1_README = `## Test Project

This README is missing the H1 heading.

Content goes here.
`;

const EMPTY_README = '';

describe('ReadmeValidator', () => {
  before(async () => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      await mkdir(TEST_DIR, { recursive: true });
    }
  });

  after(async () => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create validator with default config', () => {
      const validator = new ReadmeValidator();
      assert.ok(validator, 'Validator should be created');
    });

    it('should create validator with custom config', () => {
      const validator = new ReadmeValidator({
        maxTokens: 1000,
        rules: { requireH1: false },
      });
      assert.ok(validator, 'Validator should be created with custom config');
    });
  });

  describe('validate() - short README', () => {
    beforeEach(async () => {
      await writeFile(TEST_README, SHORT_README, 'utf-8');
    });

    it('should validate short README successfully', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      assert.strictEqual(result.valid, true, 'Should be valid');
      assert.strictEqual(result.filePath, TEST_README);
      assert.ok(result.stats, 'Should have stats');
      assert.ok(result.stats.tokens < 300, 'Should have low token count');
      assert.ok(result.score && result.score >= 90, 'Should have high score');
    });

    it('should give bonus for concise README', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      // Short READMEs should get bonus points
      assert.ok(result.score && result.score >= 100, 'Should get bonus for being concise');
    });
  });

  describe('validate() - medium README', () => {
    beforeEach(async () => {
      await writeFile(TEST_README, MEDIUM_README, 'utf-8');
    });

    it('should validate medium README successfully', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      assert.strictEqual(result.valid, true, 'Should be valid');
      assert.ok(result.stats, 'Should have stats');
      assert.ok(
        result.stats.tokens >= 100 && result.stats.tokens <= 600,
        'Should have moderate token count'
      );
    });

    it('should detect code blocks', async () => {
      const validator = new ReadmeValidator({ rules: { allowCodeBlocks: false } });
      const result = await validator.validate(TEST_README);

      const codeBlockIssue = result.issues.find((i) => i.rule === 'code-blocks');
      assert.ok(codeBlockIssue, 'Should detect code blocks when not allowed');
    });
  });

  describe('validate() - long README', () => {
    beforeEach(async () => {
      await writeFile(TEST_README, LONG_README, 'utf-8');
    });

    it('should fail validation for excessively long README', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      assert.strictEqual(result.valid, false, 'Should be invalid');

      const tokenIssue = result.issues.find((i) => i.rule === 'token-count');
      assert.ok(tokenIssue, 'Should have token count issue');
      assert.strictEqual(tokenIssue?.type, 'error', 'Should be an error');
    });

    it('should have low quality score for long README', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      assert.ok(result.score && result.score < 70, 'Should have low score (adjusted for strict limits)');
    });

    it('should provide suggestions for long README', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      const tokenIssue = result.issues.find((i) => i.rule === 'token-count');
      assert.ok(tokenIssue?.suggestion, 'Should provide suggestion');
      assert.ok(
        tokenIssue?.suggestion.includes('Remove'),
        'Suggestion should mention removing content'
      );
    });
  });

  describe('validate() - structure validation', () => {
    it('should detect missing H1 heading', async () => {
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }
      await writeFile(TEST_README, NO_H1_README, 'utf-8');
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      assert.strictEqual(result.valid, false, 'Should be invalid without H1');

      const h1Issue = result.issues.find((i) => i.rule === 'require-h1');
      assert.ok(h1Issue, 'Should have H1 issue');
      assert.strictEqual(h1Issue?.type, 'error', 'Should be an error');
    });

    it('should not require H1 if disabled in config', async () => {
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }
      await writeFile(TEST_README, NO_H1_README, 'utf-8');
      const validator = new ReadmeValidator({ rules: { requireH1: false } });
      const result = await validator.validate(TEST_README);

      const h1Issue = result.issues.find((i) => i.rule === 'require-h1');
      assert.strictEqual(h1Issue, undefined, 'Should not have H1 issue');
    });

    it('should detect missing required sections', async () => {
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }
      await writeFile(TEST_README, SHORT_README, 'utf-8');
      const validator = new ReadmeValidator({
        rules: { requireSections: ['## Architecture', '## Testing'] },
      });
      const result = await validator.validate(TEST_README);

      const sectionIssues = result.issues.filter((i) => i.rule === 'require-sections');
      assert.strictEqual(sectionIssues.length, 2, 'Should detect both missing sections');
      assert.ok(
        sectionIssues[0].message.includes('Architecture'),
        'Should mention missing Architecture section'
      );
    });
  });

  describe('validate() - empty README', () => {
    beforeEach(async () => {
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }
      await writeFile(TEST_README, EMPTY_README, 'utf-8');
    });

    it('should fail validation for empty README', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      assert.strictEqual(result.valid, false, 'Should be invalid');

      const emptyIssue = result.issues.find((i) => i.rule === 'empty-content');
      assert.ok(emptyIssue, 'Should have empty content issue');
      assert.strictEqual(emptyIssue?.type, 'error', 'Should be an error');
    });
  });

  describe('validate() - file not found', () => {
    it('should handle missing file gracefully', async () => {
      const validator = new ReadmeValidator();
      const result = await validator.validate('/nonexistent/file.md');

      assert.strictEqual(result.valid, false, 'Should be invalid');
      assert.strictEqual(result.issues.length, 1, 'Should have one issue');
      assert.ok(
        result.issues[0].message.includes('not found'),
        'Should mention file not found'
      );
    });
  });

  describe('validate() - line length validation', () => {
    it('should detect many long lines', async () => {
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }

      const longLinesReadme = `# Test

${'This is a very long line that exceeds the maximum line length limit and should trigger a warning about line length in the validation results.\n'.repeat(5)}
`;
      await writeFile(TEST_README, longLinesReadme, 'utf-8');
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      const lineLengthIssue = result.issues.find((i) => i.rule === 'line-length');
      assert.ok(lineLengthIssue, 'Should detect long lines');
      assert.strictEqual(lineLengthIssue?.type, 'info', 'Should be info level');
    });
  });

  describe('validate() - custom token limits', () => {
    it('should respect custom token limits', async () => {
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }

      // Create a README that's definitely long enough to exceed error threshold
      const longContent = MEDIUM_README.repeat(4); // Much longer now
      await writeFile(TEST_README, longContent, 'utf-8');

      const validator = new ReadmeValidator({
        tokenLimits: {
          excellent: 50,
          good: 100,
          warning: 150,
          error: 200,
        },
      });
      const result = await validator.validate(TEST_README);

      // Should trigger error with stricter limits (doubled content should be >200 tokens)
      const tokenIssue = result.issues.find((i) => i.rule === 'token-count');
      assert.ok(tokenIssue, 'Should have token issue with strict limits');
      assert.strictEqual(tokenIssue?.type, 'error', 'Should be error level');
    });
  });

  describe('loadConfig()', () => {
    it('should load config from file', async () => {
      // Ensure test directory exists
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }

      const customConfig = {
        validation: {
          maxTokens: 1000,
          rules: {
            requireH1: false,
            requireSections: ['## Architecture'],
            maxLineLength: 100,
          },
          tokenLimits: {
            excellent: 200,
            good: 400,
            warning: 600,
            error: 1000,
          },
        },
      };

      await writeFile(CONFIG_FILE, JSON.stringify(customConfig, null, 2), 'utf-8');
      const config = await ReadmeValidator.loadConfig(TEST_DIR);

      assert.ok(config, 'Should load config');
      assert.strictEqual(config?.maxTokens, 1000, 'Should have custom maxTokens');
      assert.strictEqual(config?.rules?.requireH1, false, 'Should have custom requireH1');
    });

    it('should return null if config file not found', async () => {
      const config = await ReadmeValidator.loadConfig('/nonexistent/dir');
      assert.strictEqual(config, null, 'Should return null for missing config');
    });

    it('should support flat config format', async () => {
      // Ensure test directory exists
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }

      const flatConfig = {
        maxTokens: 800,
        rules: { requireH1: true },
      };

      await writeFile(CONFIG_FILE, JSON.stringify(flatConfig, null, 2), 'utf-8');
      const config = await ReadmeValidator.loadConfig(TEST_DIR);

      assert.ok(config, 'Should load flat config');
      assert.strictEqual(config?.maxTokens, 800, 'Should have custom maxTokens');
    });
  });

  describe('quality scoring', () => {
    it('should calculate score based on issues', async () => {
      // Ensure test directory exists
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }

      await writeFile(TEST_README, SHORT_README, 'utf-8');
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      assert.ok(result.score, 'Should have a score');
      assert.ok(result.score >= 0 && result.score <= 110, 'Score should be in valid range');
    });

    it('should deduct points for errors', async () => {
      // Ensure test directory exists
      if (!existsSync(TEST_DIR)) {
        await mkdir(TEST_DIR, { recursive: true });
      }

      await writeFile(TEST_README, NO_H1_README, 'utf-8');
      const validator = new ReadmeValidator();
      const result = await validator.validate(TEST_README);

      const errorCount = result.issues.filter((i) => i.type === 'error').length;
      assert.ok(errorCount > 0, 'Should have at least one error');
      assert.ok(result.score && result.score < 100, 'Should deduct points for errors');
      // Score should be significantly lower due to errors
      assert.ok(result.score && result.score <= 90, 'Should deduct at least 10 points');
    });
  });
});

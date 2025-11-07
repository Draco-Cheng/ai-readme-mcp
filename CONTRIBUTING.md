# Contributing to AI_README MCP Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-readme-mcp.git
   cd ai-readme-mcp
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build the project:**
   ```bash
   npm run build
   ```
5. **Run tests:**
   ```bash
   npm test
   ```

All 26 tests should pass before you begin development.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/modifications

### 2. Make Changes

Follow the coding conventions in [AI_README.md](./AI_README.md):

**Key conventions:**
- TypeScript strict mode
- ESM imports with `.js` extensions
- Named exports only
- Path normalization (Unix-style `/` paths)
- JSDoc comments for exported functions
- 80%+ test coverage

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

**Commit message format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/config changes

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code follows project conventions
- [ ] New features have tests
- [ ] Documentation is updated

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented if unavoidable)
```

## Code Review Process

1. Maintainers will review your PR
2. Address any feedback
3. Once approved, PR will be merged

## Development Tips

### Running in Watch Mode

```bash
npm run dev
```

### Testing Specific Files

```bash
npm test -- tests/unit/scanner.test.ts
```

### Debugging MCP Server

```bash
# Test server manually
node dist/index.js

# Check MCP server status (if using Claude Code)
claude mcp get ai-readme-manager
```

### Path Handling (Critical!)

Always normalize paths to Unix-style:
```typescript
const normalizedPath = filePath.replace(/\\/g, '/');
```

This is essential for cross-platform compatibility.

## Project Structure

```
src/
├── index.ts        # MCP server entry point
├── core/           # Core business logic
│   ├── scanner.ts  # README file discovery
│   └── router.ts   # Context routing
├── tools/          # MCP tool implementations
│   ├── discover.ts
│   └── getContext.ts
└── types/          # TypeScript definitions

tests/
├── unit/           # Unit tests
└── fixtures/       # Test data
```

## Roadmap

See [README.md](./README.md) for the development roadmap.

**Current Phase:** Phase 1 (MVP) - Complete
**Next Phase:** Phase 2 - Update/Sync functionality

## Questions?

- Open an issue on GitHub
- Check existing issues first
- Be specific about your question

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉

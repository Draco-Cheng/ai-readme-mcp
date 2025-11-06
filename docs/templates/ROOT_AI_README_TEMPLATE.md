# [Project Name]

> This is the root-level AI_README for the entire project. It contains high-level conventions and architecture decisions that apply across all modules.

## Project Overview

**Type:** [e.g., Full-stack web application, CLI tool, Library, etc.]
**Tech Stack:** [e.g., React + Node.js + PostgreSQL]
**Repository Structure:** [e.g., Monorepo, Single package, etc.]

## High-Level Architecture

```
[Describe your overall architecture here]
Example:
- Frontend: React SPA served by Vite
- Backend: Express.js REST API
- Database: PostgreSQL with Prisma ORM
- Deployment: Docker containers on AWS ECS
```

## Universal Coding Conventions

### Language & TypeScript

- **Language Version:** [e.g., TypeScript 5.3+, Node 18+]
- **Strict Mode:** Enabled
- **Type Safety:** All new code must be fully typed, no `any` unless absolutely necessary

### File Naming

- **Components/Classes:** PascalCase (e.g., `UserProfile.tsx`, `AuthService.ts`)
- **Utilities/Helpers:** camelCase (e.g., `formatDate.ts`, `apiClient.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Test Files:** Match source file with `.test.ts` suffix (e.g., `Button.test.tsx`)

### Code Organization

```
project-root/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
├── scripts/       # Build and utility scripts
└── config/        # Configuration files
```

### Documentation

- Every exported function/class must have JSDoc comments
- Complex logic should have inline comments explaining the "why"
- Update AI_README files when architecture changes

### Testing

- **Framework:** [e.g., Vitest, Jest, Node.js native test runner]
- **Coverage Target:** 80% minimum
- **Test Location:** Co-located with source or in `tests/` directory
- **Test Types:**
  - Unit tests for all business logic
  - Integration tests for API endpoints
  - E2E tests for critical user flows

### Git Workflow

- **Branch Strategy:** [e.g., Git Flow, Trunk-based, Feature branches]
- **Commit Convention:** [e.g., Conventional Commits]
- **PR Requirements:**
  - All tests passing
  - Code reviewed by at least one team member
  - No merge conflicts
  - Updated documentation if needed

## Security Guidelines

- Never commit secrets, API keys, or credentials
- Use environment variables for configuration
- Sensitive files to never commit:
  - `.env`, `.env.local`
  - `credentials.json`, `secrets.yaml`
  - Private keys (`.pem`, `.key`)

## Performance Guidelines

- Optimize for readability first, performance second
- Profile before optimizing
- Document any performance-critical code

## Dependencies

- Review all new dependencies before adding
- Prefer well-maintained packages with active communities
- Keep dependencies up to date with security patches

## Build & Deployment

**Build Command:** `npm run build`
**Test Command:** `npm test`
**Lint Command:** `npm run lint`
**Type Check:** `npm run typecheck`

## Module-Specific Conventions

For module-specific conventions, see:
- Frontend: `apps/frontend/AI_README.md`
- Backend: `apps/backend/AI_README.md`
- Shared Libraries: `packages/*/AI_README.md`

## Important Reminders

- When making changes, always check relevant AI_README files for conventions
- Update AI_README files when introducing new patterns or changing architecture
- Ask questions if conventions are unclear or seem outdated

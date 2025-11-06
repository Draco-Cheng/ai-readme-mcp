# Usage Examples

This document provides practical examples of using the AI_README MCP Server with Claude Code.

## Example 1: Discovering All README Files

### User Request
> "Can you discover all AI_README files in this project?"

### Claude's Action
Claude uses the `discover_ai_readmes` tool:

```json
{
  "projectRoot": "/path/to/your/project",
  "excludePatterns": ["node_modules/**", ".git/**", "dist/**"]
}
```

### Response
```json
{
  "projectRoot": "/path/to/your/project",
  "totalFound": 4,
  "readmeFiles": [
    {
      "path": "AI_README.md",
      "scope": "root",
      "level": 0,
      "patterns": ["**/*"]
    },
    {
      "path": "apps/frontend/AI_README.md",
      "scope": "apps/frontend",
      "level": 1,
      "patterns": ["apps/frontend/**/*"]
    },
    {
      "path": "apps/backend/AI_README.md",
      "scope": "apps/backend",
      "level": 1,
      "patterns": ["apps/backend/**/*"]
    },
    {
      "path": "packages/shared/AI_README.md",
      "scope": "packages/shared",
      "level": 1,
      "patterns": ["packages/shared/**/*"]
    }
  ],
  "lastUpdated": "2025-11-05T22:52:28.290Z"
}
```

### Claude's Response to User
> "I found 4 AI_README files in your project:
> 1. Root-level README covering the entire project
> 2. Frontend module README at apps/frontend/
> 3. Backend module README at apps/backend/
> 4. Shared packages README at packages/shared/
>
> Each README covers conventions specific to its scope."

---

## Example 2: Getting Context Before Creating a Component

### User Request
> "I'm about to create a new button component in apps/frontend/src/components/Button.tsx. What conventions should I follow?"

### Claude's Action
Claude uses the `get_context_for_file` tool:

```json
{
  "projectRoot": "/path/to/your/project",
  "filePath": "apps/frontend/src/components/Button.tsx",
  "includeRoot": true
}
```

### Response
```markdown
## 📚 Project Context for: apps/frontend/src/components/Button.tsx

### Direct Module Conventions (apps/frontend/AI_README.md)

# Frontend Module

## Component Conventions

### Component Structure
- Use functional components with hooks
- Export as named export, not default export
- Props interface must be defined and documented

### Naming Conventions
- Components: PascalCase (e.g., UserProfile.tsx)
- One component per file

### Styling
- Use CSS Modules for component-specific styles
- File naming: ComponentName.module.css

### Testing
- Test user interactions, not implementation details
- Use accessible queries (getByRole, getByLabelText)
- Aim for 80%+ test coverage

---

### Root Conventions (AI_README.md)

# Project Overview

## Universal Coding Conventions

### Language & TypeScript
- TypeScript 5.3+
- Strict mode enabled
- No `any` unless absolutely necessary

### Documentation
- Every exported function/class must have JSDoc comments

### Testing
- Coverage target: 80% minimum

---
**Important Reminders:**
- Follow the above conventions when making changes
- If your changes affect architecture or conventions, consider updating the relevant AI_README
```

### Claude's Response to User
> "Based on the project conventions, here's how you should create the Button component:
>
> 1. **File Structure**:
>    - Create `Button.tsx` in PascalCase
>    - Create `Button.module.css` for styles
>    - Create `Button.test.tsx` for tests
>
> 2. **Component Pattern**:
>    ```typescript
>    // Button.tsx
>    import { ButtonHTMLAttributes } from 'react';
>    import styles from './Button.module.css';
>
>    interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
>      /** Button variant style */
>      variant?: 'primary' | 'secondary' | 'danger';
>      /** Button size */
>      size?: 'small' | 'medium' | 'large';
>    }
>
>    /**
>     * Reusable button component following project conventions
>     *
>     * @example
>     * <Button variant="primary" onClick={handleClick}>
>     *   Click me
>     * </Button>
>     */
>    export function Button({
>      variant = 'primary',
>      size = 'medium',
>      children,
>      className,
>      ...props
>    }: ButtonProps) {
>      return (
>        <button
>          className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
>          {...props}
>        >
>          {children}
>        </button>
>      );
>    }
>    ```
>
> 3. **Remember**:
>    - Use TypeScript with strict typing
>    - Add JSDoc comments for exported components
>    - Create tests with 80%+ coverage
>    - Use named exports, not default exports"

---

## Example 3: Getting Context for Backend Code

### User Request
> "I need to add a new API endpoint for user authentication. Show me what conventions I should follow."

### Claude's Action
```json
{
  "projectRoot": "/path/to/your/project",
  "filePath": "apps/backend/src/routes/auth.ts",
  "includeRoot": true
}
```

### Response
```markdown
## 📚 Project Context for: apps/backend/src/routes/auth.ts

### Direct Module Conventions (apps/backend/AI_README.md)

# Backend Module

## API Design Conventions

### RESTful Endpoints
```
POST   /api/auth/login     # User login
POST   /api/auth/register  # User registration
POST   /api/auth/logout    # User logout
```

### Response Format
**Success:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE"
  }
}
```

### HTTP Status Codes
- 200 OK - Successful operation
- 201 Created - Successful POST
- 400 Bad Request - Invalid input
- 401 Unauthorized - Authentication required
- 422 Unprocessable Entity - Validation error
- 500 Internal Server Error - Server error

## Security Best Practices
- Hash passwords with bcrypt or argon2
- Use JWT for authentication tokens
- Validate and sanitize all inputs
- Never log sensitive information

---
**Important Reminders:**
- Follow the above conventions when making changes
- If your changes affect architecture or conventions, consider updating the relevant AI_README
```

### Claude's Response
> "Based on your backend conventions, here's how to implement the authentication endpoint:
>
> ```typescript
> // routes/auth.ts
> import { Router } from 'express';
> import * as authController from '../controllers/authController.js';
>
> const router = Router();
>
> /**
>  * @route   POST /api/auth/login
>  * @desc    Authenticate user and return JWT token
>  * @access  Public
>  */
> router.post('/login', authController.login);
>
> /**
>  * @route   POST /api/auth/register
>  * @desc    Register new user
>  * @access  Public
>  */
> router.post('/register', authController.register);
>
> export default router;
> ```
>
> This follows your project's conventions:
> - Uses the standard route documentation format
> - Returns responses in the `{ success, data/error }` format
> - Proper HTTP status codes
> - Security best practices (password hashing, JWT)"

---

## Example 4: Checking Context for Multiple Files

### User Request
> "I'm refactoring the authentication flow. What context is relevant for both frontend and backend auth files?"

### Claude's Actions
Claude makes two tool calls in parallel:

**Call 1:**
```json
{
  "projectRoot": "/path/to/your/project",
  "filePath": "apps/frontend/src/hooks/useAuth.ts"
}
```

**Call 2:**
```json
{
  "projectRoot": "/path/to/your/project",
  "filePath": "apps/backend/src/services/authService.ts"
}
```

### Claude's Response
> "I've checked the conventions for both frontend and backend auth files:
>
> **Frontend (apps/frontend/src/hooks/useAuth.ts)**:
> - Custom hooks should be named with 'use' prefix
> - Use TypeScript with strict typing
> - Handle API errors gracefully with user-friendly messages
> - Test user interactions
>
> **Backend (apps/backend/src/services/authService.ts)**:
> - Service layer contains business logic
> - Hash passwords before storing
> - Return JWT tokens for authenticated sessions
> - Never include passwords in API responses
> - Validate all inputs with zod schemas
>
> Both should maintain consistency in:
> - Error handling patterns
> - Response formats
> - Security best practices"

---

## Example 5: Working in a Monorepo with Multiple Scopes

### Project Structure
```
monorepo/
├── AI_README.md                     # Root conventions
├── apps/
│   ├── web/
│   │   ├── AI_README.md            # Web app conventions
│   │   └── src/components/
│   ├── mobile/
│   │   ├── AI_README.md            # Mobile app conventions
│   │   └── src/screens/
│   └── admin/
│       ├── AI_README.md            # Admin panel conventions
│       └── src/pages/
└── packages/
    ├── ui/
    │   ├── AI_README.md            # UI library conventions
    │   └── src/components/
    └── api-client/
        ├── AI_README.md            # API client conventions
        └── src/
```

### User Request
> "I'm creating a new component in the shared UI library. What should I know?"

### Claude's Action
```json
{
  "projectRoot": "/path/to/monorepo",
  "filePath": "packages/ui/src/components/Card.tsx"
}
```

### Response Context Hierarchy
Claude receives contexts in order of relevance:
1. **Direct Module**: `packages/ui/AI_README.md` - UI library specific conventions
2. **Root**: `AI_README.md` - Project-wide conventions

### Claude's Response
> "For the shared UI library, follow these conventions:
>
> **UI Library Specific (packages/ui/AI_README.md)**:
> - Components must be framework-agnostic
> - Export all components from index.ts
> - Include Storybook stories for all components
> - Use CSS-in-JS for styling (to avoid conflicts)
> - Comprehensive JSDoc with examples
>
> **Project-wide**:
> - TypeScript strict mode
> - 80% test coverage minimum
> - Named exports only
>
> Since this is a shared library, remember:
> - It will be used by web, mobile, and admin apps
> - Breaking changes require major version bump
> - Must maintain backward compatibility"

---

## Best Practices for AI_README Files

### 1. Keep READMEs Focused

**Good** (Specific to scope):
```markdown
# Frontend Module

## Component Conventions
- Use React 18 features
- Implement error boundaries
```

**Bad** (Too generic):
```markdown
# Frontend

Write good code.
```

### 2. Use Hierarchical Organization

- **Root README**: Project-wide conventions everyone must follow
- **Module READMEs**: Module-specific patterns and decisions
- **Feature READMEs**: Feature-specific implementation details

### 3. Include Examples

```markdown
## API Error Handling

Always wrap API calls in try-catch:

\`\`\`typescript
try {
  const data = await api.fetchUser(id);
  setUser(data);
} catch (error) {
  toast.error('Failed to load user');
  logger.error('User fetch failed', { error, userId: id });
}
\`\`\`
```

### 4. Update READMEs When Patterns Change

When introducing new patterns, update the relevant AI_README:

> "I've updated the authentication flow. Should I update the AI_README?"

> **Claude**: "Yes! Since you changed how authentication works, you should update:
> - `apps/backend/AI_README.md` - Document the new JWT refresh token flow
> - `apps/frontend/AI_README.md` - Document how to use the new auth hooks
> - `AI_README.md` - Update security best practices if needed"

---

## Troubleshooting Examples

### Issue: Context Not Found

**User**: "Why isn't Claude using my AI_README context?"

**Solution**:
1. Ask Claude to discover all READMEs:
   > "Can you discover all AI_README files?"

2. Check if the file path matches the patterns:
   - README at `apps/frontend/AI_README.md` covers `apps/frontend/**/*`
   - File at `src/components/Button.tsx` won't match (missing `apps/frontend/` prefix)

3. Fix: Move README or adjust file path expectations

### Issue: Too Much Context

**User**: "Claude is including irrelevant README context"

**Solution**:
Use `includeRoot: false` to exclude root README:
```json
{
  "projectRoot": "/path/to/project",
  "filePath": "apps/mobile/src/screens/Home.tsx",
  "includeRoot": false
}
```

This only includes direct module READMEs, not the root project README.

---

## Next Steps

- See [Quick Start Guide](./QUICK_START.md) for setup instructions
- See [MCP Configuration](./MCP_CONFIG.md) for detailed configuration
- See [Templates](./templates/) for AI_README examples

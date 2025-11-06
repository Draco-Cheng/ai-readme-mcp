# Frontend Module

> This AI_README covers conventions specific to the frontend application. For project-wide conventions, see the root AI_README.md.

## Frontend Architecture

**Framework:** [e.g., React 18, Vue 3, Svelte, etc.]
**Build Tool:** [e.g., Vite, Webpack, Next.js]
**State Management:** [e.g., Zustand, Redux, Context API]
**Styling:** [e.g., Tailwind CSS, CSS Modules, Styled Components]
**Routing:** [e.g., React Router, TanStack Router]

## Directory Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Basic UI primitives (Button, Input, etc.)
│   └── features/    # Feature-specific components
├── pages/           # Page components (route handlers)
├── hooks/           # Custom React hooks
├── stores/          # State management stores
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── api/             # API client and endpoints
├── assets/          # Static assets (images, fonts)
└── styles/          # Global styles
```

## Component Conventions

### Component Structure

```typescript
// ComponentName.tsx
import { useState } from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  /** Description of the prop */
  title: string;
  /** Optional description */
  onClick?: () => void;
}

/**
 * Brief description of what this component does
 *
 * @example
 * <ComponentName title="Hello" onClick={handleClick} />
 */
export function ComponentName({ title, onClick }: ComponentNameProps) {
  const [state, setState] = useState<string>('');

  return (
    <div className={styles.container}>
      <h1>{title}</h1>
    </div>
  );
}
```

### Component Guidelines

- **One component per file**
- **Export as named export**, not default export
- **Props interface** must be defined and documented
- **Use functional components** with hooks
- **Compose small components** rather than large monolithic ones

### Naming Conventions

- **Components:** PascalCase (e.g., `UserProfile.tsx`)
- **Hooks:** camelCase starting with "use" (e.g., `useAuth.ts`)
- **Utilities:** camelCase (e.g., `formatCurrency.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`)

## State Management

### When to Use Different State Solutions

- **Local State (useState):** Component-specific state that doesn't need to be shared
- **Context:** Shared state across a subtree (theme, auth user)
- **Global Store:** Application-wide state that needs to be accessed from many places

### Store Structure

```typescript
// stores/userStore.ts
import { create } from 'zustand';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

## Styling Conventions

### CSS Modules

- Use CSS Modules for component-specific styles
- File naming: `ComponentName.module.css`
- Use semantic class names

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}

.buttonPrimary {
  background-color: var(--color-primary);
  color: white;
}
```

### Responsive Design

- Mobile-first approach
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

## API Integration

### API Client Structure

```typescript
// api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// api/users.ts
export const usersApi = {
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  updateUser: (id: string, data: UpdateUserDto) =>
    apiClient.patch(`/users/${id}`, data),
};
```

### Error Handling

- Always handle API errors gracefully
- Show user-friendly error messages
- Log errors for debugging

```typescript
try {
  const response = await usersApi.getUser(id);
  setUser(response.data);
} catch (error) {
  console.error('Failed to fetch user:', error);
  toast.error('Failed to load user data. Please try again.');
}
```

## Testing

### Component Testing

```typescript
// Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Testing Guidelines

- Test user interactions, not implementation details
- Use accessible queries (getByRole, getByLabelText)
- Mock API calls in component tests
- Aim for 80%+ test coverage

## Performance Optimization

- Use `React.memo()` for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes with `React.lazy()`
- Optimize images (use WebP, lazy loading)
- Code split by route

## Accessibility

- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

## Common Patterns

### Custom Hooks

```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### Form Handling

- Use controlled components
- Validate on submit, show errors clearly
- Consider using form libraries (React Hook Form, Formik) for complex forms

## Important Notes

- Always check network requests in DevTools
- Keep bundle size small (check with `npm run build`)
- Follow the component composition pattern
- Update this README when introducing new patterns

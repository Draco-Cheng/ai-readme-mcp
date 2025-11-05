# Frontend AI_README

## Architecture

This frontend application uses:
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6

## Component Structure

We follow Atomic Design principles:

```
src/
├── components/
│   ├── atoms/       # Basic building blocks (Button, Input)
│   ├── molecules/   # Simple combinations (SearchBar, Card)
│   ├── organisms/   # Complex components (Header, Sidebar)
│   └── templates/   # Page layouts
└── pages/           # Route pages
```

## Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: Start with `use` (e.g., `useAuth.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)

## Testing

- Use Vitest for unit tests
- Use Testing Library for component tests
- Test files: `*.test.tsx` next to source files

## Important Rules

1. Always use TypeScript, no `any` types
2. Components must be functional with hooks
3. Keep components small and focused
4. Write tests for all new components

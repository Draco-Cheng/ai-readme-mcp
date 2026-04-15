# Frontend

React with TypeScript. Components use atomic structure (`src/components/atoms/`, etc.). Named exports only.

## Cross-directory dependencies
Shared utils from `packages/shared/src/utils`. Backend API at `apps/backend`.

## Styling
- Tailwind CSS for all component styling — no CSS Modules, no inline styles
- Use Tailwind utility classes directly in JSX `className`
- No separate `.module.css` files

# Rule
No EMOJI
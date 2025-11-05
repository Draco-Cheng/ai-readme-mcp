# Backend AI_README

## Architecture

This backend API uses:
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Validation**: Zod schemas

## Project Structure

```
src/
├── routes/          # API route handlers
├── controllers/     # Business logic
├── services/        # External service integrations
├── models/          # Database models (Prisma)
├── middleware/      # Express middleware
└── utils/           # Helper functions
```

## API Conventions

- **RESTful**: Follow REST principles
- **Versioning**: Use `/api/v1/` prefix
- **Error Handling**: Use standard HTTP status codes
- **Response Format**: Always return JSON

Example response structure:
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## Database

- Use Prisma migrations for schema changes
- Keep seed data in `prisma/seed.ts`
- Write database queries in services layer

## Testing

- Use Vitest for unit tests
- Use Supertest for API integration tests
- Mock external services

## Security

- Always validate input with Zod
- Sanitize user input
- Use parameterized queries (Prisma handles this)
- Never expose sensitive data in responses

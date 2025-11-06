# Backend Module

> This AI_README covers conventions specific to the backend API. For project-wide conventions, see the root AI_README.md.

## Backend Architecture

**Framework:** [e.g., Express.js, Fastify, NestJS, Hono]
**Language:** [e.g., TypeScript, Node.js]
**Database:** [e.g., PostgreSQL, MongoDB, MySQL]
**ORM:** [e.g., Prisma, TypeORM, Drizzle]
**Authentication:** [e.g., JWT, OAuth2, Passport.js]

## Directory Structure

```
src/
├── routes/          # API route handlers
├── controllers/     # Request/response logic
├── services/        # Business logic
├── models/          # Database models/schemas
├── middleware/      # Express middleware
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── config/          # Configuration files
└── db/              # Database connection and migrations
```

## API Design Conventions

### RESTful Endpoints

```
GET    /api/users           # List all users
GET    /api/users/:id       # Get single user
POST   /api/users           # Create user
PATCH  /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user
```

### Response Format

**Success Response:**
```typescript
{
  "success": true,
  "data": {
    // Actual response data
  }
}
```

**Error Response:**
```typescript
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "details": {} // Optional additional details
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PATCH, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Route Structure

```typescript
// routes/users.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (requires authentication)
 */
router.get('/', authenticate, userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Public
 */
router.post('/', userController.createUser);

export default router;
```

## Controller Pattern

```typescript
// controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService.js';
import { CreateUserDto } from '../types/user.js';

/**
 * Get all users
 */
export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new user
 */
export async function createUser(
  req: Request<{}, {}, CreateUserDto>,
  res: Response,
  next: NextFunction
) {
  try {
    const userData = req.body;
    const user = await userService.createUser(userData);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
```

## Service Layer

```typescript
// services/userService.ts
import { db } from '../db/client.js';
import { CreateUserDto, UpdateUserDto } from '../types/user.js';
import { hashPassword } from '../utils/crypto.js';

/**
 * Get all users from database
 */
export async function getAllUsers() {
  return db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      // Never include password in responses
    },
  });
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserDto) {
  const hashedPassword = await hashPassword(data.password);

  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
}
```

## Middleware Conventions

### Authentication Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      });
    }

    const payload = await verifyToken(token);
    req.user = payload; // Add user to request
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' },
    });
  }
}
```

### Error Handling Middleware

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  // Handle known errors
  if (error instanceof ValidationError) {
    return res.status(422).json({
      success: false,
      error: {
        message: error.message,
        code: 'VALIDATION_ERROR',
        details: error.details,
      },
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}
```

## Database Conventions

### Schema Design

```typescript
// prisma/schema.prisma (example)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Migration Guidelines

- Never edit migrations that have been run in production
- Create new migrations for schema changes
- Test migrations on dev database before production
- Keep migrations small and focused

## Validation

```typescript
// Use zod for validation
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// Use in route handler
export async function createUser(req: Request, res: Response) {
  const validatedData = createUserSchema.parse(req.body);
  // ...
}
```

## Testing

### API Testing

```typescript
// tests/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { db } from '../../src/db/client.js';

describe('POST /api/users', () => {
  beforeAll(async () => {
    await db.user.deleteMany(); // Clean database
  });

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('test@example.com');
    expect(response.body.data.password).toBeUndefined(); // Never return password
  });

  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'invalid-email',
        name: 'Test User',
        password: 'Password123',
      })
      .expect(422);

    expect(response.body.success).toBe(false);
  });
});
```

## Security Best Practices

### Environment Variables

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().default('3000'),
});

export const env = envSchema.parse(process.env);
```

### Security Checklist

- Use HTTPS in production
- Validate and sanitize all inputs
- Use parameterized queries (prevent SQL injection)
- Hash passwords with bcrypt or argon2
- Implement rate limiting
- Use CORS properly
- Never log sensitive information
- Keep dependencies updated
- Use helmet.js for security headers

## Logging

```typescript
// Use structured logging
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

// Usage
logger.info({ userId: user.id }, 'User created successfully');
logger.error({ error: err, userId }, 'Failed to update user');
```

## Performance

- Use database indexes on frequently queried fields
- Implement caching for expensive operations (Redis)
- Use connection pooling
- Paginate large result sets
- Use database transactions for multi-step operations

## Important Notes

- Always validate user input
- Never trust client-side validation alone
- Log errors but never expose internal details to clients
- Keep sensitive configuration in environment variables
- Review database queries for N+1 problems
- Update this README when API contracts change

# Authentication & Authorization System

A complete Node.js + TypeScript authentication system with role-based access control using Prisma ORM, PostgreSQL driver adapter, and ESM modules.

## Features

- ✅ User Registration & Login
- ✅ JWT Authentication
- ✅ Password Hashing with bcrypt
- ✅ **Zod Validation** (Email format, Password strength, Input validation)
- ✅ Role-Based Authorization (EMPLOYEE, ADMIN, MANAGER, INSTRUCTOR)
- ✅ Protected Routes
- ✅ Logout Functionality
- ✅ Get All Users (Admin/Manager only)
- ✅ **ESM Modules** with TypeScript
- ✅ **Prisma Driver Adapter** (node-postgres)
- ✅ **Custom Generated Client Path**

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup PostgreSQL Database
Make sure PostgreSQL is running locally, then update the `.env` file with your database credentials:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/authdb?schema=public"
```

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

This will:
- Generate the Prisma Client in `generated/prisma/` directory
- Create and apply database migrations
- Create the `users` and `blacklisted_tokens` tables

### 4. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:8000`

## API Endpoints

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "EMPLOYEE"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <your_jwt_token>
```

#### Logout (Protected)
```http
POST /api/auth/logout
Authorization: Bearer <your_jwt_token>
```

#### Logout from All Devices (Protected)
```http
POST /api/auth/logout-all
Authorization: Bearer <your_jwt_token>
```

### User Routes

#### Get All Users (Admin/Manager Only)
```http
GET /api/users
Authorization: Bearer <your_jwt_token>
```

## Token Management

### How Logout Works (PostgreSQL-Backed)

The system implements **database-backed token blacklisting** using PostgreSQL:

1. **Single Device Logout** (`/api/auth/logout`):
   - Adds the JWT token to `blacklisted_tokens` table
   - Stores token, expiry time, and user ID
   - Token cannot be used for future requests

2. **Token Verification**:
   - Every authenticated request queries the database
   - Checks if token exists in `blacklisted_tokens` table
   - Blacklisted tokens return 401 "Token has been revoked"

3. **Automatic Cleanup**:
   - Expired tokens removed every hour automatically
   - Manual cleanup: `npm run cleanup:tokens`
   - Indexed queries for fast lookups

4. **Database Schema**:
```prisma
model BlacklistedToken {
  id        String   @id @default(uuid())
  token     String   @unique
  expiresAt DateTime
  userId    String?
  createdAt DateTime @default(now())
  
  @@index([expiresAt])
  @@index([token])
}
```

### Benefits of PostgreSQL Approach

✅ **Production-Ready**: Persistent storage survives server restarts
✅ **Scalable**: Works across multiple server instances
✅ **Auditable**: Track who logged out and when
✅ **Reliable**: ACID compliance ensures consistency
✅ **No Extra Infrastructure**: Uses existing PostgreSQL database

### Maintenance

**Automatic Cleanup** (runs every hour):
- The server automatically removes expired tokens
- Scheduled via `setInterval` in `tokenBlacklist.ts`

**Manual Cleanup** (run anytime):
```bash
npm run cleanup:tokens
```

**Cron Job** (optional, for production):
```bash
# Add to crontab: Run cleanup daily at 3 AM
0 3 * * * cd /path/to/project && npm run cleanup:tokens
```

### Performance Considerations

- **Indexes**: Role and email columns are indexed in user schema. Token and expiresAt columns are indexed in blacklisted tokens' schema
- **Query Performance**: O(1) lookup with unique indexes
- **Cleanup Impact**: Runs during low-traffic hours
- **Connection Pooling**: Prisma manages connections efficiently

### Logout All Devices (Future Enhancement)

To implement true "logout from all devices":

1. Add `tokenVersion` to User model:
```prisma
model User {
  tokenVersion Int @default(0)
  // ... other fields
}
```

2. Increment on logout-all:
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { tokenVersion: { increment: 1 } }
});
```

3. Check version in JWT verification:
```typescript
if (decoded.tokenVersion !== user.tokenVersion) {
  throw new Error('Token version mismatch');
}
```

- **EMPLOYEE**: Basic user role
- **ADMIN**: Full access to all resources
- **MANAGER**: Can view all users
- **INSTRUCTOR**: Standard instructor role

## Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── generated            # Generated Prisma Client (output path) 
├── src/
│   ├── config/
│   │   └── database.ts      # Prisma client with pg adapter
│   ├── controllers/
│   │   ├── auth.controller.ts   # Authentication logic
│   │   └── user.controller.ts   # User management logic
│   ├── middleware/
│   │   ├── auth.middleware.ts   # Authentication & Authorization
│   │   └── validate.middleware.ts # Zod validation middleware
│   ├── routes/
│   │   ├── auth.routes.ts   # Auth endpoints
│   │   └── user.routes.ts   # User endpoints
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── utils/
│   │   └── jwt.ts           # JWT helper functions
│   ├── validation/
│   │   └── auth.validation.ts # Zod schemas
│   ├── app.ts               # Express app configuration
│   └── server.ts            # Server entry point
├── .env                     # Environment variables
├── package.json             # Dependencies (ESM mode)
└── tsconfig.json            # TypeScript config (ESM)
```

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","name":"Admin User","role":"ADMIN"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### Get All Users
```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Security Notes

- **Prisma Driver Adapter**: Uses `@prisma/adapter-pg` with node-postgres for better connection management
- **Custom Output Path**: Prisma Client generated in `generated/prisma/` for better project organization
- **ESM Modules**: Full ES Module support with `.js` extensions in imports
- Prisma Client is instantiated as a singleton to prevent multiple instances in development
- Change the `JWT_SECRET` in `.env` to a strong secret in production
- Passwords are hashed using bcrypt with 10 salt rounds
- **Password validation requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Email format validation using Zod
- JWT tokens expire in 24 hours (configurable)
- Client-side should delete the token on logout
# Authentication & Authorization API

A robust, production-ready authentication and authorization system built with Node.js, Express, TypeScript, and PostgreSQL. Features OTP-based two-factor authentication, role-based access control, and comprehensive security measures.

## 🚀 Features

### Authentication
- **User Registration** with email verification via OTP
- **Two-Factor Authentication (2FA)** using time-limited OTPs
- **JWT-based Authentication** with access and refresh tokens
- **Password Reset Flow** with secure OTP verification
- **Multi-Device Session Management** with logout and logout-all functionality
- **Token Blacklisting** for immediate session revocation

### Authorization
- **Role-Based Access Control (RBAC)** with three roles:
  - `ADMIN` - Full system access
  - `INSTRUCTOR` - Can create and manage courses
  - `EMPLOYEE` - Basic user access
- **Protected Routes** with middleware-based authorization
- **Granular Permissions** per endpoint

### Security
- **Rate Limiting** on authentication endpoints
- **Secure Password Storage** using bcrypt
- **HTTP-Only Cookies** for refresh tokens
- **Token Rotation** on refresh
- **Helmet.js** for security headers
- **CORS Configuration** for cross-origin security
- **Input Validation** using Zod schemas
- **Request Logging** with Winston

### Additional Features
- **Course Management System** for instructors
- **User Profile Management**
- **Automated Token Cleanup** for expired entries
- **Structured Logging** with timestamp and severity levels
- **Docker Support** for containerized deployment
- **Database Migrations** with Prisma

## 📋 Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 15.x
- **npm** or **yarn**
- **Docker** (optional, for containerized deployment)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/auth-authorization-api.git
cd auth-authorization-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/authdb

# JWT Configuration
JWT_SECRET=your-super-secure-secret-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=3d

# Email Configuration (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Admin Seeding
ADMIN_PASS=SecureAdminP@ssword123

# Docker Database (if using docker-compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=authdb
```

### 4. Database Setup

#### Option A: Local PostgreSQL
```bash
# Run migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Seed initial admin user
npm run seed
```

#### Option B: Docker Compose
```bash
# Start database and application
docker-compose up -d

# The migrations and seeding run automatically
```

### 5. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "confirmPassword": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for OTP.",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  }
}
```

#### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification successful. You are now logged in.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email. Please verify to complete login."
}
```

#### 4. Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 5. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 6. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "password": "NewSecureP@ss123",
  "confirmPassword": "NewSecureP@ss123"
}
```

#### 7. Refresh Token
```http
POST /api/auth/refresh
Cookie: refreshToken=...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 8. Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile details retrieved.",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 9. Logout (Protected)
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Cookie: refreshToken=...
```

#### 10. Logout All Devices (Protected)
```http
POST /api/auth/logout-all
Authorization: Bearer <access_token>
```

### User & Course Endpoints

#### 1. Get All Users (ADMIN Only)
```http
GET /api/user/all
Authorization: Bearer <access_token>
```

#### 2. Create Course (INSTRUCTOR Only)
```http
POST /api/user/course
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Introduction to TypeScript",
  "description": "Learn TypeScript from scratch"
}
```

#### 3. Get My Courses (INSTRUCTOR Only)
```http
GET /api/user/instructor/courses
Authorization: Bearer <access_token>
```

#### 4. Get All Courses (All Roles)
```http
GET /api/user/courses
Authorization: Bearer <access_token>
```

### Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running successfully."
}
```

## 🔒 Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*, etc.)

## 🔐 Security Features

### Rate Limiting
- **Authentication endpoints**: 50 requests per 15 minutes per IP
- **General API endpoints**: 100 requests per hour per IP

### Token Management
- **Access Token**: Short-lived (1 hour default)
- **Refresh Token**: Longer-lived (3 days default), stored in HTTP-only cookie
- **Token Blacklisting**: Immediate revocation on logout
- **Automatic Cleanup**: Expired tokens removed hourly

### OTP Security
- **6-digit OTP**: Cryptographically secure random generation
- **10-minute expiration**: Time-limited validity
- **Hashed storage**: OTPs stored as bcrypt hashes
- **Single-use**: Invalidated after successful verification

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── config/
│   │   └── database.ts        # Prisma client configuration
│   ├── controllers/
│   │   ├── auth.controller.ts # Authentication controllers
│   │   └── user.controller.ts # User management controllers
│   ├── middleware/
│   │   ├── auth.middleware.ts # Authentication & authorization
│   │   ├── httpLogger.ts      # HTTP request logging
│   │   ├── rateLimiter.ts     # Rate limiting configuration
│   │   └── validate.middleware.ts # Zod validation
│   ├── routes/
│   │   ├── auth.routes.ts     # Auth endpoints
│   │   └── user.routes.ts     # User endpoints
│   ├── scripts/
│   │   └── cleanupTokens.ts   # Token cleanup utility
│   ├── services/
│   │   ├── auth.service.ts    # Authentication business logic
│   │   └── user.service.ts    # User business logic
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/
│   │   ├── email.ts           # Email and OTP utilities
│   │   ├── jwt.ts             # JWT token utilities
│   │   ├── logger.ts          # Winston logger configuration
│   │   ├── response.ts        # Standardized response helper
│   │   └── tokenBlacklist.ts  # Token blacklist management
│   ├── validation/
│   │   ├── auth.validation.ts # Auth input validation schemas
│   │   └── user.validation.ts # User input validation schemas
│   └── app.ts                 # Application entry point
├── .dockerignore
├── .env                       # Environment variables (not in repo)
├── docker-compose.yml         # Docker compose configuration
├── Dockerfile                 # Docker image definition
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

### Manual Token Cleanup
```bash
npm run cleanup:tokens
```

### Database Operations
```bash
# Create a new migration
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:deploy

# Generate Prisma Client
npm run prisma:generate

# Seed the database
npm run seed
```

## 🐳 Docker Deployment

### Build and Run
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production Considerations
1. Use environment-specific `.env` files
2. Enable HTTPS/TLS in production
3. Configure proper CORS origins
4. Set up monitoring and alerting
5. Implement backup strategies for PostgreSQL
6. Use secrets management (AWS Secrets Manager, HashiCorp Vault)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `PORT` | Server port | `8000` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - | Yes |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `1h` | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `3d` | No |
| `SMTP_USER` | Email service username | - | Yes* |
| `SMTP_PASS` | Email service password | - | Yes* |
| `ADMIN_PASS` | Initial admin password | - | Yes |

*Required for production; optional in development (emails logged to console)

## 📊 Database Schema

### User
- `id` (UUID, Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `firstName`, `lastName`
- `role` (ADMIN, INSTRUCTOR, EMPLOYEE)
- `isVerified` (Boolean)
- `otp`, `otpExpires` (OTP fields)
- Timestamps

### Course
- `id` (UUID, Primary Key)
- `title`, `description`
- `instructorId` (Foreign Key → User)
- Timestamps

### RefreshToken
- `id` (UUID, Primary Key)
- `token` (Hashed, Unique)
- `userId` (Foreign Key → User)
- `expiresAt`
- Timestamps

### BlacklistedToken
- `id` (UUID, Primary Key)
- `token` (Unique)
- `expiresAt`
- `userId` (Optional)
- Timestamps

## 👤 Author

**Viraj Bhingare**

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database ORM: [Prisma](https://www.prisma.io/)
- Validation: [Zod](https://zod.dev/)
- Logging: [Winston](https://github.com/winstonjs/winston)
- Security: [Helmet.js](https://helmetjs.github.io/)
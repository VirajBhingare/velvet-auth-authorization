# ------------------------------------------------------------------------------
# Stage 1: Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# 1. Install OpenSSL and libc6-compat
RUN apk add --no-cache openssl libc6-compat

# 2. Copy package files AND prisma folder first
COPY package*.json ./
COPY prisma ./prisma

# 3. Install dependencies
RUN npm ci

# 4. Build the application
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Runner (Production Image)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 5. Install OpenSSL
RUN apk add --no-cache openssl

# 6. Copy artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 7. Security: Run as non-root user
USER node

EXPOSE 3000

# 8. STARTUP COMMAND CHANGED:
# Changed from 'migrate deploy' to 'db push'.
# 'db push' creates the tables directly from schema.prisma without needing migration files.
CMD ["sh", "-c", "npx prisma db push && node dist/app.js"]
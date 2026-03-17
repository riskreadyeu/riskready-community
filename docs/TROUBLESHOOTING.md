# Troubleshooting Guide

## Server Configuration

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│   (React/Vite)  │     │    (NestJS)     │     │    Database     │
│   Port: 5173    │     │   Port: 4000    │     │   Port: 5432    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Service Configuration

| Service | Technology | Port | Directory |
|---------|------------|------|-----------|
| Frontend | React + Vite | 5173 | `apps/web` |
| Backend | NestJS + Prisma | 4000 | `apps/server` |
| Database | PostgreSQL | 5432 | Local/Docker |

---

### Prisma ORM

**What is Prisma?**
Prisma is NOT a separate running service. It's an ORM library embedded in the backend that:
- Generates TypeScript types from your database schema
- Provides a type-safe database client (`@prisma/client`)
- Handles database migrations

**Prisma Components:**

| Component | Location | Purpose |
|-----------|----------|---------|
| Schema Files | `apps/server/prisma/schema/*.prisma` | Define database models |
| Migrations | `apps/server/prisma/migrations/` | Database version control |
| Generated Client | `apps/server/node_modules/.prisma/client/` | Auto-generated TypeScript types |
| Seed Script | `apps/server/prisma/seed.ts` | Initial data population |

**Schema Files Structure:**
```
apps/server/prisma/schema/
├── base.prisma          # Datasource & generator config
├── auth.prisma          # User, Role, Session models
├── organisation.prisma  # Organisation models
├── controls.prisma      # Control framework models
├── risks.prisma         # Risk management models
├── applications.prisma  # Application security models
├── policies.prisma      # Policy management models
├── itsm.prisma          # IT Service Management models
├── supply-chain.prisma  # Vendor management models
├── audits.prisma        # Audit models
└── incidents.prisma     # Incident management models
```

**Common Prisma Commands:**

```bash
cd apps/server

# Generate Prisma client (required after schema changes)
npx prisma generate --schema=prisma/schema

# Create a new migration
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" \
npx prisma migrate dev --name migration_name --schema=prisma/schema

# Push schema changes without migration (dev only)
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" \
npx prisma db push --schema=prisma/schema

# Open Prisma Studio (visual database browser)
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" \
npx prisma studio --schema=prisma/schema

# Reset database (WARNING: deletes all data!)
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" \
npx prisma migrate reset --force --schema=prisma/schema

# Seed the database
npx prisma db seed
```

**Prisma Studio:**
If you want a visual interface to browse/edit your database:
```bash
cd apps/server
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" npx prisma studio --schema=prisma/schema
```
This opens a web UI at **http://localhost:5555**

**Why Schema is Split into Multiple Files:**
The schema uses Prisma's multi-file schema feature. All `.prisma` files in `prisma/schema/` are merged together. This keeps the codebase organized by domain.

---

### Frontend Configuration (`apps/web`)

**Vite Config** (`vite.config.ts`):
```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  strictPort: true,
  allowedHosts: ['riskready.local', 'localhost'],
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:4000',
      changeOrigin: true,
    },
  },
}
```

**Key Points:**
- Frontend runs on port **5173**
- API calls to `/api/*` are proxied to backend on port **4000**
- HMR (Hot Module Replacement) enabled for development

**Start Command:**
```bash
cd apps/web
npm run dev
```

**Access URL:** http://localhost:5173

---

### Backend Configuration (`apps/server`)

**Main Entry** (`src/main.ts`):
- Uses NestJS framework
- Global prefix: `/api` (all routes start with `/api/`)
- CORS enabled with credentials
- Cookie parser middleware

**Start Command:**
```bash
cd apps/server
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" PORT=4000 npm run dev
```

**Access URLs:**
- API Base: http://localhost:4000/api
- Health Check: http://localhost:4000/api/health

**Package.json Scripts:**
```json
{
  "dev": "tsx watch src/main.ts",
  "build": "prisma generate --schema=prisma/schema && tsc -p tsconfig.build.json",
  "start": "node dist/main.js",
  "prisma:generate": "prisma generate --schema=prisma/schema",
  "prisma:migrate": "prisma migrate dev --schema=prisma/schema"
}
```

---

### Database Configuration (PostgreSQL)

**Connection Details:**
| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 5432 |
| Database | riskready |
| User | danielminda |
| Password | (none for local) |

**Connection String:**
```
postgresql://danielminda@localhost:5432/riskready
```

**Prisma Schema Location:** `apps/server/prisma/schema/`

**Check PostgreSQL Status:**
```bash
# Check if PostgreSQL is running (Homebrew)
brew services list | grep postgres

# Start PostgreSQL
brew services start postgresql@14

# Stop PostgreSQL
brew services stop postgresql@14

# Connect to database
psql -U danielminda -d riskready
```

**Create Database (if needed):**
```bash
psql -U danielminda -d postgres -c "CREATE DATABASE riskready;"
```

---

### Environment Variables

Create `apps/server/.env`:
```env
# Database
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready"

# Server
PORT=4000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

---

### Quick Start (All Services)

```bash
# 1. Ensure PostgreSQL is running
brew services start postgresql@14

# 2. Start Backend (Terminal 1)
cd apps/server
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" PORT=4000 npm run dev

# 3. Start Frontend (Terminal 2)
cd apps/web
npm run dev

# 4. Verify all services
lsof -i :4000 -i :5173 -i :5432
curl http://localhost:4000/api/health
```

---

## Dependency Injection Failures (AuthService/PrismaService undefined)

### Symptoms
- `AuthService` or `PrismaService` are `undefined` in constructors
- Login endpoint returns 500 error: `TypeError: Cannot read properties of undefined (reading 'login')`
- Server logs show: `AuthService: PrismaService is undefined!` or `AuthController constructor called { hasAuthService: false, hasPrisma: false }`

### Root Cause
**NestJS requires TypeScript decorator metadata for dependency injection.** When using `tsx` (esbuild) instead of `ts-node-dev`, the decorator metadata is not preserved, causing DI to fail.

**Why this happens:**
- NestJS uses `reflect-metadata` to read TypeScript decorator metadata at runtime
- `tsx` uses esbuild which strips decorator metadata during transpilation
- `ts-node-dev` preserves decorator metadata correctly
- The `package.json` `dev` script uses `ts-node-dev`, but if you run `tsx watch` manually, DI breaks

### Fix
**Always use the npm script, not `tsx` directly:**

```bash
# ✅ CORRECT - Uses ts-node-dev which preserves metadata
cd apps/server
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" PORT=4000 npm run dev

# ❌ WRONG - tsx doesn't preserve decorator metadata
npx tsx watch src/main.ts
```

**If you must use `tsx`, you need to configure it to preserve metadata:**
```bash
# This is NOT recommended - use npm run dev instead
TSX_NODE_OPTIONS="--require reflect-metadata" npx tsx watch src/main.ts
```

### Verification
After starting the server correctly, test login:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.test","password":"test123456"}'
```

If you see `{"user":{...}}` instead of a 500 error, DI is working correctly.

---

## Backend Won't Start / Hangs Without Output

### Symptoms
- Running `npm run dev` in the server directory hangs indefinitely
- No console output appears (not even error messages)
- Multiple `ts-node-dev` or `tsx` processes accumulate
- This often happens after adding a new module or making schema changes

### Root Cause
The Prisma client generates **500,000+ lines of TypeScript type definitions** due to the complex schema. This causes `ts-node-dev` to hang during the initial compilation phase.

### Quick Fix

1. **Kill all orphaned processes first:**
   ```bash
   pkill -f "ts-node-dev" 2>/dev/null
   pkill -f "tsx" 2>/dev/null
   lsof -ti:4000 | xargs kill -9 2>/dev/null
   ```

2. **Reinstall node_modules and regenerate Prisma client:**
   ```bash
   cd apps/server
   rm -rf node_modules
   npm install
   npx prisma generate --schema=prisma/schema
   ```

3. **Start the server using tsx (not ts-node-dev):**
   ```bash
   npx tsx src/main.ts
   ```
   
   Or with environment variables:
   ```bash
   DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" PORT=4000 npx tsx src/main.ts
   ```

### Permanent Fix

The `package.json` should use `tsx` instead of `ts-node-dev`:

```json
"dev": "tsx watch src/main.ts"
```

**Why tsx?**
- Uses esbuild for much faster transpilation
- Skips type checking during development (faster startup)
- Better watch mode without orphaned processes
- Already installed in devDependencies

---

## Database Schema Out of Sync

### Symptoms
- Server crashes with Prisma errors
- "Table does not exist" errors
- Schema validation failures

### Fix

1. **Check if database is in sync:**
   ```bash
   cd apps/server
   DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" npx prisma db push --schema=prisma/schema
   ```

2. **If you need to create a migration:**
   ```bash
   DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" npx prisma migrate dev --name your_migration_name --schema=prisma/schema
   ```

3. **Regenerate Prisma client after schema changes:**
   ```bash
   npx prisma generate --schema=prisma/schema
   ```

---

## Orphaned Processes (CRITICAL)

### ⚠️ Never let multiple ts-node-dev or tsx processes accumulate!

### Check for orphaned processes:
```bash
ps aux | grep -E "(ts-node|tsx)" | grep -v grep
```

### Kill all orphaned processes:
```bash
pkill -9 -f "ts-node-dev"
pkill -9 -f "tsx src/main.ts"
```

### Kill processes on specific ports:
```bash
lsof -ti:4000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

---

## Starting the Full Stack

### Prerequisites
- PostgreSQL running locally (port 5432)
- Database `riskready` exists

### Start all services:

```bash
# Terminal 1 - Backend
cd apps/server
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" PORT=4000 npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### Verify services are running:
```bash
# Check ports
lsof -i :4000  # Backend
lsof -i :5173  # Frontend

# Test backend health
curl http://localhost:4000/api/health
```

---

## Common Issues After Adding New Modules

When you add a new NestJS module (like IncidentsModule):

1. **Run database migration if you added Prisma models:**
   ```bash
   cd apps/server
   DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" npx prisma migrate dev --name add_your_module --schema=prisma/schema
   ```

2. **Regenerate Prisma client:**
   ```bash
   npx prisma generate --schema=prisma/schema
   ```

3. **If the server still hangs, reinstall node_modules:**
   ```bash
   rm -rf node_modules
   npm install
   npx prisma generate --schema=prisma/schema
   ```

---

## Environment Variables

Required environment variables for the backend:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string |
| `PORT` | 3000 | Server port |
| `JWT_SECRET` | - | JWT signing secret |
| `JWT_REFRESH_SECRET` | - | JWT refresh token secret |

Example `.env` file for `apps/server/.env`:
```env
DATABASE_URL="postgresql://danielminda@localhost:5432/riskready"
PORT=4000
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

---

## Quick Reference Commands

```bash
# Kill everything and start fresh
pkill -f "ts-node" ; pkill -f "tsx" ; pkill -f "vite"

# Check what's running on dev ports
lsof -i :4000 -i :5173 -i :5432

# Full reset of server
cd apps/server && rm -rf node_modules && npm install && npx prisma generate --schema=prisma/schema

# Start backend with all env vars
cd apps/server && DATABASE_URL="postgresql://danielminda@localhost:5432/riskready" PORT=4000 npm run dev

# Start frontend
cd apps/web && npm run dev
```


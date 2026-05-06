# Backend & Data Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add self-hosted Hono backend with PostgreSQL, JWT auth, and cross-device sync to DoNotNervous.

**Architecture:** Monorepo with `server/` alongside `src/`. Dexie stays as local-first cache. Hono serves REST API. Drizzle ORM talks to PostgreSQL. Timestamp-based LWW sync. Docker Compose for deployment.

**Tech Stack:** Hono, Drizzle ORM, PostgreSQL 16, bcrypt, JWT, Docker Compose

---

## Phase 1: Server Scaffold

### Task 1: Create server package

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`

**Step 1: Create server directory and package.json**

```bash
mkdir -p server/src/{middleware,routes,db,domain}
```

`server/package.json`:
```json
{
  "name": "donotnervous-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "hono": "^4.7.0",
    "@hono/node-server": "^1.14.0",
    "drizzle-orm": "^0.44.0",
    "postgres": "^3.4.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.0",
    "nanoid": "^5.1.0",
    "dotenv": "^16.5.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/node": "^24.0.0",
    "drizzle-kit": "^0.31.0",
    "tsx": "^4.19.0",
    "typescript": "~6.0.0",
    "vitest": "^3.1.0"
  }
}
```

**Step 2: Create server tsconfig.json**

`server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: Install dependencies**

```bash
cd server && npm install
```

**Step 4: Commit**

```bash
git add server/package.json server/tsconfig.json server/package-lock.json
git commit -m "feat(server): scaffold server package with deps"
```

---

### Task 2: Docker Compose and environment

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: donotnervous
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d donotnervous"]
      interval: 5s
      timeout: 5s
      retries: 5

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://app:${DB_PASSWORD}@postgres:5432/donotnervous
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:5173}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```

**Step 2: Create .env.example**

```
DB_PASSWORD=changeme
JWT_SECRET=changeme-to-random-32-chars
JWT_REFRESH_SECRET=changeme-to-different-32-chars
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://app:changeme@localhost:5432/donotnervous
```

**Step 3: Update .gitignore — add these lines**

```
server/dist/
.env
```

**Step 4: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "feat(infra): add docker-compose and env config"
```

---

### Task 3: Drizzle schema

**Files:**
- Create: `server/src/db/schema.ts`
- Create: `server/drizzle.config.ts`

**Step 1: Create Drizzle schema**

`server/src/db/schema.ts`:
```typescript
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, primaryKey, date } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  type: varchar('type', { length: 20 }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('easy'),
  category: text('category').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const pointLedger = pgTable('point_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  reason: text('reason').notNull().default(''),
  taskId: uuid('task_id'),
  streakLength: integer('streak_length').notNull().default(0),
  multiplier: integer('multiplier').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const streakRecords = pgTable('streak_records', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  completedTaskIds: jsonb('completed_task_ids').notNull().$type<string[]>().default([]),
  freezeUsed: boolean('freeze_used').notNull().default(false),
  freezeCountRemaining: integer('freeze_count_remaining').notNull().default(0),
  recoveredFrom: boolean('recovered_from').notNull().default(false),
  recoveryTaskId: uuid('recovery_task_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.date] }),
])

export const moodEntries = pgTable('mood_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  label: text('label').notNull().default(''),
  journal: text('journal').notNull().default(''),
  taskId: uuid('task_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  pointCost: integer('point_cost').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const redemptions = pgTable('redemptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id').notNull(),
  rewardName: text('reward_name').notNull(),
  pointsSpent: integer('points_spent').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const dailySummaries = pgTable('daily_summaries', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  id: uuid('id').defaultRandom(),
  date: date('date').notNull(),
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  tasksCreated: integer('tasks_created').notNull().default(0),
  pointsEarned: integer('points_earned').notNull().default(0),
  pointsSpent: integer('points_spent').notNull().default(0),
  dominantMood: varchar('dominant_mood', { length: 10 }),
  dominantMoodScore: integer('dominant_mood_score').notNull().default(0),
  taskIds: jsonb('task_ids').notNull().$type<string[]>().default([]),
  moodEntryIds: jsonb('mood_entry_ids').notNull().$type<string[]>().default([]),
  ledgerEntryIds: jsonb('ledger_entry_ids').notNull().$type<string[]>().default([]),
  redemptionIds: jsonb('redemption_ids').notNull().$type<string[]>().default([]),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.date] }),
])

export const weeklySummaries = pgTable('weekly_summaries', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  id: uuid('id').defaultRandom(),
  weekStart: date('week_start').notNull(),
  weekEnd: date('week_end').notNull(),
  totalTasksCompleted: integer('total_tasks_completed').notNull().default(0),
  totalTasksCreated: integer('total_tasks_created').notNull().default(0),
  totalPointsEarned: integer('total_points_earned').notNull().default(0),
  totalPointsSpent: integer('total_points_spent').notNull().default(0),
  avgMoodScore: integer('avg_mood_score').notNull().default(0),
  streakDays: integer('streak_days').notNull().default(0),
  completionRate: integer('completion_rate').notNull().default(0),
  bestDayDate: date('best_day_date'),
  bestDayScore: integer('best_day_score').notNull().default(0),
  bestDayTaskCount: integer('best_day_task_count').notNull().default(0),
  userBestDayOverride: date('user_best_day_override'),
  dailyBreakdown: jsonb('daily_breakdown').notNull().$type<Array<{
    date: string; tasksCompleted: number; pointsEarned: number; moodScore: number; compositeScore: number
  }>>().default([]),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.weekStart] }),
])
```

**Step 2: Create drizzle.config.ts**

`server/drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://app:changeme@localhost:5432/donotnervous',
  },
})
```

**Step 3: Commit**

```bash
git add server/src/db/schema.ts server/drizzle.config.ts
git commit -m "feat(server): add Drizzle schema for all 9 tables"
```

---

### Task 4: Database connection

**Files:**
- Create: `server/src/db/index.ts`

**Step 1: Create connection pool**

`server/src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
```

**Step 2: Commit**

```bash
git add server/src/db/index.ts
git commit -m "feat(server): add database connection pool"
```

---

### Task 5: Hono app entry with health check

**Files:**
- Create: `server/src/index.ts`

**Step 1: Create Hono app**

`server/src/index.ts`:
```typescript
import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})

export default app
```

**Step 2: Start PostgreSQL and test health check**

```bash
# Copy .env.example to .env and edit values
cp .env.example .env
# Start just postgres
docker compose up postgres -d
# Run server
cd server && npm run dev
# Test
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Step 3: Generate and run Drizzle migration**

```bash
cd server
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Step 4: Commit**

```bash
git add server/src/index.ts
git commit -m "feat(server): add Hono app with health check and CORS"
```

---

### Task 6: Server Dockerfile

**Files:**
- Create: `server/Dockerfile`

**Step 1: Create Dockerfile**

`server/Dockerfile`:
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist/ ./dist/

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

**Step 2: Commit**

```bash
git add server/Dockerfile
git commit -m "feat(server): add Dockerfile for production build"
```

---

## Phase 2: Auth

### Task 7: Auth domain functions

**Files:**
- Create: `server/src/domain/auth.ts`
- Create: `server/src/domain/__tests__/auth.test.ts`

**Step 1: Write failing tests for auth domain**

`server/src/domain/__tests__/auth.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyToken } from '../auth.js'

describe('auth domain', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('secret123')
    expect(hash).not.toBe('secret123')
    expect(await verifyPassword('secret123', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('signs and verifies access token', () => {
    const token = signAccessToken('user-123')
    const payload = verifyToken(token, 'access')
    expect(payload.sub).toBe('user-123')
    expect(payload.type).toBe('access')
  })

  it('signs and verifies refresh token', () => {
    const token = signRefreshToken('user-123')
    const payload = verifyToken(token, 'refresh')
    expect(payload.sub).toBe('user-123')
    expect(payload.type).toBe('refresh')
  })

  it('rejects wrong token type', () => {
    const token = signAccessToken('user-123')
    expect(() => verifyToken(token, 'refresh')).toThrow()
  })
})
```

**Step 2: Run tests — expect failure**

```bash
cd server && npx vitest run src/domain/__tests__/auth.test.ts
# Expected: FAIL — cannot find module '../auth.js'
```

**Step 3: Implement auth domain**

`server/src/domain/auth.ts`:
```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'

const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

interface TokenPayload {
  sub: string
  type: 'access' | 'refresh'
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY })
}

export function verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload {
  const secret = type === 'access' ? JWT_SECRET : JWT_REFRESH_SECRET
  const payload = jwt.verify(token, secret) as TokenPayload
  if (payload.type !== type) throw new Error(`Expected ${type} token, got ${payload.type}`)
  return payload
}
```

**Step 4: Run tests — expect pass**

```bash
cd server && npx vitest run src/domain/__tests__/auth.test.ts
# Expected: 4 tests PASS
```

**Step 5: Commit**

```bash
git add server/src/domain/auth.ts server/src/domain/__tests__/auth.test.ts
git commit -m "feat(server): add auth domain — hash, verify, JWT sign/verify"
```

---

### Task 8: JWT middleware

**Files:**
- Create: `server/src/middleware/auth.ts`

**Step 1: Create auth middleware**

`server/src/middleware/auth.ts`:
```typescript
import type { Context, Next } from 'hono'
import { verifyToken } from '../domain/auth.js'

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  const token = header.slice(7)
  try {
    const payload = verifyToken(token, 'access')
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
```

**Step 2: Commit**

```bash
git add server/src/middleware/auth.ts
git commit -m "feat(server): add JWT auth middleware"
```

---

### Task 9: Auth routes

**Files:**
- Create: `server/src/routes/auth.ts`
- Create: `server/src/routes/__tests__/auth.test.ts`

**Step 1: Write failing tests**

`server/src/routes/__tests__/auth.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../index.js'

// Note: These tests require a running PostgreSQL instance.
// Run with DATABASE_URL pointing to a test database.

describe('auth routes', () => {
  it('registers a new user', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.accessToken).toBeDefined()
    expect(body.refreshToken).toBeDefined()
    expect(body.user.email).toBeDefined()
  })

  it('rejects duplicate registration', async () => {
    const email = `dup-${Date.now()}@example.com`
    await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    expect(res.status).toBe(409)
  })

  it('logs in existing user', async () => {
    const email = `login-${Date.now()}@example.com`
    await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accessToken).toBeDefined()
  })

  it('rejects wrong password', async () => {
    const email = `wrong-${Date.now()}@example.com`
    await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrongpassword' }),
    })
    expect(res.status).toBe(401)
  })
})
```

**Step 2: Implement auth routes**

`server/src/routes/auth.ts`:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyToken } from '../domain/auth.js'

const auth = new Hono()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const passwordHash = await hashPassword(password)
  const [user] = await db.insert(users).values({ email, passwordHash }).returning()

  return c.json({
    user: { id: user.id, email: user.email },
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  }, 201)
})

auth.post('/login', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  return c.json({
    user: { id: user.id, email: user.email },
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  })
})

auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json<{ refreshToken: string }>()
  if (!refreshToken) {
    return c.json({ error: 'Missing refresh token' }, 400)
  }

  try {
    const payload = verifyToken(refreshToken, 'refresh')
    return c.json({
      accessToken: signAccessToken(payload.sub),
      refreshToken: signRefreshToken(payload.sub),
    })
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})

export default auth
```

**Step 3: Wire auth routes into app — update `server/src/index.ts`**

Add before `const port` line:
```typescript
import authRoutes from './routes/auth.js'
app.route('/auth', authRoutes)
```

**Step 4: Install @hono/zod-validator**

```bash
cd server && npm install @hono/zod-validator
```

**Step 5: Commit**

```bash
git add server/src/routes/auth.ts server/src/routes/__tests__/auth.test.ts server/src/index.ts
git commit -m "feat(server): add auth routes — register, login, refresh"
```

---

## Phase 3: CRUD Routes

### Task 10: Tasks CRUD routes

**Files:**
- Create: `server/src/routes/tasks.ts`

`server/src/routes/tasks.ts`:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

const route = new Hono()
route.use('*', authMiddleware)

const taskCreateSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(['simple', 'category']),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  category: z.string().optional().default(''),
  sortOrder: z.number().optional().default(0),
})

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  category: z.string().optional(),
  sortOrder: z.number().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
})

route.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status')
  const conditions = [eq(tasks.userId, userId)]
  if (status) conditions.push(eq(tasks.status, status))

  const result = await db.select().from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt))
  return c.json({ data: result })
})

route.post('/', zValidator('json', taskCreateSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const [task] = await db.insert(tasks).values({
    ...input,
    userId,
    updatedAt: new Date(),
  }).returning()
  return c.json({ data: task }, 201)
})

route.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1)
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: task })
})

route.patch('/:id', zValidator('json', taskUpdateSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const input = c.req.valid('json')
  const [task] = await db.update(tasks).set({ ...input, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: task })
})

route.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [task] = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning()
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: task })
})

export default route
```

Wire into `server/src/index.ts`:
```typescript
import taskRoutes from './routes/tasks.js'
app.route('/tasks', taskRoutes)
```

Commit: `feat(server): add tasks CRUD routes`

---

### Task 11: Remaining CRUD routes

Follow same pattern as Task 10 for these route files. Each uses `authMiddleware`, validates with Zod, filters by `userId`:

- `server/src/routes/mood.ts` — CRUD for `moodEntries`
- `server/src/routes/streaks.ts` — CRUD for `streakRecords` (composite PK: userId+date)
- `server/src/routes/rewards.ts` — CRUD for `rewards` + `POST /rewards/:id/redeem`
- `server/src/routes/points.ts` — GET ledger entries + GET balance (sum of amounts)
- `server/src/routes/summaries.ts` — CRUD for `dailySummaries` + `weeklySummaries`

Wire all into `server/src/index.ts`:
```typescript
import moodRoutes from './routes/mood.js'
import streakRoutes from './routes/streaks.js'
import rewardRoutes from './routes/rewards.js'
import pointRoutes from './routes/points.js'
import summaryRoutes from './routes/summaries.js'

app.route('/mood', moodRoutes)
app.route('/streaks', streakRoutes)
app.route('/rewards', rewardRoutes)
app.route('/points', pointRoutes)
app.route('/summaries', summaryRoutes)
```

Commit: `feat(server): add all CRUD routes — mood, streaks, rewards, points, summaries`

---

## Phase 4: Sync

### Task 12: Sync domain

**Files:**
- Create: `server/src/domain/sync.ts`

`server/src/domain/sync.ts`:
```typescript
import { eq, and, gt, lte, inArray, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'

type SyncableTable = keyof typeof schema

// Tables that support sync (all except users)
const SYNC_TABLES: SyncableTable[] = [
  'tasks', 'pointLedger', 'streakRecords', 'moodEntries',
  'rewards', 'redemptions', 'dailySummaries', 'weeklySummaries',
]

export interface SyncPayload {
  lastSyncTimestamp: string
  changes: Record<string, unknown[]>
}

export interface SyncResponse {
  serverTimestamp: string
  changes: Record<string, unknown[]>
}

export async function pushChanges(userId: string, changes: Record<string, unknown[]>): Promise<void> {
  for (const [tableName, records] of Object.entries(changes)) {
    if (!SYNC_TABLES.includes(tableName as SyncableTable) || records.length === 0) continue
    const table = schema[tableName as SyncableTable]

    for (const record of records) {
      const data = { ...(record as Record<string, unknown>), userId, updatedAt: new Date() }
      // Use upsert: insert on conflict, update existing
      await db.insert(table).values(data)
        .onConflictDoUpdate({
          target: getConflictTarget(tableName),
          set: { ...Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'id' && k !== 'userId')), updatedAt: new Date() },
        })
    }
  }
}

export async function pullChanges(userId: string, since: string): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {}

  for (const tableName of SYNC_TABLES) {
    const table = schema[tableName]
    const rows = await db.select().from(table)
      .where(and(
        eq(getUserIdColumn(table), userId),
        gt(getUpdatedAtColumn(table), new Date(since)),
      ))
    result[tableName] = rows
  }

  return result
}

function getConflictTarget(tableName: string) {
  if (tableName === 'streakRecords' || tableName === 'dailySummaries' || tableName === 'weeklySummaries') {
    // Composite PK tables — conflict on userId + date/weekStart
    // Drizzle handles this via the primaryKey definition
    return undefined as any // Drizzle will use the PK
  }
  return undefined as any // Default PK (id)
}

function getUserIdColumn(table: any) {
  return table.userId
}

function getUpdatedAtColumn(table: any) {
  return table.updatedAt
}
```

Commit: `feat(server): add sync domain — push/pull with LWW`

---

### Task 13: Sync routes

**Files:**
- Create: `server/src/routes/sync.ts`

`server/src/routes/sync.ts`:
```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { pushChanges, pullChanges } from '../domain/sync.js'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'

const route = new Hono()
route.use('*', authMiddleware)

route.post('/', async (c) => {
  const userId = c.get('userId')
  const { lastSyncTimestamp, changes } = await c.req.json<{
    lastSyncTimestamp: string
    changes: Record<string, unknown[]>
  }>()

  // Push client changes to server
  await pushChanges(userId, changes)

  // Pull server changes since last sync
  const serverChanges = await pullChanges(userId, lastSyncTimestamp)

  return c.json({
    serverTimestamp: new Date().toISOString(),
    changes: serverChanges,
  })
})

route.post('/initial', async (c) => {
  const userId = c.get('userId')
  const { changes } = await c.req.json<{ changes: Record<string, unknown[]> }>()

  // Push all local data
  await pushChanges(userId, changes)

  // Return all server data for this user
  const serverChanges = await pullChanges(userId, '1970-01-01T00:00:00Z')

  return c.json({
    serverTimestamp: new Date().toISOString(),
    changes: serverChanges,
  })
})

export default route
```

Wire into `server/src/index.ts`:
```typescript
import syncRoutes from './routes/sync.js'
app.route('/sync', syncRoutes)
```

Commit: `feat(server): add sync routes — push/pull and initial migration`

---

## Phase 5: Frontend Auth

### Task 14: API client

**Files:**
- Create: `src/lib/api.ts`

`src/lib/api.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface FetchOptions extends RequestInit {
  token?: string
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const data = await res.json()

  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`)
  return data as T
}

export const api = {
  get: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token: string) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  del: <T>(path: string, token: string) =>
    apiFetch<T>(path, { method: 'DELETE', token }),
}
```

Commit: `feat(frontend): add API client wrapper`

---

### Task 15: Auth store

**Files:**
- Create: `src/stores/authStore.ts`

`src/stores/authStore.ts`:
```typescript
import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setUser: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

const STORED_TOKENS_KEY = 'dnn_auth_tokens'

function loadStoredTokens(): { accessToken: string; refreshToken: string } | null {
  try {
    const stored = localStorage.getItem(STORED_TOKENS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(STORED_TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }))
}

function clearStoredTokens() {
  localStorage.removeItem(STORED_TOKENS_KEY)
}

export const useAuthStore = create<AuthState>((set) => {
  const stored = loadStoredTokens()
  return {
    user: null,
    accessToken: stored?.accessToken ?? null,
    refreshToken: stored?.refreshToken ?? null,
    isAuthenticated: false,
    setUser: (user, accessToken, refreshToken) => {
      storeTokens(accessToken, refreshToken)
      set({ user, accessToken, refreshToken, isAuthenticated: true })
    },
    setTokens: (accessToken, refreshToken) => {
      storeTokens(accessToken, refreshToken)
      set({ accessToken, refreshToken })
    },
    logout: () => {
      clearStoredTokens()
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
    },
  }
})
```

Commit: `feat(frontend): add auth store with token persistence`

---

### Task 16: Login page

**Files:**
- Create: `src/components/auth/LoginPage.tsx`

`src/components/auth/LoginPage.tsx`:
```typescript
import { useState } from 'react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const data = await api.post<{
        user: { id: string; email: string }
        accessToken: string
        refreshToken: string
      }>(endpoint, { email, password })
      setUser(data.user, data.accessToken, data.refreshToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-sm p-8 bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--color-text-primary)]">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-[var(--color-text-secondary)]">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="text-[var(--color-accent)] hover:underline"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

Commit: `feat(frontend): add LoginPage component`

---

### Task 17: AuthGuard component

**Files:**
- Create: `src/components/auth/AuthGuard.tsx`

`src/components/auth/AuthGuard.tsx`:
```typescript
import { useState, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { api } from '../../lib/api'
import { LoginPage } from './LoginPage'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore()
  const [checking, setChecking] = useState(!!accessToken)

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      setChecking(false)
      return
    }

    // Validate token by trying to refresh
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken)
      })
      .catch(() => {
        logout()
      })
      .finally(() => setChecking(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!accessToken) {
    return <LoginPage />
  }

  return <>{children}</>
}
```

Commit: `feat(frontend): add AuthGuard with token validation`

---

### Task 18: Wire auth into App.tsx

**Files:**
- Modify: `src/App.tsx`

Wrap the existing app content with `AuthGuard`:

```typescript
import { AuthGuard } from './components/auth/AuthGuard'

// Inside App component return:
// <AuthGuard>
//   ...existing app content...
// </AuthGuard>
```

Commit: `feat(frontend): wire AuthGuard into App.tsx`

---

## Phase 6: Frontend Sync

### Task 19: Add sync queue and lastSyncTimestamp to Dexie

**Files:**
- Modify: `src/db/index.ts`

Add to the Dexie class:
```typescript
syncQueue!: EntityTable<SyncQueueEntry, 'id'>
lastSyncState!: EntityTable<{ key: string; value: string }, 'key'>
```

Add version(6) to schema:
```typescript
this.version(6).stores({
  syncQueue: 'id, tableName, updatedAt',
  lastSyncState: 'key',
})
```

New types in `src/domain/types.ts`:
```typescript
export interface SyncQueueEntry {
  id: string
  tableName: string
  operation: 'insert' | 'update' | 'delete'
  data: unknown
  updatedAt: string
}
```

Commit: `feat(frontend): add sync queue and lastSyncState to Dexie schema`

---

### Task 20: useSync hook

**Files:**
- Create: `src/hooks/useSync.ts`

`src/hooks/useSync.ts`:
```typescript
import { useEffect, useRef } from 'react'
import { db } from '../db'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

const SYNC_INTERVAL = 30_000 // 30 seconds

export function useSync() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!accessToken) return

    async function sync() {
      try {
        // Get last sync timestamp
        const lastSyncEntry = await db.lastSyncState.get('lastSyncTimestamp')
        const lastSyncTimestamp = lastSyncEntry?.value || '1970-01-01T00:00:00Z'

        // Flush sync queue
        const queue = await db.syncQueue.toArray()
        if (queue.length === 0 && lastSyncTimestamp !== '1970-01-01T00:00:00Z') {
          // No local changes, just pull
          const result = await api.post<{ serverTimestamp: string; changes: Record<string, unknown[]> }>(
            '/sync',
            { lastSyncTimestamp, changes: {} },
            accessToken,
          )
          await mergeServerChanges(result.changes)
          await db.lastSyncState.put({ key: 'lastSyncTimestamp', value: result.serverTimestamp })
          return
        }

        // Build changes from queue
        const changes: Record<string, unknown[]> = {}
        for (const entry of queue) {
          if (!changes[entry.tableName]) changes[entry.tableName] = []
          changes[entry.tableName].push(entry.data)
        }

        const result = await api.post<{ serverTimestamp: string; changes: Record<string, unknown[]> }>(
          '/sync',
          { lastSyncTimestamp, changes },
          accessToken,
        )

        // Clear synced queue entries
        const queueIds = queue.map((e) => e.id)
        await db.syncQueue.bulkDelete(queueIds)

        // Merge server changes
        await mergeServerChanges(result.changes)
        await db.lastSyncState.put({ key: 'lastSyncTimestamp', value: result.serverTimestamp })
      } catch {
        // Silent fail — will retry next interval
      }
    }

    sync()
    intervalRef.current = setInterval(sync, SYNC_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [accessToken])
}

async function mergeServerChanges(changes: Record<string, unknown[]>) {
  const tableMap: Record<string, string> = {
    tasks: 'tasks',
    pointLedger: 'pointLedger',
    streakRecords: 'streakRecords',
    moodEntries: 'moodEntries',
    rewards: 'rewards',
    redemptions: 'redemptions',
    dailySummaries: 'dailySummaries',
    weeklySummaries: 'weeklySummaries',
  }

  for (const [tableName, records] of Object.entries(changes)) {
    const dexieTable = tableMap[tableName]
    if (!dexieTable || records.length === 0) continue

    // @ts-expect-error dynamic table access
    await (db[dexieTable] as any).bulkPut(records)
  }
}
```

Commit: `feat(frontend): add useSync hook with offline queue and merge`

---

### Task 21: Wire useSync into App

**Files:**
- Modify: `src/App.tsx`

Add `useSync()` inside the app component, after `AuthGuard`:
```typescript
import { useSync } from './hooks/useSync'

// Inside AuthGuard children:
function AuthenticatedApp() {
  useSync()
  return (
    // ...existing app content...
  )
}
```

Commit: `feat(frontend): wire useSync into authenticated app`

---

## Phase 7: Testing

### Task 22: Server integration tests

**Files:**
- Create: `server/src/routes/__tests__/tasks.test.ts`
- Create: `server/vitest.config.ts`

Create `server/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

Write integration tests for tasks CRUD (requires running PostgreSQL):
- Register a test user, get token
- POST /tasks — create
- GET /tasks — list
- GET /tasks/:id — get one
- PATCH /tasks/:id — update
- DELETE /tasks/:id — delete
- Verify 401 without token
- Verify 404 for another user's task

Commit: `test(server): add tasks CRUD integration tests`

---

### Task 23: Sync integration tests

**Files:**
- Create: `server/src/routes/__tests__/sync.test.ts`

Test:
- Register user, push initial data, pull it back
- Push changes, pull only new changes since timestamp
- Two users cannot see each other's data

Commit: `test(server): add sync integration tests`

---

### Task 24: Frontend auth tests

**Files:**
- Create: `src/components/auth/__tests__/LoginPage.test.tsx`

Test LoginPage rendering, form submission, error display.

Commit: `test(frontend): add LoginPage tests`

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-6 | Server scaffold, Docker, Drizzle schema, DB connection, Hono entry |
| 2 | 7-9 | Auth domain, JWT middleware, auth routes |
| 3 | 10-11 | CRUD routes for all 8 tables |
| 4 | 12-13 | Sync domain + routes (push/pull, initial migration) |
| 5 | 14-18 | Frontend auth (API client, store, LoginPage, AuthGuard, wire up) |
| 6 | 19-21 | Frontend sync (sync queue, useSync hook, wire up) |
| 7 | 22-24 | Integration tests |

# Backend & Data Persistence Design

> Date: 2026-05-06
> Status: Approved
> Scope: Add backend, auth, sync, and persistent storage to DoNotNervous

## Context

DoNotNervous is a pure-frontend anti-anxiety gamified task/mood tracking app using React + Vite + Dexie (IndexedDB). All data lives in the browser. This design adds a self-hosted backend for cross-device sync, multi-user auth, and reliable data persistence.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Hono (TypeScript) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Email/password + JWT (access 15min + refresh 7d) |
| Deployment | Docker Compose |

## Architecture

```
DoNotNervous/
├── src/                          # existing React frontend
├── server/                       # NEW — Hono backend
│   ├── src/
│   │   ├── index.ts              # Hono app entry, CORS, routes
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT verification
│   │   ├── routes/
│   │   │   ├── auth.ts           # POST /register, /login, /refresh
│   │   │   ├── tasks.ts          # CRUD + list
│   │   │   ├── mood.ts           # CRUD
│   │   │   ├── streaks.ts        # CRUD
│   │   │   ├── rewards.ts        # CRUD + redeem
│   │   │   ├── points.ts         # ledger + balance
│   │   │   └── sync.ts           # POST /sync (bulk push/pull)
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   ├── migrate.ts        # Migration runner
│   │   │   └── index.ts          # Connection pool
│   │   └── domain/
│   │       ├── auth.ts           # hash, verify, JWT sign
│   │       └── sync.ts           # Diff-based sync logic
│   ├── drizzle.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── package.json                  # workspace root
```

## Auth

### Endpoints

- `POST /auth/register` — email + password -> bcrypt hash -> JWT tokens
- `POST /auth/login` — verify credentials -> JWT tokens
- `POST /auth/refresh` — rotate refresh token

### Token Storage

- Access token: 15min expiry, stored in memory
- Refresh token: 7d expiry, stored in localStorage
- Auto-refresh before expiry

### Data Model

New `users` table:

```
users: id(uuid PK), email(unique), passwordHash, createdAt, updatedAt
```

## Database Schema

All 8 existing Dexie tables mirrored to PostgreSQL with `userId` FK. Every record gets `updatedAt` for sync.

```
users:          id(uuid PK), email(unique), passwordHash, createdAt, updatedAt
tasks:          id(uuid PK), userId(FK), parentId, type, title, description, status, difficulty, category, sortOrder, createdAt, completedAt, archivedAt, updatedAt
pointLedger:    id(uuid PK), userId(FK), amount, type, reason, taskId, streakLength, multiplier, createdAt, updatedAt
streakRecords:  userId(FK) + date composite PK, completedTaskIds(jsonb), freezeUsed, freezeCountRemaining, recoveredFrom, recoveryTaskId, createdAt, updatedAt
moodEntries:    id(uuid PK), userId(FK), emoji, label, journal, taskId, createdAt, updatedAt
rewards:        id(uuid PK), userId(FK), name, description, pointCost, active, createdAt, updatedAt
redemptions:    id(uuid PK), userId(FK), rewardId, rewardName, pointsSpent, createdAt, updatedAt
dailySummaries: userId(FK) + date composite PK, tasksCompleted, tasksCreated, pointsEarned, pointsSpent, dominantMood, dominantMoodScore, taskIds(jsonb), moodEntryIds(jsonb), ledgerEntryIds(jsonb), redemptionIds(jsonb), computedAt, updatedAt
weeklySummaries: userId(FK) + weekStart composite PK, weekEnd, totalTasksCompleted, totalTasksCreated, totalPointsEarned, totalPointsSpent, avgMoodScore, streakDays, completionRate, bestDayDate, bestDayScore, bestDayTaskCount, userBestDayOverride, dailyBreakdown(jsonb), computedAt, updatedAt
```

## Sync Strategy

### Timestamp-based Last-Write-Wins

Each record has `updatedAt`. Sync flow:

1. Client sends `POST /sync` with `lastSyncTimestamp` and all local changes since then
2. Server applies changes — conflicts resolved by latest `updatedAt`
3. Server returns all changes since client's `lastSyncTimestamp`
4. Client merges into Dexie, updates `lastSyncTimestamp`

### Offline Queue

- Local writes go to Dexie immediately (existing behavior unchanged)
- `syncQueue` table in Dexie tracks pending changes
- When connectivity returns, flush queue via `POST /sync`
- `useSync` hook observes Dexie changes via `liveQuery` and pushes to server

### Initial Data Migration

- `POST /sync/initial` — pushes ALL local Dexie data to server for first-time login
- Handles existing users who already have local data

## Frontend Changes

Minimal disruption to existing code. New layer sits between Dexie and server:

```
src/
├── lib/
│   └── api.ts              # Hono client wrapper
├── hooks/
│   ├── useAuth.ts          # NEW — login/register/logout
│   └── useSync.ts          # NEW — background sync
├── stores/
│   └── authStore.ts        # NEW — user state, token persistence
└── components/
    └── auth/
        ├── LoginPage.tsx   # NEW — email/password form
        └── AuthGuard.tsx   # NEW — wraps app, redirects if not authed
```

### App Flow

1. App loads -> `AuthGuard` checks stored tokens
2. No tokens -> show `LoginPage`
3. Authed -> existing app renders, `useSync` runs in background
4. Existing hooks (`useTaskActions`, `useStreaks`, etc.) still write to Dexie first
5. `useSync` observes Dexie changes and pushes to server

## Docker Deployment

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

  server:
    build: ./server
    environment:
      DATABASE_URL: postgresql://app:${DB_PASSWORD}@postgres:5432/donotnervous
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: http://localhost:5173
    ports:
      - "3001:3001"
    depends_on:
      - postgres

volumes:
  pgdata:
```

## Environment Variables

```
DB_PASSWORD=
JWT_SECRET=
JWT_REFRESH_SECRET=
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://app:...@postgres:5432/donotnervous
```

## Implementation Phases

1. **Server scaffold** — Hono project, Docker Compose, Drizzle setup, schema, migrations
2. **Auth** — register/login/refresh endpoints, JWT middleware, bcrypt
3. **CRUD routes** — tasks, mood, streaks, rewards, points, redemptions, summaries
4. **Sync** — bulk push/pull endpoint, initial migration endpoint
5. **Frontend auth** — LoginPage, AuthGuard, authStore, token management
6. **Frontend sync** — api client, useSync hook, offline queue, liveQuery integration
7. **Testing** — server unit tests, integration tests, sync tests

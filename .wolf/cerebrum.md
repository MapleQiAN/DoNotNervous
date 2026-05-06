# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-05

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** donotnervous
- **Description:** Healing/lifestyle anti-anxiety task tracker with gamification (points, streaks, rewards) and mood tracking.
- **UI aesthetic:** Warm cream/green/orange palette, large border-radius, soft shadows, low saturation. NOT corporate/admin — more lifestyle/journal feel. CSS uses oklch colors via `@theme` tokens.
- **Homepage layout:** Dashboard grid with `2.4fr 1fr` columns. Left: hero card + task list + reward banner. Right: stacked stat cards + quick-add form. Task rows use mood tags (tone-focus/tone-hope/tone-energy/tone-calm/tone-relax) and status pills (done/progress/default).
- **npm vs node_modules:** TypeScript must be run via `./node_modules/.bin/tsc` — `npx tsc` resolves to wrong `tsc` package. Always use `--project tsconfig.app.json`.
- **Hono route typing:** Every route file that uses `c.get('userId')` from authMiddleware must declare `type Variables = { userId: string }` and instantiate `new Hono<{ Variables: Variables }>()`. Without this, `c.get('userId')` returns `unknown` and breaks Drizzle ORM's `eq()` calls.
- **Hono route typing:** Every route file that uses `c.get('userId')` from authMiddleware must declare `type Variables = { userId: string }` and instantiate `new Hono<{ Variables: Variables }>()`. Without this, `c.get('userId')` returns `unknown` and breaks Drizzle ORM's `eq()` calls.
- **Hono route values typing:** When passing validated Zod input to Drizzle `.values()`, destructure datetime fields and convert them with `new Date()` in a spread object. Do not use `Record<string, unknown>` — Drizzle's typed insert/update expects specific field types.
- **Drizzle generic upsert:** Drizzle's `.values()` has strict per-table typing. For generic sync layers that handle dynamic `Record<string, unknown>` data across multiple tables, cast to `any` on `.values()` and `.set()` calls. There is no way to satisfy Drizzle's inferred types with a generic record.
- **Sync timestamp use in tests:** When testing sync endpoints, always use the `serverTimestamp` from a previous sync response as `lastSyncTimestamp` — never `new Date().toISOString()` from the client. Client clocks and network latency can cause false positives with the `gt` filter.
- **Testing Library label association:** `getByLabelText` requires the label to be associated with the input (via `htmlFor`/`id` or wrapping). Sibling labels without association won't work. Use `getByRole('textbox')` or `querySelector` for inputs that lack proper label association.
- **LoginPage form structure:** The email and password inputs use sibling labels (no htmlFor/id binding). Email is the only `textbox` role on the page; password can be found via `querySelector('input[type="password"]')`.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

- [2026-05-06] Do not use client-side `new Date().toISOString()` as sync `lastSyncTimestamp` in tests. The server's `updatedAt` may be slightly later due to processing time, causing the `gt` filter to still match records. Always capture and reuse `serverTimestamp` from the sync response.
- [2026-05-06] Do not use `getByLabelText` on LoginPage inputs. The labels are siblings, not wrapping or associated via htmlFor. Use `getByRole('textbox')` for email and `querySelector('input[type="password"]')` for password.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

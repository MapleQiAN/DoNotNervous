# Technology Stack

**Project:** DoNotNervous
**Researched:** 2026-04-28
**Mode:** Ecosystem (Local-first cute/playful web app)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | 19.2.5 | UI framework | Largest ecosystem for animation/animation libraries (Motion, Lottie, Rive). React Compiler (auto-memoization) reduces boilerplate. Concurrent rendering handles complex UI updates smoothly. Wider community means more cute/playful UI component options. | HIGH |
| TypeScript | 5.x | Type safety | Industry standard. Prevents data corruption in IndexedDB operations, enforces task/mood/reward data shapes, and catches animation state bugs at compile time. | HIGH |
| Vite | 8.0.10 | Build tool + dev server | Fastest HMR in the ecosystem (sub-millisecond). Native ESM. SPA mode is a perfect fit for a client-only app. Replaced CRA entirely. | HIGH |
| React Router | 7.14.2 | Client-side routing | Standard SPA router. v7 is a non-breaking upgrade from v6. Framework mode offers data loading patterns. Declarative routing matches React mental model. | HIGH |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | 5.0.12 | Global state (points, streaks, settings) | Minimal boilerplate (~1KB). No providers needed. Persist middleware supports async storage (IndexedDB). v5 is stable. Perfect for this app's complexity level -- Redux is overkill, Context alone is insufficient for cross-cutting state. | HIGH |
| Zustand persist middleware | (bundled) | State hydration to IndexedDB | Built into Zustand. Works with custom async storage adapters. Hydrates points, streaks, and settings from IndexedDB on load. | HIGH |
| React Query (TanStack Query) | NOT RECOMMENDED | -- | Overkill for a purely local app with no server. Adds unnecessary complexity. Use Zustand + Dexie directly. | HIGH |

### Database (Local-First)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Dexie.js | 4.4.2 | IndexedDB wrapper | The standard IndexedDB wrapper. Promise-based, clean query API. v4 supports IndexedDB 3.0 optimizations (faster `getAll`). Used by WhatsApp Web. Schema versioning handles DB migrations cleanly as features evolve. | HIGH |
| localStorage | Browser API | Small config/preferences only | For tiny key-value data (theme preference, last-opened view). NOT for task/mood/reward data -- 5MB limit and synchronous API blocks the main thread. | HIGH |

**Data storage decision:** Use Dexie (IndexedDB) as the primary data store for tasks, mood entries, rewards, points history, and streaks. Use localStorage only for ephemeral UI preferences (theme, last view).

**Why Dexie over alternatives:**
- **Not raw IndexedDB:** Callback hell, verbose API, browser inconsistencies.
- **Not PouchDB:** Designed for sync, adds complexity we don't need.
- **Not localStorage:** 5MB limit, synchronous, no structured queries.
- **Not OPFS (Origin Private File System):** Too low-level, not queryable, overkill for this use case.

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2.4 | Utility-first CSS | v4 has Rust-based engine (100x faster incremental builds). CSS-first config (no `tailwind.config.js`). Auto content detection. OKLCH colors for vibrant, cute palettes. Container queries for responsive components. | HIGH |
| clsx | 2.1.1 | Conditional class joining | Tiny utility for composing Tailwind classes conditionally. Standard in React+Tailwind projects. | HIGH |
| tailwind-merge | 3.5.0 | Merge Tailwind classes without conflicts | Prevents class conflicts when composing components. Essential for a design system with many variants. | HIGH |

**Why Tailwind over alternatives:**
- **Not CSS Modules:** More boilerplate, no design system enforcement.
- **Not styled-components:** Runtime overhead, poor SSR (not relevant here but still), larger bundle.
- **Not Vanilla Extract:** Too verbose for a playful app where rapid iteration matters.
- **Not MUI/Chakra:** Opinionated designs don't match the "cute/playful" aesthetic we need. Better to build custom with Tailwind.

### Animation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Motion (formerly Framer Motion) | 12.38.0 | Page transitions, micro-interactions, UI animations | The standard React animation library. Declarative API with `<motion.div>`. Layout animations (task reordering, list additions). Gesture support (drag, hover). AnimatePresence for mount/unmount. Perfect for celebration effects when completing tasks. | HIGH |
| canvas-confetti | 1.9.4 | Task completion celebration effect | Lightweight (3KB), performant canvas-based confetti. Framework-agnostic. Trigger on task completion for dopamine hit. More reliable than React-specific confetti libraries. | MEDIUM |
| Lottie-web | (latest) | Pre-designed mascot animations | For complex, designer-created mascot animations (waving, cheering, sleeping). Lottie JSON files are vector-based and tiny. Used when Motion can't express the animation (detailed character animations). | MEDIUM |
| Rive | 2.37.4 | Interactive mascot with state machine | IF the mascot needs to be interactive (react to user actions, change expression based on mood). Rive state machines allow programmatic control of animation states. Heavier dependency, only add if interactive mascot is a priority. Consider this for v2. | LOW |

**Animation strategy:** Use Motion for 90% of animations (page transitions, task animations, celebrations). Use canvas-confetti specifically for task completion bursts. Use Lottie for pre-rendered mascot animation loops. Only add Rive if the mascot needs to be truly interactive.

### Charts and Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 3.8.1 | Mood trend charts, weekly summaries | React-native charting. Declarative JSX components. Perfect for line/area charts showing mood trends over time. Responsive container. Simple API for a small dataset. | MEDIUM |

**Why Recharts over alternatives:**
- **Not Chart.js (react-chartjs-2):** Not React-native, imperative config, canvas rendering (can't style with CSS), heavier.
- **Not D3:** Massive API, too low-level for simple mood tracking charts.
- **Not Nivo:** More opinionated, larger bundle.

### Drag and Drop

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @dnd-kit/core | 6.3.1 | Task reordering, kanban-style boards | Modern, performant (60fps with 1000+ items). Hooks-based API. Active development (`@dnd-kit/react` is the new API). Perfect for reordering tasks and moving between project columns. | MEDIUM |

**Why dnd-kit over alternatives:**
- **Not react-beautiful-dnd:** Abandoned by Atlassian.
- **Not react-dnd:** Older API, worse performance with large lists.

### Date/Time

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | 4.1.0 | Date formatting, streak calculation | Tree-shakeable (only import what you use). Functional API fits immutability pattern. Streak logic, daily/weekly summary date ranges, relative time display. | HIGH |

**Why date-fns over alternatives:**
- **Not moment.js:** Deprecated, mutable, huge bundle.
- **Not dayjs:** Smaller but mutable API. date-fns v4 is tree-shakeable and immutable.

### Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | 4.3.6 | Input validation, data shape | Validate task creation forms, reward config, mood entries. Runtime type checking at system boundaries (IndexedDB reads, user input). | HIGH |

### ID Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| nanoid | 5.1.9 | Unique IDs for tasks, moods, rewards | Tiny (130 bytes), URL-safe, collision-resistant. Perfect for IndexedDB primary keys. | HIGH |

### PWA / Offline

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| vite-plugin-pwa | 1.2.0 | Service worker generation, offline caching | Zero-config Workbox integration. Generates service worker automatically. Supports prompt-for-update UX. Makes the app installable on mobile. | MEDIUM |

**Offline strategy:** Use `GenerateSW` mode with Workbox to precache all app shell assets. Cache Dexie/IndexedDB data is inherently offline (it's already local). The service worker only needs to cache the app's static assets.

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | 4.1.5 | Test runner | Vite-native, fast watch mode, Jest-compatible API. | HIGH |
| @testing-library/react | 16.3.2 | Component testing | Standard React testing. Tests user behavior, not implementation. | HIGH |
| @testing-library/user-event | latest | Simulate user interactions | Realistic event simulation for forms, buttons, drag. | HIGH |
| @testing-library/jest-dom | latest | DOM matchers (`toBeInTheDocument`, etc.) | Extends Vitest with DOM assertions. | HIGH |
| happy-dom | latest | Browser environment for tests | Faster than jsdom, better for component tests. | MEDIUM |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | React 19 | Svelte 5 | Smaller animation ecosystem. No Motion equivalent. Lottie/Rive support is weaker. Fewer "cute UI" component options in community. Svelte 5 runes are new and less battle-tested for complex state patterns like streak calculation. |
| Framework | React 19 | Vue 3 | Similar ecosystem size but weaker animation library support. Pinia is fine but fewer middleware options. Smaller community for playful/cute component patterns. |
| State | Zustand | Redux Toolkit | Overkill for a personal tool. More boilerplate. Redux's strict patterns add complexity without benefit for a single-user offline app. |
| State | Zustand | Jotai | Atomic model is elegant but harder to model cross-cutting concerns like streak calculation + points + mood correlation. Zustand's store model is more natural. |
| State | Zustand | MobX | Observable pattern is mutable, contradicts immutability principle. |
| Database | Dexie | localStorage | 5MB limit, synchronous, no indexes, no queries. |
| Database | Dexie | PouchDB | Designed for sync, adds 50KB+ overhead. Unnecessary for local-only app. |
| CSS | Tailwind v4 | CSS Modules | No design system enforcement, more files to manage. |
| CSS | Tailwind v4 | styled-components | Runtime overhead (~15KB), template literal syntax is noisy. |
| Animation | Motion | GSAP | Commercial license needed for some uses. Imperative API doesn't match React's declarative model. Heavier bundle. |
| Animation | Motion | React Spring | Physics-based animations are harder to control precisely. Smaller community, less documentation. Stale maintenance concerns. |
| Charts | Recharts | Chart.js | Not React-native. Canvas rendering prevents CSS styling. Imperative config. |
| Charts | Recharts | D3 | Massive API surface. Too low-level for simple mood/points charts. Steep learning curve. |
| Build | Vite 8 | Webpack | Slower builds, more config. Vite has replaced Webpack for new SPA projects. |

## Not Recommended (Anti-Dependencies)

| Technology | Why Avoid |
|------------|-----------|
| Next.js | Server-side rendering framework for a purely client-side app. Adds complexity, build overhead, and server concepts we don't need. |
| Firebase/Supabase | Cloud backends violate the "local-first, no registration" requirement. |
| Prisma | ORM for server databases. Doesn't apply to IndexedDB. |
| Electron/Tauri | Desktop frameworks. The app is a web app for browsers. |
| Three.js | 3D rendering library. Massive overkill for 2D mascot animations. |
| Service Worker (manual) | vite-plugin-pwa generates service workers via Workbox. Writing one manually is error-prone and unnecessary. |
| workbox (direct) | Use through vite-plugin-pwa. Direct usage requires more configuration with no benefit. |

## Installation

```bash
# Create project
npm create vite@latest DoNotNervous -- --template react-ts

# Core dependencies
npm install react@19 react-dom@19 react-router@7 zustand@5 dexie@4

# Styling
npm install tailwindcss@4 clsx tailwind-merge

# Animation
npm install framer-motion@12 canvas-confetti

# Charts
npm install recharts

# Date/Time
npm install date-fns

# Validation
npm install zod

# ID generation
npm install nanoid

# Drag and drop (add when building task reordering)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# PWA (add before launch)
npm install -D vite-plugin-pwa workbox-window

# Dev dependencies
npm install -D @types/react @types/react-dom @types/canvas-confetti
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom
npm install -D @vitejs/plugin-react
npm install -D typescript
```

## Architecture Summary

```
React 19 + TypeScript
  |
  +-- Zustand (state: points, streaks, settings)
  |     +-- persist middleware --> Dexie (IndexedDB)
  |
  +-- Dexie.js (persistent data: tasks, moods, rewards)
  |     +-- Schema versioning
  |     +-- IndexedDB 3.0 optimizations
  |
  +-- React Router 7 (SPA routing)
  +-- Tailwind CSS 4 (styling)
  +-- Motion 12 (animations)
  +-- canvas-confetti (celebrations)
  +-- Recharts (mood/summary charts)
  +-- vite-plugin-pwa (offline/installable)
  +-- Vite 8 (build)
```

## Key Version Notes

- **React 19.2:** React Compiler is stable, auto-memoizes components. No need for manual `useMemo`/`useCallback` in most cases.
- **Zustand 5.0.12:** Breaking changes from v4 include removal of `create` curried overload. Migration guide available at zustand.docs.pmnd.rs.
- **Dexie 4.4.2:** v4 is a significant upgrade from v3 with IndexedDB 3.0 optimizations and improved `getAll()` performance.
- **Tailwind CSS 4.2.4:** v4 is CSS-first configuration. No `tailwind.config.js` needed. Configuration lives in `@import "tailwindcss"` in CSS.
- **Vite 8.0.10:** Major version bump with end-to-end toolchain integration. SPA mode is well-supported.
- **Motion 12.38.0:** Formerly Framer Motion. Install as `framer-motion` on npm (the package name hasn't changed despite the rebrand).

## Sources

- [React Official Blog - React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Motion.dev - Official Site](https://motion.dev/) (version 12.37.0+)
- [framer-motion on npm](https://www.npmjs.com/package/framer-motion) (version 12.38.0)
- [Dexie.js Official Site](https://dexie.org/)
- [Dexie.js GitHub](https://github.com/dexie/Dexie.js)
- [Vite Official - Vite 8 Announcement](https://vite.dev/blog/announcing-vite8)
- [Tailwind CSS v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [Zustand on npm](https://www.npmjs.com/package/zustand) (version 5.0.12)
- [React Router Official](https://reactrouter.com/)
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa)
- [dnd-kit Official](https://dndkit.com/)
- [Recharts on npm](https://www.npmjs.com/package/recharts) (version 3.8.1)
- npm registry version checks performed 2026-04-28

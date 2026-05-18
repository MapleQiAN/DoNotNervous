# Cerebrum

## User Preferences
- App language is Chinese — all UI text must be in Chinese, never English
- User prefers terse caveman-style responses during implementation
- User expects comprehensive fixes, not partial — "implement all issues" means all

## Key Learnings
- authStore user only has `id` and `email` — no name field. Derive display name from email prefix
- Frontend hooks have dual exports: React Query hook versions AND imperative async functions (for non-hook contexts)
- SettingsDrawer export/import are wired to backend `/sync` and `/sync/initial`; do not regress them back to placeholder toasts
- MoodPicker is triggered via `useUIStore.setMoodPickerTaskId()` — task completion should trigger it
- Rewards persist `icon` through `server/src/db/schema.ts` and `server/drizzle/0001_reward_icon.sql`; update backend schema/migrations together when adding reward fields
- date-fns locale `zhCN` available for Chinese relative time formatting
- API hooks hydrate server ISO timestamp strings into `Date` objects before components consume them
- `src/index.css` must define alias variables like `--color-accent`, `--color-bg-primary`, and `--color-bg-secondary`; several components depend on them
- Native iOS work lives under `ios/`; Windows workspace can scaffold SwiftUI files but cannot run Swift/Xcode validation
- iOS light-raising backend data uses `/companion` plus companionProfiles, cosmeticUnlocks, reminderPreferences, and syncStates in `/sync`

## Do-Not-Repeat
- (2026-05-12) Never leave buttons without onClick handlers — dead buttons = broken UX. Every interactive element needs behavior or should be removed
- (2026-05-12) Never hardcode user names or time-of-day greetings — derive from authStore and Date
- (2026-05-12) Never leave textarea/input uncontrolled when state is needed — always wire value + onChange
- (2026-05-12) handleEdit that only populates form without saving is not an edit — must call update API
- (2026-05-12) Do not let `/rewards/:id` shadow static reward routes — place `/rewards/redemptions` before dynamic `/:id`
- (2026-05-12) Root `npm test` and `npm run lint` must ignore generated browser captures and server dist output

## Decision Log
- (2026-05-12) Removed grid view toggle from TaskList since only list view exists — dead toggle is misleading
- (2026-05-12) Removed "今日小贴士" button from sidebar since tips feature doesn't exist
- (2026-05-12) Export/import buttons show "coming soon" toast instead of silently failing
- (2026-05-12) Notification bell wired to open settings drawer as interim behavior
- (2026-05-12) Replaced settings placeholder backup/restore with real JSON sync export/import using existing backend sync routes
- (2026-05-12) Reward cards now expose a first-class redeem button plus confirmation; edit/delete remain secondary actions
- (2026-05-13) iOS v1 uses native SwiftUI + SwiftData with local-first optional sync, not WebView/Capacitor
- (2026-05-13) Companion identity is a new rounded original character named "圆圆" in scaffold and design docs

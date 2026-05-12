# Cerebrum

## User Preferences
- App language is Chinese — all UI text must be in Chinese, never English
- User prefers terse caveman-style responses during implementation
- User expects comprehensive fixes, not partial — "implement all issues" means all

## Key Learnings
- authStore user only has `id` and `email` — no name field. Derive display name from email prefix
- Frontend hooks have dual exports: React Query hook versions AND imperative async functions (for non-hook contexts)
- SettingsDrawer export/import are backend TBD — currently show "coming soon" toast
- MoodPicker is triggered via `useUIStore.setMoodPickerTaskId()` — task completion should trigger it
- Reward domain type may include `icon?: RewardIconKey` — cast needed when reading from API
- date-fns locale `zhCN` available for Chinese relative time formatting

## Do-Not-Repeat
- (2026-05-12) Never leave buttons without onClick handlers — dead buttons = broken UX. Every interactive element needs behavior or should be removed
- (2026-05-12) Never hardcode user names or time-of-day greetings — derive from authStore and Date
- (2026-05-12) Never leave textarea/input uncontrolled when state is needed — always wire value + onChange
- (2026-05-12) handleEdit that only populates form without saving is not an edit — must call update API

## Decision Log
- (2026-05-12) Removed grid view toggle from TaskList since only list view exists — dead toggle is misleading
- (2026-05-12) Removed "今日小贴士" button from sidebar since tips feature doesn't exist
- (2026-05-12) Export/import buttons show "coming soon" toast instead of silently failing
- (2026-05-12) Notification bell wired to open settings drawer as interim behavior

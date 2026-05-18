# Native iOS Implementation Notes

## Scope

This implementation adds the native iOS v1 foundation without replacing the React web app. It keeps the existing Hono/Postgres backend and extends it for light companion growth.

## Backend

- New route group: `/companion`.
- New tables: `companion_profiles`, `cosmetic_unlocks`, `reminder_preferences`, `sync_states`.
- Task completion now also awards companion experience while preserving the existing task completion response shape.
- `/sync` accepts and returns the new iOS local-first tables.

## iOS

- SwiftUI app shell uses five tabs: 今日, 任务, 心情, 金库, 复盘.
- SwiftData models mirror the current task/mood/reward/point semantics and add companion, cosmetic, reminder, and sync state models.
- Keychain stores optional login tokens.
- UserNotifications schedules one gentle daily reminder only when the user enables it.
- Sync pushes a local snapshot to the existing `/sync` endpoint when tokens are present.

## Known Environment Limit

The current workspace is Windows-based and has no Xcode project. The Swift source is ready to import into an iOS 17 Xcode app target, but Simulator and TestFlight validation require macOS + Xcode.

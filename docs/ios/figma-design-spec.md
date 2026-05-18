# DoNotNervous iOS v1 Figma Design Spec

## Design Intent

DoNotNervous iOS is a native, local-first light-raising app. The UI should feel more game-like than the current web app, but it must still reduce pressure: no punitive streak copy, no forced goals, no competitive language, and no urgent notification tone.

The first screen is the daily raising hub: users see their rounded original companion, today's gentle progress, quick task creation, and the next few focus tasks.

## Frames

Create these iPhone 15 frames in Figma:

1. `00 Onboarding Local First`
   - Open directly into value.
   - Primary action: `开始记录`.
   - Secondary action: `稍后登录同步`.

2. `01 Today Raising Hub`
   - Top: greeting and settings icon.
   - Hero: rounded original companion, level badge, experience bar, energy/mood state.
   - Middle: quick add task field and difficulty segmented control.
   - Bottom: 3-4 focus task rows.

3. `02 Task List`
   - Sections: new task, active tasks, completed tasks.
   - Task row includes completion control, title, optional note, difficulty chip.
   - Swipe affordance for delete/archive.

4. `03 Completion + Mood`
   - Companion celebrates task completion.
   - Show points gained and experience gained.
   - Mood picker uses 8 options and optional short journal.

5. `04 Vault + Dress Up`
   - Balance header.
   - User rewards list.
   - Cosmetic unlock list with slots: hat, face, body, room, effect.

6. `05 Review`
   - Today's completed tasks.
   - Weekly points.
   - Mood records.
   - Active days this week.

7. `06 Settings Sync Reminder`
   - Optional login/register.
   - Local-first sync status.
   - Gentle local reminder toggle, time picker, editable message.

## Design Tokens

Use a warm base with multiple functional accents:

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#FAF5E8` | App background |
| Surface | `rgba(255,255,255,0.86)` | Cards/sheets |
| Ink | `#382E21` | Primary text |
| Muted | `#7A6B57` | Secondary text |
| Sage | `#5C9E6B` | Primary action, completion |
| Amber | `#F2A338` | Points, experience |
| Coral | `#E6614F` | Celebration, expressive states |
| Sky | `#6BA8EB` | Mood and review support |
| Lavender | `#9480E0` | Level, cosmetics |

Typography:

- Large title: SF Pro Rounded, 34, bold.
- Title: SF Pro Rounded, 24, bold.
- Headline: SF Pro Rounded, 17, semibold.
- Body: SF Pro, 15-17, regular.
- Caption: SF Pro, 12, semibold for chips.

Spacing:

- Use 8pt increments.
- Screen horizontal padding: 20.
- Card padding: 16.
- Component gap: 8 / 12 / 16 / 24.
- Card corner radius: 22 for hero/content cards, 16 for compact controls.

## Components

- `CompanionAvatar`
  - Rounded blob body, two dot eyes, capsule mouth.
  - States: normal, happy, celebrating, tired, proud.
  - Has slots for cosmetic overlays.

- `LevelProgress`
  - Level badge + amber progress bar.
  - Text should say growth, not productivity pressure.

- `TaskRow`
  - 44pt minimum touch target.
  - Completion control uses familiar circle/check icon.
  - Difficulty chip uses three labels: `轻松`, `专注`, `挑战`.

- `MoodPicker`
  - 8 fixed options: 开心, 平静, 平稳, 低落, 焦虑, 烦躁, 兴奋, 有力.
  - Journal field optional.

- `VaultCard`
  - Reward and cosmetic cards share a compact row shape.
  - Disabled unlock states must still be readable.

- `BottomTab`
  - Five tabs: 今日, 任务, 心情, 金库, 复盘.
  - Use SF Symbols matching the SwiftUI scaffold.

## Copy Rules

- All UI text is Chinese.
- Avoid `失败`, `断签`, `落后`, `必须`, `还差`.
- Prefer `今天也辛苦了`, `可以回来看看今天的小进步`, `慢慢来`, `完成一点点`.
- Reminder default body: `如果愿意，可以回来看看今天的小进步。`

## Implementation Mapping

- Figma components map to SwiftUI files under `ios/DoNotNervous/Views`.
- Design tokens map to `DNNColors` in `DesignSystem.swift`.
- Companion model maps to `CompanionProfile`.
- Dress-up unlocks map to `CosmeticUnlock`.
- Reminder screen maps to `ReminderPreference` and `ReminderScheduler`.

# Phase 4: Mascot & Animations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 04-mascot-animations
**Areas discussed:** Mascot design & states, Celebration triggers & effects, Micro-interaction polish, Responsive design gaps

---

## Mascot Design & States

| Option | Description | Selected |
|--------|-------------|----------|
| Sprout / plant | Consistent with Leaf brand. Grows with streaks. | |
| Cat / kitten | Warm, comforting. Multiple expressive states. | ✓ |
| Blob creature | Similar to Finch app. Character appeal. | |

**User's choice:** Cat / kitten

| Option | Description | Selected |
|--------|-------------|----------|
| Lottie animations | Pre-made, lightweight, STATE.md locked. | ✓ |
| CSS keyframe | No dependency, more dev work. | |
| Sprite sheet / GIF | Most control, heaviest load. | |

**User's choice:** Lottie animations

| Option | Description | Selected |
|--------|-------------|----------|
| Idle / breathing | Subtle blink + tail wag. MASC-01. | ✓ |
| Celebrate | Jump/spin on task complete. MASC-02. | ✓ |
| Encourage | Wave/sign on streak milestones. MASC-03. | ✓ |
| Sleepy / napping | No tasks today. Personality. | ✓ |

**User's choice:** All 4 states

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar + float mobile | Above plant card on desktop. | |
| Floating bottom-right | Always visible, all pages. | ✓ |
| Home page hero only | Clean but less visible. | |

**User's choice:** Floating bottom-right corner

| Option | Description | Selected |
|--------|-------------|----------|
| Small (80px) | Compact, tap to expand. | |
| Medium (120px) | Visible without tap. | |
| Large (180px) | Very visible, big footprint. | |

**User's choice:** Claude discretion

| Option | Description | Selected |
|--------|-------------|----------|
| Tap for speech bubble | Random encouraging message. | ✓ |
| No tap interaction | Simpler, less personality. | |
| Tap for mini panel | Cat state + streak + mood. | |

**User's choice:** Tap for speech bubble

| Option | Description | Selected |
|--------|-------------|----------|
| LottieFiles marketplace | Fast, curated quality. | ✓ |
| Custom design | Exact match, more time/cost. | |
| Claude picks, user reviews | Autopilot with review. | |

**User's choice:** LottieFiles marketplace

---

## Celebration Triggers & Effects

| Option | Description | Selected |
|--------|-------------|----------|
| Reward redemption (existing) | Already in RewardShop. | ✓ |
| Task completion | Burst from mascot. MASC-04. | ✓ |
| Streak milestones | Bigger burst at 7/14/30. STRK-05. | ✓ |
| Mood logging | Gentle burst. Encourages tracking. | ✓ |

**User's choice:** All 4 events

| Option | Description | Selected |
|--------|-------------|----------|
| Scaled intensity | Different particle counts per event. | ✓ |
| Uniform intensity | Same for everything. | |

**User's choice:** Scaled intensity

| Option | Description | Selected |
|--------|-------------|----------|
| From mascot (bottom-right) | Cat celebrates with confetti. | ✓ |
| Center screen | Classic confetti feel. | |
| Mixed per event | Different origin per event. | |

**User's choice:** From mascot position

| Option | Description | Selected |
|--------|-------------|----------|
| Chinese encouragement | Warm phrases in Chinese. | |
| Emoji-only | Universal, simple. | |
| Chinese + emoji mix | More variety. | ✓ |

**User's choice:** Chinese + emoji mix

---

## Micro-interaction Polish

| Option | Description | Selected |
|--------|-------------|----------|
| Task add animation | Spring physics scale+fade. | ✓ |
| Task complete animation | Check sweep, strikethrough, row dims. | ✓ |
| Task delete animation | Slide out with fade. | ✓ |
| Drag reorder feedback | Lift shadow, smooth gap. | ✓ |

**User's choice:** All 4 transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle page transitions | Fade/slide on nav switch. | ✓ |
| Instant (no transition) | Current behavior. | |

**User's choice:** Subtle page transitions

---

## Responsive Design Gaps

| Option | Description | Selected |
|--------|-------------|----------|
| 5 tabs in bottom nav | All pages accessible. Standard. | ✓ |
| 4 tabs + settings menu | Less discoverable. | |
| Scrollable tabs | Less clean. | |

**User's choice:** 5 tabs in bottom nav

| Option | Description | Selected |
|--------|-------------|----------|
| Fluid grid columns | Replace fixed px with responsive units. | ✓ |
| Touch target sizing | All interactive >= 44px. | ✓ |
| Responsive font scaling | Scale below 640px. | ✓ |
| Responsive images | max-width: 100%, aspect-ratio. | ✓ |

**User's choice:** All 4 fixes

---

## Claude's Discretion

- Exact mascot size (80-100px range)
- LottieFiles cat animation selection
- Page transition direction/duration
- Spring physics values for task animations
- Speech bubble message pool
- Confetti color palette (reuse warm palette from Phase 3)

## Deferred Ideas

None — discussion stayed within phase scope.

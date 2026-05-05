# Mascot Animations — Asset Status

All Lottie animations are placeholders. Replace with production artwork before public release.

| Animation | File | State | Trigger | Replacement Notes |
|-----------|------|-------|---------|-------------------|
| idle | `public/animations/cat-idle.json` | Placeholder | Default, breathing loop | Gentle sway/breathe, cat sitting relaxed |
| celebrate | `public/animations/cat-celebrate.json` | Placeholder | Task complete, reward redeem | Jumping/bouncing with raised paws, confetti-friendly pose |
| encourage | `public/animations/cat-encourage.json` | Placeholder | Streak milestone (7/14/30 days) | Waving paws, cheering motion |
| sleepy | `public/animations/cat-sleepy.json` | Placeholder | No current trigger (future use) | Drowsy eyes, slow breathing, maybe Z particles |

## Technical Details

- Renderer: lottie-react (After Effects JSON format)
- File sizes: ~2-3KB each (placeholder shapes only — production assets will be larger)
- All animations loop via Lottie `loop={true}` prop
- Animation speed controlled via mascotStore, default 1x

## Replacement Checklist

- Export from After Effects via Bodymovin plugin at 60fps, 300x300px comp
- Keep file size under 100KB per animation
- Maintain the same JSON filename to avoid import path changes
- Test in happy-dom environment (Lottie renders to canvas/SVG — verify mock coverage)

## Notes

`domain/streaks.ts` is intentionally kept (per D-01) — reserved for v2 STRK-06 earn-back recovery and STRK-07 calendar view features.

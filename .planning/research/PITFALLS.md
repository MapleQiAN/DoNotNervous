# Domain Pitfalls: DoNotNervous

**Domain:** Anti-anxiety goal tracking web app (local-first, gamified, mood tracking, mascot-driven)
**Researched:** 2026-04-28
**Confidence:** HIGH (verified across Smashing Magazine, web.dev, MDN, WebKit bug tracker, academic sources, and community reports)

---

## Critical Pitfalls

Mistakes that would undermine the core anti-anxiety philosophy or cause irreversible data loss. These must be addressed in architecture decisions before code is written.

---

### Pitfall 1: Gamification That Creates Anxiety Instead of Reducing It

**What goes wrong:** Streaks, points, and leaderboards designed for maximum engagement exploit loss aversion and the Zeigarnik effect. Users feel compelled to act out of fear of losing progress rather than genuine motivation. Duolingo is the canonical example: users report their 500-day streak becoming a source of dread, not joy. A user on Reddit described abandoning a 500-day streak because "it became overwhelming trying to keep up with the daily pressure."

**Why it happens:** Loss aversion is the most powerful psychological force behind streaks. The pain of losing something feels roughly twice as strong as the pleasure of gaining it. When a streak grows, motivation shifts from intrinsic (genuine desire) to extrinsic (fear of loss). The streak becomes the goal rather than the underlying habit. This is the exact opposite of the "anti-anxiety" philosophy.

**Consequences:** Users feel guilt, shame, and obligation. They tie self-worth to an arbitrary metric. A broken streak triggers demoralization so severe they abandon the app entirely rather than rebuild. The app meant to reduce anxiety becomes a source of it.

**Prevention:**
- **Grace mechanisms over hard resets.** Never reset a streak to zero. Use decay models (deduct a small amount per missed day) or streak freezes (allow intentional skips without penalty). Bear Room's "Key" economy is a better model: users earn keys every few days, not daily, and missing a day merely delays the next key.
- **Encouraging tone on breakage.** Never say "You lost your 42-day streak. Start over." Instead: "You showed up for 42 days straight. That is incredible progress." Celebrate what was achieved, not what was lost.
- **Separate streak from identity.** The mascot and progress should never visually "punish" the user for missing a day. The mascot stays warm and supportive regardless.
- **Provide "rest day" affordances.** Let users explicitly take rest days that do not count against them. Normalize imperfection.

**Detection:** If user testing reveals any language from participants resembling "I have to" or "I feel guilty" rather than "I want to," the gamification has crossed into compulsion territory.

**Severity:** CRITICAL -- directly violates the core product philosophy.

---

### Pitfall 2: Safari/WebKit IndexedDB Data Destruction

**What goes wrong:** Safari's Intelligent Tracking Prevention (ITP) silently deletes all IndexedDB, localStorage, and Cache API data for websites that have not been interacted with for 7 consecutive days. This is an intentional WebKit policy, not a bug. Additionally, Safari has a documented history of randomly erasing LocalStorage and IndexedDB data for all websites (WebKit Bug 266559, still active). Users lose all task data, mood history, points, and streaks without warning.

**Why it happens:** Apple's ITP is designed to prevent cross-site tracking, but it affects all client-side storage indiscriminately. WebKit has also shipped critical IndexedDB bugs in production releases (Safari 14.1.1 completely broke IndexedDB), and many WebKit storage bugs remain open for years.

**Consequences:** Catastrophic data loss. A user who has been tracking tasks and moods for months loses everything overnight. There is no recovery mechanism. Trust in the app is destroyed. For an anti-anxiety tool, this is particularly harmful: the user's emotional record and progress vanish.

**Prevention:**
- **Request persistent storage.** Call `navigator.storage.persist()` on first use. This asks the browser to exempt the site from storage eviction. Chrome grants this automatically for installed PWAs; Safari shows a user prompt.
- **Implement auto-export backup.** Periodically export all user data as a JSON file. On Safari, this is not optional -- it is essential. One team affected by Safari's 7-day purge built an auto-export feature that saves JSON backups to iCloud or local files as a safety net.
- **Provide manual export/import.** Users must be able to export their full dataset at any time and import it on a new device or after data loss. This is both a backup strategy and a data portability requirement.
- **Consider the Storage API.** Use `navigator.storage.estimate()` to monitor remaining quota and warn users before storage fills up.
- **Design for data recovery.** Store a "last known good" backup timestamp and guide users to restore from it when the app detects missing data.

**Detection:** On app launch, compare stored data checksums against previous sessions. If data has vanished, immediately offer the recovery/import flow rather than presenting an empty state.

**Severity:** CRITICAL -- total data loss with no server-side recovery possible.

---

### Pitfall 3: IndexedDB Transaction Auto-Abort (Especially Safari)

**What goes wrong:** IndexedDB transactions auto-abort if they are not used within the same event loop tick or microtask. Safari is more aggressive than Chrome and Firefox about closing idle transactions. Any delay between creating a transaction and performing operations on it (even an `await` or a `setTimeout`) causes the transaction to silently abort. All writes in that transaction are lost.

**Why it happens:** The IndexedDB spec allows browsers to auto-close transactions when the event loop empties and no operations are pending. Safari interprets this more strictly than other browsers. This is compounded by WebKit Bug 156070 which documents flaky timeout behavior in transaction abort tests.

**Consequences:** Silent data loss. A user completes a task, sees a success animation, but the write never actually persisted. The next time they open the app, the task appears uncompleted. Mood entries vanish. Point balances are wrong.

**Prevention:**
- **Never await between transaction creation and operation.** All operations on a transaction must happen synchronously within the same microtask. Use a wrapper library like Dexie.js that handles this automatically.
- **Use Dexie.js or similar abstraction.** Raw IndexedDB is error-prone and browser-quirky. Dexie.js provides a Promise-based API that manages transaction lifecycles correctly. It is the de facto standard for IndexedDB in production web apps.
- **Always attach error handlers.** Every IndexedDB request needs an `onerror` handler. Without it, failures are swallowed silently. Dexie.js handles this by rejecting promises on errors.
- **Verify writes with reads.** After critical writes (completing a task, recording a mood), read back the data to confirm it persisted. This adds a small performance cost but catches silent failures.

**Detection:** Log all transaction errors and aborts. If error rates spike on Safari/iOS, investigate transaction lifecycle handling.

**Severity:** CRITICAL -- silent data loss that erodes user trust.

---

### Pitfall 4: Point Economy Inflation (No Sinks)

**What goes wrong:** Users earn points for completing tasks but have limited ways to spend them. Over weeks and months, point balances grow into the thousands or tens of thousands with no meaningful way to use them. Points become meaningless. The reward system that was supposed to motivate becomes a joke.

**Why it happens:** Most gamification systems focus on the "faucet" (how users earn points) but neglect the "sink" (how points leave the system). Without sufficient sinks, the virtual economy inflates. The points earned from early tasks feel worthless compared to the enormous balance. New users see the point system as irrelevant because rewards seem trivially easy to afford.

**Consequences:** The core incentive loop breaks. Users stop caring about earning points. The reward redemption feature becomes vestigial. The app loses one of its primary differentiation mechanisms.

**Prevention:**
- **Design sinks before faucets.** Map out exactly how points enter and leave the system. Every reward must have a meaningful point cost relative to earning rates.
- **Scale reward costs with engagement.** Early rewards should be affordable (50-100 points) to create early wins. Later rewards should be aspirational (500-1000+ points). Cosmetic rewards for the mascot (outfits, accessories -- similar to Finch's model) provide infinite sinks that never run out.
- **Consider point decay for inactive balances.** Not as a punishment, but as a gentle nudge: "Your points are resting too -- spend them on something nice!" Frame it positively.
- **Allow user-defined rewards with meaningful costs.** If users set their own rewards, guide them to set costs that feel like a genuine trade-off. A reward that costs 5 minutes of effort is not motivating.
- **Track economy health.** Monitor average balance, earning rate, and spending rate. If balances grow faster than spending, adjust the economy.

**Severity:** CRITICAL -- undermines the core incentive loop over time.

---

## Moderate Pitfalls

---

### Pitfall 5: Mood Tracking UX Friction (Overcomplicated Logging)

**What goes wrong:** Mood logging requires too many taps, too much reading, or too many choices. Users in a low-energy state (anxious, depressed, overwhelmed) cannot complete the flow. They abandon mood tracking entirely, which removes one of the app's key feedback mechanisms. Research from mental health app UX (Smashing Magazine, 2026) shows that users experiencing anxiety have reduced cognitive capacity, shorter attention spans, and lower tolerance for dense layouts.

**Why it happens:** Designers assume users will engage deeply with mood tracking and add features like detailed scales, emotion wheels, mandatory journal entries, and multi-step flows. But the user is completing a task, feeling tired, and the mood prompt is an interruption they want to dismiss quickly.

**Consequences:** Drop-off at the mood logging step. Users skip mood tracking, then weekly summaries have no mood data to visualize. The feature that was supposed to provide emotional insight provides nothing.

**Prevention:**
- **One-tap mood selection as the default.** Present 4-5 clearly labeled mood options immediately after task completion. No intermediate screens. The user taps once and they are done.
- **Make the journal entry optional and secondary.** Show a small, unobtrusive text field below the mood options. Never require it. Label it invitingly: "Want to write a few words?" (not "Describe your mood in detail").
- **Reduce cognitive load to absolute minimum.** Use visual metaphors (colored bubbles, faces) rather than text-heavy scales. The Food for Mood app tested bubble carousels and found they scored higher on engagement and positive affect than standard card layouts.
- **Allow mood logging without task completion.** Let users log moods independently. Sometimes users want to record how they feel without completing a task first.
- **Never shame incomplete mood logs.** If a user skips mood tracking, the summary should show "Not every day needs a mood check-in. That is perfectly okay."

**Severity:** WARNING -- feature erosion that reduces app value over time.

---

### Pitfall 6: Animation Performance Degradation on Low-End Mobile Devices

**What goes wrong:** Mascot animations, celebration effects, and micro-interactions work smoothly on development machines but stutter, freeze, or crash on budget Android devices. The app feels broken for users with the least powerful hardware. Entry-level Android devices are especially prone to animation lag.

**Why it happens:** Animating layout-triggering CSS properties (width, height, top, left, margin) forces the browser to recalculate layout on every frame. JavaScript-driven animations without `requestAnimationFrame` cause frame drops. CSS custom properties (variables) perform surprisingly poorly when animated. Large sprite sheets consume excessive memory on devices with limited RAM.

**Consequences:** The app feels slow and unresponsive on the devices most likely to be used by budget-conscious users (who may also be the target audience for a free personal wellness tool). Animations intended to delight instead create frustration.

**Prevention:**
- **Animate only `transform` and `opacity`.** These are the only two CSS properties that can be animated entirely on the GPU compositor thread without triggering layout or paint. All mascot movements, celebrations, and transitions should use these properties.
- **Use `will-change` sparingly.** Apply it only to elements that are actually about to be animated, and remove it after the animation completes. Overusing `will-change` wastes GPU memory.
- **Respect `prefers-reduced-motion`.** This is both an accessibility requirement and a performance tool. When the user's OS-level reduced motion setting is active, disable or minimize all animations. This is non-negotiable for a wellness app.
- **Test on real low-end devices.** Emulators do not reproduce the actual performance constraints of budget phones. Use real device testing with Chrome DevTools performance profiling.
- **Use CSS animations over JavaScript for simple effects.** CSS animations are generally more efficient than JavaScript-driven ones because the browser can optimize them at the compositor level. For the mascot, consider Lottie (lightweight JSON-based animations) or CSS-only approaches over heavy sprite sheets.

**Severity:** WARNING -- affects usability on a significant portion of devices.

---

### Pitfall 7: Streak Mechanics Without Timezone Awareness

**What goes wrong:** Streaks are calculated based on UTC or server time rather than the user's local timezone. A user in California (UTC-8) who completes a task at 10 PM local time finds their streak did not count because it is already the next day in UTC. A user in Tokyo (UTC+9) gets extra hours they should not have. The streak system feels unfair and broken.

**Why it happens:** Date and timezone handling is notoriously difficult. Developers take shortcuts by using UTC everywhere or ignoring DST transitions. Since DoNotNervous is local-first with no server, the temptation to use `Date.now()` or `new Date().toUTCString()` is strong.

**Consequences:** Streaks break unexpectedly for users in certain timezones. Users in negative-UTC offsets are disproportionately affected. Streak breaks feel arbitrary and unfair, directly contradicting the anti-anxiety philosophy.

**Prevention:**
- **Use the user's local timezone for all streak calculations.** Ask for timezone during onboarding (with auto-detection as default). Store the IANA timezone string (e.g., "America/Los_Angeles").
- **Use a robust date library.** Do not write custom timezone logic. Use a library like `date-fns-tz`, `luxon`, or `dayjs` with timezone plugins.
- **Define "a day" as the user's local calendar date.** A streak continues if the user completes a qualifying action on consecutive local calendar dates, regardless of UTC boundaries.
- **Handle DST transitions.** Test streak logic around spring-forward and fall-back transitions. Ensure that a task completed at 1:30 AM on the day clocks spring forward still counts.

**Severity:** WARNING -- causes unfair streak breaks that feel arbitrary.

---

### Pitfall 8: No Schema Migration Strategy for IndexedDB

**What goes wrong:** As the app evolves, the IndexedDB schema changes (new object stores, new indexes, modified data shapes). Without a migration strategy, opening a newer version of the database with an older schema causes errors or data corruption. Users who update the app lose data or see broken UI.

**Why it happens:** IndexedDB's `onupgradeneeded` event is the only mechanism for schema changes. It is fired when the database version number increases. If the upgrade handler has a bug, or if multiple tabs have the database open during an upgrade, the upgrade fails silently or blocks indefinitely. Safari is particularly problematic with the `onblocked` event.

**Consequences:** Users cannot open the app after an update. Data is locked in an inconsistent state. The only recovery is to delete all data and start over.

**Prevention:**
- **Version your database schema explicitly.** Always increment the version number when changing the schema. Never modify object stores outside of `onupgradeneeded`.
- **Handle `onblocked` events.** When the upgrade is blocked by another tab, show a user-facing message asking them to close other tabs. Do not silently fail.
- **Write idempotent migrations.** Each migration step should check whether the change has already been applied before executing. This prevents double-migration on retry.
- **Test migrations with real data.** Before releasing a schema change, test the migration path with a database populated with realistic data from the previous version.
- **Keep a migration log.** Store the last successfully applied migration version in the database itself. This enables recovery if a migration partially fails.

**Severity:** WARNING -- can cause data corruption on app updates.

---

### Pitfall 9: Mascot Animations That Animate Too Much / Wrong Properties

**What goes wrong:** The mascot uses complex animations (frame-by-frame sprite sheets, animated SVG with many paths, or JavaScript-driven canvas animations) that consume excessive CPU and battery. On mobile, this causes the device to heat up and the battery to drain. Users uninstall the app because it kills their battery.

**Why it happens:** Mascot design often starts with rich, detailed animations that look beautiful in design tools but are impractical on mobile devices. The gap between Figma prototypes and real device performance is large.

**Consequences:** Battery drain, device heating, and negative app store reviews. The mascot that was supposed to be a comforting companion becomes a resource hog.

**Prevention:**
- **Use idle animations sparingly.** The mascot does not need to be animated continuously. Use subtle, infrequent idle animations (a blink every 5-10 seconds, a slight position shift every 30 seconds). Finch's approach works well: the bird blinks and preens occasionally, creating a sense of life without constant motion.
- **Prefer CSS transforms for mascot movement.** Moving the mascot with `transform: translate()` is GPU-composited. Moving it with `top`/`left` or `margin` triggers layout reflows.
- **Use Lottie for complex animations.** Lottie renders After Effects animations as lightweight JSON, which performs significantly better than sprite sheets or animated GIFs. It also scales to any resolution without quality loss.
- **Pause animations when not visible.** Use the Page Visibility API (`document.hidden`) and Intersection Observer to pause mascot animations when the tab is in the background or the mascot is scrolled off-screen.
- **Provide a "reduce animations" setting.** Even users without OS-level `prefers-reduced-motion` may want calmer animations. Give them control.

**Severity:** WARNING -- affects battery life and device performance.

---

## Minor Pitfalls

---

### Pitfall 10: Storing Blobs in IndexedDB (Safari Incompatibility)

**What goes wrong:** Safari has a long-standing issue where Blob objects stored in IndexedDB appear as `null` when retrieved. This means mascot images, exported data files, or any binary data stored directly as Blobs will be lost.

**Prevention:** Convert Blobs to ArrayBuffers before storing in IndexedDB. Reconstruct as Blobs when reading. Or store binary data as base64 strings (less efficient but universally compatible).

**Severity:** CONSIDER -- affects specific data storage patterns.

---

### Pitfall 11: Missing `indexedDB.databases()` Support in Safari

**What goes wrong:** Safari does not support `indexedDB.databases()`, a standard API available in Chrome and Firefox that lists all databases for the origin. Any code that relies on this API to enumerate or clean up databases will silently fail on Safari.

**Prevention:** Do not rely on `indexedDB.databases()`. Track database names explicitly in your application code. Use a known, fixed database name rather than dynamically discovering databases.

**Severity:** CONSIDER -- minor API limitation.

---

### Pitfall 12: Private/Incognito Mode Data Loss

**What goes wrong:** IndexedDB data in private browsing mode is ephemeral. When the user closes the private window, all data is destroyed. Users who habitually use private browsing (common among privacy-conscious users) lose all data at the end of each session.

**Prevention:** Detect private browsing mode (check storage quota or use feature detection). Display a clear warning: "You are using private browsing mode. Your data will not be saved between sessions. Consider using regular browsing for this app." Offer a one-click export at the end of each session.

**Severity:** CONSIDER -- affects a subset of privacy-conscious users.

---

### Pitfall 13: Concurrent Tab Writes Causing Data Corruption

**What goes wrong:** If a user opens DoNotNervous in multiple tabs, concurrent writes to IndexedDB from different tabs can cause race conditions. One tab overwrites data written by another. The last write wins, and earlier writes are lost.

**Prevention:** Use the Broadcast Channel API to synchronize state between tabs. Designate one tab as the "primary" writer. Alternatively, use a locking mechanism via `navigator.locks` (supported in all modern browsers) to ensure only one tab writes at a time. Dexie.js handles multi-tab coordination through its `Dexie.Observable` addon.

**Severity:** CONSIDER -- edge case but possible for power users.

---

### Pitfall 14: Overly Complex Task Hierarchy Overwhelming Users

**What goes wrong:** The three-level task system (simple checklist, categorized with subtasks, project with milestones and tasks) is presented all at once. New users see a complex project management interface when they expected a simple to-do list. They leave before experiencing the value.

**Why it happens:** Engineers and designers who build multi-level systems naturally want to expose the full power immediately. But the target audience (busy, anxious people) does not want to learn a system. They want to write down a task and check it off.

**Prevention:** Progressive disclosure. Start with the simple checklist view. Introduce categories and subtasks only when the user has 10+ tasks. Introduce projects only when the user creates their first category with 5+ subtasks. Let the complexity grow with the user's needs, not before.

**Severity:** CONSIDER -- affects onboarding and first-use experience.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| IndexedDB setup | Transaction auto-abort, Safari blob issues (Pitfalls 3, 10) | Use Dexie.js from the start; convert blobs to ArrayBuffers |
| Point system design | Point inflation, no sinks (Pitfall 4) | Design sinks first; track economy health metrics |
| Streak mechanics | Anxiety-inducing resets, timezone issues (Pitfalls 1, 7) | Grace mechanisms; user-local timezone; decay not reset |
| Mood tracking | Friction causing drop-off (Pitfall 5) | One-tap default; optional journal; 4-5 options max |
| Mascot animations | Performance on low-end devices (Pitfalls 6, 9) | Transform/opacity only; Lottie; prefers-reduced-motion |
| Data persistence | Safari 7-day purge (Pitfall 2) | Persistent storage request; auto-export JSON backups |
| Schema changes | Migration failures (Pitfall 8) | Version explicitly; handle onblocked; idempotent migrations |
| Multi-tab usage | Concurrent write corruption (Pitfall 13) | Broadcast Channel API or navigator.locks |

## Key Design Principles (Anti-Anxiety Lens)

These principles should guide every feature decision:

1. **Forgiveness over perfection.** Every mechanic should tolerate imperfection. Streaks do not reset to zero. Points do not expire punitively. Tasks can be uncompleted without penalty.
2. **Encouragement over pressure.** Every message the app sends should feel like a warm friend, not a coach. "You showed up today -- that matters" rather than "Do not break your streak!"
3. **Progress is never lost.** Even when a streak ends, the history of that streak remains visible and celebrated. The app remembers what the user achieved.
4. **Low cognitive load always.** If a user is anxious, they cannot process complex interfaces. Every interaction should work in under 3 seconds of thought.
5. **The mascot is a companion, not a judge.** The mascot never looks disappointed, never pressures the user, and never changes appearance negatively based on performance. Finch's model is the gold standard: the bird grows and accessorizes through positive action but never deteriorates through inaction.

## Sources

- Smashing Magazine: "Designing A Streak System: The UX And Psychology Of Streaks" (2026-02) -- https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/
- Smashing Magazine: "Building Digital Trust: An Empathy-Centred UX Framework For Mental Health Apps" (2026-02) -- https://www.smashingmagazine.com/2026/02/building-empathy-centred-ux-framework-mental-health-apps/
- Reddit r/webdev: "Safari Silently Deleted Our Users' Saved Data After 7 Days" -- https://www.reddit.com/r/webdev/comments/1rpp4oh/safari_silently_deleted_our_users_saved_data/
- WebKit Bugzilla: Bug 266559 (Random storage deletion) -- https://bugs.webkit.org/show_bug.cgi?id=266559
- WebKit Bugzilla: Bug 156070 (Flaky transaction abort) -- https://bugs.webkit.org/show_bug.cgi?id=156070
- WebKit Bugzilla: Bug 178204 (IndexedDB storage bloat on iOS) -- https://bugs.webkit.org/show_bug.cgi?id=178204
- GitHub Gist: "The Pain and Anguish of Using IndexedDB" -- https://gist.github.com/pesterhazy/4de96193af89a6dd5ce682ce2adff49a
- Hacker News: "IndexedDB Is Completely Broken in Latest Safari" -- https://news.ycombinator.com/item?id=27509206
- web.dev: "IndexedDB Best Practices" -- https://web.dev/articles/indexeddb-best-practices-app-state
- MDN: Animation Performance and Frame Rate -- https://developer.mozilla.org/docs/Web/Performance/Guides/Animation_performance_and_frame_rate
- web.dev: "Animation and Motion Accessibility" -- https://web.dev/learn/accessibility/motion
- Medium (Design Bootcamp): "Streaks: The Gamification Feature Everyone Gets Wrong" -- https://medium.com/design-bootcamp/streaks-the-gamification-feature-everyone-gets-wrong-6506e46fa9ca
- The Decision Lab: "Streak Creep: The Perils of Too Much Gamification" -- https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification
- Machinations: "What Is Game Economy Inflation" -- https://machinations.io/articles/what-is-game-economy-inflation-how-to-foresee-it-and-how-to-overcome-it-in-your-game-design
- Sophie Pilley: "The Magic of Finch: Where Self-Care Meets Enchanted Design" -- https://www.sophiepilley.com/post/the-magic-of-finch-where-self-care-meets-enchanted-design
- Motion Magazine: "The Web Animation Performance Tier List" -- https://motion.dev/magazine/web-animation-performance-tier-list
- PMC/NIH: "Potential and Pitfalls of Mobile Mental Health Apps" -- https://pmc.ncbi.nlm.nih.gov/articles/PMC9505389/

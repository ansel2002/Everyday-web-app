# Everyday: build brief

A calm, private self-development app. One person, a few minutes a day, mostly on a phone. Small daily lessons, a short journal, and gentle habits. It should feel like a quiet morning: warm, encouraging, never judgmental. Not a productivity tool, not a clinical wellness app.

Design reference is in `design/`. The `.dc.html` files are Claude Design artboards: read them as source for exact sizes, colours and copy (they need not render standalone). `design/canvas.json` lists every board with its title. Tokens are in `design/tokens.css`. Lesson content is in `data/lessons.seed.json`.

## Principles (do not break)
- Privacy first: data is end-to-end encrypted on the device (passphrase-derived keys) before it is stored in Supabase; the server only ever sees ciphertext and opaque ids. Sign-in is an email magic link. No analytics, no plaintext user data over the network. Show "Private. Encrypted on this device." where the design shows the privacy line. (Changed 2026-10-14 from on-device only, at the owner's request.)
- Never shame. No red, no "failed" or "missed" states, no guilt copy. Unfinished lessons say "Open". A missed habit day is a quiet outline.
- One clear action per screen. Hide anything not needed for today.
- Accessibility: WCAG AA contrast, tap targets of at least 44px, visible focus rings, and state is never shown by colour alone (mood = icon + label, progress = text + shape).
- Respect `prefers-reduced-motion`. Light and dark themes (follow device by default, user can override in Settings).

## Stack (suggested)
Vite + React + TypeScript, installable PWA, IndexedDB via Dexie (localStorage is fine for v1), CSS variables from `design/tokens.css`, no UI framework. Fonts: Fraunces (headings), Figtree (body), self-hosted so the app works offline.

## Layouts
- Phone (about 390px): bottom tab bar (Today, Lessons, Habits, Journal).
- Tablet (about 820px): narrow left icon rail.
- Desktop (1280px): 260px left sidebar with wordmark, tabs, streak and privacy line; content max about 1160px.
Same components at every size; grids reflow.

## Screens (board names in design/)
1. **Today** (Main, TodayDark, Tablet/DesktopToday*): date, day streak, today's lesson (sun-and-hills illustration, "Lesson n of 8", title, body, "Try this", "Mark lesson done"), mood check-in (Low, Flat, Okay, Good, Bright), habit summary ("2 of 3 done today"). The journal box is NOT on Today.
2. **Lessons** (MonthLessons*, TabletMonthLessons*, DesktopMonthLessons*): month dropdown (default current month), month card ("1 of 8 done" with 8 segments), the month's 8 lessons (Done / Today / Open), "See lesson insights".
3. **Lesson insights** (LessonInsights*): this month, bar chart of lessons finished per month (out of 8), year total (n of 96), best month. Patterns, not verdicts.
4. **Habits** (Habits*, HabitsEmpty*, AddHabit*, Confirm*, Tablet/DesktopHabits*): user-defined daily habits; one-tap "Done today" / "Mark done"; streak; Sun-Sat week row for the current week (today bold, future days faint). Streak forgives one missed day. Add-habit flow (name, time of day, gentle reminder switch), encouraging empty state, remove-habit confirm dialog ("Keep habit" is primary; no red).
5. **Journal** (Journal*, Tablet/DesktopJournal*): top "Today" card with the lesson-matched prompt, textarea and "Save entry"; below, past entries newest first (date, mood chip, prompt, text). "This month" mood counts on wider layouts.
6. **Later screens (designed, build after core):** Mood insights, Focus timer, Calm corner (breathing + wind-down), Weekly review, Settings (theme, reminders, PIN lock, export, delete all data). Boards: Insights*, Focus*, Calm*, Weekly*, Settings*, Desktop* versions.
Also see DesignSystem (tokens, type, spacing, motion, rules) and IllustrationSet (8 illustrations, one style).
Ignore boards Lantern and Notebook: they were rejected directions.

## Lessons model
12 months x 8 lessons = 96. Each month has its own theme and its own 8 lessons. Lessons are optional, any order, never expire, always replayable. A lesson has: id, month (1-12), order (1-8), title, body, tryThis, journalPrompt. All 96 lessons are written in `data/lessons.seed.json` (12 months, 8 each, with id, month, order, title, body, tryThis, journalPrompt). Month themes: Jan Fresh starts, Feb Kindness, Mar Energy, Apr Growth, May Focus, Jun Rest, Jul Play, Aug Courage, Sep Connection, Oct Joy in small things, Nov Thankfulness and giving, Dec Reflection and renewal. Load lessons from that file; do not hard-code them. Content can be edited in the JSON without code changes.

## Data (all local)
`moods` (date, level 0-4), `lessonProgress` (lessonId, completedAt), `habits` (id, name, timeOfDay, reminder), `habitLogs` (habitId, date), `journalEntries` (id, date, mood, lessonId, prompt, text), `settings`. Streak: a run of days with any activity; one missed day inside a run does not break it. Export all data as JSON; delete-all wipes the database.

## Motion
Habit done: check draws in about 240ms, dot grows 1 to 1.1 to 1, soft ring fades. Tab change: 180ms cross-fade with 6px rise. Reduced motion: no movement, instant state change.

## Build order
1. Project, tokens, fonts, theme switch, responsive shell and nav.
2. Local database and seed data.
3. Today, Lessons (+insights), Journal.
4. Habits (streak logic with one forgiven day, add flow, empty state, dialog).
5. PWA, offline, reduced motion, accessibility pass (keyboard, focus, contrast).
6. Later screens.
Show each step running before moving on. Ask before adding any dependency that makes network calls.

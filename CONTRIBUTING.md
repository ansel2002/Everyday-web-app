# Working on Everyday

A guide for developers joining the project. Read [README.md](README.md) first for what the app is and how it fits together. This file is about getting set up and making changes safely.

---

## 1. Get set up (about 10 minutes)

**You need:**
- **Node.js 22**: https://nodejs.org (the LTS installer). Check with `node -v`.
- **Git**: https://git-scm.com.
- **Microsoft Edge or Google Chrome**, for the end-to-end test.
- A code editor. VS Code works well.

```bash
git clone https://github.com/ansel2002/Everyday-web-app.git
cd Everyday-web-app/everyday
npm install
npm run dev:fake
```

Open http://localhost:5174, click **Continue with Google** and choose any passphrase. That's it: you're in the app.

`dev:fake` uses a **fake cloud** stored in your browser, so you need no Supabase account, no keys and no email. **Use it for nearly all work.** Add `?demo` to the address (http://localhost:5174/?demo) to fill the app with sample data.

### Running against the real project (only when you need it)

Ask the project owner for the `everyday/.env.local` file and put it in the `everyday/` folder. Its values are public by design, but it is kept out of git. Then:

```bash
npm run dev        # http://localhost:5173, real Supabase project
```

This uses **real accounts and the production database**, so keep it for checking sign-in and sync, not for experiments.

---

## 2. Everyday commands

Run these from the `everyday/` folder:

| Command | What it does |
|---|---|
| `npm run dev:fake` | App on http://localhost:5174 with the fake cloud. Use this day to day. |
| `npm run dev` | App on http://localhost:5173 with the real Supabase project (needs `.env.local`) |
| `npm test` | Unit tests: the streak rule and the encryption |
| `npm run test:e2e` | Every feature in a real headless browser (needs `dev:fake` running in another terminal) |
| `npm run build` | Type-check everything and make a production build in `dist/` |
| `npm run deploy` | Build and publish to Netlify (project owner only) |

**Before you push,** run `npm test`, `npm run build` and `npm run test:e2e`. All three must pass.

---

## 3. How the code is organised

```
everyday/src/
├── App.tsx          Picks the screen: sign-in, passphrase, PIN, or the app pages
├── router.ts        Hash routes like #/habits/new
├── data/            All data and logic, no UI
│   ├── types.ts     The record types (Mood, Habit, JournalEntry, ...)
│   ├── store.ts     The decrypted data in memory; every read and write goes through it
│   ├── habits.ts, journal.ts, moods.ts, progress.ts, settings.ts   One small module per kind of data
│   ├── streak.ts    The only place for streak logic
│   ├── lessons.ts   Reads ../data/lessons.seed.json (the only source of lesson content)
│   ├── crypto.ts, keys.ts                Encryption and who holds the keys
│   ├── sync.ts, cache.ts, cloud.ts       Encrypted local copy and sync with Supabase
│   ├── fakeCloud.ts                      The development fake cloud
│   └── session.ts   Sign in, passphrase, PIN, sign out, delete
├── screens/         One folder per screen
├── shell/           Tab bar (phone), rail (tablet), sidebar (desktop)
├── ui/              Shared components: Card, Icon, Dialog, Switch, PageHeader, ...
├── styles/          tokens.css (from the design), base, shell, ui, screens
└── sw/sw.ts         Service worker: offline cache and push reminders
```

---

## 4. Rules that must never be broken

These come from the product brief ([CLAUDE.md](CLAUDE.md)) and the security model.

**Privacy and security**
- **Never send user data to the server unencrypted.** Read and write data only through `store` (`store.put`, `store.remove`, `useStore`). The sync layer encrypts every change. Never call Supabase tables directly from a screen.
- **Never save user text in `localStorage`** or anywhere else unencrypted. Unsaved drafts stay in memory.
- **Never commit secrets.** `.env.local` and `supabase/.env.secrets` are git-ignored; keep it that way.
- **No analytics and no third-party scripts.** `netlify.toml` has a strict Content Security Policy; new outside services must be added there on purpose.

**Tone and accessibility**
- **Never shame.** No red, no "failed" or "missed" states, no guilt copy.
- **State is never colour alone.** Always pair it with an icon, a word or a shape.
- **Tap targets at least 44px, and visible focus rings.** Use native `<button>`, `<a>` and `<dialog>` (see `ui/Dialog.tsx`).
- **Motion** must respect `prefers-reduced-motion`. `tokens.css` turns animations off; put any "draw in" effect inside `@media (prefers-reduced-motion: no-preference)`.
- **Colours** come from `styles/tokens.css`. Check light and dark themes, and WCAG AA contrast.

**Code**
- Keep components small and readable, and match the style around them.
- Ask the project owner before adding a dependency, especially one that makes network calls.

---

## 5. How to add a feature

### A new screen

1. Create `src/screens/<name>/<Name>Screen.tsx`. Start with `<PageHeader>` (and `<BackLink>` for sub-pages), then `card`s.
2. Add the route name to `Route` and `ROUTES` in `src/router.ts`.
3. Add a case to `screenFor` in `src/App.tsx`. Set `focused: true` to hide the phone tab bar.
4. For a quieter tool, add it to `moreItems` in `src/shell/navItems.ts`. It then appears in the desktop sidebar and on the More page.
5. Put styles in `src/styles/screens.css`, using tokens such as `var(--card)` and `var(--sp-4)`.

### A new kind of saved data

Encryption, the offline copy and sync come for free once the store knows the table:

1. Add the type in `src/data/types.ts` and list it in `Tables`.
2. Add its key in `keyOf` in `src/data/store.ts`. The key must be unique within the table, for example `(r) => r.id`.
3. Write a small module in `src/data/` with a hook to read and functions to change it:

```ts
// src/data/gratitude.ts (example)
import { store, useStore } from './store';
import { newId } from './types';

export function useGratitudes() {
  return useStore(() => store.all('gratitudes').sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function addGratitude(text: string) {
  store.put('gratitudes', { id: newId(), text, createdAt: new Date().toISOString() });
}
```

You don't need a database migration: the server only stores encrypted records, whatever their type.

### Server-side changes (rare)

These are only needed for features that must run on the server, like reminders:
- **Migrations** go in `everyday/supabase/migrations/` (a new timestamped file, never edit an applied one).
- **Edge Functions** go in `everyday/supabase/functions/`.
- The project owner applies them to the live project.

---

## 6. Ideas for what to build next

These aren't built yet:

- **Edit and delete journal entries.** Entries can only be added today.
- **Edit a habit.** Rename it, change its time of day, or turn its reminder on or off after creating it.
- **Choose the reminder time** for the daily nudge (it is fixed at 7pm today).
- **Import a backup.** Export to JSON exists; reading the file back in does not.
- **A first-run welcome** that briefly explains lessons, habits and the passphrase.
- **Lesson search** or "replay a random lesson" from past months.
- **Translations.** All text is English and written inline.
- **An end-to-end test against a Supabase branch,** so real sign-in and sync are covered automatically too.
- **A custom domain,** for Netlify and for the Google sign-in screen, which currently names the Supabase project.

Each of these fits the patterns in section 5. Check the design boards in `design/` for the visual language before inventing new UI.

---

## 7. Sending your changes

1. Make a branch: `git checkout -b feature/edit-journal-entries`.
2. Make small commits with clear messages.
3. Run `npm test`, `npm run build` and `npm run test:e2e`.
4. Push the branch and open a **pull request** on GitHub. Describe what changed and how you tested it, and add a screenshot for UI changes.
5. The project owner reviews and merges, then runs `npm run deploy` to publish.

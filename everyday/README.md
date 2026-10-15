# Everyday

A calm self-development web app. React + TypeScript + Vite, installable as a PWA.
Data is end-to-end encrypted on the device and stored in Supabase; an encrypted copy
on the device keeps the app working offline.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # streak and encryption tests (Node's built-in runner)
npm run build      # production build in dist/, with service worker
npm run preview    # serve dist/ at http://localhost:4173
```

While `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` is empty, development uses a **fake cloud**
in localStorage: the "magic link" signs in at once, so every flow can be tried. Production builds
never include it.

In development only:
- `http://localhost:5173/?demo` loads the sample data from the design boards into the signed-in account.
- A dashed toolbar at the bottom of each page switches theme and loads or clears demo data.

## Hosting

Live at **https://everyday-quiet-mornings.netlify.app** (Netlify, project `everyday-quiet-mornings`).

```bash
npm run deploy     # build, then publish dist/ to production
```

- Deploys run from this machine with the Netlify CLI (log in once with `npx netlify-cli login`),
  because lesson content lives in `../data` next to this folder.
- `netlify.toml` sets the security headers (a strict Content Security Policy that only allows this
  app and the Supabase project) and caching (no-cache for the page, manifest and service worker so
  updates arrive; a year for fingerprinted assets).
- Team login protection is off for this project, so the site is public.
- Netlify adds a "Powered by Netlify" badge to published sites. The security policy blocks its
  script and `base.css` hides its frame, which would otherwise sit over the phone tab bar.
- After adding a custom domain, add it to Supabase **Authentication → URL Configuration** too.

## How the data is protected

- Sign in with an email magic link (Supabase Auth).
- The first time, you choose a **passphrase**. A random master secret is encrypted with it
  (PBKDF2-SHA-256, 600,000 rounds, AES-GCM) and only that wrapped copy goes to Supabase (`vaults`).
- Every record is encrypted with AES-GCM before it leaves the device. Its id is an HMAC, so the
  server sees no dates, names or text, only ciphertext and when each record changed (`records`).
- On this device the master secret is wrapped by a browser key that cannot be exported, or, with
  **PIN lock** on, by the PIN. A forgotten PIN can be replaced by entering the passphrase.
  A forgotten passphrase cannot be recovered by anyone; the app offers to start over.
- Reminders: the server knows an hour, a time zone and whether today is done. Habit names travel
  encrypted and are decrypted by the device's service worker.

## Supabase setup (once)

Project: `raefbogputkvicevfrwa`. With the Supabase MCP server connected, Claude can do steps 1 to 3.

1. **Database**: apply `supabase/migrations/20261014000000_everyday.sql`.
2. **Functions**: deploy `supabase/functions/send-reminders` (verify JWT **off**) and
   `supabase/functions/delete-account` (verify JWT **on**).
3. **App settings**: put the project's publishable (anon) key in `.env.local` as
   `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. **Function secrets** (Dashboard → Edge Functions → Secrets): add the four values from
   `supabase/.env.secrets`. Change `VAPID_SUBJECT` to a `mailto:` address you own.
5. **Reminder schedule**: put the `CRON_SECRET` value into `supabase/cron.sql`, run it in the SQL
   editor, then remove the value from the file again.
6. **Auth URLs** (Dashboard → Authentication → URL configuration): add `http://localhost:5173`,
   `http://localhost:4173` and your production URL as redirect URLs, so magic links come back to the app.

`.env.local` and `supabase/.env.secrets` are git-ignored. The VAPID private key and the cron secret
must never be committed.

## Where things live

- `src/styles/tokens.css`: copied unchanged from `design/tokens.css`. App-level additions are in `base.css`.
- `../data/lessons.seed.json`: the only source of lesson content, read by `src/data/lessons.ts`.
- `src/data/streak.ts`: the only place for streak logic (one missed day is forgiven).
- `src/data/store.ts`: the decrypted data in memory. Screens read from here.
- `src/data/crypto.ts`, `keys.ts`: encryption and who holds the keys.
- `src/data/sync.ts`, `cache.ts`, `cloud.ts`: encrypted local cache and sync with Supabase.
- `src/data/session.ts`: sign in, passphrase, PIN, sign out, delete.
- `src/sw/sw.ts`: service worker (offline cache and push reminders).
- `supabase/`: migration, Edge Functions, cron schedule.
- `src/shell/`: tab bar (phone, under 768px), icon rail (tablet), sidebar (desktop, 1100px and up).
- `src/screens/`: one folder per screen.

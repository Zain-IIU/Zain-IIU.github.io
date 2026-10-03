# zain.github.io

Portfolio for Zain Ul Abideen — gameplay programmer. Games are shown as looping
captures inside iPhone 17 Pro Max frames that play on hover, and everything on
the shelf is edited from a password-protected panel at `/#/admin`.

**Stack:** Vite + React + TypeScript · Supabase (Postgres + Auth + Storage) ·
plain CSS with design tokens · deployed to GitHub Pages by Actions.

---

## Setup — about 20 minutes, once

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Any region near
   you; the free plan is fine.
2. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
   - Before running, change the email on the line marked
     `>>> CHANGE THIS to your email <<<` to the address you will sign in with.
     That one line is what separates you from everyone else on the internet.
3. Open **Authentication → Users → Add user**. Use that same email and pick a
   password. (There is no sign-up form in the app on purpose — exactly one
   account should exist.)

### 3. Point the app at it

```bash
cp .env.example .env
```

Fill in both values from **Project Settings → Data API** (the URL) and
**Project Settings → API Keys** (the `anon` / publishable key).

Both are public values. They ship inside the JavaScript bundle, which is normal
and safe: the Row Level Security policies in `schema.sql` are what actually
protect your data. **Never** put the `service_role` key in this file.

### 4. Run it

```bash
npm run dev
```

- Site: <http://localhost:5173>
- Admin: <http://localhost:5173/#/admin>

The 12 seed games appear immediately, with empty phone screens. Open the admin,
pick a game, upload a capture — a poster frame is generated in the browser and
both files upload to Supabase Storage.

---

## Deploying to GitHub Pages

1. Push this to the `main` branch of `Zain-IIU/zain.github.io`.
2. Repo **Settings → Pages → Source → GitHub Actions**.
3. Repo **Settings → Secrets and variables → Actions**, add three secrets with
   the same values as your `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
4. Push. The workflow in `.github/workflows/deploy.yml` builds and publishes.

Live at `https://zain.github.io`, admin at `https://zain.github.io/#/admin`.

---

## Preparing captures

The phone on the shelf is 195 CSS px wide. Even on a 3× screen that is 585 real
pixels, so shipping 1080p is paying for pixels nobody can see — and bandwidth is
the one Supabase free-plan limit you can realistically hit (5 GB/month).

Record at 1080×2340 portrait, then ship this:

```bash
ffmpeg -i raw.mp4 -t 8 -vf "scale=600:-2,fps=24" -an \
       -c:v libx264 -crf 28 -preset slow -profile:v main \
       -movflags +faststart shelf.mp4
```

Aim for **400–700 KB per clip**. `-movflags +faststart` is what lets playback
begin before the file finishes downloading. You do not need to make a poster —
the admin panel grabs one from the video as you upload.

Your existing clips in the old repo are 512×512 square, so they get cropped at
the sides inside a portrait frame. Re-recording the titles you care about most
is the single biggest visual improvement available.

---

## How it fits together

```
src/
  main.tsx              HashRouter mount — swap to BrowserRouter on Vercel
  App.tsx               routes: / and /admin
  data/profile.ts       your bio, stats, experience — plain code, edit here
  lib/
    supabase.ts         client + the one admin email
    types.ts            Game, mirrors schema.sql
    useGames.ts         usePublishedGames (site) / useAllGames (admin)
  components/
    PhoneFrame.tsx      the device shell + all the video playback rules
    StoreBadges.tsx     badges that only render when a URL exists
    Shelf.tsx           featured block, filters, grid
    SiteChrome.tsx      top bar, hero, experience, footer
  admin/
    AdminApp.tsx        auth gate, games table, reorder, publish toggle
    GameEditor.tsx      the edit form
    Login.tsx           email + password
    upload.ts           capture upload + in-browser poster extraction
  styles/
    app.css             design tokens + site
    admin.css           dashboard
```

### Design tokens
All colour lives as CSS custom properties at the top of `src/styles/app.css`,
defined three times: light on bare `:root`, then dark for the OS preference,
then dark again for an explicit `[data-theme="dark"]`. Change a colour in all
three or it will only apply in one theme.

### The phone frame
Every measurement inside `PhoneFrame` is a `calc()` of `--w`, so the device
scales as one unit. Pass `width` as an absolute length or omit it entirely and
let the breakpoints in `app.css` size it — **never pass a percentage**, or the
corner radii resolve against the wrong box.

---

## Moving to Vercel later

1. Import the repo on Vercel, add the same three env vars.
2. `src/main.tsx`: `HashRouter` → `BrowserRouter`, so URLs become `/admin`.
3. Delete `.github/workflows/deploy.yml`.
4. Point `zain.github.io` at the new domain with a redirect.

Nothing else changes — the Supabase project, the data and the admin are
identical either way.

---

## Known next steps

- **Drag to reorder.** The arrows work; `@dnd-kit/sortable` would be nicer.
- **Experience from the database.** Currently `src/data/profile.ts`.
- **Per-game detail pages** at `/work/:slug`, with a longer write-up.
- **Orphaned media.** Deleting a game leaves its files in Storage. A cleanup
  pass, or just delete them in the Supabase Storage browser.
- **Keep the project awake.** A free Supabase project pauses after a week with
  no activity. If the site goes quiet, add a scheduled Action that pings it.

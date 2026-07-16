# ⚽ Girls Soccer Team Site

A mobile-first team hub for a youth soccer team, built with **Next.js** and
**Supabase**. Parents get a calendar with RSVPs, team news, a snack sign-up
schedule, a roster, and a shared photo gallery. Coaches get a private
**Coaches Corner** with approvals, roster management with private coaching
notes, lineups & game plans, private notes, and shared documents.

- **Framework:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Backend:** Supabase (Postgres + Auth + Storage) with Row Level Security
- **Hosting:** Vercel (free tier)

---

## Features

### For parents (login required, approved by a coach)
- **Home dashboard** — next event, your snack duties, latest news
- **Calendar** — games, practices, and events; RSVP per child
- **Team news** — announcements from coaches (with photos)
- **Snack schedule** — claim open snack slots
- **Roster** — first name + position(s) only (kid-safe)
- **Team Gallery** — any approved parent can upload game-day photos; you can delete your own, coaches can delete any
- **Account** — edit your name/phone and see your linked players

### Coaches Corner (coaches only — invisible to parents)
- **Approvals** — approve/deny new families, promote an assistant coach
- **Events** — full create/edit/delete, with the option to create a linked
  snack slot at the same time as the event
- **News / Snacks** — full create/edit/delete
- **Roster** — add players (with multiple positions each), link them to a
  parent account, upload photos, and keep private per-player coaching notes
- **Lineups & game plans** — formation + plan per game, with live RSVP headcount
- **Private notes** and **shared documents/links**

### How access works
- The **first person to sign up automatically becomes the head coach** (approved).
- Everyone after that signs up as a **pending parent** and must be approved by a
  coach in **Coaches Corner → Approvals**.
- A coach can promote an approved parent to **assistant coach** at any time.
- Privacy is enforced in the database (Row Level Security), not just the UI:
  parents can never read last names, coaching notes, or lineups.

---

## Setup

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once it's ready, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

### 2. Create the database schema
1. In Supabase, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and **Run**.
   This creates all tables, security policies, the storage bucket, and the
   sign-up/approval logic.
3. Paste the contents of [`supabase/migrations/0002_gallery.sql`](supabase/migrations/0002_gallery.sql)
   and **Run**. This adds the Team Gallery table and storage policies.
4. Paste the contents of [`supabase/migrations/0003_roster_updates.sql`](supabase/migrations/0003_roster_updates.sql)
   and **Run**. This moves player position to a multi-select list, drops
   jersey numbers, and replaces emergency contact/medical notes with a
   private coaching notes field.
5. (Optional) To start with sample events/news/snacks, run
   [`supabase/seed.sql`](supabase/seed.sql) the same way.

### 3. Configure email auth
In **Authentication → Providers → Email**, make sure Email is enabled. For the
easiest start you can turn **"Confirm email"** off (Authentication → Providers →
Email → *Confirm email*), so approved parents can sign in immediately. If you
leave it on, new users must click a confirmation link before signing in.

### 4. Run locally
```bash
cp .env.local.example .env.local     # then fill in the values
npm install
npm run dev
```
Fill `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_TEAM_NAME=Lightning FC        # your team name
NEXT_PUBLIC_SEASON=Fall 2026              # your season label
```
Open http://localhost:3000, tap **Request an account**, and sign up. Because
you're first, you become the head coach automatically.

> Want a specific person to be the head coach? Have **them** sign up first. To
> promote someone later, run this in the SQL editor:
> ```sql
> update public.profiles set role = 'coach', status = 'approved'
> where email = 'coach@example.com';
> ```

### 5. Deploy to Vercel
1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project** and import the repo.
3. Add the same environment variables (from `.env.local`) in the Vercel project
   settings.
4. Deploy. Add your custom domain if you have one.
5. In Supabase **Authentication → URL Configuration**, set the **Site URL** to
   your Vercel URL so confirmation/reset emails link correctly.

---

## Customizing the look
- **Team name / season:** `NEXT_PUBLIC_TEAM_NAME` and `NEXT_PUBLIC_SEASON`
  env vars (see `lib/site.ts`).
- **Colors (blue & green theme):** edit the `brand` colors in
  [`tailwind.config.ts`](tailwind.config.ts) — the whole site restyles from
  there.

---

## Project structure
```
app/
  (app)/            Protected area (requires an approved account)
    home, calendar, news, snacks, roster, account
    coaches/        Coaches Corner (requires role = coach)
  login, signup, pending, auth/signout
components/         Nav, forms, cards, RSVP + snack controls
lib/
  supabase/         Browser + server + middleware Supabase clients
  auth.ts           getCurrentProfile / requireApproved / requireCoach
  types.ts          Hand-written Database types
supabase/
  migrations/0001_init.sql   Schema, RLS, storage, triggers
  seed.sql                   Optional sample data
```

## Security notes
- All data access is guarded by **Row Level Security**. The app's `anon` key is
  safe to expose to the browser; it can only do what the policies allow.
- Snack claiming/releasing goes through `SECURITY DEFINER` functions so a parent
  can only claim an open slot or release their own.
- Kid-safe by design: last names, coaching notes, and lineups are readable
  only by coaches.

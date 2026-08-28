# TriLift

A fitness plan and tracker built around one specific programme: three 30-minute
full-body strength sessions a week, two bike sessions (one long and easy, one
hard), one swim, and a moderate calorie deficit — with heavy slow calf raises in
every strength session for Achilles resilience, and no running.

Cardio logs itself from Strava (which Garmin feeds). Strength is logged by
tapping through pre-filled sets. Weight, photos and measurements go in once a
week. Everything else the app works out for you.

## What's in it

| Screen | What it does |
|---|---|
| **Today** | Weight vs. goal with a trend chart, week streak, calf-load streak, recent PRs, a written weekly recap, and the plan laid out |
| **Strength** | The calf-raise progression chart, plus full session history with estimated 1RMs and Achilles pain flags |
| **Cardio** | Strava rides and swims, power and pace trends, and FTP-derived interval targets |
| **Body** | Weight trend, weekly check-ins with private progress photos, and the AI photo read |
| **Fuel** | Calorie and protein targets computed from your profile, and a two-number daily log |

Plus a strength logger that pre-fills every set from last time and rotates
A → B → C for you, and an onboarding flow that gets the whole thing running from
five numbers.

### The parts worth knowing about

- **Calf raises are tracked as their own metric.** Every session template
  includes a straight-knee and a bent-knee variation at a heavy, slow tempo. The
  app charts the top load per session and counts a "progression streak" of
  sessions where it held or went up. Nothing plyometric is anywhere in the plan.
- **The scale is smoothed.** Raw weigh-ins show as dots; the line is an
  exponentially weighted average, and the rate of change comes from a
  least-squares fit over the trailing month — so one bad morning doesn't read as
  a setback.
- **PRs are detected, not entered.** Estimated 1RM per lift (Epley), normalised
  power on rides over 20 minutes, and pace per 100m on swims over 400m. The
  first time you log something is a baseline, not a PR.
- **The weekly recap is generated on-device** from data already loaded — no API
  call, works offline, and says the same thing every time for the same numbers.
- **Progress photos are private.** They live in a non-public Supabase Storage
  bucket keyed by user id, and are read through short-lived signed URLs.
- **Strava tokens never touch the phone.** They live in a table with no RLS
  policies at all, reachable only by the edge functions running as the service
  role. The app sees a token-free view for connection status and calls a
  security-definer function to disconnect.

## Stack

- **App**: React Native via Expo (SDK 57) with Expo Router, TypeScript, React
  Query, and hand-rolled SVG charts
- **Backend**: Supabase — Postgres with row-level security, Storage for photos,
  Edge Functions for anything holding a secret
- **Integrations**: Strava (OAuth + activity sync), Anthropic API (progress
  photo analysis)

## Getting started

```bash
npm install
cp .env.example .env      # fill in your Supabase URL and anon key
npm start                 # then scan the QR code with Expo Go
```

The full backend walkthrough — creating the Supabase project, running the
migration, registering the Strava app, deploying the functions — is in
**[docs/SETUP.md](docs/SETUP.md)**. Until the environment variables are set the
app shows a setup screen rather than failing at a network call.

```bash
npm run typecheck         # tsc --noEmit
npm run web               # run in a browser, useful for quick UI iteration
```

## Layout

```
app/                      Expo Router screens
  (tabs)/                 Today, Strength, Cardio, Body, Fuel
  log-strength.tsx        the set-by-set logger
  check-in.tsx            weekly weight + photo + measurements
src/
  api/                    React Query hooks over Supabase
  components/             UI kit, icon set, TrendChart
  data/plan.ts            the training programme, as data
  lib/                    client, theme, units, formatting, DB types
  logic/                  targets, trend maths, streaks, PR detection, recap
supabase/
  migrations/             schema, RLS policies, storage policies
  functions/              strava-oauth, strava-sync, analyze-photo
```

## A note on the photo analysis

The AI read is directional guidance, not measurement. Lighting, pose and camera
angle move the apparent result far more than a training block does, and the app
says so in the UI. Photos are sent to the Anthropic API from the Edge Function —
never from the device — and the API key lives as a function secret.

## Not built yet

- Running is deliberately excluded while the Achilles is a question mark. When
  it goes back in, it wants its own load-management view rather than being
  folded into the cardio tab.
- Nutrition is intentionally two numbers a day, not a food diary.
- Push notifications, watch integration, and TestFlight distribution (the last
  needs a paid Apple Developer account) are all still open.

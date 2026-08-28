# Setting up TriLift

Four things to stand up: a Supabase project, a Strava app, an Anthropic API key,
and the app itself. Roughly 30 minutes end to end. Nothing here costs money
except Anthropic API usage (cents per photo read).

---

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com). Note the **Project
   URL** and **anon / publishable key** from *Project Settings → API*.
2. Install the CLI and link the project:

   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

3. Apply the schema:

   ```bash
   supabase db push
   ```

   This creates every table, all row-level security policies, the
   `progress-photos` storage bucket and its policies, and a trigger that gives
   each new signup a profile row.

4. In *Authentication → Providers*, make sure **Email** is enabled. For a
   single-user app it is easiest to turn **Confirm email** off, under
   *Authentication → Sign In / Providers → Email*.

### What the security model is doing

Every table is per-user and gated by `auth.uid() = user_id`, so one account can
never read another's rows. Two deliberate exceptions:

- `strava_activities` is **read-only to the client** — only the sync function,
  running as the service role, writes to it.
- `strava_accounts` has **no policies at all**. Even with table grants, RLS with
  zero policies returns zero rows, so OAuth tokens cannot be selected from a
  signed-in client. The app reads the `strava_connection` view (which excludes
  the token columns and filters to your own row) and calls the
  `disconnect_strava()` function to unlink.

---

## 2. App environment

```bash
cp .env.example .env
```

Fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

`EXPO_PUBLIC_*` variables are inlined into the app bundle, so only ever put
values there that are safe to ship inside an app binary. The anon key is — it is
gated by row-level security. A service-role key is not, and must never appear
in this file.

```bash
npm install
npm start
```

Scan the QR code with **Expo Go** on your iPhone. No Apple Developer account is
needed for this; you only need the $99/year account later, for a persistent
device install or TestFlight.

---

## 3. Strava

### Register the app

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api) and
   create an application.
2. Set **Authorization Callback Domain** to your Supabase functions domain:
   `<project-ref>.supabase.co`
3. Note the **Client ID** and **Client Secret**.

### Confirm Garmin is feeding Strava

On Garmin Connect, check *Settings → Partner Connections → Strava* is connected.
TriLift reads from Strava only — if Garmin is not syncing there, nothing arrives.

### Deploy the functions and set their secrets

```bash
supabase functions deploy strava-oauth
supabase functions deploy strava-sync

supabase secrets set STRAVA_CLIENT_ID=<client id>
supabase secrets set STRAVA_CLIENT_SECRET=<client secret>
supabase secrets set STRAVA_REDIRECT_URI=trilift://strava-callback
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
into Edge Functions automatically — you do not set those.

> **On the redirect URI.** `trilift://strava-callback` is the app's deep link and
> is what Expo Go's auth session expects when you run a standalone build. While
> developing in Expo Go the scheme differs, and Strava will reject a redirect it
> has not been told about. If the consent screen errors, run
> `npx expo start` and use the printed `exp://...` URL as the redirect, or build
> a development client (`npx expo run:ios`) so the `trilift://` scheme is real.

Then open the **Cardio** tab in the app and hit *Connect*. First sync pulls 180
days of history; later syncs only fetch what is new.

---

## 4. Anthropic API (progress photo analysis)

1. Create a key at [console.anthropic.com](https://console.anthropic.com).
2. Deploy the function and give it the key:

   ```bash
   supabase functions deploy analyze-photo
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

The key lives only as a function secret — it is never in the app bundle, and the
device never calls Anthropic directly. The function pulls your photo from
Storage, sends it and the previous photo to the API, and writes the result back
to `photo_analyses`.

If you would rather not use this feature at all, simply skip this step: the
button on the **Body** tab will report the missing key and nothing else breaks.

---

## Verifying it works

| Check | Where |
|---|---|
| Sign up, land on onboarding | app launch |
| A `profiles` row appeared | Supabase → Table Editor → `profiles` |
| Check-in with a photo saves | Body tab → Weekly check-in |
| Photo is private | Storage → `progress-photos` → the file's URL is not public |
| Strava connects and syncs | Cardio tab → Connect → Sync now |
| Targets appear | Fuel tab (needs date of birth + height + a logged weight) |

## Troubleshooting

**"Almost there" setup screen won't go away** — `.env` is missing or the dev
server has not been restarted since it was created. Expo reads env vars at start.

**Strava sync says "Strava is not connected"** — the OAuth exchange did not
complete. Check the `strava-oauth` function logs in the Supabase dashboard.

**Sync returns a 429** — Strava's rate limit (200 requests per 15 minutes). Wait
and try again; the sync is incremental, so nothing is lost.

**Photo analysis returns 502** — the model returned something that was not JSON.
The function logs the raw response; this is usually transient.

**Charts are empty** — they need at least one data point. Weight needs a
check-in, calf progression needs a logged strength session, power and pace need
synced Strava activities of a qualifying length.

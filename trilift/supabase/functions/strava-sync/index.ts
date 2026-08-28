import { HttpError, adminClient, json, requireEnv, requireUser, serveJson } from '../_shared/utils.ts';

type StravaActivity = Record<string, unknown> & {
  id: number;
  type: string;
  start_date: string;
};

/**
 * Pulls recent Strava activities into strava_activities.
 *
 * Refreshes the access token first if it is close to expiry — the device never
 * has to know a token existed.
 */
Deno.serve(
  serveJson(async (req) => {
    const user = await requireUser(req);
    const admin = adminClient();

    const { data: account, error: accountError } = await admin
      .from('strava_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (accountError) throw new HttpError(500, accountError.message);
    if (!account) throw new HttpError(400, 'Strava is not connected for this account');

    let accessToken = account.access_token as string;

    // Refresh a minute early rather than racing the expiry.
    if (new Date(account.expires_at).getTime() - Date.now() < 60_000) {
      const refreshed = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: requireEnv('STRAVA_CLIENT_ID'),
          client_secret: requireEnv('STRAVA_CLIENT_SECRET'),
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
        }),
      });

      if (!refreshed.ok) {
        throw new HttpError(502, `Could not refresh the Strava token: ${await refreshed.text()}`);
      }

      const token = await refreshed.json();
      accessToken = token.access_token;

      await admin
        .from('strava_accounts')
        .update({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: new Date(token.expires_at * 1000).toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Only fetch what we have not seen. On a first sync, go back 180 days.
    const { data: newest } = await admin
      .from('strava_activities')
      .select('start_date')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const after = newest
      ? Math.floor(new Date(newest.start_date).getTime() / 1000)
      : Math.floor((Date.now() - 180 * 86_400_000) / 1000);

    const activities: StravaActivity[] = [];
    // Strava pages at 200; walk until a short page comes back.
    for (let page = 1; page <= 5; page += 1) {
      const url = new URL('https://www.strava.com/api/v3/athlete/activities');
      url.searchParams.set('after', String(after));
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', String(page));

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 429) {
        throw new HttpError(429, 'Strava rate limit reached — try again in a few minutes.');
      }
      if (!response.ok) {
        throw new HttpError(502, `Strava returned ${response.status}: ${await response.text()}`);
      }

      const page_ = (await response.json()) as StravaActivity[];
      activities.push(...page_);
      if (page_.length < 100) break;
    }

    if (activities.length === 0) {
      await admin
        .from('strava_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user.id);
      return json({ imported: 0 });
    }

    const rows = activities.map((a) => ({
      id: a.id,
      user_id: user.id,
      type: a.type,
      sport_type: (a.sport_type as string) ?? null,
      name: (a.name as string) ?? null,
      start_date: a.start_date,
      elapsed_time_s: (a.elapsed_time as number) ?? null,
      moving_time_s: (a.moving_time as number) ?? null,
      distance_m: (a.distance as number) ?? null,
      total_elevation_gain_m: (a.total_elevation_gain as number) ?? null,
      average_watts: (a.average_watts as number) ?? null,
      weighted_average_watts: (a.weighted_average_watts as number) ?? null,
      max_watts: (a.max_watts as number) ?? null,
      average_heartrate: (a.average_heartrate as number) ?? null,
      max_heartrate: (a.max_heartrate as number) ?? null,
      suffer_score: (a.suffer_score as number) ?? null,
      kilojoules: (a.kilojoules as number) ?? null,
      raw: a,
      synced_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await admin
      .from('strava_activities')
      .upsert(rows, { onConflict: 'id' });

    if (upsertError) throw new HttpError(500, upsertError.message);

    await admin
      .from('strava_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return json({ imported: rows.length });
  }),
);

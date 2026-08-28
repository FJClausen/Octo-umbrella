import { HttpError, adminClient, json, requireEnv, requireUser, serveJson } from '../_shared/utils.ts';

/**
 * Strava OAuth, server side.
 *
 *   { action: 'authorize' }              -> { url }  the consent URL to open
 *   { action: 'exchange', code, scope }  -> { ok }   swaps the code for tokens
 *
 * The client secret and both tokens live here and in the strava_accounts table,
 * which has no select policy — so nothing Strava-related is ever readable from
 * the device.
 */
Deno.serve(
  serveJson(async (req) => {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    const clientId = requireEnv('STRAVA_CLIENT_ID');
    const redirectUri = requireEnv('STRAVA_REDIRECT_URI');

    if (action === 'authorize') {
      const url = new URL('https://www.strava.com/oauth/authorize');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('approval_prompt', 'auto');
      // activity:read_all also covers activities the athlete marked private.
      url.searchParams.set('scope', 'read,activity:read_all,profile:read_all');
      return json({ url: url.toString() });
    }

    if (action === 'exchange') {
      if (!body.code) throw new HttpError(400, 'Missing authorisation code');

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: requireEnv('STRAVA_CLIENT_SECRET'),
          code: body.code,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new HttpError(502, `Strava rejected the code: ${await response.text()}`);
      }

      const token = await response.json();
      const athlete = token.athlete ?? {};

      const { error } = await adminClient()
        .from('strava_accounts')
        .upsert({
          user_id: user.id,
          athlete_id: athlete.id ?? null,
          athlete_name: [athlete.firstname, athlete.lastname].filter(Boolean).join(' ') || null,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: new Date(token.expires_at * 1000).toISOString(),
          scope: body.scope ?? null,
        });

      if (error) throw new HttpError(500, error.message);
      return json({ ok: true });
    }

    throw new HttpError(400, `Unknown action: ${action}`);
  }),
);

// ---------------------------------------------------------------------------
// THE SHARED PODIUM
//
// Times are always kept on the device, so the podium works with no network and
// with nothing configured. If a Supabase project is set up in config.js, each
// finish is also posted there and the podium shows everyone's runs instead of
// just this phone's.
//
// Every call gives up quickly and quietly. A slow or missing network must never
// hold up the ending -- the worst case is she sees her own times.
// ---------------------------------------------------------------------------

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const TABLE = 'asha_scores';
const TIMEOUT_MS = 4000;

export const sharedEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function headers() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

// fetch that always settles, so the finale never waits on a bad connection
async function briefly(url, options) {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: stop.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Posts one finished run. Returns true if it landed.
export async function submitScore(entry) {
  if (!sharedEnabled) return false;
  try {
    const res = await briefly(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'return=minimal' },
      body: JSON.stringify({
        name: String(entry.name || 'Asha').slice(0, 24),
        total_ms: Math.round(entry.total),
        falls: entry.falls | 0,
        hearts: entry.hearts | 0,
      }),
    });
    return res.ok;
  } catch (e) {
    return false; // offline, blocked, or misconfigured -- local podium still shows
  }
}

// The fastest runs from everyone, or null if they cannot be reached.
export async function fetchTop(limit = 3) {
  if (!sharedEnabled) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}` +
      `?select=name,total_ms,falls,hearts&order=total_ms.asc&limit=${limit}`;
    const res = await briefly(url, { headers: headers() });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.map((r) => ({
      name: r.name,
      total: r.total_ms,
      falls: r.falls,
      hearts: r.hearts,
    }));
  } catch (e) {
    return null;
  }
}

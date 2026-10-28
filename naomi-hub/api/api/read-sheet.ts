import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clientKey, hasAppSecret, RateLimiter } from '../lib/http.js';
import { readSheet, ReadSheetError, ReadSheetRequest } from '../lib/readSheet.js';

const perDevice = new RateLimiter(20, 10 * 60 * 1000);
const overall = new RateLimiter(200, 24 * 60 * 60 * 1000);
const client = new Anthropic();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!hasAppSecret(req)) return res.status(401).json({ error: 'unauthorized' });
  if (!perDevice.allow(clientKey(req)) || !overall.allow('all')) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  const parsed = ReadSheetRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' });

  try {
    const transcription = await readSheet(client, parsed.data);
    return res.status(200).json(transcription);
  } catch (e) {
    if (e instanceof ReadSheetError) return res.status(422).json({ error: 'unreadable' });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'rate_limited' });
    if (e instanceof Anthropic.APIError) {
      console.error('Anthropic API error', e.status, e.message);
      return res.status(502).json({ error: 'upstream' });
    }
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
}

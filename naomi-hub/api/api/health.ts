import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY), appSecret: Boolean(process.env.APP_SECRET) });
}

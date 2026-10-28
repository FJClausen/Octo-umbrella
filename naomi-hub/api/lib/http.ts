import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

/** Constant-time check of the x-app-secret header against APP_SECRET. */
export function hasAppSecret(req: VercelRequest): boolean {
  const expected = process.env.APP_SECRET;
  const got = req.headers['x-app-secret'];
  if (!expected || typeof got !== 'string') return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Fixed-window limiter kept in function memory. It resets when Vercel starts a
 * new instance, so it is a brake against runaway loops, not a hard quota; the
 * Anthropic spend cap is the hard limit.
 */
export class RateLimiter {
  private hits = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || now - entry.start >= this.windowMs) {
      this.hits.set(key, { start: now, count: 1 });
      return true;
    }
    entry.count++;
    return entry.count <= this.limit;
  }
}

export function clientKey(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  return ip || 'unknown';
}

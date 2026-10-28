import type Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest } from '@vercel/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientKey, hasAppSecret, RateLimiter } from './http.js';
import { readSheet, ReadSheetError, ReadSheetRequest } from './readSheet.js';

const req = (headers: Record<string, string>) => ({ headers }) as unknown as VercelRequest;
const image = 'A'.repeat(200);

describe('app secret', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('accepts only the exact secret', () => {
    vi.stubEnv('APP_SECRET', 's3cret');
    expect(hasAppSecret(req({ 'x-app-secret': 's3cret' }))).toBe(true);
    expect(hasAppSecret(req({ 'x-app-secret': 's3cre' }))).toBe(false);
    expect(hasAppSecret(req({}))).toBe(false);
  });

  it('rejects everything when APP_SECRET is unset', () => {
    vi.stubEnv('APP_SECRET', '');
    expect(hasAppSecret(req({ 'x-app-secret': '' }))).toBe(false);
  });
});

describe('rate limiter', () => {
  it('allows the limit per window, then resets', () => {
    const rl = new RateLimiter(2, 1000);
    expect([rl.allow('a', 0), rl.allow('a', 1), rl.allow('a', 2)]).toEqual([true, true, false]);
    expect(rl.allow('b', 2)).toBe(true);
    expect(rl.allow('a', 1000)).toBe(true);
  });

  it('keys on the first forwarded address', () => {
    expect(clientKey(req({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
  });
});

describe('request schema', () => {
  it('accepts a sudoku request and rejects unknown kinds', () => {
    expect(ReadSheetRequest.safeParse({ kind: 'sudoku', image, rows: [9, 9, 9, 9, 9, 9, 9, 9, 9] }).success).toBe(true);
    expect(ReadSheetRequest.safeParse({ kind: 'crossword', image, rows: [5] }).success).toBe(false);
    expect(ReadSheetRequest.safeParse({ kind: 'sudoku', image: 'x', rows: [9] }).success).toBe(false);
  });
});

function fakeClient(response: object) {
  const parse = vi.fn().mockResolvedValue(response);
  return { client: { beta: { messages: { parse } } } as unknown as Anthropic, parse };
}

describe('readSheet', () => {
  const transcription = { photo: 'ok', sheetCode: 'K7Q3', answerKeyPage: false, rows: [['1', '2'], ['2', '1']] };

  it('sends the image and returns the parsed transcription', async () => {
    const { client, parse } = fakeClient({ stop_reason: 'end_turn', parsed_output: transcription });
    const out = await readSheet(client, { kind: 'kenken', image, rows: [2, 2] });
    expect(out).toEqual(transcription);
    const params = parse.mock.calls[0][0];
    expect(params.model).toBe('claude-opus-5-5');
    expect(params.fallbacks).toBe('default');
    expect(params.messages[0].content[0].source.data).toBe(image);
    expect(params.messages[0].content[1].text).toMatch(/ignore those/);
  });

  it('describes the logic-grid answer table', async () => {
    const { client, parse } = fakeClient({ stop_reason: 'end_turn', parsed_output: transcription });
    await readSheet(client, { kind: 'logic-grid', image, rows: [3, 3], columns: ['Isla', 'Jonas'] });
    expect(parse.mock.calls[0][0].messages[0].content[1].text).toMatch(/My answers.*Isla, Jonas.*category name first/s);
  });

  it('throws ReadSheetError on refusal or missing output', async () => {
    await expect(readSheet(fakeClient({ stop_reason: 'refusal', parsed_output: null }).client, { kind: 'chess', image, rows: [1] })).rejects.toBeInstanceOf(ReadSheetError);
    await expect(readSheet(fakeClient({ stop_reason: 'end_turn', parsed_output: null }).client, { kind: 'chess', image, rows: [1] })).rejects.toBeInstanceOf(ReadSheetError);
  });
});

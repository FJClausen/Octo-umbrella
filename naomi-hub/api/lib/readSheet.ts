import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

export const SHEET_KINDS = ['sudoku', 'kenken', 'pyramid', 'magic-square', 'logic-grid', 'chess'] as const;

export const ReadSheetRequest = z.object({
  kind: z.enum(SHEET_KINDS),
  /** JPEG, base64 without a data: prefix. */
  image: z.string().min(100).max(6_000_000),
  /** Number of cells in each row the app expects, top to bottom. */
  rows: z.array(z.number().int().min(1).max(12)).min(1).max(12),
  /** Names across the top of the logic-grid answer table, left to right. */
  columns: z.array(z.string().max(40)).max(6).optional(),
});
export type ReadSheetRequest = z.infer<typeof ReadSheetRequest>;

export const Transcription = z.object({
  photo: z.enum(['ok', 'blurry', 'cut_off', 'not_a_worksheet']),
  /** The 4-character code printed after "Sheet" in the top corner, or "" if none is visible. */
  sheetCode: z.string(),
  /** True if the page is titled "Answer key". */
  answerKeyPage: z.boolean(),
  /** One array per row, top to bottom; each entry is what is written in that cell. */
  rows: z.array(z.array(z.string())),
});
export type Transcription = z.infer<typeof Transcription>;

const SYSTEM = `You read photos of printed puzzle worksheets that a 9-year-old has filled in by hand with a pencil.
Your only job is to transcribe what is on the paper. Do not solve the puzzle, do not check answers, and do not fix anything the child wrote: a wrong answer must be transcribed as written.
Rules for every cell:
- Write exactly the digits, words or chess move the cell contains, whether printed or handwritten.
- An empty cell is "".
- If something is written but you cannot tell what it is, use "?".
- If the child crossed something out and wrote a replacement, transcribe the replacement.
Ignore pencil notes in the margins and small candidate digits written in a corner of a cell; transcribe only the main entry.
Report photo quality honestly: "blurry" or "cut_off" if any requested cell cannot be read for that reason.`;

function instructions(req: ReadSheetRequest): string {
  const shape = req.rows.map((n, i) => `row ${i + 1}: ${n} cells`).join('; ');
  switch (req.kind) {
    case 'sudoku':
    case 'magic-square':
      return `The worksheet has one square grid. Transcribe it row by row (${shape}).`;
    case 'kenken':
      return `The worksheet has one square KenKen grid. Each cage shows a small printed target like "12×" or "2÷" in its top-left corner: ignore those. Transcribe only the large number in each cell, row by row (${shape}).`;
    case 'pyramid':
      return `The worksheet has a number pyramid of bricks. Transcribe it from the top brick down to the bottom row, each row left to right (${shape}).`;
    case 'logic-grid':
      return `Ignore the clues and the tick grids. Find the table headed "My answers". Its top row lists the names ${(req.columns ?? []).join(', ')}; each row below starts with a printed category name. Transcribe those category rows top to bottom (${shape}): the category name first, then the answer written under each name, left to right.`;
    case 'chess':
      return `The worksheet has ${req.rows.length} chess diagrams, numbered 1 to ${req.rows.length}. Under each one is a line "My move: ____". Return one row per diagram in number order, each containing the single move written on that line, as written (for example "Qh7", "Rxe8#", "Nf3+").`;
  }
}

export async function readSheet(client: Anthropic, req: ReadSheetRequest): Promise<Transcription> {
  const response = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(Transcription) },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: req.image } },
          { type: 'text', text: instructions(req) },
        ],
      },
    ],
  });
  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new ReadSheetError('unreadable');
  }
  return response.parsed_output;
}

export class ReadSheetError extends Error {}

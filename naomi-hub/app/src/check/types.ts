import type { Difficulty } from '../puzzles';

/** What the app needs to check a photo of a printed sheet. Stored when the sheet is printed. */
export type CheckSpec =
  | {
      type: 'grid';
      /** Rows top to bottom as printed; each entry is the correct value. */
      solution: number[][];
      /** Same shape: true where the number was printed on the sheet. */
      given: boolean[][];
    }
  | {
      type: 'logic';
      /** Names across the top of the "My answers" table, left to right. */
      people: string[];
      /** One table row per category, top to bottom. */
      categories: string[];
      /** options[c] lists the possible answers for category c. */
      options: string[][];
      /** answers[p][c] is the correct answer for person p in category c. */
      answers: string[][];
    }
  | {
      type: 'chess';
      /** For each diagram: the position she sees and the first winning move (UCI). */
      puzzles: { fen: string; solution: string; mateInOne: boolean }[];
    };

/** API kinds understood by /api/read-sheet. */
export type ReadKind = 'sudoku' | 'kenken' | 'pyramid' | 'magic-square' | 'logic-grid' | 'chess';

export interface SheetRecord {
  id: string;
  code: string;
  title: string;
  readKind: ReadKind;
  level: Difficulty | 'chess';
  createdAt: string;
  spec: CheckSpec;
  status: 'open' | 'passed';
  attempts: number;
}

/** Response of /api/read-sheet. */
export interface Transcription {
  photo: 'ok' | 'blurry' | 'cut_off' | 'not_a_worksheet';
  sheetCode: string;
  answerKeyPage: boolean;
  rows: string[][];
}

export type CheckStatus =
  | 'pass'
  | 'wrong'
  | 'incomplete'
  | 'unclear'
  | 'wrong-sheet'
  | 'no-code'
  | 'answer-key'
  | 'not-a-sheet';

export interface CheckResult {
  status: CheckStatus;
  correct: number;
  wrong: number;
  empty: number;
  unclear: number;
  /** Answers checked. */
  total: number;
  /** Correct answers needed to pass. */
  needed: number;
}

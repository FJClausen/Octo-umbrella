import { addSheet } from '../store/sheets';
import { newSheetCode } from './code';
import type { CheckSpec, ReadKind, SheetRecord } from './types';

/** Saves a printed sheet so it can be checked by photo later. */
export async function registerSheet(fields: {
  code: string;
  title: string;
  readKind: ReadKind;
  level: SheetRecord['level'];
  spec: CheckSpec;
}): Promise<SheetRecord> {
  const sheet: SheetRecord = {
    ...fields,
    id: `${Date.now().toString(36)}-${fields.code}`,
    createdAt: new Date().toISOString(),
    status: 'open',
    attempts: 0,
  };
  await addSheet(sheet);
  return sheet;
}

export { newSheetCode };

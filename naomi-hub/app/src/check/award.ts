import { sheetReward } from '../tickets/rules';
import { awardPoints, POINTS } from '../store/points';
import { updateSheet } from '../store/sheets';
import { earnTickets } from '../store/tickets';
import type { SheetRecord } from './types';

/** Marks a sheet as done and pays out tickets and points. Returns tickets actually added. */
export async function awardSheet(sheet: SheetRecord, how: 'photo' | 'parent'): Promise<{ tickets: number; points: number }> {
  await updateSheet(sheet.id, { status: 'passed' });
  const { added } = await earnTickets(sheetReward(sheet.level));
  await awardPoints(sheet.readKind === 'chess' ? 'Chess sheet' : 'Puzzle Printer', 'desk', `${sheet.title} (${how === 'photo' ? 'checked by photo' : 'parent approved'})`);
  return { tickets: added, points: POINTS.desk };
}

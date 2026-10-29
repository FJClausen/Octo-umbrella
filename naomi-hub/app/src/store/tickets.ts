import { DEFAULT_SETTINGS, earn, rollDay, spend, TICKETS_ENABLED, type TicketSettings, type TicketState } from '../tickets/rules';
import { todayKey } from './chessProgress';
import { loadJson, saveJson } from './storage';

const STATE_KEY = 'tickets-v1';
const SETTINGS_KEY = 'ticket-settings-v1';

/** Saved settings; the gate always reads as off while TICKETS_ENABLED is false. */
export async function loadTicketSettings(): Promise<TicketSettings> {
  const s = await loadJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  return TICKETS_ENABLED ? s : { ...s, enabled: false };
}

export async function saveTicketSettings(s: TicketSettings): Promise<void> {
  await saveJson(SETTINGS_KEY, s);
}

/** Current balance, with today's free ticket applied. */
export async function loadTickets(): Promise<TicketState> {
  const settings = await loadTicketSettings();
  const stored = await loadJson<TicketState>(STATE_KEY, { balance: 0, day: '' });
  const rolled = rollDay(stored, settings, todayKey());
  if (rolled !== stored) await saveJson(STATE_KEY, rolled);
  return rolled;
}

export async function earnTickets(n: number): Promise<{ state: TicketState; added: number }> {
  if (!TICKETS_ENABLED) return { state: await loadTickets(), added: 0 };
  const result = earn(await loadTickets(), await loadTicketSettings(), n);
  await saveJson(STATE_KEY, result.state);
  return result;
}

/** Spends `cost` tickets if she has them. Returns false (and changes nothing) if not. */
export async function spendTickets(cost: number): Promise<boolean> {
  const next = spend(await loadTickets(), await loadTicketSettings(), cost);
  if (!next) return false;
  await saveJson(STATE_KEY, next);
  return true;
}

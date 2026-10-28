export interface TicketSettings {
  /** Off = every on-screen activity is free (holidays, sick days). */
  enabled: boolean;
  /** Tickets granted at the start of each day. */
  dailyFree: number;
  /** Most tickets she can hold. */
  cap: number;
  /** Unused tickets carried into the next day. */
  rollover: number;
  /** Cost of one chess round or daily puzzle. */
  chessCost: number;
}

export const DEFAULT_SETTINGS: TicketSettings = { enabled: true, dailyFree: 1, cap: 3, rollover: 1, chessCost: 1 };

export interface TicketState {
  balance: number;
  /** Local date (YYYY-MM-DD) the balance belongs to. */
  day: string;
}

/** Applies the overnight rules once per new day: keep up to `rollover`, add the free ticket(s). */
export function rollDay(state: TicketState, s: TicketSettings, today: string): TicketState {
  if (state.day === today) return state;
  return { day: today, balance: Math.min(s.cap, Math.min(state.balance, s.rollover) + s.dailyFree) };
}

export function earn(state: TicketState, s: TicketSettings, n: number): { state: TicketState; added: number } {
  const balance = Math.min(s.cap, state.balance + n);
  return { state: { ...state, balance }, added: balance - state.balance };
}

/** Returns the new state, or null if she can't afford it. Free when the gate is off. */
export function spend(state: TicketState, s: TicketSettings, cost: number): TicketState | null {
  if (!s.enabled || cost <= 0) return state;
  if (state.balance < cost) return null;
  return { ...state, balance: state.balance - cost };
}

export function canAfford(state: TicketState, s: TicketSettings, cost: number): boolean {
  return spend(state, s, cost) !== null;
}

/** Tickets a checked sheet earns: Brain-buster sheets earn 2. */
export function sheetReward(level: string): number {
  return level === 'hard' ? 2 : 1;
}

import * as SecureStore from 'expo-secure-store';

const KEY = 'parent-pin';

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY)) !== null;
}

export async function setPin(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits');
  await SecureStore.setItemAsync(KEY, pin);
}

export async function checkPin(pin: string): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY)) === pin;
}

/** Parent unlock lasts a few minutes so the parent can change several settings. */
let unlockedUntil = 0;
export const UNLOCK_MS = 5 * 60 * 1000;

export function markUnlocked(): void {
  unlockedUntil = Date.now() + UNLOCK_MS;
}

export function isUnlocked(): boolean {
  return Date.now() < unlockedUntil;
}

export function lock(): void {
  unlockedUntil = 0;
}

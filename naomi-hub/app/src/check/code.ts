/** Letters and digits that are hard to confuse when handwritten or photographed. */
const ALPHABET = 'ACDEFHJKMNPRTWXY3479';

export function newSheetCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return code;
}

export function normalizeCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

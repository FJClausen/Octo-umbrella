/** One place for colour, spacing and type so every screen reads as one app. */
export const colors = {
  bg: '#0B0F14',
  surface: '#131A22',
  surfaceAlt: '#1B2530',
  border: '#243040',
  text: '#E8EEF5',
  textDim: '#8FA3B8',
  textFaint: '#5C7085',

  // One accent per training modality, so a glance at a colour tells you the
  // sport. These four are checked against the #131A22 card surface: all sit in
  // the dark-mode lightness band, clear 3:1 contrast, and clear the adjacent
  // colour-vision-deficiency separation floor, so the modality is still
  // readable to a red-green colourblind eye.
  strength: '#d95926',
  bike: '#3987e5',
  swim: '#199e70',
  body: '#9085e9',

  // Status colours are reserved for good/warning/bad and are never reused as a
  // series colour. They always ship alongside a word, never colour alone.
  good: '#2FA36B',
  warn: '#C98500',
  bad: '#DE4038',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const type = {
  display: { fontSize: 34, fontWeight: '700' as const, color: colors.text },
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textDim },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textFaint },
} as const;

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  big,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  big?: boolean;
}) {
  const bg = kind === 'primary' ? colors.accent : kind === 'danger' ? colors.bad : colors.card;
  const fg = kind === 'secondary' ? colors.ink : colors.accentInk;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        big && styles.buttonBig,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        kind === 'secondary' && styles.buttonSecondary,
      ]}
    >
      <Text style={[styles.buttonText, big && styles.buttonTextBig, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && { color: colors.muted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 28 },
  button: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: radius, alignItems: 'center' },
  buttonBig: { paddingVertical: 20, paddingHorizontal: 32 },
  buttonSecondary: { borderWidth: 2, borderColor: colors.border },
  buttonText: { fontSize: 18, fontWeight: '700' },
  buttonTextBig: { fontSize: 22 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 10,
    marginBottom: 10,
  },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 17, color: colors.ink, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  h1: { fontSize: 34, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 18, marginBottom: 10 },
  body: { fontSize: 18, color: colors.ink, lineHeight: 26 },
});

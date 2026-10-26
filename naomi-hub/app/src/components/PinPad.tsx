import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinPad({ title, error, onComplete }: { title: string; error?: string | null; onComplete: (pin: string) => void }) {
  const [pin, setPin] = useState('');

  const press = (k: string) => {
    if (k === '⌫') return setPin((p) => p.slice(0, -1));
    if (!k || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      onComplete(next);
      setTimeout(() => setPin(''), 150);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.error}>{error ?? ' '}</Text>
      <View style={styles.pad}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            accessibilityLabel={k === '⌫' ? 'Delete' : k}
            disabled={!k}
            onPress={() => press(k)}
            style={({ pressed }) => [styles.key, !k && styles.keyBlank, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 18 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.ink },
  dotFilled: { backgroundColor: colors.ink },
  error: { color: colors.bad, fontSize: 16, marginBottom: 12, minHeight: 22 },
  pad: { width: 300, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  key: {
    width: 88,
    height: 72,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBlank: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 28, fontWeight: '600', color: colors.ink },
});

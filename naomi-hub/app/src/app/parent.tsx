import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PinPad } from '../components/PinPad';
import { Body, Button, H1, H2 } from '../components/ui';
import { checkPin, hasPin, isUnlocked, lock, markUnlocked, setPin } from '../store/pin';
import { loadPrinter, type PrinterSettings } from '../store/printer';
import { loadPoints, type PointsState } from '../store/points';
import { colors } from '../theme';

type Mode = 'loading' | 'create' | 'confirm' | 'enter' | 'menu' | 'change' | 'change-confirm';

export default function Parent() {
  const [mode, setMode] = useState<Mode>('loading');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [printer, setPrinter] = useState<PrinterSettings>({ name: null, url: null });
  const [points, setPoints] = useState<PointsState>({ total: 0, log: [] });

  useFocusEffect(
    useCallback(() => {
      hasPin().then((exists) => setMode(!exists ? 'create' : isUnlocked() ? 'menu' : 'enter'));
      loadPrinter().then(setPrinter);
      loadPoints().then(setPoints);
    }, []),
  );

  const onPin = async (pin: string) => {
    setError(null);
    if (mode === 'create' || mode === 'change') {
      setDraft(pin);
      setMode(mode === 'create' ? 'confirm' : 'change-confirm');
    } else if (mode === 'confirm' || mode === 'change-confirm') {
      if (pin !== draft) {
        setError('PINs did not match. Try again.');
        setMode(mode === 'confirm' ? 'create' : 'change');
        return;
      }
      await setPin(pin);
      markUnlocked();
      setMode('menu');
    } else if (mode === 'enter') {
      if (await checkPin(pin)) {
        markUnlocked();
        setMode('menu');
      } else setError('Wrong PIN.');
    }
  };

  if (mode === 'loading') return <View style={styles.screen} />;

  if (mode !== 'menu') {
    const title = {
      create: 'Create a 4-digit parent PIN',
      confirm: 'Type the PIN again',
      enter: 'Parent PIN',
      change: 'New 4-digit PIN',
      'change-confirm': 'Type the new PIN again',
    }[mode];
    return (
      <View style={[styles.screen, styles.center]}>
        <PinPad title={title} error={error} onComplete={onPin} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Parent area</H1>
      <Body muted>Unlocked for 5 minutes.</Body>

      <H2>Printer</H2>
      <Body>{printer.name ? `Saved: ${printer.name}` : 'No printer saved yet. Prints will show the iOS print dialog.'}</Body>
      <View style={styles.row}>
        <Button label="Printer setup" onPress={() => router.push('/printer')} />
      </View>

      <H2>Points</H2>
      <Body>{points.total} points so far.</Body>
      {points.log.slice(0, 10).map((e, i) => (
        <Text key={i} style={styles.log}>
          {new Date(e.at).toLocaleString()} · {e.activity} · +{e.points}
          {e.note ? ` · ${e.note}` : ''}
        </Text>
      ))}

      <H2>Security</H2>
      <View style={styles.row}>
        <Button label="Change PIN" kind="secondary" onPress={() => setMode('change')} />
        <Button
          label="Lock now"
          kind="secondary"
          onPress={() => {
            lock();
            router.back();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  log: { fontSize: 15, color: colors.muted, marginTop: 4 },
});

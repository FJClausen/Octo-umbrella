import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PinPad } from '../components/PinPad';
import { Body, Button, Chip, H1, H2 } from '../components/ui';
import { checkPin, hasPin, isUnlocked, lock, markUnlocked, setPin } from '../store/pin';
import { loadPrinter, type PrinterSettings } from '../store/printer';
import { loadPoints, type PointsState } from '../store/points';
import { earnTickets, loadTickets, loadTicketSettings, saveTicketSettings } from '../store/tickets';
import { DEFAULT_SETTINGS, TICKETS_ENABLED, type TicketSettings } from '../tickets/rules';
import { colors } from '../theme';

type Mode = 'loading' | 'create' | 'confirm' | 'enter' | 'menu' | 'change' | 'change-confirm';

export default function Parent() {
  const [mode, setMode] = useState<Mode>('loading');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [printer, setPrinter] = useState<PrinterSettings>({ name: null, url: null });
  const [points, setPoints] = useState<PointsState>({ total: 0, log: [] });
  const [tickets, setTickets] = useState(0);
  const [ticketSettings, setTicketSettings] = useState<TicketSettings>(DEFAULT_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      hasPin().then((exists) => setMode(!exists ? 'create' : isUnlocked() ? 'menu' : 'enter'));
      loadPrinter().then(setPrinter);
      loadPoints().then(setPoints);
      loadTickets().then((t) => setTickets(t.balance));
      loadTicketSettings().then(setTicketSettings);
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

  const updateTickets = async (patch: Partial<TicketSettings>) => {
    const next = { ...ticketSettings, ...patch };
    setTicketSettings(next);
    await saveTicketSettings(next);
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

      <H2>Answer keys</H2>
      <Body>Answer keys never print. Open them here to check a finished sheet.</Body>
      <View style={styles.row}>
        <Button label="🔑  Answer keys" onPress={() => router.push('/answers')} />
      </View>

      {TICKETS_ENABLED ? (
        <>
      <H2>Screen tickets</H2>
      <Body>
        {ticketSettings.enabled
          ? `Naomi has ${tickets} 🎟. Printed sheets she checks by photo earn tickets; chess on the iPad costs ${ticketSettings.chessCost}.`
          : 'Tickets are off: everything on the iPad is free until you turn them back on.'}
      </Body>
      <View style={styles.row}>
        <Button
          label="Give 1 ticket"
          onPress={async () => setTickets((await earnTickets(1)).state.balance)}
          disabled={!ticketSettings.enabled}
        />
        <Button
          label={ticketSettings.enabled ? 'Turn tickets off (holiday / sick day)' : 'Turn tickets back on'}
          kind="secondary"
          onPress={() => updateTickets({ enabled: !ticketSettings.enabled })}
        />
      </View>
      <Body muted>Free tickets each morning</Body>
      <View style={styles.chips}>
        {[0, 1, 2].map((n) => (
          <Chip key={n} label={String(n)} selected={ticketSettings.dailyFree === n} onPress={() => updateTickets({ dailyFree: n })} />
        ))}
      </View>
      <Body muted>Cost of a chess round on the iPad</Body>
      <View style={styles.chips}>
        {[0, 1, 2].map((n) => (
          <Chip key={n} label={n === 0 ? 'Free' : `${n} 🎟`} selected={ticketSettings.chessCost === n} onPress={() => updateTickets({ chessCost: n })} />
        ))}
      </View>

        </>
      ) : null}

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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  log: { fontSize: 15, color: colors.muted, marginTop: 4 },
});

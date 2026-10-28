import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Body, Button, Chip, H1, H2 } from '../../components/ui';
import { dailyPuzzle, pickPuzzle, ROUND_SIZE, THEME_LABELS } from '../../chess/rating';
import { AVAILABLE_THEMES, PUZZLES } from '../../chess/puzzles';
import type { ChessPuzzle } from '../../chess/types';
import { newSheetCode, registerSheet } from '../../check/register';
import type { SheetRecord } from '../../check/types';
import { chessCheckSpec, chessSheet } from '../../print/chessSheet';
import { loadChess, todayKey, type ChessProgress } from '../../store/chessProgress';
import { printHtml } from '../../store/printer';
import { loadTickets, loadTicketSettings, spendTickets } from '../../store/tickets';
import { canAfford, DEFAULT_SETTINGS, type TicketSettings, type TicketState } from '../../tickets/rules';
import { colors } from '../../theme';

export default function ChessHome() {
  const [progress, setProgress] = useState<ChessProgress | null>(null);
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const [sheetOut, setSheetOut] = useState<SheetRecord | null>(null);
  const [tickets, setTickets] = useState<TicketState>({ balance: 0, day: '' });
  const [settings, setSettings] = useState<TicketSettings>(DEFAULT_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      loadChess().then(setProgress);
      loadTickets().then(setTickets);
      loadTicketSettings().then(setSettings);
    }, []),
  );

  if (!progress) return <View style={styles.screen} />;

  const today = todayKey();
  const dailyDone = progress.daily?.date === today && progress.daily.done;
  const themes = AVAILABLE_THEMES.filter((t) => THEME_LABELS[t]);

  const printSheet = async () => {
    const seen = new Set(progress.seen);
    const picks: ChessPuzzle[] = [];
    for (let i = 0; i < 6; i++) {
      const p = pickPuzzle(PUZZLES, { rating: progress.rating, seen, theme });
      if (!p) break;
      picks.push(p);
      seen.add(p.id);
    }
    if (!picks.length) return Alert.alert('No puzzles', 'No puzzles match that theme yet.');
    try {
      const code = newSheetCode();
      await printHtml(chessSheet(picks, code));
      setSheetOut(await registerSheet({ code, title: 'Chess puzzle sheet', readKind: 'chess', level: 'chess', spec: chessCheckSpec(picks) }));
    } catch (e) {
      Alert.alert('Could not print', e instanceof Error ? e.message : String(e));
    }
  };

  const cost = settings.enabled ? settings.chessCost : 0;
  const affordable = canAfford(tickets, settings, cost);
  const costLabel = cost > 0 ? ` (${cost} 🎟)` : '';

  /** Spends the ticket(s) up front, then starts. */
  const play = async (params: { mode: 'round' | 'daily'; theme?: string }) => {
    if (!(await spendTickets(cost))) {
      Alert.alert('No screen tickets left', 'Earn one by printing a puzzle and checking it with a photo.');
      return;
    }
    router.push({ pathname: '/chess/play', params: { mode: params.mode, theme: params.theme ?? '' } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Chess Puzzles</H1>
      {!affordable ? (
        <View style={styles.locked}>
          <Body>
            Playing on the iPad costs {cost} 🎟. You have {tickets.balance}. Earn tickets by solving printed puzzles, like the
            chess sheet below!
          </Body>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Button label="🖨  Print a puzzle" onPress={() => router.push('/puzzles')} />
          </View>
        </View>
      ) : null}
      <View style={styles.stats}>
        <Stat label="Puzzle rating" value={String(progress.rating)} />
        <Stat label="Solved" value={`${progress.solved}/${progress.played}`} />
        <Stat label="Puzzles in the app" value={String(PUZZLES.length)} />
      </View>

      <H2>Daily puzzle</H2>
      <Body muted>{dailyDone ? 'Done for today. Come back tomorrow!' : 'One special puzzle every day.'}</Body>
      <View style={styles.row}>
        <Button
          label={`${dailyDone ? 'Play it again' : 'Play the daily puzzle'}${costLabel}`}
          disabled={!dailyPuzzle(PUZZLES, today, progress.rating) || !affordable}
          onPress={() => play({ mode: 'daily' })}
        />
      </View>

      <H2>Theme</H2>
      <View style={styles.wrap}>
        <Chip label="Mixed" selected={!theme} onPress={() => setTheme(undefined)} />
        {themes.map((t) => (
          <Chip key={t} label={THEME_LABELS[t]} selected={theme === t} onPress={() => setTheme(t)} />
        ))}
      </View>

      <View style={styles.row}>
        <Button big label={`Start a ${ROUND_SIZE}-puzzle round${costLabel}`} disabled={!affordable} onPress={() => play({ mode: 'round', theme })} />
        <Button big kind="secondary" label="🖨  Print 6 puzzles (earn 1 🎟)" onPress={printSheet} />
      </View>

      {sheetOut ? (
        <View style={styles.done}>
          <Body>
            Solve sheet {sheetOut.code} on a real board or in your head and write your moves under the boards. Get at least 4 of 6
            right to earn a ticket.
          </Body>
          <View style={[styles.row, { marginTop: 12 }]}>
            <Button label="📷  I'm done, check it" onPress={() => router.push(`/check/${sheetOut.id}`)} />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Body>{value}</Body>
      <Body muted>{label}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  stats: { flexDirection: 'row', gap: 16, marginTop: 8 },
  stat: { backgroundColor: colors.card, borderRadius: 16, padding: 16, minWidth: 150, borderWidth: 2, borderColor: colors.border },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  locked: { marginTop: 12, padding: 18, borderRadius: 18, backgroundColor: colors.disabled, borderWidth: 2, borderColor: colors.border },
  done: { marginTop: 24, padding: 20, borderRadius: 18, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
});

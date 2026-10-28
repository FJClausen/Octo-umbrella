import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Body, Button, Chip, H1, H2 } from '../../components/ui';
import { dailyPuzzle, pickPuzzle, ROUND_SIZE, THEME_LABELS } from '../../chess/rating';
import { AVAILABLE_THEMES, PUZZLES } from '../../chess/puzzles';
import type { ChessPuzzle } from '../../chess/types';
import { chessSheet } from '../../print/chessSheet';
import { loadChess, todayKey, type ChessProgress } from '../../store/chessProgress';
import { awardPoints, POINTS } from '../../store/points';
import { printHtml } from '../../store/printer';
import { colors } from '../../theme';

export default function ChessHome() {
  const [progress, setProgress] = useState<ChessProgress | null>(null);
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const [sheetOut, setSheetOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadChess().then(setProgress);
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
      await printHtml(chessSheet(picks));
      setSheetOut(true);
    } catch (e) {
      Alert.alert('Could not print', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Chess Puzzles</H1>
      <View style={styles.stats}>
        <Stat label="Puzzle rating" value={String(progress.rating)} />
        <Stat label="Solved" value={`${progress.solved}/${progress.played}`} />
        <Stat label="Puzzles in the app" value={String(PUZZLES.length)} />
      </View>

      <H2>Daily puzzle</H2>
      <Body muted>{dailyDone ? 'Done for today. Come back tomorrow!' : 'One special puzzle every day.'}</Body>
      <View style={styles.row}>
        <Button
          label={dailyDone ? 'Play it again' : 'Play the daily puzzle'}
          disabled={!dailyPuzzle(PUZZLES, today, progress.rating)}
          onPress={() => router.push({ pathname: '/chess/play', params: { mode: 'daily' } })}
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
        <Button
          big
          label={`Start a ${ROUND_SIZE}-puzzle round`}
          onPress={() => router.push({ pathname: '/chess/play', params: { mode: 'round', theme: theme ?? '' } })}
        />
        <Button big kind="secondary" label="🖨  Print 6 puzzles" onPress={printSheet} />
      </View>

      {sheetOut ? (
        <View style={styles.done}>
          <Body>Solve the sheet on a real board or in your head, then check page 2.</Body>
          <View style={[styles.row, { marginTop: 12 }]}>
            <Button
              label={`I finished the sheet! +${POINTS.desk}`}
              onPress={async () => {
                await awardPoints('Chess sheet', 'desk');
                setSheetOut(false);
                Alert.alert('Great!', `+${POINTS.desk} points`);
              }}
            />
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
  done: { marginTop: 24, padding: 20, borderRadius: 18, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
});

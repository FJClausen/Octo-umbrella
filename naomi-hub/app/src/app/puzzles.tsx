import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Body, Button, Chip, H1, H2 } from '../components/ui';
import { newSheetCode, registerSheet } from '../check/register';
import type { SheetRecord } from '../check/types';
import { buildSheet, type Kind } from '../print/buildSheet';
import type { Difficulty } from '../puzzles';
import { printHtml } from '../store/printer';
import { loadSheets, openSheets } from '../store/sheets';
import { sheetReward, TICKETS_ENABLED } from '../tickets/rules';
import { colors } from '../theme';

const KINDS: { id: Kind; label: string; about: string }[] = [
  { id: 'sudoku6', label: 'Sudoku 6×6', about: 'Quick Sudoku with 2×3 boxes.' },
  { id: 'sudoku9', label: 'Sudoku 9×9', about: 'Classic Sudoku.' },
  { id: 'kenken', label: 'KenKen', about: 'Latin square plus arithmetic cages.' },
  { id: 'logic', label: 'Logic grid', about: 'Use clues to work out who has what. Write your answers in the "My answers" table.' },
  { id: 'pyramid', label: 'Number pyramid', about: 'Each brick is the sum of the two below.' },
  { id: 'magic', label: 'Magic square', about: 'Rows, columns and diagonals share one sum.' },
];

const LEVELS: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Warm-up' },
  { id: 'medium', label: 'Tricky' },
  { id: 'hard', label: 'Brain-buster' },
];

export default function PuzzlePrinter() {
  const [kind, setKind] = useState<Kind>('sudoku9');
  const [level, setLevel] = useState<Difficulty>('medium');
  const [busy, setBusy] = useState(false);
  const [printed, setPrinted] = useState<SheetRecord | null>(null);
  const [openCount, setOpenCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadSheets().then((s) => setOpenCount(openSheets(s).length));
    }, []),
  );

  const print = async () => {
    setBusy(true);
    // Let the spinner render before the (synchronous) generator runs.
    await new Promise((r) => setTimeout(r, 30));
    try {
      const code = newSheetCode();
      const sheet = buildSheet(kind, level, Date.now() % 2147483647, code);
      const how = await printHtml(sheet.html);
      const record = await registerSheet({ code, title: sheet.title, readKind: sheet.readKind, level, spec: sheet.spec });
      setPrinted(record);
      setOpenCount((n) => n + 1);
      if (how === 'dialog') Alert.alert('Tip', 'Ask a parent to save the printer in the parent area for one-tap printing.');
    } catch (e) {
      Alert.alert('Could not print', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reward = sheetReward(level);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Puzzle Printer</H1>
      <Body muted>
        Every puzzle is brand new and has exactly one answer. Solve it on paper, then check it
        {TICKETS_ENABLED ? ` to earn ${reward} 🎟 screen ticket${reward === 1 ? '' : 's'}` : ' for points'}. The answer key prints on page 2. No peeking!
      </Body>

      <H2>Puzzle</H2>
      <View style={styles.wrap}>
        {KINDS.map((k) => (
          <Chip key={k.id} label={k.label} selected={kind === k.id} onPress={() => setKind(k.id)} />
        ))}
      </View>
      <Body muted>{KINDS.find((k) => k.id === kind)!.about}</Body>

      <H2>Level</H2>
      <View style={styles.wrap}>
        {LEVELS.map((l) => (
          <Chip key={l.id} label={TICKETS_ENABLED && l.id === 'hard' ? `${l.label} (2 🎟)` : l.label} selected={level === l.id} onPress={() => setLevel(l.id)} />
        ))}
      </View>

      <View style={styles.actions}>
        {busy ? <ActivityIndicator size="large" color={colors.accent} /> : <Button big label="🖨  Print it" onPress={print} />}
        {openCount > 0 && !busy ? <Button big kind="secondary" label={`My sheets (${openCount})`} onPress={() => router.push('/sheets')} /> : null}
      </View>

      {printed ? (
        <View style={styles.done}>
          <Body>
            Grab sheet {printed.code} ({printed.title}) and a pencil. When you've solved it, come back and take a photo of page 1.
          </Body>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            <Button label="📷  I'm done, check it" onPress={() => router.push(`/check/${printed.id}`)} />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  actions: { marginTop: 28, flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  done: { marginTop: 28, padding: 20, borderRadius: 18, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
});

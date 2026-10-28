import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PinPad } from '../../components/PinPad';
import { Body, Button, H1 } from '../../components/ui';
import { CheckUnavailable, readSheetPhoto } from '../../check/api';
import { awardSheet } from '../../check/award';
import { compare } from '../../check/compare';
import { expectedRows, takeSheetPhoto } from '../../check/photo';
import type { CheckResult, SheetRecord } from '../../check/types';
import { checkPin, hasPin } from '../../store/pin';
import { getSheet, updateSheet } from '../../store/sheets';
import { apiConfigured } from '../../config';
import { colors } from '../../theme';

type Phase =
  | { name: 'ready' }
  | { name: 'checking' }
  | { name: 'result'; result: CheckResult; photo: string }
  | { name: 'offline' }
  | { name: 'parent'; error: string | null }
  | { name: 'done'; tickets: number; points: number; how: 'photo' | 'parent' };

function message(r: CheckResult, code: string, photo: string): { title: string; text: string } {
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const retake = photo !== 'ok' ? ' The photo looked a bit blurry or cut off, so try again with the sheet flat and in good light.' : '';
  switch (r.status) {
    case 'pass':
      return { title: 'All correct!', text: '' };
    case 'wrong':
      return r.needed < r.total
        ? { title: 'Not quite yet', text: `${r.correct} of ${r.total} moves are right. You need ${r.needed}. Look at the boards again!` }
        : { title: 'Not quite yet', text: `${plural(r.wrong, "answer doesn't", "answers don't")} match yet. Find ${r.wrong === 1 ? 'it' : 'them'}, fix ${r.wrong === 1 ? 'it' : 'them'}, and take another photo.` };
    case 'incomplete':
      return { title: 'Almost there', text: `${plural(r.empty, 'answer is', 'answers are')} still empty. Finish ${r.empty === 1 ? 'it' : 'them'} first!` };
    case 'unclear':
      return { title: "I couldn't read everything", text: `${plural(r.unclear, 'answer was', 'answers were')} hard to read. Write clearly, put the sheet flat in good light, and take the photo again.${retake}` };
    case 'wrong-sheet':
      return { title: 'Different sheet?', text: `This photo shows another sheet. Look for "Sheet ${code}" in the top corner.` };
    case 'no-code':
      return { title: 'Fit the whole page in', text: `I can't see the sheet code. Make sure the whole page, including "Sheet ${code}" in the top corner, is in the photo.${retake}` };
    case 'answer-key':
      return { title: "That's the answer key 😉", text: 'Take a photo of page 1 with your answers on it.' };
    case 'not-a-sheet':
      return { title: "That's not a puzzle sheet", text: 'Point the camera at your finished sheet and try again.' };
  }
}

export default function CheckSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sheet, setSheet] = useState<SheetRecord | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: 'ready' });

  useEffect(() => {
    if (id) getSheet(id).then(setSheet);
  }, [id]);

  if (!sheet) return <View style={styles.screen} />;

  const finish = async (how: 'photo' | 'parent') => {
    const { tickets, points } = await awardSheet(sheet, how);
    setPhase({ name: 'done', tickets, points, how });
  };

  const check = async () => {
    if (!apiConfigured()) {
      setPhase({ name: 'offline' });
      return;
    }
    let photo: string | null;
    try {
      photo = await takeSheetPhoto();
    } catch (e) {
      setPhase({ name: 'parent', error: e instanceof Error && e.message === 'camera-denied' ? 'The camera is turned off for this app. A parent can approve the sheet instead.' : null });
      return;
    }
    if (!photo) return;
    setPhase({ name: 'checking' });
    try {
      const rows = expectedRows(sheet.spec);
      const columns = sheet.spec.type === 'logic' ? sheet.spec.people : undefined;
      const t = await readSheetPhoto(sheet.readKind, photo, rows, columns);
      const result = compare(sheet.spec, sheet.code, t);
      await updateSheet(sheet.id, { attempts: sheet.attempts + 1 });
      if (result.status === 'pass') await finish('photo');
      else setPhase({ name: 'result', result, photo: t.photo });
    } catch (e) {
      if (e instanceof CheckUnavailable) setPhase({ name: 'offline' });
      else throw e;
    }
  };

  const askParent = async () => setPhase({ name: 'parent', error: (await hasPin()) ? null : 'No parent PIN is set yet. Set one in the parent area first.' });

  if (sheet.status === 'passed' && phase.name !== 'done') {
    return (
      <View style={[styles.screen, styles.center]}>
        <H1>Already done ✅</H1>
        <Body>{sheet.title} was checked and paid out.</Body>
        <View style={styles.row}>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Check my answers</H1>
      <Body muted>
        {sheet.title} · Sheet {sheet.code}
      </Body>

      {phase.name === 'ready' && (
        <View style={styles.card}>
          <Body>Put page 1 flat on the table in good light. Fit the whole page in the photo, including the sheet code in the top corner.</Body>
          <View style={styles.row}>
            <Button big label="📷  Take a photo" onPress={check} />
          </View>
        </View>
      )}

      {phase.name === 'checking' && (
        <View style={[styles.card, styles.center]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Body>Reading your answers…</Body>
        </View>
      )}

      {phase.name === 'result' &&
        (() => {
          const m = message(phase.result, sheet.code, phase.photo);
          return (
            <View style={styles.card}>
              <Text style={styles.title}>{m.title}</Text>
              <Body>{m.text}</Body>
              <View style={styles.row}>
                <Button big label="📷  Try again" onPress={check} />
              </View>
            </View>
          );
        })()}

      {phase.name === 'offline' && (
        <View style={styles.card}>
          <Text style={styles.title}>Can't check right now</Text>
          <Body>The checker isn't reachable (no internet?). Try again later, or ask a parent to look at your sheet.</Body>
          <View style={styles.row}>
            <Button label="Try again" onPress={check} />
            <Button label="Ask a parent" kind="secondary" onPress={askParent} />
          </View>
        </View>
      )}

      {phase.name === 'parent' && (
        <View style={[styles.card, styles.center]}>
          <Body>A parent checks the sheet, then enters the PIN to approve it.</Body>
          <PinPad
            title="Parent PIN"
            error={phase.error}
            onComplete={async (pin) => {
              if (await checkPin(pin)) await finish('parent');
              else setPhase({ name: 'parent', error: 'Wrong PIN.' });
            }}
          />
        </View>
      )}

      {phase.name === 'done' && (
        <View style={[styles.card, styles.center]}>
          <Text style={styles.big}>🎉</Text>
          <Text style={styles.title}>{phase.how === 'photo' ? 'All correct!' : 'Approved!'}</Text>
          <Body>
            {phase.tickets > 0 ? `+${phase.tickets} 🎟 screen ticket${phase.tickets === 1 ? '' : 's'} · ` : 'Ticket wallet is full · '}+{phase.points} points
          </Body>
          <View style={styles.row}>
            <Button label="Back to the hub" onPress={() => router.dismissAll()} />
          </View>
        </View>
      )}

      {(phase.name === 'ready' || phase.name === 'result') && (
        <View style={styles.footer}>
          <Button label="Ask a parent instead" kind="secondary" onPress={askParent} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { marginTop: 24, padding: 24, borderRadius: 18, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  big: { fontSize: 64 },
  footer: { marginTop: 32, flexDirection: 'row' },
});

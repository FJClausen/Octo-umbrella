import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Button, H1, H2 } from '../../components/ui';
import { missionById, variantFor, type Feedback } from '../../math/missions';
import { parseNumber } from '../../math/numbers';
import { mathSheet } from '../../print/mathSheet';
import { loadMath, saveRun, type MathRun } from '../../store/math';
import { awardPoints, POINTS } from '../../store/points';
import { printHtml } from '../../store/printer';
import { colors, radius } from '../../theme';

const TONE_COLOR: Record<Feedback['tone'], string> = { great: colors.good, ok: colors.ink, retry: colors.bad };

export default function MathMissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mission = missionById(id ?? '');
  const [run, setRun] = useState<MathRun | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback[] | null>(null);

  useEffect(() => {
    if (!mission) return;
    loadMath().then((s) => {
      const existing = s.runs[mission.id];
      setRun(existing && !existing.doneAt ? existing : { missionId: mission.id, seed: Date.now() % 2147483647, printedAt: null, doneAt: null, answers: {} });
    });
  }, [mission]);

  if (!mission || !run) return <View style={styles.screen} />;

  const variant = variantFor(mission, run.seed);
  const needsPrint = Boolean(mission.variant) && !run.printedAt;
  const outdoors = mission.place === 'patio' || mission.place === 'porch';

  const print = async () => {
    try {
      await printHtml(mathSheet(mission, variant));
      const next = { ...run, printedAt: new Date().toISOString() };
      setRun(next);
      await saveRun(next);
    } catch (e) {
      Alert.alert('Could not print', e instanceof Error ? e.message : String(e));
    }
  };

  const check = async () => {
    const values: Record<string, number> = {};
    for (const f of mission.fields) {
      const n = parseNumber(inputs[f.id] ?? '');
      if (n === null) return Alert.alert('Almost', `“${f.label}” needs a number.`);
      values[f.id] = n;
    }
    setFeedback(mission.evaluate(values, variant.expected));
    if (!run.doneAt) {
      const next = { ...run, doneAt: new Date().toISOString(), answers: values };
      setRun(next);
      await saveRun(next);
      await awardPoints('Math in the Wild', outdoors ? 'backyard' : 'desk', mission.title);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>{mission.title}</H1>
      <Body muted>
        {mission.minutes} min · You need: {mission.tools.join(', ')}
        {mission.needsSun ? ' · needs sunshine ☀️' : ''}
      </Body>
      <Body>{mission.intro}</Body>
      {variant.lines.length && run.printedAt ? variant.lines.map((l) => <Body key={l}>{l}</Body>) : null}

      <H2>The mission</H2>
      {mission.steps.map((s, i) => (
        <Text key={i} style={styles.step}>
          {i + 1}. {s}
        </Text>
      ))}

      <View style={styles.row}>
        <Button big label={run.printedAt ? '🖨  Print again' : '🖨  Print my sheet'} onPress={print} />
      </View>

      <H2>My answers</H2>
      {needsPrint ? (
        <Body muted>Print the sheet first: it has the numbers for this mission.</Body>
      ) : (
        <>
          <Body muted>Type the final answers from your sheet. Fractions like 2 1/4 are fine.</Body>
          {mission.fields.map((f) => (
            <View key={f.id} style={styles.field}>
              <Text style={styles.label}>
                {f.label}
                {f.unit ? ` (${f.unit})` : ''}
              </Text>
              <TextInput
                accessibilityLabel={f.label}
                style={styles.input}
                keyboardType="numbers-and-punctuation"
                value={inputs[f.id] ?? ''}
                onChangeText={(t) => setInputs((prev) => ({ ...prev, [f.id]: t }))}
              />
            </View>
          ))}
          <View style={styles.row}>
            <Button big label="How did I do?" onPress={check} />
          </View>
        </>
      )}

      {feedback ? (
        <View style={styles.result}>
          {feedback.map((f, i) => (
            <Text key={i} style={[styles.feedback, { color: TONE_COLOR[f.tone] }]}>
              {f.text}
            </Text>
          ))}
          <Body muted>
            Mission complete: +{outdoors ? POINTS.backyard : POINTS.desk} points. You can change an answer and check again.
          </Body>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  step: { fontSize: 18, color: colors.ink, lineHeight: 26, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  label: { fontSize: 17, color: colors.ink, flex: 1 },
  input: { width: 180, fontSize: 20, padding: 10, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, color: colors.ink },
  result: { marginTop: 24, padding: 20, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, gap: 8 },
  feedback: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
});

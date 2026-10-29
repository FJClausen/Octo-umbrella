import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GeoMap } from '../../components/GeoMap';
import { Body, Button, H1 } from '../../components/ui';
import { updateRating } from '../../chess/rating';
import { bboxOf, setById } from '../../geo/data';
import { makeRound, optionLabel, ROUND, type Question } from '../../geo/quiz';
import { mapSheet } from '../../print/mapSheet';
import { loadGeo, saveGeo, type GeoProgress } from '../../store/geo';
import { awardPoints, POINTS } from '../../store/points';
import { printHtml } from '../../store/printer';
import { colors, radius } from '../../theme';

export default function GeographyPlay() {
  const { set: setId } = useLocalSearchParams<{ set?: string }>();
  const set = setById(setId ?? 'world');
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState<GeoProgress | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [startRating, setStartRating] = useState(0);

  useEffect(() => {
    loadGeo().then((p) => {
      setProgress(p);
      setStartRating(p.rating[set.kind]);
      setQuestions(makeRound(set, p.rating[set.kind], p.lang));
    });
  }, [set]);

  const regionBox = useMemo(() => bboxOf(set.places), [set]);

  if (!progress || questions.length === 0) return <View style={styles.screen} />;

  const lang = progress.lang;
  const done = index >= questions.length;

  if (done) {
    const delta = progress.rating[set.kind] - startRating;
    return (
      <View style={[styles.screen, styles.center]}>
        <H1>
          {score} / {ROUND} right!
        </H1>
        <Body>
          Rating {progress.rating[set.kind]} ({delta >= 0 ? '+' : ''}
          {delta}) · +{POINTS.ipad} points
        </Body>
        <Body muted>Now take it off the screen: print a blank map and label it from memory.</Body>
        <View style={styles.row}>
          <Button
            label="🖨  Print this region"
            onPress={async () => {
              try {
                await printHtml(mapSheet(set, lang, Date.now() % 2147483647));
              } catch (e) {
                Alert.alert('Could not print', e instanceof Error ? e.message : String(e));
              }
            }}
          />
          <Button label="Back" kind="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const q = questions[index];

  const answer = async (id: string) => {
    if (picked) return;
    setPicked(id);
    const right = id === q.answer;
    if (right) setScore((s) => s + 1);
    const kind = set.kind;
    const next: GeoProgress = {
      ...progress,
      rating: { ...progress.rating, [kind]: updateRating(progress.rating[kind], q.difficulty, right, progress.played[kind]) },
      played: { ...progress.played, [kind]: progress.played[kind] + 1 },
    };
    if (index === questions.length - 1) {
      const final = score + (right ? 1 : 0);
      next.best = { ...next.best, [set.id]: Math.max(next.best[set.id] ?? 0, final) };
      await awardPoints('Geography Quiz', 'ipad', `${set.label}: ${final}/${ROUND}`);
    }
    setProgress(next);
    await saveGeo(next);
  };

  const fill = (id: string) => {
    if (!picked) return q.type === 'outline' ? '#5b4a36' : colors.lightSquare;
    if (id === q.answer) return colors.good;
    if (id === picked) return colors.bad;
    return colors.lightSquare;
  };

  const mapWidth = Math.min(width - 56, 980);
  const subjectBox = bboxOf([q.subject], 0.12);
  const outlineSize = Math.min(360, height * 0.35);
  const correctName = optionLabel(q, set, q.answer, lang);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <Text style={styles.counter}>
        Question {index + 1} of {questions.length} · {score} right
      </Text>
      <Text style={styles.prompt}>{q.prompt}</Text>

      {q.type === 'tap' ? <GeoMap places={set.places} viewBox={regionBox} width={mapWidth} fillFor={fill} onPress={answer} /> : null}
      {q.type === 'flag' ? <Text style={styles.flag}>{q.flag}</Text> : null}
      {q.type === 'outline' ? (
        <View style={styles.center}>
          <GeoMap places={[q.subject]} viewBox={subjectBox} width={outlineSize} fillFor={() => (picked ? colors.good : '#5b4a36')} />
        </View>
      ) : null}

      {q.options.length ? (
        <View style={styles.options}>
          {q.options.map((id) => {
            const state = !picked ? 'idle' : id === q.answer ? 'right' : id === picked ? 'wrong' : 'idle';
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                onPress={() => answer(id)}
                style={[styles.option, state === 'right' && { backgroundColor: colors.good, borderColor: colors.good }, state === 'wrong' && { backgroundColor: colors.bad, borderColor: colors.bad }]}
              >
                <Text style={[styles.optionText, state !== 'idle' && { color: '#fff' }]}>{optionLabel(q, set, id, lang)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {picked ? (
        <View style={styles.feedback}>
          <Text style={[styles.result, { color: picked === q.answer ? colors.good : colors.bad }]}>
            {picked === q.answer ? 'Correct! 🎉' : q.type === 'tap' ? `That was ${optionLabel(q, set, picked, lang)}. ${q.subject.name[lang]} is shown in green.` : `The answer is ${correctName}.`}
          </Text>
          <Button
            big
            label={index + 1 >= questions.length ? 'See my score' : 'Next question'}
            onPress={() => {
              setPicked(null);
              setIndex((i) => i + 1);
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  counter: { fontSize: 16, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  prompt: { fontSize: 30, fontWeight: '800', color: colors.ink, marginVertical: 14 },
  flag: { fontSize: 160, textAlign: 'center', marginVertical: 10 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 },
  option: { minWidth: 260, paddingVertical: 18, paddingHorizontal: 22, borderRadius: radius, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card },
  optionText: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  feedback: { marginTop: 20, gap: 14, alignItems: 'flex-start' },
  result: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
});

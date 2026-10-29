import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Button, Chip, H1, H2 } from '../../components/ui';
import { CHALLENGES, reflectionFor, safetyNotes } from '../../inventor/challenges';
import { parseNumber } from '../../math/numbers';
import { addInvention } from '../../store/inventor';
import { takeKeptPhoto } from '../../store/photos';
import { awardPoints, POINTS } from '../../store/points';
import { colors, radius } from '../../theme';

type Phase = 'brief' | 'building' | 'wrapup' | 'saved';

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = CHALLENGES.find((x) => x.id === id);
  const [minutes, setMinutes] = useState<number>(c?.minutes[0] ?? 15);
  const [phase, setPhase] = useState<Phase>('brief');
  const [endAt, setEndAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [photo, setPhoto] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [result, setResult] = useState('');
  const [question] = useState(() => reflectionFor(Date.now()));

  useEffect(() => {
    if (phase !== 'building') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  if (!c) return <View style={styles.screen} />;

  const left = endAt - now;
  const outdoors = !c.places.includes('indoors');

  const snap = async () => {
    try {
      const uri = await takeKeptPhoto(`inventor-${c.id}`);
      if (uri) setPhoto(uri);
    } catch (e) {
      Alert.alert('Camera', e instanceof Error && e.message === 'camera-denied' ? 'The camera is turned off for this app in Settings.' : String(e));
    }
  };

  const save = async () => {
    if (reflection.trim().length < 3) return Alert.alert('One more thing', 'Answer the thinking question first.');
    const value = c.result && result.trim() ? parseNumber(result) : null;
    await addInvention({
      id: `${Date.now()}`,
      challengeId: c.id,
      title: c.title,
      at: new Date().toISOString(),
      minutes,
      photoUri: photo,
      reflectionQuestion: question,
      reflection: reflection.trim(),
      result: value,
      resultUnit: c.result?.unit ?? '',
    });
    await awardPoints("Inventor's Challenge", outdoors ? 'backyard' : 'desk', c.title);
    setPhase('saved');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>{c.title}</H1>
      <Body>{c.brief}</Body>

      {phase === 'brief' && (
        <>
          <H2>You may use</H2>
          <Body>{[...c.materials, ...(c.extras ?? [])].join(', ')}</Body>
          <H2>Rules</H2>
          {c.limits.map((l) => (
            <Body key={l}>• {l}</Body>
          ))}
          {safetyNotes(c).map((n) => (
            <Text key={n} style={styles.safety}>
              ⚠️ {n}
            </Text>
          ))}
          <H2>The test</H2>
          <Body>{c.test}</Body>
          <H2>Time</H2>
          <View style={styles.row}>
            {c.minutes.map((m) => (
              <Chip key={m} label={`${m} min`} selected={minutes === m} onPress={() => setMinutes(m)} />
            ))}
          </View>
          <View style={styles.row}>
            <Button
              big
              label="▶  Start building"
              onPress={() => {
                setEndAt(Date.now() + minutes * 60_000);
                setNow(Date.now());
                setPhase('building');
              }}
            />
          </View>
        </>
      )}

      {phase === 'building' && (
        <View style={styles.timerBox}>
          <Text style={styles.timer}>{left > 0 ? clock(left) : 'Time’s up!'}</Text>
          <Body muted>{left > 0 ? 'Put the iPad down and build! Come back when the time is up or you finish early.' : 'Now test it!'}</Body>
          <Body>The test: {c.test}</Body>
          <View style={styles.row}>
            <Button big label={left > 0 ? 'I’m finished early' : 'I tested it'} onPress={() => setPhase('wrapup')} />
          </View>
        </View>
      )}

      {phase === 'wrapup' && (
        <>
          <H2>Photo</H2>
          {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <Body muted>Take a picture of your invention.</Body>}
          <View style={styles.row}>
            <Button label={photo ? '📷  Retake' : '📷  Take photo'} kind={photo ? 'secondary' : 'primary'} onPress={snap} />
          </View>
          {c.result ? (
            <>
              <H2>Test result</H2>
              <View style={styles.inline}>
                <Text style={styles.label}>
                  {c.result.label}
                  {c.result.unit ? ` (${c.result.unit})` : ''}
                </Text>
                <TextInput style={styles.input} keyboardType="numbers-and-punctuation" value={result} onChangeText={setResult} accessibilityLabel={c.result.label} />
              </View>
            </>
          ) : null}
          <H2>Think about it</H2>
          <Body>{question}</Body>
          <TextInput style={styles.text} multiline value={reflection} onChangeText={setReflection} accessibilityLabel={question} placeholder="Write your answer…" />
          <View style={styles.row}>
            <Button big label="💾  Save to my gallery" onPress={save} />
          </View>
        </>
      )}

      {phase === 'saved' && (
        <View style={styles.timerBox}>
          <Text style={styles.title}>Invention saved! 🎉</Text>
          <Body>+{outdoors ? POINTS.backyard : POINTS.desk} points</Body>
          <View style={styles.row}>
            <Button label="🖼  See my gallery" onPress={() => router.replace('/inventor/gallery')} />
            <Button label="Another challenge" kind="secondary" onPress={() => router.back()} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  safety: { fontSize: 16, color: colors.bad, fontWeight: '600', marginTop: 8 },
  timerBox: { marginTop: 24, padding: 28, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', gap: 10 },
  timer: { fontSize: 96, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  photo: { width: 420, height: 315, borderRadius: radius, marginVertical: 8, backgroundColor: colors.disabled },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 17, color: colors.ink },
  input: { width: 160, fontSize: 20, padding: 10, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, color: colors.ink },
  text: { minHeight: 110, fontSize: 18, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, color: colors.ink, textAlignVertical: 'top', marginTop: 8 },
});

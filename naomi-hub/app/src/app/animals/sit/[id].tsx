import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Button, Chip, H1, H2 } from '../../../components/ui';
import { missionById, tallyList } from '../../../animals/missions';
import { SPOTS, speciesById, spotById, type SpotId } from '../../../animals/species';
import { fieldNotesSheet } from '../../../print/fieldNotesSheet';
import { addSit, loadAnimals, type Squirrel } from '../../../store/animals';
import { takeKeptPhoto } from '../../../store/photos';
import { awardPoints, POINTS } from '../../../store/points';
import { printHtml } from '../../../store/printer';
import { colors, radius } from '../../../theme';

type Phase = 'setup' | 'sitting' | 'log' | 'saved';
const MINUTES = [5, 10, 15];

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = missionById(id ?? '');
  const month = new Date().getMonth();
  const [spot, setSpot] = useState<SpotId>(m?.spot ?? 'crape-myrtle');
  const [minutes, setMinutes] = useState(10);
  const [phase, setPhase] = useState<Phase>('setup');
  const [endAt, setEndAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [tally, setTally] = useState<Record<string, number>>({});
  const [other, setOther] = useState('');
  const [answer, setAnswer] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [squirrels, setSquirrels] = useState<Squirrel[]>([]);
  const [recognized, setRecognized] = useState<string[]>([]);

  useEffect(() => {
    loadAnimals().then((s) => setSquirrels(s.squirrels));
  }, []);

  useEffect(() => {
    if (phase !== 'sitting') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  if (!m) return <View style={styles.screen} />;

  const spotInfo = spotById(spot)!;
  const list = tallyList(m, spot, month);
  const left = endAt - now;

  const print = async () => {
    try {
      await printHtml(fieldNotesSheet(m, spotInfo, minutes, list));
    } catch (e) {
      Alert.alert('Could not print', e instanceof Error ? e.message : String(e));
    }
  };

  const bump = (sid: string, d: number) => setTally((t) => ({ ...t, [sid]: Math.max(0, (t[sid] ?? 0) + d) }));

  const snap = async () => {
    try {
      const uri = await takeKeptPhoto(`animals-${m.id}`);
      if (uri) setPhoto(uri);
    } catch (e) {
      Alert.alert('Camera', e instanceof Error && e.message === 'camera-denied' ? 'The camera is turned off for this app in Settings.' : String(e));
    }
  };

  const save = async () => {
    const total = Object.values(tally).reduce((a, n) => a + n, 0);
    if (total === 0 && other.trim().length < 2) return Alert.alert('Nothing counted yet', 'Add your tally marks, or write what you saw under “Other animals”. Seeing nothing is OK too: write “nothing” there.');
    if (answer.trim().length < 3) return Alert.alert('One more thing', 'Answer the detective question first.');
    await addSit({
      id: `${Date.now()}`,
      missionId: m.id,
      title: m.title,
      spot,
      at: new Date().toISOString(),
      minutes,
      tally: Object.fromEntries(Object.entries(tally).filter(([, n]) => n > 0)),
      other: other.trim(),
      answer: answer.trim(),
      photoUri: photo,
      squirrelIds: recognized,
    });
    await awardPoints('Animal Detective', 'backyard', m.title);
    setPhase('saved');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>
        {m.emoji} {m.title}
      </H1>
      <Body>{m.brief}</Body>

      {phase === 'setup' && (
        <>
          <H2>Where</H2>
          {m.spot ? (
            <Body>
              {spotInfo.emoji} {spotInfo.name}
            </Body>
          ) : (
            <View style={styles.row}>
              {SPOTS.map((s) => (
                <Chip key={s.id} label={`${s.emoji} ${s.name}`} selected={spot === s.id} onPress={() => setSpot(s.id)} />
              ))}
            </View>
          )}
          <Body muted>{spotInfo.tip}</Body>
          {m.needsAdult ? <Text style={styles.safety}>⚠️ Do this one with a grown-up.</Text> : null}
          {spotInfo.where === 'porch' ? <Text style={styles.safety}>⚠️ Stay behind the railing. Never lean over or drop things.</Text> : null}
          <Text style={styles.safety}>⚠️ Stay away from the AC unit, the grill and the fire-pit table.</Text>
          <H2>The mission</H2>
          {m.steps.map((s, i) => (
            <Text key={i} style={styles.step}>
              {i + 1}. {s}
            </Text>
          ))}
          <H2>Look for</H2>
          <Body>{list.map((sid) => speciesById(sid)?.name).join(', ')}</Body>
          <H2>How long</H2>
          <View style={styles.row}>
            {MINUTES.map((n) => (
              <Chip key={n} label={`${n} min`} selected={minutes === n} onPress={() => setMinutes(n)} />
            ))}
          </View>
          <View style={styles.row}>
            <Button label="🖨  Print field notes" kind="secondary" onPress={print} />
            <Button
              big
              label="▶  Start my sit"
              onPress={() => {
                setEndAt(Date.now() + minutes * 60_000);
                setNow(Date.now());
                setPhase('sitting');
              }}
            />
          </View>
        </>
      )}

      {phase === 'sitting' && (
        <View style={styles.box}>
          <Text style={styles.timer}>{left > 0 ? clock(left) : 'Time’s up!'}</Text>
          <Body muted>{left > 0 ? 'Put the iPad down. Sit still, watch and make tally marks on your field notes.' : 'Great sitting! Come log what you found.'}</Body>
          <View style={styles.row}>
            <Button big label={left > 0 ? 'Done early' : 'Log my findings'} onPress={() => setPhase('log')} />
          </View>
        </View>
      )}

      {phase === 'log' && (
        <>
          <H2>My tally</H2>
          {list.map((sid) => {
            const s = speciesById(sid)!;
            const n = tally[sid] ?? 0;
            return (
              <View key={sid} style={styles.tallyRow}>
                <Text style={styles.tallyName}>
                  {s.emoji} {s.name}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`One fewer ${s.name}`} onPress={() => bump(sid, -1)} style={styles.step1}>
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text style={styles.count}>{n}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`One more ${s.name}`} onPress={() => bump(sid, 1)} style={styles.step1}>
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
            );
          })}
          <H2>Other animals</H2>
          <TextInput style={styles.text} multiline value={other} onChangeText={setOther} placeholder="Anything else you saw or heard…" accessibilityLabel="Other animals" />

          {(tally['gray-squirrel'] ?? 0) > 0 && squirrels.length > 0 ? (
            <>
              <H2>Did you recognize any squirrels?</H2>
              <View style={styles.row}>
                {squirrels.map((q) => (
                  <Chip
                    key={q.id}
                    label={q.name}
                    selected={recognized.includes(q.id)}
                    onPress={() => setRecognized((r) => (r.includes(q.id) ? r.filter((x) => x !== q.id) : [...r, q.id]))}
                  />
                ))}
              </View>
            </>
          ) : null}

          <H2>Photo (optional)</H2>
          {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : null}
          <View style={styles.row}>
            <Button label={photo ? '📷  Retake' : '📷  Take photo'} kind="secondary" onPress={snap} />
          </View>

          <H2>Detective question</H2>
          <Body>{m.question}</Body>
          <TextInput style={styles.text} multiline value={answer} onChangeText={setAnswer} placeholder="Write your answer…" accessibilityLabel={m.question} />
          <View style={styles.row}>
            <Button big label="💾  Save to my field log" onPress={save} />
          </View>
        </>
      )}

      {phase === 'saved' && (
        <View style={styles.box}>
          <Text style={styles.title}>Logged! 🔎</Text>
          <Body>+{POINTS.backyard} points</Body>
          <View style={styles.row}>
            <Button label="📖  Field guide" onPress={() => router.replace('/animals/guide')} />
            {(tally['gray-squirrel'] ?? 0) > 0 ? <Button label="🐿️  Squirrel roster" kind="secondary" onPress={() => router.replace('/animals/squirrels')} /> : null}
            <Button label="Another mission" kind="secondary" onPress={() => router.back()} />
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
  step: { fontSize: 18, color: colors.ink, marginBottom: 6, lineHeight: 25 },
  box: { marginTop: 24, padding: 28, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', gap: 10 },
  timer: { fontSize: 96, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  tallyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  tallyName: { width: 320, fontSize: 18, color: colors.ink },
  step1: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 28, fontWeight: '800', color: colors.ink },
  count: { width: 44, textAlign: 'center', fontSize: 24, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  photo: { width: 420, height: 315, borderRadius: radius, marginVertical: 8, backgroundColor: colors.disabled },
  text: { minHeight: 90, fontSize: 18, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, color: colors.ink, textAlignVertical: 'top', marginTop: 8 },
});

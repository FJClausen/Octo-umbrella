import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, H1, H2 } from '../../components/ui';
import { missionsFor, seasonOf } from '../../animals/missions';
import { SPECIES, spotById } from '../../animals/species';
import { loadAnimals, type AnimalState } from '../../store/animals';
import { colors, radius } from '../../theme';

const SEASON_LABEL = { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall' } as const;

export default function AnimalsHome() {
  const month = new Date().getMonth();
  const [state, setState] = useState<AnimalState | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAnimals().then(setState);
    }, []),
  );

  const missions = missionsFor(month);
  const seenCount = state ? Object.keys(state.seen).length : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Animal Detective</H1>
      <Body muted>Pick a mission, print your field notes and sit outside. Count what you see, then come back and log it.</Body>
      <View style={styles.row}>
        <Button label={`📖  Field guide (${seenCount}/${SPECIES.length} seen)`} onPress={() => router.push('/animals/guide')} />
        <Button label={`🐿️  Squirrel roster (${state?.squirrels.length ?? 0})`} kind="secondary" onPress={() => router.push('/animals/squirrels')} />
      </View>

      <H2>{SEASON_LABEL[seasonOf(month)]} missions</H2>
      <View style={styles.grid}>
        {missions.map((m) => {
          const spot = m.spot ? spotById(m.spot) : null;
          const done = state?.sits.filter((s) => s.missionId === m.id).length ?? 0;
          return (
            <Pressable key={m.id} accessibilityRole="button" onPress={() => router.push(`/animals/sit/${m.id}`)} style={styles.card}>
              <Text style={styles.title}>
                {m.emoji} {m.title}
              </Text>
              <Text style={styles.meta}>
                {spot ? `${spot.emoji} ${spot.name}` : '📍 Any spot'}
                {m.needsAdult ? ' · with a grown-up' : ''}
                {done ? ` · done ${done}×` : ''}
              </Text>
              <Text style={styles.brief}>{m.brief}</Text>
            </Pressable>
          );
        })}
      </View>

      {state && state.sits.length > 0 ? (
        <>
          <H2>My field log</H2>
          {state.sits.slice(0, 10).map((s) => {
            const total = Object.values(s.tally).reduce((a, n) => a + n, 0);
            return (
              <Text key={s.id} style={styles.log}>
                {new Date(s.at).toLocaleDateString()} · {s.title} · {spotById(s.spot)?.name ?? s.spot} · {total} animal{total === 1 ? '' : 's'}
              </Text>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: 340, padding: 18, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginVertical: 6 },
  brief: { fontSize: 16, color: colors.ink, lineHeight: 22 },
  log: { fontSize: 16, color: colors.ink, marginBottom: 6 },
});

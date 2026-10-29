import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Chip, H1 } from '../../components/ui';
import { isWinter, MISSIONS, suggest, type MathMission } from '../../math/missions';
import { loadMath } from '../../store/math';
import { colors, radius } from '../../theme';

type Filter = 'all' | 'outdoors' | 'indoors' | 'kitchen';

const PLACE_LABEL: Record<MathMission['place'], string> = { patio: '🌿 Patio', porch: '🪴 Porch', indoors: '🏠 Indoors', kitchen: '🍳 Kitchen' };

function matches(m: MathMission, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'outdoors') return m.place === 'patio' || m.place === 'porch';
  return m.place === f;
}

export default function MathHome() {
  const [filter, setFilter] = useState<Filter>('all');
  const [done, setDone] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadMath().then((s) => setDone(new Set(Object.values(s.runs).filter((r) => r.doneAt).map((r) => r.missionId))));
    }, []),
  );

  const winter = isWinter(new Date().getMonth());
  const shown = MISSIONS.filter((m) => matches(m, filter));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Math in the Wild</H1>
      <Body muted>Pick a mission, print the sheet, go measure. Type your final answers in when you’re back.</Body>
      {winter ? <Body muted>It’s winter: ☀️ missions need a sunny day outside.</Body> : null}
      <View style={styles.row}>
        {(['all', 'outdoors', 'indoors', 'kitchen'] as Filter[]).map((f) => (
          <Chip key={f} label={f[0].toUpperCase() + f.slice(1)} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <Button label="🎲  Surprise me" onPress={() => router.push(`/math/${suggest(shown.length ? shown : MISSIONS, new Date().getMonth()).id}`)} />
      </View>
      <View style={styles.grid}>
        {shown.map((m) => (
          <Pressable key={m.id} accessibilityRole="button" onPress={() => router.push(`/math/${m.id}`)} style={styles.card}>
            <Text style={styles.title}>
              {done.has(m.id) ? '✅ ' : ''}
              {m.title}
            </Text>
            <Text style={styles.meta}>
              {PLACE_LABEL[m.place]} · {m.minutes} min{m.needsSun ? ' · ☀️' : ''}
            </Text>
            <Text style={styles.intro} numberOfLines={3}>
              {m.intro}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: 340, padding: 18, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginVertical: 6 },
  intro: { fontSize: 16, color: colors.ink, lineHeight: 22 },
});

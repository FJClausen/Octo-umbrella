import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Chip, H1 } from '../../components/ui';
import { inSeason, SPECIES, type Group } from '../../animals/species';
import { loadAnimals, setSeen } from '../../store/animals';
import { colors, radius } from '../../theme';

const GROUPS: { id: Group | 'all' | 'now'; label: string }[] = [
  { id: 'now', label: '📅 Around now' },
  { id: 'all', label: 'All' },
  { id: 'bird', label: '🐦 Birds' },
  { id: 'mammal', label: '🐿️ Mammals' },
  { id: 'insect', label: '🐝 Insects' },
  { id: 'other', label: '🕷️ Other' },
];

const WHEN = { day: 'Daytime', dusk: 'Dusk', night: 'Night' } as const;

export default function FieldGuide() {
  const month = new Date().getMonth();
  const [filter, setFilter] = useState<(typeof GROUPS)[number]['id']>('now');
  const [seen, setSeenState] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      loadAnimals().then((s) => setSeenState(s.seen));
    }, []),
  );

  const list = SPECIES.filter((s) => (filter === 'all' ? true : filter === 'now' ? inSeason(s, month) : s.group === filter));

  const toggle = async (id: string) => {
    const next = await setSeen(id, !seen[id]);
    setSeenState(next.seen);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Field guide</H1>
      <Body muted>
        {Object.keys(seen).length} of {SPECIES.length} seen in our yard. Tap “Seen here” when you spot one yourself.
      </Body>
      <View style={styles.row}>
        {GROUPS.map((g) => (
          <Chip key={g.id} label={g.label} selected={filter === g.id} onPress={() => setFilter(g.id)} />
        ))}
      </View>
      <View style={styles.grid}>
        {list.map((s) => (
          <View key={s.id} style={[styles.card, seen[s.id] ? styles.cardSeen : null]}>
            <Text style={styles.title}>
              {s.emoji} {s.name}
            </Text>
            <Text style={styles.meta}>
              {WHEN[s.when]}
              {inSeason(s, month) ? ' · around now' : ' · not this season'}
            </Text>
            <Text style={styles.text}>
              <Text style={{ fontWeight: '700' }}>Look for: </Text>
              {s.lookFor}
            </Text>
            <Text style={styles.text}>💡 {s.fact}</Text>
            {s.caution ? <Text style={styles.caution}>⚠️ {s.caution}</Text> : null}
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(seen[s.id]) }} onPress={() => toggle(s.id)} style={styles.seenBtn}>
              <Text style={styles.seenText}>{seen[s.id] ? `✅ Seen here · ${new Date(seen[s.id]).toLocaleDateString()}` : '⬜ Seen here'}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: 340, padding: 18, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, gap: 6 },
  cardSeen: { borderColor: colors.good },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  text: { fontSize: 16, color: colors.ink, lineHeight: 22 },
  caution: { fontSize: 15, color: colors.bad, fontWeight: '600' },
  seenBtn: { marginTop: 6, paddingVertical: 10 },
  seenText: { fontSize: 17, fontWeight: '700', color: colors.ink },
});

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Chip, H1 } from '../../components/ui';
import { CHALLENGES, isWinterMonth, sortForSeason, type BuildPlace } from '../../inventor/challenges';
import { loadInventions } from '../../store/inventor';
import { colors, radius } from '../../theme';

const PLACE_ICON: Record<BuildPlace, string> = { indoors: '🏠', porch: '🪴', patio: '🌿' };

export default function InventorHome() {
  const month = new Date().getMonth();
  const [where, setWhere] = useState<BuildPlace | 'any'>(isWinterMonth(month) ? 'indoors' : 'any');
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadInventions().then((items) => setCount(items.length));
    }, []),
  );

  const list = sortForSeason(CHALLENGES, month).filter((c) => where === 'any' || c.places.includes(where));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Inventor’s Challenge</H1>
      <Body muted>Pick a challenge, set the timer and build it with your hands. Then test it, photograph it and think about it.</Body>
      <View style={styles.row}>
        {(['any', 'indoors', 'porch', 'patio'] as const).map((p) => (
          <Chip key={p} label={p === 'any' ? 'Anywhere' : `${PLACE_ICON[p]} ${p[0].toUpperCase()}${p.slice(1)}`} selected={where === p} onPress={() => setWhere(p)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Button label="🎲  Surprise me" onPress={() => router.push(`/inventor/${list[Math.floor(Math.random() * list.length)].id}`)} />
        <Button label={`🖼  My gallery (${count})`} kind="secondary" onPress={() => router.push('/inventor/gallery')} />
      </View>
      <View style={styles.grid}>
        {list.map((c) => (
          <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push(`/inventor/${c.id}`)} style={styles.card}>
            <Text style={styles.title}>{c.title}</Text>
            <Text style={styles.meta}>
              {c.places.map((p) => PLACE_ICON[p]).join(' ')} · {c.minutes.join(' / ')} min
            </Text>
            <Text style={styles.brief}>{c.brief}</Text>
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
  brief: { fontSize: 16, color: colors.ink, lineHeight: 22 },
});

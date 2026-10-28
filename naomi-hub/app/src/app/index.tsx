import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACTIVITIES, type Activity } from '../activities';
import { loadPoints, todayPoints, type PointsState } from '../store/points';
import { colors, radius } from '../theme';

export default function Hub() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<PointsState>({ total: 0, log: [] });

  useFocusEffect(
    useCallback(() => {
      loadPoints().then(setPoints);
    }, []),
  );

  const columns = width >= 1000 ? 3 : 2;
  const gap = 20;
  const cardWidth = (width - 56 - gap * (columns - 1)) / columns;

  const open = (a: Activity) => {
    if (a.route) router.push(a.route);
    else Alert.alert(a.title, 'Coming soon!');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28, paddingTop: insets.top + 20 }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hi Naomi!</Text>
          <Text style={styles.sub}>Pick something to do. Every activity ends away from the iPad.</Text>
        </View>
        <View style={styles.points} accessibilityLabel={`${points.total} points`}>
          <Text style={styles.pointsNum}>{points.total}</Text>
          <Text style={styles.pointsLabel}>points · +{todayPoints(points)} today</Text>
        </View>
        <Pressable accessibilityLabel="Parent area" onPress={() => router.push('/parent')} style={styles.gear}>
          <Text style={{ fontSize: 26 }}>⚙︎</Text>
        </Pressable>
      </View>

      <View style={[styles.grid, { gap }]}>
        {ACTIVITIES.map((a) => {
          const enabled = a.route !== null;
          return (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`${a.title}${enabled ? '' : ', coming soon'}`}
              onPress={() => open(a)}
              style={({ pressed }) => [
                styles.card,
                { width: cardWidth },
                !enabled && styles.cardDisabled,
                pressed && enabled && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[styles.emoji, !enabled && { opacity: 0.4 }]}>{a.emoji}</Text>
              <Text style={[styles.title, !enabled && { color: colors.muted }]}>{a.title}</Text>
              <Text style={styles.blurb}>{a.blurb}</Text>
              {!enabled && <Text style={styles.soon}>Coming soon</Text>}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 16 },
  hello: { fontSize: 40, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 18, color: colors.muted, marginTop: 4 },
  points: { backgroundColor: colors.ink, borderRadius: radius, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center' },
  pointsNum: { color: '#fff', fontSize: 28, fontWeight: '800' },
  pointsLabel: { color: '#fff', fontSize: 13 },
  gear: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 22, minHeight: 190, borderWidth: 2, borderColor: colors.border },
  cardDisabled: { backgroundColor: colors.disabled },
  emoji: { fontSize: 46, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  blurb: { fontSize: 16, color: colors.muted, lineHeight: 22 },
  soon: { marginTop: 10, fontSize: 14, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
});

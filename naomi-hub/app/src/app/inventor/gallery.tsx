import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, H1 } from '../../components/ui';
import { loadInventions, removeInvention, type Invention } from '../../store/inventor';
import { colors, radius } from '../../theme';

export default function Gallery() {
  const [items, setItems] = useState<Invention[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadInventions().then(setItems);
    }, []),
  );

  const confirmRemove = (item: Invention) =>
    Alert.alert('Remove this invention?', item.title, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          await removeInvention(item.id);
          setItems(await loadInventions());
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>My inventions</H1>
      {items.length === 0 ? <Body muted>Nothing yet. Finish a challenge and it shows up here.</Body> : null}
      <View style={styles.grid}>
        {items.map((i) => (
          <Pressable key={i.id} onLongPress={() => confirmRemove(i)} style={styles.card} accessibilityHint="Long press to remove">
            {i.photoUri ? <Image source={{ uri: i.photoUri }} style={styles.photo} /> : <View style={[styles.photo, styles.noPhoto]}><Text style={{ fontSize: 48 }}>🛠️</Text></View>}
            <Text style={styles.title}>{i.title}</Text>
            <Text style={styles.meta}>
              {new Date(i.at).toLocaleDateString()} · {i.minutes} min
              {i.result !== null ? ` · ${i.result} ${i.resultUnit}` : ''}
            </Text>
            <Text style={styles.q}>{i.reflectionQuestion}</Text>
            <Text style={styles.a}>{i.reflection}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  card: { width: 340, padding: 14, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  photo: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.disabled },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink, marginTop: 10 },
  meta: { fontSize: 14, color: colors.muted, marginVertical: 4 },
  q: { fontSize: 14, color: colors.muted, fontStyle: 'italic', marginTop: 4 },
  a: { fontSize: 16, color: colors.ink, lineHeight: 22 },
});

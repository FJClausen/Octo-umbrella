import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, H1, H2 } from '../components/ui';
import type { SheetRecord } from '../check/types';
import { loadSheets } from '../store/sheets';
import { colors } from '../theme';

export default function Sheets() {
  const [sheets, setSheets] = useState<SheetRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSheets().then(setSheets);
    }, []),
  );

  const open = sheets.filter((s) => s.status === 'open');
  const done = sheets.filter((s) => s.status === 'passed').slice(0, 10);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>My sheets</H1>
      <Body muted>Finish a printed sheet, then take a photo to earn screen tickets.</Body>

      <View style={styles.row}>
        <Button label="🔑  Answer keys (parent)" kind="secondary" onPress={() => router.push('/answers')} />
      </View>

      <H2>To check</H2>
      {open.length === 0 ? (
        <View style={styles.row}>
          <Button label="🖨  Print a puzzle" onPress={() => router.push('/puzzles')} />
        </View>
      ) : (
        open.map((s) => (
          <Pressable key={s.id} onPress={() => router.push(`/check/${s.id}`)} style={styles.item} accessibilityRole="button">
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{s.title}</Text>
              <Text style={styles.itemSub}>
                Sheet {s.code} · printed {new Date(s.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.cta}>📷 Check</Text>
          </Pressable>
        ))
      )}

      {done.length > 0 && (
        <>
          <H2>Done</H2>
          {done.map((s) => (
            <View key={s.id} style={[styles.item, { opacity: 0.6 }]}>
              <Text style={[styles.itemTitle, { flex: 1 }]}>✅ {s.title}</Text>
              <Text style={styles.itemSub}>Sheet {s.code}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', marginTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 18, marginBottom: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  itemTitle: { fontSize: 19, fontWeight: '700', color: colors.ink },
  itemSub: { fontSize: 15, color: colors.muted, marginTop: 2 },
  cta: { fontSize: 18, fontWeight: '800', color: colors.accent },
});

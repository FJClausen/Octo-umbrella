import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GeoMap } from '../../components/GeoMap';
import { Body, Button, Chip, H1, H2 } from '../../components/ui';
import { bboxOf, SETS, setById, type Lang } from '../../geo/data';
import { mapSheet } from '../../print/mapSheet';
import { loadGeo, saveGeo, type GeoProgress } from '../../store/geo';
import { printHtml } from '../../store/printer';
import { colors } from '../../theme';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'de', label: '🇩🇪 Deutsch' },
  { id: 'es', label: '🇪🇸 Español' },
];

export default function GeographyHome() {
  const { width } = useWindowDimensions();
  const [setId, setSetId] = useState('world');
  const [progress, setProgress] = useState<GeoProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadGeo().then(setProgress);
    }, []),
  );

  if (!progress) return <View style={styles.screen} />;
  const set = setById(setId);
  const rating = progress.rating[set.kind];

  const setLang = async (lang: Lang) => {
    const next = { ...progress, lang };
    setProgress(next);
    await saveGeo(next);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Geography Quiz</H1>
      <Body muted>10 questions that get harder as you go. Your {set.kind === 'us' ? 'US' : 'world'} rating: {rating}</Body>

      <H2>Where?</H2>
      <View style={styles.row}>
        {SETS.map((s) => (
          <Chip key={s.id} label={s.label} selected={setId === s.id} onPress={() => setSetId(s.id)} />
        ))}
      </View>
      <GeoMap places={set.places} viewBox={bboxOf(set.places)} width={Math.min(width - 56, 900)} fillFor={() => colors.lightSquare} />

      <H2>Misión: names in</H2>
      <View style={styles.row}>
        {LANGS.map((l) => (
          <Chip key={l.id} label={l.label} selected={progress.lang === l.id} onPress={() => setLang(l.id)} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button big label="▶  Start a round" onPress={() => router.push({ pathname: '/geography/play', params: { set: setId } })} />
        <Button
          big
          kind="secondary"
          label="🖨  Print a blank map"
          onPress={async () => {
            try {
              await printHtml(mapSheet(set, progress.lang, Date.now() % 2147483647));
            } catch (e) {
              Alert.alert('Could not print', e instanceof Error ? e.message : String(e));
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
});

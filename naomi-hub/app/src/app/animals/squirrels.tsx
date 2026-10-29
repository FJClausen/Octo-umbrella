import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Button, Chip, H1, H2 } from '../../components/ui';
import { loadAnimals, removeSquirrel, saveSquirrel, type Squirrel } from '../../store/animals';
import { deletePhoto, takeKeptPhoto } from '../../store/photos';
import { colors, radius } from '../../theme';

const TAGS = ['Gray fur', 'Black fur', 'Reddish fur', 'Extra bushy tail', 'Thin tail', 'Torn ear', 'Big', 'Small', 'Bold', 'Shy'];

export default function SquirrelRoster() {
  const [list, setList] = useState<Squirrel[]>([]);
  const [editing, setEditing] = useState<Squirrel | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAnimals().then((s) => setList(s.squirrels));
    }, []),
  );

  const startNew = () => {
    const at = new Date().toISOString();
    setEditing({ id: `${Date.now()}`, name: '', markings: '', tags: [], photoUri: null, sightings: 1, firstSeen: at, lastSeen: at });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return Alert.alert('Name needed', 'Give this squirrel a name.');
    const old = storedPhoto(editing.id);
    if (old && old !== editing.photoUri) deletePhoto(old);
    const next = await saveSquirrel({ ...editing, name: editing.name.trim(), markings: editing.markings.trim() });
    setList(next.squirrels);
    setEditing(null);
  };

  const storedPhoto = (id: string) => list.find((q) => q.id === id)?.photoUri ?? null;

  const cancel = () => {
    if (editing?.photoUri && editing.photoUri !== storedPhoto(editing.id)) deletePhoto(editing.photoUri);
    setEditing(null);
  };

  const sighting = async (q: Squirrel) => {
    const next = await saveSquirrel({ ...q, sightings: q.sightings + 1, lastSeen: new Date().toISOString() });
    setList(next.squirrels);
  };

  const remove = (q: Squirrel) =>
    Alert.alert(`Remove ${q.name}?`, 'This deletes the roster card.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => setList((await removeSquirrel(q.id)).squirrels) },
    ]);

  const snap = async () => {
    if (!editing) return;
    try {
      const uri = await takeKeptPhoto('squirrel');
      if (!uri) return;
      if (editing.photoUri && editing.photoUri !== storedPhoto(editing.id)) deletePhoto(editing.photoUri);
      setEditing({ ...editing, photoUri: uri });
    } catch (e) {
      Alert.alert('Camera', e instanceof Error && e.message === 'camera-denied' ? 'The camera is turned off for this app in Settings.' : String(e));
    }
  };

  if (editing) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
        <H1>{list.some((q) => q.id === editing.id) ? `Edit ${editing.name}` : 'New squirrel'}</H1>
        <H2>Name</H2>
        <TextInput style={styles.input} value={editing.name} onChangeText={(name) => setEditing({ ...editing, name })} placeholder="e.g. Captain Fluff" accessibilityLabel="Name" />
        <H2>How to recognize it</H2>
        <View style={styles.row}>
          {TAGS.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={editing.tags.includes(t)}
              onPress={() => setEditing({ ...editing, tags: editing.tags.includes(t) ? editing.tags.filter((x) => x !== t) : [...editing.tags, t] })}
            />
          ))}
        </View>
        <TextInput
          style={styles.text}
          multiline
          value={editing.markings}
          onChangeText={(markings) => setEditing({ ...editing, markings })}
          placeholder="Special markings, favorite spot, funny habits…"
          accessibilityLabel="Markings"
        />
        <H2>Photo (optional)</H2>
        {editing.photoUri ? <Image source={{ uri: editing.photoUri }} style={styles.photo} /> : null}
        <View style={styles.row}>
          <Button label={editing.photoUri ? '📷  Retake' : '📷  Take photo'} kind="secondary" onPress={snap} />
        </View>
        <View style={styles.row}>
          <Button big label="💾  Save" onPress={save} />
          <Button label="Cancel" kind="secondary" onPress={cancel} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Squirrel roster</H1>
      <Body muted>Give each yard squirrel a name and write down how to tell it apart. Long-press a card to remove it.</Body>
      <View style={styles.row}>
        <Button label="➕  Add a squirrel" onPress={startNew} />
      </View>
      {list.length === 0 ? <Body muted>No squirrels yet. Go watch the fence and meet your first one!</Body> : null}
      <View style={styles.grid}>
        {list.map((q) => (
          <Pressable key={q.id} onPress={() => setEditing(q)} onLongPress={() => remove(q)} accessibilityRole="button" accessibilityHint="Tap to edit, long-press to remove" style={styles.card}>
            {q.photoUri ? <Image source={{ uri: q.photoUri }} style={styles.thumb} /> : <Text style={styles.emoji}>🐿️</Text>}
            <Text style={styles.title}>{q.name}</Text>
            {q.tags.length ? <Text style={styles.meta}>{q.tags.join(' · ')}</Text> : null}
            {q.markings ? <Text style={styles.textSmall}>{q.markings}</Text> : null}
            <Text style={styles.meta}>
              Seen {q.sightings}× · last {new Date(q.lastSeen).toLocaleDateString()}
            </Text>
            <Button label="👀  Saw it today" kind="secondary" onPress={() => sighting(q)} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: 300, padding: 18, borderRadius: radius, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, gap: 6 },
  thumb: { width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.disabled },
  emoji: { fontSize: 64, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  textSmall: { fontSize: 16, color: colors.ink },
  photo: { width: 420, height: 315, borderRadius: radius, marginVertical: 8, backgroundColor: colors.disabled },
  input: { fontSize: 20, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, color: colors.ink, maxWidth: 420 },
  text: { minHeight: 90, fontSize: 18, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, color: colors.ink, textAlignVertical: 'top' },
});

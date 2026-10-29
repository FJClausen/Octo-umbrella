import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ParentGate } from '../../components/ParentGate';
import { Body, H1 } from '../../components/ui';
import { loadAnswerKeys, type AnswerKey } from '../../store/answerKeys';
import { colors } from '../../theme';

function AnswerKeyList() {
  const [keys, setKeys] = useState<AnswerKey[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAnswerKeys().then(setKeys);
    }, []),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 28 }}>
      <H1>Answer keys</H1>
      <Body muted>Answer keys never print. The last 30 printed sheets are kept here, newest first.</Body>
      {keys.length === 0 ? <Body muted>Nothing printed yet.</Body> : null}
      <View style={{ marginTop: 12 }}>
        {keys.map((k) => (
          <Pressable key={k.id} accessibilityRole="button" onPress={() => router.push(`/answers/${k.id}`)} style={styles.item}>
            <Text style={styles.title}>{k.title}</Text>
            <Text style={styles.sub}>Printed {new Date(k.createdAt).toLocaleString()}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

export default function AnswerKeys() {
  return (
    <ParentGate>
      <AnswerKeyList />
    </ParentGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  item: { padding: 18, marginBottom: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  title: { fontSize: 19, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginTop: 2 },
});

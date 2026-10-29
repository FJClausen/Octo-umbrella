import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ParentGate } from '../../components/ParentGate';
import { Body } from '../../components/ui';
import { getAnswerKey, type AnswerKey } from '../../store/answerKeys';
import { colors } from '../../theme';

function AnswerKeyView({ id }: { id: string }) {
  const [key, setKey] = useState<AnswerKey | null | undefined>(undefined);

  useEffect(() => {
    getAnswerKey(id).then(setKey);
  }, [id]);

  if (key === undefined) return <View style={styles.screen} />;
  if (key === null)
    return (
      <View style={[styles.screen, { padding: 28 }]}>
        <Body muted>This answer key is no longer stored.</Body>
      </View>
    );
  return <WebView style={styles.screen} originWhitelist={['*']} source={{ html: key.html }} javaScriptEnabled={false} />;
}

export default function AnswerKeyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ParentGate>{id ? <AnswerKeyView id={id} /> : null}</ParentGate>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});

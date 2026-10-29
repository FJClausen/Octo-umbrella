import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Body, Button, H1, H2, Screen } from '../components/ui';
import { renderSheet } from '../print/html';
import { isUnlocked } from '../store/pin';
import { choosePrinter, forgetPrinter, loadPrinter, printHtml, type PrinterSettings } from '../store/printer';

const TEST_PAGE = renderSheet({
  title: 'Printer test',
  subtitle: 'If you can read this, one-tap printing works.',
  puzzleHtml: '<p>Black and white only. This line is 14 point.</p>',
  answerHtml: '<p>Answer keys stay in the app.</p>',
});

export default function PrinterSetup() {
  const [printer, setPrinter] = useState<PrinterSettings>({ name: null, url: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadPrinter().then(setPrinter);
  }, []);

  if (!isUnlocked()) return <Redirect href="/parent" />;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Printer', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <H1>Printer setup</H1>
      <Body>
        Pick the HP printer once. After that, every Print button prints straight away with no dialog. Set the
        printer to black and white in its own settings if it has that option.
      </Body>

      <H2>Saved printer</H2>
      <Body>{printer.name ?? 'None'}</Body>
      {printer.url ? <Body muted>{printer.url}</Body> : null}

      <View style={styles.row}>
        <Button
          label={printer.name ? 'Choose a different printer' : 'Choose printer'}
          disabled={busy || Platform.OS !== 'ios'}
          onPress={() => run(async () => setPrinter(await choosePrinter()))}
        />
        <Button
          label="Print test page"
          kind="secondary"
          disabled={busy}
          onPress={() => run(async () => void (await printHtml(TEST_PAGE, { keepAnswerKey: false })))}
        />
        {printer.name ? (
          <Button
            label="Forget printer"
            kind="danger"
            disabled={busy}
            onPress={() =>
              run(async () => {
                await forgetPrinter();
                setPrinter({ name: null, url: null });
              })
            }
          />
        ) : null}
      </View>
      {Platform.OS !== 'ios' ? <Body muted>Choosing a printer only works on iPad.</Body> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
});

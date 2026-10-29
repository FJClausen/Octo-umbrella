import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { checkPin, isUnlocked, markUnlocked } from '../store/pin';
import { colors } from '../theme';
import { PinPad } from './PinPad';

/** Shows children only after the parent PIN (or while the parent area is still unlocked). */
export function ParentGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(isUnlocked());
  const [error, setError] = useState<string | null>(null);
  if (open) return <>{children}</>;
  return (
    <View style={styles.screen}>
      <PinPad
        title="Parent PIN"
        error={error}
        onComplete={async (pin) => {
          if (await checkPin(pin)) {
            markUnlocked();
            setOpen(true);
          } else setError('Wrong PIN.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});

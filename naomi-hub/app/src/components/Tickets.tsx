import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function TicketBadge({ count, gateOn }: { count: number; gateOn: boolean }) {
  return (
    <View style={styles.badge} accessibilityLabel={gateOn ? `${count} screen tickets` : 'Screen tickets off'}>
      <Text style={styles.num}>{gateOn ? `🎟 ${count}` : '🎟 ∞'}</Text>
      <Text style={styles.label}>{gateOn ? 'screen tickets' : 'tickets off today'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: colors.accent, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center' },
  num: { color: '#fff', fontSize: 28, fontWeight: '800' },
  label: { color: '#fff', fontSize: 13 },
});

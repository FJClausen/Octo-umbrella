import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '700', fontSize: 20 },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="parent" options={{ title: 'Parent area' }} />
        <Stack.Screen name="printer" options={{ title: 'Printer setup' }} />
        <Stack.Screen name="puzzles" options={{ title: 'Puzzle Printer' }} />
        <Stack.Screen name="chess/index" options={{ title: 'Chess Puzzles' }} />
        <Stack.Screen name="chess/play" options={{ title: 'Chess round' }} />
      </Stack>
    </>
  );
}

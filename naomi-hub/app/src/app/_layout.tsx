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
        <Stack.Screen name="sheets" options={{ title: 'My sheets' }} />
        <Stack.Screen name="check/[id]" options={{ title: 'Check my answers' }} />
        <Stack.Screen name="answers/index" options={{ title: 'Answer keys' }} />
        <Stack.Screen name="answers/[id]" options={{ title: 'Answer key' }} />
        <Stack.Screen name="math/index" options={{ title: 'Math in the Wild' }} />
        <Stack.Screen name="math/[id]" options={{ title: 'Math mission' }} />
        <Stack.Screen name="inventor/index" options={{ title: 'Inventor’s Challenge' }} />
        <Stack.Screen name="inventor/[id]" options={{ title: 'Challenge' }} />
        <Stack.Screen name="inventor/gallery" options={{ title: 'My inventions' }} />
        <Stack.Screen name="geography/index" options={{ title: 'Geography Quiz' }} />
        <Stack.Screen name="geography/play" options={{ title: 'Geography round' }} />
        <Stack.Screen name="animals/index" options={{ title: 'Animal Detective' }} />
        <Stack.Screen name="animals/sit/[id]" options={{ title: 'Detective sit' }} />
        <Stack.Screen name="animals/guide" options={{ title: 'Field guide' }} />
        <Stack.Screen name="animals/squirrels" options={{ title: 'Squirrel roster' }} />
      </Stack>
    </>
  );
}

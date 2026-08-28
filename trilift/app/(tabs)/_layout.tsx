import type { ColorValue } from 'react-native';

import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/Icon';
import { colors } from '@/lib/theme';

const tab =
  (name: IconName) =>
  ({ color }: { color: ColorValue }) => <Icon name={name} color={color} size={24} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', headerShown: false, tabBarIcon: tab('today') }}
      />
      <Tabs.Screen
        name="strength"
        options={{ title: 'Strength', tabBarIcon: tab('strength') }}
      />
      <Tabs.Screen name="cardio" options={{ title: 'Cardio', tabBarIcon: tab('cardio') }} />
      <Tabs.Screen name="body" options={{ title: 'Body', tabBarIcon: tab('body') }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Fuel', tabBarIcon: tab('fuel') }} />
    </Tabs>
  );
}

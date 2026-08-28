import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import { useProfile } from '@/api/profile';
import { Body, Card, H2, Loading, Screen } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, space } from '@/lib/theme';

/**
 * The gate. Decides between setup instructions, sign-in, onboarding and the app
 * proper, so no screen below has to think about it.
 */
export default function Index() {
  const { session, loading, userId } = useAuthSession();
  const { data: profile, isPending: profilePending } = useProfile(userId);

  if (!isSupabaseConfigured) return <SetupNeeded />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <Loading />
      </View>
    );
  }

  if (!session) return <Redirect href="/sign-in" />;

  if (profilePending) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <Loading />
      </View>
    );
  }

  if (!profile?.onboarded_at) return <Redirect href="/onboarding" />;

  return <Redirect href="/(tabs)" />;
}

function SetupNeeded() {
  return (
    <Screen>
      <H2>Almost there</H2>
      <Card>
        <Body>
          TriLift needs a Supabase project before it can store anything. Copy{' '}
          <Body style={{ color: colors.strength }}>.env.example</Body> to{' '}
          <Body style={{ color: colors.strength }}>.env</Body>, fill in your project URL and anon
          key, then restart the dev server.
        </Body>
        <Body style={{ marginTop: space.md, color: colors.textDim }}>
          The full walkthrough — creating the project, running the migration, deploying the edge
          functions — is in docs/SETUP.md.
        </Body>
      </Card>
    </Screen>
  );
}

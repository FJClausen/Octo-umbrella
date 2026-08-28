import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { signIn, signUp } from '@/api/auth';
import { Body, Button, Caption, Card, Field, H1, Screen } from '@/components/ui';
import { colors, space } from '@/lib/theme';

export default function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check the details', 'An email and a password of at least 6 characters, please.');
      return;
    }

    setBusy(true);
    const { error } =
      mode === 'in'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);

    if (error) {
      Alert.alert(mode === 'in' ? 'Could not sign in' : 'Could not sign up', error.message);
      return;
    }

    if (mode === 'up') {
      Alert.alert(
        'Check your inbox',
        'If email confirmation is on for your Supabase project, confirm the address and then sign in.',
      );
      setMode('in');
      return;
    }

    router.replace('/');
  };

  return (
    <Screen>
      <View style={{ height: space.xxl }} />
      <H1>TriLift</H1>
      <Body style={{ color: colors.textDim }}>
        Strength, bike, swim and the scale — in one place, on one plan.
      </Body>

      <Card style={{ marginTop: space.lg, gap: space.md }}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 6 characters"
        />
        <Button
          title={mode === 'in' ? 'Sign in' : 'Create account'}
          onPress={submit}
          loading={busy}
        />
        <Button
          title={mode === 'in' ? 'No account yet? Sign up' : 'Already have an account? Sign in'}
          variant="ghost"
          onPress={() => setMode(mode === 'in' ? 'up' : 'in')}
        />
      </Card>

      <Caption>
        Your data lives in your own Supabase project and is locked to your account by row-level
        security.
      </Caption>
    </Screen>
  );
}

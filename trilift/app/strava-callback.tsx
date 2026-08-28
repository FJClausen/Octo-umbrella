import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { exchangeStravaCode } from '@/api/cardio';
import { Body, Button, Card, H3, Loading, Screen } from '@/components/ui';
import { colors, space } from '@/lib/theme';

/**
 * Strava redirects here after consent. The code is handed straight to the edge
 * function, which does the token exchange server-side — the phone never holds a
 * Strava token.
 */
export default function StravaCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; scope?: string; error?: string }>();
  const [status, setStatus] = useState<'working' | 'done' | 'failed'>('working');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (params.error) {
      setStatus('failed');
      setMessage(`Strava said: ${params.error}`);
      return;
    }
    if (!params.code) {
      setStatus('failed');
      setMessage('No authorisation code came back from Strava.');
      return;
    }

    exchangeStravaCode(params.code, params.scope ?? null)
      .then(() => setStatus('done'))
      .catch((error: unknown) => {
        setStatus('failed');
        setMessage(error instanceof Error ? error.message : 'Unknown error');
      });
  }, [params.code, params.scope, params.error]);

  return (
    <Screen>
      {status === 'working' ? <Loading /> : null}

      {status === 'done' ? (
        <Card accent={colors.bike}>
          <H3>Strava connected</H3>
          <Body style={{ color: colors.textDim, marginTop: space.sm }}>
            Your rides and swims will sync from here on.
          </Body>
          <Button
            title="Back to Cardio"
            onPress={() => router.replace('/(tabs)/cardio')}
            style={{ marginTop: space.md }}
          />
        </Card>
      ) : null}

      {status === 'failed' ? (
        <Card>
          <H3>That did not work</H3>
          <Body style={{ color: colors.textDim, marginTop: space.sm }}>{message}</Body>
          <Button
            title="Back"
            variant="secondary"
            onPress={() => router.replace('/(tabs)/cardio')}
            style={{ marginTop: space.md }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

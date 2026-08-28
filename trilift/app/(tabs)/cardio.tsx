import { useMemo, useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import {
  getStravaAuthUrl,
  useActivities,
  useDisconnectStrava,
  useStravaConnection,
  useSyncStrava,
} from '@/api/cardio';
import { useProfile } from '@/api/profile';
import { TrendChart } from '@/components/TrendChart';
import {
  Body,
  Button,
  Caption,
  Card,
  Chip,
  Divider,
  EmptyState,
  H3,
  Label,
  Loading,
  Row,
  Screen,
  StatTile,
} from '@/components/ui';
import { bikeIntervalTargets } from '@/data/plan';
import type { StravaActivity } from '@/lib/database.types';
import { duration, km, pacePer100, relative, shortDate, watts } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import * as WebBrowser from 'expo-web-browser';

type Filter = 'all' | 'Ride' | 'Swim';

export default function CardioTab() {
  const { userId } = useAuthSession();
  const { data: profile } = useProfile(userId);
  const connectionQ = useStravaConnection(userId);
  const activitiesQ = useActivities(userId);
  const sync = useSyncStrava(userId);
  const disconnect = useDisconnectStrava(userId);

  const [filter, setFilter] = useState<Filter>('all');
  const [connecting, setConnecting] = useState(false);

  const activities = activitiesQ.data ?? [];
  const connection = connectionQ.data;

  const rides = useMemo(() => activities.filter((a) => a.type === 'Ride'), [activities]);
  const swims = useMemo(() => activities.filter((a) => a.type === 'Swim'), [activities]);

  const shown = filter === 'all' ? activities : activities.filter((a) => a.type === filter);

  // Oldest-first for the charts; the list below stays newest-first.
  const powerPoints = useMemo(
    () =>
      [...rides]
        .filter((r) => (r.moving_time_s ?? 0) >= 20 * 60)
        .filter((r) => (r.weighted_average_watts ?? r.average_watts) != null)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .map((r) => ({
          date: r.start_date.slice(0, 10),
          value: Number(r.weighted_average_watts ?? r.average_watts),
        })),
    [rides],
  );

  const pacePoints = useMemo(
    () =>
      [...swims]
        .filter((s) => (s.distance_m ?? 0) >= 400 && (s.moving_time_s ?? 0) > 0)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .map((s) => ({
          date: s.start_date.slice(0, 10),
          // Seconds per 100m — lower is better, which the axis shows honestly.
          value: (Number(s.moving_time_s) / Number(s.distance_m)) * 100,
        })),
    [swims],
  );

  const connect = async () => {
    setConnecting(true);
    try {
      const url = await getStravaAuthUrl();
      await WebBrowser.openAuthSessionAsync(url, 'trilift://strava-callback');
      connectionQ.refetch();
    } catch (error) {
      Alert.alert(
        'Could not start Strava sign-in',
        error instanceof Error
          ? error.message
          : 'Check that the strava-oauth edge function is deployed and its secrets are set.',
      );
    } finally {
      setConnecting(false);
    }
  };

  const runSync = () => {
    sync.mutate(undefined, {
      onError: (error) =>
        Alert.alert('Sync failed', error instanceof Error ? error.message : 'Unknown error'),
    });
  };

  if (connectionQ.isPending) return <Screen><Loading /></Screen>;

  const targets = bikeIntervalTargets(profile?.ftp_watts ?? null);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={activitiesQ.isFetching}
          onRefresh={() => activitiesQ.refetch()}
          tintColor={colors.textDim}
        />
      }
    >
      {!connection ? (
        <Card accent={colors.bike}>
          <H3>Connect Strava</H3>
          <Body style={{ color: colors.textDim, marginTop: space.sm }}>
            Your Garmin rides and swims flow into Strava, and TriLift reads them from there — so
            cardio logs itself. Your Strava tokens stay on the server, never on the phone.
          </Body>
          <Button title="Connect" onPress={connect} loading={connecting} style={{ marginTop: space.md }} />
        </Card>
      ) : (
        <Card accent={colors.bike}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <H3>Strava connected</H3>
              <Caption>
                {connection.athlete_name ?? 'Athlete'} ·{' '}
                {connection.last_synced_at
                  ? `synced ${relative(connection.last_synced_at)}`
                  : 'never synced'}
              </Caption>
            </View>
          </Row>
          <Row style={{ marginTop: space.md }}>
            <Button title="Sync now" onPress={runSync} loading={sync.isPending} style={{ flex: 1 }} />
            <Button
              title="Disconnect"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() =>
                Alert.alert('Disconnect Strava?', 'Synced activities stay; new ones stop arriving.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Disconnect', style: 'destructive', onPress: () => disconnect.mutate() },
                ])
              }
            />
          </Row>
        </Card>
      )}

      {targets ? (
        <Card accent={colors.bike}>
          <H3>Interval targets</H3>
          <Caption>From an FTP of {profile?.ftp_watts} W. One hard ride a week — this is it.</Caption>
          <Row style={{ marginTop: space.md, gap: space.sm }}>
            <StatTile label="Threshold" value={targets.threshold} accent={colors.bike} />
            <StatTile label="VO2max" value={targets.vo2max} accent={colors.bike} />
          </Row>
          <Row style={{ marginTop: space.sm, gap: space.sm }}>
            <StatTile label="Endurance (Z2)" value={targets.endurance} />
            <StatTile label="Tempo" value={targets.tempo} />
          </Row>
        </Card>
      ) : null}

      {powerPoints.length ? (
        <Card accent={colors.bike}>
          <H3>Ride power</H3>
          <Caption>Normalised power on rides of 20 minutes or more.</Caption>
          <View style={{ marginTop: space.md }}>
            <TrendChart points={powerPoints} unit=" W" color={colors.bike} digits={0} height={160} />
          </View>
        </Card>
      ) : null}

      {pacePoints.length ? (
        <Card accent={colors.swim}>
          <H3>Swim pace</H3>
          <Caption>Seconds per 100 m on swims of 400 m or more — lower is faster.</Caption>
          <View style={{ marginTop: space.md }}>
            <TrendChart points={pacePoints} unit=" s/100m" color={colors.swim} digits={0} height={160} />
          </View>
        </Card>
      ) : null}

      <Row>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} color={colors.textDim} />
        <Chip label="Rides" selected={filter === 'Ride'} onPress={() => setFilter('Ride')} color={colors.bike} />
        <Chip label="Swims" selected={filter === 'Swim'} onPress={() => setFilter('Swim')} color={colors.swim} />
      </Row>

      {!shown.length ? (
        <EmptyState
          title="Nothing synced yet"
          body={
            connection
              ? 'Tap “Sync now” to pull your recent Strava activities.'
              : 'Connect Strava and your rides and swims show up here on their own.'
          }
        />
      ) : (
        shown.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
      )}
    </Screen>
  );
}

function ActivityCard({ activity }: { activity: StravaActivity }) {
  const isRide = activity.type === 'Ride';
  const isSwim = activity.type === 'Swim';
  const accent = isRide ? colors.bike : isSwim ? colors.swim : colors.border;

  return (
    <Card accent={accent}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>{activity.name ?? activity.type}</Body>
          <Caption>
            {shortDate(activity.start_date)} · {activity.type}
          </Caption>
        </View>
        <Label>{duration(activity.moving_time_s)}</Label>
      </Row>

      <Divider />

      <Row style={{ gap: space.sm }}>
        {isSwim ? (
          <>
            <StatTile label="Distance" value={`${Math.round(Number(activity.distance_m ?? 0))} m`} />
            <StatTile
              label="Pace"
              value={pacePer100(activity.distance_m, activity.moving_time_s)}
              accent={colors.swim}
            />
          </>
        ) : (
          <>
            <StatTile label="Distance" value={km(activity.distance_m)} />
            <StatTile
              label={activity.weighted_average_watts ? 'Normalised' : 'Avg power'}
              value={watts(activity.weighted_average_watts ?? activity.average_watts)}
              accent={colors.bike}
            />
          </>
        )}
        <StatTile
          label="Avg HR"
          value={activity.average_heartrate ? `${Math.round(Number(activity.average_heartrate))}` : '—'}
        />
      </Row>
    </Card>
  );
}

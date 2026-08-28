import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { useAnalyzePhoto, usePhotoAnalyses } from '@/api/ai';
import { useAuthSession } from '@/api/auth';
import { useBodyLogs, useSignedPhotoUrl } from '@/api/body';
import { useProfile } from '@/api/profile';
import { TrendChart } from '@/components/TrendChart';
import {
  Body,
  Button,
  Caption,
  Card,
  Divider,
  EmptyState,
  H3,
  Label,
  Loading,
  Row,
  Screen,
} from '@/components/ui';
import type { BodyLog } from '@/lib/database.types';
import { longDate, relative } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import { formatWeight, toDisplay, unitLabel } from '@/lib/units';
import { smoothed, weightPoints } from '@/logic/trend';

export default function BodyTab() {
  const router = useRouter();
  const { userId } = useAuthSession();
  const { data: profile } = useProfile(userId);
  const { data: logs, isPending } = useBodyLogs(userId);
  const { data: analyses } = usePhotoAnalyses(userId);
  const analyze = useAnalyzePhoto(userId);

  const units = profile?.unit_system ?? 'metric';
  const points = useMemo(() => weightPoints(logs ?? []), [logs]);
  const trend = useMemo(() => smoothed(points), [points]);

  const latestAnalysis = analyses?.[0];
  const daysSinceAnalysis = latestAnalysis
    ? Math.floor((Date.now() - new Date(latestAnalysis.created_at).getTime()) / 86_400_000)
    : null;
  const analysisDue =
    daysSinceAnalysis == null || daysSinceAnalysis >= (profile?.photo_analysis_days ?? 30);

  const latestPhotoLog = logs?.find((l) => l.photo_path);

  if (isPending) return <Screen><Loading /></Screen>;

  return (
    <Screen>
      <Button title="Weekly check-in" onPress={() => router.push('/check-in')} />

      <Card accent={colors.body}>
        <H3>Weight</H3>
        <Caption>
          Dots are what the scale said; the line is the trend. Judge progress by the line.
        </Caption>
        <View style={{ marginTop: space.md }}>
          <TrendChart
            points={points.map((p) => ({ date: p.date, value: toDisplay(p.weight, units)! }))}
            trend={trend.map((p) => ({ date: p.date, value: toDisplay(p.weight, units)! }))}
            reference={
              profile?.goal_weight_kg
                ? { value: toDisplay(profile.goal_weight_kg, units)!, label: 'goal' }
                : undefined
            }
            unit={` ${unitLabel(units)}`}
            color={colors.body}
          />
        </View>
      </Card>

      {/* ---- AI photo read -------------------------------------------------- */}
      <Card accent={colors.body}>
        <H3>Progress photo read</H3>
        <Body style={{ color: colors.textDim, marginTop: space.sm }}>
          A qualitative look at muscle balance across your photos, turned into an emphasis
          suggestion for the next block.
        </Body>
        <Caption style={{ marginTop: space.sm }}>
          Your photo is sent to the Anthropic API for this, from the server — never from your
          phone. Lighting, pose and camera angle move the result more than your training does, so
          treat it as a nudge, not a measurement.
        </Caption>

        {latestAnalysis ? (
          <>
            <Divider />
            <Row style={{ justifyContent: 'space-between' }}>
              <Label>Last read</Label>
              <Caption>{relative(latestAnalysis.created_at)}</Caption>
            </Row>
            {latestAnalysis.summary ? (
              <Body style={{ marginTop: space.sm }}>{latestAnalysis.summary}</Body>
            ) : null}
            {latestAnalysis.emphasis?.map((item) => (
              <Row key={item.area} style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
                <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.body }} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '600' }}>{item.area}</Body>
                  <Caption>{item.note}</Caption>
                </View>
              </Row>
            ))}
          </>
        ) : null}

        <Button
          title={analysisDue ? 'Run a read on the latest photo' : 'Run again anyway'}
          variant={analysisDue ? 'primary' : 'secondary'}
          loading={analyze.isPending}
          disabled={!latestPhotoLog}
          onPress={() => latestPhotoLog && analyze.mutate(latestPhotoLog.id)}
          style={{ marginTop: space.md }}
        />
        {!latestPhotoLog ? (
          <Caption style={{ marginTop: space.sm }}>Add a photo in a check-in first.</Caption>
        ) : !analysisDue ? (
          <Caption style={{ marginTop: space.sm }}>
            Next one due in {(profile?.photo_analysis_days ?? 30) - (daysSinceAnalysis ?? 0)} days —
            changes are easier to see with time between shots.
          </Caption>
        ) : null}
      </Card>

      <H3>Check-ins</H3>
      {!logs?.length ? (
        <EmptyState
          title="No check-ins yet"
          body="One weigh-in a week, same time of day, is enough to draw a trend you can trust."
        />
      ) : (
        logs.map((log) => <CheckInCard key={log.id} log={log} units={units} />)
      )}
    </Screen>
  );
}

function CheckInCard({ log, units }: { log: BodyLog; units: 'metric' | 'imperial' }) {
  const { data: photoUrl } = useSignedPhotoUrl(log.photo_path);
  const measurements = Object.entries(log.measurements ?? {}).filter(([, v]) => v != null);

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Body style={{ fontWeight: '600' }}>{longDate(log.logged_on)}</Body>
        <Label>{formatWeight(log.weight_kg, units)}</Label>
      </Row>

      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ height: 260, borderRadius: radius.md, marginTop: space.md }}
          resizeMode="cover"
        />
      ) : null}

      {measurements.length ? (
        <Row style={{ flexWrap: 'wrap', marginTop: space.md, gap: space.md }}>
          {measurements.map(([key, value]) => (
            <View key={key}>
              <Label>{key.replace('_cm', '').replace('_', ' ')}</Label>
              <Body>{value} cm</Body>
            </View>
          ))}
        </Row>
      ) : null}

      {log.notes ? <Caption style={{ marginTop: space.sm }}>“{log.notes}”</Caption> : null}
    </Card>
  );
}

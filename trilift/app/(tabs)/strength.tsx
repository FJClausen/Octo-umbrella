import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import { useProfile } from '@/api/profile';
import { useDeleteStrengthSession, useStrengthSessions } from '@/api/strength';
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
import { CALF_KEYS, templateByKey } from '@/data/plan';
import type { StrengthSession } from '@/lib/database.types';
import { longDate } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import { toDisplay, unitLabel } from '@/lib/units';
import { estimated1RM } from '@/logic/prs';
import { topCalfLoad } from '@/logic/streaks';

export default function StrengthTab() {
  const router = useRouter();
  const { userId } = useAuthSession();
  const { data: profile } = useProfile(userId);
  const { data: sessions, isPending } = useStrengthSessions(userId);
  const remove = useDeleteStrengthSession(userId);

  const units = profile?.unit_system ?? 'metric';

  /**
   * The calf-raise load over time gets its own chart. It is the one number in
   * the plan with a specific job — keeping the Achilles under progressive load —
   * so it does not get buried inside session history.
   */
  const calfPoints = useMemo(() => {
    if (!sessions) return [];
    return [...sessions]
      .sort((a, b) => a.performed_on.localeCompare(b.performed_on))
      .map((s) => ({ date: s.performed_on, load: topCalfLoad(s) }))
      .filter((p): p is { date: string; load: number } => p.load != null)
      .map((p) => ({ date: p.date, value: toDisplay(p.load, units)! }));
  }, [sessions, units]);

  const confirmDelete = (session: StrengthSession) =>
    Alert.alert('Delete this session?', `${longDate(session.performed_on)} — this cannot be undone.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(session.id) },
    ]);

  if (isPending) return <Screen><Loading /></Screen>;

  return (
    <Screen>
      <Button title="Log a session" onPress={() => router.push('/log-strength')} />

      <Card accent={colors.good}>
        <H3>Calf raise progression</H3>
        <Caption>
          Heaviest calf-raise load per session. Slow and heavy is the point — keep this line
          creeping up and the tendon keeps getting stronger.
        </Caption>
        <View style={{ marginTop: space.md }}>
          <TrendChart
            points={calfPoints}
            unit={` ${unitLabel(units)}`}
            color={colors.good}
            height={160}
          />
        </View>
      </Card>

      <H3>History</H3>

      {!sessions?.length ? (
        <EmptyState
          title="No sessions yet"
          body="Three full-body sessions a week, thirty minutes each. Log the first one and the charts start filling in."
        />
      ) : (
        sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            units={units}
            onDelete={() => confirmDelete(session)}
          />
        ))
      )}
    </Screen>
  );
}

function SessionCard({
  session,
  units,
  onDelete,
}: {
  session: StrengthSession;
  units: 'metric' | 'imperial';
  onDelete: () => void;
}) {
  const template = templateByKey(session.template_key);
  const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
  const volume = session.exercises.reduce(
    (a, e) => a + e.sets.reduce((b, s) => b + (s.weight_kg ?? 0) * s.reps, 0),
    0,
  );

  return (
    <Card accent={colors.strength}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <H3>{template?.name ?? 'Session'}</H3>
          <Caption>{longDate(session.performed_on)}</Caption>
        </View>
        <Label>
          {totalSets} sets · {Math.round(toDisplay(volume, units) ?? 0).toLocaleString()}{' '}
          {unitLabel(units)} volume
        </Label>
      </Row>

      {session.achilles_pain != null ? (
        <Caption
          style={{
            marginTop: space.sm,
            color: session.achilles_pain >= 4 ? colors.warn : colors.textDim,
          }}
        >
          Achilles {session.achilles_pain}/10
          {session.achilles_pain >= 4 ? ' — hold the load steady rather than adding' : ''}
        </Caption>
      ) : null}

      <Divider />

      {session.exercises.map((exercise) => {
        const best = exercise.sets.reduce(
          (max, s) => (s.weight_kg ? Math.max(max, estimated1RM(s.weight_kg, s.reps)) : max),
          0,
        );
        return (
          <Row key={exercise.key} style={{ marginBottom: space.sm, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Body style={CALF_KEYS.includes(exercise.key) ? { color: colors.good } : undefined}>
                {exercise.name}
              </Body>
              <Caption>
                {exercise.sets
                  .map((s) =>
                    s.weight_kg
                      ? `${trim(toDisplay(s.weight_kg, units)!)}×${s.reps}`
                      : `bw×${s.reps}`,
                  )
                  .join('  ')}
              </Caption>
            </View>
            {best > 0 ? (
              <Label>{trim(toDisplay(best, units)!)} e1RM</Label>
            ) : null}
          </Row>
        );
      })}

      {session.notes ? <Caption>“{session.notes}”</Caption> : null}

      <Button title="Delete" variant="ghost" onPress={onDelete} style={{ marginTop: space.sm }} />
    </Card>
  );
}

const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

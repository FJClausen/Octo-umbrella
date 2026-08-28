import { Link, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import { useBodyLogs } from '@/api/body';
import { useActivities } from '@/api/cardio';
import { useProfile } from '@/api/profile';
import { useStrengthSessions } from '@/api/strength';
import { Icon } from '@/components/Icon';
import { TrendChart } from '@/components/TrendChart';
import {
  Body,
  Button,
  Caption,
  Card,
  Divider,
  H1,
  H3,
  Label,
  Loading,
  ProgressBar,
  Row,
  Screen,
  StatTile,
} from '@/components/ui';
import { WEEKLY_PLAN } from '@/data/plan';
import { relative } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import { formatWeight, toDisplay, unitLabel } from '@/lib/units';
import { allPRs, recentPRs } from '@/logic/prs';
import { weeklyRecap } from '@/logic/recap';
import { calfProgressionStreak, sessionsThisWeek, strengthWeekStreak } from '@/logic/streaks';
import { goalProgress, weeksToGoal } from '@/logic/targets';
import { latestWeight, smoothed, weeklyRate, weightPoints } from '@/logic/trend';

export default function Dashboard() {
  const router = useRouter();
  const { userId } = useAuthSession();

  const profileQ = useProfile(userId);
  const bodyQ = useBodyLogs(userId);
  const strengthQ = useStrengthSessions(userId);
  const cardioQ = useActivities(userId);

  const profile = profileQ.data;
  const logs = bodyQ.data ?? [];
  const sessions = strengthQ.data ?? [];
  const activities = cardioQ.data ?? [];

  const units = profile?.unit_system ?? 'metric';

  const points = useMemo(() => weightPoints(logs), [logs]);
  const trend = useMemo(() => smoothed(points), [points]);
  const current = latestWeight(trend);
  const rate = weeklyRate(points);

  const prs = useMemo(() => recentPRs(allPRs(sessions, activities)), [sessions, activities]);
  const recap = useMemo(() => weeklyRecap(sessions, activities, points), [sessions, activities, points]);

  const doneThisWeek = sessionsThisWeek(sessions);
  const weekStreak = strengthWeekStreak(sessions);
  const calfStreak = calfProgressionStreak(sessions);

  const refreshing = profileQ.isFetching || bodyQ.isFetching || strengthQ.isFetching;
  const refresh = () => {
    profileQ.refetch();
    bodyQ.refetch();
    strengthQ.refetch();
    cardioQ.refetch();
  };

  if (profileQ.isPending || !profile) return <Screen><Loading /></Screen>;

  const progress = goalProgress(profile, current);
  const weeksLeft = weeksToGoal(current, profile);

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textDim} />}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Caption>{greeting()}</Caption>
          <H1>{profile.display_name?.split(' ')[0] ?? 'Today'}</H1>
        </View>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12} accessibilityLabel="Settings">
          <Icon name="settings" color={colors.textDim} size={22} />
        </Pressable>
      </Row>

      {/* ---- Weight vs goal ------------------------------------------------ */}
      <Card accent={colors.body}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H3>Weight</H3>
          <Link href="/check-in" style={{ color: colors.body, fontWeight: '600' }}>
            Check in
          </Link>
        </Row>

        <Row style={{ alignItems: 'baseline', gap: space.sm, marginTop: space.sm }}>
          <Body style={{ fontSize: 34, fontWeight: '700' }}>
            {current != null ? formatWeight(current, units) : '—'}
          </Body>
          {rate != null ? (
            <Caption>
              {rate < 0 ? '▼' : rate > 0 ? '▲' : '■'} {Math.abs(toDisplay(rate, units) ?? 0).toFixed(2)}{' '}
              {unitLabel(units)}/week
            </Caption>
          ) : null}
        </Row>

        {progress != null ? (
          <View style={{ marginTop: space.md, gap: space.xs }}>
            <ProgressBar value={progress} color={colors.body} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Caption>
                {formatWeight(profile.start_weight_kg, units, 0)} start
              </Caption>
              <Caption>
                {weeksLeft === 0
                  ? 'Goal reached'
                  : weeksLeft != null
                    ? `~${weeksLeft} weeks to go`
                    : ''}
              </Caption>
              <Caption>{formatWeight(profile.goal_weight_kg, units, 0)} goal</Caption>
            </Row>
          </View>
        ) : null}

        <Divider />
        <TrendChart
          points={points.map((p) => ({ date: p.date, value: toDisplay(p.weight, units)! }))}
          trend={trend.map((p) => ({ date: p.date, value: toDisplay(p.weight, units)! }))}
          reference={
            profile.goal_weight_kg
              ? { value: toDisplay(profile.goal_weight_kg, units)!, label: 'goal' }
              : undefined
          }
          unit={` ${unitLabel(units)}`}
          color={colors.body}
        />
      </Card>

      {/* ---- This week ----------------------------------------------------- */}
      <Card accent={colors.strength}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H3>This week</H3>
          <Caption>{doneThisWeek} of 3 strength</Caption>
        </Row>
        <Row style={{ marginTop: space.md, gap: space.sm }}>
          <StatTile
            label="Week streak"
            value={weekStreak > 0 ? `${weekStreak}` : '—'}
            hint={weekStreak > 0 ? 'weeks at target' : 'hit 3 to start one'}
            accent={weekStreak > 0 ? colors.good : undefined}
          />
          <StatTile
            label="Calf load"
            value={calfStreak > 0 ? `${calfStreak}` : '—'}
            hint={calfStreak > 0 ? 'sessions holding or up' : 'the tendon metric'}
            accent={calfStreak >= 3 ? colors.good : undefined}
          />
        </Row>
        <Button
          title="Log a strength session"
          onPress={() => router.push('/log-strength')}
          style={{ marginTop: space.md }}
        />
      </Card>

      {/* ---- PRs ------------------------------------------------------------ */}
      {prs.length ? (
        <Card accent={colors.good}>
          <H3>Recent personal bests</H3>
          {prs.slice(0, 4).map((pr) => (
            <Row key={`${pr.label}-${pr.date}`} style={{ marginTop: space.sm, justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Body>{pr.label}</Body>
                <Caption>{relative(`${pr.date}T12:00:00Z`)}</Caption>
              </View>
              <Label style={{ color: colors.good }}>{pr.value}</Label>
            </Row>
          ))}
        </Card>
      ) : null}

      {/* ---- Weekly recap --------------------------------------------------- */}
      <Card>
        <H3>{recap.headline}</H3>
        {recap.lines.map((line) => (
          <Body key={line} style={{ color: colors.textDim, marginTop: space.sm }}>
            {line}
          </Body>
        ))}
      </Card>

      {/* ---- The plan -------------------------------------------------------- */}
      <Card>
        <H3>The week, as planned</H3>
        {WEEKLY_PLAN.map((item) => (
          <Row key={item.key} style={{ marginTop: space.md, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 4,
                alignSelf: 'stretch',
                borderRadius: 2,
                backgroundColor:
                  item.kind === 'strength'
                    ? colors.strength
                    : item.kind === 'bike'
                      ? colors.bike
                      : item.kind === 'swim'
                        ? colors.swim
                        : colors.border,
              }}
            />
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '600' }}>{item.title}</Body>
              <Caption>{item.detail}</Caption>
            </View>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

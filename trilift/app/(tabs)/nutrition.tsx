import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import { useBodyLogs } from '@/api/body';
import { useNutritionLogs, useSaveNutritionLog } from '@/api/nutrition';
import { useProfile } from '@/api/profile';
import {
  Body,
  Button,
  Caption,
  Card,
  Divider,
  EmptyState,
  Field,
  H3,
  Label,
  Loading,
  ProgressBar,
  Row,
  Screen,
  StatTile,
} from '@/components/ui';
import { shortDate, todayISO } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import { dailyTargets } from '@/logic/targets';
import { latestWeight, weightPoints } from '@/logic/trend';

export default function NutritionTab() {
  const { userId } = useAuthSession();
  const { data: profile, isPending } = useProfile(userId);
  const { data: bodyLogs } = useBodyLogs(userId);
  const { data: logs } = useNutritionLogs(userId);
  const save = useSaveNutritionLog(userId);

  const today = todayISO();
  const todayLog = logs?.find((l) => l.logged_on === today);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const currentWeight = useMemo(
    () => latestWeight(weightPoints(bodyLogs ?? [])),
    [bodyLogs],
  );

  const targets = profile ? dailyTargets(profile, currentWeight) : null;

  if (isPending || !profile) return <Screen><Loading /></Screen>;

  const eaten = todayLog?.calories ?? 0;
  const proteinEaten = todayLog?.protein_g ?? 0;

  const submit = () => {
    save.mutate({
      logged_on: today,
      calories: Number(calories) || todayLog?.calories || null,
      protein_g: Number(protein) || todayLog?.protein_g || null,
    });
    setCalories('');
    setProtein('');
  };

  return (
    <Screen>
      {targets ? (
        <Card accent={colors.good}>
          <H3>Today's targets</H3>
          <Caption>
            A moderate deficit off an estimated {targets.maintenance} kcal maintenance — sized to
            hold onto muscle while the weight comes off, not to strip it fast.
          </Caption>

          <Row style={{ marginTop: space.md, gap: space.sm }}>
            <StatTile label="Calories" value={`${targets.calories}`} hint={`${targets.deficit} kcal deficit`} />
            <StatTile
              label="Protein"
              value={`${targets.proteinG} g`}
              hint={`${profile.protein_g_per_kg} g/kg`}
              accent={colors.good}
            />
          </Row>

          <Divider />

          <Label>Calories today</Label>
          <Row style={{ marginTop: space.xs }}>
            <View style={{ flex: 1 }}>
              <ProgressBar
                value={eaten / targets.calories}
                color={eaten > targets.calories * 1.1 ? colors.warn : colors.good}
              />
            </View>
            <Caption>{eaten} / {targets.calories}</Caption>
          </Row>

          <Label style={{ marginTop: space.md }}>Protein today</Label>
          <Row style={{ marginTop: space.xs }}>
            <View style={{ flex: 1 }}>
              <ProgressBar value={proteinEaten / targets.proteinG} color={colors.good} />
            </View>
            <Caption>{proteinEaten} / {targets.proteinG} g</Caption>
          </Row>
        </Card>
      ) : (
        <EmptyState
          title="Targets need a couple of numbers"
          body="Add your date of birth and height in Settings, and log a weight, and the calorie and protein targets appear here."
        />
      )}

      <Card style={{ gap: space.md }}>
        <H3>Log today</H3>
        <Caption>
          One number for calories, one for protein. Deliberately not a food diary — the point is
          the daily total, not the itemised list.
        </Caption>
        <Field
          label="Calories"
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          placeholder={todayLog?.calories ? String(todayLog.calories) : '0'}
          suffix="kcal"
        />
        <Field
          label="Protein"
          value={protein}
          onChangeText={setProtein}
          keyboardType="number-pad"
          placeholder={todayLog?.protein_g ? String(todayLog.protein_g) : '0'}
          suffix="g"
        />
        <Button title="Save" onPress={submit} loading={save.isPending} />
      </Card>

      <H3>Last 30 days</H3>
      {!logs?.length ? (
        <EmptyState
          title="Nothing logged yet"
          body="Skipping breakfast still counts as a day — log the total and move on."
        />
      ) : (
        <Card>
          {logs.map((log, i) => (
            <Row key={log.logged_on} style={{ justifyContent: 'space-between', paddingVertical: space.sm }}>
              <Body style={{ flex: 1 }}>{shortDate(log.logged_on)}</Body>
              <Label style={{ width: 90, textAlign: 'right' }}>{log.calories ?? '—'} kcal</Label>
              <Label
                style={{
                  width: 70,
                  textAlign: 'right',
                  color:
                    targets && (log.protein_g ?? 0) >= targets.proteinG ? colors.good : colors.textDim,
                }}
              >
                {log.protein_g ?? '—'} g
              </Label>
            </Row>
          ))}
        </Card>
      )}
    </Screen>
  );
}

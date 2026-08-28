import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import { useProfile } from '@/api/profile';
import {
  lastSessionOfTemplate,
  useSaveStrengthSession,
  useStrengthSessions,
} from '@/api/strength';
import {
  Button,
  Caption,
  Card,
  Chip,
  Divider,
  Field,
  H3,
  Label,
  Row,
  Screen,
} from '@/components/ui';
import { CALF_KEYS, STRENGTH_TEMPLATES, type ExerciseSpec } from '@/data/plan';
import type { StrengthEntry, StrengthSet } from '@/lib/database.types';
import { todayISO } from '@/lib/format';
import { colors, radius, space, type } from '@/lib/theme';
import { toDisplay, toStorage, unitLabel, type UnitSystem } from '@/lib/units';

/** A set as the form holds it: strings, because that is what a keyboard gives. */
type DraftSet = { weight: string; reps: string; done: boolean };
type DraftExercise = { spec: ExerciseSpec; sets: DraftSet[] };

export default function LogStrength() {
  const router = useRouter();
  const { userId } = useAuthSession();
  const { data: profile } = useProfile(userId);
  const { data: sessions } = useStrengthSessions(userId);
  const save = useSaveStrengthSession(userId);

  const units: UnitSystem = profile?.unit_system ?? 'metric';

  // Default to the template you have done least recently — the app should not
  // make you remember whether you are due A, B or C.
  const suggested = useMemo(() => suggestTemplate(sessions), [sessions]);
  const [templateKey, setTemplateKey] = useState(suggested);
  const template = STRENGTH_TEMPLATES.find((t) => t.key === templateKey)!;

  const previous = lastSessionOfTemplate(sessions, templateKey);

  const [draft, setDraft] = useState<DraftExercise[]>(() =>
    buildDraft(template.exercises, previous?.exercises, units),
  );
  const [pain, setPain] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [durationMin, setDurationMin] = useState('30');

  const switchTemplate = (key: string) => {
    const next = STRENGTH_TEMPLATES.find((t) => t.key === key)!;
    const prev = lastSessionOfTemplate(sessions, key);
    setTemplateKey(key);
    setDraft(buildDraft(next.exercises, prev?.exercises, units));
  };

  const update = (exIndex: number, setIndex: number, patch: Partial<DraftSet>) => {
    setDraft((current) =>
      current.map((ex, i) =>
        i !== exIndex
          ? ex
          : { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) },
      ),
    );
  };

  const confirmSet = (exIndex: number, setIndex: number) => {
    const set = draft[exIndex].sets[setIndex];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    update(exIndex, setIndex, { done: !set.done });
  };

  const addSet = (exIndex: number) => {
    setDraft((current) =>
      current.map((ex, i) => {
        if (i !== exIndex) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, { ...last, done: false }] };
      }),
    );
  };

  const removeSet = (exIndex: number) => {
    setDraft((current) =>
      current.map((ex, i) =>
        i !== exIndex || ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.slice(0, -1) },
      ),
    );
  };

  const completedCount = draft.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0);

  const submit = async () => {
    const exercises: StrengthEntry[] = draft
      .map((ex) => ({
        key: ex.spec.key,
        name: ex.spec.name,
        sets: ex.sets
          .filter((s) => s.done && Number(s.reps) > 0)
          .map<StrengthSet>((s) => ({
            weight_kg: s.weight ? (toStorage(Number(s.weight), units) ?? null) : null,
            reps: Number(s.reps),
          })),
      }))
      .filter((ex) => ex.sets.length > 0);

    if (exercises.length === 0) {
      Alert.alert('Nothing ticked off', 'Tap a set to mark it done, then save.');
      return;
    }

    const missingCalves = !exercises.some((ex) => CALF_KEYS.includes(ex.key));
    if (missingCalves) {
      const proceed = await new Promise<boolean>((resolve) =>
        Alert.alert(
          'No calf raises logged',
          'Every session in this plan carries the Achilles work. Save anyway?',
          [
            { text: 'Go back', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Save anyway', onPress: () => resolve(true) },
          ],
        ),
      );
      if (!proceed) return;
    }

    try {
      await save.mutateAsync({
        performed_on: todayISO(),
        template_key: templateKey,
        exercises,
        duration_min: Number(durationMin) || null,
        achilles_pain: pain,
        notes: notes.trim() || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <Screen>
      <Row style={{ flexWrap: 'wrap' }}>
        {STRENGTH_TEMPLATES.map((t) => (
          <Chip
            key={t.key}
            label={t.name}
            selected={t.key === templateKey}
            onPress={() => switchTemplate(t.key)}
          />
        ))}
      </Row>
      <Caption>{template.focus}</Caption>
      {previous ? (
        <Caption>Pre-filled from your last {template.name} on {previous.performed_on}. Adjust what changed.</Caption>
      ) : (
        <Caption>First time through {template.name} — put in what you lift and it becomes the baseline.</Caption>
      )}

      {draft.map((ex, exIndex) => {
        const isCalf = CALF_KEYS.includes(ex.spec.key);
        return (
          <Card key={ex.spec.key} accent={isCalf ? colors.good : undefined}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <H3>{ex.spec.name}</H3>
                <Caption>
                  {ex.spec.sets} × {ex.spec.repRange}
                  {isCalf ? '  ·  Achilles work' : ''}
                </Caption>
              </View>
            </Row>
            <Caption style={{ marginTop: space.xs }}>{ex.spec.cue}</Caption>

            <Divider />

            <Row style={{ paddingHorizontal: space.xs }}>
              <Label style={{ width: 28 }}>Set</Label>
              <Label style={{ flex: 1 }}>{unitLabel(units)}</Label>
              <Label style={{ flex: 1 }}>Reps</Label>
              <Label style={{ width: 44, textAlign: 'right' }}>Done</Label>
            </Row>

            {ex.sets.map((set, setIndex) => (
              <Row key={setIndex} style={{ marginTop: space.sm }}>
                <Text style={[type.label, { width: 28 }]}>{setIndex + 1}</Text>
                <SetInput
                  value={set.weight}
                  onChangeText={(v) => update(exIndex, setIndex, { weight: v })}
                  placeholder="—"
                />
                <SetInput
                  value={set.reps}
                  onChangeText={(v) => update(exIndex, setIndex, { reps: v })}
                  placeholder="—"
                />
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: set.done }}
                  accessibilityLabel={`Set ${setIndex + 1} of ${ex.spec.name}`}
                  onPress={() => confirmSet(exIndex, setIndex)}
                  hitSlop={8}
                  style={[styles.check, set.done && styles.checkDone]}
                >
                  <Text style={[styles.checkMark, set.done && { color: colors.bg }]}>
                    {set.done ? '✓' : ''}
                  </Text>
                </Pressable>
              </Row>
            ))}

            <Row style={{ marginTop: space.md }}>
              <Button title="Add set" variant="ghost" onPress={() => addSet(exIndex)} style={{ flex: 1 }} />
              <Button title="Remove set" variant="ghost" onPress={() => removeSet(exIndex)} style={{ flex: 1 }} />
            </Row>
          </Card>
        );
      })}

      <Card style={{ gap: space.md }}>
        <H3>How did the Achilles feel?</H3>
        <Row style={{ flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <Chip
              key={n}
              label={String(n)}
              selected={pain === n}
              color={n >= 4 ? colors.warn : colors.good}
              onPress={() => setPain(pain === n ? null : n)}
            />
          ))}
        </Row>
        <Caption>0 is nothing at all, 10 is the worst it has been. Optional, but it is the number that tells you when to hold load steady.</Caption>

        <Field
          label="Session length"
          value={durationMin}
          onChangeText={setDurationMin}
          keyboardType="number-pad"
          suffix="min"
        />
        <Field
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything worth remembering next time"
          multiline
        />
      </Card>

      <Button
        title={completedCount ? `Save session (${completedCount} sets)` : 'Save session'}
        onPress={submit}
        loading={save.isPending}
      />
    </Screen>
  );
}

function SetInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ flex: 1, paddingRight: space.sm }}>
      <Field value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType="decimal-pad" />
    </View>
  );
}

/** Rotate A → B → C, defaulting to whichever is furthest back. */
function suggestTemplate(sessions: ReturnType<typeof useStrengthSessions>['data']) {
  if (!sessions?.length) return STRENGTH_TEMPLATES[0].key;
  const lastDone = sessions[0].template_key;
  const order = STRENGTH_TEMPLATES.map((t) => t.key);
  const idx = order.indexOf(lastDone ?? '');
  return idx === -1 ? order[0] : order[(idx + 1) % order.length];
}

/**
 * Pre-fills every set with what you did last time, so a normal session is a few
 * taps rather than a form to fill in. Nothing is marked done — confirming each
 * set is the act of logging it.
 */
function buildDraft(
  specs: ExerciseSpec[],
  previous: StrengthEntry[] | undefined,
  units: UnitSystem,
): DraftExercise[] {
  return specs.map((spec) => {
    const prior = previous?.find((e) => e.key === spec.key);
    const sets: DraftSet[] = Array.from({ length: spec.sets }, (_, i) => {
      const priorSet = prior?.sets[i] ?? prior?.sets[prior.sets.length - 1];
      const displayWeight = toDisplay(priorSet?.weight_kg ?? null, units);
      return {
        weight: displayWeight != null ? trimNumber(displayWeight) : '',
        reps: priorSet?.reps ? String(priorSet.reps) : '',
        done: false,
      };
    });
    return { spec, sets };
  });
}

const trimNumber = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const styles = StyleSheet.create({
  check: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.good, borderColor: colors.good },
  checkMark: { fontSize: 20, fontWeight: '700', color: colors.text },
});

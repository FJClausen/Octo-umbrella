import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { signOut, useAuthSession } from '@/api/auth';
import { useProfile, useUpdateProfile } from '@/api/profile';
import { Body, Button, Caption, Card, Chip, Field, H3, Loading, Row, Screen } from '@/components/ui';
import { space } from '@/lib/theme';
import { toDisplay, toStorage, unitLabel, type UnitSystem } from '@/lib/units';

const numOrNull = (s: string) => {
  const v = Number(s.replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : null;
};

export default function Settings() {
  const router = useRouter();
  const { userId } = useAuthSession();
  const { data: profile, isPending } = useProfile(userId);
  const update = useUpdateProfile(userId);

  const [units, setUnits] = useState<UnitSystem>('metric');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [ftp, setFtp] = useState('');
  const [rate, setRate] = useState('');
  const [protein, setProtein] = useState('');
  const [photoDays, setPhotoDays] = useState('');

  // Seed the form once the profile arrives.
  useEffect(() => {
    if (!profile) return;
    setUnits(profile.unit_system);
    setName(profile.display_name ?? '');
    setDob(profile.dob ?? '');
    setHeight(profile.height_cm ? String(profile.height_cm) : '');
    setGoal(
      profile.goal_weight_kg
        ? String(Number(toDisplay(profile.goal_weight_kg, profile.unit_system)!.toFixed(1)))
        : '',
    );
    setFtp(profile.ftp_watts ? String(profile.ftp_watts) : '');
    setRate(String(profile.weekly_loss_target_kg));
    setProtein(String(profile.protein_g_per_kg));
    setPhotoDays(String(profile.photo_analysis_days));
  }, [profile]);

  if (isPending || !profile) return <Screen><Loading /></Screen>;

  const submit = async () => {
    try {
      await update.mutateAsync({
        display_name: name.trim() || null,
        dob: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : null,
        height_cm: numOrNull(height),
        goal_weight_kg: toStorage(numOrNull(goal), units),
        ftp_watts: numOrNull(ftp),
        weekly_loss_target_kg: numOrNull(rate) ?? 0.45,
        protein_g_per_kg: numOrNull(protein) ?? 2.0,
        photo_analysis_days: Math.round(numOrNull(photoDays) ?? 30),
        unit_system: units,
      });
      Alert.alert('Saved');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <Screen>
      <Card style={{ gap: space.md }}>
        <H3>You</H3>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />
        <Caption>Age feeds the calorie estimate — without it, Fuel cannot show targets.</Caption>
        <Field label="Height" value={height} onChangeText={setHeight} keyboardType="decimal-pad" suffix="cm" />

        <View>
          <Body style={{ marginBottom: space.sm }}>Units</Body>
          <Row>
            <Chip label="Kilograms" selected={units === 'metric'} onPress={() => setUnits('metric')} />
            <Chip label="Pounds" selected={units === 'imperial'} onPress={() => setUnits('imperial')} />
          </Row>
          <Caption style={{ marginTop: space.sm }}>
            Everything is stored in kilograms; this only changes what you see and type.
          </Caption>
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <H3>Goals</H3>
        <Field
          label="Goal weight"
          value={goal}
          onChangeText={setGoal}
          keyboardType="decimal-pad"
          suffix={unitLabel(units)}
        />
        <Field
          label="Target rate of loss"
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          suffix="kg/wk"
        />
        <Caption>
          0.4–0.5 kg a week is the range that holds onto lean mass. Push it much past that and the
          lifting starts paying for it.
        </Caption>
        <Field
          label="Protein"
          value={protein}
          onChangeText={setProtein}
          keyboardType="decimal-pad"
          suffix="g/kg"
        />
        <Caption>1.8–2.2 g/kg is the useful band while in a deficit.</Caption>
        <Field label="FTP" value={ftp} onChangeText={setFtp} keyboardType="number-pad" suffix="W" />
      </Card>

      <Card style={{ gap: space.md }}>
        <H3>Photo analysis</H3>
        <Field
          label="Run at most every"
          value={photoDays}
          onChangeText={setPhotoDays}
          keyboardType="number-pad"
          suffix="days"
        />
        <Caption>
          Monthly is the sensible default — visible change needs time, and more frequent reads
          mostly measure the lighting.
        </Caption>
      </Card>

      <Button title="Save" onPress={submit} loading={update.isPending} />

      <Button
        title="Sign out"
        variant="danger"
        onPress={async () => {
          await signOut();
          router.replace('/');
        }}
      />
    </Screen>
  );
}

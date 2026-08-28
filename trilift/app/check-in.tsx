import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import { uploadProgressPhoto, useBodyLogs, useSaveBodyLog } from '@/api/body';
import { useProfile } from '@/api/profile';
import { Body, Button, Caption, Card, Field, H3, Screen } from '@/components/ui';
import type { Measurements } from '@/lib/database.types';
import { todayISO } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import { toStorage, unitLabel } from '@/lib/units';

const num = (s: string) => {
  const v = Number(s.replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : null;
};

export default function CheckIn() {
  const router = useRouter();
  const { userId } = useAuthSession();
  const { data: profile } = useProfile(userId);
  const { data: logs } = useBodyLogs(userId);
  const save = useSaveBodyLog(userId);

  const units = profile?.unit_system ?? 'metric';
  const today = todayISO();
  const existing = logs?.find((l) => l.logged_on === today);

  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [thigh, setThigh] = useState('');
  const [arm, setArm] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickPhoto = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'TriLift needs access to attach a progress photo.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const submit = async () => {
    const weightIn = num(weight);
    if (!weightIn && !photoUri) {
      Alert.alert('Nothing to save', 'Add a weight or a photo.');
      return;
    }

    setBusy(true);
    try {
      let photoPath = existing?.photo_path ?? null;
      if (photoUri && userId) photoPath = await uploadProgressPhoto(userId, photoUri);

      const measurements: Measurements = {};
      if (num(waist)) measurements.waist_cm = num(waist)!;
      if (num(chest)) measurements.chest_cm = num(chest)!;
      if (num(thigh)) measurements.thigh_cm = num(thigh)!;
      if (num(arm)) measurements.arm_cm = num(arm)!;

      await save.mutateAsync({
        logged_on: today,
        weight_kg: weightIn ? toStorage(weightIn, units) : (existing?.weight_kg ?? null),
        photo_path: photoPath,
        measurements,
        notes: notes.trim() || null,
      });

      router.back();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      {existing ? (
        <Caption>
          You already checked in today. Saving again updates that entry rather than adding a second
          one.
        </Caption>
      ) : (
        <Caption>
          Weigh in at the same time of day — first thing, before eating, is the most repeatable.
        </Caption>
      )}

      <Card style={{ gap: space.md }}>
        <Field
          label="Weight"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          suffix={unitLabel(units)}
          placeholder={existing?.weight_kg ? String(existing.weight_kg) : ''}
        />
      </Card>

      <Card style={{ gap: space.md }}>
        <H3>Progress photo</H3>
        <Body style={{ color: colors.textDim }}>
          Same spot, same light, same pose. Consistency is what makes the comparison mean anything.
        </Body>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ height: 260, borderRadius: radius.md }}
            resizeMode="cover"
          />
        ) : null}
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button title="Take photo" variant="secondary" onPress={() => pickPhoto(true)} style={{ flex: 1 }} />
          <Button title="Choose" variant="secondary" onPress={() => pickPhoto(false)} style={{ flex: 1 }} />
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <H3>Measurements (optional)</H3>
        <Caption>
          Tape beats the scale for body recomposition — the waist can shrink on a week the scale
          does not move.
        </Caption>
        <Field label="Waist" value={waist} onChangeText={setWaist} keyboardType="decimal-pad" suffix="cm" />
        <Field label="Chest" value={chest} onChangeText={setChest} keyboardType="decimal-pad" suffix="cm" />
        <Field label="Thigh" value={thigh} onChangeText={setThigh} keyboardType="decimal-pad" suffix="cm" />
        <Field label="Arm" value={arm} onChangeText={setArm} keyboardType="decimal-pad" suffix="cm" />
      </Card>

      <Card>
        <Field
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Sleep, travel, a heavy week — context for future you"
          multiline
        />
      </Card>

      <Button title="Save check-in" onPress={submit} loading={busy} />
    </Screen>
  );
}

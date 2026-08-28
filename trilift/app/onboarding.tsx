import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, View } from 'react-native';

import { useAuthSession } from '@/api/auth';
import { uploadProgressPhoto, useSaveBodyLog } from '@/api/body';
import { useUpdateProfile } from '@/api/profile';
import { Body, Button, Caption, Card, Chip, Field, H1, H3, Row, Screen } from '@/components/ui';
import { todayISO } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import { toStorage, unitLabel, type UnitSystem } from '@/lib/units';

const num = (s: string) => {
  const v = Number(s.replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : null;
};

export default function Onboarding() {
  const router = useRouter();
  const { userId } = useAuthSession();
  const updateProfile = useUpdateProfile(userId);
  const saveBodyLog = useSaveBodyLog(userId);

  const [units, setUnits] = useState<UnitSystem>('metric');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [ftp, setFtp] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to attach a starting photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const finish = async () => {
    const heightCm = num(height);
    const weightIn = num(weight);
    const goalIn = num(goal);

    if (!heightCm || !weightIn || !goalIn) {
      Alert.alert('A few numbers first', 'Height, current weight and goal weight get the plan started.');
      return;
    }

    const weightKg = toStorage(weightIn, units)!;
    const goalKg = toStorage(goalIn, units)!;

    if (goalKg > weightKg) {
      // Gaining is a legitimate goal — just make sure it was deliberate.
      const proceed = await new Promise<boolean>((resolve) =>
        Alert.alert('Goal is above current weight', 'Is that intentional?', [
          { text: 'Let me fix it', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Yes, keep it', onPress: () => resolve(true) },
        ]),
      );
      if (!proceed) return;
    }

    setBusy(true);
    try {
      let photoPath: string | null = null;
      if (photoUri && userId) photoPath = await uploadProgressPhoto(userId, photoUri);

      await updateProfile.mutateAsync({
        display_name: name.trim() || null,
        dob: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : null,
        height_cm: heightCm,
        start_weight_kg: weightKg,
        goal_weight_kg: goalKg,
        ftp_watts: num(ftp) ?? null,
        unit_system: units,
        onboarded_at: new Date().toISOString(),
      });

      await saveBodyLog.mutateAsync({
        logged_on: todayISO(),
        weight_kg: weightKg,
        photo_path: photoPath,
      });

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ height: space.lg }} />
      <H1>Set the baseline</H1>
      <Body style={{ color: colors.textDim }}>
        Five numbers now, and every screen after this has something to say.
      </Body>

      <Card style={{ gap: space.md }}>
        <View>
          <Body style={{ marginBottom: space.sm }}>Units</Body>
          <Row>
            <Chip label="Kilograms" selected={units === 'metric'} onPress={() => setUnits('metric')} />
            <Chip label="Pounds" selected={units === 'imperial'} onPress={() => setUnits('imperial')} />
          </Row>
        </View>

        <Field label="Name (optional)" value={name} onChangeText={setName} placeholder="What should the app call you?" />
        <Field
          label="Date of birth (optional)"
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
        />
        <Field label="Height" value={height} onChangeText={setHeight} keyboardType="decimal-pad" suffix="cm" />
        <Field
          label="Current weight"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          suffix={unitLabel(units)}
        />
        <Field
          label="Goal weight"
          value={goal}
          onChangeText={setGoal}
          keyboardType="decimal-pad"
          suffix={unitLabel(units)}
        />
        <Field
          label="FTP (optional)"
          value={ftp}
          onChangeText={setFtp}
          keyboardType="number-pad"
          suffix="W"
        />
        <Caption>
          FTP drives the power targets on the interval ride. Leave it blank if you do not know it.
        </Caption>
      </Card>

      <Card style={{ gap: space.md }}>
        <H3>Starting photo (optional)</H3>
        <Body style={{ color: colors.textDim }}>
          A before shot to compare against later. Stored privately in your own Supabase project.
        </Body>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ height: 220, borderRadius: 12 }} resizeMode="cover" />
        ) : null}
        <Button title={photoUri ? 'Choose a different photo' : 'Add a photo'} variant="secondary" onPress={pickPhoto} />
      </Card>

      <Button title="Start" onPress={finish} loading={busy} />
    </Screen>
  );
}

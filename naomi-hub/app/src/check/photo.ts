import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Opens the camera; returns a ~1600px JPEG as base64, or null if she cancelled. */
export async function takeSheetPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('camera-denied');
  const shot = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 1 });
  if (shot.canceled || !shot.assets[0]) return null;
  const asset = shot.assets[0];
  const longSide = Math.max(asset.width, asset.height);
  let context = ImageManipulator.manipulate(asset.uri);
  if (longSide > 1600) {
    context = context.resize(asset.width >= asset.height ? { width: 1600 } : { height: 1600 });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ base64: true, compress: 0.75, format: SaveFormat.JPEG });
  if (!saved.base64) throw new Error('no-image-data');
  return saved.base64;
}

/** Row lengths the API should expect for a spec. */
export function expectedRows(spec: import('./types').CheckSpec): number[] {
  switch (spec.type) {
    case 'grid':
      return spec.solution.map((r) => r.length);
    case 'logic':
      return spec.categories.map(() => spec.people.length + 1);
    case 'chess':
      return spec.puzzles.map(() => 1);
  }
}

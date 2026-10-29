import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

const DIR = 'photos';

function photoDir(): Directory {
  const dir = new Directory(Paths.document, DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Opens the camera and keeps the shot in the app's documents folder, so it survives
 * restarts (the camera's own file is a temporary cache). Returns null if cancelled.
 */
export async function takeKeptPhoto(prefix: string): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('camera-denied');
  const shot = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
  if (shot.canceled || !shot.assets[0]) return null;
  const source = new File(shot.assets[0].uri);
  const target = new File(photoDir(), `${prefix}-${Date.now()}.jpg`);
  source.copy(target);
  return target.uri;
}

export function deletePhoto(uri: string): void {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Already gone.
  }
}

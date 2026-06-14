import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@cherish_device_id';

let cachedId: string | null = null;

function generateId(): string {
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += Math.floor(Math.random() * 16).toString(16);
  }
  return id;
}

// Returns a persistent, anonymous, random identifier for this install.
// Generated once and cached in AsyncStorage thereafter. Contains no PII and
// cannot be linked to a person - it's a stable bucket so the server can
// recognize repeat visits for funnel/retention analysis.
export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cachedId = stored;
    return stored;
  }

  const id = generateId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  cachedId = id;
  return id;
}

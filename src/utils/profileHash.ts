import { useTasteProfileStore } from '../stores/useTasteProfileStore';
import type { TasteProfile } from '../types/tasteProfile';

// Deterministic, privacy-preserving hash of a taste profile. Many different
// devices with the same taste combination produce the SAME hash, so the
// server can aggregate anonymous behavior by "taste segment" without ever
// identifying an individual device or user.
export function computeProfileHash(profile: TasteProfile): string {
  const parts = [
    (profile.styleArchetypes ?? []).slice().sort().join(','),
    (profile.colorPalette ?? []).slice().sort().join(','),
    profile.metalPreference ?? '',
    profile.loveLanguage ?? '',
  ].join('|');

  // Fast string hash (FNV-1a variant) - good enough for bucketing,
  // not cryptographic. Empty profile hashes to its own bucket too.
  let hash = 0x811c9dc5;
  for (let i = 0; i < parts.length; i++) {
    hash ^= parts.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Convenience hook: current device's taste-segment hash.
export function useProfileHash(): string {
  const { tasteProfile } = useTasteProfileStore();
  return computeProfileHash(tasteProfile);
}

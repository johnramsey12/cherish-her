// Re-ranks products based on the user's saved Taste Profile (style
// archetypes, color palette, metal preference). Used on the default browse
// view - search relevance and explicit filter chips already narrow the set;
// this only reorders within whatever set is being shown.

import type { TasteProfile, StyleArchetype, ColorPalette, MetalPreference } from '../types/tasteProfile';

export interface PersonalizableProduct {
  styleTags?: string[];
}

// Ranked style picks (1st/2nd/3rd from the survey) get decreasing weight.
const STYLE_RANK_WEIGHTS = [12, 9, 6];
const COLOR_BOOST = 8;
const METAL_BOOST = 6;

export function personalizationScore(p: PersonalizableProduct, profile: TasteProfile): number {
  const tags = p.styleTags ?? [];
  let score = 0;

  (profile.styleArchetypes ?? []).forEach((archetype: StyleArchetype, idx: number) => {
    if (tags.includes(archetype)) {
      score += STYLE_RANK_WEIGHTS[idx] ?? STYLE_RANK_WEIGHTS[STYLE_RANK_WEIGHTS.length - 1];
    }
  });

  (profile.colorPalette ?? []).forEach((palette: ColorPalette) => {
    if (tags.includes(palette)) score += COLOR_BOOST;
  });

  const metal = profile.metalPreference as MetalPreference | undefined;
  if (metal && metal !== 'unsure' && metal !== 'mixed' && tags.includes(metal)) {
    score += METAL_BOOST;
  }

  return score;
}

// Stable re-sort: higher-scoring products move up; equally-scored products
// (including all-zero, when there's no profile match) keep their existing
// relative order - e.g. the server's popularity/price sort.
export function applyPersonalization<T extends PersonalizableProduct>(
  products: T[],
  profile: TasteProfile
): T[] {
  const hasProfile =
    (profile.styleArchetypes?.length ?? 0) > 0 ||
    (profile.colorPalette?.length ?? 0) > 0 ||
    (profile.metalPreference && profile.metalPreference !== 'unsure');

  if (!hasProfile) return products;

  return products
    .map((p, index) => ({ item: p, score: personalizationScore(p, profile), index }))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((s) => s.item);
}

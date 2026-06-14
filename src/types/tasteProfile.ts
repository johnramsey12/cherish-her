// === Style Archetypes ===
export type StyleArchetype =
  | 'classic' | 'romantic' | 'boho' | 'edgy' | 'glam'
  | 'minimalist' | 'preppy' | 'active' | 'trendy' | 'eclectic';

export interface StyleArchetypeOption {
  value: StyleArchetype;
  label: string;
  description: string;
  emoji: string;
}

export const STYLE_ARCHETYPES: StyleArchetypeOption[] = [
  { value: 'classic',    label: 'Classic',    description: 'Timeless, tailored pieces that never go out of style', emoji: '🤍' },
  { value: 'romantic',   label: 'Romantic',   description: 'Soft fabrics, florals, and feminine details',          emoji: '🌸' },
  { value: 'boho',       label: 'Boho',       description: 'Flowy, earthy, and free-spirited',                     emoji: '🌾' },
  { value: 'edgy',       label: 'Edgy',       description: 'Leather, dark tones, bold silhouettes',                emoji: '🖤' },
  { value: 'glam',       label: 'Glam',       description: 'Sparkle and statement pieces',                         emoji: '✨' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean lines, neutral palette',                         emoji: '◽' },
  { value: 'preppy',     label: 'Preppy',     description: 'Polished and collegiate-coastal',                      emoji: '⚓' },
  { value: 'active',     label: 'Active',     description: 'Performance fabrics, always on the move',              emoji: '🏃' },
  { value: 'trendy',     label: 'Trendy',     description: "Loves whats new right now",                            emoji: '🔥' },
  { value: 'eclectic',   label: 'Eclectic',   description: 'Mixes patterns, eras, one-of-a-kind pieces',           emoji: '🎨' },
];

// === Color Palettes ===
export type ColorPalette =
  | 'neutrals' | 'earth_tones' | 'jewel_tones' | 'pastels' | 'bold_bright' | 'monochrome';

export interface ColorPaletteOption {
  value: ColorPalette;
  label: string;
  swatches: string[];
}

export const COLOR_PALETTES: ColorPaletteOption[] = [
  { value: 'neutrals',    label: 'Neutrals',     swatches: ['#1a1a1a', '#8a8a8a', '#e8e2d8', '#5c4a3a'] },
  { value: 'earth_tones', label: 'Earth Tones',  swatches: ['#7c6a4f', '#a4623a', '#5e6e4f', '#c4915a'] },
  { value: 'jewel_tones', label: 'Jewel Tones',  swatches: ['#0f5c4a', '#1e3a6e', '#6e1e3a', '#4a1e6e'] },
  { value: 'pastels',     label: 'Pastels',      swatches: ['#f4d4dc', '#dce4f4', '#e4dcf4', '#f4ecd4'] },
  { value: 'bold_bright', label: 'Bold & Bright',swatches: ['#e0263e', '#2563eb', '#e8b400', '#16a34a'] },
  { value: 'monochrome',  label: 'Monochrome',   swatches: ['#0a0a0a', '#404040', '#a0a0a0', '#ffffff'] },
];

// === Metal Preference ===
export type MetalPreference = 'gold' | 'silver' | 'rose_gold' | 'mixed' | 'unsure';

export interface MetalPreferenceOption {
  value: MetalPreference;
  label: string;
  swatch: string;
}

export const METAL_PREFERENCES: MetalPreferenceOption[] = [
  { value: 'gold',      label: 'Gold',          swatch: '#D4AF37' },
  { value: 'silver',    label: 'Silver',        swatch: '#C0C0C0' },
  { value: 'rose_gold', label: 'Rose Gold',     swatch: '#E0BFB8' },
  { value: 'mixed',     label: 'Mixed Metals',  swatch: '#B8A88A' },
  { value: 'unsure',    label: 'Not Sure',      swatch: '#888888' },
];

// === Love Language ===
export type LoveLanguage = 'gifts' | 'quality_time' | 'words' | 'acts_of_service' | 'physical_touch';

export interface LoveLanguageOption {
  value: LoveLanguage;
  label: string;
  description: string;
  emoji: string;
}

export const LOVE_LANGUAGES: LoveLanguageOption[] = [
  { value: 'gifts',          label: 'Receiving Gifts',      description: 'A thoughtful item shows she was on your mind',      emoji: '🎁' },
  { value: 'quality_time',   label: 'Quality Time',         description: 'Shared experiences mean more than objects',         emoji: '⏳' },
  { value: 'words',          label: 'Words of Affirmation', description: 'A heartfelt note or message hits hardest',          emoji: '💌' },
  { value: 'acts_of_service',label: 'Acts of Service',      description: 'Doing something helpful speaks louder than a gift', emoji: '🤝' },
  { value: 'physical_touch', label: 'Physical Touch',       description: 'Closeness and affection matter most',                emoji: '🤍' },
];

// === Full Taste Profile ===
export interface TasteProfile {
  styleArchetypes?: StyleArchetype[];
  colorPalette?: ColorPalette[];
  metalPreference?: MetalPreference;
  loveLanguage?: LoveLanguage;

  colorsToAvoid?: ColorPalette[];
  fabricPreferences?: string[];
  materialsToAvoid?: string[];
  sizeTop?: string;
  sizeBottom?: string;
  sizeDress?: string;
  sizeShoe?: string;
  sizeRing?: string;
  favoriteBrands?: string[];
  luxuryComfort?: 'practical' | 'mixed' | 'go_big' | 'occasion_dependent';
}

import { Platform } from 'react-native';

// ─────────────────────────────────────────────
//  COLOR PALETTE  — Luxury Dark Romance
// ─────────────────────────────────────────────
export const colors = {
  // Backgrounds
  background: '#0D0C0D',
  backgroundSecondary: '#141214',
  surface: '#1C1A1C',
  surfaceElevated: '#252225',
  surfaceHigh: '#2E2B2E',

  // Primary — Rose Gold
  primary: '#C8956A',
  primaryLight: '#E0B48E',
  primaryDark: '#A0724A',
  primaryMuted: 'rgba(200, 149, 106, 0.15)',

  // Rose accent
  rose: '#8B3A52',
  roseLight: '#B05570',
  roseDark: '#6B2A3A',
  roseMuted: 'rgba(139, 58, 82, 0.15)',

  // Gold fleck
  gold: '#D4AF6B',
  goldLight: '#E8CC92',

  // Text
  textPrimary: '#FAF8F5',
  textSecondary: '#A89E98',
  textTertiary: '#6E6469',
  textInverse: '#0D0C0D',

  // Utility
  success: '#5DBB7A',
  successMuted: 'rgba(93, 187, 122, 0.15)',
  warning: '#E5A84A',
  warningMuted: 'rgba(229, 168, 74, 0.15)',
  error: '#D05555',
  errorMuted: 'rgba(208, 85, 85, 0.15)',

  // Borders
  border: '#2C282C',
  borderLight: '#3A363A',
  borderFocus: '#C8956A',

  // Tab bar
  tabBar: '#111011',
  tabBarBorder: '#1E1C1E',
  tabActive: '#C8956A',
  tabInactive: '#5C5459',

  // Cards
  cardBackground: '#1C1A1C',
  cardBorder: 'rgba(200, 149, 106, 0.12)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.45)',

  // Discovery tags
  discoveryTrending: '#E5A84A',
  discoveryHidden: '#5DBB7A',
  discoveryLuxury: '#D4AF6B',
  discoveryBudget: '#6AB4D4',
  discoverySeasonal: '#C87FD0',
};

// ─────────────────────────────────────────────
//  TYPOGRAPHY
// ─────────────────────────────────────────────
export const typography = {
  fonts: {
    heading: 'CormorantGaramond_600SemiBold',
    headingLight: 'CormorantGaramond_300Light',
    headingItalic: 'CormorantGaramond_400Regular_Italic',
    body: 'Outfit_400Regular',
    bodyMedium: 'Outfit_500Medium',
    bodySemiBold: 'Outfit_600SemiBold',
    bodyLight: 'Outfit_300Light',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
    '5xl': 52,
  },
  lineHeights: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.65,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.2,
    widest: 2.0,
  },
};

// ─────────────────────────────────────────────
//  SPACING
// ─────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ─────────────────────────────────────────────
//  RADIUS
// ─────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 10,
  base: 14,
  lg: 18,
  xl: 24,
  '2xl': 32,
  full: 999,
};

// ─────────────────────────────────────────────
//  SHADOWS
// ─────────────────────────────────────────────
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
  }),
  gold: Platform.select({
    ios: {
      shadowColor: '#C8956A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
};

// ─────────────────────────────────────────────
//  GRADIENTS (arrays for use with LinearGradient if needed)
// ─────────────────────────────────────────────
export const gradients = {
  primary: ['#C8956A', '#A0724A'],
  rose: ['#8B3A52', '#6B2A3A'],
  surface: ['#1C1A1C', '#141214'],
  gold: ['#D4AF6B', '#C8956A'],
  dark: ['#0D0C0D', '#1C1A1C'],
  heroOverlay: ['rgba(13,12,13,0)', 'rgba(13,12,13,0.75)', 'rgba(13,12,13,0.98)'],
};

// ─────────────────────────────────────────────
//  PRICE RANGE LABELS
// ─────────────────────────────────────────────
export const priceRangeLabels: Record<string, string> = {
  budget: '$ Under $50',
  moderate: '$$ $50–$150',
  premium: '$$$ $150–$500',
  luxury: '$$$$ $500+',
};

export const priceRangeColors: Record<string, string> = {
  budget: colors.discoveryBudget,
  moderate: colors.success,
  premium: colors.primary,
  luxury: colors.gold,
};

// ─────────────────────────────────────────────
//  OCCASION LABELS
// ─────────────────────────────────────────────
export const occasionLabels: Record<string, string> = {
  birthday: '🎂 Birthday',
  anniversary: '💕 Anniversary',
  christmas: '🎄 Christmas',
  valentines: '❤️ Valentine\'s Day',
  mothers_day: '🌹 Mother\'s Day',
  graduation: '🎓 Graduation',
  wedding: '💍 Wedding',
  just_because: '✨ Just Because',
  apology: '🌸 Apology',
  custom: '🎁 Custom',
};

export const categoryLabels: Record<string, string> = {
  jewelry: '💎 Jewelry',
  skincare: '✨ Skincare',
  fashion: '👗 Fashion',
  books: '📚 Books',
  home_decor: '🏠 Home Décor',
  experiences: '🎭 Experiences',
  tech: '💻 Tech',
  fitness: '🏃 Fitness',
  food_drink: '🍷 Food & Drink',
  travel: '✈️ Travel',
  spa_wellness: '🧖 Spa & Wellness',
  art_craft: '🎨 Art & Craft',
  subscription: '📦 Subscription',
  flowers_plants: '🌸 Flowers & Plants',
  personalized: '✏️ Personalized',
};

import { Platform } from 'react-native';

// ─────────────────────────────────────────────
//  COLOR PALETTE  — Light Romance
// ─────────────────────────────────────────────
export const colors = {
  // Backgrounds
  background: '#FAF7FF',
  backgroundSecondary: '#FAF7FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHigh: '#FFFFFF',

  // Primary — Coral
  primary: '#E8604A',
  primaryLight: '#F07A65',
  primaryDark: '#C04030',
  primaryMuted: 'rgba(232, 96, 74, 0.12)',

  // Rose accent — Purple
  rose: '#7C4FA0',
  roseLight: '#9B6FBF',
  roseDark: '#5A3A80',
  roseMuted: 'rgba(124, 79, 160, 0.12)',

  // Gold fleck
  gold: '#F0A500',
  goldLight: '#F5C050',

  // Text
  textPrimary: '#1B2A4A',
  textSecondary: '#8A7A9B',
  textTertiary: '#A8A0B8',
  textInverse: '#FAF7FF',

  // Utility
  success: '#5DBB7A',
  successMuted: 'rgba(93, 187, 122, 0.15)',
  warning: '#E5A84A',
  warningMuted: 'rgba(229, 168, 74, 0.15)',
  error: '#D05555',
  errorMuted: 'rgba(208, 85, 85, 0.15)',

  // Borders
  border: '#E8E0F0',
  borderLight: '#F0EAF7',
  borderFocus: '#E8604A',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E0F0',
  tabActive: '#E8604A',
  tabInactive: '#8A7A9B',

  // Cards
  cardBackground: '#FFFFFF',
  cardBorder: 'rgba(232, 96, 74, 0.12)',

  // Overlays
  overlay: 'rgba(27, 42, 74, 0.75)',
  overlayLight: 'rgba(27, 42, 74, 0.45)',

  // Discovery tags
  discoveryTrending: '#E5A84A',
  discoveryHidden: '#5DBB7A',
  discoveryLuxury: '#F0A500',
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
      shadowColor: '#1B2A4A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#1B2A4A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#1B2A4A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
  }),
  gold: Platform.select({
    ios: {
      shadowColor: '#E8604A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
};

// ─────────────────────────────────────────────
//  GRADIENTS (arrays for use with LinearGradient if needed)
// ─────────────────────────────────────────────
export const gradients = {
  primary: ['#E8604A', '#C04030'],
  rose: ['#7C4FA0', '#5A3A80'],
  surface: ['#FFFFFF', '#FAF7FF'],
  gold: ['#F5C050', '#F0A500'],
  dark: ['#1B2A4A', '#2E4070'],
  heroOverlay: ['rgba(27,42,74,0)', 'rgba(27,42,74,0.75)', 'rgba(27,42,74,0.98)'],
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
